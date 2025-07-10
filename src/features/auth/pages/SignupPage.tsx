import { useEffect } from 'react';
import { SignupForm } from '../components/forms/SignupForm';

export function SignupPage() {
  useEffect(() => {
    document.title = 'Sign Up - Prompt Board';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prompt Board
          </h1>
          <h2 className="text-xl text-gray-600 mb-8">
            Create your account
          </h2>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
