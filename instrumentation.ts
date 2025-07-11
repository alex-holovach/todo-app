import { registerTelemetry } from 'telemetry-nextjs';

export function register() {
    registerTelemetry({
        config: {
            serviceName: 'next-app',
        },
        enableConsolePatching: true
    });
}