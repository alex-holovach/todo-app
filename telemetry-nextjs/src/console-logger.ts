interface LogRecord {
    timestamp: number;
    severityText: string;
    severityNumber: number;
    body: string;
    attributes: Record<string, any>;
}

// Store logs for automatic flush
let logBuffer: LogRecord[] = [];

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
};

const consoleToSeverity = {
    log: 'INFO',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    debug: 'DEBUG',
} as const;

// Map severity text to OTEL severity numbers
function getSeverityNumber(severity: string): number {
    switch (severity) {
        case 'ERROR': return 17;
        case 'WARN': return 13;
        case 'INFO': return 9;
        case 'DEBUG': return 5;
        default: return 9;
    }
}

let isPatched = false;
let flushInterval: NodeJS.Timeout | null = null;

export function patchConsole(): void {
    // Prevent double patching
    if (isPatched) return;

    Object.entries(originalConsole).forEach(([method, originalFn]) => {
        console[method as keyof typeof originalConsole] = (...args: any[]) => {
            // Call original console method
            originalFn.apply(console, args);

            // Create OTEL log record
            const logRecord: LogRecord = {
                timestamp: Date.now() * 1_000_000, // Convert to nanoseconds
                severityText: consoleToSeverity[method as keyof typeof consoleToSeverity],
                severityNumber: getSeverityNumber(consoleToSeverity[method as keyof typeof consoleToSeverity]),
                body: args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                attributes: {
                    'log.type': method,
                    'service.name': 'nextjs-app',
                    'source': 'console',
                },
            };

            // Add to buffer for automatic flushing
            logBuffer.push(logRecord);
        };
    });

    isPatched = true;

    // Set up automatic periodic flushing (every 5 seconds)
    if (!flushInterval) {
        flushInterval = setInterval(() => {
            if (logBuffer.length > 0) {
                flushLogs().catch(() => {
                    // Silently handle flush errors
                });
            }
        }, 5000);
    }

    // Set up process exit handler to flush remaining logs (Node.js runtime only)
    // Skip in Edge Runtime where process.on is not available
    try {
        if (typeof process !== 'undefined' &&
            typeof process.on === 'function' &&
            typeof process.env !== 'undefined') {
            const exitHandler = () => {
                if (logBuffer.length > 0) {
                    // Synchronous flush on exit
                    flushLogsSync();
                }
            };

            process.on('exit', exitHandler);
            process.on('SIGINT', exitHandler);
            process.on('SIGTERM', exitHandler);
            process.on('uncaughtException', exitHandler);
        }
    } catch (error) {
        // Silently skip process handlers in Edge Runtime or other environments
        // where process.on is not available
    }
}

// Send logs to OTEL endpoint
async function sendLogsToOTEL(logs: LogRecord[]): Promise<void> {
    if (logs.length === 0) return;

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS;

    if (!endpoint) {
        return;
    }

    try {
        const otlpLogs = {
            resourceLogs: [
                {
                    resource: {
                        attributes: [
                            {
                                key: 'service.name',
                                value: { stringValue: 'nextjs-app' }
                            }
                        ]
                    },
                    scopeLogs: [
                        {
                            scope: { name: 'console-logger' },
                            logRecords: logs.map(log => ({
                                timeUnixNano: log.timestamp.toString(),
                                severityText: log.severityText,
                                severityNumber: log.severityNumber,
                                body: { stringValue: log.body },
                                attributes: Object.entries(log.attributes).map(([key, value]) => ({
                                    key,
                                    value: { stringValue: String(value) }
                                }))
                            }))
                        }
                    ]
                }
            ]
        };

        const response = await fetch(`${endpoint}/v1/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(headers ? { 'X-Kubiks-Key': headers.split('=')[1] || '' } : {}),
            },
            body: JSON.stringify(otlpLogs),
        });
    } catch (error) {
        // Silently fail to avoid disrupting application
    }
}

// Flush logs to OTEL (async version for middleware)
export async function flushLogs(): Promise<void> {
    if (logBuffer.length === 0) {
        return;
    }

    const logsToSend = [...logBuffer];
    logBuffer = [];

    await sendLogsToOTEL(logsToSend);
}

// Synchronous flush for process exit (best effort)
function flushLogsSync(): void {
    if (logBuffer.length === 0) {
        return;
    }

    const logs = [...logBuffer];
    logBuffer = [];

    // For process exit, we attempt a synchronous approach
    // This is a best-effort attempt and may not always succeed
    try {
        const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
        const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS;

        if (endpoint && logs.length > 0) {
            const otlpLogs = {
                resourceLogs: [
                    {
                        resource: {
                            attributes: [
                                {
                                    key: 'service.name',
                                    value: { stringValue: 'nextjs-app' }
                                }
                            ]
                        },
                        scopeLogs: [
                            {
                                scope: { name: 'console-logger' },
                                logRecords: logs.map(log => ({
                                    timeUnixNano: log.timestamp.toString(),
                                    severityText: log.severityText,
                                    severityNumber: log.severityNumber,
                                    body: { stringValue: log.body },
                                    attributes: Object.entries(log.attributes).map(([key, value]) => ({
                                        key,
                                        value: { stringValue: String(value) }
                                    }))
                                }))
                            }
                        ]
                    }
                ]
            };

            // Note: In a real-world scenario, you might want to use a synchronous HTTP library
            // or write to a local file as fallback for process exit scenarios
        }
    } catch (error) {
        // Silently fail on exit
    }
} 