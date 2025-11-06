'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service, if desired
    // eslint-disable-next-line no-console
    console.error('App crashed with error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-6">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">An unexpected error occurred. You can try again or go back home.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Try again
              </button>
              <Link
                href="/chat"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go home
              </Link>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <pre className="mt-6 text-xs text-left text-gray-500 whitespace-pre-wrap break-words">
                {error.message}
                {error.digest ? `\n\nDigest: ${error.digest}` : ''}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}


