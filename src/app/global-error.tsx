'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Application Error</h1>
              <p className="text-muted-foreground">
                A critical error occurred. Please try refreshing the page.
              </p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-muted-foreground">{error.message}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
