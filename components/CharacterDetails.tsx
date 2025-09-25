'use client';

import { useState, useEffect } from 'react';
import type { CharacterDetails } from '@/types/character';

interface CharacterDetailsProps {
  characterName: string;
}

export default function CharacterDetailsComponent({ characterName }: CharacterDetailsProps) {
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'items' | 'skills' | 'passives'>('stats');

  useEffect(() => {
    fetchCharacterDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterName]);

  const fetchCharacterDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/characters/${characterName}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch character details');
      }

      const data = await response.json();
      setCharacter(data.character);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">Error: {error}</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Character not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Character Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {character.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Level {character.level} {character.ascendancyClass || character.class}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {character.league} League
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last Active
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {character.lastActive ? new Date(character.lastActive).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {(['stats', 'items', 'skills', 'passives'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'stats' && character.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Life, Mana, ES */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Resources</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Life</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {character.stats.life.max}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Mana</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {character.stats.mana.max}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Energy Shield</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {character.stats.energyShield.max}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Defenses */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Defenses</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Armour</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.stats.armour}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Evasion</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.stats.evasion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Block Chance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.stats.blockChance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Resistances */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Resistances</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Fire</span>
                  <span className={`font-medium ${
                    character.stats.resistances.fire >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {character.stats.resistances.fire}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Cold</span>
                  <span className={`font-medium ${
                    character.stats.resistances.cold >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {character.stats.resistances.cold}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Lightning</span>
                  <span className={`font-medium ${
                    character.stats.resistances.lightning >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {character.stats.resistances.lightning}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Chaos</span>
                  <span className={`font-medium ${
                    character.stats.resistances.chaos >= 0 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {character.stats.resistances.chaos}%
                  </span>
                </div>
              </div>
            </div>

            {/* Offense */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Offense</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Critical Strike Chance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.stats.criticalStrikeChance}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Critical Multiplier</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.stats.criticalStrikeMultiplier}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Attack Speed</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.stats.attackSpeed.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4">
            {character.items && character.items.length > 0 ? (
              character.items.map((item) => (
                <div key={item.id} className="border dark:border-gray-700 rounded p-4">
                  <div className="flex items-start space-x-4">
                    {item.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.icon} alt={item.name} className="w-12 h-12" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.typeLine}</p>
                      {item.properties && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {item.properties.map((prop, idx) => (
                            <div key={idx}>
                              {prop.name}: {prop.values.map(v => v[0]).join(', ')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No items data available</p>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            {character.skills && character.skills.length > 0 ? (
              character.skills.map((skill) => (
                <div key={skill.id} className="border dark:border-gray-700 rounded p-4">
                  <div className="flex items-start space-x-4">
                    {skill.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={skill.icon} alt={skill.name} className="w-12 h-12" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{skill.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Level {skill.activeGem.level} / Quality {skill.activeGem.quality}%
                      </p>
                      {skill.supportGems && skill.supportGems.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Support Gems:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {skill.supportGems.map((gem) => (
                              <span key={gem.id} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {gem.name} (L{gem.level})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skills data available</p>
            )}
          </div>
        )}

        {activeTab === 'passives' && (
          <div>
            {character.passives ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Passive Tree</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Allocated Passives: {character.passives.hashes.length}
                  </p>
                  {character.passives.hashesEx && character.passives.hashesEx.length > 0 && (
                    <p className="text-gray-600 dark:text-gray-300">
                      Cluster Jewel Passives: {character.passives.hashesEx.length}
                    </p>
                  )}
                </div>
                {character.passives.jewelData && Object.keys(character.passives.jewelData).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Jewels</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {Object.keys(character.passives.jewelData).length} jewels socketed
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No passive tree data available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}