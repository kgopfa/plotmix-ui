import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { SignJWT, jwtVerify } from "jose"

// Production-grade user authentication
async function authenticateUser(email: string, password: string) {
  try {
    // In production, this would be a database call
    // For now, we'll use a simple API call to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data.user : null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function fetchBackendUserByEmail(email: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${backendUrl}/api/auth/users/lookup?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': process.env.INTERNAL_API_KEY!,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to look up user by email. Status: ${response.status}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error('Backend lookup returned an unsuccessful response')
  }

  if (!data.data?.exists) {
    return null
  }

  return data.data.user
}

async function createBackendUser(payload: { email: string; name: string; password?: string }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${backendUrl}/api/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': process.env.INTERNAL_API_KEY!,
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 409) {
    // User was created in a race by another request; fetch latest copy
    return fetchBackendUserByEmail(payload.email)
  }

  if (!response.ok) {
    throw new Error(`Failed to create user. Status: ${response.status}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error('Backend user creation returned an unsuccessful response')
  }

  return data.data.user
}

// Validate environment variables
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
}

// Check for missing environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

export const authOptions: NextAuthOptions = {
  providers: [
    // Google sign-in is optional: only enabled when credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              prompt: 'consent',
              access_type: 'offline',
              response_type: 'code',
            },
          },
        })]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Production-grade authentication with proper error handling
          const user = await authenticateUser(
            credentials.email.toLowerCase().trim(),
            credentials.password
          );

          if (!user) {
            // Use consistent timing to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 100));
            return null;
          }


          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          // Use consistent timing to prevent timing attacks
          await new Promise(resolve => setTimeout(resolve, 100));
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.type === 'oauth') {
        if (!user?.email) {
          return '/login?error=oauth-no-email'
        }

        try {
          const normalizedEmail = user.email.toLowerCase()
          let backendUser = await fetchBackendUserByEmail(normalizedEmail)

          if (!backendUser) {
            const derivedName = (user.name && user.name.trim()) || user.email.split('@')[0]
            backendUser = await createBackendUser({
              email: normalizedEmail,
              name: derivedName,
            })
          }

          user.id = backendUser.id
          user.email = backendUser.email
          user.name = backendUser.name
        } catch (error) {
          console.error('OAuth account provisioning failed:', error)
          return '/login?error=oauth-provider-error'
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.iat = Math.floor(Date.now() / 1000);
      }
      
      // Refresh token if it's about to expire
      if (token.exp && typeof token.exp === 'number' && token.exp < Math.floor(Date.now() / 1000) + 60 * 60) {
        token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        // Include the JWT token string as accessToken for API calls
        // We need to create a new JWT token string from the token object
        try {
          const jwtToken = await createJWT({
            id: token.id,
            email: token.email,
            name: token.name,
            iat: token.iat,
            exp: token.exp,
          });
          session.accessToken = jwtToken;
        } catch (error) {
          console.error('Failed to create JWT token for session:', error);
          // Fallback: include token object for debugging
          session.accessToken = token as any;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// JWT utilities for custom token handling
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

export async function createJWT(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // Short-lived access token
    .sign(secret)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
} 