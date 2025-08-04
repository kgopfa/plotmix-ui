import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"

import { users } from '@/lib/auth'

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

    // Check if user already exists
    const existingUser = users.find(user => user.email === email)
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password with higher cost factor for production
    const hashedPassword = await hash(password, 14) // Increased from 12 to 14

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)

    // Log successful registration (in production, use proper logging service)
    console.log(`New user registered: ${email} at ${new Date().toISOString()}`)

    // Return success (don't return the password)
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(
      { 
        message: "Account created successfully",
        user: userWithoutPassword 
      },
      { status: 201 }
    )
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