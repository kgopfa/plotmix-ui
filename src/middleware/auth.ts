import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes under /designer
    // Note: /content is intentionally not protected to allow unauthenticated users to view their single chat
    "/designer/:path*",
    // Add other protected routes as needed
    // "/api/protected/:path*",
  ],
} 