'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCharacterDetails } from './useCharacter';
import PoE2MinionDPSCalculator, { MinionModifiers } from '@/lib/calculator/poe2MinionDpsCalculator';

interface UseMinionDPSOptions {
  minionType?: string;
  gemLevel?: number;
  supportGems?: string[];
  customModifiers?: Partial<MinionModifiers>;
}

interface UseMinionDPSReturn {
  minionDPS: any | null;
  isLoading: boolean;
  error: string | null;
  calculate: (options: UseMinionDPSOptions) => void;
  getOptimalBuild: (availableSpirit: number) => any;
  extractedModifiers: MinionModifiers | null;
}

export function useMinionDPS(characterName?: string): UseMinionDPSReturn {
  const { data: characterDetails, isLoading: characterLoading } = useCharacterDetails(characterName || '');
  const [minionDPS, setMinionDPS] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculator = PoE2MinionDPSCalculator.getInstance();

  // Extract minion modifiers from character data
  const extractedModifiers = useMemo((): MinionModifiers | null => {
    if (!characterDetails) return null;

    // Parse character stats and equipment for minion-related modifiers
    const baseModifiers: MinionModifiers = {
      increasedMinionDamage: 0,
      moreMinionDamage: 0,
      increasedAttackSpeed: 0,
      moreAttackSpeed: 0,
      increasedMinionLife: 0,
      minionDuration: 0,
      additionalMinions: 0,
      spiritEfficiency: 0,
      weaponBaseDamageToMinions: 0
    };

    // Extract weapon base damage for minion scaling
    const weapon = characterDetails.equipment?.find((item: any) =>
      item?.inventoryId === 'Weapon' || item?.inventoryId === 'Weapon2'
    );

    if (weapon && weapon.properties) {
      const damageProperty = weapon.properties.find((prop: any) =>
        prop.name === 'Physical Damage' || prop.name === 'Damage'
      );

      if (damageProperty && damageProperty.values && damageProperty.values[0]) {
        // Parse damage range like "100-150" and take average
        const damageRange = damageProperty.values[0][0];
        const match = damageRange.match(/(\d+)-(\d+)/);
        if (match) {
          const minDamage = parseInt(match[1]);
          const maxDamage = parseInt(match[2]);
          baseModifiers.weaponBaseDamageToMinions = (minDamage + maxDamage) / 2;
        }
      }
    }

    // Extract minion modifiers from passive tree (simplified)
    if (characterDetails.passives?.hashes) {
      // This would require passive tree data to properly calculate
      // For now, provide estimates based on level and class
      const level = characterDetails.level || 1;
      const className = characterDetails.class || '';

      // Estimate modifiers based on character progression
      if (className.toLowerCase().includes('witch') || className.toLowerCase().includes('infernalist')) {
        baseModifiers.increasedMinionDamage = Math.min(100, level * 2); // 2% per level, max 100%
        baseModifiers.increasedMinionLife = Math.min(80, level * 1.5);
        baseModifiers.spiritEfficiency = Math.min(20, level * 0.3);
      } else {
        // Non-minion classes have lower minion bonuses
        baseModifiers.increasedMinionDamage = Math.min(30, level * 0.5);
        baseModifiers.increasedMinionLife = Math.min(20, level * 0.3);
      }
    }

    return baseModifiers;
  }, [characterDetails]);

  const calculate = async (options: UseMinionDPSOptions) => {
    if (!options.minionType) return;

    setIsLoading(true);
    setError(null);

    try {
      // Merge extracted modifiers with custom ones
      const modifiers = {
        ...extractedModifiers,
        ...options.customModifiers
      } as MinionModifiers;

      const result = calculator.calculateMinionDPS(
        options.minionType,
        options.gemLevel || 10,
        modifiers,
        options.supportGems || []
      );

      setMinionDPS(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate minion DPS');
      console.error('Minion DPS calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getOptimalBuild = (availableSpirit: number) => {
    if (!extractedModifiers) return null;

    const minionTypes = calculator.getAvailableMinionTypes();
    const supportGems = calculator.getAvailableSupportGems();

    // Generate multiple build options
    const buildOptions = minionTypes.flatMap(minionType =>
      // Try different support gem combinations
      [
        { type: minionType, gemLevel: 10, supportGems: [], modifiers: extractedModifiers },
        { type: minionType, gemLevel: 10, supportGems: ['Brutality'], modifiers: extractedModifiers },
        { type: minionType, gemLevel: 10, supportGems: ['Battle Speed'], modifiers: extractedModifiers },
        { type: minionType, gemLevel: 10, supportGems: ['Brutality', 'Battle Speed'], modifiers: extractedModifiers },
        { type: minionType, gemLevel: 15, supportGems: ['Minion Damage'], modifiers: extractedModifiers },
      ]
    );

    return calculator.optimizeForSpiritEfficiency(availableSpirit, buildOptions);
  };

  return {
    minionDPS,
    isLoading: isLoading || characterLoading,
    error,
    calculate,
    getOptimalBuild,
    extractedModifiers
  };
}