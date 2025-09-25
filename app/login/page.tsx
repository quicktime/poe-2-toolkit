'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Path of Exile 2 Toolkit
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Connect your Path of Exile account to access all features
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="bg-white dark:bg-gray-800 px-6 py-8 rounded-lg shadow-md">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    What you&apos;ll get access to:
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Import your characters automatically</li>
                    <li>Real-time DPS calculations</li>
                    <li>Build optimization recommendations</li>
                    <li>Equipment upgrade analysis</li>
                    <li>Passive tree planning</li>
                    <li>Share and compare builds</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    By signing in, you agree to grant read-only access to your Path of Exile account data.
                    We never store your password or make changes to your account.
                  </p>
                </div>

                <button
                  onClick={login}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Sign in with Path of Exile
                </button>

                <div className="text-center">
                  <a
                    href="https://www.pathofexile.com/account/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Don&apos;t have an account? Create one
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>This is an unofficial fan-made tool.</p>
          <p>Not affiliated with Grinding Gear Games.</p>
        </div>
      </div>
    </div>
  );
}