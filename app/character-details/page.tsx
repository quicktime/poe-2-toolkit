'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCharacters } from '@/hooks/useCharacter';
import ComprehensiveCharacterView from '@/components/ComprehensiveCharacterView';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CharacterDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: characters, isLoading: charactersLoading } = useCharacters();

  const [selectedCharacterName, setSelectedCharacterName] = useState<string>('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

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
            Character Details
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            View comprehensive data for your characters directly from the Path of Exile API
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
                    {char.ascendancyClass && ` (${char.ascendancyClass})`}
                  </p>
                  {char.league && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {char.league}
                    </p>
                  )}
                  {char.experience && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      XP: {char.experience.toLocaleString()}
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

        {/* Character Details */}
        {selectedCharacterName && (
          <ComprehensiveCharacterView characterName={selectedCharacterName} />
        )}

        {/* No Character Selected */}
        {!selectedCharacterName && characters && characters.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Character
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a character above to view their comprehensive details including equipment, skills, passives, and more
            </p>
          </div>
        )}

        {/* Real Data Features */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
            Live Path of Exile Data Integration
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• <strong>Complete Equipment:</strong> All your gear with full stat breakdowns and socket information</li>
            <li>• <strong>Real Skill Gems:</strong> Active skills and support gems with levels and quality</li>
            <li>• <strong>Passive Tree Data:</strong> All allocated passives, masteries, and ascendancy points</li>
            <li>• <strong>Character Stats:</strong> Life, mana, attributes, and other core statistics</li>
            <li>• <strong>Inventory Items:</strong> Complete inventory with full item analysis</li>
            <li>• <strong>Live Updates:</strong> Data refreshes automatically when you reload</li>
          </ul>
        </div>

        {/* Technical Info */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Technical Information
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Data is fetched directly from the official Path of Exile API</li>
            <li>• Character privacy settings affect what data can be accessed</li>
            <li>• Some features may require specific OAuth permissions</li>
            <li>• Rate limiting may apply for frequent data requests</li>
            <li>• PoE 2 specific features will be added as the API becomes available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}