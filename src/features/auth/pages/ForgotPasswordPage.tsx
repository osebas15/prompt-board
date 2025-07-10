import { useEffect } from 'react';
import { ForgotPasswordForm } from '../components/forms/ForgotPasswordForm';

export function ForgotPasswordPage() {
  useEffect(() => {
    document.title = 'Forgot Password - Prompt Board';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Prompt Board
          </h1>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
