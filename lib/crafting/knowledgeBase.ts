/**
 * Crafting Knowledge Base - All PoE 2 crafting methods and rules
 */

import { 
  CraftingMethod, 
  CraftingMethodType,
  CraftingCurrency,
  ItemModifier,
  ModifierPool,
  MetamodOption,
  BenchCraft,
  HarvestCraft,
  BeastCraft,
  CraftingRequirements,
  CraftingOutcome,
  CraftingCost
} from '@/types/crafting';

/**
 * Core crafting currencies and their effects
 */
export const CRAFTING_CURRENCIES: Record<string, CraftingCurrency> = {
  // Basic Currency
  TRANSMUTATION: {
    id: 'transmutation',
    name: 'Orb of Transmutation',
    type: 'basic_currency',
    effect: 'Upgrades a normal item to magic quality'
  },
  ALTERATION: {
    id: 'alteration',
    name: 'Orb of Alteration',
    type: 'basic_currency',
    effect: 'Reforges a magic item with new random modifiers'
  },
  AUGMENTATION: {
    id: 'augmentation',
    name: 'Orb of Augmentation',
    type: 'basic_currency',
    effect: 'Adds a new random modifier to a magic item'
  },
  REGAL: {
    id: 'regal',
    name: 'Regal Orb',
    type: 'basic_currency',
    effect: 'Upgrades a magic item to rare quality'
  },
  ALCHEMY: {
    id: 'alchemy',
    name: 'Orb of Alchemy',
    type: 'basic_currency',
    effect: 'Upgrades a normal item to rare quality'
  },
  CHAOS: {
    id: 'chaos',
    name: 'Chaos Orb',
    type: 'basic_currency',
    effect: 'Reforges a rare item with new random modifiers'
  },
  EXALTED: {
    id: 'exalted',
    name: 'Exalted Orb',
    type: 'basic_currency',
    effect: 'Adds a new random affix to a rare item'
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
  SCOURING: {
    id: 'scouring',
    name: 'Orb of Scouring',
    type: 'basic_currency',
    effect: 'Removes all modifiers from an item'
  },
  BLESSED: {
    id: 'blessed',
    name: 'Blessed Orb',
    type: 'basic_currency',
    effect: 'Rerolls the implicit modifier values'
  },
  
  // Advanced Currency
  ANCIENT: {
    id: 'ancient',
    name: 'Ancient Orb',
    type: 'basic_currency',
    effect: 'Reforges a unique item into another unique of the same class'
  },
  HARBINGER: {
    id: 'harbinger',
    name: "Harbinger's Orb",
    type: 'basic_currency',
    effect: 'Reforges a map item to a higher tier'
  },
  HORIZON: {
    id: 'horizon',
    name: 'Orb of Horizons',
    type: 'basic_currency',
    effect: 'Reforges a map to another of the same tier'
  },
  BINDING: {
    id: 'binding',
    name: 'Orb of Binding',
    type: 'basic_currency',
    effect: 'Upgrades a normal item to rare with up to 4 linked sockets'
  }
};

/**
 * Crafting methods database
 */
export class CraftingKnowledgeBase {
  private methods: Map<string, CraftingMethod> = new Map();
  private modifierPools: Map<string, ModifierPool> = new Map();
  
  constructor() {
    this.initializeMethods();
    this.initializeModifierPools();
  }
  
  /**
   * Initialize all crafting methods
   */
  private initializeMethods() {
    // Basic Currency Methods
    this.addMethod({
      id: 'alteration_spam',
      name: 'Alteration Spam',
      type: 'basic_currency',
      description: 'Repeatedly use Alterations until desired modifiers',
      requirements: {
        itemRarity: 'magic'
      },
      outcomes: [{
        probability: 1,
        effect: 'Reroll magic modifiers',
        removes: ['prefixes', 'suffixes'],
        adds: ['prefixes', 'suffixes']
      }],
      cost: {
        currency: { alteration: 1 },
        averageTotal: 1
      }
    });
    
    this.addMethod({
      id: 'chaos_spam',
      name: 'Chaos Spam',
      type: 'basic_currency',
      description: 'Repeatedly use Chaos Orbs until desired modifiers',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Reroll all modifiers',
        removes: ['prefixes', 'suffixes'],
        adds: ['prefixes', 'suffixes']
      }],
      cost: {
        currency: { chaos: 1 },
        averageTotal: 1
      }
    });
    
    this.addMethod({
      id: 'exalt_slam',
      name: 'Exalt Slam',
      type: 'basic_currency',
      description: 'Add a new modifier with Exalted Orb',
      requirements: {
        itemRarity: 'rare',
        openPrefixes: 1 // Or open suffixes
      },
      outcomes: [{
        probability: 1,
        effect: 'Add one random modifier',
        adds: ['prefixes'] // or suffixes
      }],
      cost: {
        currency: { exalted: 1 },
        averageTotal: 200 // Approximate chaos value
      }
    });
    
    // Essence Crafting
    this.addMethod({
      id: 'essence_spam',
      name: 'Essence Spam',
      type: 'essence',
      description: 'Use essences to guarantee specific modifier',
      requirements: {
        itemRarity: 'normal'
      },
      outcomes: [{
        probability: 1,
        effect: 'Upgrade to rare with guaranteed modifier',
        adds: ['prefixes', 'suffixes']
      }],
      cost: {
        currency: {}, // Varies by essence
        averageTotal: 5 // Varies
      }
    });
    
    // Fossil Crafting
    this.addMethod({
      id: 'fossil_craft',
      name: 'Fossil Crafting',
      type: 'fossil',
      description: 'Use fossils to target specific modifier groups',
      requirements: {
        itemRarity: 'normal'
      },
      outcomes: [{
        probability: 1,
        effect: 'Reforge with weighted modifiers',
        adds: ['prefixes', 'suffixes']
      }],
      cost: {
        currency: {}, // Varies by fossil combination
        averageTotal: 10
      }
    });
    
    // Metacrafting
    this.addMethod({
      id: 'multimod',
      name: 'Can have multiple crafted modifiers',
      type: 'metacraft',
      description: 'Allows multiple bench crafts',
      requirements: {
        itemRarity: 'rare',
        openSuffixes: 1
      },
      outcomes: [{
        probability: 1,
        effect: 'Enable multiple crafted mods',
        adds: ['suffixes']
      }],
      cost: {
        currency: { divine: 2 },
        averageTotal: 400
      },
      successRate: 1
    });
    
    this.addMethod({
      id: 'prefixes_cannot_change',
      name: 'Prefixes Cannot Be Changed',
      type: 'metacraft',
      description: 'Protect prefixes during crafting',
      requirements: {
        itemRarity: 'rare',
        openSuffixes: 1
      },
      outcomes: [{
        probability: 1,
        effect: 'Prefixes are protected from changes',
        adds: ['suffixes']
      }],
      cost: {
        currency: { divine: 2 },
        averageTotal: 400
      },
      successRate: 1
    });
    
    this.addMethod({
      id: 'suffixes_cannot_change',
      name: 'Suffixes Cannot Be Changed',
      type: 'metacraft',
      description: 'Protect suffixes during crafting',
      requirements: {
        itemRarity: 'rare',
        openPrefixes: 1
      },
      outcomes: [{
        probability: 1,
        effect: 'Suffixes are protected from changes',
        adds: ['prefixes']
      }],
      cost: {
        currency: { divine: 2 },
        averageTotal: 400
      },
      successRate: 1
    });
    
    // Harvest Crafting
    this.addMethod({
      id: 'harvest_augment',
      name: 'Harvest Augment',
      type: 'harvest',
      description: 'Add modifier with specific tag',
      requirements: {
        itemRarity: 'rare',
        openPrefixes: 1 // or suffixes
      },
      outcomes: [{
        probability: 1,
        effect: 'Add modifier with specific tag',
        adds: ['prefixes'] // or suffixes based on what's available
      }],
      cost: {
        currency: {},
        averageTotal: 50 // Varies by type
      },
      tags: ['physical', 'fire', 'cold', 'lightning', 'chaos', 'life', 'defence']
    });
    
    this.addMethod({
      id: 'harvest_remove',
      name: 'Harvest Remove',
      type: 'harvest',
      description: 'Remove modifier with specific tag',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Remove modifier with specific tag'
      }],
      cost: {
        currency: {},
        averageTotal: 30
      },
      tags: ['physical', 'fire', 'cold', 'lightning', 'chaos', 'life', 'defence']
    });
    
    this.addMethod({
      id: 'harvest_remove_add',
      name: 'Harvest Remove/Add',
      type: 'harvest',
      description: 'Remove and add modifier with same tag',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Remove one modifier and add another with same tag'
      }],
      cost: {
        currency: {},
        averageTotal: 100
      },
      tags: ['physical', 'fire', 'cold', 'lightning', 'chaos', 'life', 'defence']
    });
    
    this.addMethod({
      id: 'harvest_reforge',
      name: 'Harvest Reforge',
      type: 'harvest',
      description: 'Reforge with more likely modifiers of tag',
      requirements: {},
      outcomes: [{
        probability: 1,
        effect: 'Reforge with weighted modifiers'
      }],
      cost: {
        currency: {},
        averageTotal: 10
      },
      tags: ['physical', 'fire', 'cold', 'lightning', 'chaos', 'life', 'defence', 'critical']
    });
    
    // Beast Crafting
    this.addMethod({
      id: 'beast_imprint',
      name: 'Beast Imprint',
      type: 'beast',
      description: 'Create imprint of magic item',
      requirements: {
        itemRarity: 'magic'
      },
      outcomes: [{
        probability: 1,
        effect: 'Create restorable imprint'
      }],
      cost: {
        currency: {},
        averageTotal: 50
      },
      successRate: 1
    });
    
    this.addMethod({
      id: 'beast_split',
      name: 'Beast Split',
      type: 'beast',
      description: 'Split item into two copies',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Create two items with divided modifiers'
      }],
      cost: {
        currency: {},
        averageTotal: 100
      }
    });
    
    // Bench Crafting
    this.addMethod({
      id: 'bench_craft',
      name: 'Bench Craft',
      type: 'bench',
      description: 'Add specific modifier from bench',
      requirements: {
        openPrefixes: 1 // or suffixes depending on craft
      },
      outcomes: [{
        probability: 1,
        effect: 'Add chosen modifier',
        adds: ['prefixes'] // or suffixes
      }],
      cost: {
        currency: {}, // Varies by craft
        averageTotal: 5
      },
      successRate: 1
    });
    
    // Corruption
    this.addMethod({
      id: 'vaal_orb',
      name: 'Vaal Orb',
      type: 'corrupt',
      description: 'Corrupt item with unpredictable results',
      requirements: {},
      outcomes: [
        {
          probability: 0.25,
          effect: 'No change, item becomes corrupted'
        },
        {
          probability: 0.25,
          effect: 'Add implicit modifier'
        },
        {
          probability: 0.25,
          effect: 'Reroll item to rare with random mods'
        },
        {
          probability: 0.25,
          effect: 'Transform into random unique or destroy'
        }
      ],
      cost: {
        currency: { vaal: 1 },
        averageTotal: 2
      }
    });
    
    // Advanced Methods
    this.addMethod({
      id: 'awakener_orb',
      name: "Awakener's Orb",
      type: 'influence',
      description: 'Combine influenced modifiers',
      requirements: {
        itemRarity: 'rare',
        influences: [] // Must have influence
      },
      outcomes: [{
        probability: 1,
        effect: 'Transfer influence modifier and reforge'
      }],
      cost: {
        currency: {},
        averageTotal: 300
      }
    });
    
    this.addMethod({
      id: 'fracture_fossil',
      name: 'Fracture Fossil',
      type: 'fracture',
      description: 'Lock random modifier permanently',
      requirements: {
        itemRarity: 'rare'
      },
      outcomes: [{
        probability: 1,
        effect: 'Fracture one random modifier'
      }],
      cost: {
        currency: {},
        averageTotal: 150
      }
    });
  }
  
  /**
   * Add a crafting method to the knowledge base
   */
  private addMethod(method: CraftingMethod) {
    this.methods.set(method.id, method);
  }
  
  /**
   * Initialize modifier pools for different item bases
   */
  private initializeModifierPools() {
    // Example: Warmonger Bow modifier pool
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
          tags: ['physical', 'damage'],
          fossils: {
            increased: ['jagged'], // Jagged fossil increases physical mods
            blocked: ['pristine'] // Pristine blocks damage mods
          }
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
          tags: ['elemental', 'lightning', 'damage'],
          fossils: {
            increased: ['metallic'], // Metallic increases lightning
            blocked: ['pristine']
          }
        },
        {
          modifier: {
            id: 'attack_skill_levels',
            text: '+# to Level of All Attack Skills',
            type: 'prefix',
            tier: 1,
            requiredLevel: 85,
            tags: ['gem', 'attack'],
            weight: 50, // Very rare
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
          tags: ['critical'],
          fossils: {
            increased: ['serrated'], // Serrated increases crit
            blocked: ['dense']
          }
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
   * Get available crafting methods for an item state
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
    
    // Sort by relevance to target mods
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
    
    if (requirements.openPrefixes && itemState.prefixes.length >= 3) {
      return false;
    }
    
    if (requirements.openSuffixes && itemState.suffixes.length >= 3) {
      return false;
    }
    
    // Check for required modifiers
    if (requirements.hasModifier) {
      const allMods = [...itemState.prefixes, ...itemState.suffixes];
      for (const required of requirements.hasModifier) {
        if (!allMods.some(mod => mod.id === required)) {
          return false;
        }
      }
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
    
    // Check if method tags match target mod tags
    if (method.tags) {
      for (const tag of method.tags) {
        if (targetMods.some(mod => mod.toLowerCase().includes(tag))) {
          relevance += 10;
        }
      }
    }
    
    // Deterministic methods are more relevant
    if (method.successRate === 1) {
      relevance += 5;
    }
    
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
    // Find closest item level match
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
   * Calculate probability of hitting specific modifiers
   */
  calculateModifierProbability(
    pool: ModifierPool,
    targetMods: string[],
    method: CraftingMethod
  ): number {
    let probability = 1;
    
    for (const targetMod of targetMods) {
      // Find modifier in pool
      const prefixMatch = pool.prefixes.find(
        m => m.modifier.text.toLowerCase().includes(targetMod.toLowerCase())
      );
      const suffixMatch = pool.suffixes.find(
        m => m.modifier.text.toLowerCase().includes(targetMod.toLowerCase())
      );
      
      const modProb = prefixMatch?.probability || suffixMatch?.probability || 0;
      
      // Adjust for method type
      if (method.type === 'fossil' && (prefixMatch?.fossils || suffixMatch?.fossils)) {
        // Fossil crafting can significantly increase chances
        probability *= modProb * 3; // Simplified - would need actual fossil weights
      } else if (method.type === 'essence' && method.tags?.includes(targetMod)) {
        // Essence guarantees one mod
        probability *= 1;
      } else {
        probability *= modProb;
      }
    }
    
    return Math.min(1, probability);
  }
  
  /**
   * Get all metamod options
   */
  getMetamods(): MetamodOption[] {
    return [
      {
        id: 'multimod',
        text: 'Can have up to 3 Crafted Modifiers',
        cost: { currency: { divine: 2 }, averageTotal: 400 },
        effect: 'Allows multiple crafted modifiers',
        slot: 'suffix'
      },
      {
        id: 'prefixes_cannot_change',
        text: 'Prefixes Cannot Be Changed',
        cost: { currency: { divine: 2 }, averageTotal: 400 },
        effect: 'Protects prefixes during crafting',
        slot: 'suffix'
      },
      {
        id: 'suffixes_cannot_change',
        text: 'Suffixes Cannot Be Changed',
        cost: { currency: { divine: 2 }, averageTotal: 400 },
        effect: 'Protects suffixes during crafting',
        slot: 'prefix'
      },
      {
        id: 'cannot_roll_attack',
        text: 'Cannot Roll Attack Modifiers',
        cost: { currency: { exalted: 1 }, averageTotal: 200 },
        effect: 'Blocks attack modifiers',
        slot: 'suffix'
      },
      {
        id: 'cannot_roll_caster',
        text: 'Cannot Roll Caster Modifiers',
        cost: { currency: { exalted: 1 }, averageTotal: 200 },
        effect: 'Blocks caster modifiers',
        slot: 'suffix'
      }
    ];
  }
  
  /**
   * Get bench crafts for an item type
   */
  getBenchCrafts(itemClass: string): BenchCraft[] {
    // Simplified - would have full database
    const benchCrafts: BenchCraft[] = [
      {
        id: 'flat_phys_bench',
        modText: 'Adds 5-10 Physical Damage',
        cost: { currency: { transmutation: 4 }, averageTotal: 1 },
        slot: 'prefix',
        tags: ['physical', 'damage']
      },
      {
        id: 'attack_speed_bench',
        modText: '6-8% Increased Attack Speed',
        cost: { currency: { alteration: 3 }, averageTotal: 1 },
        slot: 'suffix',
        tags: ['attack', 'speed']
      },
      {
        id: 'crit_chance_bench',
        modText: '15-18% Increased Critical Strike Chance',
        cost: { currency: { augmentation: 4 }, averageTotal: 1 },
        slot: 'suffix',
        tags: ['critical']
      },
      {
        id: 'quality_bench',
        modText: '18-20% Quality',
        cost: { currency: { chaos: 4 }, averageTotal: 4 },
        slot: 'suffix',
        tags: ['quality']
      }
    ];
    
    return benchCrafts;
  }
  
  /**
   * Export singleton instance
   */
  static instance = new CraftingKnowledgeBase();
}

export const craftingKnowledge = CraftingKnowledgeBase.instance;