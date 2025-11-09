import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Password strength validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

// Registration schema
const registrationSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(50, "First name too long").trim(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long").trim(),
})

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) { // 5 requests per 15 minutes
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input using Zod schema
    const validationResult = registrationSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => err.message).join(', ')
      return NextResponse.json(
        { error: `Validation failed: ${errors}` },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = validationResult.data

    // Forward registration to backend API
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: `${firstName} ${lastName}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message || "Registration failed" },
          { status: response.status }
        )
      }

      return NextResponse.json(
        { 
          message: "Account created successfully",
          user: data.data.user 
        },
        { status: 201 }
      )
    } catch (backendError) {
      console.error("Backend registration error:", backendError)
      return NextResponse.json(
        { error: "Registration service unavailable. Please try again later." },
        { status: 503 }
      )
    }
  } catch (error) {
    // Log error (in production, use proper error logging service)
    console.error("Registration error:", error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    )
  }
} 