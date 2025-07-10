# Authentication Hook Implementation

## File: `src/features/auth/hooks/useAuth.ts`

**Purpose:** Custom hook to access authentication state and methods

**Implementation Details:**
- Use React 19's modern hook patterns
- Access auth context safely
- Provide convenient auth methods
- Include error handling

**Key Features:**
- Type-safe context access
- Convenient method shortcuts
- Error handling for missing provider
- Modern React 19 patterns

**Implementation:**
```typescript
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Convenience hooks for specific auth operations
export function useAuthState() {
  const { user, isLoading, isAuthenticated } = useAuth()
  return { user, isLoading, isAuthenticated }
}

export function useAuthActions() {
  const { signIn, signUp, signOut } = useAuth()
  return { signIn, signUp, signOut }
}
```

**Error Handling:**
- Check for provider context
- Validate hook usage
- Provide clear error messages

**Performance:**
- Minimize re-renders
- Selective context consumption
- Memoized return values

**Testing Strategy:**
- Test hook outside provider (error case)
- Test hook with provider
- Test convenience hooks
- Test context updates
