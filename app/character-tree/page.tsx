'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCharacters } from '@/hooks/useCharacter';
import CharacterPassiveTreeViewer from '@/components/CharacterPassiveTreeViewer';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { AllocatedPassives } from '@/types/passiveTree';

export default function CharacterTreePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: characters, isLoading: charactersLoading } = useCharacters();

  const [selectedCharacterName, setSelectedCharacterName] = useState<string>('');
  const [currentBuild, setCurrentBuild] = useState<AllocatedPassives | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleAllocationChange = (allocated: AllocatedPassives) => {
    setCurrentBuild(allocated);
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Character Passive Trees
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            View and analyze your characters' passive skill allocations with live data
          </p>
        </div>

        {/* Character Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Character
          </h2>

          {charactersLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading characters...</span>
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacterName(char.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedCharacterName === char.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <h3 className={`font-semibold ${
                    selectedCharacterName === char.name
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {char.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Level {char.level} {char.class}
                  </p>
                  {char.league && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {char.league}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Characters Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We couldn't find any characters in your account. This could be because:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 text-left inline-block">
                <li>• Your characters are set to private</li>
                <li>• You haven't created any characters yet</li>
                <li>• There's an API connection issue</li>
                <li>• Your authentication session has expired</li>
              </ul>
            </div>
          )}
        </div>

        {/* Character Tree Viewer */}
        {selectedCharacterName && (
          <CharacterPassiveTreeViewer
            characterName={selectedCharacterName}
            onAllocationChange={handleAllocationChange}
            readOnly={false}
          />
        )}

        {/* No Character Selected */}
        {!selectedCharacterName && characters && characters.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Character
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a character above to view their passive skill tree with live data from your account
            </p>
          </div>
        )}

        {/* Features Info */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
            Live Character Integration Features
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• <strong>Real-time Data:</strong> View your character's actual passive allocations</li>
            <li>• <strong>What-if Planning:</strong> Test different builds without affecting your character</li>
            <li>• <strong>Build Comparison:</strong> Compare your current build to theoretical optimizations</li>
            <li>• <strong>Save Builds:</strong> Export modified builds for sharing or future reference</li>
            <li>• <strong>Reset Function:</strong> Always return to your character's live allocation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}