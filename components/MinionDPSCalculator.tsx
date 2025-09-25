'use client';

import { useState, useEffect } from 'react';
import PoE2MinionDPSCalculator, { MinionModifiers } from '@/lib/calculator/poe2MinionDpsCalculator';

interface MinionDPSCalculatorProps {
  className?: string;
}

export default function MinionDPSCalculator({ className = '' }: MinionDPSCalculatorProps) {
  const [minionType, setMinionType] = useState('Skeletal Warrior');
  const [gemLevel, setGemLevel] = useState(10);
  const [supportGems, setSupportGems] = useState<string[]>([]);
  const [availableSpirit, setAvailableSpirit] = useState(200);
  const [results, setResults] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('calculator');

  const [modifiers, setModifiers] = useState<MinionModifiers>({
    increasedMinionDamage: 50,
    moreMinionDamage: 0,
    increasedAttackSpeed: 20,
    moreAttackSpeed: 0,
    increasedMinionLife: 30,
    minionDuration: 0,
    additionalMinions: 0,
    spiritEfficiency: 0,
    weaponBaseDamageToMinions: 300 // Example weapon base damage
  });

  const calculator = PoE2MinionDPSCalculator.getInstance();
  const availableMinionTypes = calculator.getAvailableMinionTypes();
  const availableSupportGems = calculator.getAvailableSupportGems();

  const calculateDPS = () => {
    try {
      const result = calculator.calculateMinionDPS(minionType, gemLevel, modifiers, supportGems);
      setResults(result);
    } catch (error) {
      console.error('Error calculating minion DPS:', error);
    }
  };

  const optimizeSpirit = () => {
    const minionOptions = availableMinionTypes.map(type => ({
      type,
      gemLevel,
      supportGems,
      modifiers
    }));

    const result = calculator.optimizeForSpiritEfficiency(availableSpirit, minionOptions);
    setOptimization(result);
  };

  useEffect(() => {
    calculateDPS();
  }, [minionType, gemLevel, modifiers, supportGems]);

  const handleSupportGemToggle = (gemName: string) => {
    setSupportGems(prev =>
      prev.includes(gemName)
        ? prev.filter(g => g !== gemName)
        : [...prev, gemName]
    );
  };

  const handleModifierChange = (key: keyof MinionModifiers, value: number) => {
    setModifiers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">Minion & Totem DPS Calculator</h2>
        <p className="text-purple-100">
          Calculate accurate DPS for all minion types with PoE 2 mechanics including spirit costs and optimization
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'calculator', label: '🧮 Calculator', icon: '🧮' },
            { id: 'optimization', label: '⚡ Spirit Optimization', icon: '⚡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              {/* Minion Selection */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Minion Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minion Type
                    </label>
                    <select
                      value={minionType}
                      onChange={(e) => setMinionType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    >
                      {availableMinionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gem Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={gemLevel}
                      onChange={(e) => setGemLevel(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Support Gems */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Support Gems</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableSupportGems.map(gem => (
                    <label key={gem} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={supportGems.includes(gem)}
                        onChange={() => handleSupportGemToggle(gem)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{gem}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modifiers */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Character Modifiers</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Increased Minion Damage (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.increasedMinionDamage}
                        onChange={(e) => handleModifierChange('increasedMinionDamage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        More Minion Damage (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.moreMinionDamage}
                        onChange={(e) => handleModifierChange('moreMinionDamage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Weapon Base Damage
                      </label>
                      <input
                        type="number"
                        value={modifiers.weaponBaseDamageToMinions}
                        onChange={(e) => handleModifierChange('weaponBaseDamageToMinions', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">25% of this applies to minions</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Additional Minions
                      </label>
                      <input
                        type="number"
                        value={modifiers.additionalMinions}
                        onChange={(e) => handleModifierChange('additionalMinions', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Spirit Efficiency (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.spiritEfficiency}
                        onChange={(e) => handleModifierChange('spiritEfficiency', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Attack Speed (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.increasedAttackSpeed}
                        onChange={(e) => handleModifierChange('increasedAttackSpeed', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {results && (
                <>
                  {/* DPS Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">DPS Results</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {results.totalDPS.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total DPS</div>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {results.perMinionDPS.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Per Minion DPS</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {results.minionCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Minions</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {results.totalSpiritCost}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Spirit Cost</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {Math.round(results.totalDPS / results.totalSpiritCost)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">DPS/Spirit</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calculation Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Base Damage:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {Math.round(results.breakdown.baseDamage)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Attack Speed:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {results.breakdown.attackSpeed.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Hit Chance:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {results.breakdown.hitChance.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Critical Chance:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {results.breakdown.criticalChance}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Critical Multiplier:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {results.breakdown.criticalMultiplier}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            {/* Spirit Budget */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spirit Budget Optimization</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Spirit
                  </label>
                  <input
                    type="number"
                    value={availableSpirit}
                    onChange={(e) => setAvailableSpirit(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={optimizeSpirit}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Optimize Build
                  </button>
                </div>
              </div>
            </div>

            {/* Optimization Results */}
            {optimization && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🏆 Recommended Build
                  </h3>
                  {optimization.recommendedBuild ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {optimization.recommendedBuild.type}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Best Minion</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {optimization.recommendedBuild.totalDPS.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total DPS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {optimization.recommendedBuild.totalSpiritCost}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Spirit Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round(optimization.recommendedBuild.spiritEfficiency)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">DPS/Spirit</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      No builds fit within your spirit budget. Try increasing available spirit or reducing support gems.
                    </p>
                  )}
                </div>

                {/* Alternative Options */}
                {optimization.alternatives && optimization.alternatives.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alternative Options</h3>
                    <div className="space-y-2">
                      {optimization.alternatives.slice(1, 4).map((build: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{build.type}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              Level {build.gemLevel}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {build.totalDPS.toLocaleString()} DPS
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {build.totalSpiritCost} Spirit • {Math.round(build.spiritEfficiency)} DPS/Spirit
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}