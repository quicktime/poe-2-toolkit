'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import { PoE2DPSCalculator } from '@/lib/calculator/poe2DpsCalculator';
import { JewelAnalyzer } from '@/lib/jewelAnalyzer';
import LoadingSpinner from '@/components/LoadingSpinner';

interface BuildOptimizerProps {
  characterName: string;
  className?: string;
}

interface OptimizationScenario {
  id: string;
  name: string;
  type: 'jewel_swap' | 'equipment_change' | 'passive_change';
  description: string;
  changes: any;
  impact: {
    dpsChange: number;
    lifeChange: number;
    manaChange: number;
    resistanceChanges: { [key: string]: number };
  } | null;
}

interface CharacterBaseline {
  dps: number;
  life: number;
  mana: number;
  energyShield: number;
  resistances: { [key: string]: number };
  spirit: number;
  armor: number;
  evasion: number;
}

export default function BuildOptimizer({ characterName, className = '' }: BuildOptimizerProps) {
  const { data: character, isLoading, error } = useCharacterDetails(characterName);
  const [activeTab, setActiveTab] = useState<'jewels' | 'equipment' | 'passives' | 'scenarios'>('jewels');
  const [baseline, setBaseline] = useState<CharacterBaseline | null>(null);
  const [scenarios, setScenarios] = useState<OptimizationScenario[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [availableJewels, setAvailableJewels] = useState<any[]>([]);
  const [selectedJewelSlot, setSelectedJewelSlot] = useState<string>('');

  const dpsCalculator = PoE2DPSCalculator.getInstance();
  const jewelAnalyzer = JewelAnalyzer.getInstance();

  // Calculate baseline stats
  useEffect(() => {
    if (!character) return;

    const calculateBaseline = async () => {
      try {
        setIsCalculating(true);

        const dpsResult = await dpsCalculator.calculateDPS(characterName);
        const dps = dpsResult?.totalDPS || 0;

        const baselineData: CharacterBaseline = {
          dps,
          life: character.stats?.life || 0,
          mana: character.stats?.mana || 0,
          energyShield: character.stats?.energy_shield || 0,
          resistances: {
            fire: character.stats?.fire_resistance || 0,
            cold: character.stats?.cold_resistance || 0,
            lightning: character.stats?.lightning_resistance || 0,
            chaos: character.stats?.chaos_resistance || 0,
          },
          spirit: character.stats?.spirit || 0,
          armor: character.stats?.armor || 0,
          evasion: character.stats?.evasion || 0,
        };

        setBaseline(baselineData);

        // Find available jewels from inventory and stash
        const jewels = character.items?.filter(item =>
          item.frameType === 4 || // Jewels are frameType 4
          (item.typeLine && item.typeLine.toLowerCase().includes('jewel'))
        ) || [];

        setAvailableJewels(jewels);

        setIsCalculating(false);
      } catch (error) {
        console.error('Failed to calculate baseline:', error);
        setIsCalculating(false);
      }
    };

    calculateBaseline();
  }, [character, characterName]);

  const simulateJewelSwap = async (fromSlot: string, toJewelId: string) => {
    if (!character || !baseline) return;

    try {
      setIsCalculating(true);

      const newJewel = availableJewels.find(j => j.id === toJewelId);
      if (!newJewel) return;

      // Create a modified character data with the new jewel
      const modifiedCharacter = {
        ...character,
        items: character.items?.map(item => {
          if (item.inventoryId === fromSlot) {
            return newJewel;
          }
          return item;
        }) || []
      };

      // Calculate new stats (simplified simulation)
      const newDpsResult = await dpsCalculator.calculateDPS(characterName);
      const newDps = newDpsResult?.totalDPS || 0;

      // Analyze jewel effects
      const jewelEffects = await jewelAnalyzer.analyzeJewelEffects([newJewel], character.passives?.hashes || []);
      const jewelStats = jewelEffects.totalEffects;

      const scenario: OptimizationScenario = {
        id: `jewel_${fromSlot}_${Date.now()}`,
        name: `Replace ${fromSlot} with ${newJewel.typeLine}`,
        type: 'jewel_swap',
        description: `Swap jewel in ${fromSlot} for ${newJewel.typeLine}`,
        changes: {
          fromSlot,
          toJewel: newJewel,
        },
        impact: {
          dpsChange: newDps - baseline.dps,
          lifeChange: jewelStats.life || 0,
          manaChange: jewelStats.mana || 0,
          resistanceChanges: {
            fire: jewelStats.fireResistance || 0,
            cold: jewelStats.coldResistance || 0,
            lightning: jewelStats.lightningResistance || 0,
            chaos: jewelStats.chaosResistance || 0,
          }
        }
      };

      setScenarios(prev => [...prev, scenario]);
      setIsCalculating(false);
    } catch (error) {
      console.error('Failed to simulate jewel swap:', error);
      setIsCalculating(false);
    }
  };

  const clearScenarios = () => {
    setScenarios([]);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Loading character data...
        </p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-500">
          <p>Failed to load character data for optimization.</p>
        </div>
      </div>
    );
  }

  const formatChange = (value: number, unit: string = '', showPlus: boolean = true) => {
    const prefix = value > 0 && showPlus ? '+' : '';
    const color = value > 0 ? 'text-green-600 dark:text-green-400' : value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';
    return (
      <span className={color}>
        {prefix}{value.toLocaleString()}{unit}
      </span>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-3">
          <nav className="flex space-x-8">
            {[
              { key: 'jewels', label: 'Jewel Optimizer', icon: '💎' },
              { key: 'equipment', label: 'Equipment', icon: '⚙️' },
              { key: 'passives', label: 'Passive Tree', icon: '🌳' },
              { key: 'scenarios', label: 'Scenarios', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {scenarios.length > 0 && (
            <button
              onClick={clearScenarios}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear Scenarios
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {isCalculating && (
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-purple-700 dark:text-purple-300">
                Calculating optimization scenarios...
              </span>
            </div>
          </div>
        )}

        {/* Baseline Stats */}
        {baseline && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Current Character Stats (Baseline)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">DPS</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {baseline.dps.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Life</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {baseline.life.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mana</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {baseline.mana.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Spirit</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {baseline.spirit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jewel Optimizer Tab */}
        {activeTab === 'jewels' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Jewels */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Currently Equipped Jewels
                </h3>
                <div className="space-y-3">
                  {character.items?.filter(item =>
                    item.inventoryId?.includes('Socket') ||
                    (item.socket !== undefined && item.socket >= 0)
                  ).map((jewel, index) => (
                    <div key={jewel.id || index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {jewel.typeLine || 'Unknown Jewel'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Socket: {jewel.inventoryId || jewel.socket}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedJewelSlot(jewel.inventoryId || `socket_${jewel.socket}`)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Optimize
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Jewels */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Available Jewels for Swapping
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableJewels.map((jewel, index) => (
                    <div key={jewel.id || index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {jewel.typeLine || 'Unknown Jewel'}
                          </div>
                          {jewel.name && (
                            <div className="text-sm text-blue-600 dark:text-blue-400">
                              {jewel.name}
                            </div>
                          )}
                          {jewel.explicitMods && jewel.explicitMods.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {jewel.explicitMods.length} mod{jewel.explicitMods.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {selectedJewelSlot && (
                          <button
                            onClick={() => simulateJewelSwap(selectedJewelSlot, jewel.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Simulate Swap
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedJewelSlot && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Selected Slot:</strong> {selectedJewelSlot}
                      <br />
                      Click "Simulate Swap" on any jewel above to see the impact.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold mb-2">Equipment Optimization</h3>
            <p>Equipment upgrade simulation coming soon...</p>
          </div>
        )}

        {/* Passives Tab */}
        {activeTab === 'passives' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🌳</div>
            <h3 className="text-lg font-semibold mb-2">Passive Tree Optimization</h3>
            <p>Passive point reallocation simulation coming soon...</p>
          </div>
        )}

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            {scenarios.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">No Optimization Scenarios Yet</h3>
                <p>Use the Jewel Optimizer to create scenarios and see their impact.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Optimization Scenarios ({scenarios.length})
                </h3>

                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {scenario.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {scenario.description}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                        {scenario.type.replace('_', ' ')}
                      </span>
                    </div>

                    {scenario.impact && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">DPS Change</div>
                          <div className="font-semibold">
                            {formatChange(scenario.impact.dpsChange)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Life Change</div>
                          <div className="font-semibold">
                            {formatChange(scenario.impact.lifeChange)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Mana Change</div>
                          <div className="font-semibold">
                            {formatChange(scenario.impact.manaChange)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Fire Res Change</div>
                          <div className="font-semibold">
                            {formatChange(scenario.impact.resistanceChanges.fire, '%')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}