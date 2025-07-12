import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const Select = ({
  options,
  value,
  defaultValue,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  size = 'md',
  className,
  onChange,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const selectedOption = options.find(option => option.value === selectedValue);

  // Handle controlled component
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(-1);
      }
    }
  };

  const handleOptionSelect = (option: SelectOption) => {
    if (!option.disabled) {
      // Only update internal state if not controlled
      if (value === undefined) {
        setSelectedValue(option.value);
      }
      onChange?.(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (!option.disabled) {
            handleOptionSelect(option);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const nextIndex = Math.min(focusedIndex + 1, options.length - 1);
          setFocusedIndex(nextIndex);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const prevIndex = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(prevIndex);
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(options.length - 1);
        }
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current) {
      const optionElement = optionsRef.current.children[focusedIndex] as HTMLElement;
      if (optionElement && optionElement.scrollIntoView) {
        optionElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div
      ref={selectRef}
      className={clsx('relative', className)}
      data-testid="select"
    >
      {/* Select Button */}
      <button
        type="button"
        className={clsx(
          'w-full flex items-center justify-between rounded-md border transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          sizes[size],
          {
            'bg-background border-border text-text-primary hover:border-border-hover': !disabled && !error,
            'bg-surface border-border text-text-disabled cursor-not-allowed': disabled,
            'border-destructive focus:ring-destructive focus:border-destructive': error && !disabled,
          }
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        data-testid="select-trigger"
      >
        <span className={clsx('truncate', {
          'text-text-placeholder': !selectedOption,
        })}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        {/* Chevron Icon */}
        <svg
          className={clsx('w-5 h-5 transition-transform', {
            'rotate-180': isOpen,
          })}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Options Dropdown */}
      {isOpen && (
        <div
          ref={optionsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
          data-testid="select-options"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              className={clsx(
                'w-full px-3 py-2 text-left transition-colors',
                'focus:outline-none',
                {
                  'text-text-primary hover:bg-surface': !option.disabled,
                  'text-text-disabled cursor-not-allowed': option.disabled,
                  'bg-primary text-primary-foreground': index === focusedIndex && !option.disabled,
                  'bg-surface': selectedValue === option.value && index !== focusedIndex,
                }
              )}
              onClick={() => handleOptionSelect(option)}
              disabled={option.disabled}
              role="option"
              aria-selected={selectedValue === option.value}
              data-testid={`select-option-${option.value}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
