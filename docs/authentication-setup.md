# Authentication Setup Guide

This document outlines the production-grade authentication system implemented in this Next.js application using Auth.js (NextAuth.js) with JWT tokens stored in secure HttpOnly cookies.

## 🚀 Features

- **Secure JWT Storage**: Tokens stored in HttpOnly, Secure, SameSite cookies
- **Password Hashing**: bcryptjs for secure password storage
- **Route Protection**: Middleware-based route protection
- **Type Safety**: Full TypeScript support
- **Production Ready**: Follows security best practices

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Next.js 15+

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   pnpm add next-auth jose bcryptjs
   ```

2. **Environment Setup**
   Create a `.env.local` file in your project root:
   ```env
   NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   ```

   **For Production:**
   ```env
   NEXTAUTH_SECRET=your-production-secret-key-here
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. **Generate a Secure Secret**
   ```bash
   openssl rand -base64 32
   ```

## 🔧 Configuration

### Auth.js Configuration (`src/lib/auth.ts`)

The authentication is configured with:
- JWT strategy for sessions
- Credentials provider for local authentication
- Secure cookie settings
- Custom JWT utilities

### Middleware (`src/middleware.ts`)

Protects routes under:
- `/editor/*`
- `/content/*`

Add more protected routes as needed.

## 🔐 Security Features

### 1. HttpOnly Cookies
- JWT tokens are stored in HttpOnly cookies
- Cannot be accessed by client-side JavaScript
- Protects against XSS attacks

### 2. Secure Cookie Settings
```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
}
```

### 3. Password Security
- Passwords hashed with bcryptjs (12 rounds)
- Never stored in plain text
- Secure comparison using timing-safe methods

### 4. JWT Security
- Short-lived access tokens (15 minutes)
- Signature verification
- Expiration checks
- Issuer and audience validation

## 📱 Usage

### Login Component
```tsx
import { useAuth } from '@/lib/auth-context';

export default function Login() {
  const { signIn } = useAuth();
  
  const handleSubmit = async (credentials) => {
    const result = await signIn(credentials);
    if (!result?.error) {
      // Redirect to protected route
    }
  };
}
```

### Protected Routes
```tsx
import ProtectedRoute from '@/components/shared/protected-route';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

### Logout
```tsx
import LogoutButton from '@/components/shared/logout-button';

<LogoutButton className="btn btn-primary">
  Sign Out
</LogoutButton>
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Registration Example
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'securepassword'
  })
});
```

## 🗄️ Database Integration

**Current Implementation**: In-memory storage (for demonstration)

**Production Recommendation**: Replace with a proper database:

```typescript
// Example with Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In auth.ts
async authorize(credentials) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email }
  });
  
  if (!user) return null;
  
  const isValid = await compare(credentials.password, user.password);
  return isValid ? user : null;
}
```

## 🚨 Security Considerations

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use strong, unique secrets in production
- Rotate secrets regularly

### 2. HTTPS in Production
- Always use HTTPS in production
- Set `secure: true` for cookies
- Configure proper SSL certificates

### 3. Rate Limiting
- Implement rate limiting on auth endpoints
- Consider using libraries like `express-rate-limit`

### 4. Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use libraries like `zod` for schema validation

### 5. Session Management
- Implement session timeout
- Allow users to revoke sessions
- Log authentication events

## 🔧 Customization

### Adding OAuth Providers
```typescript
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({...}),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
}
```

### Custom JWT Claims
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role;
      token.permissions = user.permissions;
    }
    return token;
  },
}
```

## 🧪 Testing

### Test Credentials
- Email: `admin@example.com`
- Password: `password123`

### Testing Protected Routes
1. Try accessing `/editor` without authentication
2. Should redirect to `/login`
3. Login with valid credentials
4. Should access protected content

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check if user exists in the system
   - Verify password hashing is working correctly

2. **Session not persisting**
   - Check cookie settings
   - Verify `NEXTAUTH_SECRET` is set
   - Ensure HTTPS in production

3. **Middleware not working**
   - Check route patterns in `middleware.ts`
   - Verify NextAuth configuration

### Debug Mode
Enable debug logging:
```env
NEXTAUTH_DEBUG=true
```

## 🔄 Migration to Production

1. **Replace in-memory storage** with a proper database
2. **Set up environment variables** for production
3. **Configure HTTPS** and secure cookies
4. **Implement monitoring** and logging
5. **Set up backup** and recovery procedures
6. **Test thoroughly** in staging environment

---

**Note**: This implementation follows security best practices but should be reviewed and customized based on your specific requirements and security needs. 