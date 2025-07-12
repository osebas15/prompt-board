import { clsx } from 'clsx';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer 
      className={clsx(
        'bg-background border-t border-border px-6 py-4',
        className
      )}
      role="contentinfo"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-text-secondary">
            © {currentYear} Prompt Board. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <a 
            href="/privacy" 
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Privacy Policy
          </a>
          <a 
            href="/terms" 
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Terms of Service
          </a>
          <a 
            href="/support" 
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};
