'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCharacters } from '@/hooks/useCharacter';
import LoadingSpinner from '@/components/LoadingSpinner';
import EquipmentUpgradeAnalyzer from '@/components/EquipmentUpgradeAnalyzer';

export default function UpgradesPage() {
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
                Please authenticate with Path of Exile to analyze equipment upgrades.
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
        <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Equipment Upgrade System</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Smart Recommendations
                </span>
              </div>
              <p className="text-orange-100 mb-4">
                Analyze your gear and get AI-powered upgrade recommendations with exact DPS impact calculations
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🎯 Smart Analysis</div>
                  <div className="text-sm text-orange-100">Identifies weakest gear slots and upgrade priorities</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">📈 DPS Impact</div>
                  <div className="text-sm text-orange-100">Shows exact DPS gain from each upgrade</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">💰 Budget Optimization</div>
                  <div className="text-sm text-orange-100">Cost-effective upgrade paths and prioritization</div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          {characters && characters.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-orange-100">
                Select Character to Analyze:
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white placeholder-orange-200 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="" className="text-gray-900">Choose a character...</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.name} className="text-gray-900">
                    {char.name} (Level {char.level} {char.class})
                  </option>
                ))}
              </select>

              {selectedCharacter && (
                <div className="text-sm text-orange-100 bg-white/10 px-3 py-1 rounded-full">
                  ✓ Analyzing: {selectedCharacter}
                </div>
              )}
            </div>
          )}

          {!characters || characters.length === 0 && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-orange-100">
                No characters found. Make sure your characters are public in your Path of Exile privacy settings.
              </div>
            </div>
          )}
        </div>

        {/* Equipment Upgrade Analyzer */}
        {selectedCharacter ? (
          <EquipmentUpgradeAnalyzer
            characterName={selectedCharacter}
            className="w-full"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select a Character for Upgrade Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a character above to get personalized equipment upgrade recommendations
              </p>
            </div>
          </div>
        )}

        {/* Feature Preview */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Equipment Upgrade Analysis Features
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <p><strong>Smart Gap Analysis:</strong> Identifies your weakest equipment slots and biggest upgrade opportunities</p>
                <p><strong>DPS Impact Calculation:</strong> Shows exact damage increase from each potential upgrade</p>
                <p><strong>Socket Optimization:</strong> Recommends optimal socket colors and configurations</p>
                <p><strong>Budget Planning:</strong> Prioritizes upgrades by cost-effectiveness and impact</p>
                <p><strong>Resistance Balancing:</strong> Ensures upgrades maintain proper resistance coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}