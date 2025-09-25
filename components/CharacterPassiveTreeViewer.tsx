'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import PassiveTreeViewer from './PassiveTreeViewer';
import LoadingSpinner from './LoadingSpinner';
import type { AllocatedPassives } from '@/types/passiveTree';

interface CharacterPassiveTreeViewerProps {
  characterName: string;
  onAllocationChange?: (allocated: AllocatedPassives) => void;
  readOnly?: boolean;
  showJewelEffects?: boolean;
}

export default function CharacterPassiveTreeViewer({
  characterName,
  onAllocationChange,
  readOnly = false,
  showJewelEffects = true
}: CharacterPassiveTreeViewerProps) {
  const { data: characterDetails, isLoading, error } = useCharacterDetails(characterName);
  const [localAllocated, setLocalAllocated] = useState<AllocatedPassives | null>(null);
  const [isModified, setIsModified] = useState(false);

  // Convert character passives to our format
  useEffect(() => {
    if (characterDetails?.passives) {
      const allocated: AllocatedPassives = {
        nodes: new Set(characterDetails.passives.hashes || []),
        classStartNode: characterDetails.passives.class_start_node || 1,
        pointsUsed: characterDetails.passives.hashes?.length || 0
      };
      setLocalAllocated(allocated);
      setIsModified(false);
    }
  }, [characterDetails]);

  const handleAllocationChange = useCallback((newAllocated: AllocatedPassives) => {
    setLocalAllocated(newAllocated);
    setIsModified(true);
    onAllocationChange?.(newAllocated);
  }, [onAllocationChange]);

  const handleResetToCharacter = () => {
    if (characterDetails?.passives) {
      const originalAllocated: AllocatedPassives = {
        nodes: new Set(characterDetails.passives.hashes || []),
        classStartNode: characterDetails.passives.class_start_node || 1,
        pointsUsed: characterDetails.passives.hashes?.length || 0
      };
      setLocalAllocated(originalAllocated);
      setIsModified(false);
      onAllocationChange?.(originalAllocated);
    }
  };

  const handleSaveToLocalStorage = () => {
    if (localAllocated) {
      const buildData = {
        name: `${characterName} - ${new Date().toLocaleDateString()}`,
        character: characterName,
        class: characterDetails?.class || 'Unknown',
        allocated: {
          ...localAllocated,
          nodes: Array.from(localAllocated.nodes)
        },
        timestamp: new Date().toISOString()
      };

      const existingBuilds = JSON.parse(localStorage.getItem('poe2_saved_builds') || '[]');
      const updatedBuilds = [...existingBuilds, buildData];
      localStorage.setItem('poe2_saved_builds', JSON.stringify(updatedBuilds));
      alert('Build saved to local storage!');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Loading {characterName}'s passive tree...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Character Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Could not load passive tree data for {characterName}. This could be due to:
          </p>
          <ul className="text-sm text-gray-500 dark:text-gray-400 text-left inline-block">
            <li>• Character privacy settings</li>
            <li>• Invalid character name</li>
            <li>• API connection issues</li>
            <li>• Character not found in selected league</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!characterDetails || !localAllocated) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">
          No character data available for {characterName}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Character Info Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {characterDetails.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Level {characterDetails.level} {characterDetails.class}
              {characterDetails.league && ` • ${characterDetails.league}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isModified && (
              <>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Modified
                </span>
                <button
                  onClick={handleResetToCharacter}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  Reset to Character
                </button>
                <button
                  onClick={handleSaveToLocalStorage}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Save Build
                </button>
              </>
            )}
          </div>
        </div>

        {/* Character Stats */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Allocated Points:</span>
            <div className="font-semibold text-gray-900 dark:text-white">
              {localAllocated.pointsUsed}
            </div>
          </div>
          {characterDetails.experience !== undefined && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Experience:</span>
              <div className="font-semibold text-gray-900 dark:text-white">
                {characterDetails.experience.toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <div className="font-semibold text-gray-900 dark:text-white">
              {isModified ? 'Modified' : 'Live Data'}
            </div>
          </div>
        </div>
      </div>

      {/* Passive Tree Viewer */}
      <PassiveTreeViewer
        characterClass={characterDetails.class}
        initialAllocated={localAllocated}
        onAllocationChange={handleAllocationChange}
        readOnly={readOnly}
        characterEquipment={characterDetails.items || []}
        jewelSocketData={characterDetails.passives?.jewel_data || {}}
        showJewelEffects={showJewelEffects}
      />

      {/* Character-specific Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Live Character Integration
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• This tree shows your character's actual allocated passives</li>
          <li>• Changes are local only - they won't affect your in-game character</li>
          <li>• Use "Reset to Character" to revert to your live passive allocation</li>
          <li>• Save builds to compare different passive configurations</li>
          <li>• Character data updates when you refresh or reload the page</li>
        </ul>
      </div>
    </div>
  );
}