import { registerOTel } from '@vercel/otel';
import { patchConsole } from './lib/otel-logger';

export function register() {
    registerOTel({
        serviceName: 'next-app',
    });

    // Patch console early to capture server component logs
    patchConsole();
}