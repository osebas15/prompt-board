# LoginForm Component Implementation Plan

## Component Structure
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}
```

## Features
- Email and password fields with validation
- Form submission with loading states
- Error display for validation and auth errors
- Links to signup and forgot password
- Responsive design
- Accessibility features

## Form Validation
- Email: Valid email format required
- Password: Minimum 6 characters (matching existing validation)
- Real-time validation on blur, re-validation on change after first error

## UI Elements
- Email input field
- Password input field  
- Submit button with loading state
- Error messages below fields
- Links to /signup and /forgot-password

## Integration
- Uses useAuth hook for authentication
- Uses react-hook-form with zodResolver
- Handles success/error states with toast notifications
- Navigates to dashboard on successful login

## File Location
`src/features/auth/components/forms/LoginForm.tsx`

## Dependencies
- react-hook-form
- @hookform/resolvers/zod
- useAuth hook
- loginSchema from validationSchemas
- React Router for navigation
- Toast notifications
