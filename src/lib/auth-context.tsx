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

// Dummy user data for MVP (auth disabled)
const DUMMY_USER = {
  id: "mvp-dummy-user",
  email: "demo@plotmix.com",
  name: "Demo User",
}

// Dummy session for MVP (auth disabled)
const DUMMY_SESSION: Session = {
  user: DUMMY_USER,
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  accessToken: "dummy-token",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // MVP: Always return authenticated with dummy user
  const [loading, setLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Validate session against backend - always return true for MVP
  const validateSession = async (): Promise<boolean> => {
    return true
  }

  const handleSignIn = async (credentials: { email: string; password: string }) => {
    // No-op for MVP
    return { ok: true }
  }

  const handleSignOut = async () => {
    // No-op for MVP
    return { ok: true }
  }

  const value: AuthContextType = {
    session: DUMMY_SESSION,
    loading: false,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: true,
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