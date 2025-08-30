import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

/**
 * Validate user session against backend
 * This endpoint checks if the user still exists in the database
 * and if their account is still active
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader?.split(' ')[1];
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const userId = payload.id || payload.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Validate user against backend database
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/auth/validate-user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // You might need to pass an internal API key for backend-to-backend communication
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
      },
    });

    if (!response.ok) {
      // User doesn't exist or is inactive
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 403 }
      );
    }

    const userData = await response.json();
    
    // Return user data if validation successful
    return NextResponse.json({
      valid: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
