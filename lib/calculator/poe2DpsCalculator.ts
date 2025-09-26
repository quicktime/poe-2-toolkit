/**
 * Path of Exile 2 Accurate DPS Calculator
 * Implements PoE 2 specific damage mechanics, formulas, and systems
 */

import type { PoECharacterDetails, PoEItem } from '@/lib/api/poeApiService';
import type { AllocatedPassives, PassiveTreeData } from '@/types/passiveTree';

// PoE 2 Specific Types
export interface PoE2DPSCalculation {
  // Main DPS metrics
  totalDPS: number;
  skillDPS: number;
  effectiveDPS: number; // After hit chance, resistances, etc.
  minionDPS?: number; // Minion/totem DPS if applicable
  combinedDPS?: number; // Total DPS including minions

  // Damage breakdown by type
  physicalDPS: number;
  elementalDPS: {
    fire: number;
    cold: number;
    lightning: number;
  };
  chaosDPS: number;

  // PoE 2 specific metrics
  comboDPS: number; // Damage with combo points
  spiritEfficiency: number; // DPS per spirit reserved
  weaponSwapDPS?: number; // Secondary weapon DPS

  // Combat metrics
  hitChance: number;
  critChance: number;
  critMultiplier: number;
  attacksPerSecond: number;
  damagePerHit: number;

  // PoE 2 specific combat
  comboPointsGenerated: number;
  dodgeEffectiveness: number;
  blockChance: number;

  // Minion stats (if applicable)
  minionModifiers?: any;

  // Detailed breakdown
  calculations: PoE2CalculationDetails;
}

export interface PoE2CalculationDetails {
  // Base values
  baseWeaponDamage: DamageComponents;
  baseSkillDamage: DamageComponents;
  addedDamage: DamageComponents;

  // PoE 2 specific modifiers
  damageEffectiveness: number;
  comboMultiplier: number;
  spiritCost: number;

  // Scaling factors
  increasedDamage: Record<string, number>;
  moreDamage: Record<string, number>;
  finalDamageMultiplier: number;

  // Hit calculation
  accuracyRating: number;
  enemyEvasion: number;
  finalHitChance: number;

  // Critical strikes (PoE 2 system)
  baseCritChance: number;
  increasedCritChance: number;
  finalCritChance: number;
  baseCritMultiplier: number;
  addedCritMultiplier: number;
  finalCritMultiplier: number;

  // Attack/cast speed
  baseAttackSpeed: number;
  increasedAttackSpeed: number;
  moreAttackSpeed: number;
  finalAttackSpeed: number;
}

export interface DamageComponents {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

export interface PoE2SkillData {
  name: string;
  type: 'attack' | 'spell' | 'channeling' | 'combo' | 'aura';
  level: number;
  quality: number;

  // PoE 2 specific
  spiritCost?: number;
  comboPointCost?: number;
  comboPointsGenerated?: number;
  damageEffectiveness: number;

  // Base damage (for spells)
  baseDamage?: DamageComponents;

  // Skill modifiers
  addedDamageEffectiveness: number;
  attackSpeedMultiplier: number;
  castSpeedMultiplier: number;

  // Support gems (PoE 2 system)
  supportGems: PoE2SupportGem[];
  uncutGemConfiguration?: UncutGemConfig;
}

export interface PoE2SupportGem {
  name: string;
  level: number;
  quality: number;
  spiritCost: number;

  // Modifiers
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  addedDamage?: DamageComponents;
  criticalStrikeChance?: number;
  criticalStrikeMultiplier?: number;
}

export interface UncutGemConfig {
  primaryGem: string;
  supportGems: string[];
  totalSpiritCost: number;
  combinedEffectiveness: number;
}

export interface PoE2WeaponStats {
  // Base weapon stats
  physicalDamage: { min: number; max: number; average: number };
  attacksPerSecond: number;
  criticalStrikeChance: number;
  criticalStrikeMultiplier: number;
  accuracy: number;

  // PoE 2 weapon properties
  weaponType: 'one_hand' | 'two_hand' | 'bow' | 'crossbow' | 'wand' | 'staff' | 'focus';
  weaponClass: string;

  // Local modifiers (apply before global)
  localIncreasedPhysicalDamage: number;
  localIncreasedAttackSpeed: number;
  localIncreasedCritChance: number;
  localCritMultiplier: number;
  localIncreasedAccuracy: number;

  // Added damage
  addedPhysicalDamage: { min: number; max: number; average: number };
  addedElementalDamage: {
    fire: { min: number; max: number; average: number };
    cold: { min: number; max: number; average: number };
    lightning: { min: number; max: number; average: number };
  };
  addedChaosDamage: { min: number; max: number; average: number };
}

export class PoE2DPSCalculator {
  private static instance: PoE2DPSCalculator;

  private constructor() {}

  static getInstance(): PoE2DPSCalculator {
    if (!PoE2DPSCalculator.instance) {
      PoE2DPSCalculator.instance = new PoE2DPSCalculator();
    }
    return PoE2DPSCalculator.instance;
  }

  /**
   * Calculate accurate PoE 2 DPS
   */
  calculateDPS(
    character: PoECharacterDetails,
    allocated: AllocatedPassives,
    treeData: PassiveTreeData,
    selectedSkill?: string
  ): PoE2DPSCalculation {
    // Parse character data
    const weapon = this.parseWeapon(this.getMainHandWeapon(character.items));
    const skill = this.parseSkill(character.skills, selectedSkill);
    const characterStats = this.parseCharacterStats(character, allocated, treeData);

    // Calculate base damage
    const baseDamage = this.calculateBaseDamage(weapon, skill, characterStats);

    // Apply PoE 2 damage formula
    const scaledDamage = this.applyPoE2DamageFormula(baseDamage, characterStats, skill);

    // Calculate attack speed
    const attackSpeed = this.calculateAttackSpeed(weapon, skill, characterStats);

    // Calculate hit chance (PoE 2 formula)
    const hitChance = this.calculatePoE2HitChance(characterStats.accuracyRating, characterStats.enemyEvasion);

    // Calculate critical strikes (PoE 2 system)
    const { critChance, critMultiplier } = this.calculatePoE2Crits(weapon, skill, characterStats);

    // Calculate final DPS
    const averageDamagePerHit = this.calculateAverageDamage(scaledDamage, critChance, critMultiplier);
    const rawDPS = averageDamagePerHit * attackSpeed;
    const effectiveDPS = rawDPS * (hitChance / 100);

    // PoE 2 specific calculations
    const comboDPS = this.calculateComboDPS(effectiveDPS, skill);
    const spiritEfficiency = skill.spiritCost ? effectiveDPS / skill.spiritCost : 0;

    // Extract minion modifiers if character has them
    const minionModifiers = this.extractMinionModifiers(character, allocated, treeData);

    // Calculate combined DPS with minions if applicable
    let combinedDPS = effectiveDPS;
    if (minionModifiers && (minionModifiers.increasedMinionDamage > 0 || minionModifiers.additionalMinions > 0)) {
      // This is a simplified calculation - actual minion DPS would need more details
      // about which minions are active, their gem levels, etc.
      combinedDPS = effectiveDPS; // Will be enhanced when minion skills are detected
    }

    return {
      totalDPS: effectiveDPS,
      skillDPS: rawDPS,
      effectiveDPS,
      minionDPS: 0, // Will be calculated separately when minion skills are detected
      combinedDPS,
      physicalDPS: (scaledDamage.physical * attackSpeed * hitChance) / 100,
      elementalDPS: {
        fire: (scaledDamage.fire * attackSpeed * hitChance) / 100,
        cold: (scaledDamage.cold * attackSpeed * hitChance) / 100,
        lightning: (scaledDamage.lightning * attackSpeed * hitChance) / 100
      },
      chaosDPS: (scaledDamage.chaos * attackSpeed * hitChance) / 100,
      comboDPS,
      spiritEfficiency,
      hitChance,
      critChance,
      critMultiplier,
      attacksPerSecond: attackSpeed,
      damagePerHit: averageDamagePerHit,
      comboPointsGenerated: skill.comboPointsGenerated || 0,
      dodgeEffectiveness: characterStats.dodgeEffectiveness || 0,
      blockChance: characterStats.blockChance || 0,
      minionModifiers,
      calculations: {
        baseWeaponDamage: this.weaponToDamageComponents(weapon),
        baseSkillDamage: skill.baseDamage || { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 },
        addedDamage: this.calculateAddedDamage(weapon, characterStats),
        damageEffectiveness: skill.damageEffectiveness,
        comboMultiplier: this.calculateComboMultiplier(skill),
        spiritCost: skill.spiritCost || 0,
        increasedDamage: characterStats.increasedDamage,
        moreDamage: characterStats.moreDamage,
        finalDamageMultiplier: this.calculateFinalDamageMultiplier(characterStats),
        accuracyRating: characterStats.accuracyRating,
        enemyEvasion: characterStats.enemyEvasion,
        finalHitChance: hitChance,
        baseCritChance: weapon.criticalStrikeChance,
        increasedCritChance: characterStats.increasedCritChance,
        finalCritChance: critChance,
        baseCritMultiplier: weapon.criticalStrikeMultiplier,
        addedCritMultiplier: characterStats.addedCritMultiplier,
        finalCritMultiplier: critMultiplier,
        baseAttackSpeed: weapon.attacksPerSecond,
        increasedAttackSpeed: characterStats.increasedAttackSpeed,
        moreAttackSpeed: characterStats.moreAttackSpeed,
        finalAttackSpeed: attackSpeed
      }
    };
  }

  /**
   * PoE 2 Accurate Hit Chance Calculation
   * Correct Formula: Hit Chance = AA / (AA + (DE/4)^0.9)
   * Where AA = Attacker's Accuracy, DE = Defender's Evasion
   * Source: Official PoE 2 mechanics documentation
   */
  private calculatePoE2HitChance(accuracy: number, evasion: number): number {
    if (evasion <= 0) return 100;

    // Correct PoE 2 formula
    const modifiedEvasion = Math.pow(evasion / 4, 0.9);
    const hitChance = (accuracy / (accuracy + modifiedEvasion)) * 100;

    // Hit chance is always at least 5% and at most 100%
    return Math.min(100, Math.max(5, hitChance));
  }

  /**
   * PoE 2 Critical Strike System
   * Base Critical Damage Bonus is 100% (not 150% multiplier like PoE 1)
   * Two types of scaling: "increased" (multiplicative) and "added" (additive)
   */
  private calculatePoE2Crits(
    weapon: PoE2WeaponStats,
    skill: PoE2SkillData,
    stats: any
  ): { critChance: number; critMultiplier: number } {
    // Base crit chance with local modifiers
    let baseCrit = weapon.criticalStrikeChance * (1 + weapon.localIncreasedCritChance / 100);

    // Apply increased critical strike chance
    const finalCritChance = baseCrit * (1 + stats.increasedCritChance / 100);

    // PoE 2 Critical Damage Bonus calculation
    // Base is 100% (deals 100% extra damage, so 200% total)
    const baseCritBonus = 100;

    // Added critical damage bonus (flat additions)
    const addedCritBonus = (weapon.localCritMultiplier || 0) + (stats.addedCritMultiplier || 0);

    // Total base critical bonus
    const totalBaseCritBonus = baseCritBonus + addedCritBonus;

    // Apply increased critical damage bonus (multiplicative with base)
    const increasedCritDamage = stats.increasedCriticalDamageBonus || 0;
    const finalCritBonus = totalBaseCritBonus * (1 + increasedCritDamage / 100);

    // Convert to multiplier format (100% bonus = 200% multiplier)
    const finalCritMultiplier = 100 + finalCritBonus;

    return {
      critChance: Math.min(100, finalCritChance),
      critMultiplier: finalCritMultiplier
    };
  }

  /**
   * PoE 2 Damage Formula Application
   * (Base + Added) * Increased * More * Damage Effectiveness
   */
  private applyPoE2DamageFormula(
    baseDamage: DamageComponents,
    stats: any,
    skill: PoE2SkillData
  ): DamageComponents {
    const result: DamageComponents = { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 };

    const damageEffectiveness = skill.damageEffectiveness / 100;
    const increasedMultiplier = this.calculateIncreasedMultiplier(stats.increasedDamage);
    const moreMultiplier = this.calculateMoreMultiplier(stats.moreDamage);

    // Apply formula to each damage type
    Object.keys(baseDamage).forEach(damageType => {
      const base = baseDamage[damageType as keyof DamageComponents];
      result[damageType as keyof DamageComponents] =
        base * damageEffectiveness * increasedMultiplier * moreMultiplier;
    });

    return result;
  }

  /**
   * Calculate combo point DPS bonus
   */
  private calculateComboDPS(baseDPS: number, skill: PoE2SkillData): number {
    if (!skill.comboPointCost || skill.comboPointCost === 0) {
      return baseDPS;
    }

    // Combo points provide scaling damage bonus
    const comboMultiplier = 1 + (skill.comboPointCost * 0.3); // 30% more per combo point
    return baseDPS * comboMultiplier;
  }

  /**
   * Calculate increased damage multiplier
   * All "increased" modifiers are additive with each other
   */
  private calculateIncreasedMultiplier(increasedDamage: Record<string, number>): number {
    const totalIncreased = Object.values(increasedDamage).reduce((sum, value) => sum + value, 0);
    return 1 + totalIncreased / 100;
  }

  /**
   * Calculate more damage multiplier
   * All "more" modifiers are multiplicative with each other
   */
  private calculateMoreMultiplier(moreDamage: Record<string, number>): number {
    return Object.values(moreDamage).reduce((product, value) => product * (1 + value / 100), 1);
  }

  // Helper methods would continue here...
  private parseWeapon(item: PoEItem | null): PoE2WeaponStats {
    if (!item) {
      return this.getUnarmedStats();
    }

    const stats: PoE2WeaponStats = {
      physicalDamage: { min: 0, max: 0, average: 0 },
      attacksPerSecond: 1.0,
      criticalStrikeChance: 5,
      criticalStrikeMultiplier: 200, // PoE 2 base is 100% bonus = 200% total
      accuracy: 100,
      weaponType: this.determineWeaponType(item.typeLine),
      weaponClass: item.typeLine || 'Unknown',
      localIncreasedPhysicalDamage: 0,
      localIncreasedAttackSpeed: 0,
      localIncreasedCritChance: 0,
      localCritMultiplier: 0,
      localIncreasedAccuracy: 0,
      addedPhysicalDamage: { min: 0, max: 0, average: 0 },
      addedElementalDamage: {
        fire: { min: 0, max: 0, average: 0 },
        cold: { min: 0, max: 0, average: 0 },
        lightning: { min: 0, max: 0, average: 0 }
      },
      addedChaosDamage: { min: 0, max: 0, average: 0 }
    };

    // Parse weapon properties (base stats)
    item.properties?.forEach(prop => {
      switch (prop.name) {
        case 'Physical Damage':
          if (prop.values?.[0]?.[0]) {
            const damageRange = this.parseDamageRange(prop.values[0][0]);
            if (damageRange) {
              stats.physicalDamage = damageRange;
            }
          }
          break;
        case 'Attacks per Second':
          if (prop.values?.[0]?.[0]) {
            stats.attacksPerSecond = parseFloat(prop.values[0][0]);
          }
          break;
        case 'Critical Strike Chance':
          if (prop.values?.[0]?.[0]) {
            stats.criticalStrikeChance = parseFloat(prop.values[0][0].replace('%', ''));
          }
          break;
        case 'Critical Strike Multiplier':
          if (prop.values?.[0]?.[0]) {
            stats.criticalStrikeMultiplier = parseFloat(prop.values[0][0].replace('%', ''));
          }
          break;
        case 'Accuracy Rating':
          if (prop.values?.[0]?.[0]) {
            stats.accuracy = parseInt(prop.values[0][0]);
          }
          break;
      }
    });

    // Parse weapon modifiers
    this.parseWeaponMods(item.explicitMods || [], stats);
    this.parseWeaponMods(item.implicitMods || [], stats);
    this.parseWeaponMods(item.craftedMods || [], stats);

    return stats;
  }

  private parseSkill(skills: any[], selectedSkill?: string): PoE2SkillData {
    const skill = selectedSkill ?
      skills.find(s => s.name === selectedSkill) :
      skills[0];

    if (!skill) {
      return this.getBasicAttackSkill();
    }

    const activeGem = skill.activeGem || skill;
    const skillData: PoE2SkillData = {
      name: activeGem.name || skill.name || 'Basic Attack',
      type: this.determineSkillType(activeGem),
      level: activeGem.level || 1,
      quality: activeGem.quality || 0,
      spiritCost: this.parseSkillSpiritCost(activeGem),
      damageEffectiveness: this.parseSkillDamageEffectiveness(activeGem),
      addedDamageEffectiveness: 100,
      attackSpeedMultiplier: 1.0,
      castSpeedMultiplier: 1.0,
      supportGems: []
    };

    // Parse support gems
    if (skill.supportGems && Array.isArray(skill.supportGems)) {
      skillData.supportGems = skill.supportGems.map((support: any) => ({
        name: support.name || '',
        level: support.level || 1,
        quality: support.quality || 0,
        spiritCost: this.parseSupportSpiritCost(support),
        damageMultiplier: 1.0,
        attackSpeedMultiplier: 1.0,
        addedDamage: undefined,
        criticalStrikeChance: 0,
        criticalStrikeMultiplier: 0
      }));
    }

    // Parse combo mechanics
    skillData.comboPointCost = this.parseComboPointCost(activeGem);
    skillData.comboPointsGenerated = this.parseComboPointsGenerated(activeGem);

    // Parse base damage for spells
    if (skillData.type === 'spell') {
      skillData.baseDamage = this.parseSpellBaseDamage(activeGem);
    }

    return skillData;
  }

  /**
   * Determine skill type from gem data
   */
  private determineSkillType(gem: any): PoE2SkillData['type'] {
    const tags = gem.tags || [];
    const name = (gem.name || '').toLowerCase();

    if (tags.includes('Aura')) return 'aura';
    if (tags.includes('Channeling')) return 'channeling';
    if (name.includes('combo') || tags.includes('Combo')) return 'combo';
    if (tags.includes('Spell')) return 'spell';

    return 'attack';
  }

  /**
   * Parse spirit cost from skill gem
   */
  private parseSkillSpiritCost(gem: any): number {
    // This would need to be implemented based on actual PoE 2 gem data structure
    // For now, return a default based on gem type
    const gemType = this.determineSkillType(gem);
    switch (gemType) {
      case 'aura': return 25;
      case 'channeling': return 10;
      case 'spell': return 15;
      default: return 0;
    }
  }

  /**
   * Parse support gem spirit cost
   */
  private parseSupportSpiritCost(support: any): number {
    // This would parse actual spirit cost from support gem data
    // For now, return a default based on support type
    return 5;
  }

  /**
   * Parse skill damage effectiveness
   */
  private parseSkillDamageEffectiveness(gem: any): number {
    // This would parse actual damage effectiveness from gem data
    // For now, return defaults based on skill type
    const gemType = this.determineSkillType(gem);
    switch (gemType) {
      case 'spell': return 100;
      case 'attack': return 100;
      case 'channeling': return 80;
      default: return 100;
    }
  }

  /**
   * Parse combo point cost
   */
  private parseComboPointCost(gem: any): number | undefined {
    // This would parse actual combo cost from gem data
    const name = (gem.name || '').toLowerCase();
    if (name.includes('finishing') || name.includes('combo')) {
      return 3; // Default combo cost
    }
    return undefined;
  }

  /**
   * Parse combo points generated
   */
  private parseComboPointsGenerated(gem: any): number | undefined {
    // This would parse actual combo generation from gem data
    const name = (gem.name || '').toLowerCase();
    if (name.includes('building') || name.includes('generator')) {
      return 1; // Default combo generation
    }
    return undefined;
  }

  /**
   * Parse spell base damage
   */
  private parseSpellBaseDamage(gem: any): DamageComponents | undefined {
    // This would parse actual spell damage from gem data
    // For now, return placeholder values based on gem level
    const level = gem.level || 1;
    const baseDamage = level * 2;

    return {
      physical: 0,
      fire: baseDamage,
      cold: 0,
      lightning: 0,
      chaos: 0
    };
  }

  private parseCharacterStats(
    character: PoECharacterDetails,
    allocated: AllocatedPassives,
    treeData: PassiveTreeData
  ): any {
    const stats = {
      accuracyRating: 100, // Base accuracy
      enemyEvasion: 0, // Will be set by configuration
      increasedDamage: {} as Record<string, number>,
      moreDamage: {} as Record<string, number>,
      increasedCritChance: 0,
      addedCritMultiplier: 0,
      increasedAttackSpeed: 0,
      moreAttackSpeed: 0,
      dodgeEffectiveness: 0,
      blockChance: 0
    };

    // Parse passive tree bonuses
    allocated.nodes.forEach(nodeId => {
      const node = treeData.nodes[nodeId];
      if (!node) return;

      node.stats.forEach(stat => {
        this.parseStatString(stat, stats);
      });
    });

    // Parse equipment bonuses
    character.items?.forEach(item => {
      if (!item) return;

      // Parse all modifier types
      [...(item.explicitMods || []), ...(item.implicitMods || []), ...(item.craftedMods || [])]
        .forEach(mod => {
          this.parseStatString(mod, stats);
        });
    });

    // Parse skill gem bonuses (support gems)
    character.skills?.forEach(skill => {
      skill.supportGems?.forEach((support: any) => {
        // Parse support gem modifiers
        const supportMods = this.getSupportGemModifiers(support);
        supportMods.forEach(mod => {
          this.parseStatString(mod, stats);
        });
      });
    });

    return stats;
  }

  /**
   * Parse a stat string and add to character stats
   */
  private parseStatString(stat: string, stats: any): void {
    const patterns = [
      // Increased damage by type
      {
        regex: /(\d+)%\s+increased\s+(.+?)\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          const value = parseInt(match[1]);
          const damageType = match[2].toLowerCase().replace(/\s+/g, '_');
          stats.increasedDamage[damageType] = (stats.increasedDamage[damageType] || 0) + value;
        }
      },
      // More damage by type
      {
        regex: /(\d+)%\s+more\s+(.+?)\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          const value = parseInt(match[1]);
          const damageType = match[2].toLowerCase().replace(/\s+/g, '_');
          stats.moreDamage[damageType] = (stats.moreDamage[damageType] || 0) + value;
        }
      },
      // Generic increased damage
      {
        regex: /(\d+)%\s+increased\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          const value = parseInt(match[1]);
          stats.increasedDamage.all = (stats.increasedDamage.all || 0) + value;
        }
      },
      // Generic more damage
      {
        regex: /(\d+)%\s+more\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          const value = parseInt(match[1]);
          stats.moreDamage.all = (stats.moreDamage.all || 0) + value;
        }
      },
      // Attack speed
      {
        regex: /(\d+)%\s+increased\s+attack\s+speed/i,
        handler: (match: RegExpMatchArray) => {
          stats.increasedAttackSpeed += parseInt(match[1]);
        }
      },
      // More attack speed
      {
        regex: /(\d+)%\s+more\s+attack\s+speed/i,
        handler: (match: RegExpMatchArray) => {
          stats.moreAttackSpeed += parseInt(match[1]);
        }
      },
      // Critical strike chance
      {
        regex: /(\d+)%\s+increased\s+critical\s+strike\s+chance/i,
        handler: (match: RegExpMatchArray) => {
          stats.increasedCritChance += parseInt(match[1]);
        }
      },
      // Critical strike multiplier
      {
        regex: /\+(\d+)%\s+to\s+critical\s+strike\s+multiplier/i,
        handler: (match: RegExpMatchArray) => {
          stats.addedCritMultiplier += parseInt(match[1]);
        }
      },
      // Accuracy rating (flat)
      {
        regex: /\+(\d+)\s+to\s+accuracy\s+rating/i,
        handler: (match: RegExpMatchArray) => {
          stats.accuracyRating += parseInt(match[1]);
        }
      },
      // Accuracy rating (percentage)
      {
        regex: /(\d+)%\s+increased\s+accuracy\s+rating/i,
        handler: (match: RegExpMatchArray) => {
          // Apply percentage increase to base accuracy
          const increase = parseInt(match[1]) / 100;
          stats.accuracyRating = Math.floor(stats.accuracyRating * (1 + increase));
        }
      },
      // Block chance
      {
        regex: /(\d+)%\s+chance\s+to\s+block/i,
        handler: (match: RegExpMatchArray) => {
          stats.blockChance += parseInt(match[1]);
        }
      },
      // Dodge effectiveness (PoE 2 specific)
      {
        regex: /(\d+)%\s+increased\s+dodge\s+roll\s+effectiveness/i,
        handler: (match: RegExpMatchArray) => {
          stats.dodgeEffectiveness += parseInt(match[1]);
        }
      },
      // Minion damage modifiers
      {
        regex: /(\d+)%\s+increased\s+minion\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          stats.minionModifiers = stats.minionModifiers || {};
          stats.minionModifiers.increasedMinionDamage = (stats.minionModifiers.increasedMinionDamage || 0) + parseInt(match[1]);
        }
      },
      {
        regex: /(\d+)%\s+more\s+minion\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          stats.minionModifiers = stats.minionModifiers || {};
          stats.minionModifiers.moreMinionDamage = (stats.minionModifiers.moreMinionDamage || 0) + parseInt(match[1]);
        }
      },
      // Minion attack speed
      {
        regex: /minions\s+have\s+(\d+)%\s+increased\s+attack\s+speed/i,
        handler: (match: RegExpMatchArray) => {
          stats.minionModifiers = stats.minionModifiers || {};
          stats.minionModifiers.increasedAttackSpeed = (stats.minionModifiers.increasedAttackSpeed || 0) + parseInt(match[1]);
        }
      },
      // Additional minions
      {
        regex: /\+(\d+)\s+to\s+maximum\s+number\s+of\s+(skeletons|zombies|minions)/i,
        handler: (match: RegExpMatchArray) => {
          stats.minionModifiers = stats.minionModifiers || {};
          stats.minionModifiers.additionalMinions = (stats.minionModifiers.additionalMinions || 0) + parseInt(match[1]);
        }
      },
      // Minion life
      {
        regex: /minions\s+have\s+(\d+)%\s+increased\s+maximum\s+life/i,
        handler: (match: RegExpMatchArray) => {
          stats.minionModifiers = stats.minionModifiers || {};
          stats.minionModifiers.increasedMinionLife = (stats.minionModifiers.increasedMinionLife || 0) + parseInt(match[1]);
        }
      },
      // Spirit efficiency
      {
        regex: /(\d+)%\s+reduced\s+spirit\s+cost\s+of\s+skills/i,
        handler: (match: RegExpMatchArray) => {
          stats.minionModifiers = stats.minionModifiers || {};
          stats.minionModifiers.spiritEfficiency = (stats.minionModifiers.spiritEfficiency || 0) + parseInt(match[1]);
        }
      }
    ];

    for (const pattern of patterns) {
      const match = stat.match(pattern.regex);
      if (match) {
        pattern.handler(match);
        break;
      }
    }
  }

  /**
   * Extract minion modifiers from character data
   */
  extractMinionModifiers(
    character: PoECharacterDetails,
    allocated: AllocatedPassives,
    treeData: PassiveTreeData
  ): any {
    const modifiers = {
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

    // Extract from passive tree
    if (allocated && treeData) {
      allocated.nodes.forEach(nodeId => {
        const node = treeData.nodes[nodeId];
        if (node?.stats) {
          node.stats.forEach(stat => {
            this.parseMinionStatString(stat, modifiers);
          });
        }
      });
    }

    // Extract from items
    character.items?.forEach(item => {
      [...(item.explicitMods || []), ...(item.implicitMods || []), ...(item.craftedMods || [])]
        .forEach(mod => {
          this.parseMinionStatString(mod, modifiers);
        });
    });

    // Get weapon base damage for minion scaling
    const weapon = this.getMainHandWeapon(character.items);
    if (weapon) {
      const weaponStats = this.parseWeapon(weapon);
      modifiers.weaponBaseDamageToMinions = weaponStats.physicalDamage.average;
    }

    return modifiers;
  }

  /**
   * Parse minion-specific stat strings
   */
  private parseMinionStatString(stat: string, modifiers: any): void {
    const patterns = [
      {
        regex: /(\d+)%\s+increased\s+minion\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          modifiers.increasedMinionDamage += parseInt(match[1]);
        }
      },
      {
        regex: /(\d+)%\s+more\s+minion\s+damage/i,
        handler: (match: RegExpMatchArray) => {
          modifiers.moreMinionDamage += parseInt(match[1]);
        }
      },
      {
        regex: /minions\s+have\s+(\d+)%\s+increased\s+attack\s+speed/i,
        handler: (match: RegExpMatchArray) => {
          modifiers.increasedAttackSpeed += parseInt(match[1]);
        }
      },
      {
        regex: /\+(\d+)\s+to\s+maximum\s+number\s+of\s+(skeletons|zombies|minions)/i,
        handler: (match: RegExpMatchArray) => {
          modifiers.additionalMinions += parseInt(match[1]);
        }
      },
      {
        regex: /minions\s+have\s+(\d+)%\s+increased\s+maximum\s+life/i,
        handler: (match: RegExpMatchArray) => {
          modifiers.increasedMinionLife += parseInt(match[1]);
        }
      },
      {
        regex: /(\d+)%\s+reduced\s+spirit\s+cost\s+of\s+skills/i,
        handler: (match: RegExpMatchArray) => {
          modifiers.spiritEfficiency += parseInt(match[1]);
        }
      }
    ];

    for (const pattern of patterns) {
      const match = stat.match(pattern.regex);
      if (match) {
        pattern.handler(match);
        break;
      }
    }
  }

  /**
   * Get modifiers from a support gem
   */
  private getSupportGemModifiers(support: any): string[] {
    // This would need to be expanded based on actual PoE 2 support gem data
    // For now, return empty array as a placeholder
    return [];
  }

  // Additional helper methods...
  private getMainHandWeapon(items: PoEItem[]): PoEItem | null {
    return items.find(item =>
      item.inventoryId === 'Weapon' ||
      item.inventoryId === 'Weapon1'
    ) || null;
  }

  private getUnarmedStats(): PoE2WeaponStats {
    return {
      physicalDamage: { min: 2, max: 8, average: 5 },
      attacksPerSecond: 1.2,
      criticalStrikeChance: 5,
      criticalStrikeMultiplier: 200, // PoE 2 base is 100% bonus = 200% total
      accuracy: 100,
      weaponType: 'one_hand',
      weaponClass: 'Unarmed',
      localIncreasedPhysicalDamage: 0,
      localIncreasedAttackSpeed: 0,
      localIncreasedCritChance: 0,
      localCritMultiplier: 0,
      localIncreasedAccuracy: 0,
      addedPhysicalDamage: { min: 0, max: 0, average: 0 },
      addedElementalDamage: {
        fire: { min: 0, max: 0, average: 0 },
        cold: { min: 0, max: 0, average: 0 },
        lightning: { min: 0, max: 0, average: 0 }
      },
      addedChaosDamage: { min: 0, max: 0, average: 0 }
    };
  }

  private getBasicAttackSkill(): PoE2SkillData {
    return {
      name: 'Basic Attack',
      type: 'attack',
      level: 1,
      quality: 0,
      damageEffectiveness: 100,
      addedDamageEffectiveness: 100,
      attackSpeedMultiplier: 1.0,
      castSpeedMultiplier: 1.0,
      supportGems: []
    };
  }

  private weaponToDamageComponents(weapon: PoE2WeaponStats): DamageComponents {
    return {
      physical: weapon.physicalDamage.average,
      fire: weapon.addedElementalDamage.fire.average,
      cold: weapon.addedElementalDamage.cold.average,
      lightning: weapon.addedElementalDamage.lightning.average,
      chaos: weapon.addedChaosDamage.average
    };
  }

  private calculateBaseDamage(
    weapon: PoE2WeaponStats,
    skill: PoE2SkillData,
    stats: any
  ): DamageComponents {
    const weaponDamage = this.weaponToDamageComponents(weapon);
    const skillDamage = skill.baseDamage || { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 };

    return {
      physical: weaponDamage.physical + skillDamage.physical,
      fire: weaponDamage.fire + skillDamage.fire,
      cold: weaponDamage.cold + skillDamage.cold,
      lightning: weaponDamage.lightning + skillDamage.lightning,
      chaos: weaponDamage.chaos + skillDamage.chaos
    };
  }

  private calculateAttackSpeed(weapon: PoE2WeaponStats, skill: PoE2SkillData, stats: any): number {
    let baseSpeed = weapon.attacksPerSecond;

    // Local weapon modifiers
    baseSpeed *= (1 + weapon.localIncreasedAttackSpeed / 100);

    // Skill modifiers
    baseSpeed *= skill.attackSpeedMultiplier;

    // Global modifiers
    baseSpeed *= (1 + stats.increasedAttackSpeed / 100);
    baseSpeed *= (1 + stats.moreAttackSpeed / 100);

    return baseSpeed;
  }

  private calculateAverageDamage(damage: DamageComponents, critChance: number, critMultiplier: number): number {
    const totalDamage = damage.physical + damage.fire + damage.cold + damage.lightning + damage.chaos;
    const averageCritMultiplier = 1 + (critChance / 100) * ((critMultiplier - 100) / 100);
    return totalDamage * averageCritMultiplier;
  }

  private calculateAddedDamage(weapon: PoE2WeaponStats, stats: any): DamageComponents {
    return {
      physical: weapon.addedPhysicalDamage.average,
      fire: weapon.addedElementalDamage.fire.average,
      cold: weapon.addedElementalDamage.cold.average,
      lightning: weapon.addedElementalDamage.lightning.average,
      chaos: weapon.addedChaosDamage.average
    };
  }

  private calculateComboMultiplier(skill: PoE2SkillData): number {
    return skill.comboPointCost ? 1 + (skill.comboPointCost * 0.3) : 1;
  }

  private calculateFinalDamageMultiplier(stats: any): number {
    return this.calculateIncreasedMultiplier(stats.increasedDamage) *
           this.calculateMoreMultiplier(stats.moreDamage);
  }

  /**
   * Parse weapon modifiers into weapon stats
   */
  private parseWeaponMods(mods: string[], stats: PoE2WeaponStats): void {
    for (const mod of mods) {
      // Local increased physical damage
      let match = mod.match(/(\d+)%\s+increased\s+physical\s+damage/i);
      if (match) {
        stats.localIncreasedPhysicalDamage += parseInt(match[1]);
        continue;
      }

      // Local increased attack speed
      match = mod.match(/(\d+)%\s+increased\s+attack\s+speed/i);
      if (match) {
        stats.localIncreasedAttackSpeed += parseInt(match[1]);
        continue;
      }

      // Local increased critical strike chance
      match = mod.match(/(\d+)%\s+increased\s+critical\s+strike\s+chance/i);
      if (match) {
        stats.localIncreasedCritChance += parseInt(match[1]);
        continue;
      }

      // Local critical strike multiplier
      match = mod.match(/\+(\d+)%\s+to\s+critical\s+strike\s+multiplier/i);
      if (match) {
        stats.localCritMultiplier += parseInt(match[1]);
        continue;
      }

      // Local increased accuracy
      match = mod.match(/(\d+)%\s+increased\s+accuracy\s+rating/i);
      if (match) {
        stats.localIncreasedAccuracy += parseInt(match[1]);
        continue;
      }

      // Added physical damage
      match = mod.match(/adds\s+(\d+)\s+to\s+(\d+)\s+physical\s+damage/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        stats.addedPhysicalDamage = { min, max, average: (min + max) / 2 };
        continue;
      }

      // Added fire damage
      match = mod.match(/adds\s+(\d+)\s+to\s+(\d+)\s+fire\s+damage/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        stats.addedElementalDamage.fire = { min, max, average: (min + max) / 2 };
        continue;
      }

      // Added cold damage
      match = mod.match(/adds\s+(\d+)\s+to\s+(\d+)\s+cold\s+damage/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        stats.addedElementalDamage.cold = { min, max, average: (min + max) / 2 };
        continue;
      }

      // Added lightning damage
      match = mod.match(/adds\s+(\d+)\s+to\s+(\d+)\s+lightning\s+damage/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        stats.addedElementalDamage.lightning = { min, max, average: (min + max) / 2 };
        continue;
      }

      // Added chaos damage
      match = mod.match(/adds\s+(\d+)\s+to\s+(\d+)\s+chaos\s+damage/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        stats.addedChaosDamage = { min, max, average: (min + max) / 2 };
        continue;
      }
    }
  }

  /**
   * Parse damage range string like "12-18"
   */
  private parseDamageRange(damageStr: string): { min: number; max: number; average: number } | null {
    const match = damageStr.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return { min, max, average: (min + max) / 2 };
    }
    return null;
  }

  /**
   * Determine weapon type from type line
   */
  private determineWeaponType(typeLine: string): PoE2WeaponStats['weaponType'] {
    const lower = typeLine.toLowerCase();

    if (lower.includes('bow')) return 'bow';
    if (lower.includes('crossbow')) return 'crossbow';
    if (lower.includes('wand')) return 'wand';
    if (lower.includes('staff')) return 'staff';
    if (lower.includes('focus')) return 'focus';

    // Check for two-handed weapons
    if (lower.includes('two hand') || lower.includes('2h') ||
        lower.includes('maul') || lower.includes('hammer') ||
        lower.includes('axe') && lower.includes('great') ||
        lower.includes('sword') && (lower.includes('great') || lower.includes('two'))) {
      return 'two_hand';
    }

    return 'one_hand';
  }
}

export const poe2DpsCalculator = PoE2DPSCalculator.getInstance();
export default poe2DpsCalculator;