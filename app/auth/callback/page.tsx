'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAuthService } from '@/lib/auth/oauth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authorization code or state');
        return;
      }

      const oauth = new OAuthService();
      const result = await oauth.exchangeCodeForToken(code, state);

      if (result.success) {
        setStatus('success');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Completing authentication...
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please wait while we complete your login
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Authentication successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Authentication failed
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {errorMessage}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}