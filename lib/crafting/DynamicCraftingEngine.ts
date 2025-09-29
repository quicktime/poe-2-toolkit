/**
 * Dynamic Crafting Engine for Path of Exile 2
 * Generates optimal crafting routes based on selected mods
 */

import { 
  ModifierDefinition, 
  getModPoolForItem,
  getModsByNames,
  isModSetCraftable 
} from './poe2-mod-database';
import { POE2_CURRENCY_RATES } from './UnifiedCraftingSystem';

export interface CraftingMethod {
  name: string;
  description: string;
  currency: string[];
  targetTags?: string[];
  guaranteedMod?: boolean;
  costMultiplier: number;
  successRate: number;
  applicability: (mod: ModifierDefinition) => boolean;
}

/**
 * Available crafting methods in PoE2
 */
export const CRAFTING_METHODS: CraftingMethod[] = [
  {
    name: 'Alteration Spam',
    description: 'Reroll magic item for 1-2 desired mods',
    currency: ['alteration', 'augmentation'],
    costMultiplier: 1,
    successRate: 0.05, // 5% per attempt
    applicability: (mod) => mod.weight > 50
  },
  {
    name: 'Perfect Alteration',
    description: 'Alteration with guaranteed T1-T2 mods',
    currency: ['alteration_perfect'],
    costMultiplier: 20,
    successRate: 0.25,
    applicability: (mod) => mod.tier <= 2
  },
  {
    name: 'Essence Crafting',
    description: 'Guaranteed mod of specific type',
    currency: ['essence_*'],
    guaranteedMod: true,
    costMultiplier: 5,
    successRate: 1.0,
    applicability: (mod) => mod.tags.some(tag => 
      ['physical', 'fire', 'cold', 'lightning', 'chaos', 'life', 'defense'].includes(tag)
    )
  },
  {
    name: 'Greater Essence',
    description: 'Guaranteed high-tier mod',
    currency: ['essence_greater'],
    guaranteedMod: true,
    costMultiplier: 15,
    successRate: 1.0,
    applicability: (mod) => mod.tier === 1
  },
  {
    name: 'Homogenous Omen + Greater Exalt',
    description: 'Target specific mod with matching tags',
    currency: ['homogenous_omen', 'exalted_greater'],
    targetTags: ['matched'],
    costMultiplier: 200,
    successRate: 0.33, // 1 in 3 chance for specific mod
    applicability: (mod) => mod.weight < 150 && mod.tier === 1
  },
  {
    name: 'Chaos Reroll',
    description: 'Reroll all mods on rare item',
    currency: ['chaos'],
    costMultiplier: 12, // 1 chaos = 12 ex in PoE2
    successRate: 0.01, // Very low for specific mods
    applicability: (mod) => mod.weight > 100
  },
  {
    name: 'Perfect Chaos',
    description: 'Chaos with better tier weighting',
    currency: ['chaos_perfect'],
    costMultiplier: 20,
    successRate: 0.05,
    applicability: (mod) => mod.tier <= 2
  },
  {
    name: 'Exalted Orb',
    description: 'Add a random mod',
    currency: ['exalted'],
    costMultiplier: 1,
    successRate: 0.1, // 10% for desired mod
    applicability: (mod) => true
  },
  {
    name: 'Greater Exalted',
    description: 'Add mod with better tier weighting',
    currency: ['exalted_greater'],
    costMultiplier: 12,
    successRate: 0.2,
    applicability: (mod) => mod.tier <= 2
  },
  {
    name: 'Divine Orb',
    description: 'Reroll numeric values within tier',
    currency: ['divine'],
    costMultiplier: 380,
    successRate: 1.0,
    applicability: (mod) => true // Used for perfecting rolls
  },
  {
    name: 'Vaal Orb Corruption',
    description: 'Corrupt item for implicit or reroll',
    currency: ['vaal'],
    costMultiplier: 4,
    successRate: 0.25,
    applicability: (mod) => mod.type === 'corrupted'
  },
  {
    name: 'Omen of Corruption + Vaal',
    description: 'Safer corruption (no brick)',
    currency: ['omen_of_corruption', 'vaal'],
    costMultiplier: 384,
    successRate: 0.33,
    applicability: (mod) => mod.type === 'corrupted'
  },
  {
    name: 'Recombinator',
    description: 'Combine mods from two items',
    currency: ['recombinator'],
    costMultiplier: 50,
    successRate: 0.5,
    applicability: (mod) => mod.weight < 100
  },
  {
    name: 'Rune of Ascension',
    description: 'Convert to unique (special cases)',
    currency: ['rune_of_ascension'],
    costMultiplier: 5,
    successRate: 0.0, // Not for normal crafting
    applicability: (mod) => false
  }
];

export class DynamicCraftingEngine {
  /**
   * Generate optimal crafting route for selected mods
   */
  generateCraftingRoute(
    itemType: string,
    selectedMods: string[], // Mod names or IDs
    budget: number, // in exalted
    options: {
      allowCorruption?: boolean;
      preferDeterministic?: boolean;
      maxSteps?: number;
    } = {}
  ): {
    route: any;
    totalCost: number;
    successRate: number;
    warnings: string[];
  } {
    // Get mod pool for item
    const modPool = getModPoolForItem(itemType);
    if (!modPool) {
      return {
        route: null,
        totalCost: 0,
        successRate: 0,
        warnings: [`Unknown item type: ${itemType}`]
      };
    }

    // Get actual mod definitions
    const targetMods = getModsByNames(itemType, selectedMods);
    if (targetMods.length === 0) {
      return {
        route: null,
        totalCost: 0,
        successRate: 0,
        warnings: ['No valid mods found for this item type']
      };
    }

    // Check if mod combination is valid
    const validation = isModSetCraftable(targetMods);
    if (!validation.valid) {
      return {
        route: null,
        totalCost: 0,
        successRate: 0,
        warnings: validation.errors
      };
    }

    // Analyze mods
    const analysis = this.analyzeMods(targetMods);
    
    // Determine crafting strategy
    const strategy = this.determineStrategy(analysis, budget, options);
    
    // Generate steps
    const steps = this.generateSteps(targetMods, strategy, modPool);
    
    // Calculate costs
    const { totalCost, successRate } = this.calculateCosts(steps);
    
    // Check if within budget
    const warnings: string[] = [];
    if (totalCost > budget) {
      warnings.push(`Route cost (${totalCost.toFixed(0)} ex) exceeds budget (${budget} ex)`);
    }
    
    if (targetMods.length > 6 && !options.allowCorruption) {
      warnings.push('More than 6 mods requires corruption. Enable allowCorruption option.');
    }

    return {
      route: {
        name: this.generateRouteName(targetMods, strategy),
        description: this.generateRouteDescription(targetMods, strategy),
        itemType,
        targetMods: targetMods.map(m => ({
          id: m.id,
          name: m.name,
          type: m.type,
          tier: m.tier
        })),
        steps,
        strategy
      },
      totalCost,
      successRate,
      warnings
    };
  }

  /**
   * Analyze target mods to determine crafting approach
   */
  private analyzeMods(mods: ModifierDefinition[]): {
    prefixCount: number;
    suffixCount: number;
    hasRareMods: boolean;
    hasGainAsExtra: boolean;
    hasCritMods: boolean;
    hasGemLevels: boolean;
    avgWeight: number;
    needsCorruption: boolean;
  } {
    const prefixes = mods.filter(m => m.type === 'prefix');
    const suffixes = mods.filter(m => m.type === 'suffix');
    const corrupted = mods.filter(m => m.type === 'corrupted');
    
    const avgWeight = mods.reduce((sum, m) => sum + m.weight, 0) / mods.length;
    
    return {
      prefixCount: prefixes.length,
      suffixCount: suffixes.length,
      hasRareMods: mods.some(m => m.weight < 50),
      hasGainAsExtra: mods.some(m => m.name.includes('Gain') && m.name.includes('as Extra')),
      hasCritMods: mods.some(m => m.tags.includes('critical')),
      hasGemLevels: mods.some(m => m.name.includes('Level of')),
      avgWeight,
      needsCorruption: mods.length > 6 || corrupted.length > 0
    };
  }

  /**
   * Determine optimal crafting strategy
   */
  private determineStrategy(
    analysis: ReturnType<typeof this.analyzeMods>,
    budget: number,
    options: any
  ): 'altRegal' | 'essence' | 'homogenous' | 'chaos' | 'recombinator' | 'hybrid' {
    // Mirror-tier items with Gain as Extra mods
    if (analysis.hasGainAsExtra && budget > 2000) {
      return 'homogenous';
    }
    
    // Items with very rare mods
    if (analysis.hasRareMods && analysis.avgWeight < 75) {
      if (budget > 1000) {
        return 'homogenous';
      }
      return 'recombinator';
    }
    
    // Deterministic preference with essences
    if (options.preferDeterministic) {
      return 'essence';
    }
    
    // Budget crafting
    if (budget < 50) {
      return 'altRegal';
    }
    
    // Mid-tier crafting
    if (budget < 500) {
      return 'essence';
    }
    
    // High-end crafting
    if (budget < 2000) {
      return 'hybrid';
    }
    
    return 'homogenous';
  }

  /**
   * Generate crafting steps based on strategy
   */
  private generateSteps(
    mods: ModifierDefinition[],
    strategy: string,
    modPool: any
  ): any[] {
    const steps: any[] = [];
    
    switch (strategy) {
      case 'altRegal':
        steps.push(...this.generateAltRegalSteps(mods));
        break;
      
      case 'essence':
        steps.push(...this.generateEssenceSteps(mods));
        break;
      
      case 'homogenous':
        steps.push(...this.generateHomogenousSteps(mods));
        break;
      
      case 'chaos':
        steps.push(...this.generateChaosSteps(mods));
        break;
      
      case 'recombinator':
        steps.push(...this.generateRecombinatorSteps(mods));
        break;
      
      case 'hybrid':
        steps.push(...this.generateHybridSteps(mods));
        break;
    }
    
    // Add corruption if needed
    const needsCorruption = mods.some(m => m.type === 'corrupted') || mods.length > 6;
    if (needsCorruption) {
      steps.push({
        action: 'omen_of_corruption',
        description: 'Corrupt for implicit or 7th mod',
        currency: ['omen_of_corruption', 'vaal'],
        targetMod: mods.find(m => m.type === 'corrupted')?.name || 'Additional mod',
        cost: 384,
        successRate: 0.33
      });
    }
    
    // Add divining for perfect rolls
    steps.push({
      action: 'divine',
      description: 'Perfect all mod values',
      currency: ['divine'],
      iterations: 2,
      cost: 760,
      successRate: 1.0
    });
    
    return steps;
  }

  /**
   * Generate Alt-Regal crafting steps
   */
  private generateAltRegalSteps(mods: ModifierDefinition[]): any[] {
    const steps: any[] = [];
    const prefixes = mods.filter(m => m.type === 'prefix');
    const suffixes = mods.filter(m => m.type === 'suffix');
    
    // Start with most important mod
    const importantMod = mods.sort((a, b) => a.weight - b.weight)[0];
    
    steps.push({
      action: 'alteration',
      description: `Alt spam for ${importantMod.name}`,
      currency: ['alteration'],
      targetMod: importantMod.name,
      iterations: Math.ceil(100 / (importantMod.weight / 1000)),
      cost: 0.15 * Math.ceil(100 / (importantMod.weight / 1000)),
      successRate: 0.9
    });
    
    steps.push({
      action: 'augmentation',
      description: 'Add second mod',
      currency: ['augmentation'],
      cost: 0.08,
      successRate: 0.5
    });
    
    steps.push({
      action: 'regal',
      description: 'Make rare',
      currency: ['regal'],
      cost: 0.8,
      successRate: 1.0
    });
    
    // Fill remaining mods
    const remaining = mods.length - 3;
    for (let i = 0; i < remaining; i++) {
      steps.push({
        action: 'exalted',
        description: `Add mod ${4 + i}`,
        currency: ['exalted'],
        cost: 1,
        successRate: 0.2
      });
    }
    
    return steps;
  }

  /**
   * Generate Essence crafting steps
   */
  private generateEssenceSteps(mods: ModifierDefinition[]): any[] {
    const steps: any[] = [];
    
    // Find mod that can be guaranteed with essence
    const essenceMod = mods.find(m => 
      m.tags.some(tag => ['physical', 'fire', 'cold', 'lightning', 'life'].includes(tag))
    );
    
    if (essenceMod) {
      steps.push({
        action: 'essence',
        description: `Essence for guaranteed ${essenceMod.name}`,
        currency: ['essence'],
        targetMod: essenceMod.name,
        iterations: 10,
        cost: 25,
        successRate: 0.5
      });
    }
    
    // Fill remaining
    steps.push({
      action: 'exalted',
      description: 'Fill remaining mods',
      currency: ['exalted'],
      iterations: mods.length - 1,
      cost: mods.length - 1,
      successRate: 0.3
    });
    
    return steps;
  }

  /**
   * Generate Homogenous Omen steps
   */
  private generateHomogenousSteps(mods: ModifierDefinition[]): any[] {
    const steps: any[] = [];
    const prefixes = mods.filter(m => m.type === 'prefix');
    const suffixes = mods.filter(m => m.type === 'suffix');
    
    // Start with alt for base
    const baseMod = mods.find(m => m.name.includes('Level of')) || mods[0];
    steps.push({
      action: 'alteration_perfect',
      description: `Alt for ${baseMod.name}`,
      currency: ['alteration_perfect'],
      targetMod: baseMod.name,
      iterations: 100,
      cost: 300,
      successRate: 0.5
    });
    
    steps.push({
      action: 'regal',
      description: 'Make rare',
      currency: ['regal'],
      cost: 0.8,
      successRate: 1.0
    });
    
    // Use Homogenous Omens for each remaining mod
    const remaining = mods.filter(m => m !== baseMod);
    for (const mod of remaining) {
      if (mod.type === 'prefix') {
        steps.push({
          action: 'homogenous_omen',
          description: `Homogenous + Greater Exalt for ${mod.name}`,
          currency: ['homogenous_omen', 'exalted_greater'],
          targetMod: mod.name,
          cost: 202, // 190 + 12
          successRate: 0.33
        });
      } else if (mod.type === 'suffix') {
        steps.push({
          action: 'homogenous_omen',
          description: `Homogenous + Greater Dextral Exalt for ${mod.name}`,
          currency: ['homogenous_omen', 'exalted_greater'],
          targetMod: mod.name,
          cost: 202,
          successRate: 0.33
        });
      }
    }
    
    return steps;
  }

  /**
   * Generate Chaos spam steps
   */
  private generateChaosSteps(mods: ModifierDefinition[]): any[] {
    return [{
      action: 'chaos',
      description: 'Chaos spam until all mods',
      currency: ['chaos'],
      iterations: 500, // Average for specific mod combo
      cost: 6000, // 500 * 12 ex per chaos
      successRate: 0.1
    }];
  }

  /**
   * Generate Recombinator steps
   */
  private generateRecombinatorSteps(mods: ModifierDefinition[]): any[] {
    const steps: any[] = [];
    
    // Split mods between two items
    const half = Math.ceil(mods.length / 2);
    const item1Mods = mods.slice(0, half);
    const item2Mods = mods.slice(half);
    
    steps.push({
      action: 'craft_base_1',
      description: `Craft first item with ${item1Mods.map(m => m.name).join(', ')}`,
      currency: ['various'],
      cost: 500,
      successRate: 0.5
    });
    
    steps.push({
      action: 'craft_base_2',
      description: `Craft second item with ${item2Mods.map(m => m.name).join(', ')}`,
      currency: ['various'],
      cost: 500,
      successRate: 0.5
    });
    
    steps.push({
      action: 'recombinator',
      description: 'Recombine both items',
      currency: ['recombinator'],
      cost: 50,
      successRate: 0.5
    });
    
    return steps;
  }

  /**
   * Generate Hybrid steps (combination of methods)
   */
  private generateHybridSteps(mods: ModifierDefinition[]): any[] {
    const steps: any[] = [];
    
    // Essence start for guaranteed mod
    const essenceMod = mods.find(m => m.tags.includes('damage')) || mods[0];
    steps.push({
      action: 'essence_greater',
      description: `Greater Essence for ${essenceMod.name}`,
      currency: ['essence_greater'],
      targetMod: essenceMod.name,
      cost: 6,
      successRate: 0.7
    });
    
    // Homogenous for rare mods
    const rareMods = mods.filter(m => m.weight < 100 && m !== essenceMod);
    for (const mod of rareMods) {
      steps.push({
        action: 'homogenous_omen',
        description: `Target ${mod.name}`,
        currency: ['homogenous_omen', 'exalted_greater'],
        targetMod: mod.name,
        cost: 202,
        successRate: 0.33
      });
    }
    
    // Regular exalts for common mods
    const commonMods = mods.filter(m => m.weight >= 100 && m !== essenceMod);
    for (const mod of commonMods) {
      steps.push({
        action: 'exalted',
        description: `Add ${mod.name}`,
        currency: ['exalted'],
        targetMod: mod.name,
        cost: 1,
        successRate: 0.3
      });
    }
    
    return steps;
  }

  /**
   * Calculate total costs and success rate
   */
  private calculateCosts(steps: any[]): {
    totalCost: number;
    successRate: number;
  } {
    let totalCost = 0;
    let successRate = 1.0;
    
    for (const step of steps) {
      const iterations = step.iterations || 1;
      const stepCost = step.cost || 0;
      totalCost += stepCost * iterations;
      
      if (step.successRate) {
        successRate *= step.successRate;
      }
    }
    
    return { totalCost, successRate };
  }

  /**
   * Generate descriptive route name
   */
  private generateRouteName(mods: ModifierDefinition[], strategy: string): string {
    const analysis = this.analyzeMods(mods);
    
    if (analysis.hasGainAsExtra) {
      return 'Mirror-Tier Gain Damage Craft';
    }
    
    if (analysis.hasGemLevels) {
      return 'High-End +Gem Level Craft';
    }
    
    if (analysis.hasCritMods) {
      return 'Critical Strike Focused Craft';
    }
    
    switch (strategy) {
      case 'homogenous':
        return 'Homogenous Omen Deterministic Craft';
      case 'essence':
        return 'Essence-Based Guaranteed Craft';
      case 'altRegal':
        return 'Budget Alt-Regal Craft';
      case 'recombinator':
        return 'Recombinator Split Craft';
      case 'chaos':
        return 'Chaos Spam RNG Craft';
      case 'hybrid':
        return 'Hybrid Multi-Method Craft';
      default:
        return 'Custom Crafting Route';
    }
  }

  /**
   * Generate descriptive route description
   */
  private generateRouteDescription(mods: ModifierDefinition[], strategy: string): string {
    const prefixes = mods.filter(m => m.type === 'prefix').length;
    const suffixes = mods.filter(m => m.type === 'suffix').length;
    
    return `Craft ${prefixes} prefixes and ${suffixes} suffixes using ${strategy} strategy`;
  }
}

// Export singleton instance
export const dynamicCraftingEngine = new DynamicCraftingEngine();

export default DynamicCraftingEngine;