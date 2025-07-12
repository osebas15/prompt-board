import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error = false,
      indeterminate = false,
      size = 'md',
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const labelSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return (
      <div className={clsx('flex items-start gap-2', className)} data-testid="checkbox-wrapper">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className={clsx(
              'peer cursor-pointer rounded border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              sizes[size],
              {
                'border-border bg-background text-primary': !error && !disabled,
                'border-destructive bg-background text-destructive': error && !disabled,
                'border-border bg-surface text-text-disabled cursor-not-allowed': disabled,
                'checked:bg-primary checked:border-primary': !error && !disabled,
                'checked:bg-destructive checked:border-destructive': error && !disabled,
              }
            )}
            disabled={disabled}
            data-testid="checkbox"
            {...props}
          />
          
          {/* Custom check icon */}
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center pointer-events-none',
              'text-white transition-opacity',
              {
                'opacity-0 peer-checked:opacity-100': !indeterminate,
                'opacity-100': indeterminate,
              }
            )}
            data-testid="checkbox-icon"
          >
            {indeterminate ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={props.id}
                className={clsx(
                  'block font-medium cursor-pointer',
                  labelSizes[size],
                  {
                    'text-text-primary': !disabled,
                    'text-text-disabled': disabled,
                    'text-destructive': error && !disabled,
                  }
                )}
                data-testid="checkbox-label"
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={clsx('text-sm mt-1', {
                  'text-text-secondary': !disabled,
                  'text-text-disabled': disabled,
                })}
                data-testid="checkbox-description"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
