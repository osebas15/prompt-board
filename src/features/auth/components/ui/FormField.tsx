import type { UseFormRegister, FieldError, Path } from 'react-hook-form';
import { FormError } from './FormError';
import { clsx } from 'clsx';

interface FormFieldProps<T extends Record<string, unknown> = Record<string, unknown>> {
  label: string;
  name: Path<T>;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  error?: FieldError;
  register: UseFormRegister<T>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function FormField<T extends Record<string, unknown> = Record<string, unknown>>({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register,
  disabled = false,
  required = false,
  className = ''
}: FormFieldProps<T>) {
  return (
    <div className={className}>
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          'appearance-none rounded-md relative block w-full px-3 py-2 border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors duration-200',
          error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300',
          disabled && 'bg-gray-50 cursor-not-allowed'
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        {...register(name)}
      />
      <FormError 
        message={error?.message} 
        className="mt-1"
      />
    </div>
  );
}
