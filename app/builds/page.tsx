'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCharacters } from '@/hooks/useCharacter';
import LoadingSpinner from '@/components/LoadingSpinner';
import BuildTemplateManager from '@/components/BuildTemplateManager';

export default function BuildsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: characters, isLoading, error } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LoadingSpinner />
            <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
              Loading characters...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please authenticate with Path of Exile to access build templates.
              </p>
              <a
                href="/api/auth/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Login with Path of Exile
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Build Template System</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Save & Share
                </span>
              </div>
              <p className="text-indigo-100 mb-4">
                Create, save, and share character build templates with the community
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">💾 Save Builds</div>
                  <div className="text-sm text-indigo-100">Capture character snapshots as templates</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🔗 Share & Import</div>
                  <div className="text-sm text-indigo-100">Export/import builds via JSON or URL</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">📊 Meta Analysis</div>
                  <div className="text-sm text-indigo-100">Compare against popular build templates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          {characters && characters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-indigo-100">
                Select Character to Template:
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white placeholder-indigo-200 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="" className="text-gray-900">Choose a character...</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.name} className="text-gray-900">
                    {char.name} (Level {char.level} {char.class})
                  </option>
                ))}
              </select>

              {selectedCharacter && (
                <div className="text-sm text-indigo-100 bg-white/10 px-3 py-1 rounded-full">
                  ✓ Template Source: {selectedCharacter}
                </div>
              )}
            </div>
          )}

          {!characters || characters.length === 0 && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-indigo-100">
                No characters found. Make sure your characters are public in your Path of Exile privacy settings.
              </div>
            </div>
          )}
        </div>

        {/* Build Template Manager */}
        <BuildTemplateManager
          selectedCharacter={selectedCharacter}
          className="w-full"
        />

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Build Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Intelligent Build Analysis
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Build Complexity Scoring:</strong> Automatically rate build difficulty for new players</p>
                  <p><strong>Meta Comparison:</strong> Compare your build against popular community templates</p>
                  <p><strong>Weakness Detection:</strong> Identify potential build vulnerabilities and gaps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Community Features */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Community Build Sharing
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Build Templates:</strong> Save character builds as reusable templates</p>
                  <p><strong>JSON Export:</strong> Share builds via structured data format</p>
                  <p><strong>URL Sharing:</strong> Generate shareable links for quick build access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}