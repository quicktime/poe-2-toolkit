/**
 * CalcSkills - Skill gem and support interaction calculation module
 * Handles skill gems, support gems, triggers, and PoE2 uncut gems
 */

import { ModifierList } from '../ModifierList';

export interface SkillsInput {
  modifiers: ModifierList;
  activeSkills: ActiveSkill[];
  passiveSkills?: PassiveSkill[];
  config?: SkillsConfig;
}

export interface ActiveSkill {
  id: string;
  name: string;
  level: number;
  quality: number;
  type: 'attack' | 'spell' | 'channeling' | 'aura' | 'combo' | 'trigger';
  tags: string[];
  // Base stats
  baseDamage?: SkillDamage;
  manaCost?: number;
  spiritCost?: number; // PoE2
  castTime?: number;
  attackTime?: number;
  cooldown?: number;
  // Support gems
  supportGems: SupportGem[];
  // PoE2 specific
  uncutGemSlots?: UncutGemSlot[];
  comboStage?: number;
  triggerCondition?: TriggerCondition;
}

export interface SupportGem {
  id: string;
  name: string;
  level: number;
  quality: number;
  tags: string[];
  spiritCost?: number; // PoE2
  modifiers: GemModifier[];
}

export interface UncutGemSlot {
  gemName: string;
  level: number;
  quality: number;
  spiritCost: number;
  supportedSkills: string[]; // Which skills this uncut gem supports
  modifiers: GemModifier[];
}

export interface PassiveSkill {
  name: string;
  type: 'aura' | 'herald' | 'stance' | 'blessing';
  level: number;
  spiritReservation?: number; // PoE2 uses spirit instead of mana reservation
  manaReservation?: number;
  modifiers: GemModifier[];
}

export interface GemModifier {
  type: 'increased' | 'more' | 'added' | 'base' | 'override';
  stat: string;
  value: number | string;
  condition?: string;
}

export interface SkillDamage {
  physical?: { min: number; max: number };
  fire?: { min: number; max: number };
  cold?: { min: number; max: number };
  lightning?: { min: number; max: number };
  chaos?: { min: number; max: number };
}

export interface TriggerCondition {
  type: 'on_hit' | 'on_crit' | 'on_kill' | 'when_hit' | 'on_skill_use' | 'while_channeling';
  chance?: number;
  cooldown?: number;
}

export interface SkillsConfig {
  // Configuration for conditional modifiers
  enemyType?: 'normal' | 'magic' | 'rare' | 'unique' | 'boss';
  skillChainCount?: number;
  projectileCount?: number;
  isChanneling?: boolean;
  channelStage?: number;
  // PoE2 specific
  currentComboPoints?: number;
  weaponSetActive?: 1 | 2;
}

export interface SkillsOutput {
  // Processed skills ready for damage calculation
  processedSkills: ProcessedSkill[];
  
  // Total reservation
  totalSpiritReservation: number; // PoE2
  totalManaReservation: number;
  
  // Active auras and their effects
  activeAuras: AuraEffect[];
  
  // Triggered skills and their proc rates
  triggeredSkills: TriggeredSkill[];
  
  // PoE2 specific
  uncutGemBonuses: UncutGemBonus[];
  comboChains: ComboChain[];
  
  // Skill-specific modifiers to apply
  skillModifiers: ModifierList;
}

export interface ProcessedSkill {
  id: string;
  name: string;
  type: string;
  // Calculated values after support gems
  damage?: SkillDamage;
  damageEffectiveness: number;
  attackSpeed?: number;
  castSpeed?: number;
  critChance?: number;
  critMultiplier?: number;
  // Resources
  manaCost: number;
  spiritCost: number;
  // Multipliers from supports
  damageMultiplier: number;
  speedMultiplier: number;
  // Tags after modification
  finalTags: string[];
  // Active support gems
  activeSupportGems: string[];
}

export interface AuraEffect {
  name: string;
  modifiers: GemModifier[];
  reservation: number;
  type: 'spirit' | 'mana';
}

export interface TriggeredSkill {
  name: string;
  triggerType: string;
  procChance: number;
  cooldown: number;
  dpsContribution: number;
}

export interface UncutGemBonus {
  gemName: string;
  supportedSkills: string[];
  totalSpiritCost: number;
  modifiers: GemModifier[];
}

export interface ComboChain {
  skills: string[];
  currentStage: number;
  maxStage: number;
  damageMultiplier: number;
}

export class CalcSkills {
  private modifiers: ModifierList;
  private activeSkills: ActiveSkill[];
  private passiveSkills: PassiveSkill[];
  private config: SkillsConfig;
  private skillModifiers: ModifierList;

  // PoE2 uncut gem spirit cost efficiency by type
  // In PoE2, support gems don't have damage penalties, they have spirit costs
  private readonly UNCUT_SPIRIT_COST: Record<string, number> = {
    'added_damage': 15,      // High spirit cost for damage
    'elemental_damage': 12,  // Moderate spirit cost
    'physical_damage': 12,   // Moderate spirit cost
    'critical_strikes': 18,  // Very high spirit cost
    'attack_speed': 10,      // Lower spirit cost
    'cast_speed': 10,        // Lower spirit cost
    'area_of_effect': 8,     // Low spirit cost
    'projectile': 10,        // Moderate spirit cost
    'duration': 6,           // Very low spirit cost
    'trigger': 20,           // Highest spirit cost
    'utility': 5             // Utility supports are cheap
  };

  constructor(input: SkillsInput) {
    this.modifiers = input.modifiers;
    this.activeSkills = input.activeSkills;
    this.passiveSkills = input.passiveSkills || [];
    this.config = input.config || {};
    this.skillModifiers = new ModifierList();
  }

  /**
   * Main calculation entry point
   */
  calculate(): SkillsOutput {
    // Process passive skills (auras, heralds, etc.)
    const { auras, spiritReserved, manaReserved } = this.processPassiveSkills();
    
    // Process active skills with support gems
    const processedSkills = this.processActiveSkills();
    
    // Process triggered skills
    const triggeredSkills = this.processTriggeredSkills(processedSkills);
    
    // Process PoE2 uncut gems
    const uncutGemBonuses = this.processUncutGems();
    
    // Process combo chains
    const comboChains = this.processComboChains();
    
    // Apply all skill-based modifiers
    this.applySkillModifiers();
    
    return {
      processedSkills,
      totalSpiritReservation: spiritReserved,
      totalManaReservation: manaReserved,
      activeAuras: auras,
      triggeredSkills,
      uncutGemBonuses,
      comboChains,
      skillModifiers: this.skillModifiers
    };
  }

  /**
   * Process passive skills - PoE2 Spirit Reservation System
   * In PoE2, all persistent effects use spirit, not mana
   */
  private processPassiveSkills(): {
    auras: AuraEffect[];
    spiritReserved: number;
    manaReserved: number;
  } {
    const auras: AuraEffect[] = [];
    let spiritReserved = 0;
    let manaReserved = 0; // PoE2 doesn't use mana reservation
    
    for (const skill of this.passiveSkills) {
      // PoE2 spirit efficiency calculation
      // Different skills have different efficiency scaling
      const skillTypeEfficiency: Record<string, number> = {
        'aura': 1.0,      // Standard efficiency
        'herald': 0.8,    // Heralds are more efficient
        'stance': 0.6,    // Stances are very efficient
        'blessing': 1.2,  // Blessings cost more
        'banner': 0.7     // PoE2 banners are efficient
      };
      
      const baseEfficiency = skillTypeEfficiency[skill.type] || 1.0;
      const efficiencyMod = this.modifiers.sum('INC', { 
        type: 'resource', 
        subtype: 'spirit_efficiency' 
      });
      
      // PoE2 formula: Base * TypeMultiplier * (1 - Efficiency/100)
      const efficiency = baseEfficiency * (1 - (efficiencyMod / 100));
      
      // In PoE2, everything uses spirit
      const baseReservation = skill.spiritReservation || 25; // Default spirit cost
      const reservation = Math.floor(baseReservation * efficiency);
      spiritReserved += reservation;
      
      auras.push({
        name: skill.name,
        modifiers: skill.modifiers,
        reservation,
        type: 'spirit' // Always spirit in PoE2
      });
      
      // Apply aura modifiers to global modifiers
      for (const mod of skill.modifiers) {
        this.applyGemModifier(mod, skill.name);
      }
    }
    
    return { auras, spiritReserved, manaReserved: 0 }; // No mana reservation in PoE2
  }

  /**
   * Process active skills with support gems
   */
  private processActiveSkills(): ProcessedSkill[] {
    const processed: ProcessedSkill[] = [];
    
    for (const skill of this.activeSkills) {
      // Check which support gems can support this skill
      const validSupports = this.getValidSupportGems(skill);
      
      // Calculate skill with supports
      const processedSkill = this.calculateSkillWithSupports(skill, validSupports);
      
      processed.push(processedSkill);
    }
    
    return processed;
  }

  /**
   * Get valid support gems for a skill
   */
  private getValidSupportGems(skill: ActiveSkill): SupportGem[] {
    const validSupports: SupportGem[] = [];
    
    for (const support of skill.supportGems) {
      // Check if support gem tags match skill tags
      if (this.canSupportSkill(skill, support)) {
        validSupports.push(support);
      }
    }
    
    // PoE2: Check uncut gems
    if (skill.uncutGemSlots) {
      for (const uncutSlot of skill.uncutGemSlots) {
        if (uncutSlot.supportedSkills.includes(skill.name) || 
            uncutSlot.supportedSkills.includes('all')) {
          // Convert uncut gem to support gem format
          validSupports.push({
            id: `uncut_${uncutSlot.gemName}`,
            name: uncutSlot.gemName,
            level: uncutSlot.level,
            quality: uncutSlot.quality,
            tags: [],
            spiritCost: uncutSlot.spiritCost,
            modifiers: uncutSlot.modifiers
          });
        }
      }
    }
    
    return validSupports;
  }

  /**
   * Check if a support gem can support a skill
   */
  private canSupportSkill(skill: ActiveSkill, support: SupportGem): boolean {
    // Check for "cannot be supported" flag
    if (skill.tags.includes('unsupportable')) {
      return false;
    }
    
    // Check tag requirements
    const requiredTags = this.getSupportRequiredTags(support.name);
    for (const required of requiredTags) {
      if (!skill.tags.includes(required)) {
        return false;
      }
    }
    
    // Check excluded tags
    const excludedTags = this.getSupportExcludedTags(support.name);
    for (const excluded of excludedTags) {
      if (skill.tags.includes(excluded)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate skill with support gems applied
   */
  private calculateSkillWithSupports(skill: ActiveSkill, supports: SupportGem[]): ProcessedSkill {
    let damageMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let critChance = 5; // Base crit
    let critMultiplier = 150; // Base crit multi
    let manaCostMultiplier = 1.0;
    let spiritCost = skill.spiritCost || 0;
    
    const activeSupportNames: string[] = [];
    const finalTags = [...skill.tags];
    
    // Apply each support gem
    for (const support of supports) {
      activeSupportNames.push(support.name);
      
      // Apply support modifiers
      for (const mod of support.modifiers) {
        switch (mod.stat) {
          case 'damage':
            if (mod.type === 'more') {
              damageMultiplier *= (1 + (mod.value as number) / 100);
            }
            break;
          case 'attack_speed':
          case 'cast_speed':
            if (skill.type === 'attack' && mod.stat === 'attack_speed' ||
                skill.type === 'spell' && mod.stat === 'cast_speed') {
              if (mod.type === 'more') {
                speedMultiplier *= (1 + (mod.value as number) / 100);
              }
            }
            break;
          case 'critical_strike_chance':
            if (mod.type === 'increased') {
              critChance *= (1 + (mod.value as number) / 100);
            } else if (mod.type === 'added') {
              critChance += (mod.value as number);
            }
            break;
          case 'critical_strike_multiplier':
            if (mod.type === 'added') {
              critMultiplier += (mod.value as number);
            }
            break;
          case 'mana_cost':
            if (mod.type === 'more') {
              manaCostMultiplier *= (1 + (mod.value as number) / 100);
            }
            break;
        }
        
        // Add support gem tags to skill
        if (mod.stat === 'add_tag' && typeof mod.value === 'string') {
          finalTags.push(mod.value);
        }
      }
      
      // Add spirit cost for PoE2 supports
      if (support.spiritCost) {
        spiritCost += support.spiritCost;
      }
    }
    
    // PoE2: No support gem penalties, only spirit costs
    // Damage effectiveness is based on skill, not support count
    const baseDamageEffectiveness = skill.damageEffectiveness || 100;
    const damageEffectiveness = baseDamageEffectiveness;
    
    // Calculate final values
    const processedSkill: ProcessedSkill = {
      id: skill.id,
      name: skill.name,
      type: skill.type,
      damage: skill.baseDamage,
      damageEffectiveness,
      attackSpeed: skill.attackTime ? (1 / skill.attackTime) * speedMultiplier : undefined,
      castSpeed: skill.castTime ? (1 / skill.castTime) * speedMultiplier : undefined,
      critChance,
      critMultiplier,
      manaCost: (skill.manaCost || 0) * manaCostMultiplier,
      spiritCost,
      damageMultiplier,
      speedMultiplier,
      finalTags,
      activeSupportGems: activeSupportNames
    };
    
    return processedSkill;
  }

  /**
   * Process triggered skills
   */
  private processTriggeredSkills(skills: ProcessedSkill[]): TriggeredSkill[] {
    const triggered: TriggeredSkill[] = [];
    
    for (const skill of this.activeSkills) {
      if (skill.triggerCondition) {
        const processed = skills.find(s => s.id === skill.id);
        if (!processed) continue;
        
        // Calculate proc rate
        const procChance = skill.triggerCondition.chance || 100;
        const cooldown = skill.triggerCondition.cooldown || 0;
        
        // Calculate DPS contribution
        let dpsContribution = 0;
        if (cooldown > 0) {
          // Fixed cooldown trigger
          dpsContribution = (1 / cooldown) * (procChance / 100);
        } else {
          // Per-action trigger (like cast on crit)
          const actionsPerSecond = this.getActionsPerSecond(skill.triggerCondition.type);
          dpsContribution = actionsPerSecond * (procChance / 100);
        }
        
        triggered.push({
          name: skill.name,
          triggerType: skill.triggerCondition.type,
          procChance,
          cooldown,
          dpsContribution
        });
      }
    }
    
    return triggered;
  }

  /**
   * Process PoE2 uncut gems
   */
  private processUncutGems(): UncutGemBonus[] {
    const uncutBonuses: UncutGemBonus[] = [];
    
    for (const skill of this.activeSkills) {
      if (!skill.uncutGemSlots) continue;
      
      for (const uncutSlot of skill.uncutGemSlots) {
        // Check if we already processed this uncut gem
        const existing = uncutBonuses.find(u => u.gemName === uncutSlot.gemName);
        
        if (existing) {
          // Add skill to supported list
          if (!existing.supportedSkills.includes(skill.name)) {
            existing.supportedSkills.push(skill.name);
          }
        } else {
          // Create new uncut gem bonus
          uncutBonuses.push({
            gemName: uncutSlot.gemName,
            supportedSkills: uncutSlot.supportedSkills,
            totalSpiritCost: uncutSlot.spiritCost,
            modifiers: uncutSlot.modifiers
          });
          
          // Apply uncut gem modifiers globally
          for (const mod of uncutSlot.modifiers) {
            this.applyGemModifier(mod, `uncut_${uncutSlot.gemName}`);
          }
        }
      }
    }
    
    return uncutBonuses;
  }

  /**
   * Process combo chains (PoE2 specific)
   */
  private processComboChains(): ComboChain[] {
    const chains: ComboChain[] = [];
    
    // Group skills by combo chain
    const comboSkills = this.activeSkills.filter(s => s.type === 'combo');
    
    if (comboSkills.length > 0) {
      // Simple combo chain detection
      const chain: ComboChain = {
        skills: comboSkills.map(s => s.name),
        currentStage: this.config.currentComboPoints || 0,
        maxStage: comboSkills.length,
        damageMultiplier: 1 + (0.3 * (this.config.currentComboPoints || 0)) // 30% more per combo
      };
      
      chains.push(chain);
    }
    
    return chains;
  }

  /**
   * Apply gem modifier to global modifiers
   */
  private applyGemModifier(mod: GemModifier, source: string): void {
    // Convert gem modifier to ModifierList format
    switch (mod.type) {
      case 'increased':
        this.skillModifiers.add({
          type: 'INC',
          name: mod.stat,
          value: mod.value as number,
          tags: [{ type: 'damage' }],
          source
        });
        break;
      case 'more':
        this.skillModifiers.add({
          type: 'MORE',
          name: mod.stat,
          value: mod.value as number,
          tags: [{ type: 'damage' }],
          source
        });
        break;
      case 'added':
        this.skillModifiers.add({
          type: 'ADDED',
          name: mod.stat,
          value: mod.value as number,
          tags: [{ type: 'damage' }],
          source
        });
        break;
      case 'base':
        this.skillModifiers.add({
          type: 'BASE',
          name: mod.stat,
          value: mod.value as number,
          tags: [{ type: 'damage' }],
          source
        });
        break;
      case 'override':
        this.skillModifiers.add({
          type: 'OVERRIDE',
          name: mod.stat,
          value: mod.value as number,
          tags: [{ type: 'damage' }],
          source
        });
        break;
    }
  }

  /**
   * Apply all skill-based modifiers to the global modifier list
   */
  private applySkillModifiers(): void {
    // Skill modifiers are already collected in this.skillModifiers
    // The caller should merge this with the main modifier list
  }

  /**
   * Get required tags for a support gem
   */
  private getSupportRequiredTags(supportName: string): string[] {
    // This would be populated from game data
    const requirements: Record<string, string[]> = {
      'melee_physical_damage': ['melee'],
      'spell_echo': ['spell'],
      'multistrike': ['melee', 'attack'],
      'unleash': ['spell'],
      'ancestral_call': ['melee', 'strike'],
      'chain': ['projectile'],
      'fork': ['projectile'],
      'pierce': ['projectile']
    };
    
    return requirements[supportName.toLowerCase().replace(/\s+/g, '_')] || [];
  }

  /**
   * Get excluded tags for a support gem
   */
  private getSupportExcludedTags(supportName: string): string[] {
    // This would be populated from game data
    const exclusions: Record<string, string[]> = {
      'melee_physical_damage': ['spell'],
      'spell_echo': ['attack', 'totem', 'trap', 'mine'],
      'multistrike': ['spell', 'totem'],
      'unleash': ['attack', 'channeling'],
      'ancestral_call': ['spell', 'totem']
    };
    
    return exclusions[supportName.toLowerCase().replace(/\s+/g, '_')] || [];
  }

  /**
   * Get actions per second for trigger calculation
   */
  private getActionsPerSecond(triggerType: string): number {
    // This would be calculated based on the main skill
    switch (triggerType) {
      case 'on_hit':
        return 5; // Assume 5 hits per second
      case 'on_crit':
        return 2; // Assume 2 crits per second
      case 'on_kill':
        return 1; // Assume 1 kill per second
      case 'when_hit':
        return 0.5; // Assume hit twice per second
      case 'on_skill_use':
        return 3; // Assume 3 skill uses per second
      case 'while_channeling':
        return 10; // Channeling tick rate
      default:
        return 1;
    }
  }
}

export default CalcSkills;