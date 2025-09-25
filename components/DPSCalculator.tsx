'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import { passiveTreeService } from '@/lib/passiveTree/treeDataService';
import { poe2DpsCalculator } from '@/lib/calculator/poe2DpsCalculator';
import LoadingSpinner from './LoadingSpinner';
import type { PoE2DPSCalculation } from '@/lib/calculator/poe2DpsCalculator';
import type { AllocatedPassives } from '@/types/passiveTree';

interface DPSCalculatorProps {
  characterName: string;
  className?: string;
}

export default function DPSCalculator({
  characterName,
  className = ''
}: DPSCalculatorProps) {
  const { data: characterDetails, isLoading, error } = useCharacterDetails(characterName);
  const [dpsResult, setDpsResult] = useState<PoE2DPSCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [enemyLevel, setEnemyLevel] = useState(70);
  const [enemyEvasion, setEnemyEvasion] = useState(0);

  // Load tree data
  useEffect(() => {
    const loadTreeData = async () => {
      try {
        const data = await passiveTreeService.loadTreeData();
        setTreeData(data);
      } catch (error) {
        console.error('Failed to load tree data:', error);
      }
    };
    loadTreeData();
  }, []);

  // Calculate allocated passives
  const allocated = useMemo((): AllocatedPassives => {
    if (characterDetails?.passives) {
      return {
        nodes: new Set(characterDetails.passives.hashes || []),
        classStartNode: characterDetails.passives.class_start_node || 1,
        pointsUsed: characterDetails.passives.hashes?.length || 0
      };
    }
    return { nodes: new Set(), classStartNode: 1, pointsUsed: 0 };
  }, [characterDetails]);

  // Calculate DPS when data changes
  useEffect(() => {
    if (characterDetails && treeData && !calculating) {
      calculateDPS();
    }
  }, [characterDetails, treeData, selectedSkill, enemyLevel, enemyEvasion]);

  const calculateDPS = async () => {
    if (!characterDetails || !treeData) return;

    setCalculating(true);
    try {
      const result = poe2DpsCalculator.calculateDPS(
        characterDetails,
        allocated,
        treeData,
        selectedSkill || undefined
      );

      // Apply enemy configuration
      result.calculations.enemyEvasion = enemyEvasion;
      const newHitChance = poe2DpsCalculator['calculatePoE2HitChance'](
        result.calculations.accuracyRating,
        enemyEvasion
      );
      result.hitChance = newHitChance;

      // Recalculate effective DPS with new hit chance
      const effectiveMultiplier = newHitChance / 100;
      result.effectiveDPS = result.skillDPS * effectiveMultiplier;
      result.totalDPS = result.effectiveDPS;

      setDpsResult(result);
    } catch (error) {
      console.error('PoE 2 DPS calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
  };

  const getWeaponInfo = () => {
    const weapon = characterDetails?.items.find(
      item => item.inventoryId === 'Weapon' || item.inventoryId === 'Weapon1'
    );
    return {
      name: weapon?.name || weapon?.typeLine || 'Unarmed',
      type: weapon?.typeLine || 'Basic Attack'
    };
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

  if (error || !characterDetails) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            PoE 2 DPS Calculator Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load character data for accurate PoE 2 DPS calculation.
          </p>
        </div>
      </div>
    );
  }

  const weaponInfo = getWeaponInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with PoE 2 Badge */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">PoE 2 Accurate DPS Calculator</h2>
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                Early Access Ready
              </span>
            </div>
            <p className="text-purple-100">
              {characterDetails.name} • {weaponInfo.name}
            </p>
          </div>
          <button
            onClick={calculateDPS}
            disabled={calculating}
            className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 disabled:opacity-50"
          >
            {calculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>

        {/* Main DPS Display */}
        {dpsResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-3xl font-bold">{formatNumber(dpsResult.totalDPS)}</div>
              <div className="text-purple-100 text-sm">Effective DPS</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-2xl font-bold">{formatNumber(dpsResult.skillDPS)}</div>
              <div className="text-purple-100 text-sm">Skill DPS</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-2xl font-bold">{formatNumber(dpsResult.comboDPS)}</div>
              <div className="text-purple-100 text-sm">Combo DPS</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
              <div className="text-2xl font-bold">{dpsResult.spiritEfficiency.toFixed(1)}</div>
              <div className="text-purple-100 text-sm">DPS per Spirit</div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          PoE 2 Calculation Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Skill Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Active Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">Auto-detect (Basic Attack)</option>
              {characterDetails.skills?.map((skill, idx) => (
                <option key={idx} value={skill.name}>
                  {skill.name} (Level {skill.activeGem?.level || 1})
                </option>
              ))}
            </select>
          </div>

          {/* Enemy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enemy Level
            </label>
            <input
              type="number"
              value={enemyLevel}
              onChange={(e) => setEnemyLevel(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              min="1"
              max="100"
            />
          </div>

          {/* Enemy Evasion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enemy Evasion
            </label>
            <input
              type="number"
              value={enemyEvasion}
              onChange={(e) => setEnemyEvasion(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      {dpsResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PoE 2 Damage Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              PoE 2 Damage Analysis
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Physical DPS:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(dpsResult.physicalDPS)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600 dark:text-red-400">Fire DPS:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatNumber(dpsResult.elementalDPS.fire)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 dark:text-blue-400">Cold DPS:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(dpsResult.elementalDPS.cold)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 dark:text-yellow-400">Lightning DPS:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(dpsResult.elementalDPS.lightning)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-600 dark:text-purple-400">Chaos DPS:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {formatNumber(dpsResult.chaosDPS)}
                </span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Elemental:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(
                    dpsResult.elementalDPS.fire +
                    dpsResult.elementalDPS.cold +
                    dpsResult.elementalDPS.lightning
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* PoE 2 Combat Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              PoE 2 Combat Mechanics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Hit Chance (PoE 2):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dpsResult.hitChance.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Critical Strike Chance:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dpsResult.critChance.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Critical Strike Multiplier:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dpsResult.critMultiplier.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Attacks per Second:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dpsResult.attacksPerSecond.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Damage per Hit:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(dpsResult.damagePerHit)}
                </span>
              </div>
              {dpsResult.comboPointsGenerated > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-purple-600 dark:text-purple-400">Combo Points/sec:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {(dpsResult.comboPointsGenerated * dpsResult.attacksPerSecond).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PoE 2 Formula Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              PoE 2 Calculation Formula
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="mb-3">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">Damage Formula:</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded">
                    (Base + Added) × Effectiveness × (1 + Increased%) × More Multipliers
                  </div>
                </div>
                <div className="mb-3">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">Hit Chance (PoE 2):</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded">
                    Accuracy / (Accuracy + Evasion) × 100
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">Applied Values:</div>
                  <div className="space-y-1 text-xs">
                    <div>Damage Effectiveness: {dpsResult.calculations.damageEffectiveness}%</div>
                    <div>Increased Damage: +{dpsResult.calculations.increasedDamage.toFixed(0)}%</div>
                    <div>More Damage: +{dpsResult.calculations.moreDamage.toFixed(0)}%</div>
                    <div>Final Multiplier: ×{dpsResult.calculations.finalDamageMultiplier.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PoE 2 Accuracy Badge */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
          <span>✓</span> PoE 2 Accurate Calculations
        </h4>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• <strong>Correct Hit Chance:</strong> Uses PoE 2's accuracy/(accuracy+evasion) formula</li>
          <li>• <strong>Proper Damage Formula:</strong> Includes damage effectiveness and correct modifier order</li>
          <li>• <strong>Spirit System:</strong> Calculates spirit costs and DPS efficiency</li>
          <li>• <strong>Combo Mechanics:</strong> Factors in combo point generation and consumption</li>
          <li>• <strong>Weapon Types:</strong> Accurate parsing for all PoE 2 weapon categories</li>
          <li>• <strong>Support Gems:</strong> Includes support gem modifiers and spirit costs</li>
        </ul>
      </div>
    </div>
  );
}