/**
 * Path of Exile 2 Damage Calculation Engine (Patch 0.3)
 *
 * Major changes from PoE 1:
 * - Spirit system instead of mana reservation
 * - Uncut gems for support
 * - Combo system for melee
 * - New resistance calculations
 * - Dodge roll mechanics
 */

import type {
  CharacterDetails,
  CharacterStats,
  CharacterItem
} from '@/types/character';
import type {
  SpiritSystem,
  UncutGemSupport,
  ComboSystem,
  HonorSystem,
  WeaponSet
} from '@/types/poe2Systems';

export interface PoE2DamageCalculation {
  // Base values
  baseDamage: DamageRange;
  elementalDamage: ElementalDamage;

  // Multipliers
  attackSpeed: number;
  criticalChance: number;
  criticalMultiplier: number;

  // PoE 2 specific
  comboMultiplier: number;
  spiritEfficiency: number;

  // Final calculations
  dpsWithoutCrit: number;
  dpsWithCrit: number;
  effectiveDps: number;

  // Defensive
  effectiveHp: number;
  maxHit: MaxHitCalculation;
  resistances: ResistanceCalculation;
}

export interface DamageRange {
  min: number;
  max: number;
  average: number;
}

export interface ElementalDamage {
  fire: DamageRange;
  cold: DamageRange;
  lightning: DamageRange;
  chaos: DamageRange;
}

export interface MaxHitCalculation {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

export interface ResistanceCalculation {
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
  // PoE 2 specific
  honor: number;
  maxResistances: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
  };
}

export class PoE2Calculator {
  /**
   * Calculate damage for Path of Exile 2 skills
   */
  static calculateDamage(
    character: CharacterDetails,
    weaponSet: WeaponSet,
    spiritSystem: SpiritSystem,
    comboSystem?: ComboSystem
  ): PoE2DamageCalculation {
    // Get base weapon damage
    const baseDamage = this.calculateBaseDamage(weaponSet);

    // Apply combo multiplier for melee
    const comboMultiplier = comboSystem
      ? this.calculateComboMultiplier(comboSystem)
      : 1.0;

    // Calculate elemental damage (including conversions)
    const elementalDamage = this.calculateElementalDamage(
      baseDamage,
      character.items
    );

    // Get attack/cast speed
    const attackSpeed = this.calculateAttackSpeed(
      weaponSet,
      character.stats
    );

    // Critical calculations
    const criticalChance = this.calculateCriticalChance(
      weaponSet,
      character.stats
    );
    const criticalMultiplier = this.calculateCriticalMultiplier(
      character.stats
    );

    // Spirit efficiency affects damage
    const spiritEfficiency = this.calculateSpiritEfficiency(spiritSystem);

    // Calculate DPS
    const avgDamage = baseDamage.average * comboMultiplier * spiritEfficiency;
    const dpsWithoutCrit = avgDamage * attackSpeed;
    const dpsWithCrit = avgDamage * attackSpeed *
      (1 + (criticalChance / 100) * (criticalMultiplier / 100 - 1));

    // Defensive calculations
    const effectiveHp = this.calculateEffectiveHp(character.stats);
    const maxHit = this.calculateMaxHit(character.stats);
    const resistances = this.calculateResistances(character.stats);

    return {
      baseDamage,
      elementalDamage,
      attackSpeed,
      criticalChance,
      criticalMultiplier,
      comboMultiplier,
      spiritEfficiency,
      dpsWithoutCrit,
      dpsWithCrit,
      effectiveDps: dpsWithCrit,
      effectiveHp,
      maxHit,
      resistances
    };
  }

  /**
   * Calculate base weapon damage
   */
  private static calculateBaseDamage(weaponSet: WeaponSet): DamageRange {
    if (!weaponSet.mainHand) {
      return { min: 1, max: 2, average: 1.5 };
    }

    // Parse weapon damage from mods
    const damageMod = weaponSet.mainHand.mods.find(mod =>
      mod.includes('Physical Damage')
    );

    if (!damageMod) {
      return { min: 1, max: 2, average: 1.5 };
    }

    // Extract damage values (e.g., "100-200 Physical Damage")
    const match = damageMod.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return {
        min,
        max,
        average: (min + max) / 2
      };
    }

    return { min: 1, max: 2, average: 1.5 };
  }

  /**
   * Calculate combo multiplier for melee builds
   */
  private static calculateComboMultiplier(comboSystem: ComboSystem): number {
    if (comboSystem.currentCombo === 0) return 1.0;

    // Each combo step increases damage
    // In PoE 2, combos can go up to 3-4 steps with increasing multipliers
    const baseMultiplier = 1.0;
    const perComboBonus = 0.25; // 25% more damage per combo

    return baseMultiplier + (comboSystem.currentCombo * perComboBonus);
  }

  /**
   * Calculate elemental damage including conversions
   */
  private static calculateElementalDamage(
    physicalDamage: DamageRange,
    items: CharacterItem[]
  ): ElementalDamage {
    const elemental: ElementalDamage = {
      fire: { min: 0, max: 0, average: 0 },
      cold: { min: 0, max: 0, average: 0 },
      lightning: { min: 0, max: 0, average: 0 },
      chaos: { min: 0, max: 0, average: 0 }
    };

    // Check for damage conversion mods
    items.forEach(item => {
      item.explicitMods?.forEach(mod => {
        // Fire conversion
        if (mod.includes('% of Physical Damage Converted to Fire')) {
          const match = mod.match(/(\d+)%/);
          if (match) {
            const percent = parseInt(match[1]) / 100;
            elemental.fire.min += physicalDamage.min * percent;
            elemental.fire.max += physicalDamage.max * percent;
            elemental.fire.average = (elemental.fire.min + elemental.fire.max) / 2;
          }
        }

        // Added elemental damage
        if (mod.includes('Adds') && mod.includes('Damage')) {
          const match = mod.match(/(\d+) to (\d+)/);
          if (match) {
            const min = parseInt(match[1]);
            const max = parseInt(match[2]);

            if (mod.includes('Fire')) {
              elemental.fire.min += min;
              elemental.fire.max += max;
              elemental.fire.average = (elemental.fire.min + elemental.fire.max) / 2;
            } else if (mod.includes('Cold')) {
              elemental.cold.min += min;
              elemental.cold.max += max;
              elemental.cold.average = (elemental.cold.min + elemental.cold.max) / 2;
            } else if (mod.includes('Lightning')) {
              elemental.lightning.min += min;
              elemental.lightning.max += max;
              elemental.lightning.average = (elemental.lightning.min + elemental.lightning.max) / 2;
            }
          }
        }
      });
    });

    return elemental;
  }

  /**
   * Calculate attack speed
   */
  private static calculateAttackSpeed(
    weaponSet: WeaponSet,
    stats: CharacterStats
  ): number {
    // Base attack speed from weapon
    let baseSpeed = 1.2; // Default

    if (weaponSet.mainHand) {
      const speedMod = weaponSet.mainHand.mods.find(mod =>
        mod.includes('Attacks per Second')
      );
      if (speedMod) {
        const match = speedMod.match(/(\d+\.?\d*)/);
        if (match) {
          baseSpeed = parseFloat(match[1]);
        }
      }
    }

    // Apply increased attack speed from stats
    return baseSpeed * (1 + stats.attackSpeed / 100);
  }

  /**
   * Calculate critical strike chance
   */
  private static calculateCriticalChance(
    weaponSet: WeaponSet,
    stats: CharacterStats
  ): number {
    let baseCrit = 5.0; // Default 5%

    if (weaponSet.mainHand) {
      const critMod = weaponSet.mainHand.mods.find(mod =>
        mod.includes('Critical Strike Chance')
      );
      if (critMod) {
        const match = critMod.match(/(\d+\.?\d*)%/);
        if (match) {
          baseCrit = parseFloat(match[1]);
        }
      }
    }

    // Apply increases from passive tree and gear
    return Math.min(100, baseCrit * (1 + stats.criticalStrikeChance / 100));
  }

  /**
   * Calculate critical strike multiplier
   */
  private static calculateCriticalMultiplier(stats: CharacterStats): number {
    // Base is 150% in PoE 2
    return 150 + stats.criticalStrikeMultiplier;
  }

  /**
   * Calculate spirit efficiency
   * In PoE 2, spirit affects the power of persistent buffs
   */
  private static calculateSpiritEfficiency(spiritSystem: SpiritSystem): number {
    const usageRatio = spiritSystem.usedSpirit / spiritSystem.maxSpirit;

    // Optimal usage is around 75-90%
    if (usageRatio >= 0.75 && usageRatio <= 0.9) {
      return 1.1; // 10% bonus for optimal usage
    } else if (usageRatio > 0.9) {
      return 1.0; // No penalty but no bonus
    } else {
      // Under-utilization reduces effectiveness
      return 0.9 + (usageRatio * 0.133); // Scale from 0.9 to 1.0
    }
  }

  /**
   * Calculate effective HP considering all defenses
   */
  private static calculateEffectiveHp(stats: CharacterStats): number {
    const baseEhp = stats.life.max + stats.energyShield.max;

    // Factor in armor mitigation (simplified)
    const armorMitigation = 1 + (stats.armour / 10000);

    // Factor in evasion (simplified)
    const evasionMitigation = 1 + (stats.evasion / 20000);

    // Average elemental resistance mitigation
    const avgElementalResist = (
      stats.resistances.fire +
      stats.resistances.cold +
      stats.resistances.lightning
    ) / 3;
    const elementalMitigation = 100 / (100 - avgElementalResist);

    return baseEhp * armorMitigation * evasionMitigation * elementalMitigation;
  }

  /**
   * Calculate maximum hit that can be survived
   */
  private static calculateMaxHit(stats: CharacterStats): MaxHitCalculation {
    const totalHp = stats.life.max + stats.energyShield.max;

    // Physical max hit (considering armor)
    const physicalReduction = Math.min(90, stats.armour / 100); // Simplified
    const physicalMaxHit = totalHp / (1 - physicalReduction / 100);

    // Elemental max hits
    const fireMaxHit = totalHp / (1 - stats.resistances.fire / 100);
    const coldMaxHit = totalHp / (1 - stats.resistances.cold / 100);
    const lightningMaxHit = totalHp / (1 - stats.resistances.lightning / 100);
    const chaosMaxHit = totalHp / (1 - Math.max(-60, stats.resistances.chaos) / 100);

    return {
      physical: Math.floor(physicalMaxHit),
      fire: Math.floor(fireMaxHit),
      cold: Math.floor(coldMaxHit),
      lightning: Math.floor(lightningMaxHit),
      chaos: Math.floor(chaosMaxHit)
    };
  }

  /**
   * Calculate resistances including PoE 2 specifics
   */
  private static calculateResistances(stats: CharacterStats): ResistanceCalculation {
    return {
      fire: Math.min(stats.resistances.fire, 75),
      cold: Math.min(stats.resistances.cold, 75),
      lightning: Math.min(stats.resistances.lightning, 75),
      chaos: Math.min(stats.resistances.chaos, 75),
      honor: 0, // TODO: Implement honor resistance when API provides it
      maxResistances: {
        fire: 75, // Can be increased with passives
        cold: 75,
        lightning: 75,
        chaos: 75
      }
    };
  }
}