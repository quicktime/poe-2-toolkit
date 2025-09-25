'use client';

import React, { useState } from 'react';
import { useCharacters } from '@/hooks/useCharacter';
import { PoE2DPSCalculator } from '@/lib/calculator/poe2DpsCalculator';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CharacterComparisonViewProps {
  selectedCharacters: string[];
}

interface ComparisonData {
  character: any;
  dps: number | null;
  stats: {
    life: number;
    mana: number;
    energyShield: number;
    fireRes: number;
    coldRes: number;
    lightningRes: number;
    chaosRes: number;
    accuracy: number;
    evasion: number;
    armor: number;
    spirit: number;
  } | null;
  equipment: any[];
  skillGems: any[];
}

export default function CharacterComparisonView({ selectedCharacters }: CharacterComparisonViewProps) {
  const { data: characters, isLoading } = useCharacters();
  const [activeTab, setActiveTab] = useState<'overview' | 'dps' | 'stats' | 'equipment' | 'skills'>('overview');
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const exportComparisonReport = () => {
    if (comparisonData.length === 0) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      characters: comparisonData.map(data => ({
        name: data.character.name,
        level: data.character.level,
        class: data.character.class,
        league: data.character.league,
        dps: data.dps,
        stats: data.stats,
        equipmentCount: data.equipment.length,
        skillGemCount: data.skillGems.length
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `character-comparison-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (comparisonData.length === 0) return;

    const headers = [
      'Character Name', 'Level', 'Class', 'League', 'DPS',
      'Life', 'Mana', 'Energy Shield', 'Spirit', 'Armor', 'Evasion',
      'Fire Res', 'Cold Res', 'Lightning Res', 'Chaos Res', 'Accuracy'
    ];

    const rows = comparisonData.map(data => [
      data.character.name,
      data.character.level,
      data.character.class,
      data.character.league || '',
      data.dps || 0,
      data.stats?.life || 0,
      data.stats?.mana || 0,
      data.stats?.energyShield || 0,
      data.stats?.spirit || 0,
      data.stats?.armor || 0,
      data.stats?.evasion || 0,
      data.stats?.fireRes || 0,
      data.stats?.coldRes || 0,
      data.stats?.lightningRes || 0,
      data.stats?.chaosRes || 0,
      data.stats?.accuracy || 0,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `character-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedCharacterData = characters?.filter(char =>
    selectedCharacters.includes(char.name)
  ).sort((a, b) => selectedCharacters.indexOf(a.name) - selectedCharacters.indexOf(b.name)) || [];

  const dpsCalculator = PoE2DPSCalculator.getInstance();

  const calculateComparison = async () => {
    if (!selectedCharacterData.length) return;

    setIsCalculating(true);
    const results: ComparisonData[] = [];

    for (const character of selectedCharacterData) {
      try {
        let dps: number | null = null;
        let stats: ComparisonData['stats'] = null;

        try {
          const dpsResult = await dpsCalculator.calculateDPS(character.name);
          dps = dpsResult?.totalDPS || null;
        } catch (error) {
          console.warn(`Failed to calculate DPS for ${character.name}:`, error);
        }

        if (character.stats) {
          stats = {
            life: character.stats.life || 0,
            mana: character.stats.mana || 0,
            energyShield: character.stats.energy_shield || 0,
            fireRes: character.stats.fire_resistance || 0,
            coldRes: character.stats.cold_resistance || 0,
            lightningRes: character.stats.lightning_resistance || 0,
            chaosRes: character.stats.chaos_resistance || 0,
            accuracy: character.stats.accuracy || 0,
            evasion: character.stats.evasion || 0,
            armor: character.stats.armor || 0,
            spirit: character.stats.spirit || 0,
          };
        }

        results.push({
          character,
          dps,
          stats,
          equipment: character.equipment || [],
          skillGems: character.skillGems || [],
        });
      } catch (error) {
        console.error(`Error processing character ${character.name}:`, error);
        results.push({
          character,
          dps: null,
          stats: null,
          equipment: [],
          skillGems: [],
        });
      }
    }

    setComparisonData(results);
    setIsCalculating(false);
  };

  React.useEffect(() => {
    if (selectedCharacterData.length > 0) {
      calculateComparison();
    }
  }, [selectedCharacters]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Loading character data...
        </p>
      </div>
    );
  }

  const StatComparison = ({ label, values, unit = '', format = 'number' }: {
    label: string;
    values: (number | null)[];
    unit?: string;
    format?: 'number' | 'percentage';
  }) => {
    const maxValue = Math.max(...values.filter(v => v !== null) as number[]);

    return (
      <div className="border-b border-gray-200 dark:border-gray-700 py-3">
        <div className="font-medium text-gray-900 dark:text-white mb-2">{label}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {values.map((value, index) => {
            const isMax = value === maxValue && maxValue > 0;
            const displayValue = value !== null
              ? format === 'percentage'
                ? `${value}%`
                : value.toLocaleString()
              : 'N/A';

            return (
              <div
                key={index}
                className={`p-3 rounded text-center ${
                  isMax
                    ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {displayValue}{unit}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedCharacterData[index]?.name}
                </div>
                {isMax && maxValue > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    Highest
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-3">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'dps', label: 'DPS Analysis', icon: '⚡' },
              { key: 'stats', label: 'Stats', icon: '🛡️' },
              { key: 'equipment', label: 'Equipment', icon: '⚙️' },
              { key: 'skills', label: 'Skills', icon: '💎' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Export Buttons */}
          {comparisonData.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportAsCSV}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={exportComparisonReport}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {isCalculating && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-blue-700 dark:text-blue-300">
                Calculating character comparison data...
              </span>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedCharacterData.map((character, index) => {
                const data = comparisonData.find(d => d.character.name === character.name);

                return (
                  <div key={character.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {character.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Level {character.level} {character.class}
                      </p>
                      {character.league && (
                        <p className="text-xs text-gray-500 mt-1">{character.league}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">DPS:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {data?.dps ? data.dps.toLocaleString() : 'Calculating...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Life:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {data?.stats?.life?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Mana:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {data?.stats?.mana?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Spirit:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {data?.stats?.spirit?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DPS Tab */}
        {activeTab === 'dps' && (
          <div className="space-y-6">
            <StatComparison
              label="Total DPS"
              values={comparisonData.map(d => d.dps)}
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    DPS Calculation Notes
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    DPS calculations use accurate PoE 2 formulas including hit chance, damage effectiveness,
                    and support gem multipliers. Values may vary based on skill selection and configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Offensive Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Offensive Stats
                </h3>
                <div className="space-y-4">
                  <StatComparison
                    label="Accuracy"
                    values={comparisonData.map(d => d.stats?.accuracy || null)}
                  />
                </div>
              </div>

              {/* Defensive Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Defensive Stats
                </h3>
                <div className="space-y-4">
                  <StatComparison
                    label="Life"
                    values={comparisonData.map(d => d.stats?.life || null)}
                  />
                  <StatComparison
                    label="Mana"
                    values={comparisonData.map(d => d.stats?.mana || null)}
                  />
                  <StatComparison
                    label="Energy Shield"
                    values={comparisonData.map(d => d.stats?.energyShield || null)}
                  />
                  <StatComparison
                    label="Armor"
                    values={comparisonData.map(d => d.stats?.armor || null)}
                  />
                  <StatComparison
                    label="Evasion"
                    values={comparisonData.map(d => d.stats?.evasion || null)}
                  />
                </div>
              </div>
            </div>

            {/* Resistances */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resistances
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatComparison
                  label="Fire Resistance"
                  values={comparisonData.map(d => d.stats?.fireRes || null)}
                  unit="%"
                  format="percentage"
                />
                <StatComparison
                  label="Cold Resistance"
                  values={comparisonData.map(d => d.stats?.coldRes || null)}
                  unit="%"
                  format="percentage"
                />
                <StatComparison
                  label="Lightning Resistance"
                  values={comparisonData.map(d => d.stats?.lightningRes || null)}
                  unit="%"
                  format="percentage"
                />
                <StatComparison
                  label="Chaos Resistance"
                  values={comparisonData.map(d => d.stats?.chaosRes || null)}
                  unit="%"
                  format="percentage"
                />
              </div>
            </div>

            {/* Spirit */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Spirit System
              </h3>
              <StatComparison
                label="Total Spirit"
                values={comparisonData.map(d => d.stats?.spirit || null)}
              />
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            {/* Equipment Slots */}
            <div className="grid grid-cols-1 gap-6">
              {[
                'mainhand', 'offhand', 'helmet', 'body_armour', 'gloves', 'boots',
                'belt', 'amulet', 'ring', 'ring2'
              ].map(slot => {
                const slotLabel = slot.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <div key={slot} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {slotLabel}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {selectedCharacterData.map((character, index) => {
                        const data = comparisonData.find(d => d.character.name === character.name);
                        const equipment = data?.equipment || [];
                        const item = equipment.find((eq: any) => eq.inventoryId === slot);

                        return (
                          <div key={character.name} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              {character.name}
                            </div>

                            {item ? (
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {item.typeLine || item.baseType || 'Unknown Item'}
                                </div>

                                {item.name && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {item.name}
                                  </div>
                                )}

                                {item.ilvl && (
                                  <div className="text-xs text-gray-500">
                                    Item Level: {item.ilvl}
                                  </div>
                                )}

                                {item.properties && item.properties.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    {item.properties.slice(0, 3).map((prop: any, propIndex: number) => (
                                      <div key={propIndex} className="text-gray-600 dark:text-gray-400">
                                        {prop.name}: {prop.values?.[0]?.[0] || 'N/A'}
                                      </div>
                                    ))}
                                    {item.properties.length > 3 && (
                                      <div className="text-gray-500 italic">
                                        +{item.properties.length - 3} more properties
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.explicitMods && item.explicitMods.length > 0 && (
                                  <div className="text-xs">
                                    <div className="text-gray-500 mb-1">
                                      {item.explicitMods.length} explicit mod{item.explicitMods.length > 1 ? 's' : ''}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No item equipped
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Equipment Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Equipment Analysis
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Compare equipped items across characters. Empty slots indicate missing equipment.
                Detailed item stat comparison and upgrade recommendations coming soon.
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-lg font-semibold mb-2">Skill Comparison</h3>
              <p>Skill gem comparison functionality coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}