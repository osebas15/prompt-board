import { clsx } from 'clsx';

interface HeaderProps {
  onMenuToggle: () => void;
  className?: string;
}

export const Header = ({ onMenuToggle, className }: HeaderProps) => {
  return (
    <header 
      className={clsx(
        'bg-background border-b border-border px-4 py-3 flex items-center justify-between',
        className
      )}
      role="banner"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Toggle navigation menu"
          data-testid="menu-toggle"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16" 
            />
          </svg>
        </button>
        
        <h1 className="text-xl font-semibold text-text-primary">
          Prompt Board
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Navigation items */}
        <div className="hidden md:flex items-center gap-4">
          <a 
            href="/prompts" 
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Prompts
          </a>
          <a 
            href="/contexts" 
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Contexts
          </a>
        </div>
        
        {/* User actions */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="User menu"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
