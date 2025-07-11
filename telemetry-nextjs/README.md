# Telemetry NextJS

A Next.js telemetry package that wraps Vercel's OTEL functionality with enhanced console logging capabilities.

## Features

- ✅ **Wraps Vercel OTEL**: Full compatibility with `@vercel/otel` package
- ✅ **Console Log Collection**: Automatically collects and forwards console logs to OTEL
- ✅ **Configurable**: Optional console patching with simple configuration
- ✅ **TypeScript Support**: Full type definitions included
- ✅ **Zero Breaking Changes**: Drop-in replacement for existing Vercel OTEL setup

## Installation

```bash
npm install telemetry-nextjs
# or
yarn add telemetry-nextjs
# or
pnpm add telemetry-nextjs
```

## Usage

### Basic Usage

Replace your existing Vercel OTEL setup in `instrumentation.ts`:

```typescript
// Before (using @vercel/otel directly)
import { registerOTel } from '@vercel/otel';

export function register() {
    registerOTel({
        serviceName: 'my-nextjs-app',
    });
}
```

```typescript
// After (using telemetry-nextjs)
import { registerTelemetry } from 'telemetry-nextjs';

export function register() {
    registerTelemetry({
        config: {
            serviceName: 'my-nextjs-app',
        },
        enableConsolePatching: true // optional, defaults to true
    });
}
```

### Advanced Usage

```typescript
import { registerTelemetry, flushLogs } from 'telemetry-nextjs';

export function register() {
    registerTelemetry({
        config: {
            serviceName: 'my-nextjs-app',
            // Any other Vercel OTEL config options
        },
        enableConsolePatching: true
    });
}

// Manually flush logs if needed (usually not required)
export { flushLogs };
```

### Backwards Compatibility

For even easier migration, you can use the compatibility function:

```typescript
import { registerOTelWithLogging } from 'telemetry-nextjs';

export function register() {
    // Same API as Vercel's registerOTel, but with console logging enabled
    registerOTelWithLogging({
        serviceName: 'my-nextjs-app',
    });
}
```

### Disable Console Patching

If you want to disable console log collection:

```typescript
import { registerTelemetry } from 'telemetry-nextjs';

export function register() {
    registerTelemetry({
        config: {
            serviceName: 'my-nextjs-app',
        },
        enableConsolePatching: false
    });
}
```

## Environment Variables

The console logger respects the same OTEL environment variables as Vercel's setup:

- `OTEL_EXPORTER_OTLP_ENDPOINT`: The OTLP endpoint URL
- `OTEL_EXPORTER_OTLP_HEADERS`: Headers for authentication (e.g., API keys)

## How It Works

1. **Vercel OTEL Registration**: Calls the original `registerOTel` function with your config
2. **Console Patching**: Intercepts console.log, console.error, etc. and converts them to OTEL log records
3. **Automatic Flushing**: Buffers logs and automatically flushes them every 5 seconds
4. **Process Exit Handling**: Attempts to flush remaining logs on process termination

## TypeScript Support

Full TypeScript definitions are included:

```typescript
interface TelemetryConfig {
    serviceName: string;
    [key: string]: any; // Supports all Vercel OTEL config options
}

interface TelemetryOptions {
    config: TelemetryConfig;
    enableConsolePatching?: boolean; // defaults to true
}
```

## API Reference

### `registerTelemetry(options: TelemetryOptions): void`

Main function that registers OTEL instrumentation with optional console patching.

### `registerOTelWithLogging(config: TelemetryConfig, enableConsolePatching?: boolean): void`

Backwards compatible function that accepts the same parameters as Vercel's `registerOTel`.

### `flushLogs(): Promise<void>`

Manually flush buffered console logs (usually not needed due to automatic flushing).

### `patchConsole(): void`

Manually patch console methods (called automatically when `enableConsolePatching` is true).

## License

MIT 