import {
    LoggerProvider,
    BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";

// Simple HTTP Log Exporter
class SimpleOTLPLogExporter {
    private url: string;
    private headers: Record<string, string>;

    constructor(config: { url: string; headers?: Record<string, string> }) {
        this.url = config.url;
        this.headers = config.headers || {};
    }

    async export(logs: any[]): Promise<void> {
        if (logs.length === 0) return;

        const payload = {
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
                                timeUnixNano: (Date.now() * 1_000_000).toString(),
                                severityText: log.severityText,
                                body: { stringValue: log.body },
                                attributes: Object.entries(log.attributes || {}).map(([key, value]) => ({
                                    key,
                                    value: { stringValue: String(value) }
                                }))
                            }))
                        }
                    ]
                }
            ]
        };

        try {
            await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.headers,
                },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            // Silently handle errors
        }
    }

    async shutdown(): Promise<void> {
        // No-op for simple exporter
    }

    async forceFlush(): Promise<void> {
        // No-op for simple exporter
    }
}

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

// Initialize OpenTelemetry Logger
const exporter = new SimpleOTLPLogExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs` : "https://otlp.kubiks.ai/v1/logs",
    headers: {
        "X-Kubiks-Key": "UY1GhCfqfbuletNL8h2vtHihVvgBVcZyT6YhTVMjjws=",
    },
});

const provider = new LoggerProvider();
const processor = new BatchLogRecordProcessor(exporter as any);
(provider as any).addLogRecordProcessor(processor);

const logger = provider.getLogger("nextjs-app");

let isPatched = false;

export function patchConsole(): void {
    // Prevent double patching
    if (isPatched) return;

    Object.entries(originalConsole).forEach(([method, originalFn]) => {
        console[method as keyof typeof originalConsole] = (...args: any[]) => {
            // Call original console method first
            originalFn.apply(console, args);

            // Create log message
            const message = args
                .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
                .join(" ");

            // Send to OpenTelemetry
            logger.emit({
                body: message,
                severityText: consoleToSeverity[method as keyof typeof consoleToSeverity],
                attributes: {
                    source: "console",
                    'log.type': method,
                    'service.name': 'nextjs-app',
                },
            });
        };
    });

    isPatched = true;

    // Set up process exit handler to flush remaining logs (Node.js runtime only)
    // Skip in Edge Runtime where process.on is not available
    try {
        if (typeof process !== 'undefined' &&
            typeof process.on === 'function' &&
            typeof process.env !== 'undefined') {
            const exitHandler = async () => {
                await flushLogs();
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

// Flush logs to OTEL
export async function flushLogs(): Promise<void> {
    try {
        await provider.forceFlush();
    } catch (error) {
        // Silently handle flush errors
    }
}

// Export provider for external use
export { provider as logProvider }; 