import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
import { Footer } from '../Footer/Footer';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

export const AppLayout = ({ children, className, ...props }: AppLayoutProps) => {
  // Always start with sidebar closed - this ensures state resets on navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isSidebarOpen &&
        !target.closest('[data-testid="sidebar"]') &&
        !target.closest('[data-testid="menu-toggle"]')
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div
      className={clsx(
        'min-h-screen bg-background flex flex-col',
        className
      )}
      {...props}
    >
      <Header onMenuToggle={handleMenuToggle} />
      
      <div className="flex flex-1 relative">
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
        
        <main 
          className={clsx(
            'flex-1 p-6 transition-all duration-200 ease-in-out',
            isSidebarOpen ? 'lg:ml-64' : 'ml-0'
          )}
          role="main"
        >
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};
