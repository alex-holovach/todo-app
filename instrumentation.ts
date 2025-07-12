import { registerTelemetry } from '@kubiks/otel-nextjs';

export function register() {
    registerTelemetry({
        config: {
            serviceName: 'next-app',
        },
        enableConsolePatching: true
    });
}