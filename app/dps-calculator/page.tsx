'use client';

import { useState } from 'react';
import { useCharacters } from '@/hooks/useCharacter';
import DPSCalculator from '@/components/DPSCalculator';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DPSCalculatorPage() {
  const { data: characters, isLoading, error } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');

  if (isLoading) {
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

  if (error) {
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
                Please authenticate with Path of Exile to access the DPS calculator.
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
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">PoE 2 DPS Calculator</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Mathematically Accurate
                </span>
              </div>
              <p className="text-purple-100 mb-4">
                Calculate damage per second using accurate PoE 2 formulas and real character data
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">✓ Correct Formulas</div>
                  <div className="text-sm text-purple-100">Accurate hit chance, damage scaling, combo mechanics</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">⚡ Spirit System</div>
                  <div className="text-sm text-purple-100">Spirit costs, efficiency, support gem calculations</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🔗 Real Data</div>
                  <div className="text-sm text-purple-100">Live character equipment, passives, and skill gems</div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          {characters && characters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-purple-100">
                Select Character:
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
                  ✓ Selected: {selectedCharacter}
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

        {/* DPS Calculator */}
        {selectedCharacter ? (
          <DPSCalculator
            characterName={selectedCharacter}
            className="w-full"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a Character
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a character from above to calculate accurate PoE 2 DPS
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}