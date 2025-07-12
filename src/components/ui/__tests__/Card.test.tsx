import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card/Card';

describe('Card', () => {
  describe('Basic Rendering', () => {
    it('renders card with content', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default variant and padding', () => {
      render(
        <Card>
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-background', 'border', 'border-border', 'p-4');
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      render(
        <Card variant="default">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-background', 'border', 'border-border');
      expect(card).not.toHaveClass('border-2', 'shadow-lg');
    });

    it('applies outlined variant', () => {
      render(
        <Card variant="outlined">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-background', 'border-2', 'border-border');
      expect(card).not.toHaveClass('shadow-lg');
    });

    it('applies elevated variant', () => {
      render(
        <Card variant="elevated">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-background', 'border', 'border-border', 'shadow-lg');
    });
  });

  describe('Padding', () => {
    it('applies none padding', () => {
      render(
        <Card padding="none">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('p-3', 'p-4', 'p-6');
    });

    it('applies small padding', () => {
      render(
        <Card padding="sm">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-3');
    });

    it('applies medium padding (default)', () => {
      render(
        <Card padding="md">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4');
    });

    it('applies large padding', () => {
      render(
        <Card padding="lg">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-6');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <Card className="custom-card">
          <p>Content</p>
        </Card>
      );

      expect(screen.getByTestId('card')).toHaveClass('custom-card');
    });

    it('passes through HTML attributes', () => {
      render(
        <Card data-custom="test" id="card-id">
          <p>Content</p>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-custom', 'test');
      expect(card).toHaveAttribute('id', 'card-id');
    });
  });

  describe('Compound Components', () => {
    it('renders card with header', () => {
      render(
        <Card>
          <Card.Header>
            <h2>Card Title</h2>
          </Card.Header>
          <Card.Content>
            <p>Card content</p>
          </Card.Content>
        </Card>
      );

      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders card with content', () => {
      render(
        <Card>
          <Card.Content>
            <p>Card content</p>
          </Card.Content>
        </Card>
      );

      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders card with footer', () => {
      render(
        <Card>
          <Card.Content>
            <p>Card content</p>
          </Card.Content>
          <Card.Footer>
            <button>Action</button>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders complete card with all sections', () => {
      render(
        <Card>
          <Card.Header>
            <h2>Card Title</h2>
          </Card.Header>
          <Card.Content>
            <p>Card content</p>
          </Card.Content>
          <Card.Footer>
            <button>Action</button>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });

    it('applies custom className to header', () => {
      render(
        <Card>
          <Card.Header className="custom-header">
            <h2>Title</h2>
          </Card.Header>
        </Card>
      );

      expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
    });

    it('applies custom className to content', () => {
      render(
        <Card>
          <Card.Content className="custom-content">
            <p>Content</p>
          </Card.Content>
        </Card>
      );

      expect(screen.getByTestId('card-content')).toHaveClass('custom-content');
    });

    it('applies custom className to footer', () => {
      render(
        <Card>
          <Card.Footer className="custom-footer">
            <button>Action</button>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('card-footer')).toHaveClass('custom-footer');
    });
  });

  describe('Styling', () => {
    it('applies correct border classes for header', () => {
      render(
        <Card>
          <Card.Header>
            <h2>Title</h2>
          </Card.Header>
        </Card>
      );

      expect(screen.getByTestId('card-header')).toHaveClass('pb-3', 'border-b', 'border-border');
    });

    it('applies correct padding classes for content', () => {
      render(
        <Card>
          <Card.Content>
            <p>Content</p>
          </Card.Content>
        </Card>
      );

      expect(screen.getByTestId('card-content')).toHaveClass('py-3', 'first:pt-0', 'last:pb-0');
    });

    it('applies correct border classes for footer', () => {
      render(
        <Card>
          <Card.Footer>
            <button>Action</button>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('card-footer')).toHaveClass('pt-3', 'border-t', 'border-border');
    });
  });
});
