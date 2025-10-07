/**
 * Damage Conversion Manager for Path of Exile 2 v0.3+
 * Handles damage type conversions and scaling
 *
 * PoE2 v0.3 Conversion Rules:
 * - Conversion order: Physical → Lightning → Cold → Fire → Chaos (one-way only)
 * - Converted damage ONLY scales with its final type (NOT original type like PoE 1)
 * - Skill conversions apply first, then gear/passive conversions
 * - Total conversion from one type cannot exceed 100%
 */

import { ModifierList } from '@/lib/calculator/ModifierList';

export interface DamageBreakdown {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

export interface ConversionStep {
  from: DamageType;
  to: DamageType;
  percentage: number;
  source: 'skill' | 'gear' | 'passive';
}

export type DamageType = 'physical' | 'lightning' | 'cold' | 'fire' | 'chaos';

export interface ConversionResult {
  finalDamage: DamageBreakdown;
  conversions: ConversionStep[];
  gainAsExtra: { type: DamageType; amount: number }[];
}

export class DamageConversionManager {
  // PoE2 v0.3 Conversion Chain Order
  private readonly CONVERSION_ORDER: DamageType[] = [
    'physical',
    'lightning',
    'cold',
    'fire',
    'chaos',
  ];

  /**
   * Apply all damage conversions in correct order
   * PoE2 v0.3: Physical → Lightning → Cold → Fire → Chaos
   */
  applyConversions(
    baseDamage: DamageBreakdown,
    modifiers: ModifierList,
    skillConversions: ConversionStep[] = []
  ): ConversionResult {
    const result = { ...baseDamage };
    const appliedConversions: ConversionStep[] = [];
    const gainAsExtra: { type: DamageType; amount: number }[] = [];

    // Save original damage values before ANY conversions
    const originalDamage = { ...baseDamage };

    // Step 1: Apply skill conversions first (highest priority)
    skillConversions.forEach(conversion => {
      const converted = this.convertDamage(result, conversion);
      if (converted > 0) {
        appliedConversions.push(conversion);
      }
    });

    // Step 2: Apply conversions from gear and passives
    // Follow the conversion chain order
    // Physical uses originalDamage to account for skill conversions
    // Elemental types use current damage (may have come from prior conversions)
    this.applyPhysicalConversions(result, modifiers, appliedConversions, originalDamage);
    this.applyLightningConversions(result, modifiers, appliedConversions);
    this.applyColdConversions(result, modifiers, appliedConversions);
    this.applyFireConversions(result, modifiers, appliedConversions);

    // Step 3: Apply "Gain as Extra" modifiers (does NOT reduce original damage)
    this.applyGainAsExtra(baseDamage, result, modifiers, gainAsExtra);

    return {
      finalDamage: result,
      conversions: appliedConversions,
      gainAsExtra,
    };
  }

  /**
   * Apply physical damage conversions
   * Order: Physical → Lightning → Cold → Fire → Chaos
   */
  private applyPhysicalConversions(
    damage: DamageBreakdown,
    modifiers: ModifierList,
    conversions: ConversionStep[],
    originalDamage: DamageBreakdown
  ): void {
    // Use original physical damage for percentage calculations
    const originalPhysical = originalDamage.physical;

    // Calculate total conversion percentage already applied
    const existingConversion = this.getExistingConversion(conversions, 'physical');

    // Physical → Lightning (first in chain)
    const physToLight = Math.min(
      100 - existingConversion,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_lightning' })
    );
    if (physToLight > 0) {
      const converted = originalPhysical * (physToLight / 100);
      damage.physical -= converted;
      damage.lightning += converted;
      conversions.push({ from: 'physical', to: 'lightning', percentage: physToLight, source: 'gear' });
    }

    // Physical → Cold (second in chain)
    const remainingAfterLight = 100 - existingConversion - physToLight;
    const physToCold = Math.min(
      remainingAfterLight,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_cold' })
    );
    if (physToCold > 0) {
      const converted = originalPhysical * (physToCold / 100);
      damage.physical -= converted;
      damage.cold += converted;
      conversions.push({ from: 'physical', to: 'cold', percentage: physToCold, source: 'gear' });
    }

    // Physical → Fire (third in chain)
    const remainingAfterCold = remainingAfterLight - physToCold;
    const physToFire = Math.min(
      remainingAfterCold,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_fire' })
    );
    if (physToFire > 0) {
      const converted = originalPhysical * (physToFire / 100);
      damage.physical -= converted;
      damage.fire += converted;
      conversions.push({ from: 'physical', to: 'fire', percentage: physToFire, source: 'gear' });
    }

    // Physical → Chaos (last in physical chain)
    const remainingAfterFire = remainingAfterCold - physToFire;
    const physToChaos = Math.min(
      remainingAfterFire,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_chaos' })
    );
    if (physToChaos > 0) {
      const converted = originalPhysical * (physToChaos / 100);
      damage.physical -= converted;
      damage.chaos += converted;
      conversions.push({ from: 'physical', to: 'chaos', percentage: physToChaos, source: 'gear' });
    }
  }

  /**
   * Apply lightning damage conversions
   * Lightning → Cold → Fire → Chaos
   */
  private applyLightningConversions(
    damage: DamageBreakdown,
    modifiers: ModifierList,
    conversions: ConversionStep[]
  ): void {
    // Use CURRENT lightning (may include converted physical)
    const originalLightning = damage.lightning;
    const existingConversion = this.getExistingConversion(conversions, 'lightning');

    // Lightning → Cold
    const lightToCold = Math.min(
      100 - existingConversion,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'lightning_to_cold' })
    );
    if (lightToCold > 0) {
      const converted = originalLightning * (lightToCold / 100);
      damage.lightning -= converted;
      damage.cold += converted;
      conversions.push({ from: 'lightning', to: 'cold', percentage: lightToCold, source: 'gear' });
    }

    // Lightning → Fire
    const remainingAfterCold = 100 - existingConversion - lightToCold;
    const lightToFire = Math.min(
      remainingAfterCold,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'lightning_to_fire' })
    );
    if (lightToFire > 0) {
      const converted = originalLightning * (lightToFire / 100);
      damage.lightning -= converted;
      damage.fire += converted;
      conversions.push({ from: 'lightning', to: 'fire', percentage: lightToFire, source: 'gear' });
    }

    // Lightning → Chaos
    const remainingAfterFire = remainingAfterCold - lightToFire;
    const lightToChaos = Math.min(
      remainingAfterFire,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'lightning_to_chaos' })
    );
    if (lightToChaos > 0) {
      const converted = originalLightning * (lightToChaos / 100);
      damage.lightning -= converted;
      damage.chaos += converted;
      conversions.push({ from: 'lightning', to: 'chaos', percentage: lightToChaos, source: 'gear' });
    }
  }

  /**
   * Apply cold damage conversions
   * Cold → Fire → Chaos
   */
  private applyColdConversions(
    damage: DamageBreakdown,
    modifiers: ModifierList,
    conversions: ConversionStep[]
  ): void {
    // Use CURRENT cold (may include converted lightning/physical)
    const originalCold = damage.cold;
    const existingConversion = this.getExistingConversion(conversions, 'cold');

    // Cold → Fire
    const coldToFire = Math.min(
      100 - existingConversion,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'cold_to_fire' })
    );
    if (coldToFire > 0) {
      const converted = originalCold * (coldToFire / 100);
      damage.cold -= converted;
      damage.fire += converted;
      conversions.push({ from: 'cold', to: 'fire', percentage: coldToFire, source: 'gear' });
    }

    // Cold → Chaos
    const remainingAfterFire = 100 - existingConversion - coldToFire;
    const coldToChaos = Math.min(
      remainingAfterFire,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'cold_to_chaos' })
    );
    if (coldToChaos > 0) {
      const converted = originalCold * (coldToChaos / 100);
      damage.cold -= converted;
      damage.chaos += converted;
      conversions.push({ from: 'cold', to: 'chaos', percentage: coldToChaos, source: 'gear' });
    }
  }

  /**
   * Apply fire damage conversions
   * Fire → Chaos (end of elemental chain)
   */
  private applyFireConversions(
    damage: DamageBreakdown,
    modifiers: ModifierList,
    conversions: ConversionStep[]
  ): void {
    // Use CURRENT fire (may include converted cold/lightning/physical)
    const originalFire = damage.fire;
    const existingConversion = this.getExistingConversion(conversions, 'fire');

    // Fire → Chaos
    const fireToChaos = Math.min(
      100 - existingConversion,
      modifiers.sum('CONVERSION', { type: 'damage', subtype: 'fire_to_chaos' })
    );
    if (fireToChaos > 0) {
      const converted = originalFire * (fireToChaos / 100);
      damage.fire -= converted;
      damage.chaos += converted;
      conversions.push({ from: 'fire', to: 'chaos', percentage: fireToChaos, source: 'gear' });
    }
  }

  /**
   * Apply "Gain as Extra" modifiers
   * These add damage without reducing the original damage
   */
  private applyGainAsExtra(
    baseDamage: DamageBreakdown,
    currentDamage: DamageBreakdown,
    modifiers: ModifierList,
    gainAsExtra: { type: DamageType; amount: number }[]
  ): void {
    // Physical as extra elemental
    const physAsExtraFire = modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_fire' });
    if (physAsExtraFire > 0) {
      const extra = baseDamage.physical * (physAsExtraFire / 100);
      currentDamage.fire += extra;
      gainAsExtra.push({ type: 'fire', amount: extra });
    }

    const physAsExtraCold = modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_cold' });
    if (physAsExtraCold > 0) {
      const extra = baseDamage.physical * (physAsExtraCold / 100);
      currentDamage.cold += extra;
      gainAsExtra.push({ type: 'cold', amount: extra });
    }

    const physAsExtraLight = modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_lightning' });
    if (physAsExtraLight > 0) {
      const extra = baseDamage.physical * (physAsExtraLight / 100);
      currentDamage.lightning += extra;
      gainAsExtra.push({ type: 'lightning', amount: extra });
    }

    const physAsExtraChaos = modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_chaos' });
    if (physAsExtraChaos > 0) {
      const extra = baseDamage.physical * (physAsExtraChaos / 100);
      currentDamage.chaos += extra;
      gainAsExtra.push({ type: 'chaos', amount: extra });
    }

    // Elemental as extra chaos
    const eleAsExtraChaos = modifiers.sum('EXTRA', { type: 'damage', subtype: 'elemental_as_extra_chaos' });
    if (eleAsExtraChaos > 0) {
      const totalElemental = baseDamage.fire + baseDamage.cold + baseDamage.lightning;
      const extra = totalElemental * (eleAsExtraChaos / 100);
      currentDamage.chaos += extra;
      gainAsExtra.push({ type: 'chaos', amount: extra });
    }
  }

  /**
   * Convert a specific amount of damage from one type to another
   */
  private convertDamage(damage: DamageBreakdown, conversion: ConversionStep): number {
    const sourceAmount = damage[conversion.from];
    const convertedAmount = sourceAmount * (conversion.percentage / 100);

    if (convertedAmount > 0) {
      damage[conversion.from] -= convertedAmount;
      damage[conversion.to] += convertedAmount;
    }

    return convertedAmount;
  }

  /**
   * Get total existing conversion percentage for a damage type
   */
  private getExistingConversion(conversions: ConversionStep[], from: DamageType): number {
    return conversions
      .filter(c => c.from === from)
      .reduce((sum, c) => sum + c.percentage, 0);
  }

  /**
   * Validate conversion chain doesn't exceed 100% for any type
   */
  validateConversions(conversions: ConversionStep[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check each damage type doesn't exceed 100% conversion
    this.CONVERSION_ORDER.forEach(damageType => {
      const totalConversion = this.getExistingConversion(conversions, damageType);
      if (totalConversion > 100) {
        errors.push(`${damageType} conversion exceeds 100%: ${totalConversion}%`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate total damage after conversions
   */
  calculateTotalDamage(damage: DamageBreakdown): number {
    return (
      damage.physical +
      damage.fire +
      damage.cold +
      damage.lightning +
      damage.chaos
    );
  }

  /**
   * Get damage breakdown as percentages
   */
  getDamageBreakdownPercentages(damage: DamageBreakdown): Record<DamageType, number> {
    const total = this.calculateTotalDamage(damage);

    if (total === 0) {
      return {
        physical: 0,
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0,
      };
    }

    return {
      physical: (damage.physical / total) * 100,
      fire: (damage.fire / total) * 100,
      cold: (damage.cold / total) * 100,
      lightning: (damage.lightning / total) * 100,
      chaos: (damage.chaos / total) * 100,
    };
  }
}

export default DamageConversionManager;
