import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validationSchemas';
import { FormField } from '../ui/FormField';
import { LoadingButton } from '../ui/LoadingButton';
import { FormError } from '../ui/FormError';
import { CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ForgotPasswordForm({ onSuccess, className = '' }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email);
      
      if (error) {
        throw error;
      }

      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while sending the reset link';
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reset link sent</h3>
          <p className="text-sm text-gray-600 mb-6">
            If an account with that email exists, we've sent you a password reset link. Please check your email.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reset your password</h3>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <FormField
          label="Email address"
          name="email"
          type="email"
          placeholder="Enter your email"
          register={register}
          error={errors.email}
          required
          disabled={isLoading}
        />

        {submitError && (
          <FormError message={submitError} />
        )}

        <LoadingButton
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Sending reset link...' : 'Send reset link'}
        </LoadingButton>

        <div className="text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 text-sm transition-colors duration-200"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
