import type { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

interface FormLabelProps extends HTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

interface FormDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

interface FormErrorProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

export const FormField = ({ children, className, ...props }: FormFieldProps) => {
  return (
    <div
      className={clsx('space-y-2', className)}
      data-testid="form-field"
      {...props}
    >
      {children}
    </div>
  );
};

export const FormLabel = ({
  children,
  htmlFor,
  required = false,
  className,
  ...props
}: FormLabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx(
        'block text-sm font-medium text-text-primary',
        className
      )}
      data-testid="form-label"
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-label="Required field">
          *
        </span>
      )}
    </label>
  );
};

export const FormDescription = ({ children, className, ...props }: FormDescriptionProps) => {
  return (
    <p
      className={clsx('text-sm text-text-secondary', className)}
      data-testid="form-description"
      {...props}
    >
      {children}
    </p>
  );
};

export const FormError = ({ children, className, ...props }: FormErrorProps) => {
  return (
    <p
      className={clsx('text-sm text-destructive', className)}
      role="alert"
      data-testid="form-error"
      {...props}
    >
      {children}
    </p>
  );
};

// Compound component pattern
FormField.Label = FormLabel;
FormField.Description = FormDescription;
FormField.Error = FormError;
