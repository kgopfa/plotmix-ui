# Authentication Best Practices

## Overview

This document outlines the production-grade authentication system implemented in PlotMix, addressing the critical security issue where users could remain logged in even after being deleted from the database.

## Problem Statement

### Original Issue
- Users could remain logged in after database reset
- Client-side only authentication validation
- No backend session verification
- Stale sessions not invalidated

### Security Risks
- Unauthorized access to protected resources
- Session hijacking potential
- Data integrity issues
- Compliance violations

## Solution Architecture

### 1. Multi-Layer Session Validation

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NextAuth.js   │    │   Backend API   │
│   (React)       │◄──►│   (JWT Auth)    │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Session         │    │ Token           │    │ User            │
│ Validation      │    │ Validation      │    │ Validation      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Validation Layers

#### Layer 1: Client-Side Session Check
- NextAuth session validation
- Token expiration check
- Local storage validation

#### Layer 2: Backend Session Validation
- JWT token verification
- User existence check
- Account status validation

#### Layer 3: Database User Validation
- User record verification
- Account active status
- Permission validation

## Implementation Details

### 1. Enhanced API Client

The `ApiClient` class now includes automatic session validation:

```typescript
class ApiClient {
  private async validateSession(): Promise<boolean> {
    // Validate session against backend before each request
    const response = await fetch('/api/auth/validate-session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401 || response.status === 403) {
      await signOut({ redirect: false });
      return false;
    }
    
    return response.ok;
  }
}
```

**Key Features:**
- Pre-request session validation
- Automatic logout on invalid sessions
- Response status code handling
- Network error resilience

### 2. Session Validation Endpoint

New `/api/auth/validate-session` endpoint:

```typescript
export async function GET(request: NextRequest) {
  // 1. Extract and verify JWT token
  const payload = await verifyJWT(token);
  
  // 2. Validate user against backend
  const response = await fetch(`${backendUrl}/api/auth/validate-user/${userId}`);
  
  // 3. Return validation result
  return NextResponse.json({ valid: true, user: userData });
}
```

**Validation Steps:**
1. JWT token extraction and verification
2. User ID extraction from token
3. Backend user validation
4. Response with user data or error

### 3. Enhanced Auth Context

The `AuthContext` now includes session validation:

```typescript
const validateSession = async (): Promise<boolean> => {
  const response = await fetch('/api/auth/validate-session');
  
  if (!response.ok) {
    await signOut({ redirect: false });
    return false;
  }
  
  return true;
};
```

**Features:**
- Automatic session validation on mount
- Periodic validation
- Event-driven validation (focus, online)
- Automatic logout handling

### 4. Protected Route Enhancement

Protected routes now validate sessions:

```typescript
useEffect(() => {
  if (isAuthenticated && !loading) {
    validateSession().then((isValid) => {
      if (!isValid) {
        router.push('/login');
      }
    });
  }
}, [isAuthenticated, loading]);
```

### 5. Session Validation Hook

Custom hook for automatic validation:

```typescript
export function useSessionValidation(options: UseSessionValidationOptions = {}) {
  // Periodic validation (default: 5 minutes)
  // Focus event validation
  // Online status validation
  // Automatic logout on invalid sessions
}
```

## Security Features

### 1. Automatic Logout
- Invalid session detection
- Immediate logout on validation failure
- Redirect to login page
- Session cleanup

### 2. Validation Triggers
- **Periodic**: Every 5 minutes (configurable)
- **On Focus**: When user returns to tab
- **On Online**: When network connection restored
- **On Request**: Before each API call
- **On Mount**: When protected components load

### 3. Error Handling
- Network error resilience
- Graceful degradation
- Secure error messages
- Comprehensive logging

### 4. Performance Optimization
- Debounced validation calls
- Cached validation results
- Minimal API overhead
- Efficient token handling

## Best Practices Implemented

### 1. Defense in Depth
- Multiple validation layers
- Redundant security checks
- Fail-secure design
- Comprehensive error handling

### 2. Principle of Least Privilege
- Minimal required permissions
- Session scope limitation
- Resource access control
- Permission validation

### 3. Session Management
- Secure session storage
- Automatic session cleanup
- Session invalidation
- Token refresh handling

### 4. Security Monitoring
- Session validation logging
- Failed authentication tracking
- Security event monitoring
- Audit trail maintenance

## Configuration

### Environment Variables

```bash
# Frontend
NEXTAUTH_SECRET=your-secure-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
JWT_SECRET=your-secure-secret
INTERNAL_API_KEY=your-internal-api-key
```

### Validation Intervals

```typescript
// Default validation intervals
const VALIDATION_INTERVALS = {
  PERIODIC: 5 * 60 * 1000,    // 5 minutes
  FOCUS: 0,                   // Immediate
  ONLINE: 0,                  // Immediate
  REQUEST: 0,                 // Before each request
  MOUNT: 1000,                // 1 second delay
};
```

## Usage Examples

### 1. Basic Protected Route

```typescript
import ProtectedRoute from '@/components/shared/protected-route';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### 2. Custom Session Validation

```typescript
import { useSessionValidation } from '@/hooks';

export default function MyComponent() {
  useSessionValidation({
    interval: 2 * 60 * 1000, // 2 minutes
    onInvalidSession: () => {
      // Custom invalid session handling
      console.log('Session invalidated');
    }
  });
  
  return <div>My component</div>;
}
```

### 3. API Client Usage

```typescript
import { apiClient } from '@/lib/api-client';

// Automatic session validation included
const data = await apiClient.get('/api/projects');
```

## Testing

### 1. Session Invalidation Test

```typescript
// Test that user is logged out when deleted from database
describe('Session Invalidation', () => {
  it('should logout user when deleted from database', async () => {
    // 1. Login user
    // 2. Delete user from database
    // 3. Make API request
    // 4. Verify user is logged out
  });
});
```

### 2. Validation Frequency Test

```typescript
// Test validation frequency and performance
describe('Validation Frequency', () => {
  it('should not make excessive validation calls', async () => {
    // 1. Monitor API calls
    // 2. Verify reasonable frequency
    // 3. Check performance impact
  });
});
```

## Monitoring and Alerting

### 1. Security Events
- Failed session validations
- Automatic logouts
- Invalid token attempts
- User deletion events

### 2. Performance Metrics
- Validation response times
- API call frequency
- Session validation success rate
- Error rates

### 3. User Experience
- Session timeout frequency
- Re-authentication rates
- User complaints about logouts
- Session persistence issues

## Future Enhancements

### 1. Advanced Features
- Session fingerprinting
- Device tracking
- Location-based validation
- Risk-based authentication

### 2. Performance Optimizations
- Redis session caching
- CDN session validation
- Edge computing integration
- Predictive validation

### 3. Security Enhancements
- Multi-factor authentication
- Biometric validation
- Behavioral analysis
- Threat detection

## Conclusion

This implementation provides production-grade authentication security by:

1. **Validating sessions against the backend** on every request
2. **Automatically logging out users** when sessions become invalid
3. **Implementing multiple validation layers** for defense in depth
4. **Providing comprehensive error handling** and monitoring
5. **Following security best practices** for session management

The system ensures that users cannot access protected resources with stale or invalid sessions, addressing the original security vulnerability while maintaining a good user experience.
