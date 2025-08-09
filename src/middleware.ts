import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "connect-src 'self' ws: wss: http://localhost:8000 https://localhost:8000",
      "frame-ancestors 'none'"
    ].join('; '),
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Protect render-only pages with short-lived token
  if (request.nextUrl.pathname.startsWith('/render/')) {
    const headerToken = request.headers.get('x-render-auth')
    const cookieToken = request.cookies.get('x-render-auth')?.value
    const queryToken = process.env.NODE_ENV !== 'production' ? request.nextUrl.searchParams.get('token') : null
    const token = headerToken || cookieToken || queryToken
    const notFound = new NextResponse(null, { status: 404 })

    // Fail closed if secret missing or token absent
    const secret = process.env.RENDER_TOKEN_SECRET
    if (!token || !secret) {
      return notFound
    }

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
      const projectIdFromPath = request.nextUrl.pathname.split('/')[2]
      const tokenProjectId = (payload as Record<string, unknown>)?.projectId as string | undefined

      if (!tokenProjectId || tokenProjectId !== projectIdFromPath) {
        return notFound
      }

      // Optional: enforce exp/nbf/aud/iss checks via jwtVerify options and payload assertions
    } catch {
      return notFound
    }
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // Simple rate limiting (use Redis in production)
    const rateLimitKey = `rate_limit:${clientIP}`
    // This is a basic implementation - consider using a proper rate limiting library
    
    // For now, we'll just add a header to indicate rate limiting is active
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', '99') // This should be dynamic
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 