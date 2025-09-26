/**
 * Path of Exile 2 Crafting Knowledge Base - Version 0.3+ Mechanics
 * IMPORTANT: This is for PoE 2, NOT PoE 1
 */

import { 
  CraftingMethod, 
  CraftingMethodType,
  CraftingCurrency,
  ItemModifier,
  ModifierPool,
  MetamodOption,
  BenchCraft,
  CraftingRequirements,
  CraftingOutcome,
  CraftingCost
} from '@/types/crafting';

/**
 * Path of Exile 2 Currency Orbs and their NEW effects
 */
export const POE2_CURRENCIES: Record<string, CraftingCurrency> = {
  // Basic Currency - PoE 2 Version
  TRANSMUTATION: {
    id: 'transmutation',
    name: 'Orb of Transmutation',
    type: 'basic_currency',
    effect: 'Upgrades normal item to magic with ONE modifier (PoE2: only 1 mod)'
  },
  TRANSMUTATION_GREATER: {
    id: 'transmutation_greater',
    name: 'Greater Orb of Transmutation',
    type: 'basic_currency',
    effect: 'Upgrades normal to magic with ONE higher-tier modifier'
  },
  TRANSMUTATION_PERFECT: {
    id: 'transmutation_perfect',
    name: 'Perfect Orb of Transmutation',
    type: 'basic_currency',
    effect: 'Upgrades normal to magic with ONE highest-tier modifier'
  },
  
  AUGMENTATION: {
    id: 'augmentation',
    name: 'Orb of Augmentation',
    type: 'basic_currency',
    effect: 'Adds a new modifier to magic item (if it has only 1)'
  },
  AUGMENTATION_GREATER: {
    id: 'augmentation_greater',
    name: 'Greater Orb of Augmentation',
    type: 'basic_currency',
    effect: 'Adds a higher-tier modifier to magic item'
  },
  AUGMENTATION_PERFECT: {
    id: 'augmentation_perfect',
    name: 'Perfect Orb of Augmentation',
    type: 'basic_currency',
    effect: 'Adds a highest-tier modifier to magic item'
  },
  
  REGAL: {
    id: 'regal',
    name: 'Regal Orb',
    type: 'basic_currency',
    effect: 'Upgrades magic to rare, adds one modifier'
  },
  REGAL_GREATER: {
    id: 'regal_greater',
    name: 'Greater Regal Orb',
    type: 'basic_currency',
    effect: 'Upgrades magic to rare, adds one higher-tier modifier'
  },
  REGAL_PERFECT: {
    id: 'regal_perfect',
    name: 'Perfect Regal Orb',
    type: 'basic_currency',
    effect: 'Upgrades magic to rare, adds one highest-tier modifier'
  },
  
  ALCHEMY: {
    id: 'alchemy',
    name: 'Orb of Alchemy',
    type: 'basic_currency',
    effect: 'Upgrades normal to rare with EXACTLY 4 modifiers (PoE2: always 4)'
  },
  
  CHAOS: {
    id: 'chaos',
    name: 'Chaos Orb',
    type: 'basic_currency',
    effect: 'Removes ONE random modifier and adds ONE new modifier (PoE2: single mod swap)'
  },
  CHAOS_GREATER: {
    id: 'chaos_greater',
    name: 'Greater Chaos Orb',
    type: 'basic_currency',
    effect: 'Removes one modifier, adds one higher-tier modifier'
  },
  CHAOS_PERFECT: {
    id: 'chaos_perfect',
    name: 'Perfect Chaos Orb',
    type: 'basic_currency',
    effect: 'Removes one modifier, adds one highest-tier modifier'
  },
  
  EXALTED: {
    id: 'exalted',
    name: 'Exalted Orb',
    type: 'basic_currency',
    effect: 'Adds a new random affix to a rare item'
  },
  EXALTED_GREATER: {
    id: 'exalted_greater',
    name: 'Greater Exalted Orb',
    type: 'basic_currency',
    effect: 'Adds a new higher-tier affix to a rare item'
  },
  EXALTED_PERFECT: {
    id: 'exalted_perfect',
    name: 'Perfect Exalted Orb',
    type: 'basic_currency',
    effect: 'Adds a new highest-tier affix to a rare item'
  },
  
  DIVINE: {
    id: 'divine',
    name: 'Divine Orb',
    type: 'basic_currency',
    effect: 'Rerolls the numeric values of all modifiers'
  },
  
  ANNULMENT: {
    id: 'annulment',
    name: 'Orb of Annulment',
    type: 'basic_currency',
    effect: 'Removes a random modifier from an item'
  },
  
  BLESSED: {
    id: 'blessed',
    name: 'Blessed Orb',
    type: 'basic_currency',
    effect: 'Rerolls the implicit modifier values'
  },
  
  VAAL: {
    id: 'vaal',
    name: 'Vaal Orb',
    type: 'corrupt',
    effect: 'Corrupts item with unpredictable results'
  },
  
  // REMOVED from PoE 2:
  // - Orb of Scouring (no longer exists)
  // - Orb of Alteration (no longer exists)
  // - Chromatic Orb (sockets are on gems now)
  // - Orb of Fusing (sockets auto-link)
  // - Jeweller's Orb (sockets on gems)
};

/**
 * Path of Exile 2 NEW Currency Types
 */
export const POE2_NEW_CURRENCIES = {
  // Runes - New crafting system
  RUNE_PHYSICAL: {
    id: 'rune_physical',
    name: 'Rune of Physical',
    type: 'rune',
    effect: 'Adds guaranteed physical modifier (weaker than normal mods)'
  },
  RUNE_FIRE: {
    id: 'rune_fire',
    name: 'Rune of Fire',
    type: 'rune',
    effect: 'Adds guaranteed fire modifier'
  },
  RUNE_COLD: {
    id: 'rune_cold',
    name: 'Rune of Cold',
    type: 'rune',
    effect: 'Adds guaranteed cold modifier'
  },
  RUNE_LIGHTNING: {
    id: 'rune_lightning',
    name: 'Rune of Lightning',
    type: 'rune',
    effect: 'Adds guaranteed lightning modifier'
  },
  RUNE_LIFE: {
    id: 'rune_life',
    name: 'Rune of Life',
    type: 'rune',
    effect: 'Adds guaranteed life modifier'
  },
  RUNE_DEFENSE: {
    id: 'rune_defense',
    name: 'Rune of Defense',
    type: 'rune',
    effect: 'Adds guaranteed defense modifier'
  },
  
  // Soul Cores - Work with Runes
  SOUL_CORE_MINOR: {
    id: 'soul_core_minor',
    name: 'Minor Soul Core',
    type: 'soul_core',
    effect: 'Enables rune application (low power)'
  },
  SOUL_CORE_MAJOR: {
    id: 'soul_core_major',
    name: 'Major Soul Core',
    type: 'soul_core',
    effect: 'Enables rune application (medium power)'
  },
  SOUL_CORE_PRIME: {
    id: 'soul_core_prime',
    name: 'Prime Soul Core',
    type: 'soul_core',
    effect: 'Enables rune application (high power)'
  },
  
  // Omens - Modify currency behavior
  OMEN_PREFIX: {
    id: 'omen_prefix',
    name: 'Omen of Prefixes',
    type: 'omen',
    effect: 'Next currency affects only prefixes'
  },
  OMEN_SUFFIX: {
    id: 'omen_suffix',
    name: 'Omen of Suffixes',
    type: 'omen',
    effect: 'Next currency affects only suffixes'
  },
  OMEN_DOUBLE: {
    id: 'omen_double',
    name: 'Omen of Duplication',
    type: 'omen',
    effect: 'Next currency applies twice'
  },
  OMEN_FORTUNE: {
    id: 'omen_fortune',
    name: 'Omen of Fortune',
    type: 'omen',
    effect: 'Next currency has lucky rolls (higher tiers)'
  },
  
  // Distilled Orbs (combined Blight/Delirium)
  DISTILLED_EMOTION: {
    id: 'distilled_emotion',
    name: 'Distilled Emotion',
    type: 'distilled',
    effect: 'Adds special modifier based on emotion type'
  },
  DISTILLED_IRE: {
    id: 'distilled_ire',
    name: 'Distilled Ire',
    type: 'distilled',
    effect: 'Adds damage-focused special modifier'
  },
  DISTILLED_GUILT: {
    id: 'distilled_guilt',
    name: 'Distilled Guilt',
    type: 'distilled',
    effect: 'Adds defense-focused special modifier'
  }
};

/**
 * Path of Exile 2 Essence System (Two Tiers)
 */
export const POE2_ESSENCES = {
  // Normal Essences - Upgrade normal to magic with 1 mod
  ESSENCE_WRATH: {
    id: 'essence_wrath',
    name: 'Essence of Wrath',
    type: 'essence',
    effect: 'Normal → Magic with guaranteed fire damage'
  },
  ESSENCE_HATRED: {
    id: 'essence_hatred',
    name: 'Essence of Hatred',
    type: 'essence',
    effect: 'Normal → Magic with guaranteed cold damage'
  },
  ESSENCE_ANGER: {
    id: 'essence_anger',
    name: 'Essence of Anger',
    type: 'essence',
    effect: 'Normal → Magic with guaranteed physical damage'
  },
  ESSENCE_SORROW: {
    id: 'essence_sorrow',
    name: 'Essence of Sorrow',
    type: 'essence',
    effect: 'Normal → Magic with guaranteed life'
  },
  
  // Greater Essences - Upgrade magic to rare with guaranteed mod
  GREATER_ESSENCE_WRATH: {
    id: 'greater_essence_wrath',
    name: 'Greater Essence of Wrath',
    type: 'essence',
    effect: 'Magic → Rare with guaranteed high-tier fire damage'
  },
  GREATER_ESSENCE_HATRED: {
    id: 'greater_essence_hatred',
    name: 'Greater Essence of Hatred',
    type: 'essence',
    effect: 'Magic → Rare with guaranteed high-tier cold damage'
  },
  GREATER_ESSENCE_ANGER: {
    id: 'greater_essence_anger',
    name: 'Greater Essence of Anger',
    type: 'essence',
    effect: 'Magic → Rare with guaranteed high-tier physical damage'
  },
  GREATER_ESSENCE_SORROW: {
    id: 'greater_essence_sorrow',
    name: 'Greater Essence of Sorrow',
    type: 'essence',
    effect: 'Magic → Rare with guaranteed high-tier life'
  }
};

/**
 * Path of Exile 2 Crafting Methods
 */
export class PoE2CraftingKnowledgeBase {
  private methods: Map<string, CraftingMethod> = new Map();
  private modifierPools: Map<string, ModifierPool> = new Map();
  
  constructor() {
    this.initializePoE2Methods();
    this.initializeModifierPools();
  }
  
  /**
   * Initialize PoE 2 specific crafting methods
   */
  private initializePoE2Methods() {
    // Basic Currency Methods - PoE 2 Version
    this.addMethod({
      id: 'transmute_craft',
      name: 'Transmutation Crafting',
      type: 'basic_currency',
      description: 'Use Transmutation to create magic item with 1 mod',
      requirements: {
        itemRarity: 'normal'
      },
      outcomes: [{
        probability: 1,
        effect: 'Upgrade to magic with ONE modifier',
        adds: ['prefixes'] // or suffixes, but only one
      }],
      cost: {
        currency: { transmutation: 1 },
        averageTotal: 0.5
      }
    });
    
    this.addMethod({
      id: 'chaos_reroll_poe2',
      name: 'Chaos Reroll (PoE2)',
      type: 'basic_currency',
      description: 'Remove and replace ONE modifier (not full reroll)',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Remove one random mod, add one random mod',
        removes: ['prefixes'], // or suffixes
        adds: ['prefixes'] // or suffixes
      }],
      cost: {
        currency: { chaos: 1 },
        averageTotal: 1
      }
    });
    
    this.addMethod({
      id: 'alchemy_craft_poe2',
      name: 'Alchemy Crafting (PoE2)',
      type: 'basic_currency',
      description: 'Create rare with exactly 4 modifiers',
      requirements: {
        itemRarity: 'normal'
      },
      outcomes: [{
        probability: 1,
        effect: 'Upgrade to rare with exactly 4 modifiers',
        adds: ['prefixes', 'suffixes'] // Always 4 total
      }],
      cost: {
        currency: { alchemy: 1 },
        averageTotal: 1.5
      }
    });
    
    // Tiered Currency Methods
    this.addMethod({
      id: 'greater_chaos',
      name: 'Greater Chaos Reroll',
      type: 'basic_currency',
      description: 'Remove one mod, add one higher-tier mod',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Remove one mod, add one with min ilvl 60',
        removes: ['prefixes'],
        adds: ['prefixes']
      }],
      cost: {
        currency: { chaos_greater: 1 },
        averageTotal: 10
      }
    });
    
    this.addMethod({
      id: 'perfect_chaos',
      name: 'Perfect Chaos Reroll',
      type: 'basic_currency',
      description: 'Remove one mod, add one highest-tier mod',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Remove one mod, add one with min ilvl 80',
        removes: ['prefixes'],
        adds: ['prefixes']
      }],
      cost: {
        currency: { chaos_perfect: 1 },
        averageTotal: 50
      }
    });
    
    // Rune Crafting
    this.addMethod({
      id: 'rune_physical',
      name: 'Physical Rune Application',
      type: 'rune',
      description: 'Add guaranteed physical modifier with Soul Core',
      requirements: {
        itemRarity: 'magic' // or rare
      },
      outcomes: [{
        probability: 1,
        effect: 'Add weak but guaranteed physical mod',
        adds: ['prefixes']
      }],
      cost: {
        currency: {}, // Rune + Soul Core
        averageTotal: 5
      },
      successRate: 1 // Deterministic
    });
    
    this.addMethod({
      id: 'rune_elemental',
      name: 'Elemental Rune Application',
      type: 'rune',
      description: 'Add guaranteed elemental modifier',
      requirements: {
        itemRarity: 'magic'
      },
      outcomes: [{
        probability: 1,
        effect: 'Add weak but guaranteed elemental mod',
        adds: ['prefixes']
      }],
      cost: {
        currency: {},
        averageTotal: 5
      },
      successRate: 1
    });
    
    // Omen-Enhanced Crafting
    this.addMethod({
      id: 'omen_prefix_chaos',
      name: 'Omen-Enhanced Chaos (Prefix)',
      type: 'omen',
      description: 'Chaos orb affects only prefixes',
      requirements: {
        itemRarity: 'rare',
        hasModifier: ['prefix'] // Must have at least one prefix
      },
      outcomes: [{
        probability: 1,
        effect: 'Remove one prefix, add one prefix',
        removes: ['prefixes'],
        adds: ['prefixes']
      }],
      cost: {
        currency: { chaos: 1 }, // Plus omen
        averageTotal: 15
      }
    });
    
    this.addMethod({
      id: 'omen_double_exalt',
      name: 'Omen-Enhanced Exalt (Double)',
      type: 'omen',
      description: 'Exalt orb applies twice',
      requirements: {
        itemRarity: 'rare',
        openPrefixes: 1 // Or suffixes
      },
      outcomes: [{
        probability: 1,
        effect: 'Add TWO random modifiers',
        adds: ['prefixes', 'suffixes']
      }],
      cost: {
        currency: { exalted: 1 }, // Plus omen
        averageTotal: 250
      }
    });
    
    // Essence Crafting - PoE 2 Version
    this.addMethod({
      id: 'essence_normal',
      name: 'Normal Essence',
      type: 'essence',
      description: 'Normal → Magic with one guaranteed mod',
      requirements: {
        itemRarity: 'normal'
      },
      outcomes: [{
        probability: 1,
        effect: 'Upgrade to magic with specific modifier',
        adds: ['prefixes']
      }],
      cost: {
        currency: {},
        averageTotal: 3
      },
      successRate: 1
    });
    
    this.addMethod({
      id: 'greater_essence',
      name: 'Greater Essence',
      type: 'essence',
      description: 'Magic → Rare with guaranteed mod',
      requirements: {
        itemRarity: 'magic'
      },
      outcomes: [{
        probability: 1,
        effect: 'Upgrade to rare with specific high-tier modifier',
        adds: ['prefixes', 'suffixes']
      }],
      cost: {
        currency: {},
        averageTotal: 20
      },
      successRate: 1
    });
    
    // Distilled Orbs
    this.addMethod({
      id: 'distilled_emotion',
      name: 'Distilled Emotion',
      type: 'distilled',
      description: 'Add special emotion-based modifier',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Add unique distilled modifier',
        adds: ['prefixes'] // Special mod type
      }],
      cost: {
        currency: {},
        averageTotal: 30
      }
    });
    
    // NO LONGER IN POE 2:
    // - Scouring (removed)
    // - Alteration spam (removed)
    // - Fossil crafting (removed)
    // - Harvest crafting (removed)
    // - Beast crafting (removed)
    // - Catalyst quality (removed)
    // - Metacrafting (removed)
    // - Recombinators (removed)
  }
  
  /**
   * Add a crafting method to the knowledge base
   */
  private addMethod(method: CraftingMethod) {
    this.methods.set(method.id, method);
  }
  
  /**
   * Initialize modifier pools for PoE 2
   */
  private initializeModifierPools() {
    // Example: Warmonger Bow modifier pool - PoE 2 Version
    this.addModifierPool('warmonger_bow', 85, {
      itemBase: 'Warmonger Bow',
      itemLevel: 85,
      prefixes: [
        {
          modifier: {
            id: 'increased_phys',
            text: '% Increased Physical Damage',
            type: 'prefix',
            tier: 1,
            requiredLevel: 83,
            tags: ['physical', 'damage'],
            weight: 1000,
            values: [{ min: 150, max: 179 }],
            group: 'LocalPhysicalDamagePercent'
          },
          weight: 1000,
          probability: 0.01,
          tags: ['physical', 'damage']
        },
        {
          modifier: {
            id: 'flat_phys',
            text: 'Adds # to # Physical Damage',
            type: 'prefix',
            tier: 1,
            requiredLevel: 83,
            tags: ['physical', 'damage'],
            weight: 1000,
            values: [{ min: 35, max: 45 }, { min: 65, max: 75 }],
            group: 'LocalPhysicalDamage'
          },
          weight: 1000,
          probability: 0.01,
          tags: ['physical', 'damage']
        },
        {
          modifier: {
            id: 'flat_lightning',
            text: 'Adds # to # Lightning Damage',
            type: 'prefix',
            tier: 1,
            requiredLevel: 82,
            tags: ['elemental', 'lightning', 'damage'],
            weight: 800,
            values: [{ min: 10, max: 30 }, { min: 100, max: 120 }],
            group: 'LocalLightningDamage'
          },
          weight: 800,
          probability: 0.008,
          tags: ['elemental', 'lightning', 'damage']
        },
        {
          modifier: {
            id: 'attack_skill_levels',
            text: '+# to Level of All Attack Skills',
            type: 'prefix',
            tier: 1,
            requiredLevel: 85,
            tags: ['gem', 'attack'],
            weight: 50,
            values: [{ min: 3, max: 5 }],
            group: 'AllAttackGemLevel'
          },
          weight: 50,
          probability: 0.0005,
          tags: ['gem', 'attack']
        }
      ],
      suffixes: [
        {
          modifier: {
            id: 'critical_chance',
            text: '+#% to Critical Hit Chance',
            type: 'suffix',
            tier: 1,
            requiredLevel: 84,
            tags: ['critical'],
            weight: 500,
            values: [{ min: 35, max: 38 }],
            group: 'CriticalStrikeChance'
          },
          weight: 500,
          probability: 0.005,
          tags: ['critical']
        },
        {
          modifier: {
            id: 'attack_speed',
            text: '#% Increased Attack Speed',
            type: 'suffix',
            tier: 1,
            requiredLevel: 83,
            tags: ['attack', 'speed'],
            weight: 1000,
            values: [{ min: 11, max: 13 }],
            group: 'AttackSpeed'
          },
          weight: 1000,
          probability: 0.01,
          tags: ['attack', 'speed']
        },
        {
          modifier: {
            id: 'onslaught_on_kill',
            text: '#% Chance to Gain Onslaught on Killing Hits',
            type: 'suffix',
            tier: 1,
            requiredLevel: 82,
            tags: ['speed', 'buff'],
            weight: 200,
            values: [{ min: 8, max: 12 }],
            group: 'OnslaughtOnKill'
          },
          weight: 200,
          probability: 0.002,
          tags: ['speed', 'buff']
        }
      ],
      totalPrefixWeight: 2850,
      totalSuffixWeight: 1700
    });
  }
  
  /**
   * Add a modifier pool for an item base
   */
  private addModifierPool(key: string, itemLevel: number, pool: ModifierPool) {
    this.modifierPools.set(`${key}_${itemLevel}`, pool);
  }
  
  /**
   * Get available crafting methods for PoE 2
   */
  getAvailableMethods(
    itemState: any,
    targetMods: string[]
  ): CraftingMethod[] {
    const available: CraftingMethod[] = [];
    
    for (const method of this.methods.values()) {
      if (this.meetsRequirements(itemState, method.requirements)) {
        available.push(method);
      }
    }
    
    return available.sort((a, b) => {
      const aRelevance = this.calculateRelevance(a, targetMods);
      const bRelevance = this.calculateRelevance(b, targetMods);
      return bRelevance - aRelevance;
    });
  }
  
  /**
   * Check if item meets method requirements
   */
  private meetsRequirements(
    itemState: any,
    requirements: CraftingRequirements
  ): boolean {
    if (requirements.itemRarity && itemState.rarity !== requirements.itemRarity) {
      return false;
    }
    
    if (requirements.itemLevel && itemState.itemLevel < requirements.itemLevel) {
      return false;
    }
    
    // In PoE 2, max 3 prefixes and 3 suffixes still applies
    if (requirements.openPrefixes && itemState.prefixes.length >= 3) {
      return false;
    }
    
    if (requirements.openSuffixes && itemState.suffixes.length >= 3) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate method relevance to target modifiers
   */
  private calculateRelevance(
    method: CraftingMethod,
    targetMods: string[]
  ): number {
    let relevance = 0;
    
    // Deterministic methods (Runes, Essences) are preferred in PoE 2
    if (method.type === 'rune' || method.type === 'essence') {
      relevance += 20;
    }
    
    // Greater/Perfect currency for high-tier mods
    if (method.id.includes('greater')) relevance += 10;
    if (method.id.includes('perfect')) relevance += 15;
    
    // Omen-enhanced methods for targeted crafting
    if (method.type === 'omen') relevance += 10;
    
    // Lower cost methods are slightly preferred
    if (method.cost.averageTotal) {
      relevance += Math.max(0, 10 - Math.log10(method.cost.averageTotal));
    }
    
    return relevance;
  }
  
  /**
   * Get modifier pool for an item
   */
  getModifierPool(
    itemBase: string,
    itemLevel: number
  ): ModifierPool | null {
    const baseKey = itemBase.toLowerCase().replace(/\s+/g, '_');
    let closestLevel = itemLevel;
    
    while (closestLevel > 0) {
      const pool = this.modifierPools.get(`${baseKey}_${closestLevel}`);
      if (pool) return pool;
      closestLevel--;
    }
    
    return null;
  }
  
  /**
   * Special PoE 2 crafting strategies
   */
  getPoE2CraftingStrategy(targetMods: string[]): string[] {
    const strategy = [];
    
    // 1. Start with white base (very valuable in PoE 2)
    strategy.push('Acquire white base item (rare and valuable in PoE 2)');
    
    // 2. Use Runes for deterministic weak mods
    strategy.push('Apply Runes with Soul Cores for guaranteed weak modifiers');
    
    // 3. Use Essences for guaranteed mods
    strategy.push('Use Normal Essence on white item for guaranteed magic with 1 mod');
    strategy.push('Use Greater Essence to upgrade to rare with guaranteed mod');
    
    // 4. Use tiered currency for high-tier mods
    strategy.push('Use Greater/Perfect Chaos Orbs to swap low-tier for high-tier mods');
    
    // 5. Use Omens for targeted crafting
    strategy.push('Use Omen of Prefixes/Suffixes with Chaos to target specific mod types');
    
    // 6. Finish with Exalted for final mods
    strategy.push('Use Greater/Perfect Exalted Orbs for high-tier final modifiers');
    
    return strategy;
  }
  
  /**
   * Export singleton instance
   */
  static instance = new PoE2CraftingKnowledgeBase();
}

export const poe2CraftingKnowledge = PoE2CraftingKnowledgeBase.instance;