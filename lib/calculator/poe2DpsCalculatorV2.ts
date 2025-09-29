/**
 * Path of Exile 2 DPS Calculator V2
 * Adapter layer to integrate the new modular calculation system with existing codebase
 */

import { CalcCoordinator } from './CalcCoordinator';
import type { PoECharacterDetails, PoEItem } from '@/lib/api/poeApiService';
import type { AllocatedPassives, PassiveTreeData } from '@/types/passiveTree';
import type { PoE2DPSCalculation } from './poe2DpsCalculator';
import type { ActiveSkill, PassiveSkill } from './modules/CalcSkills';

export class PoE2DPSCalculatorV2 {
  private static instance: PoE2DPSCalculatorV2;
  private coordinator: CalcCoordinator;

  private constructor() {
    this.coordinator = CalcCoordinator.getInstance();
  }

  static getInstance(): PoE2DPSCalculatorV2 {
    if (!PoE2DPSCalculatorV2.instance) {
      PoE2DPSCalculatorV2.instance = new PoE2DPSCalculatorV2();
    }
    return PoE2DPSCalculatorV2.instance;
  }

  /**
   * Calculate DPS using the new modular system
   * Maintains backward compatibility with existing interface
   */
  calculateDPS(
    character: PoECharacterDetails,
    allocated: AllocatedPassives,
    treeData: PassiveTreeData,
    selectedSkill?: string
  ): PoE2DPSCalculation {
    // Convert character skills to new format
    const { activeSkills, passiveSkills } = this.convertSkills(character.skills);
    
    // Run calculation through new system
    const result = this.coordinator.calculate({
      character,
      allocatedPassives: allocated,
      passiveTreeData: treeData,
      activeSkills,
      passiveSkills,
      selectedSkill,
      config: {
        enemyLevel: character.level,
        enemyType: 'normal',
        onFullLife: true // Default assumptions
      }
    });
    
    // Convert to old format for backward compatibility
    return this.convertToLegacyFormat(result);
  }

  /**
   * Advanced calculation with full configuration
   */
  calculateAdvanced(
    character: PoECharacterDetails,
    allocated: AllocatedPassives,
    treeData: PassiveTreeData,
    config: {
      selectedSkill?: string;
      enemyLevel?: number;
      enemyType?: 'normal' | 'magic' | 'rare' | 'unique' | 'boss';
      enemyResistances?: {
        fire: number;
        cold: number;
        lightning: number;
        chaos: number;
        honor?: number;
      };
      combatState?: {
        isMoving?: boolean;
        hasKilledRecently?: boolean;
        onFullLife?: boolean;
        onLowLife?: boolean;
      };
      charges?: {
        endurance?: number;
        frenzy?: number;
        power?: number;
      };
      poe2?: {
        comboPoints?: number;
        honorStacks?: number;
        weaponSet?: 1 | 2;
      };
    }
  ): {
    dps: PoE2DPSCalculation;
    defense: DefenseCalculation;
    skills: SkillCalculation;
    summary: BuildSummary;
  } {
    // Convert skills
    const { activeSkills, passiveSkills } = this.convertSkills(character.skills);
    
    // Build configuration
    const calcConfig = {
      enemyLevel: config.enemyLevel || character.level,
      enemyType: config.enemyType || 'normal',
      enemyResistances: config.enemyResistances,
      isMoving: config.combatState?.isMoving,
      hasKilledRecently: config.combatState?.hasKilledRecently,
      onFullLife: config.combatState?.onFullLife,
      onLowLife: config.combatState?.onLowLife,
      enduranceCharges: config.charges?.endurance,
      frenzyCharges: config.charges?.frenzy,
      powerCharges: config.charges?.power,
      comboPoints: config.poe2?.comboPoints,
      honorStacks: config.poe2?.honorStacks,
      weaponSetActive: config.poe2?.weaponSet
    };
    
    // Run calculation
    const result = this.coordinator.calculate({
      character,
      allocatedPassives: allocated,
      passiveTreeData: treeData,
      activeSkills,
      passiveSkills,
      selectedSkill: config.selectedSkill,
      config: calcConfig
    });
    
    // Return full results
    return {
      dps: this.convertToLegacyFormat(result),
      defense: this.convertDefenseOutput(result.defense),
      skills: this.convertSkillsOutput(result.skills),
      summary: this.convertSummary(result.summary)
    };
  }

  /**
   * Convert character skills to new format
   */
  private convertSkills(skills: any[]): {
    activeSkills: ActiveSkill[];
    passiveSkills: PassiveSkill[];
  } {
    const activeSkills: ActiveSkill[] = [];
    const passiveSkills: PassiveSkill[] = [];
    
    if (!skills || !Array.isArray(skills)) {
      return { activeSkills, passiveSkills };
    }
    
    for (const skill of skills) {
      // Determine if skill is active or passive
      if (this.isPassiveSkill(skill)) {
        passiveSkills.push(this.convertToPassiveSkill(skill));
      } else {
        activeSkills.push(this.convertToActiveSkill(skill));
      }
    }
    
    return { activeSkills, passiveSkills };
  }

  /**
   * Check if skill is passive (aura, herald, etc)
   */
  private isPassiveSkill(skill: any): boolean {
    const passiveTypes = ['aura', 'herald', 'stance', 'blessing', 'banner'];
    const name = (skill.name || '').toLowerCase();
    const tags = skill.tags || [];
    
    return passiveTypes.some(type => 
      name.includes(type) || tags.includes(type)
    );
  }

  /**
   * Convert to active skill format
   */
  private convertToActiveSkill(skill: any): ActiveSkill {
    const activeGem = skill.activeGem || skill;
    
    return {
      id: skill.id || activeGem.name,
      name: activeGem.name || skill.name || 'Unknown Skill',
      level: activeGem.level || 1,
      quality: activeGem.quality || 0,
      type: this.determineSkillType(activeGem),
      tags: activeGem.tags || [],
      baseDamage: this.parseSkillDamage(activeGem),
      manaCost: activeGem.manaCost || 10,
      spiritCost: activeGem.spiritCost || 0,
      castTime: activeGem.castTime,
      attackTime: activeGem.attackTime,
      cooldown: activeGem.cooldown,
      supportGems: this.convertSupportGems(skill.supportGems || []),
      uncutGemSlots: this.convertUncutGems(skill.uncutGems || []),
      comboStage: activeGem.comboStage,
      triggerCondition: this.parseTriggerCondition(activeGem)
    };
  }

  /**
   * Convert to passive skill format
   */
  private convertToPassiveSkill(skill: any): PassiveSkill {
    const activeGem = skill.activeGem || skill;
    
    return {
      name: activeGem.name || skill.name || 'Unknown Aura',
      type: this.determinePassiveType(activeGem),
      level: activeGem.level || 1,
      spiritReservation: activeGem.spiritReservation || 25,
      manaReservation: activeGem.manaReservation,
      modifiers: this.parseGemModifiers(activeGem)
    };
  }

  /**
   * Determine skill type
   */
  private determineSkillType(gem: any): ActiveSkill['type'] {
    const tags = gem.tags || [];
    const name = (gem.name || '').toLowerCase();
    
    if (tags.includes('aura') || name.includes('aura')) return 'aura';
    if (tags.includes('channeling')) return 'channeling';
    if (tags.includes('trigger')) return 'trigger';
    if (name.includes('combo') || tags.includes('combo')) return 'combo';
    if (tags.includes('spell')) return 'spell';
    
    return 'attack';
  }

  /**
   * Determine passive skill type
   */
  private determinePassiveType(gem: any): PassiveSkill['type'] {
    const name = (gem.name || '').toLowerCase();
    
    if (name.includes('herald')) return 'herald';
    if (name.includes('stance')) return 'stance';
    if (name.includes('blessing')) return 'blessing';
    
    return 'aura';
  }

  /**
   * Parse skill damage
   */
  private parseSkillDamage(gem: any): any {
    if (!gem.damage) return undefined;
    
    return {
      physical: gem.damage.physical ? 
        { min: gem.damage.physical.min || 0, max: gem.damage.physical.max || 0 } : undefined,
      fire: gem.damage.fire ? 
        { min: gem.damage.fire.min || 0, max: gem.damage.fire.max || 0 } : undefined,
      cold: gem.damage.cold ? 
        { min: gem.damage.cold.min || 0, max: gem.damage.cold.max || 0 } : undefined,
      lightning: gem.damage.lightning ? 
        { min: gem.damage.lightning.min || 0, max: gem.damage.lightning.max || 0 } : undefined,
      chaos: gem.damage.chaos ? 
        { min: gem.damage.chaos.min || 0, max: gem.damage.chaos.max || 0 } : undefined
    };
  }

  /**
   * Convert support gems
   */
  private convertSupportGems(supports: any[]): any[] {
    return supports.map(support => ({
      id: support.id || support.name,
      name: support.name || 'Unknown Support',
      level: support.level || 1,
      quality: support.quality || 0,
      tags: support.tags || [],
      spiritCost: support.spiritCost || 5,
      modifiers: this.parseGemModifiers(support)
    }));
  }

  /**
   * Convert uncut gems
   */
  private convertUncutGems(uncutGems: any[]): any[] {
    return uncutGems.map(gem => ({
      gemName: gem.name || 'Unknown Uncut',
      level: gem.level || 1,
      quality: gem.quality || 0,
      spiritCost: gem.spiritCost || 10,
      supportedSkills: gem.supportedSkills || ['all'],
      modifiers: this.parseGemModifiers(gem)
    }));
  }

  /**
   * Parse gem modifiers
   */
  private parseGemModifiers(gem: any): any[] {
    const modifiers: any[] = [];
    
    if (gem.modifiers && Array.isArray(gem.modifiers)) {
      return gem.modifiers;
    }
    
    // Parse from properties
    if (gem.properties) {
      for (const prop of gem.properties) {
        modifiers.push({
          type: 'increased',
          stat: prop.name.toLowerCase().replace(/\s+/g, '_'),
          value: prop.value || 0
        });
      }
    }
    
    return modifiers;
  }

  /**
   * Parse trigger condition
   */
  private parseTriggerCondition(gem: any): any {
    if (!gem.trigger) return undefined;
    
    return {
      type: gem.trigger.type || 'on_hit',
      chance: gem.trigger.chance || 100,
      cooldown: gem.trigger.cooldown || 0
    };
  }

  /**
   * Convert new format to legacy format
   */
  private convertToLegacyFormat(result: any): PoE2DPSCalculation {
    const offense = result.offense;
    const defense = result.defense;
    const summary = result.summary;
    
    return {
      totalDPS: offense.totalDPS,
      skillDPS: offense.totalDPS,
      effectiveDPS: summary.effectiveDPS,
      physicalDPS: offense.physicalDPS,
      elementalDPS: {
        fire: offense.fireDPS,
        cold: offense.coldDPS,
        lightning: offense.lightningDPS
      },
      chaosDPS: offense.chaosDPS,
      comboDPS: offense.comboDPS || 0,
      spiritEfficiency: offense.spiritEfficiency || 0,
      weaponSwapDPS: undefined,
      hitChance: offense.hitChance,
      critChance: offense.criticalChance,
      critMultiplier: offense.criticalMultiplier,
      attacksPerSecond: offense.speed,
      damagePerHit: offense.averageDamage,
      comboPointsGenerated: 0,
      dodgeEffectiveness: defense.dodgeEffectiveness,
      blockChance: defense.attackBlockChance,
      calculations: {
        baseWeaponDamage: offense.breakdown.baseDamage,
        baseSkillDamage: { physical: 0, fire: 0, cold: 0, lightning: 0, chaos: 0 },
        addedDamage: offense.breakdown.addedDamage,
        damageEffectiveness: offense.breakdown.damageEffectiveness,
        comboMultiplier: offense.comboDPS ? offense.comboDPS / offense.totalDPS : 1,
        spiritCost: summary.spirit - summary.availableSpirit,
        increasedDamage: { all: offense.breakdown.increasedDamage },
        moreDamage: { all: offense.breakdown.moreDamage },
        finalDamageMultiplier: offense.breakdown.moreDamage * (1 + offense.breakdown.increasedDamage / 100),
        accuracyRating: 1000, // Placeholder
        enemyEvasion: 0,
        finalHitChance: offense.hitChance,
        baseCritChance: 5,
        increasedCritChance: offense.criticalChance - 5,
        finalCritChance: offense.criticalChance,
        baseCritMultiplier: 150,
        addedCritMultiplier: offense.criticalMultiplier - 150,
        finalCritMultiplier: offense.criticalMultiplier,
        baseAttackSpeed: 1.0,
        increasedAttackSpeed: 0,
        moreAttackSpeed: 0,
        finalAttackSpeed: offense.speed
      }
    };
  }

  /**
   * Convert defense output
   */
  private convertDefenseOutput(defense: any): DefenseCalculation {
    return {
      life: defense.life,
      mana: defense.mana,
      energyShield: defense.energyShield,
      effectiveHP: defense.effectiveHitPool.oneShot,
      resistances: defense.resistances,
      physicalReduction: defense.physicalDamageReduction,
      evasion: defense.evasion,
      evadeChance: defense.evadeChance,
      block: {
        attack: defense.attackBlockChance,
        spell: defense.spellBlockChance
      },
      recovery: {
        lifeRegen: defense.lifeRegen,
        lifeLeech: defense.lifeLeech,
        totalRecovery: defense.netRecovery
      },
      spirit: defense.spirit,
      availableSpirit: defense.availableSpirit
    };
  }

  /**
   * Convert skills output
   */
  private convertSkillsOutput(skills: any): SkillCalculation {
    return {
      processedSkills: skills.processedSkills,
      totalReservation: {
        spirit: skills.totalSpiritReservation,
        mana: skills.totalManaReservation
      },
      activeAuras: skills.activeAuras,
      triggeredSkills: skills.triggeredSkills,
      uncutGemBonuses: skills.uncutGemBonuses,
      comboChains: skills.comboChains
    };
  }

  /**
   * Convert summary
   */
  private convertSummary(summary: any): BuildSummary {
    return {
      offensiveMetrics: {
        totalDPS: summary.totalDPS,
        effectiveDPS: summary.effectiveDPS,
        damagePerHit: summary.damagePerHit,
        attacksPerSecond: summary.attacksPerSecond,
        criticalChance: summary.criticalChance,
        criticalMultiplier: summary.criticalMultiplier,
        accuracy: summary.accuracy,
        comboDPS: summary.comboDPS
      },
      defensiveMetrics: {
        life: summary.life,
        mana: summary.mana,
        energyShield: summary.energyShield,
        effectiveHP: summary.effectiveHP,
        resistances: summary.resistances,
        physicalReduction: summary.physicalReduction,
        evadeChance: summary.evadeChance,
        blockChance: summary.blockChance,
        dodgeEffectiveness: summary.dodgeEffectiveness
      },
      resourceMetrics: {
        spirit: summary.spirit,
        availableSpirit: summary.availableSpirit
      },
      scores: {
        offense: summary.offenseScore,
        defense: summary.defenseScore,
        overall: summary.overallScore
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.coordinator.clearCache();
  }
}

// Type definitions for return values
interface DefenseCalculation {
  life: number;
  mana: number;
  energyShield: number;
  effectiveHP: number;
  resistances: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
    honor: number;
  };
  physicalReduction: number;
  evasion: number;
  evadeChance: number;
  block: {
    attack: number;
    spell: number;
  };
  recovery: {
    lifeRegen: number;
    lifeLeech: number;
    totalRecovery: number;
  };
  spirit: number;
  availableSpirit: number;
}

interface SkillCalculation {
  processedSkills: any[];
  totalReservation: {
    spirit: number;
    mana: number;
  };
  activeAuras: any[];
  triggeredSkills: any[];
  uncutGemBonuses: any[];
  comboChains: any[];
}

interface BuildSummary {
  offensiveMetrics: {
    totalDPS: number;
    effectiveDPS: number;
    damagePerHit: number;
    attacksPerSecond: number;
    criticalChance: number;
    criticalMultiplier: number;
    accuracy: number;
    comboDPS?: number;
  };
  defensiveMetrics: {
    life: number;
    mana: number;
    energyShield: number;
    effectiveHP: number;
    resistances: any;
    physicalReduction: number;
    evadeChance: number;
    blockChance: number;
    dodgeEffectiveness: number;
  };
  resourceMetrics: {
    spirit: number;
    availableSpirit: number;
  };
  scores: {
    offense: number;
    defense: number;
    overall: number;
  };
}

export const poe2DpsCalculatorV2 = PoE2DPSCalculatorV2.getInstance();
export default poe2DpsCalculatorV2;