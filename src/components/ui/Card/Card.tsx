import type { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) => {
  const variants = {
    default: 'bg-background border border-border',
    outlined: 'bg-background border-2 border-border',
    elevated: 'bg-background border border-border shadow-lg',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(
        'rounded-lg transition-shadow',
        variants[variant],
        paddings[padding],
        className
      )}
      data-testid="card"
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={clsx('pb-3 border-b border-border last:border-b-0', className)}
      data-testid="card-header"
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return (
    <div
      className={clsx('py-3 first:pt-0 last:pb-0', className)}
      data-testid="card-content"
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div
      className={clsx('pt-3 border-t border-border first:border-t-0', className)}
      data-testid="card-footer"
      {...props}
    >
      {children}
    </div>
  );
};

// Compound component pattern
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
