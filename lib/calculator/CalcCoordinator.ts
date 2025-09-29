/**
 * CalcCoordinator - Main calculation orchestrator
 * Coordinates all calculation modules and manages the calculation pipeline
 */

import { ModifierList } from './ModifierList';
import CalcOffense, { 
  type OffenseInput, 
  type OffenseOutput,
  type SkillData,
  type WeaponData,
  type OffenseConfig 
} from './modules/CalcOffense';
import CalcDefense, { 
  type DefenseInput, 
  type DefenseOutput,
  type DefenseConfig 
} from './modules/CalcDefense';
import CalcSkills, { 
  type SkillsInput, 
  type SkillsOutput,
  type ActiveSkill,
  type PassiveSkill,
  type SkillsConfig 
} from './modules/CalcSkills';

// Import existing types
import type { PoECharacterDetails, PoEItem } from '@/lib/api/poeApiService';
import type { AllocatedPassives, PassiveTreeData } from '@/types/passiveTree';

export interface CalculationInput {
  // Character data
  character: PoECharacterDetails;
  
  // Passive tree
  allocatedPassives: AllocatedPassives;
  passiveTreeData: PassiveTreeData;
  
  // Skills
  activeSkills?: ActiveSkill[];
  passiveSkills?: PassiveSkill[];
  selectedSkill?: string;
  
  // Configuration
  config?: CalculationConfig;
}

export interface CalculationConfig {
  // Enemy configuration
  enemyLevel?: number;
  enemyType?: 'normal' | 'magic' | 'rare' | 'unique' | 'boss';
  enemyResistances?: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
    honor?: number;
  };
  enemyArmour?: number;
  enemyEvasion?: number;
  
  // Combat state
  isStationary?: boolean;
  isMoving?: boolean;
  hasKilledRecently?: boolean;
  hasBeenHitRecently?: boolean;
  onFullLife?: boolean;
  onLowLife?: boolean;
  
  // Charges
  enduranceCharges?: number;
  frenzyCharges?: number;
  powerCharges?: number;
  
  // PoE2 specific
  comboPoints?: number;
  honorStacks?: number;
  weaponSetActive?: 1 | 2;
  isDodging?: boolean;
}

export interface CalculationOutput {
  // Offensive stats
  offense: OffenseOutput;
  
  // Defensive stats
  defense: DefenseOutput;
  
  // Skill processing
  skills: SkillsOutput;
  
  // Combined metrics
  summary: CalculationSummary;
  
  // Full modifier list for debugging
  modifiers: ModifierDebugInfo;
  
  // Performance metrics
  performance: PerformanceMetrics;
}

export interface CalculationSummary {
  // Key offensive metrics
  totalDPS: number;
  effectiveDPS: number;
  damagePerHit: number;
  attacksPerSecond: number;
  criticalChance: number;
  criticalMultiplier: number;
  accuracy: number;
  
  // Key defensive metrics
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
  evadeChance: number;
  blockChance: number;
  
  // PoE2 specific
  spirit: number;
  availableSpirit: number;
  comboDPS?: number;
  dodgeEffectiveness: number;
  
  // Build viability scores
  offenseScore: number;
  defenseScore: number;
  overallScore: number;
}

export interface ModifierDebugInfo {
  count: number;
  sources: string[];
  breakdown: Record<string, any>;
}

export interface PerformanceMetrics {
  totalTime: number;
  moduleTimings: {
    modifierParsing: number;
    offense: number;
    defense: number;
    skills: number;
    summary: number;
  };
  cacheHits: number;
  cacheMisses: number;
}

export class CalcCoordinator {
  private static instance: CalcCoordinator;
  private cache: Map<string, CalculationOutput> = new Map();
  private performanceMetrics: PerformanceMetrics;

  private constructor() {
    this.performanceMetrics = this.initPerformanceMetrics();
  }

  static getInstance(): CalcCoordinator {
    if (!CalcCoordinator.instance) {
      CalcCoordinator.instance = new CalcCoordinator();
    }
    return CalcCoordinator.instance;
  }

  /**
   * Main calculation entry point
   */
  calculate(input: CalculationInput): CalculationOutput {
    const startTime = performance.now();
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(input);
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      cached.performance.cacheHits = this.performanceMetrics.cacheHits;
      return cached;
    }
    
    this.performanceMetrics.cacheMisses++;
    
    // Step 1: Parse all modifiers
    const modifierStartTime = performance.now();
    const modifiers = this.parseAllModifiers(input);
    this.performanceMetrics.moduleTimings.modifierParsing = performance.now() - modifierStartTime;
    
    // Step 2: Process skills
    const skillsStartTime = performance.now();
    const skillsOutput = this.calculateSkills(input, modifiers);
    this.performanceMetrics.moduleTimings.skills = performance.now() - skillsStartTime;
    
    // Merge skill modifiers into main modifier list
    modifiers.merge(skillsOutput.skillModifiers);
    
    // Step 3: Calculate offense
    const offenseStartTime = performance.now();
    const offenseOutput = this.calculateOffense(input, modifiers, skillsOutput);
    this.performanceMetrics.moduleTimings.offense = performance.now() - offenseStartTime;
    
    // Step 4: Calculate defense
    const defenseStartTime = performance.now();
    const defenseOutput = this.calculateDefense(input, modifiers);
    this.performanceMetrics.moduleTimings.defense = performance.now() - defenseStartTime;
    
    // Step 5: Generate summary
    const summaryStartTime = performance.now();
    const summary = this.generateSummary(offenseOutput, defenseOutput, skillsOutput);
    this.performanceMetrics.moduleTimings.summary = performance.now() - summaryStartTime;
    
    // Calculate total time
    this.performanceMetrics.totalTime = performance.now() - startTime;
    
    // Create output
    const output: CalculationOutput = {
      offense: offenseOutput,
      defense: defenseOutput,
      skills: skillsOutput,
      summary,
      modifiers: this.getModifierDebugInfo(modifiers),
      performance: { ...this.performanceMetrics }
    };
    
    // Cache result
    this.cache.set(cacheKey, output);
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return output;
  }

  /**
   * Parse all modifiers from character data
   */
  private parseAllModifiers(input: CalculationInput): ModifierList {
    const modifiers = new ModifierList();
    
    // Parse passive tree modifiers
    this.parsePassiveTreeModifiers(input.allocatedPassives, input.passiveTreeData, modifiers);
    
    // Parse item modifiers
    this.parseItemModifiers(input.character.items, modifiers);
    
    // Parse character base stats
    this.parseCharacterBaseStats(input.character, modifiers);
    
    // Parse configuration modifiers (conditional)
    this.parseConfigModifiers(input.config, modifiers);
    
    return modifiers;
  }

  /**
   * Parse passive tree modifiers
   */
  private parsePassiveTreeModifiers(
    allocated: AllocatedPassives,
    treeData: PassiveTreeData,
    modifiers: ModifierList
  ): void {
    for (const nodeId of allocated.nodes) {
      const node = treeData.nodes[nodeId];
      if (!node) continue;
      
      for (const stat of node.stats) {
        modifiers.parseAndAdd(stat, `passive_${nodeId}`);
      }
      
      // Check for keystones
      if (node.isKeystone) {
        // Add keystone-specific flags
        modifiers.add({
          type: 'FLAG',
          name: node.name.toLowerCase().replace(/\s+/g, '_'),
          value: 1,
          tags: [{ type: 'condition' }],
          source: `keystone_${nodeId}`,
          isKeystone: true
        });
      }
    }
    
    // Parse jewel modifiers
    if (allocated.jewels) {
      for (const [socketId, jewel] of Object.entries(allocated.jewels)) {
        if (jewel.mods) {
          for (const mod of jewel.mods) {
            modifiers.parseAndAdd(mod, `jewel_${socketId}`);
          }
        }
      }
    }
  }

  /**
   * Parse item modifiers
   */
  private parseItemModifiers(items: PoEItem[], modifiers: ModifierList): void {
    for (const item of items) {
      if (!item) continue;
      
      const source = `item_${item.inventoryId}`;
      
      // Parse implicit mods
      if (item.implicitMods) {
        for (const mod of item.implicitMods) {
          modifiers.parseAndAdd(mod, source);
        }
      }
      
      // Parse explicit mods
      if (item.explicitMods) {
        for (const mod of item.explicitMods) {
          modifiers.parseAndAdd(mod, source);
        }
      }
      
      // Parse crafted mods
      if (item.craftedMods) {
        for (const mod of item.craftedMods) {
          modifiers.parseAndAdd(mod, `${source}_crafted`);
        }
      }
      
      // Parse enchant mods
      if (item.enchantMods) {
        for (const mod of item.enchantMods) {
          modifiers.parseAndAdd(mod, `${source}_enchant`);
        }
      }
      
      // Add base defenses from armor pieces
      this.parseArmorBaseStats(item, modifiers);
    }
  }

  /**
   * Parse armor base stats
   */
  private parseArmorBaseStats(item: PoEItem, modifiers: ModifierList): void {
    if (!item.properties) return;
    
    for (const prop of item.properties) {
      switch (prop.name) {
        case 'Armour':
          if (prop.values?.[0]?.[0]) {
            modifiers.add({
              type: 'BASE',
              name: 'armour',
              value: parseInt(prop.values[0][0]),
              tags: [{ type: 'defense', subtype: 'armour' }],
              source: `item_${item.inventoryId}_base`
            });
          }
          break;
        case 'Evasion Rating':
          if (prop.values?.[0]?.[0]) {
            modifiers.add({
              type: 'BASE',
              name: 'evasion',
              value: parseInt(prop.values[0][0]),
              tags: [{ type: 'defense', subtype: 'evasion' }],
              source: `item_${item.inventoryId}_base`
            });
          }
          break;
        case 'Energy Shield':
          if (prop.values?.[0]?.[0]) {
            modifiers.add({
              type: 'BASE',
              name: 'energy_shield',
              value: parseInt(prop.values[0][0]),
              tags: [{ type: 'defense', subtype: 'energy_shield' }],
              source: `item_${item.inventoryId}_base`
            });
          }
          break;
      }
    }
  }

  /**
   * Parse character base stats
   */
  private parseCharacterBaseStats(character: PoECharacterDetails, modifiers: ModifierList): void {
    // Add base attributes
    modifiers.add({
      type: 'ADDED',
      name: 'strength',
      value: character.strength || 0,
      tags: [{ type: 'attribute', subtype: 'strength' }],
      source: 'character_base'
    });
    
    modifiers.add({
      type: 'ADDED',
      name: 'dexterity',
      value: character.dexterity || 0,
      tags: [{ type: 'attribute', subtype: 'dexterity' }],
      source: 'character_base'
    });
    
    modifiers.add({
      type: 'ADDED',
      name: 'intelligence',
      value: character.intelligence || 0,
      tags: [{ type: 'attribute', subtype: 'intelligence' }],
      source: 'character_base'
    });
  }

  /**
   * Parse configuration modifiers
   */
  private parseConfigModifiers(config: CalculationConfig | undefined, modifiers: ModifierList): void {
    if (!config) return;
    
    // Add charge bonuses
    if (config.enduranceCharges) {
      modifiers.add({
        type: 'ADDED',
        name: 'physical_damage_reduction',
        value: config.enduranceCharges * 4,
        tags: [{ type: 'defense' }],
        source: 'endurance_charges'
      });
    }
    
    if (config.frenzyCharges) {
      modifiers.add({
        type: 'INC',
        name: 'attack_speed',
        value: config.frenzyCharges * 4,
        tags: [{ type: 'speed' }],
        source: 'frenzy_charges'
      });
      
      modifiers.add({
        type: 'INC',
        name: 'cast_speed',
        value: config.frenzyCharges * 4,
        tags: [{ type: 'speed' }],
        source: 'frenzy_charges'
      });
    }
    
    if (config.powerCharges) {
      modifiers.add({
        type: 'INC',
        name: 'critical_strike_chance',
        value: config.powerCharges * 50,
        tags: [{ type: 'critical' }],
        source: 'power_charges'
      });
    }
    
    // Add conditional flags
    if (config.isStationary) {
      modifiers.add({
        type: 'FLAG',
        name: 'is_stationary',
        value: 1,
        tags: [{ type: 'condition' }],
        source: 'config'
      });
    }
    
    if (config.isMoving) {
      modifiers.add({
        type: 'FLAG',
        name: 'is_moving',
        value: 1,
        tags: [{ type: 'condition' }],
        source: 'config'
      });
    }
    
    if (config.hasKilledRecently) {
      modifiers.add({
        type: 'FLAG',
        name: 'killed_recently',
        value: 1,
        tags: [{ type: 'condition' }],
        source: 'config'
      });
    }
  }

  /**
   * Calculate offense
   */
  private calculateOffense(
    input: CalculationInput,
    modifiers: ModifierList,
    skillsOutput: SkillsOutput
  ): OffenseOutput {
    // Get selected skill
    const selectedSkill = input.selectedSkill || 
      (input.activeSkills && input.activeSkills[0]?.name) || 
      'Default Attack';
    
    const processedSkill = skillsOutput.processedSkills.find(s => s.name === selectedSkill);
    
    // Parse weapon data
    const weapon = this.parseWeapon(this.getMainHandWeapon(input.character.items));
    
    // Create skill data
    const skillData: SkillData = processedSkill ? {
      name: processedSkill.name,
      type: processedSkill.type as any,
      baseDamage: this.convertSkillDamage(processedSkill.damage),
      damageEffectiveness: processedSkill.damageEffectiveness,
      attackTime: processedSkill.attackSpeed ? 1 / processedSkill.attackSpeed : undefined,
      castTime: processedSkill.castSpeed ? 1 / processedSkill.castSpeed : undefined,
      critChance: processedSkill.critChance,
      critMultiplier: processedSkill.critMultiplier,
      spiritCost: processedSkill.spiritCost,
      comboPointCost: input.activeSkills?.find(s => s.name === selectedSkill)?.comboStage
    } : this.getDefaultSkillData();
    
    // Create offense config
    const offenseConfig: OffenseConfig = {
      enemyLevel: input.config?.enemyLevel || input.character.level,
      enemyEvasion: input.config?.enemyEvasion || 0,
      enemyArmour: input.config?.enemyArmour || 0,
      enemyResistances: input.config?.enemyResistances,
      comboPower: input.config?.comboPoints,
      isMoving: input.config?.isMoving,
      hasKilledRecently: input.config?.hasKilledRecently,
      onFullLife: input.config?.onFullLife,
      onLowLife: input.config?.onLowLife
    };
    
    // Calculate offense
    const calc = new CalcOffense({
      modifiers,
      skill: skillData,
      weapon,
      config: offenseConfig
    });
    
    return calc.calculate();
  }

  /**
   * Calculate defense
   */
  private calculateDefense(input: CalculationInput, modifiers: ModifierList): DefenseOutput {
    const defenseConfig: DefenseConfig = {
      hasEnduranceCharges: input.config?.enduranceCharges,
      hasFrenzyCharges: input.config?.frenzyCharges,
      hasPowerCharges: input.config?.powerCharges,
      isStationary: input.config?.isStationary,
      isMoving: input.config?.isMoving,
      hasBeenHitRecently: input.config?.hasBeenHitRecently,
      isOnFullLife: input.config?.onFullLife,
      isOnLowLife: input.config?.onLowLife,
      honorStacks: input.config?.honorStacks,
      isDodging: input.config?.isDodging,
      comboCounter: input.config?.comboPoints
    };
    
    const calc = new CalcDefense({
      modifiers,
      level: input.character.level,
      class: input.character.class,
      config: defenseConfig
    });
    
    return calc.calculate();
  }

  /**
   * Calculate skills
   */
  private calculateSkills(input: CalculationInput, modifiers: ModifierList): SkillsOutput {
    const skillsConfig: SkillsConfig = {
      enemyType: input.config?.enemyType,
      currentComboPoints: input.config?.comboPoints,
      weaponSetActive: input.config?.weaponSetActive
    };
    
    const calc = new CalcSkills({
      modifiers,
      activeSkills: input.activeSkills || [],
      passiveSkills: input.passiveSkills || [],
      config: skillsConfig
    });
    
    return calc.calculate();
  }

  /**
   * Generate summary
   */
  private generateSummary(
    offense: OffenseOutput,
    defense: DefenseOutput,
    skills: SkillsOutput
  ): CalculationSummary {
    // Calculate build scores
    const offenseScore = this.calculateOffenseScore(offense);
    const defenseScore = this.calculateDefenseScore(defense);
    const overallScore = (offenseScore + defenseScore) / 2;
    
    return {
      // Offensive metrics
      totalDPS: offense.totalDPS,
      effectiveDPS: offense.totalDPS * (offense.hitChance / 100),
      damagePerHit: offense.averageDamage,
      attacksPerSecond: offense.speed,
      criticalChance: offense.criticalChance,
      criticalMultiplier: offense.criticalMultiplier,
      accuracy: offense.hitChance,
      
      // Defensive metrics
      life: defense.life,
      mana: defense.mana,
      energyShield: defense.energyShield,
      effectiveHP: defense.effectiveHitPool.oneShot,
      resistances: {
        fire: defense.resistances.fire,
        cold: defense.resistances.cold,
        lightning: defense.resistances.lightning,
        chaos: defense.resistances.chaos,
        honor: defense.resistances.honor
      },
      physicalReduction: defense.physicalDamageReduction,
      evadeChance: defense.evadeChance,
      blockChance: defense.attackBlockChance,
      
      // PoE2 specific
      spirit: defense.spirit,
      availableSpirit: defense.availableSpirit,
      comboDPS: offense.comboDPS,
      dodgeEffectiveness: defense.dodgeEffectiveness,
      
      // Scores
      offenseScore,
      defenseScore,
      overallScore
    };
  }

  /**
   * Calculate offense score (0-100)
   */
  private calculateOffenseScore(offense: OffenseOutput): number {
    let score = 0;
    
    // DPS scoring (up to 50 points)
    if (offense.totalDPS < 10000) {
      score += offense.totalDPS / 200; // Linear up to 10k DPS
    } else if (offense.totalDPS < 100000) {
      score += 50 + (offense.totalDPS - 10000) / 3600; // Slower scaling
    } else {
      score += 75; // Cap at 75 for DPS
    }
    
    // Crit scoring (up to 15 points)
    score += Math.min(15, (offense.criticalChance / 100) * 15);
    
    // Hit chance scoring (up to 10 points)
    score += (offense.hitChance / 100) * 10;
    
    // Speed scoring (up to 10 points)
    score += Math.min(10, offense.speed * 2);
    
    // Spirit efficiency (up to 15 points for PoE2)
    if (offense.spiritEfficiency) {
      score += Math.min(15, offense.spiritEfficiency / 100);
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate defense score (0-100)
   */
  private calculateDefenseScore(defense: DefenseOutput): number {
    let score = 0;
    
    // EHP scoring (up to 40 points)
    const ehp = defense.effectiveHitPool.oneShot;
    if (ehp < 5000) {
      score += ehp / 125;
    } else if (ehp < 20000) {
      score += 40 + (ehp - 5000) / 750;
    } else {
      score += 60; // Cap at 60 for EHP
    }
    
    // Resistance scoring (up to 20 points)
    const avgRes = (defense.resistances.fire + defense.resistances.cold + 
                   defense.resistances.lightning) / 3;
    score += Math.min(20, (avgRes / 75) * 20);
    
    // Physical mitigation (up to 15 points)
    score += Math.min(15, (defense.physicalDamageReduction / 90) * 15);
    
    // Avoidance (up to 15 points)
    const avoidance = Math.max(defense.evadeChance, defense.attackBlockChance);
    score += Math.min(15, (avoidance / 75) * 15);
    
    // Recovery (up to 10 points)
    const recoveryRate = (defense.totalRegen / defense.life) * 100;
    score += Math.min(10, recoveryRate * 2);
    
    return Math.min(100, score);
  }

  // Helper methods
  private getMainHandWeapon(items: PoEItem[]): PoEItem | null {
    return items.find(item =>
      item.inventoryId === 'Weapon' ||
      item.inventoryId === 'Weapon1'
    ) || null;
  }

  private parseWeapon(item: PoEItem | null): WeaponData | undefined {
    if (!item) return undefined;
    
    const weapon: WeaponData = {
      baseDamage: {},
      attacksPerSecond: 1.0,
      criticalChance: 5,
      criticalMultiplier: 150,
      accuracy: 100,
      weaponType: item.typeLine || 'Unknown',
      isLocal: true
    };
    
    // Parse weapon properties
    if (item.properties) {
      for (const prop of item.properties) {
        switch (prop.name) {
          case 'Physical Damage':
            if (prop.values?.[0]?.[0]) {
              const match = prop.values[0][0].match(/(\d+)-(\d+)/);
              if (match) {
                weapon.baseDamage.physical = {
                  min: parseInt(match[1]),
                  max: parseInt(match[2])
                };
              }
            }
            break;
          case 'Attacks per Second':
            if (prop.values?.[0]?.[0]) {
              weapon.attacksPerSecond = parseFloat(prop.values[0][0]);
            }
            break;
          case 'Critical Strike Chance':
            if (prop.values?.[0]?.[0]) {
              weapon.criticalChance = parseFloat(prop.values[0][0].replace('%', ''));
            }
            break;
        }
      }
    }
    
    return weapon;
  }

  private convertSkillDamage(damage: any): any {
    if (!damage) return undefined;
    
    const converted: any = {};
    
    if (damage.physical) {
      converted.physical = { min: damage.physical, max: damage.physical };
    }
    if (damage.fire) {
      converted.fire = { min: damage.fire, max: damage.fire };
    }
    if (damage.cold) {
      converted.cold = { min: damage.cold, max: damage.cold };
    }
    if (damage.lightning) {
      converted.lightning = { min: damage.lightning, max: damage.lightning };
    }
    if (damage.chaos) {
      converted.chaos = { min: damage.chaos, max: damage.chaos };
    }
    
    return converted;
  }

  private getDefaultSkillData(): SkillData {
    return {
      name: 'Default Attack',
      type: 'attack',
      damageEffectiveness: 100,
      attackTime: 1.0
    };
  }

  private generateCacheKey(input: CalculationInput): string {
    // Simple cache key based on character ID and config
    return `${input.character.id}_${JSON.stringify(input.config || {})}`;
  }

  private getModifierDebugInfo(modifiers: ModifierList): ModifierDebugInfo {
    const exportData = modifiers.export();
    const sources = new Set<string>();
    
    for (const [_, mods] of Object.entries(exportData)) {
      for (const mod of mods as any[]) {
        if (mod.source) {
          sources.add(mod.source);
        }
      }
    }
    
    return {
      count: Object.keys(exportData).length,
      sources: Array.from(sources),
      breakdown: exportData
    };
  }

  private initPerformanceMetrics(): PerformanceMetrics {
    return {
      totalTime: 0,
      moduleTimings: {
        modifierParsing: 0,
        offense: 0,
        defense: 0,
        skills: 0,
        summary: 0
      },
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Clear calculation cache
   */
  clearCache(): void {
    this.cache.clear();
    this.performanceMetrics = this.initPerformanceMetrics();
  }
}

export const calcCoordinator = CalcCoordinator.getInstance();
export default calcCoordinator;