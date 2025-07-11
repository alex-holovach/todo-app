import type { Metadata } from 'next'
import './globals.css'
import { patchConsole } from '../lib/otel-logger'

// Ensure console patching is applied on server start
if (typeof window === 'undefined') {
  patchConsole();
}

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
