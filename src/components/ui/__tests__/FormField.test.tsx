import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from '../FormField/FormField';

describe('FormField', () => {
  describe('Basic Rendering', () => {
    it('renders form field with children', () => {
      render(
        <FormField>
          <input type="text" />
        </FormField>
      );

      expect(screen.getByTestId('form-field')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies default spacing class', () => {
      render(
        <FormField>
          <input type="text" />
        </FormField>
      );

      expect(screen.getByTestId('form-field')).toHaveClass('space-y-2');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <FormField className="custom-field">
          <input type="text" />
        </FormField>
      );

      expect(screen.getByTestId('form-field')).toHaveClass('custom-field');
    });

    it('passes through HTML attributes', () => {
      render(
        <FormField data-custom="test" id="field-id">
          <input type="text" />
        </FormField>
      );

      const field = screen.getByTestId('form-field');
      expect(field).toHaveAttribute('data-custom', 'test');
      expect(field).toHaveAttribute('id', 'field-id');
    });
  });

  describe('Compound Components', () => {
    it('renders form field with label', () => {
      render(
        <FormField>
          <FormField.Label htmlFor="test-input">
            Test Label
          </FormField.Label>
          <input id="test-input" type="text" />
        </FormField>
      );

      expect(screen.getByTestId('form-label')).toBeInTheDocument();
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders form field with description', () => {
      render(
        <FormField>
          <FormField.Description>
            This is a helpful description
          </FormField.Description>
          <input type="text" />
        </FormField>
      );

      expect(screen.getByTestId('form-description')).toBeInTheDocument();
      expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
    });

    it('renders form field with error', () => {
      render(
        <FormField>
          <FormField.Error>
            This field is required
          </FormField.Error>
          <input type="text" />
        </FormField>
      );

      expect(screen.getByTestId('form-error')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('renders complete form field', () => {
      render(
        <FormField>
          <FormField.Label htmlFor="complete-input" required>
            Username
          </FormField.Label>
          <FormField.Description>
            Enter your username
          </FormField.Description>
          <input id="complete-input" type="text" />
          <FormField.Error>
            Username is required
          </FormField.Error>
        </FormField>
      );

      expect(screen.getByTestId('form-label')).toBeInTheDocument();
      expect(screen.getByTestId('form-description')).toBeInTheDocument();
      expect(screen.getByTestId('form-error')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});

describe('FormLabel', () => {
  describe('Basic Rendering', () => {
    it('renders label with text', () => {
      render(<FormField.Label>Test Label</FormField.Label>);

      expect(screen.getByTestId('form-label')).toBeInTheDocument();
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      render(<FormField.Label>Test Label</FormField.Label>);

      const label = screen.getByTestId('form-label');
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-text-primary');
    });
  });

  describe('Required Field', () => {
    it('shows required asterisk when required is true', () => {
      render(<FormField.Label required>Required Field</FormField.Label>);

      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByLabelText('Required field')).toBeInTheDocument();
    });

    it('does not show asterisk when required is false', () => {
      render(<FormField.Label required={false}>Optional Field</FormField.Label>);

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('does not show asterisk by default', () => {
      render(<FormField.Label>Default Field</FormField.Label>);

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Association', () => {
    it('associates with input using htmlFor', () => {
      render(
        <div>
          <FormField.Label htmlFor="test-input">Test Label</FormField.Label>
          <input id="test-input" type="text" />
        </div>
      );

      const label = screen.getByTestId('form-label');
      expect(label).toHaveAttribute('for', 'test-input');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<FormField.Label className="custom-label">Test</FormField.Label>);

      expect(screen.getByTestId('form-label')).toHaveClass('custom-label');
    });

    it('passes through HTML attributes', () => {
      render(
        <FormField.Label data-custom="test" id="label-id">
          Test
        </FormField.Label>
      );

      const label = screen.getByTestId('form-label');
      expect(label).toHaveAttribute('data-custom', 'test');
      expect(label).toHaveAttribute('id', 'label-id');
    });
  });
});

describe('FormDescription', () => {
  describe('Basic Rendering', () => {
    it('renders description with text', () => {
      render(<FormField.Description>Helpful text</FormField.Description>);

      expect(screen.getByTestId('form-description')).toBeInTheDocument();
      expect(screen.getByText('Helpful text')).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      render(<FormField.Description>Test</FormField.Description>);

      const description = screen.getByTestId('form-description');
      expect(description).toHaveClass('text-sm', 'text-text-secondary');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<FormField.Description className="custom-desc">Test</FormField.Description>);

      expect(screen.getByTestId('form-description')).toHaveClass('custom-desc');
    });

    it('passes through HTML attributes', () => {
      render(
        <FormField.Description data-custom="test" id="desc-id">
          Test
        </FormField.Description>
      );

      const description = screen.getByTestId('form-description');
      expect(description).toHaveAttribute('data-custom', 'test');
      expect(description).toHaveAttribute('id', 'desc-id');
    });
  });
});

describe('FormError', () => {
  describe('Basic Rendering', () => {
    it('renders error with text', () => {
      render(<FormField.Error>Error message</FormField.Error>);

      expect(screen.getByTestId('form-error')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      render(<FormField.Error>Test</FormField.Error>);

      const error = screen.getByTestId('form-error');
      expect(error).toHaveClass('text-sm', 'text-destructive');
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<FormField.Error>Error message</FormField.Error>);

      expect(screen.getByTestId('form-error')).toHaveAttribute('role', 'alert');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<FormField.Error className="custom-error">Test</FormField.Error>);

      expect(screen.getByTestId('form-error')).toHaveClass('custom-error');
    });

    it('passes through HTML attributes', () => {
      render(
        <FormField.Error data-custom="test" id="error-id">
          Test
        </FormField.Error>
      );

      const error = screen.getByTestId('form-error');
      expect(error).toHaveAttribute('data-custom', 'test');
      expect(error).toHaveAttribute('id', 'error-id');
    });
  });
});
