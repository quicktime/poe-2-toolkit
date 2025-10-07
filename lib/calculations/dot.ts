/**
 * DoT (Damage over Time) Calculator
 * Handles ailment calculations for Path of Exile 2 v0.3+
 *
 * PoE2 v0.3 Ailment Mechanics:
 * - Bleeding: 70% of physical damage over 5 seconds (14% per second)
 *   - Triples to 210% (42% per second) when enemy is moving
 * - Ignite: 20% of fire damage per second for 4 seconds
 * - Poison: 30% of (physical + chaos) damage per second for 2 seconds
 *   - Can stack (default limit 1, increasable)
 */

import { ModifierList } from '@/lib/calculator/ModifierList';

export interface AilmentInput {
  baseDamage: DamageBreakdown;
  modifiers: ModifierList;
  config?: AilmentConfig;
}

export interface DamageBreakdown {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

export interface AilmentConfig {
  // Enemy state
  enemyIsMoving?: boolean;
  enemyAilmentThreshold?: number; // For calculating ailment chance

  // Build modifiers
  canBleed?: boolean;
  canIgnite?: boolean;
  canPoison?: boolean;

  // Stacking
  maxPoisonStacks?: number;

  // Duration modifiers (as percentages)
  increasedBleedDuration?: number;
  increasedIgniteDuration?: number;
  increasedPoisonDuration?: number;
}

export interface AilmentOutput {
  bleed: BleedOutput;
  ignite: IgniteOutput;
  poison: PoisonOutput;
  totalDoTDPS: number;
}

export interface BleedOutput {
  canApply: boolean;
  baseDamagePerSecond: number;
  totalDamagePerSecond: number; // After modifiers
  duration: number;
  totalDamage: number;
  movingMultiplier: number;
}

export interface IgniteOutput {
  canApply: boolean;
  baseDamagePerSecond: number;
  totalDamagePerSecond: number;
  duration: number;
  totalDamage: number;
}

export interface PoisonOutput {
  canApply: boolean;
  baseDamagePerSecond: number;
  totalDamagePerSecond: number;
  duration: number;
  totalDamagePerStack: number;
  maxStacks: number;
  totalDPSWithStacks: number;
}

export class DoTCalculator {
  private baseDamage: DamageBreakdown;
  private modifiers: ModifierList;
  private config: AilmentConfig;

  // PoE2 v0.3 Base Values
  private readonly BLEED_BASE_PERCENT = 70; // 70% of physical over 5 seconds
  private readonly BLEED_BASE_DURATION = 5; // seconds
  private readonly BLEED_MOVING_MULTIPLIER = 3; // Triple damage when moving

  private readonly IGNITE_BASE_PERCENT = 20; // 20% of fire per second
  private readonly IGNITE_BASE_DURATION = 4; // seconds

  private readonly POISON_BASE_PERCENT = 30; // 30% of (phys + chaos) per second
  private readonly POISON_BASE_DURATION = 2; // seconds
  private readonly POISON_DEFAULT_MAX_STACKS = 1;

  constructor(input: AilmentInput) {
    this.baseDamage = input.baseDamage;
    this.modifiers = input.modifiers;
    this.config = input.config || {};
  }

  /**
   * Calculate all ailments
   */
  calculate(): AilmentOutput {
    const bleed = this.calculateBleed();
    const ignite = this.calculateIgnite();
    const poison = this.calculatePoison();

    const totalDoTDPS =
      bleed.totalDamagePerSecond +
      ignite.totalDamagePerSecond +
      poison.totalDPSWithStacks;

    return {
      bleed,
      ignite,
      poison,
      totalDoTDPS
    };
  }

  /**
   * Calculate bleeding damage
   * PoE2 v0.3: 70% of physical damage over 5 seconds (14% per second)
   * Triples to 210% (42% per second) when enemy is moving
   */
  private calculateBleed(): BleedOutput {
    const canApply = this.config.canBleed !== false && this.baseDamage.physical > 0;

    if (!canApply) {
      return {
        canApply: false,
        baseDamagePerSecond: 0,
        totalDamagePerSecond: 0,
        duration: 0,
        totalDamage: 0,
        movingMultiplier: 1
      };
    }

    // Base bleed damage: 70% of physical over 5 seconds = 14% per second
    const baseDPS = (this.baseDamage.physical * this.BLEED_BASE_PERCENT / 100) / this.BLEED_BASE_DURATION;

    // Apply increased bleed damage modifiers
    const increasedBleedDamage = this.modifiers.sum('INC', { type: 'damage', subtype: 'bleed' }) +
                                  this.modifiers.sum('INC', { type: 'damage', subtype: 'ailment' }) +
                                  this.modifiers.sum('INC', { type: 'damage', subtype: 'damage_over_time' });

    const increasedPhysicalDoT = this.modifiers.sum('INC', { type: 'damage', subtype: 'physical_dot' });

    const totalIncreased = increasedBleedDamage + increasedPhysicalDoT;

    // Apply more multipliers
    const moreBleedDamage = this.modifiers.more({ type: 'damage', subtype: 'bleed' });
    const moreAilmentDamage = this.modifiers.more({ type: 'damage', subtype: 'ailment' });
    const moreDoTDamage = this.modifiers.more({ type: 'damage', subtype: 'damage_over_time' });

    const totalMore = moreBleedDamage * moreAilmentDamage * moreDoTDamage;

    // Calculate final DPS
    let totalDPS = baseDPS * (1 + totalIncreased / 100) * totalMore;

    // Apply moving multiplier if configured
    const movingMultiplier = this.config.enemyIsMoving ? this.BLEED_MOVING_MULTIPLIER : 1;
    totalDPS *= movingMultiplier;

    // Calculate duration with modifiers
    const increasedDuration = (this.config.increasedBleedDuration || 0) +
                              this.modifiers.sum('INC', { type: 'duration', subtype: 'bleed' }) +
                              this.modifiers.sum('INC', { type: 'duration', subtype: 'ailment' });

    const duration = this.BLEED_BASE_DURATION * (1 + increasedDuration / 100);

    return {
      canApply: true,
      baseDamagePerSecond: baseDPS,
      totalDamagePerSecond: totalDPS,
      duration,
      totalDamage: totalDPS * duration,
      movingMultiplier
    };
  }

  /**
   * Calculate ignite damage
   * PoE2 v0.3: 20% of fire damage per second for 4 seconds
   */
  private calculateIgnite(): IgniteOutput {
    const canApply = this.config.canIgnite !== false && this.baseDamage.fire > 0;

    if (!canApply) {
      return {
        canApply: false,
        baseDamagePerSecond: 0,
        totalDamagePerSecond: 0,
        duration: 0,
        totalDamage: 0
      };
    }

    // Base ignite damage: 20% of fire per second
    const baseDPS = this.baseDamage.fire * (this.IGNITE_BASE_PERCENT / 100);

    // Apply increased ignite damage modifiers
    const increasedIgniteDamage = this.modifiers.sum('INC', { type: 'damage', subtype: 'ignite' }) +
                                   this.modifiers.sum('INC', { type: 'damage', subtype: 'ailment' }) +
                                   this.modifiers.sum('INC', { type: 'damage', subtype: 'damage_over_time' });

    const increasedFireDoT = this.modifiers.sum('INC', { type: 'damage', subtype: 'fire_dot' });
    const increasedBurningDamage = this.modifiers.sum('INC', { type: 'damage', subtype: 'burning' });

    const totalIncreased = increasedIgniteDamage + increasedFireDoT + increasedBurningDamage;

    // Apply more multipliers
    const moreIgniteDamage = this.modifiers.more({ type: 'damage', subtype: 'ignite' });
    const moreAilmentDamage = this.modifiers.more({ type: 'damage', subtype: 'ailment' });
    const moreDoTDamage = this.modifiers.more({ type: 'damage', subtype: 'damage_over_time' });

    const totalMore = moreIgniteDamage * moreAilmentDamage * moreDoTDamage;

    // Calculate final DPS
    const totalDPS = baseDPS * (1 + totalIncreased / 100) * totalMore;

    // Calculate duration with modifiers
    const increasedDuration = (this.config.increasedIgniteDuration || 0) +
                              this.modifiers.sum('INC', { type: 'duration', subtype: 'ignite' }) +
                              this.modifiers.sum('INC', { type: 'duration', subtype: 'ailment' });

    const duration = this.IGNITE_BASE_DURATION * (1 + increasedDuration / 100);

    return {
      canApply: true,
      baseDamagePerSecond: baseDPS,
      totalDamagePerSecond: totalDPS,
      duration,
      totalDamage: totalDPS * duration
    };
  }

  /**
   * Calculate poison damage
   * PoE2 v0.3: 30% of (physical + chaos) damage per second for 2 seconds
   * Can stack (default limit 1, increasable)
   */
  private calculatePoison(): PoisonOutput {
    const combinedDamage = this.baseDamage.physical + this.baseDamage.chaos;
    const canApply = this.config.canPoison !== false && combinedDamage > 0;

    if (!canApply) {
      return {
        canApply: false,
        baseDamagePerSecond: 0,
        totalDamagePerSecond: 0,
        duration: 0,
        totalDamagePerStack: 0,
        maxStacks: 0,
        totalDPSWithStacks: 0
      };
    }

    // Base poison damage: 30% of (physical + chaos) per second
    const baseDPS = combinedDamage * (this.POISON_BASE_PERCENT / 100);

    // Apply increased poison damage modifiers
    const increasedPoisonDamage = this.modifiers.sum('INC', { type: 'damage', subtype: 'poison' }) +
                                   this.modifiers.sum('INC', { type: 'damage', subtype: 'ailment' }) +
                                   this.modifiers.sum('INC', { type: 'damage', subtype: 'damage_over_time' });

    const increasedChaosDoT = this.modifiers.sum('INC', { type: 'damage', subtype: 'chaos_dot' });

    const totalIncreased = increasedPoisonDamage + increasedChaosDoT;

    // Apply more multipliers
    const morePoisonDamage = this.modifiers.more({ type: 'damage', subtype: 'poison' });
    const moreAilmentDamage = this.modifiers.more({ type: 'damage', subtype: 'ailment' });
    const moreDoTDamage = this.modifiers.more({ type: 'damage', subtype: 'damage_over_time' });

    const totalMore = morePoisonDamage * moreAilmentDamage * moreDoTDamage;

    // Calculate final DPS per stack
    const totalDPS = baseDPS * (1 + totalIncreased / 100) * totalMore;

    // Calculate duration with modifiers
    const increasedDuration = (this.config.increasedPoisonDuration || 0) +
                              this.modifiers.sum('INC', { type: 'duration', subtype: 'poison' }) +
                              this.modifiers.sum('INC', { type: 'duration', subtype: 'ailment' });

    const duration = this.POISON_BASE_DURATION * (1 + increasedDuration / 100);

    // Calculate max stacks
    const maxStacks = this.config.maxPoisonStacks || this.POISON_DEFAULT_MAX_STACKS;
    const increasedMaxStacks = this.modifiers.sum('ADDED', { type: 'ailment', subtype: 'max_poison_stacks' });
    const finalMaxStacks = maxStacks + increasedMaxStacks;

    // Total DPS with all stacks
    const totalDPSWithStacks = totalDPS * finalMaxStacks;

    return {
      canApply: true,
      baseDamagePerSecond: baseDPS,
      totalDamagePerSecond: totalDPS,
      duration,
      totalDamagePerStack: totalDPS * duration,
      maxStacks: finalMaxStacks,
      totalDPSWithStacks
    };
  }

  /**
   * Calculate effective DPS against an enemy with resistances
   */
  calculateEffectiveDPS(enemyResistances: { physical?: number; fire?: number; chaos?: number }): number {
    const output = this.calculate();

    const bleedReduction = 1 - ((enemyResistances.physical || 0) / 100);
    const igniteReduction = 1 - ((enemyResistances.fire || 0) / 100);
    const poisonReduction = 1 - ((enemyResistances.chaos || 0) / 100);

    const effectiveBleed = output.bleed.totalDamagePerSecond * Math.max(0, bleedReduction);
    const effectiveIgnite = output.ignite.totalDamagePerSecond * Math.max(0, igniteReduction);
    const effectivePoison = output.poison.totalDPSWithStacks * Math.max(0, poisonReduction);

    return effectiveBleed + effectiveIgnite + effectivePoison;
  }
}

export default DoTCalculator;
