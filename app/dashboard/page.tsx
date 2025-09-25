'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import CharacterList from '@/components/CharacterList';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Path of Exile 2 Toolkit
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name}!
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Account Information
              </h3>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Name:</span> {user?.name}
                </p>
                {user?.realm && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Realm:</span> {user.realm}
                  </p>
                )}
                {user?.guild && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Guild:</span> {user.guild}
                  </p>
                )}
                {user?.challenges && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Challenges:</span> {user.challenges.total || 0} completed
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="mt-3 space-y-2">
                <Link href="/character-details" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  📊 Character Details (Real Data)
                </Link>
                <Link href="/dps-calculator" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  ⚡ PoE 2 DPS Calculator
                </Link>
                <Link href="/compare" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  ⚖️ Compare Characters
                </Link>
                <Link href="/planner" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  🌳 Plan Passive Tree
                </Link>
                <Link href="/character-tree" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  👤 View Character Trees
                </Link>
                <Link href="/skills" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  💎 Configure Skills
                </Link>
                <Link href="/optimize" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                  🔍 Optimize Build & Jewels
                </Link>
                <Link href="/upgrades" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                  📈 Equipment Upgrades
                </Link>
                <Link href="/builds" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20">
                  ✨ Build Templates
                </Link>
                <Link href="/insights" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
                  🧠 Character Insights
                </Link>
                <Link href="/analytics" className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-l-4 border-violet-500 bg-violet-50 dark:bg-violet-900/20">
                  📊 Community Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Statistics
              </h3>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Characters:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Builds Saved:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Calculations:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Characters Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Characters</h2>
          <CharacterList />
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Under Construction
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  The toolkit is currently in active development. Recently added features:
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>✅ DPS and defense calculations</li>
                  <li>✅ Passive tree planner with import/export</li>
                  <li>✅ Real character data integration</li>
                  <li>✅ Equipment parsing system</li>
                  <li>✅ Skill gem configuration UI</li>
                </ul>
                <p className="mt-2">Coming soon:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Build optimization tools</li>
                  <li>Equipment upgrade recommendations</li>
                  <li>Skill gem interactions</li>
                  <li>Trade integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}