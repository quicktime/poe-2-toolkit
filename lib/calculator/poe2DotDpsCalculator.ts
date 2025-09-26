interface DotAilmentStats {
  baseDamage: number; // Hit damage that inflicted the ailment
  damageType: 'physical' | 'fire' | 'chaos' | 'mixed';
  physicalDamage?: number; // For poison calculation
  chaosDamage?: number; // For poison calculation
  fireDamage?: number; // For ignite calculation
}

interface DotModifiers {
  // Generic DoT modifiers
  increasedDotDamage: number;
  moreDotDamage: number;
  increasedDotDuration: number;
  moreDotDuration: number;
  dotDamageMultiplier: number;

  // Ailment-specific modifiers
  increasedBleedingDamage: number;
  increasedIgniteDamage: number;
  increasedPoisonDamage: number;

  // Special modifiers
  bleedingDamageWhileMoving: number; // Default 200% (triples to 300% total)
  poisonStackLimit: number; // Default 1, can be increased
  ailmentChance: number; // Chance to inflict ailment

  // Duration modifiers
  bleedingDuration: number; // Default 5 seconds
  igniteDuration: number; // Default 4 seconds
  poisonDuration: number; // Default 2 seconds

  // Scaling modifiers
  ailmentDamageFromHit: number; // How much hit scaling applies to ailments
}

interface AilmentInstance {
  type: 'bleeding' | 'ignite' | 'poison';
  baseDamagePerSecond: number;
  totalDamage: number;
  duration: number;
  remainingDuration: number;
  stackId: number;
  isHighestDamage: boolean;
}

interface DotCalculationResult {
  type: 'bleeding' | 'ignite' | 'poison';
  baseDamagePerSecond: number;
  effectiveDamagePerSecond: number;
  totalDamage: number;
  duration: number;
  totalStacks: number;
  activeStacks: number;
  breakdown: {
    hitDamage: number;
    ailmentMagnitude: number;
    durationModifiers: number;
    damageModifiers: number;
    stackingBonus?: number;
    movementBonus?: number;
  };
}

class PoE2DotDPSCalculator {
  private static instance: PoE2DotDPSCalculator;

  private constructor() {}

  static getInstance(): PoE2DotDPSCalculator {
    if (!PoE2DotDPSCalculator.instance) {
      PoE2DotDPSCalculator.instance = new PoE2DotDPSCalculator();
    }
    return PoE2DotDPSCalculator.instance;
  }

  // Calculate bleeding DoT based on PoE 2 patch 0.3 mechanics
  calculateBleeding(
    hitStats: DotAilmentStats,
    modifiers: DotModifiers,
    enemyIsMoving: boolean = false
  ): DotCalculationResult {
    // Bleeding: 70% of physical hit damage TOTAL over 5 seconds
    // That's 14% per second (70% / 5 seconds = 14% per second)
    // Triples (300% total) when enemy is moving
    const baseMagnitude = 0.14; // 14% of physical damage per second (70% over 5 seconds)
    const baseDuration = modifiers.bleedingDuration || 5; // 5 seconds default

    // Calculate base DPS
    const physicalHitDamage = hitStats.damageType === 'physical' ? hitStats.baseDamage :
                             hitStats.physicalDamage || 0;

    let baseDamagePerSecond = physicalHitDamage * baseMagnitude;

    // Apply movement multiplier (triples damage)
    if (enemyIsMoving) {
      baseDamagePerSecond *= 3; // 300% total (200% more = 3x)
    }

    // Apply modifiers
    const increasedDamage = 1 + (modifiers.increasedDotDamage + modifiers.increasedBleedingDamage) / 100;
    const moreDamage = 1 + modifiers.moreDotDamage / 100;
    const damageMultiplier = modifiers.dotDamageMultiplier || 1;

    const effectiveDamagePerSecond = baseDamagePerSecond * increasedDamage * moreDamage * damageMultiplier;

    // Calculate duration
    const increasedDuration = 1 + modifiers.increasedDotDuration / 100;
    const moreDuration = 1 + modifiers.moreDotDuration / 100;
    const finalDuration = baseDuration * increasedDuration * moreDuration;

    const totalDamage = effectiveDamagePerSecond * finalDuration;

    return {
      type: 'bleeding',
      baseDamagePerSecond,
      effectiveDamagePerSecond,
      totalDamage,
      duration: finalDuration,
      totalStacks: 1, // Bleeding doesn't stack
      activeStacks: 1,
      breakdown: {
        hitDamage: physicalHitDamage,
        ailmentMagnitude: baseMagnitude,
        durationModifiers: increasedDuration * moreDuration,
        damageModifiers: increasedDamage * moreDamage * damageMultiplier,
        movementBonus: enemyIsMoving ? 3 : 1
      }
    };
  }

  // Calculate ignite DoT based on PoE 2 patch 0.3 mechanics
  calculateIgnite(
    hitStats: DotAilmentStats,
    modifiers: DotModifiers
  ): DotCalculationResult {
    // Ignite: 20% of fire hit damage per second for 4 seconds
    // This is the correct PoE 2 value (not 90%)
    const baseMagnitude = 0.20; // 20% of fire damage per second
    const baseDuration = modifiers.igniteDuration || 4; // 4 seconds default

    // Calculate base DPS
    const fireHitDamage = hitStats.damageType === 'fire' ? hitStats.baseDamage :
                         hitStats.fireDamage || 0;

    const baseDamagePerSecond = fireHitDamage * baseMagnitude;

    // Apply modifiers
    const increasedDamage = 1 + (modifiers.increasedDotDamage + modifiers.increasedIgniteDamage) / 100;
    const moreDamage = 1 + modifiers.moreDotDamage / 100;
    const damageMultiplier = modifiers.dotDamageMultiplier || 1;

    const effectiveDamagePerSecond = baseDamagePerSecond * increasedDamage * moreDamage * damageMultiplier;

    // Calculate duration
    const increasedDuration = 1 + modifiers.increasedDotDuration / 100;
    const moreDuration = 1 + modifiers.moreDotDuration / 100;
    const finalDuration = baseDuration * increasedDuration * moreDuration;

    const totalDamage = effectiveDamagePerSecond * finalDuration;

    return {
      type: 'ignite',
      baseDamagePerSecond,
      effectiveDamagePerSecond,
      totalDamage,
      duration: finalDuration,
      totalStacks: 1, // Ignite doesn't stack
      activeStacks: 1,
      breakdown: {
        hitDamage: fireHitDamage,
        ailmentMagnitude: baseMagnitude,
        durationModifiers: increasedDuration * moreDuration,
        damageModifiers: increasedDamage * moreDamage * damageMultiplier
      }
    };
  }

  // Calculate poison DoT based on PoE 2 patch 0.3 mechanics
  calculatePoison(
    hitStats: DotAilmentStats,
    modifiers: DotModifiers,
    numberOfStacks: number = 1
  ): DotCalculationResult {
    // Poison: 30% of (physical + chaos) hit damage per second for 2 seconds
    // Stackable with limit (default 1, can be increased)
    const baseMagnitude = 0.30; // 30% of physical + chaos damage per second
    const baseDuration = modifiers.poisonDuration || 2; // 2 seconds default
    const stackLimit = modifiers.poisonStackLimit || 1;

    // Calculate base DPS per stack
    const physicalDamage = hitStats.physicalDamage || 0;
    const chaosDamage = hitStats.chaosDamage || 0;
    const totalRelevantDamage = physicalDamage + chaosDamage;

    const baseDamagePerSecond = totalRelevantDamage * baseMagnitude;

    // Apply modifiers to individual stack
    const increasedDamage = 1 + (modifiers.increasedDotDamage + modifiers.increasedPoisonDamage) / 100;
    const moreDamage = 1 + modifiers.moreDotDamage / 100;
    const damageMultiplier = modifiers.dotDamageMultiplier || 1;

    const effectiveDamagePerStack = baseDamagePerSecond * increasedDamage * moreDamage * damageMultiplier;

    // Calculate duration
    const increasedDuration = 1 + modifiers.increasedDotDuration / 100;
    const moreDuration = 1 + modifiers.moreDotDuration / 100;
    const finalDuration = baseDuration * increasedDuration * moreDuration;

    // Calculate stacking
    const effectiveStacks = Math.min(numberOfStacks, stackLimit);
    const totalEffectiveDPS = effectiveDamagePerStack * effectiveStacks;
    const totalDamage = totalEffectiveDPS * finalDuration;

    return {
      type: 'poison',
      baseDamagePerSecond,
      effectiveDamagePerSecond: totalEffectiveDPS,
      totalDamage,
      duration: finalDuration,
      totalStacks: numberOfStacks,
      activeStacks: effectiveStacks,
      breakdown: {
        hitDamage: totalRelevantDamage,
        ailmentMagnitude: baseMagnitude,
        durationModifiers: increasedDuration * moreDuration,
        damageModifiers: increasedDamage * moreDamage * damageMultiplier,
        stackingBonus: effectiveStacks
      }
    };
  }

  // Calculate combined DoT from multiple ailments
  calculateCombinedDoT(
    hitStats: DotAilmentStats,
    modifiers: DotModifiers,
    ailmentOptions: {
      bleeding?: { enabled: boolean; enemyMoving?: boolean };
      ignite?: { enabled: boolean };
      poison?: { enabled: boolean; stacks?: number };
    }
  ): {
    total: {
      combinedDPS: number;
      totalDamage: number;
      duration: number;
    };
    individual: {
      bleeding?: DotCalculationResult;
      ignite?: DotCalculationResult;
      poison?: DotCalculationResult;
    };
    breakdown: any;
  } {
    const individual: any = {};
    let combinedDPS = 0;
    let maxDuration = 0;

    // Calculate bleeding if enabled
    if (ailmentOptions.bleeding?.enabled) {
      individual.bleeding = this.calculateBleeding(
        hitStats,
        modifiers,
        ailmentOptions.bleeding.enemyMoving
      );
      combinedDPS += individual.bleeding.effectiveDamagePerSecond;
      maxDuration = Math.max(maxDuration, individual.bleeding.duration);
    }

    // Calculate ignite if enabled
    if (ailmentOptions.ignite?.enabled) {
      individual.ignite = this.calculateIgnite(hitStats, modifiers);
      combinedDPS += individual.ignite.effectiveDamagePerSecond;
      maxDuration = Math.max(maxDuration, individual.ignite.duration);
    }

    // Calculate poison if enabled
    if (ailmentOptions.poison?.enabled) {
      individual.poison = this.calculatePoison(
        hitStats,
        modifiers,
        ailmentOptions.poison.stacks || 1
      );
      combinedDPS += individual.poison.effectiveDamagePerSecond;
      maxDuration = Math.max(maxDuration, individual.poison.duration);
    }

    const totalDamage = combinedDPS * maxDuration;

    return {
      total: {
        combinedDPS,
        totalDamage,
        duration: maxDuration
      },
      individual,
      breakdown: {
        ailmentCount: Object.keys(individual).length,
        primaryDuration: maxDuration,
        stackingContribution: individual.poison?.activeStacks || 0
      }
    };
  }

  // Simulate poison ramping over time (for multi-hit scenarios)
  simulatePoisonRamping(
    hitStats: DotAilmentStats,
    modifiers: DotModifiers,
    attackRate: number, // attacks per second
    simulationDuration: number = 10 // seconds
  ): {
    dpsOverTime: Array<{ time: number; dps: number; activeStacks: number }>;
    peakDPS: number;
    averageDPS: number;
  } {
    const stackLimit = modifiers.poisonStackLimit || 1;
    const poisonDuration = modifiers.poisonDuration || 2;

    const singleStackResult = this.calculatePoison(hitStats, modifiers, 1);
    const damagePerStack = singleStackResult.effectiveDamagePerSecond / singleStackResult.activeStacks;

    const timeStep = 0.1; // 0.1 second intervals
    const dpsOverTime: Array<{ time: number; dps: number; activeStacks: number }> = [];

    let activePoisons: Array<{ appliedAt: number; expires: number }> = [];
    let totalDamage = 0;

    for (let time = 0; time <= simulationDuration; time += timeStep) {
      // Remove expired poisons
      activePoisons = activePoisons.filter(p => p.expires > time);

      // Add new poisons based on attack rate
      const shouldApplyPoison = (time * attackRate) % 1 < timeStep * attackRate;
      if (shouldApplyPoison && activePoisons.length < stackLimit) {
        activePoisons.push({
          appliedAt: time,
          expires: time + poisonDuration
        });
      }

      const activeStacks = activePoisons.length;
      const currentDPS = activeStacks * damagePerStack;

      dpsOverTime.push({
        time: Math.round(time * 10) / 10,
        dps: currentDPS,
        activeStacks
      });

      totalDamage += currentDPS * timeStep;
    }

    const peakDPS = Math.max(...dpsOverTime.map(d => d.dps));
    const averageDPS = totalDamage / simulationDuration;

    return {
      dpsOverTime,
      peakDPS,
      averageDPS
    };
  }

  // Helper method to get ailment application chances
  calculateAilmentChances(
    hitStats: DotAilmentStats,
    modifiers: DotModifiers,
    isCriticalStrike: boolean = false
  ): {
    bleeding: number;
    ignite: number;
    poison: number;
  } {
    const baseChance = modifiers.ailmentChance || 0;

    return {
      bleeding: baseChance, // No guaranteed bleeding
      ignite: isCriticalStrike ? 100 : baseChance, // Critical fire hits guarantee ignite
      poison: baseChance // No guaranteed poison
    };
  }

  // Get recommended DoT modifiers for optimization
  getOptimizationRecommendations(
    currentResult: DotCalculationResult,
    targetDPS: number
  ): {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    impact: string;
  }[] {
    const recommendations = [];
    const currentDPS = currentResult.effectiveDamagePerSecond;
    const dpsGap = targetDPS - currentDPS;

    if (dpsGap > 0) {
      // Damage recommendations
      recommendations.push({
        priority: 'high' as const,
        recommendation: 'Increase hit damage scaling',
        impact: `+${Math.round(dpsGap * 0.5)} DPS potential from better hit damage`
      });

      if (currentResult.type === 'poison' && currentResult.activeStacks < 10) {
        recommendations.push({
          priority: 'high' as const,
          recommendation: 'Increase poison stack limit',
          impact: `Potentially ${Math.round(currentDPS * 2)}+ DPS with more stacks`
        });
      }

      if (currentResult.type === 'bleeding') {
        recommendations.push({
          priority: 'medium' as const,
          recommendation: 'Focus on enemies that move frequently',
          impact: `3x damage (${Math.round(currentDPS * 3)} DPS) against moving enemies`
        });
      }

      // Duration vs DPS trade-off
      recommendations.push({
        priority: 'low' as const,
        recommendation: 'Consider faster ailment damage modifiers',
        impact: 'Higher DPS but shorter duration - better for fast kills'
      });
    }

    return recommendations;
  }
}

export default PoE2DotDPSCalculator;
export type {
  DotAilmentStats,
  DotModifiers,
  AilmentInstance,
  DotCalculationResult
};