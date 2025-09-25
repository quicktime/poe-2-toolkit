'use client';

import { useState } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import LoadingSpinner from './LoadingSpinner';
import DPSCalculator from './DPSCalculator';
import type { PoEItem, PoEGem, PoESkillGroup } from '@/lib/api/poeApiService';

interface ComprehensiveCharacterViewProps {
  characterName: string;
}

interface EquipmentSlot {
  name: string;
  items: PoEItem[];
}

const EQUIPMENT_SLOTS = [
  'Weapon',
  'Weapon Swap',
  'Helmet',
  'Body Armour',
  'Gloves',
  'Boots',
  'Belt',
  'Amulet',
  'Ring',
  'Ring 2',
  'Flask'
];

export default function ComprehensiveCharacterView({ characterName }: ComprehensiveCharacterViewProps) {
  const { data: character, isLoading, error } = useCharacterDetails(characterName);
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'skills' | 'passives' | 'inventory' | 'dps'>('overview');

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Loading comprehensive character data...
        </p>
      </div>
    );
  }

  if (error || !character) {
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
          <p className="text-gray-600 dark:text-gray-400">
            Could not retrieve data for {characterName} from Path of Exile API.
          </p>
        </div>
      </div>
    );
  }

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'Unknown';
    return num.toLocaleString();
  };

  const renderEquipmentItem = (item: PoEItem) => {
    const getRarityColor = (rarity?: string) => {
      switch (rarity?.toLowerCase()) {
        case 'normal': return 'text-gray-300';
        case 'magic': return 'text-blue-400';
        case 'rare': return 'text-yellow-400';
        case 'unique': return 'text-orange-400';
        case 'gem': return 'text-green-400';
        default: return 'text-gray-300';
      }
    };

    return (
      <div key={item.id || item.name} className="border border-gray-300 dark:border-gray-600 rounded p-3 mb-2">
        <div className={`font-medium ${getRarityColor(item.rarity)}`}>
          {item.name || item.typeLine}
        </div>
        {item.name && item.typeLine && item.name !== item.typeLine && (
          <div className="text-sm text-gray-500">{item.typeLine}</div>
        )}

        {item.properties && item.properties.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.properties.map((prop, idx) => (
              <div key={idx} className="text-sm">
                <span className="text-blue-400">{prop.name}:</span>{' '}
                <span className="text-gray-300">
                  {prop.values.map(([value]) => value).join(', ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {item.requirements && item.requirements.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-red-400 font-medium">Requirements:</div>
            {item.requirements.map((req, idx) => (
              <div key={idx} className="text-xs text-red-300">
                {req.name}: {req.values.map(([value]) => value).join(', ')}
              </div>
            ))}
          </div>
        )}

        {item.implicitMods && item.implicitMods.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-blue-400 font-medium">Implicit:</div>
            {item.implicitMods.map((mod, idx) => (
              <div key={idx} className="text-xs text-blue-300">{mod}</div>
            ))}
          </div>
        )}

        {item.explicitMods && item.explicitMods.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-yellow-400 font-medium">Explicit:</div>
            {item.explicitMods.map((mod, idx) => (
              <div key={idx} className="text-xs text-yellow-300">{mod}</div>
            ))}
          </div>
        )}

        {item.sockets && item.sockets.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-400 font-medium">Sockets:</div>
            <div className="flex gap-1 mt-1">
              {item.sockets.map((socket, idx) => {
                const getSocketColor = (attr: string) => {
                  switch (attr.toLowerCase()) {
                    case 's': return 'bg-red-500';
                    case 'd': return 'bg-green-500';
                    case 'i': return 'bg-blue-500';
                    case 'g': return 'bg-white';
                    default: return 'bg-gray-500';
                  }
                };

                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full border border-gray-400 ${getSocketColor(socket.attr)}`}
                    title={`${socket.attr} - Group ${socket.group}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {item.socketedItems && item.socketedItems.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-green-400 font-medium">Socketed Gems:</div>
            {item.socketedItems.map((gem, idx) => (
              <div key={idx} className="text-xs text-green-300 ml-2">
                {gem.typeLine} {gem.level && `(${gem.level})`} {gem.quality && gem.quality > 0 && `+${gem.quality}%`}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPassiveTree = () => {
    if (!character.passives) {
      return <div className="text-gray-400">No passive data available</div>;
    }

    const { hashes, hashes_ex, mastery_effects, jewel_data } = character.passives;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Passive Skills Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Regular Passives</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {hashes?.length || 0}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Ascendancy</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {hashes_ex?.length || 0}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Masteries</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {Object.keys(mastery_effects || {}).length}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Jewels</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {Object.keys(jewel_data || {}).length}
              </div>
            </div>
          </div>
        </div>

        {mastery_effects && Object.keys(mastery_effects).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Selected Masteries</h4>
            <div className="space-y-2">
              {Object.entries(mastery_effects).map(([masteryId, effectId]) => (
                <div key={masteryId} className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded">
                  <div className="text-sm text-purple-800 dark:text-purple-200">
                    Mastery {masteryId}: Effect {effectId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {jewel_data && Object.keys(jewel_data).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Jewel Modifications</h4>
            <div className="space-y-2">
              {Object.entries(jewel_data).map(([socketId, jewelInfo]) => (
                <div key={socketId} className="bg-green-100 dark:bg-green-900/20 p-2 rounded">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Socket {socketId}: {JSON.stringify(jewelInfo)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Character Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {character.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Level {character.level} {character.ascendancyClass || character.class}
              {character.league && ` • ${character.league}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Experience: {formatNumber(character.experience)}
            </div>
            {character.lastActive && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Last Active: {character.lastActive}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'equipment', label: 'Equipment' },
            { key: 'skills', label: 'Skills' },
            { key: 'passives', label: 'Passives' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'dps', label: 'DPS Calculator' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Character Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded">
                  <div className="text-xs text-red-600 dark:text-red-400">Life</div>
                  <div className="text-xl font-semibold text-red-800 dark:text-red-200">
                    {formatNumber(character.life)}
                  </div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Mana</div>
                  <div className="text-xl font-semibold text-blue-800 dark:text-blue-200">
                    {formatNumber(character.mana)}
                  </div>
                </div>
                {character.energy_shield && (
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded">
                    <div className="text-xs text-purple-600 dark:text-purple-400">Energy Shield</div>
                    <div className="text-xl font-semibold text-purple-800 dark:text-purple-200">
                      {formatNumber(character.energy_shield)}
                    </div>
                  </div>
                )}
                <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded">
                  <div className="text-xs text-orange-600 dark:text-orange-400">Strength</div>
                  <div className="text-xl font-semibold text-orange-800 dark:text-orange-200">
                    {formatNumber(character.strength)}
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded">
                  <div className="text-xs text-green-600 dark:text-green-400">Dexterity</div>
                  <div className="text-xl font-semibold text-green-800 dark:text-green-200">
                    {formatNumber(character.dexterity)}
                  </div>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/20 p-3 rounded">
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">Intelligence</div>
                  <div className="text-xl font-semibold text-indigo-800 dark:text-indigo-200">
                    {formatNumber(character.intelligence)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Equipment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {character.items && character.items.length > 0 ? (
                character.items.map(item => renderEquipmentItem(item))
              ) : (
                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                  No equipment data available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Skills & Gems
            </h3>
            {character.skills && character.skills.length > 0 ? (
              <div className="space-y-4">
                {character.skills.map((skillGroup: any, idx) => (
                  <div key={skillGroup.id || idx} className="border border-gray-300 dark:border-gray-600 rounded p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Skill Group {idx + 1} {skillGroup.slot && `(${skillGroup.slot})`}
                    </h4>
                    {skillGroup.mainSkill && (
                      <div className="mb-2">
                        <span className="text-sm text-green-400 font-medium">Main Skill: </span>
                        <span className="text-green-300">{skillGroup.mainSkill.typeLine}</span>
                      </div>
                    )}
                    {skillGroup.supportGems && skillGroup.supportGems.length > 0 && (
                      <div>
                        <span className="text-sm text-blue-400 font-medium">Support Gems: </span>
                        <div className="ml-2 space-y-1">
                          {skillGroup.supportGems.map((gem: any, gemIdx: number) => (
                            <div key={gemIdx} className="text-sm text-blue-300">
                              {gem.typeLine} {gem.level && `(${gem.level})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No skill data available
              </div>
            )}
          </div>
        )}

        {activeTab === 'passives' && renderPassiveTree()}

        {activeTab === 'inventory' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Inventory
            </h3>
            {character.inventory && character.inventory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {character.inventory.map(item => renderEquipmentItem(item))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No inventory data available
              </div>
            )}
          </div>
        )}

        {activeTab === 'dps' && (
          <div className="p-0 -m-6">
            <DPSCalculator characterName={characterName} />
          </div>
        )}
      </div>
    </div>
  );
}