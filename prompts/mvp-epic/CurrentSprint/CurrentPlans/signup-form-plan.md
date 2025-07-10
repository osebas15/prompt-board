# SignupForm Component Implementation Plan

## Component Structure
```typescript
interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}
```

## Features
- Email, password, and confirm password fields with validation
- Form submission with loading states
- Error display for validation and auth errors
- Link to login page
- Success message after signup
- Responsive design
- Accessibility features

## Form Validation
- Email: Valid email format required
- Password: Minimum 8 characters, uppercase, lowercase, number (existing schema)
- Confirm Password: Must match password
- Real-time validation on blur, re-validation on change after first error

## UI Elements
- Email input field
- Password input field
- Confirm password input field
- Submit button with loading state
- Error messages below fields
- Success message for email confirmation
- Link to /login

## Integration
- Uses useAuth hook for signup
- Uses react-hook-form with zodResolver
- Handles success/error states with toast notifications
- Shows confirmation message after successful signup

## File Location
`src/features/auth/components/forms/SignupForm.tsx`

## Dependencies
- react-hook-form
- @hookform/resolvers/zod
- useAuth hook
- signupSchema from validationSchemas
- React Router for navigation
- Toast notifications
