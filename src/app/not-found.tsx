import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      {/* Logo in top left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 lg:top-12 lg:left-12">
        <Link href="/chat" className="flex items-center space-x-2">
          <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Plotmix
          </span>
        </Link>
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-indigo-600">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
          Page not found
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/chat"
            className="rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:from-indigo-500 hover:to-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go back home
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-gray-900">
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
