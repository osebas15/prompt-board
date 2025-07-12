import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer/Footer';

describe('Footer', () => {
  it('renders footer with correct structure', () => {
    render(<Footer />);
    
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Prompt Board. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('footer links have correct hrefs', () => {
    render(<Footer />);
    
    const privacyLink = screen.getByText('Privacy Policy').closest('a');
    const termsLink = screen.getByText('Terms of Service').closest('a');
    const supportLink = screen.getByText('Support').closest('a');
    
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(supportLink).toHaveAttribute('href', '/support');
  });

  it('has proper responsive layout classes', () => {
    const { container } = render(<Footer />);
    
    const footer = container.firstChild as Element;
    expect(footer).toHaveClass('bg-background', 'border-t', 'border-border');
    
    const flexContainer = footer?.querySelector('.flex');
    expect(flexContainer).toHaveClass('flex-col', 'md:flex-row', 'justify-between', 'items-center');
  });

  it('supports custom className', () => {
    const { container } = render(<Footer className="custom-footer" />);
    
    expect(container.firstChild).toHaveClass('custom-footer');
  });

  it('has proper hover states for links', () => {
    render(<Footer />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('hover:text-text-primary');
    });
  });

  it('has correct semantic structure', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    
    // Check that copyright text is present
    expect(screen.getByText(/© \d{4} Prompt Board/)).toBeInTheDocument();
  });
});
