'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCharacters, useCharacterDetails } from '@/hooks/useCharacter';
import SkillGemConfigurator from '@/components/SkillGemConfigurator';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { SkillSetup } from '@/types/skillGems';

export default function SkillsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: characters, isLoading: charactersLoading } = useCharacters();

  const [selectedCharacterName, setSelectedCharacterName] = useState<string>('');
  const { data: characterDetails } = useCharacterDetails(selectedCharacterName);
  const [currentSetup, setCurrentSetup] = useState<SkillSetup | null>(null);
  const [savedSetups, setSavedSetups] = useState<Array<{
    name: string;
    character: string;
    setup: SkillSetup;
    timestamp: string;
  }>>([]);
  const [setupName, setSetupName] = useState('');

  const handleSetupChange = (setup: SkillSetup) => {
    setCurrentSetup(setup);
  };

  const handleSaveSetup = () => {
    if (!currentSetup || !setupName) {
      alert('Please enter a setup name');
      return;
    }

    const newSetup = {
      name: setupName,
      character: selectedCharacterName || 'Generic',
      setup: currentSetup,
      timestamp: new Date().toISOString()
    };

    const updatedSetups = [...savedSetups, newSetup];
    setSavedSetups(updatedSetups);
    localStorage.setItem('poe2_skill_setups', JSON.stringify(updatedSetups));
    setSetupName('');
    alert('Setup saved!');
  };

  const handleLoadSetup = (saved: typeof savedSetups[0]) => {
    setCurrentSetup(saved.setup);
    setSetupName(saved.name);
  };

  const handleDeleteSetup = (index: number) => {
    const updatedSetups = savedSetups.filter((_, i) => i !== index);
    setSavedSetups(updatedSetups);
    localStorage.setItem('poe2_skill_setups', JSON.stringify(updatedSetups));
  };

  // Load saved setups on mount
  useEffect(() => {
    const saved = localStorage.getItem('poe2_skill_setups');
    if (saved) {
      try {
        setSavedSetups(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved setups:', error);
      }
    }
  }, []);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Skill Gem Planner
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Configure your skill gems and support combinations for Path of Exile 2
          </p>
        </div>

        {/* Character Selection */}
        {isAuthenticated && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Character (Optional)
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedCharacterName}
                onChange={(e) => setSelectedCharacterName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                disabled={charactersLoading}
              >
                <option value="">Generic Build</option>
                {characters?.map(char => (
                  <option key={char.id} value={char.name}>
                    {char.name} - Level {char.level} {char.class}
                  </option>
                ))}
              </select>
              {selectedCharacterName && characterDetails && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Loading skills from equipped items...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Setup Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Setup Management
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Setup name..."
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSaveSetup}
                disabled={!currentSetup || !setupName}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Setup
              </button>
            </div>
          </div>

          {savedSetups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Saved Setups ({savedSetups.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedSetups.map((saved, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {saved.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {saved.character} • {saved.setup.mainSkills.length} skills
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadSetup(saved)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSetup(index)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Skill Gem Configurator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <SkillGemConfigurator
            initialSetup={currentSetup || undefined}
            onSetupChange={handleSetupChange}
            characterItems={characterDetails?.items}
            readOnly={false}
          />
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Tips for Skill Planning
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Select a character to load their currently equipped skill gems</li>
            <li>• Support gems are automatically filtered based on compatibility</li>
            <li>• Mana multipliers stack multiplicatively with multiple supports</li>
            <li>• Export your setup to share with others or save for later</li>
            <li>• In PoE 2, Uncut Gems provide additional skill options with Spirit cost</li>
            <li>• Combo skills can provide significant damage multipliers when chained</li>
          </ul>
        </div>

        {/* PoE 2 Specific Info */}
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
            Path of Exile 2 Changes
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• <strong>Uncut Gems:</strong> New skill system allowing multiple skills from one gem</li>
            <li>• <strong>Spirit System:</strong> Replaces mana reservation for auras and permanent minions</li>
            <li>• <strong>Combo System:</strong> Chain skills together for increasing damage</li>
            <li>• <strong>Meta Gems:</strong> New gem type that modifies how skills behave</li>
            <li>• <strong>Skill Specialization:</strong> Focus on fewer, more powerful skill setups</li>
          </ul>
        </div>
      </div>
    </div>
  );
}