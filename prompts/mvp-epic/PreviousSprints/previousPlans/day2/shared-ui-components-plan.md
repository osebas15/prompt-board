# Shared UI Components Implementation Plan

## FormField Component
### File Location
`src/features/auth/components/ui/FormField.tsx`

### Purpose
Reusable form field component with consistent styling and error handling

### Features
- Label with proper accessibility
- Input field with validation states
- Error message display
- Loading states
- Consistent styling

### Props Interface
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  error?: string;
  register: UseFormRegister<any>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}
```

## FormError Component
### File Location
`src/features/auth/components/ui/FormError.tsx`

### Purpose
Consistent error message display component

### Features
- Error icon
- Proper ARIA attributes
- Consistent styling
- Animation/transitions

### Props Interface
```typescript
interface FormErrorProps {
  message?: string;
  className?: string;
}
```

## LoadingButton Component
### File Location
`src/features/auth/components/ui/LoadingButton.tsx`

### Purpose
Button component with loading state support

### Features
- Loading spinner
- Disabled state when loading
- Consistent styling
- Accessibility features

### Props Interface
```typescript
interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}
```

## Dependencies
- React Hook Form types
- Lucide React for icons
- Tailwind CSS for styling
- Proper TypeScript interfaces
