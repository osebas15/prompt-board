# Protected Route Implementation

## File: `src/components/ProtectedRoute.tsx`

**Purpose:** Component to protect routes requiring authentication

**Implementation Details:**
- Use modern React patterns
- Integrate with React Router
- Handle loading and error states
- Provide redirect functionality

**Key Features:**
- Authentication check on render
- Loading state display
- Automatic redirect to login
- Preserve intended route for post-login redirect

**Implementation:**
```typescript
import { useAuth } from '../features/auth/hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()
  
  if (isLoading) {
    return fallback || <div data-testid="loading">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    )
  }
  
  return <>{children}</>
}
```

**Route Protection:**
- Check authentication status
- Handle loading states
- Redirect unauthenticated users
- Preserve navigation state

**Error Handling:**
- Fallback loading component
- Error boundary integration
- Network failure handling

**Testing Strategy:**
- Test with authenticated user
- Test with unauthenticated user
- Test loading states
- Test navigation preservation
