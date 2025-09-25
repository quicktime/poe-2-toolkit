'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCharacters } from '@/hooks/useCharacter';
import LoadingSpinner from '@/components/LoadingSpinner';
import CharacterInsightsAnalyzer from '@/components/CharacterInsightsAnalyzer';

export default function InsightsPage() {
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
                Please authenticate with Path of Exile to access character insights.
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
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Character Insights</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Deep Analysis
                </span>
              </div>
              <p className="text-emerald-100 mb-4">
                Advanced character analysis with inventory insights, skill synergies, and build optimization recommendations
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🎒 Inventory Analysis</div>
                  <div className="text-sm text-emerald-100">Deep analysis of carried items and usage patterns</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">💎 Gem Synergies</div>
                  <div className="text-sm text-emerald-100">Identify skill gem interactions and conflicts</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🛡️ Weakness Scanner</div>
                  <div className="text-sm text-emerald-100">Find build vulnerabilities and optimization gaps</div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          {characters && characters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-emerald-100">
                Select Character to Analyze:
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white placeholder-emerald-200 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="" className="text-gray-900">Choose a character...</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.name} className="text-gray-900">
                    {char.name} (Level {char.level} {char.class})
                  </option>
                ))}
              </select>

              {selectedCharacter && (
                <div className="text-sm text-emerald-100 bg-white/10 px-3 py-1 rounded-full">
                  ✓ Analyzing: {selectedCharacter}
                </div>
              )}
            </div>
          )}

          {!characters || characters.length === 0 && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-emerald-100">
                No characters found. Make sure your characters are public in your Path of Exile privacy settings.
              </div>
            </div>
          )}
        </div>

        {/* Character Insights Analyzer */}
        {selectedCharacter ? (
          <CharacterInsightsAnalyzer
            characterName={selectedCharacter}
            className="w-full"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a Character for Deep Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a character above to get comprehensive insights and optimization recommendations
              </p>
            </div>
          </div>
        )}

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Inventory Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Inventory Intelligence
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Item Usage Patterns:</strong> Analyze carried items and identify optimization opportunities</p>
                  <p><strong>Value Assessment:</strong> Identify valuable items and potential upgrades in inventory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Synergies */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Skill Gem Interactions
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Synergy Detection:</strong> Identify powerful skill gem combinations and interactions</p>
                  <p><strong>Conflict Resolution:</strong> Find and resolve competing skill gem effects</p>
                </div>
              </div>
            </div>
          </div>

          {/* Build Optimization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Build Weakness Analysis
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Vulnerability Scanner:</strong> Identify potential build weaknesses and gaps</p>
                  <p><strong>Resource Efficiency:</strong> Optimize mana, spirit, and resource usage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}