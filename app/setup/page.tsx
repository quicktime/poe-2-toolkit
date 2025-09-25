'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Path of Exile 2 Toolkit - Setup Guide
        </h1>

        {showInstructions && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ OAuth Setup Required
              </h2>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                To use this toolkit with your Path of Exile account, you need to register it as an OAuth application. This is a one-time setup that enables secure access to your account data.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 1: Register Your OAuth Application
              </h2>

              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  Visit the Path of Exile Developer Portal:
                  <a
                    href="https://www.pathofexile.com/developer/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    https://www.pathofexile.com/developer/docs
                  </a>
                </li>

                <li>Log in with your Path of Exile account</li>

                <li>Navigate to &quot;My Applications&quot; or &quot;Create Application&quot;</li>

                <li>Create a new OAuth application with these settings:
                  <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Application Name:</span>
                        <span className="ml-2">PoE2 Toolkit (or your choice)</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Grant Type:</span>
                        <span className="ml-2 text-green-600 dark:text-green-400">Authorization Code with PKCE</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Redirect URI:</span>
                        <span className="ml-2 text-green-600 dark:text-green-400">http://localhost:3000/auth/callback</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Scopes Required:</span>
                        <ul className="ml-4 mt-1">
                          <li>✓ account:profile</li>
                          <li>✓ account:characters</li>
                          <li>✓ account:stashes (optional)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>

                <li>After creating the application, copy your <strong>Client ID</strong>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Note: Public clients using PKCE don&apos;t need a client secret
                  </div>
                </li>
              </ol>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 2: Configure Environment Variables
              </h2>

              <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Update your <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">.env.local</code> file with your credentials:
                </p>

                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`# Replace with your registered Client ID from Path of Exile
NEXT_PUBLIC_POE_CLIENT_ID=your_actual_client_id_here

# Keep this as is for local development
NEXT_PUBLIC_POE_REDIRECT_URI=http://localhost:3000/auth/callback`}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Important:</strong> After updating the .env.local file, you need to restart the development server:
                </p>
                <pre className="mt-2 bg-gray-900 text-gray-100 p-2 rounded text-sm">
{`# Stop the server (Ctrl+C) and restart:
npm run dev`}
                </pre>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Step 3: Test Your Setup
              </h2>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Once you&apos;ve configured your OAuth credentials and restarted the server, you can test the authentication:
                </p>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Go to Login Page
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Troubleshooting
              </h3>

              <div className="space-y-3">
                <details className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                    &quot;invalid_client&quot; error
                  </summary>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    This means your client ID is not set correctly. Make sure you&apos;ve copied the exact client ID from Path of Exile and added it to your .env.local file.
                  </p>
                </details>

                <details className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                    &quot;redirect_uri_mismatch&quot; error
                  </summary>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    The redirect URI in your Path of Exile app settings must exactly match: <code>http://localhost:3000/auth/callback</code>
                  </p>
                </details>

                <details className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                    Environment variables not loading
                  </summary>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    Make sure to restart the development server after changing .env.local. Stop the server with Ctrl+C and run `npm run dev` again.
                  </p>
                </details>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Additional Resources
              </h3>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  📚 <a href="https://www.pathofexile.com/developer/docs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    Path of Exile API Documentation
                  </a>
                </li>
                <li>
                  🔐 <a href="https://oauth.net/2/pkce/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    Learn about OAuth 2.0 PKCE
                  </a>
                </li>
                <li>
                  💻 <a href="https://github.com/quicktime/poe-2-toolkit" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                    Project Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}