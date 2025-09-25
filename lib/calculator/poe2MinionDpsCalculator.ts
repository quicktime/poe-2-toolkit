interface MinionStats {
  baseDamage: number;
  attackSpeed: number;
  accuracy: number;
  criticalChance: number;
  criticalMultiplier: number;
  hitChance: number;
  level: number;
  spiritCost: number;
  minionCount: number;
  duration?: number; // For temporary minions
}

interface MinionModifiers {
  increasedMinionDamage: number; // Additive percentage
  moreMinionDamage: number; // Multiplicative percentage
  increasedAttackSpeed: number;
  moreAttackSpeed: number;
  increasedMinionLife: number;
  minionDuration: number;
  additionalMinions: number;
  spiritEfficiency: number; // Reduces spirit cost
  weaponBaseDamageToMinions: number; // 25% of weapon damage to minions (new mechanic)
}

interface SupportGemEffect {
  name: string;
  moreMultiplier: number;
  increasedMultiplier: number;
  spiritCostMultiplier: number;
  additionalEffects: { [key: string]: number };
}

interface MinionType {
  name: string;
  baseStats: MinionStats;
  scalingType: 'melee' | 'ranged' | 'spell' | 'totem';
  tags: string[];
  specialMechanics?: string[];
}

class PoE2MinionDPSCalculator {
  private static instance: PoE2MinionDPSCalculator;

  private constructor() {}

  static getInstance(): PoE2MinionDPSCalculator {
    if (!PoE2MinionDPSCalculator.instance) {
      PoE2MinionDPSCalculator.instance = new PoE2MinionDPSCalculator();
    }
    return PoE2MinionDPSCalculator.instance;
  }

  // Minion type definitions based on research
  private getMinionTypes(): { [key: string]: MinionType } {
    return {
      'Skeletal Warrior': {
        name: 'Skeletal Warrior',
        baseStats: {
          baseDamage: 120,
          attackSpeed: 1.2,
          accuracy: 1000,
          criticalChance: 5,
          criticalMultiplier: 150,
          hitChance: 85,
          level: 1,
          spiritCost: 25,
          minionCount: 1
        },
        scalingType: 'melee',
        tags: ['minion', 'skeleton', 'melee', 'undead']
      },
      'Skeletal Sniper': {
        name: 'Skeletal Sniper',
        baseStats: {
          baseDamage: 180,
          attackSpeed: 0.8,
          accuracy: 1200,
          criticalChance: 8,
          criticalMultiplier: 160,
          hitChance: 90,
          level: 1,
          spiritCost: 30,
          minionCount: 1
        },
        scalingType: 'ranged',
        tags: ['minion', 'skeleton', 'ranged', 'undead', 'projectile']
      },
      'Skeletal Arsonist': {
        name: 'Skeletal Arsonist',
        baseStats: {
          baseDamage: 250,
          attackSpeed: 0.6,
          accuracy: 1000,
          criticalChance: 6,
          criticalMultiplier: 140,
          hitChance: 80,
          level: 1,
          spiritCost: 35,
          minionCount: 1
        },
        scalingType: 'spell',
        tags: ['minion', 'skeleton', 'spell', 'undead', 'fire', 'area']
      },
      'Raised Zombie': {
        name: 'Raised Zombie',
        baseStats: {
          baseDamage: 200,
          attackSpeed: 1.0,
          accuracy: 900,
          criticalChance: 4,
          criticalMultiplier: 130,
          hitChance: 75,
          level: 1,
          spiritCost: 40,
          minionCount: 1
        },
        scalingType: 'melee',
        tags: ['minion', 'zombie', 'melee', 'undead']
      },
      'Bone Storm': {
        name: 'Bone Storm',
        baseStats: {
          baseDamage: 150,
          attackSpeed: 2.0,
          accuracy: 1100,
          criticalChance: 10,
          criticalMultiplier: 170,
          hitChance: 85,
          level: 1,
          spiritCost: 50,
          minionCount: 1,
          duration: 8
        },
        scalingType: 'spell',
        tags: ['minion', 'temporary', 'spell', 'area', 'bone'],
        specialMechanics: ['applies_debuff', 'boosts_next_minion_attack']
      },
      'Totem': {
        name: 'Totem',
        baseStats: {
          baseDamage: 300, // Uses character's skill damage
          attackSpeed: 1.0,
          accuracy: 1000,
          criticalChance: 5,
          criticalMultiplier: 150,
          hitChance: 85,
          level: 1,
          spiritCost: 30,
          minionCount: 1,
          duration: 20
        },
        scalingType: 'totem',
        tags: ['totem', 'temporary', 'spell'],
        specialMechanics: ['scales_with_character_damage']
      }
    };
  }

  // Support gem effects based on research
  private getSupportGems(): { [key: string]: SupportGemEffect } {
    return {
      'Brutality': {
        name: 'Brutality',
        moreMultiplier: 35,
        increasedMultiplier: 0,
        spiritCostMultiplier: 130,
        additionalEffects: { 'removes_elemental_damage': 1 }
      },
      'Battle Speed': {
        name: 'Battle Speed',
        moreMultiplier: 0,
        increasedMultiplier: 25,
        spiritCostMultiplier: 120,
        additionalEffects: { 'increased_attack_speed': 30 }
      },
      'Minion Damage': {
        name: 'Minion Damage',
        moreMultiplier: 0,
        increasedMultiplier: 40,
        spiritCostMultiplier: 125,
        additionalEffects: {}
      },
      'Elemental Army': {
        name: 'Elemental Army',
        moreMultiplier: 20,
        increasedMultiplier: 15,
        spiritCostMultiplier: 140,
        additionalEffects: { 'adds_elemental_damage': 1 }
      }
    };
  }

  // Calculate minion DPS using PoE 2 formulas
  calculateMinionDPS(
    minionTypeName: string,
    gemLevel: number,
    modifiers: MinionModifiers,
    supportGems: string[] = []
  ): {
    totalDPS: number;
    perMinionDPS: number;
    totalSpiritCost: number;
    minionCount: number;
    breakdown: any;
  } {
    const minionTypes = this.getMinionTypes();
    const minionType = minionTypes[minionTypeName];

    if (!minionType) {
      throw new Error(`Unknown minion type: ${minionTypeName}`);
    }

    // Scale base stats with gem level
    const scaledStats = this.scaleStatsWithLevel(minionType.baseStats, gemLevel);

    // Apply support gems
    const supportEffects = this.calculateSupportGemEffects(supportGems);

    // Calculate final minion stats
    const finalStats = this.applyModifiers(scaledStats, modifiers, supportEffects);

    // Special handling for totems (they scale with character damage)
    if (minionType.scalingType === 'totem') {
      return this.calculateTotemDPS(finalStats, modifiers, supportEffects);
    }

    // Standard minion DPS calculation
    return this.calculateStandardMinionDPS(finalStats, modifiers, supportEffects);
  }

  private scaleStatsWithLevel(baseStats: MinionStats, gemLevel: number): MinionStats {
    // PoE 2 minion scaling: damage and accuracy scale significantly with gem level
    const levelMultiplier = 1 + (gemLevel - 1) * 0.08; // 8% per level
    const accuracyMultiplier = 1 + (gemLevel - 1) * 0.05; // 5% accuracy per level

    return {
      ...baseStats,
      baseDamage: Math.round(baseStats.baseDamage * levelMultiplier),
      accuracy: Math.round(baseStats.accuracy * accuracyMultiplier),
      level: gemLevel
    };
  }

  private calculateSupportGemEffects(supportGemNames: string[]): {
    totalMoreMultiplier: number;
    totalIncreasedMultiplier: number;
    totalSpiritMultiplier: number;
    additionalEffects: { [key: string]: number };
  } {
    const supportGems = this.getSupportGems();

    let totalMoreMultiplier = 1;
    let totalIncreasedMultiplier = 0;
    let totalSpiritMultiplier = 1;
    const additionalEffects: { [key: string]: number } = {};

    supportGemNames.forEach(gemName => {
      const gem = supportGems[gemName];
      if (gem) {
        totalMoreMultiplier *= (1 + gem.moreMultiplier / 100);
        totalIncreasedMultiplier += gem.increasedMultiplier;
        totalSpiritMultiplier *= (gem.spiritCostMultiplier / 100);

        // Apply additional effects
        Object.entries(gem.additionalEffects).forEach(([key, value]) => {
          additionalEffects[key] = (additionalEffects[key] || 0) + value;
        });
      }
    });

    return {
      totalMoreMultiplier,
      totalIncreasedMultiplier,
      totalSpiritMultiplier,
      additionalEffects
    };
  }

  private applyModifiers(
    baseStats: MinionStats,
    modifiers: MinionModifiers,
    supportEffects: any
  ): MinionStats {
    // Calculate final damage using PoE 2 formula
    // Damage = Base * (1 + Increased/100) * More_Multiplier

    const totalIncreasedDamage = modifiers.increasedMinionDamage + supportEffects.totalIncreasedMultiplier;
    const totalMoreDamage = (1 + modifiers.moreMinionDamage / 100) * supportEffects.totalMoreMultiplier;

    const finalBaseDamage = baseStats.baseDamage * (1 + totalIncreasedDamage / 100) * totalMoreDamage;

    // Add weapon base damage to minions (new PoE 2 mechanic)
    const weaponDamageBonus = modifiers.weaponBaseDamageToMinions * 0.25;

    const finalDamage = finalBaseDamage + weaponDamageBonus;

    // Calculate attack speed
    const totalIncreasedAS = modifiers.increasedAttackSpeed + (supportEffects.additionalEffects.increased_attack_speed || 0);
    const totalMoreAS = 1 + modifiers.moreAttackSpeed / 100;
    const finalAttackSpeed = baseStats.attackSpeed * (1 + totalIncreasedAS / 100) * totalMoreAS;

    // Calculate spirit cost
    const finalSpiritCost = Math.ceil(
      baseStats.spiritCost * supportEffects.totalSpiritMultiplier * (1 - modifiers.spiritEfficiency / 100)
    );

    // Calculate minion count
    const finalMinionCount = baseStats.minionCount + modifiers.additionalMinions;

    return {
      ...baseStats,
      baseDamage: finalDamage,
      attackSpeed: finalAttackSpeed,
      spiritCost: finalSpiritCost,
      minionCount: finalMinionCount
    };
  }

  private calculateStandardMinionDPS(
    stats: MinionStats,
    modifiers: MinionModifiers,
    supportEffects: any
  ): any {
    // Calculate hit chance (minions use their own accuracy)
    const hitChance = Math.min(95, Math.max(5, stats.hitChance)) / 100;

    // Calculate critical strike DPS component
    const critChance = Math.min(95, stats.criticalChance) / 100;
    const critMultiplier = stats.criticalMultiplier / 100;
    const averageMultiplier = 1 + (critChance * (critMultiplier - 1));

    // Calculate per-minion DPS
    const perMinionDPS = stats.baseDamage * stats.attackSpeed * hitChance * averageMultiplier;

    // Calculate total DPS (all minions)
    const totalDPS = perMinionDPS * stats.minionCount;

    // Calculate total spirit cost
    const totalSpiritCost = stats.spiritCost * stats.minionCount;

    const breakdown = {
      baseDamage: stats.baseDamage,
      attackSpeed: stats.attackSpeed,
      hitChance: hitChance * 100,
      criticalChance: stats.criticalChance,
      criticalMultiplier: stats.criticalMultiplier,
      averageMultiplier,
      minionCount: stats.minionCount,
      spiritCostPerMinion: stats.spiritCost,
      calculations: {
        perMinionHitDPS: stats.baseDamage * stats.attackSpeed * hitChance,
        criticalComponent: critChance * (critMultiplier - 1),
        finalPerMinionDPS: perMinionDPS
      }
    };

    return {
      totalDPS: Math.round(totalDPS),
      perMinionDPS: Math.round(perMinionDPS),
      totalSpiritCost,
      minionCount: stats.minionCount,
      breakdown
    };
  }

  private calculateTotemDPS(
    stats: MinionStats,
    modifiers: MinionModifiers,
    supportEffects: any
  ): any {
    // Totems scale differently - they use character damage + totem modifiers
    // This is a simplified version - would need character stats for full calculation

    const hitChance = Math.min(95, Math.max(5, stats.hitChance)) / 100;
    const critChance = Math.min(95, stats.criticalChance) / 100;
    const critMultiplier = stats.criticalMultiplier / 100;
    const averageMultiplier = 1 + (critChance * (critMultiplier - 1));

    // Totems typically have higher base damage but limited duration
    const perTotemDPS = stats.baseDamage * stats.attackSpeed * hitChance * averageMultiplier;
    const totalDPS = perTotemDPS * stats.minionCount;
    const totalSpiritCost = stats.spiritCost * stats.minionCount;

    const breakdown = {
      baseDamage: stats.baseDamage,
      attackSpeed: stats.attackSpeed,
      hitChance: hitChance * 100,
      criticalChance: stats.criticalChance,
      criticalMultiplier: stats.criticalMultiplier,
      duration: stats.duration,
      minionCount: stats.minionCount,
      spiritCostPerTotem: stats.spiritCost,
      note: 'Totem damage scales with character damage modifiers'
    };

    return {
      totalDPS: Math.round(totalDPS),
      perMinionDPS: Math.round(perTotemDPS),
      totalSpiritCost,
      minionCount: stats.minionCount,
      breakdown
    };
  }

  // Helper method to optimize minion builds for spirit efficiency
  optimizeForSpiritEfficiency(
    availableSpirit: number,
    minionOptions: Array<{
      type: string;
      gemLevel: number;
      supportGems: string[];
      modifiers: MinionModifiers;
    }>
  ): {
    recommendedBuild: any;
    alternatives: any[];
    analysis: any;
  } {
    const results = minionOptions.map(option => {
      const result = this.calculateMinionDPS(
        option.type,
        option.gemLevel,
        option.modifiers,
        option.supportGems
      );

      return {
        ...option,
        ...result,
        spiritEfficiency: result.totalDPS / result.totalSpiritCost,
        canAfford: result.totalSpiritCost <= availableSpirit
      };
    });

    const affordableOptions = results.filter(r => r.canAfford);
    const bestEfficiency = affordableOptions.sort((a, b) => b.spiritEfficiency - a.spiritEfficiency)[0];
    const bestDPS = affordableOptions.sort((a, b) => b.totalDPS - a.totalDPS)[0];

    return {
      recommendedBuild: bestEfficiency,
      alternatives: affordableOptions.slice(0, 5),
      analysis: {
        totalOptions: results.length,
        affordableOptions: affordableOptions.length,
        bestEfficiency: bestEfficiency?.spiritEfficiency || 0,
        bestDPS: bestDPS?.totalDPS || 0,
        spiritUtilization: (bestEfficiency?.totalSpiritCost || 0) / availableSpirit
      }
    };
  }

  // Get all available minion types
  getAvailableMinionTypes(): string[] {
    return Object.keys(this.getMinionTypes());
  }

  // Get all available support gems
  getAvailableSupportGems(): string[] {
    return Object.keys(this.getSupportGems());
  }
}

export default PoE2MinionDPSCalculator;
export type { MinionStats, MinionModifiers, SupportGemEffect, MinionType };