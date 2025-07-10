# Authentication Provider Implementation

## File: `src/features/auth/providers/AuthProvider.tsx`

**Purpose:** Provide authentication state and methods to the app

**Implementation Details:**
- Use React 19 patterns with modern hooks
- Implement `useActionState` for auth actions
- Handle Supabase auth state changes
- Provide auth methods to children

**Key Features:**
- Auto session detection on mount
- Auth state change listeners
- Automatic token refresh
- Error boundary integration
- Memory leak prevention

**React 19 Patterns:**
```typescript
// Use modern context syntax
return (
  <AuthContext value={contextValue}>
    {children}
  </AuthContext>
)

// Use useActionState for auth actions
const [signInState, signInAction] = useActionState(
  async (prevState, formData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    return await performSignIn(email, password)
  },
  null
)
```

**State Management:**
- Session state tracking
- Loading state management
- Error state handling
- User profile updates

**Error Handling:**
- Network error recovery
- Auth error messages
- Fallback states
- Cleanup on unmount

**Testing Strategy:**
- Mock Supabase client
- Test auth state changes
- Test error scenarios
- Test cleanup behavior
