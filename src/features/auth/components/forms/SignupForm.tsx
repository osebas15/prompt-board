import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { signupSchema, type SignupFormData } from '../../utils/validationSchemas';
import { FormField } from '../ui/FormField';
import { LoadingButton } from '../ui/LoadingButton';
import { FormError } from '../ui/FormError';
import { CheckCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function SignupForm({ onSuccess, className = '' }: SignupFormProps) {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      const result = await signUp(data.email, data.password);
      
      if (result.error) {
        setSubmitError(result.error.message);
        return;
      }
      
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
          <p className="text-sm text-gray-600 mb-6">
            We've sent you a confirmation link. Please check your email and click the link to verify your account.
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

        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="Create a password"
          register={register}
          error={errors.password}
          required
          disabled={isLoading}
        />

        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          register={register}
          error={errors.confirmPassword}
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
          {isLoading ? 'Creating account...' : 'Sign up'}
        </LoadingButton>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
