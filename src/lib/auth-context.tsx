"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Session } from "next-auth"
import { useSession, signIn, signOut } from "next-auth/react"
import { apiClient } from "./api-client"

interface AuthContextType {
  session: Session | null
  loading: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<any>
  signOut: () => Promise<any>
  isAuthenticated: boolean
  validateSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)

  // Validate session against backend
  const validateSession = async (): Promise<boolean> => {
    if (!session?.accessToken) {
      return false
    }

    if (isValidating) {
      return true // Prevent multiple simultaneous validations
    }

    setIsValidating(true)
    try {
      // Call the backend's validate-session endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/validate-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Session is invalid, logout the user
        await signOut({ redirect: false })
        return false
      }

      return true
    } catch (error) {
      console.error('Session validation error:', error)
      // On network errors, we'll assume the session is valid for now
      return true
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    setLoading(status === "loading")
  }, [status, session])

  // Validate session when it changes
  useEffect(() => {
    if (session && status === "authenticated") {
      // Validate session after a short delay to avoid excessive calls
      const timeoutId = setTimeout(() => {
        validateSession()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [session, status])

  const handleSignIn = async (credentials: { email: string; password: string }) => {
    return signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    })
  }

  const handleSignOut = async () => {
    return signOut({ redirect: false })
  }

  const value: AuthContextType = {
    session,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!session,
    validateSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 