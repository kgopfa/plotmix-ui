import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get the session from the server side
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Extract the token string
    const tokenString = typeof session.accessToken === 'string' 
      ? session.accessToken 
      : (session.accessToken as any)?.token || (session.accessToken as any)?.jwt

    if (!tokenString) {
      return NextResponse.json({ error: 'No valid token found' }, { status: 401 })
    }

    // Proxy the request to your backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenString}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.warn('Backend logout failed:', response.status, errorData)
      return NextResponse.json({ error: 'Backend logout failed' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Logout proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 