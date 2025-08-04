"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Session } from "next-auth"
import { useSession, signIn, signOut } from "next-auth/react"

interface AuthContextType {
  session: Session | null
  loading: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<any>
  signOut: () => Promise<any>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(status === "loading")
  }, [status])

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