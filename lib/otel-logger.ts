interface LogRecord {
    timestamp: number;
    severityText: string;
    severityNumber: number;
    body: string;
    attributes: Record<string, any>;
}

// Store logs for middleware flush
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

function patchConsole() {
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

            // Add to buffer instead of emitting immediately
            logBuffer.push(logRecord);
        };
    });

    isPatched = true;
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

// Flush logs to OTEL
async function flushLogs(): Promise<void> {
    if (logBuffer.length === 0) {
        return;
    }

    const logsToSend = [...logBuffer];
    logBuffer = [];

    await sendLogsToOTEL(logsToSend);
}

// Initialize patching on server side only
if (typeof window === 'undefined') {
    patchConsole();
}

export { flushLogs, patchConsole }; 