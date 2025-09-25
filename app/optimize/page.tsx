'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCharacters } from '@/hooks/useCharacter';
import LoadingSpinner from '@/components/LoadingSpinner';
import BuildOptimizer from '@/components/BuildOptimizer';

export default function OptimizePage() {
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
                Please authenticate with Path of Exile to optimize builds.
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
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Build Optimizer</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  What-If Analysis
                </span>
              </div>
              <p className="text-purple-100 mb-4">
                Simulate equipment changes, jewel swaps, and passive tree modifications to see their impact
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">💎 Jewel Simulator</div>
                  <div className="text-sm text-purple-100">See DPS/stat changes from different jewels</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">⚙️ Equipment Optimizer</div>
                  <div className="text-sm text-purple-100">Compare gear upgrades and their effects</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">📊 Impact Analysis</div>
                  <div className="text-sm text-purple-100">Before/after comparison with exact changes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          {characters && characters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-purple-100">
                Select Character to Optimize:
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white placeholder-purple-200 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="" className="text-gray-900">Choose a character...</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.name} className="text-gray-900">
                    {char.name} (Level {char.level} {char.class})
                  </option>
                ))}
              </select>

              {selectedCharacter && (
                <div className="text-sm text-purple-100 bg-white/10 px-3 py-1 rounded-full">
                  ✓ Optimizing: {selectedCharacter}
                </div>
              )}
            </div>
          )}

          {!characters || characters.length === 0 && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-purple-100">
                No characters found. Make sure your characters are public in your Path of Exile privacy settings.
              </div>
            </div>
          )}
        </div>

        {/* Build Optimizer */}
        {selectedCharacter ? (
          <BuildOptimizer
            characterName={selectedCharacter}
            className="w-full"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a Character to Optimize
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a character above to start optimizing and see the impact of changes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}