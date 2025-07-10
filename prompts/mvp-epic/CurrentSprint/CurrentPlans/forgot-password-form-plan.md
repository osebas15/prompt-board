# ForgotPasswordForm Component Implementation Plan

## Component Structure
```typescript
interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  className?: string;
}
```

## Features
- Email field with validation
- Form submission with loading states
- Error display for validation and auth errors
- Link back to login page
- Success message after sending reset link
- Responsive design
- Accessibility features

## Form Validation
- Email: Valid email format required
- Real-time validation on blur, re-validation on change after first error

## UI Elements
- Email input field
- Submit button with loading state
- Error messages below field
- Success message for reset link sent
- Link to /login

## Integration
- Uses supabase auth.resetPasswordForEmail directly
- Uses react-hook-form with zodResolver
- Handles success/error states with toast notifications
- Shows confirmation message after successful reset request

## File Location
`src/features/auth/components/forms/ForgotPasswordForm.tsx`

## Dependencies
- react-hook-form
- @hookform/resolvers/zod
- supabase client
- forgotPasswordSchema from validationSchemas
- React Router for navigation
- Toast notifications

## Additional Notes
- This form doesn't need the full useAuth hook since it's just sending a reset email
- Should handle rate limiting gracefully
- Error messages should be user-friendly
