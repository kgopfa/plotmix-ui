import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: any
    user: {
      id: string
      email: string
      name: string
    }
  }
} 