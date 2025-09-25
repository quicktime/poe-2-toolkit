'use client';

import { useState, useEffect } from 'react';
import PoE2DotDPSCalculator, { DotAilmentStats, DotModifiers, DotCalculationResult } from '@/lib/calculator/poe2DotDpsCalculator';

interface DotDPSCalculatorProps {
  className?: string;
}

export default function DotDPSCalculator({ className = '' }: DotDPSCalculatorProps) {
  const [activeTab, setActiveTab] = useState('calculator');
  const [results, setResults] = useState<any>(null);
  const [poisonRamping, setPoisonRamping] = useState<any>(null);

  // Hit damage configuration
  const [hitStats, setHitStats] = useState<DotAilmentStats>({
    baseDamage: 1000,
    damageType: 'mixed',
    physicalDamage: 600,
    chaosDamage: 200,
    fireDamage: 400
  });

  // DoT modifiers
  const [modifiers, setModifiers] = useState<DotModifiers>({
    increasedDotDamage: 80,
    moreDotDamage: 0,
    increasedDotDuration: 20,
    moreDotDuration: 0,
    dotDamageMultiplier: 1,
    increasedBleedingDamage: 0,
    increasedIgniteDamage: 0,
    increasedPoisonDamage: 50,
    bleedingDamageWhileMoving: 200,
    poisonStackLimit: 5,
    ailmentChance: 75,
    bleedingDuration: 5,
    igniteDuration: 4,
    poisonDuration: 2,
    ailmentDamageFromHit: 100
  });

  // Ailment configuration
  const [ailmentConfig, setAilmentConfig] = useState({
    bleeding: { enabled: true, enemyMoving: false },
    ignite: { enabled: true },
    poison: { enabled: true, stacks: 3 }
  });

  // Poison ramping configuration
  const [rampingConfig, setRampingConfig] = useState({
    attackRate: 2.5, // attacks per second
    simulationDuration: 10
  });

  const calculator = PoE2DotDPSCalculator.getInstance();

  const calculateDoT = () => {
    const result = calculator.calculateCombinedDoT(hitStats, modifiers, ailmentConfig);
    setResults(result);
  };

  const calculatePoisonRamping = () => {
    if (ailmentConfig.poison.enabled) {
      const ramping = calculator.simulatePoisonRamping(
        hitStats,
        modifiers,
        rampingConfig.attackRate,
        rampingConfig.simulationDuration
      );
      setPoisonRamping(ramping);
    }
  };

  useEffect(() => {
    calculateDoT();
  }, [hitStats, modifiers, ailmentConfig]);

  useEffect(() => {
    calculatePoisonRamping();
  }, [hitStats, modifiers, ailmentConfig.poison, rampingConfig]);

  const handleHitStatChange = (key: keyof DotAilmentStats, value: number | string) => {
    setHitStats(prev => ({ ...prev, [key]: value }));
  };

  const handleModifierChange = (key: keyof DotModifiers, value: number) => {
    setModifiers(prev => ({ ...prev, [key]: value }));
  };

  const handleAilmentToggle = (ailment: 'bleeding' | 'ignite' | 'poison', enabled: boolean) => {
    setAilmentConfig(prev => ({
      ...prev,
      [ailment]: { ...prev[ailment], enabled }
    }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">DoT & Ailment DPS Calculator</h2>
        <p className="text-red-100">
          Calculate damage over time from bleeding, ignite, and poison with accurate PoE 2 patch 0.3 mechanics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'calculator', label: '🧮 Calculator', icon: '🧮' },
            { id: 'ramping', label: '📈 Poison Ramping', icon: '📈' },
            { id: 'mechanics', label: '⚙️ Mechanics', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
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
              {/* Hit Damage Configuration */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hit Damage Configuration</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Base Damage
                    </label>
                    <input
                      type="number"
                      value={hitStats.baseDamage}
                      onChange={(e) => handleHitStatChange('baseDamage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Damage Type
                    </label>
                    <select
                      value={hitStats.damageType}
                      onChange={(e) => handleHitStatChange('damageType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="mixed">Mixed Damage</option>
                      <option value="physical">Pure Physical</option>
                      <option value="fire">Pure Fire</option>
                      <option value="chaos">Pure Chaos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Physical Damage
                    </label>
                    <input
                      type="number"
                      value={hitStats.physicalDamage || 0}
                      onChange={(e) => handleHitStatChange('physicalDamage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">For bleeding & poison</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fire Damage
                    </label>
                    <input
                      type="number"
                      value={hitStats.fireDamage || 0}
                      onChange={(e) => handleHitStatChange('fireDamage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">For ignite</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Chaos Damage
                    </label>
                    <input
                      type="number"
                      value={hitStats.chaosDamage || 0}
                      onChange={(e) => handleHitStatChange('chaosDamage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">For poison</p>
                  </div>
                </div>
              </div>

              {/* Ailment Configuration */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Ailments</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={ailmentConfig.bleeding.enabled}
                          onChange={(e) => handleAilmentToggle('bleeding', e.target.checked)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          🩸 Bleeding (15% physical/sec for 5s)
                        </span>
                      </label>
                      <div className="ml-6 mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={ailmentConfig.bleeding.enemyMoving}
                            onChange={(e) => setAilmentConfig(prev => ({
                              ...prev,
                              bleeding: { ...prev.bleeding, enemyMoving: e.target.checked }
                            }))}
                            className="h-3 w-3 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                            Enemy is moving (3x damage)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ailmentConfig.ignite.enabled}
                        onChange={(e) => handleAilmentToggle('ignite', e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        🔥 Ignite (90% fire/sec for 4s)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="flex-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={ailmentConfig.poison.enabled}
                          onChange={(e) => handleAilmentToggle('poison', e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          ☠️ Poison (30% phys+chaos/sec for 2s)
                        </span>
                      </label>
                      <div className="ml-6 mt-2 flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Stacks:</label>
                        <input
                          type="number"
                          min="1"
                          max={modifiers.poisonStackLimit}
                          value={ailmentConfig.poison.stacks}
                          onChange={(e) => setAilmentConfig(prev => ({
                            ...prev,
                            poison: { ...prev.poison, stacks: parseInt(e.target.value) }
                          }))}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                        />
                        <span className="text-xs text-gray-500">
                          (max: {modifiers.poisonStackLimit})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DoT Modifiers */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">DoT Modifiers</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Increased DoT Damage (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.increasedDotDamage}
                        onChange={(e) => handleModifierChange('increasedDotDamage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        More DoT Damage (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.moreDotDamage}
                        onChange={(e) => handleModifierChange('moreDotDamage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Poison Stack Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={modifiers.poisonStackLimit}
                        onChange={(e) => handleModifierChange('poisonStackLimit', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Increased Poison Damage (%)
                      </label>
                      <input
                        type="number"
                        value={modifiers.increasedPoisonDamage}
                        onChange={(e) => handleModifierChange('increasedPoisonDamage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ailment Chance (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={modifiers.ailmentChance}
                        onChange={(e) => handleModifierChange('ailmentChance', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
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
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">DoT DPS Results</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {Math.round(results.total.combinedDPS).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Combined DoT DPS</div>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.round(results.total.totalDamage).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total DoT Damage</div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {results.total.duration.toFixed(1)}s duration
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Maximum ailment duration</div>
                    </div>
                  </div>

                  {/* Individual Ailments */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Individual Ailments</h3>

                    {results.individual.bleeding && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">🩸 Bleeding</h4>
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            {Math.round(results.individual.bleeding.effectiveDamagePerSecond).toLocaleString()} DPS
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
                          <span>Duration: {results.individual.bleeding.duration.toFixed(1)}s</span>
                          <span>Total: {Math.round(results.individual.bleeding.totalDamage).toLocaleString()}</span>
                          {ailmentConfig.bleeding.enemyMoving && (
                            <span className="text-red-600 dark:text-red-400 font-medium col-span-2">
                              💨 Movement bonus: 3x damage
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {results.individual.ignite && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">🔥 Ignite</h4>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {Math.round(results.individual.ignite.effectiveDamagePerSecond).toLocaleString()} DPS
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
                          <span>Duration: {results.individual.ignite.duration.toFixed(1)}s</span>
                          <span>Total: {Math.round(results.individual.ignite.totalDamage).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {results.individual.poison && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">☠️ Poison</h4>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {Math.round(results.individual.poison.effectiveDamagePerSecond).toLocaleString()} DPS
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-3 gap-2">
                          <span>Duration: {results.individual.poison.duration.toFixed(1)}s</span>
                          <span>Stacks: {results.individual.poison.activeStacks}/{results.individual.poison.totalStacks}</span>
                          <span>Total: {Math.round(results.individual.poison.totalDamage).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ramping' && (
          <div className="space-y-6">
            {/* Ramping Configuration */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Poison Ramping Simulation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Attack Rate (attacks/sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rampingConfig.attackRate}
                    onChange={(e) => setRampingConfig(prev => ({ ...prev, attackRate: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Simulation Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={rampingConfig.simulationDuration}
                    onChange={(e) => setRampingConfig(prev => ({ ...prev, simulationDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Ramping Results */}
            {poisonRamping && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(poisonRamping.peakDPS).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Peak DPS</div>
                  </div>
                  <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(poisonRamping.averageDPS).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average DPS</div>
                  </div>
                  <div className="text-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(poisonRamping.peakDPS / poisonRamping.averageDPS * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Peak Efficiency</div>
                  </div>
                </div>

                {/* DPS Over Time Chart (simplified text representation) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">DPS Over Time</h4>
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
                    {poisonRamping.dpsOverTime
                      .filter((_: any, index: number) => index % 10 === 0) // Show every second
                      .slice(0, 20) // Show first 20 seconds max
                      .map((point: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{point.time.toFixed(1)}s:</span>
                          <span>{Math.round(point.dps).toLocaleString()} DPS</span>
                          <span>({point.activeStacks} stacks)</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mechanics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bleeding Mechanics */}
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🩸 Bleeding</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• <strong>Base:</strong> 15% of physical hit damage per second</li>
                  <li>• <strong>Duration:</strong> 5 seconds</li>
                  <li>• <strong>Stacking:</strong> Does not stack (highest damage only)</li>
                  <li>• <strong>Movement:</strong> 3x damage when target moves</li>
                  <li>• <strong>Bypass:</strong> Energy shield ignored</li>
                  <li>• <strong>Source:</strong> Physical attack damage only</li>
                </ul>
              </div>

              {/* Ignite Mechanics */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🔥 Ignite</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• <strong>Base:</strong> 90% of fire hit damage per second</li>
                  <li>• <strong>Duration:</strong> 4 seconds</li>
                  <li>• <strong>Stacking:</strong> Does not stack (highest damage only)</li>
                  <li>• <strong>Critical:</strong> Fire crits guarantee ignite</li>
                  <li>• <strong>Scaling:</strong> Hit damage directly affects ignite</li>
                  <li>• <strong>Source:</strong> Fire damage hits</li>
                </ul>
              </div>

              {/* Poison Mechanics */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">☠️ Poison</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• <strong>Base:</strong> 30% of (physical + chaos) per second</li>
                  <li>• <strong>Duration:</strong> 2 seconds</li>
                  <li>• <strong>Stacking:</strong> Stackable (default limit: 1)</li>
                  <li>• <strong>Bypass:</strong> Energy shield ignored</li>
                  <li>• <strong>Ramping:</strong> DPS increases with more stacks</li>
                  <li>• <strong>Source:</strong> Physical or chaos damage</li>
                </ul>
              </div>
            </div>

            {/* General DoT Information */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">PoE 2 DoT Changes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Changes from PoE 1:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• No automatic critical ailment application</li>
                    <li>• No 50% DoT multiplier for crits</li>
                    <li>• Hit damage scaling is primary factor</li>
                    <li>• Ailment chance requires investment</li>
                    <li>• Duration scaling affects total damage, not DPS</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Optimization Tips:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Focus on hit damage first</li>
                    <li>• Invest in ailment chance</li>
                    <li>• For poison: increase stack limits</li>
                    <li>• For bleeding: utilize enemy movement</li>
                    <li>• Use "faster ailment" over duration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}