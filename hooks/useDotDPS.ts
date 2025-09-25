'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCharacterDetails } from './useCharacter';
import PoE2DotDPSCalculator, { DotAilmentStats, DotModifiers } from '@/lib/calculator/poe2DotDpsCalculator';

interface UseDotDPSOptions {
  ailmentTypes?: ('bleeding' | 'ignite' | 'poison')[];
  customModifiers?: Partial<DotModifiers>;
  enemyMoving?: boolean;
  poisonStacks?: number;
}

interface UseDotDPSReturn {
  dotDPS: any | null;
  poisonRamping: any | null;
  isLoading: boolean;
  error: string | null;
  calculate: (options: UseDotDPSOptions) => void;
  extractedStats: DotAilmentStats | null;
  extractedModifiers: DotModifiers | null;
}

export function useDotDPS(characterName?: string): UseDotDPSReturn {
  const { data: characterDetails, isLoading: characterLoading } = useCharacterDetails(characterName || '');
  const [dotDPS, setDotDPS] = useState<any | null>(null);
  const [poisonRamping, setPoisonRamping] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculator = PoE2DotDPSCalculator.getInstance();

  // Extract ailment stats from character equipment
  const extractedStats = useMemo((): DotAilmentStats | null => {
    if (!characterDetails) return null;

    // Find main hand weapon for damage calculation
    const weapon = characterDetails.equipment?.find((item: any) =>
      item?.inventoryId === 'Weapon'
    );

    let physicalDamage = 0;
    let fireDamage = 0;
    let chaosDamage = 0;

    if (weapon && weapon.properties) {
      // Parse weapon damage properties
      weapon.properties.forEach((prop: any) => {
        if (prop.name === 'Physical Damage' && prop.values && prop.values[0]) {
          const damageRange = prop.values[0][0];
          const match = damageRange.match(/(\d+)-(\d+)/);
          if (match) {
            const minDamage = parseInt(match[1]);
            const maxDamage = parseInt(match[2]);
            physicalDamage = (minDamage + maxDamage) / 2;
          }
        } else if (prop.name.includes('Fire Damage') && prop.values && prop.values[0]) {
          const damageRange = prop.values[0][0];
          const match = damageRange.match(/(\d+)-(\d+)/);
          if (match) {
            const minDamage = parseInt(match[1]);
            const maxDamage = parseInt(match[2]);
            fireDamage += (minDamage + maxDamage) / 2;
          }
        } else if (prop.name.includes('Chaos Damage') && prop.values && prop.values[0]) {
          const damageRange = prop.values[0][0];
          const match = damageRange.match(/(\d+)-(\d+)/);
          if (match) {
            const minDamage = parseInt(match[1]);
            const maxDamage = parseInt(match[2]);
            chaosDamage += (minDamage + maxDamage) / 2;
          }
        }
      });
    }

    const totalDamage = physicalDamage + fireDamage + chaosDamage;

    return {
      baseDamage: totalDamage,
      damageType: 'mixed',
      physicalDamage,
      fireDamage,
      chaosDamage
    };
  }, [characterDetails]);

  // Extract DoT modifiers from character data
  const extractedModifiers = useMemo((): DotModifiers | null => {
    if (!characterDetails) return null;

    const baseModifiers: DotModifiers = {
      increasedDotDamage: 0,
      moreDotDamage: 0,
      increasedDotDuration: 0,
      moreDotDuration: 0,
      dotDamageMultiplier: 1,
      increasedBleedingDamage: 0,
      increasedIgniteDamage: 0,
      increasedPoisonDamage: 0,
      bleedingDamageWhileMoving: 200,
      poisonStackLimit: 1,
      ailmentChance: 0,
      bleedingDuration: 5,
      igniteDuration: 4,
      poisonDuration: 2,
      ailmentDamageFromHit: 100
    };

    // Extract modifiers from passive tree (simplified estimates)
    if (characterDetails.passives?.hashes) {
      const level = characterDetails.level || 1;
      const className = characterDetails.class || '';

      // Estimate DoT modifiers based on character progression and class
      if (className.toLowerCase().includes('witch') ||
          className.toLowerCase().includes('sorceress') ||
          className.toLowerCase().includes('infernalist')) {
        // Fire/DoT focused classes
        baseModifiers.increasedDotDamage = Math.min(120, level * 2);
        baseModifiers.increasedIgniteDamage = Math.min(80, level * 1.5);
        baseModifiers.ailmentChance = Math.min(75, level * 1.2);
      } else if (className.toLowerCase().includes('ranger') ||
                 className.toLowerCase().includes('monk')) {
        // Poison/physical DoT classes
        baseModifiers.increasedDotDamage = Math.min(80, level * 1.5);
        baseModifiers.increasedPoisonDamage = Math.min(100, level * 1.8);
        baseModifiers.poisonStackLimit = Math.min(10, Math.floor(level / 10) + 1);
        baseModifiers.ailmentChance = Math.min(60, level);
      } else if (className.toLowerCase().includes('warrior') ||
                 className.toLowerCase().includes('mercenary')) {
        // Physical/bleeding focused classes
        baseModifiers.increasedDotDamage = Math.min(60, level * 1.2);
        baseModifiers.increasedBleedingDamage = Math.min(120, level * 2);
        baseModifiers.ailmentChance = Math.min(50, level * 0.8);
      }
    }

    // Extract ailment chance from equipment (simplified)
    let equipmentAilmentChance = 0;
    characterDetails.equipment?.forEach((item: any) => {
      if (item?.explicitMods) {
        item.explicitMods.forEach((mod: string) => {
          // Look for ailment chance modifiers
          const ailmentChanceMatch = mod.match(/(\d+)%.*chance.*ailment/i);
          if (ailmentChanceMatch) {
            equipmentAilmentChance += parseInt(ailmentChanceMatch[1]);
          }
        });
      }
    });

    baseModifiers.ailmentChance = Math.min(100, baseModifiers.ailmentChance + equipmentAilmentChance);

    return baseModifiers;
  }, [characterDetails]);

  const calculate = async (options: UseDotDPSOptions) => {
    if (!extractedStats || !extractedModifiers) return;

    setIsLoading(true);
    setError(null);

    try {
      // Merge extracted modifiers with custom ones
      const modifiers = {
        ...extractedModifiers,
        ...options.customModifiers
      } as DotModifiers;

      // Configure ailments
      const ailmentConfig = {
        bleeding: {
          enabled: options.ailmentTypes?.includes('bleeding') || false,
          enemyMoving: options.enemyMoving || false
        },
        ignite: {
          enabled: options.ailmentTypes?.includes('ignite') || false
        },
        poison: {
          enabled: options.ailmentTypes?.includes('poison') || false,
          stacks: options.poisonStacks || 1
        }
      };

      const result = calculator.calculateCombinedDoT(
        extractedStats,
        modifiers,
        ailmentConfig
      );

      setDotDPS(result);

      // Calculate poison ramping if poison is enabled
      if (ailmentConfig.poison.enabled) {
        const attackSpeed = 1.5; // Estimated attack speed - could extract from character
        const ramping = calculator.simulatePoisonRamping(
          extractedStats,
          modifiers,
          attackSpeed,
          10
        );
        setPoisonRamping(ramping);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate DoT DPS');
      console.error('DoT DPS calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dotDPS,
    poisonRamping,
    isLoading: isLoading || characterLoading,
    error,
    calculate,
    extractedStats,
    extractedModifiers
  };
}