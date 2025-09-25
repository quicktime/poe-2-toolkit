import type {
  SkillGem,
  SkillSetup,
  CalculatedSkill,
  SkillCalculationContext,
  DamageRange,
  ElementalDamage,
  SkillModifier,
  SocketedGem,
} from '@/types/skills';

export class SkillCalculator {
  /**
   * Calculate the final DPS and stats for a skill setup
   */
  static calculateSkill(
    setup: SkillSetup,
    context: SkillCalculationContext
  ): CalculatedSkill {
    // Get base values from active gem
    const activeGem = setup.activeGem.gem;
    const level = setup.activeGem.level;
    const quality = setup.activeGem.quality;

    // Get level-specific stats
    const levelStats = activeGem.levelStats[Math.min(level - 1, activeGem.levelStats.length - 1)];

    // Calculate base damage
    let baseDamage = this.calculateBaseDamage(activeGem, levelStats, context);

    // Apply support gem modifiers
    const supportModifiers = this.getSupportModifiers(setup.supportGems);

    // Collect all modifiers
    const allModifiers: SkillModifier[] = [
      ...supportModifiers,
      ...context.passiveTree.modifiers,
      ...context.equipment,
      ...context.buffs,
    ];

    // Apply modifiers to damage
    baseDamage = this.applyModifiers(baseDamage, allModifiers, 'physical');

    // Calculate elemental damage
    const elementalDamage = this.calculateElementalDamage(baseDamage, allModifiers);

    // Calculate total damage per hit
    const damagePerHit = this.calculateDamagePerHit(baseDamage, elementalDamage);

    // Calculate attack/cast speed
    const attacksPerSecond = this.calculateAttackSpeed(
      levelStats.attackSpeed || 1.0,
      allModifiers,
      activeGem.tags
    );

    // Calculate critical strike
    const criticalChance = this.calculateCriticalChance(
      levelStats.criticalStrikeChance || 5,
      allModifiers
    );
    const criticalMultiplier = this.calculateCriticalMultiplier(150, allModifiers);

    // Calculate effective DPS
    const dps = this.calculateDPS(
      damagePerHit,
      attacksPerSecond,
      criticalChance,
      criticalMultiplier
    );

    // Calculate mana cost
    const manaCost = this.calculateManaCost(levelStats.manaCost || 0, allModifiers);

    return {
      setup,
      baseDamage,
      elementalDamage,
      damagePerHit,
      attacksPerSecond,
      dps,
      criticalChance,
      criticalMultiplier,
      manaCost,
      tags: activeGem.tags,
      modifiers: allModifiers,
    };
  }

  /**
   * Calculate base damage for the skill
   */
  private static calculateBaseDamage(
    gem: SkillGem,
    levelStats: any,
    context: SkillCalculationContext
  ): DamageRange {
    // For attacks, use weapon damage
    if (gem.tags.includes('attack') && context.weapon) {
      const effectiveness = levelStats.damageEffectiveness || 1;
      return {
        min: context.weapon.baseDamage.min * effectiveness,
        max: context.weapon.baseDamage.max * effectiveness,
      };
    }

    // For spells, use spell damage from gem
    if (gem.tags.includes('spell')) {
      const baseDamageStr = levelStats.stats['base_damage'] || '0-0';
      const [min, max] = baseDamageStr.split('-').map(Number);
      return { min, max };
    }

    return { min: 0, max: 0 };
  }

  /**
   * Get modifiers from support gems
   */
  private static getSupportModifiers(supportGems: SocketedGem[]): SkillModifier[] {
    const modifiers: SkillModifier[] = [];

    supportGems.forEach(socketedGem => {
      const gem = socketedGem.gem;
      const level = socketedGem.level;
      const quality = socketedGem.quality;

      // Get level-specific stats
      const levelStats = gem.levelStats[Math.min(level - 1, gem.levelStats.length - 1)];

      // Convert support gem stats to modifiers
      Object.entries(levelStats.stats).forEach(([stat, value]) => {
        modifiers.push({
          source: gem.name,
          stat,
          value: typeof value === 'number' ? value : parseFloat(value as string),
          type: this.getModifierType(stat),
        });
      });

      // Add quality bonus
      if (quality > 0 && gem.qualityStats) {
        Object.entries(gem.qualityStats).forEach(([stat, value]) => {
          const qualityValue = (typeof value === 'number' ? value : parseFloat(value as string)) * quality / 20;
          modifiers.push({
            source: `${gem.name} (Quality)`,
            stat,
            value: qualityValue,
            type: this.getModifierType(stat),
          });
        });
      }
    });

    return modifiers;
  }

  /**
   * Determine modifier type from stat name
   */
  private static getModifierType(stat: string): 'base' | 'added' | 'increased' | 'more' {
    if (stat.includes('added') || stat.includes('adds')) return 'added';
    if (stat.includes('more') || stat.includes('less')) return 'more';
    if (stat.includes('increased') || stat.includes('reduced')) return 'increased';
    return 'base';
  }

  /**
   * Apply modifiers to damage
   */
  private static applyModifiers(
    baseDamage: DamageRange,
    modifiers: SkillModifier[],
    damageType: string
  ): DamageRange {
    let min = baseDamage.min;
    let max = baseDamage.max;

    // Apply added damage
    const addedMods = modifiers.filter(m => m.type === 'added' && m.stat.includes(damageType));
    addedMods.forEach(mod => {
      min += mod.value;
      max += mod.value;
    });

    // Apply increased/reduced damage (additive)
    const increasedMods = modifiers.filter(m => m.type === 'increased' && m.stat.includes('damage'));
    const totalIncreased = increasedMods.reduce((sum, mod) => sum + mod.value, 0);
    min *= (1 + totalIncreased / 100);
    max *= (1 + totalIncreased / 100);

    // Apply more/less damage (multiplicative)
    const moreMods = modifiers.filter(m => m.type === 'more' && m.stat.includes('damage'));
    moreMods.forEach(mod => {
      min *= (1 + mod.value / 100);
      max *= (1 + mod.value / 100);
    });

    return { min: Math.floor(min), max: Math.floor(max) };
  }

  /**
   * Calculate elemental damage from conversions
   */
  private static calculateElementalDamage(
    physicalDamage: DamageRange,
    modifiers: SkillModifier[]
  ): ElementalDamage {
    const elemental: ElementalDamage = {
      fire: { min: 0, max: 0 },
      cold: { min: 0, max: 0 },
      lightning: { min: 0, max: 0 },
    };

    // Check for damage conversions
    const conversions = modifiers.filter(m => m.stat.includes('converted'));

    conversions.forEach(mod => {
      const percentage = mod.value / 100;
      if (mod.stat.includes('fire')) {
        elemental.fire.min += physicalDamage.min * percentage;
        elemental.fire.max += physicalDamage.max * percentage;
      } else if (mod.stat.includes('cold')) {
        elemental.cold.min += physicalDamage.min * percentage;
        elemental.cold.max += physicalDamage.max * percentage;
      } else if (mod.stat.includes('lightning')) {
        elemental.lightning.min += physicalDamage.min * percentage;
        elemental.lightning.max += physicalDamage.max * percentage;
      }
    });

    // Apply elemental damage modifiers
    elemental.fire = this.applyModifiers(elemental.fire, modifiers, 'fire');
    elemental.cold = this.applyModifiers(elemental.cold, modifiers, 'cold');
    elemental.lightning = this.applyModifiers(elemental.lightning, modifiers, 'lightning');

    return elemental;
  }

  /**
   * Calculate total damage per hit
   */
  private static calculateDamagePerHit(
    physicalDamage: DamageRange,
    elementalDamage: ElementalDamage
  ): number {
    const avgPhysical = (physicalDamage.min + physicalDamage.max) / 2;
    const avgFire = (elementalDamage.fire.min + elementalDamage.fire.max) / 2;
    const avgCold = (elementalDamage.cold.min + elementalDamage.cold.max) / 2;
    const avgLightning = (elementalDamage.lightning.min + elementalDamage.lightning.max) / 2;

    return avgPhysical + avgFire + avgCold + avgLightning;
  }

  /**
   * Calculate attack/cast speed
   */
  private static calculateAttackSpeed(
    baseSpeed: number,
    modifiers: SkillModifier[],
    tags: string[]
  ): number {
    const statName = tags.includes('attack') ? 'attack_speed' : 'cast_speed';

    // Get increased speed modifiers
    const speedMods = modifiers.filter(m => m.stat.includes(statName) && m.type === 'increased');
    const totalIncreased = speedMods.reduce((sum, mod) => sum + mod.value, 0);

    // Get more speed modifiers
    const moreMods = modifiers.filter(m => m.stat.includes(statName) && m.type === 'more');
    let speed = baseSpeed * (1 + totalIncreased / 100);

    moreMods.forEach(mod => {
      speed *= (1 + mod.value / 100);
    });

    return speed;
  }

  /**
   * Calculate critical strike chance
   */
  private static calculateCriticalChance(
    baseCrit: number,
    modifiers: SkillModifier[]
  ): number {
    const critMods = modifiers.filter(m => m.stat.includes('critical_strike_chance'));
    const totalIncreased = critMods
      .filter(m => m.type === 'increased')
      .reduce((sum, mod) => sum + mod.value, 0);

    const totalFlat = critMods
      .filter(m => m.type === 'base')
      .reduce((sum, mod) => sum + mod.value, 0);

    return Math.min(100, baseCrit * (1 + totalIncreased / 100) + totalFlat);
  }

  /**
   * Calculate critical strike multiplier
   */
  private static calculateCriticalMultiplier(
    baseMulti: number,
    modifiers: SkillModifier[]
  ): number {
    const multiMods = modifiers.filter(m => m.stat.includes('critical_strike_multiplier'));
    const totalIncreased = multiMods.reduce((sum, mod) => sum + mod.value, 0);

    return baseMulti + totalIncreased;
  }

  /**
   * Calculate DPS including critical strikes
   */
  private static calculateDPS(
    damagePerHit: number,
    attacksPerSecond: number,
    criticalChance: number,
    criticalMultiplier: number
  ): number {
    const critChance = criticalChance / 100;
    const critMulti = criticalMultiplier / 100;

    // Average damage with crits
    const avgDamage = damagePerHit * (1 + critChance * (critMulti - 1));

    return Math.floor(avgDamage * attacksPerSecond);
  }

  /**
   * Calculate mana cost
   */
  private static calculateManaCost(
    baseCost: number,
    modifiers: SkillModifier[]
  ): number {
    const costMods = modifiers.filter(m => m.stat.includes('mana_cost'));

    // Increased/reduced mana cost
    const increased = costMods
      .filter(m => m.type === 'increased')
      .reduce((sum, mod) => sum + mod.value, 0);

    // More/less mana cost multipliers
    const moreMods = costMods.filter(m => m.type === 'more');

    let cost = baseCost * (1 + increased / 100);

    moreMods.forEach(mod => {
      cost *= (1 + mod.value / 100);
    });

    return Math.ceil(cost);
  }
}