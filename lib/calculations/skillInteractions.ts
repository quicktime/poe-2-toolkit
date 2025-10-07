/**
 * Skill Interaction Manager for Path of Exile 2 v0.3+
 * Handles skill combos, triggers, and complex skill interactions
 *
 * PoE2 v0.3 Interaction Types:
 * - Combo System: Melee attacks chain with damage multipliers (~30% more per point)
 * - Triggers: Cast on Crit, Cast on Ailment, Cast on Hit, etc.
 * - Skill Chains: Sequential skill execution with timing
 * - Support Interactions: Complex support gem effects
 */

import type {
  SkillGem,
  SkillSetup,
  CalculatedSkill,
  SkillTag,
} from '@/types/skills';

export interface ComboState {
  currentPoints: number;
  maxPoints: number;
  damageMultiplier: number; // PoE2 v0.3: ~30% more per point baseline
  duration: number; // How long combo lasts (seconds)
  lastHitTime?: number; // Timestamp of last hit
}

export interface TriggerCondition {
  type: 'onCrit' | 'onHit' | 'onKill' | 'onAilment' | 'onBlock' | 'periodic';
  chance: number; // 0-100%
  cooldown?: number; // Seconds
  ailmentType?: 'ignite' | 'shock' | 'freeze' | 'poison' | 'bleed'; // For onAilment
  lastTriggerTime?: number; // Timestamp of last trigger
}

export interface TriggeredSkill {
  skill: SkillSetup;
  condition: TriggerCondition;
  spiritCost?: number; // PoE2 v0.3: Many triggers have spirit cost
  effectiveDPS: number; // DPS accounting for trigger chance and cooldown
}

export interface SkillChain {
  skills: SkillSetup[];
  executionType: 'sequential' | 'simultaneous';
  totalDPS: number;
  totalManaCost: number;
  totalSpiritCost: number;
}

export interface InteractionOutput {
  primarySkill: CalculatedSkill;
  triggeredSkills: TriggeredSkill[];
  comboState?: ComboState;
  chain?: SkillChain;
  totalEffectiveDPS: number;
  spiritRequired: number;
}

export class SkillInteractionManager {
  // PoE2 v0.3 Constants
  private readonly COMBO_BASE_MULTIPLIER = 0.30; // 30% more damage per combo point baseline
  private readonly COMBO_DEFAULT_DURATION = 4; // Combo expires after 4 seconds
  private readonly DEFAULT_TRIGGER_COOLDOWN = 0.15; // 150ms default cooldown for most triggers

  // Spirit costs for common triggers (PoE2 v0.3)
  private readonly TRIGGER_SPIRIT_COSTS: Record<string, number> = {
    'Cast on Critical Strike': 75,
    'Cast on Elemental Ailment': 100,
    'Cast on Melee Kill': 50,
    'Cast on Stun': 60,
    'Mark on Hit': 40,
  };

  /**
   * Calculate combo multiplier based on current combo points
   * PoE2 v0.3: Baseline ~30% more damage per combo point
   */
  calculateComboMultiplier(comboPoints: number, comboBonus: number = this.COMBO_BASE_MULTIPLIER): number {
    if (comboPoints <= 0) return 1;

    // More multipliers are multiplicative
    // e.g., 2 combo points = 1.3 * 1.3 = 1.69x damage
    return Math.pow(1 + comboBonus, comboPoints);
  }

  /**
   * Initialize a combo state for melee skills
   */
  initializeComboState(maxPoints: number = 3, damageBonus: number = this.COMBO_BASE_MULTIPLIER): ComboState {
    return {
      currentPoints: 0,
      maxPoints,
      damageMultiplier: 1,
      duration: this.COMBO_DEFAULT_DURATION,
    };
  }

  /**
   * Update combo state after a hit
   */
  updateComboState(state: ComboState, currentTime: number): ComboState {
    const timeSinceLastHit = state.lastHitTime ? (currentTime - state.lastHitTime) / 1000 : Infinity;

    // Reset combo if duration expired or expired
    if (timeSinceLastHit >= state.duration) {
      return {
        ...state,
        currentPoints: 1,
        damageMultiplier: this.calculateComboMultiplier(1),
        lastHitTime: currentTime,
      };
    }

    // Increment combo points
    const newPoints = Math.min(state.currentPoints + 1, state.maxPoints);
    return {
      ...state,
      currentPoints: newPoints,
      damageMultiplier: this.calculateComboMultiplier(newPoints),
      lastHitTime: currentTime,
    };
  }

  /**
   * Check if a skill can trigger based on condition
   */
  canTrigger(condition: TriggerCondition, currentTime: number): boolean {
    // Check cooldown
    if (condition.cooldown && condition.lastTriggerTime) {
      const timeSinceTrigger = (currentTime - condition.lastTriggerTime) / 1000;
      if (timeSinceTrigger < condition.cooldown) {
        return false;
      }
    }

    // Check trigger chance (0-100%)
    return Math.random() * 100 < condition.chance;
  }

  /**
   * Calculate effective DPS for a triggered skill
   * Accounts for trigger chance and cooldown
   */
  calculateTriggeredDPS(
    skillDPS: number,
    triggerCondition: TriggerCondition,
    primaryAttackRate: number
  ): number {
    const triggerChance = triggerCondition.chance / 100;

    // If there's a cooldown, calculate max triggers per second
    if (triggerCondition.cooldown && triggerCondition.cooldown > 0) {
      const maxTriggersPerSecond = 1 / triggerCondition.cooldown;
      const potentialTriggers = primaryAttackRate * triggerChance;
      const actualTriggers = Math.min(potentialTriggers, maxTriggersPerSecond);

      return skillDPS * actualTriggers / primaryAttackRate;
    }

    // No cooldown: simple probability
    return skillDPS * triggerChance;
  }

  /**
   * Parse trigger type from support gem name
   */
  parseTriggerType(gemName: string): TriggerCondition | null {
    const lowerName = gemName.toLowerCase();

    if (lowerName.includes('cast on critical strike') || lowerName.includes('cast on crit')) {
      return {
        type: 'onCrit',
        chance: 100,
        cooldown: this.DEFAULT_TRIGGER_COOLDOWN,
      };
    }

    if (lowerName.includes('cast on elemental ailment')) {
      return {
        type: 'onAilment',
        chance: 100,
        cooldown: 0.5, // 500ms cooldown for Cast on Ailment
      };
    }

    if (lowerName.includes('cast on melee kill')) {
      return {
        type: 'onKill',
        chance: 100,
        cooldown: 0.25,
      };
    }

    if (lowerName.includes('cast on stun')) {
      return {
        type: 'onBlock',
        chance: 100,
        cooldown: 0.25,
      };
    }

    return null;
  }

  /**
   * Get spirit cost for a trigger support gem
   */
  getTriggerSpiritCost(gemName: string): number {
    return this.TRIGGER_SPIRIT_COSTS[gemName] || 0;
  }

  /**
   * Calculate total spirit cost for all active skills and triggers
   */
  calculateTotalSpiritCost(
    activeSkills: SkillSetup[],
    triggeredSkills: TriggeredSkill[]
  ): number {
    let totalSpirit = 0;

    // Add spirit costs from active skills (auras, totems, minions)
    activeSkills.forEach(skill => {
      const spiritCost = this.getSkillSpiritCost(skill);
      totalSpirit += spiritCost;
    });

    // Add spirit costs from trigger setups
    triggeredSkills.forEach(triggered => {
      totalSpirit += triggered.spiritCost || 0;
    });

    return totalSpirit;
  }

  /**
   * Get spirit cost for a skill based on its tags
   */
  private getSkillSpiritCost(skill: SkillSetup): number {
    const tags = skill.activeGem.gem.tags;

    // Auras have spirit costs
    if (tags.includes('aura')) {
      return 50; // Base aura cost, should be from gem data
    }

    // Totems with Ancestral Bond
    if (tags.includes('totem')) {
      return 75; // PoE2 v0.3: Totems cost 75 spirit
    }

    // Minions have varying spirit costs
    if (tags.includes('minion')) {
      const gemName = skill.activeGem.gem.name.toLowerCase();
      if (gemName.includes('skeletal arsonist')) {
        return 39; // Minimum cost at low levels
      }
      return 50; // Default minion cost
    }

    return 0;
  }

  /**
   * Detect and configure skill chains
   */
  detectSkillChain(skills: SkillSetup[]): SkillChain | null {
    // Look for skills that should be chained together
    const meleeSkills = skills.filter(s => s.activeGem.gem.tags.includes('melee'));

    if (meleeSkills.length >= 2) {
      // Melee skills typically chain sequentially
      return {
        skills: meleeSkills,
        executionType: 'sequential',
        totalDPS: 0, // Will be calculated with full context
        totalManaCost: 0,
        totalSpiritCost: 0,
      };
    }

    return null;
  }

  /**
   * Check if two skills interact (e.g., skill A buffs skill B)
   */
  checkSkillInteraction(skillA: SkillSetup, skillB: SkillSetup): boolean {
    const tagsA = skillA.activeGem.gem.tags;
    const tagsB = skillB.activeGem.gem.tags;

    // Curse + damage skill interaction
    if (tagsA.includes('curse') && !tagsB.includes('curse')) {
      return true;
    }

    // Aura + any active skill
    if (tagsA.includes('aura') && !tagsB.includes('aura')) {
      return true;
    }

    // Combo skills (melee chains)
    if (tagsA.includes('melee') && tagsB.includes('melee')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate damage multiplier from skill tags and combo state
   */
  getSkillDamageMultiplier(skill: SkillSetup, comboState?: ComboState): number {
    let multiplier = 1;

    // Apply combo multiplier for melee skills
    if (skill.activeGem.gem.tags.includes('melee') && comboState) {
      multiplier *= comboState.damageMultiplier;
    }

    return multiplier;
  }

  /**
   * Validate spirit requirements
   */
  validateSpiritRequirements(totalSpirit: number, availableSpirit: number): {
    valid: boolean;
    deficit: number;
  } {
    return {
      valid: totalSpirit <= availableSpirit,
      deficit: Math.max(0, totalSpirit - availableSpirit),
    };
  }

  /**
   * Get all skills that would be triggered by a primary skill
   */
  getTriggeredSkills(
    primarySkill: SkillSetup,
    allSkills: SkillSetup[]
  ): { skill: SkillSetup; trigger: TriggerCondition }[] {
    const triggered: { skill: SkillSetup; trigger: TriggerCondition }[] = [];

    // Check primary skill's support gems for triggers
    primarySkill.supportGems.forEach(support => {
      const triggerCondition = this.parseTriggerType(support.gem.name);

      if (triggerCondition) {
        // Find skills in same link group that would be triggered
        const triggeredInGroup = allSkills.filter(s =>
          s.itemSlot === primarySkill.itemSlot &&
          s.id !== primarySkill.id &&
          s.enabled
        );

        triggeredInGroup.forEach(skill => {
          triggered.push({
            skill,
            trigger: triggerCondition,
          });
        });
      }
    });

    return triggered;
  }
}

export default SkillInteractionManager;
