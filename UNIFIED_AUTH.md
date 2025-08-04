# Unified JWT Authentication System

## Overview
This document explains the unified JWT authentication system implemented across the PlotMix frontend and backend, using NextAuth.js as the primary authentication provider.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NextAuth.js   │    │   Backend API   │
│   (React)       │◄──►│   (JWT Auth)    │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (Users, etc.) │
                       └─────────────────┘
```

## Key Components

### 1. Unified JWT Secret
Both frontend and backend use the same JWT secret for token validation:

```bash
# Frontend (.env.local)
NEXTAUTH_SECRET=8KrEFsWo0ySqogK4/8uyY93Xx5m3VqpWqOJAbbRe3PE=

# Backend (.env)
JWT_SECRET=8KrEFsWo0ySqogK4/8uyY93Xx5m3VqpWqOJAbbRe3PE=
```

### 2. NextAuth.js Configuration
- **JWT Strategy**: Uses JWT tokens for session management
- **Secure Cookies**: Production-grade cookie security
- **Token Structure**: Compatible with backend validation
- **Session Management**: Automatic token refresh and validation

### 3. Backend Token Validation
- **Middleware**: `authenticateToken` validates NextAuth JWT tokens
- **Token Structure**: Adapts to NextAuth token format
- **User Context**: Provides user information to API routes

## Authentication Flow

### 1. User Login
```
1. User submits credentials on /login
2. NextAuth validates against users array
3. NextAuth creates JWT token with unified secret
4. Token stored in secure HTTP-only cookie
5. User redirected to protected route
```

### 2. API Request Authentication
```
1. Frontend makes API request with JWT token
2. Backend middleware validates token using same secret
3. User context added to request
4. API route processes authenticated request
```

### 3. Token Refresh
```
1. NextAuth automatically refreshes tokens
2. Backend validates refreshed tokens
3. Seamless user experience maintained
```

## Implementation Details

### Frontend (NextAuth.js)

#### Configuration (`src/lib/auth.ts`)
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Validates user credentials
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      // Include JWT token for API calls
      session.accessToken = token as any
      return session
    }
  }
}
```

#### API Client (`src/lib/api-client.ts`)
```typescript
class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    return headers;
  }
}
```

### Backend (Express)

#### Auth Middleware (`src/middleware/auth.ts`)
```typescript
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

#### Token Types (`src/types/index.ts`)
```typescript
export interface JWTPayload {
  sub?: string; // NextAuth user ID
  id?: string; // Alternative user ID
  email: string;
  name?: string;
  iat: number;
  exp: number;
}
```

## Security Features

### 1. Unified Secret Management
- Single JWT secret across all services
- Environment variable validation
- Secure secret generation

### 2. Token Security
- JWT tokens with expiration
- Automatic token refresh
- Secure cookie storage

### 3. Request Security
- Bearer token authentication
- CORS configuration
- Rate limiting

### 4. Error Handling
- Secure error messages
- Token validation errors
- Authentication failures

## Usage Examples

### Frontend API Calls
```typescript
import { apiClient } from '@/lib/api-client';

// Get user projects
const projects = await apiClient.get('/api/projects');

// Create new project
const newProject = await apiClient.post('/api/projects', {
  name: 'My Project',
  mainState: {}
});
```

### Backend Protected Routes
```typescript
import { authenticateToken } from '../middleware/auth';

router.get('/api/projects', authenticateToken, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  // Process request with user context
});
```

## Environment Setup

### Frontend (.env.local)
```bash
NEXTAUTH_SECRET=8KrEFsWo0ySqogK4/8uyY93Xx5m3VqpWqOJAbbRe3PE=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```bash
JWT_SECRET=8KrEFsWo0ySqogK4/8uyY93Xx5m3VqpWqOJAbbRe3PE=
JWT_EXPIRES_IN=24h
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## Benefits

### 1. Security
- Single authentication system
- Consistent token validation
- Reduced attack surface

### 2. Maintainability
- One auth system to maintain
- Standard NextAuth.js patterns
- Clear separation of concerns

### 3. User Experience
- Seamless authentication
- Automatic token refresh
- Consistent session management

### 4. Scalability
- Easy to add OAuth providers
- Role-based access control
- Future-proof architecture

## Migration Notes

### From Dual JWT Systems
- ✅ Unified JWT secret
- ✅ NextAuth as primary auth
- ✅ Backend validates NextAuth tokens
- ✅ Removed duplicate auth logic

### Security Improvements
- ✅ Production-grade JWT secret
- ✅ Enhanced token validation
- ✅ Secure cookie configuration
- ✅ Comprehensive error handling

## Testing

### Frontend Testing
```typescript
// Test authentication flow
const session = await getSession();
expect(session?.user).toBeDefined();
expect(session?.accessToken).toBeDefined();
```

### Backend Testing
```typescript
// Test token validation
const token = generateTestToken();
const decoded = AuthService.verifyNextAuthToken(token);
expect(decoded.email).toBe('test@example.com');
```

## Troubleshooting

### Common Issues

1. **Token Validation Errors**
   - Check JWT secret consistency
   - Verify token expiration
   - Ensure proper token format

2. **CORS Issues**
   - Verify CORS_ORIGIN configuration
   - Check frontend API URL
   - Ensure proper headers

3. **Session Issues**
   - Check NextAuth configuration
   - Verify cookie settings
   - Review token refresh logic

### Debug Steps

1. Check environment variables
2. Verify token structure
3. Review middleware logs
4. Test API endpoints directly
5. Validate CORS configuration

## Future Enhancements

### Planned Features
- OAuth provider integration
- Multi-factor authentication
- Role-based access control
- Session analytics
- Audit logging

### Security Improvements
- Token rotation
- Device fingerprinting
- Anomaly detection
- Rate limiting per user 