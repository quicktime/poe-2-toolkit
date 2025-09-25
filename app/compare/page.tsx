'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCharacters } from '@/hooks/useCharacter';
import LoadingSpinner from '@/components/LoadingSpinner';
import CharacterComparisonView from '@/components/CharacterComparisonView';

export default function ComparisonPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: characters, isLoading, error } = useCharacters();
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [maxCharacters] = useState(4); // Support up to 4 character comparison

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
                Please authenticate with Path of Exile to compare characters.
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

  const handleCharacterSelect = (characterName: string, isSelected: boolean) => {
    if (isSelected) {
      if (selectedCharacters.length < maxCharacters) {
        setSelectedCharacters([...selectedCharacters, characterName]);
      }
    } else {
      setSelectedCharacters(selectedCharacters.filter(name => name !== characterName));
    }
  };

  const clearSelection = () => {
    setSelectedCharacters([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Character Comparison</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Side-by-Side Analysis
                </span>
              </div>
              <p className="text-green-100 mb-4">
                Compare multiple characters' stats, DPS, equipment, and build differences
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">⚖️ DPS Comparison</div>
                  <div className="text-sm text-green-100">Compare accurate PoE 2 damage calculations</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🛡️ Stat Analysis</div>
                  <div className="text-sm text-green-100">Health, resistances, defensive metrics</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">⚙️ Equipment Diff</div>
                  <div className="text-sm text-green-100">Gear comparison and optimization</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Character Selection */}
        {characters && characters.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Select Characters to Compare
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCharacters.length}/{maxCharacters} selected
                </span>
                {selectedCharacters.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {characters.map((character) => {
                const isSelected = selectedCharacters.includes(character.name);
                const canSelect = selectedCharacters.length < maxCharacters || isSelected;

                return (
                  <div
                    key={character.id}
                    className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : canSelect
                        ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canSelect && handleCharacterSelect(character.name, !isSelected)}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {character.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Level {character.level} {character.class}
                      </p>
                      {character.league && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {character.league}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              No characters found. Make sure your characters are public in your Path of Exile privacy settings.
            </div>
          </div>
        )}

        {/* Comparison View */}
        {selectedCharacters.length >= 2 ? (
          <CharacterComparisonView selectedCharacters={selectedCharacters} />
        ) : selectedCharacters.length === 1 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="text-center">
              <div className="text-yellow-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Select More Characters
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Please select at least 2 characters to begin comparison.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Compare
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select characters above to see detailed side-by-side comparison
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}