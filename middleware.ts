import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { flushLogs } from './lib/otel-logger';

export async function middleware(request: NextRequest) {
    // Process the request
    const response = NextResponse.next();

    // Flush buffered logs after each request (only place manual flush is needed)
    // All console.log/error/warn/info calls are automatically captured and buffered
    await flushLogs();

    return response;
}

// Configuration for middleware
export const config = {
    matcher: [
        // Match all request paths except for the ones starting with:
        // - _next/static (static files)
        // - _next/image (image optimization files)
        // - favicon.ico (favicon file)
        // Include API routes to capture server-side logs
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 