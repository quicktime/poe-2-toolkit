/**
 * Advanced Path of Exile 2 Crafting Simulator
 * Simulates crafting outcomes based on actual PoE2 mechanics
 */

import { 
  POE2_COMPREHENSIVE_CRAFTING,
  ITEM_BASES,
  CRAFTING_ROUTES,
  MODIFIER_POOLS
} from './poe2-comprehensive-crafting-system';
import { POE2_CRAFTING_KNOWLEDGE } from './poe2-crafting-knowledge';

export interface ItemState {
  base: string;
  itemLevel: number;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  prefixes: ModifierInstance[];
  suffixes: ModifierInstance[];
  implicits: ModifierInstance[];
  corrupted: boolean;
  influenced?: string[];
  quality: number;
  sockets?: { number: number; links: number };
  craftingHistory: CraftingStep[];
}

export interface ModifierInstance {
  id: string;
  name: string;
  tier: number;
  values: number[];
  type: 'prefix' | 'suffix' | 'implicit';
  tags: string[];
}

export interface CraftingStep {
  currency: string;
  result: 'success' | 'failure' | 'partial';
  modsAdded?: ModifierInstance[];
  modsRemoved?: ModifierInstance[];
  timestamp: number;
  cost: number;
}

export interface SimulationResult {
  finalItem: ItemState;
  totalCost: number;
  stepsUsed: number;
  successRate: number;
  averageModTier: number;
  recommendations: string[];
}

export class AdvancedCraftingSimulator {
  private marketPrices: Map<string, number>;
  private modifierWeights: Map<string, number>;
  private random: () => number;

  constructor(marketPrices?: { [key: string]: number }) {
    this.marketPrices = new Map(Object.entries(marketPrices || this.getDefaultPrices()));
    this.modifierWeights = new Map();
    this.random = Math.random;
    this.initializeModifierWeights();
  }

  /**
   * Default currency prices in chaos orb equivalent
   */
  private getDefaultPrices(): { [key: string]: number } {
    return {
      // Basic currencies
      'transmutation': 0.1,
      'augmentation': 0.2,
      'alteration': 0.3,
      'regal': 1,
      'alchemy': 1,
      'chaos': 15, // Chaos is valuable in PoE2!
      'exalted': 2, // Less valuable than chaos in PoE2
      'divine': 100,
      'annulment': 10,
      'vaal': 5,
      
      // Perfect currencies (cheaper but guarantee T1-T2)
      'transmutation_perfect': 3,
      'augmentation_perfect': 3,
      'alteration_perfect': 5,
      'regal_perfect': 8,
      'alchemy_perfect': 20,
      'chaos_perfect': 25,
      'exalted_perfect': 10,
      
      // Greater currencies (more expensive, better mods)
      'transmutation_greater': 5,
      'augmentation_greater': 5,
      'alteration_greater': 8,
      'regal_greater': 12,
      'alchemy_greater': 30,
      'chaos_greater': 35,
      'exalted_greater': 15,
      
      // Essences
      'essence_normal': 3,
      'essence_greater': 8,
      
      // Omens
      'omen_basic': 10,
      'omen_targeted': 25,
      
      // Distilled Emotions
      'distilled_emotion': 15,
      
      // Runes (with soul core costs)
      'soul_core_minor': 5,
      'soul_core_major': 20,
      'soul_core_prime': 50
    };
  }

  /**
   * Initialize modifier weights from pools
   */
  private initializeModifierWeights(): void {
    for (const [category, pools] of Object.entries(MODIFIER_POOLS)) {
      for (const [poolName, mods] of Object.entries(pools)) {
        const modList = mods as any;
        if (modList.prefixes) {
          modList.prefixes.forEach((mod: any) => {
            this.modifierWeights.set(`${category}.${poolName}.prefix.${mod.mod}`, mod.weight);
          });
        }
        if (modList.suffixes) {
          modList.suffixes.forEach((mod: any) => {
            this.modifierWeights.set(`${category}.${poolName}.suffix.${mod.mod}`, mod.weight);
          });
        }
      }
    }
  }

  /**
   * Main simulation entry point
   */
  simulateCrafting(
    itemBase: string,
    itemLevel: number,
    targetMods: string[],
    maxBudget: number,
    strategy: 'budget' | 'midTier' | 'highEnd' = 'midTier'
  ): SimulationResult {
    // Initialize item
    let item: ItemState = {
      base: itemBase,
      itemLevel,
      rarity: 'normal',
      prefixes: [],
      suffixes: [],
      implicits: this.rollImplicits(itemBase),
      corrupted: false,
      quality: 20,
      craftingHistory: []
    };

    // Determine crafting route
    const route = this.selectCraftingRoute(itemBase, strategy, targetMods);
    let totalCost = 0;
    let steps = 0;

    // Execute crafting steps
    for (const step of route.steps) {
      if (totalCost >= maxBudget) break;
      
      const stepResult = this.executeCraftingStep(item, step);
      item = stepResult.item;
      totalCost += stepResult.cost;
      steps++;
      
      // Check if target mods achieved
      if (this.hasTargetMods(item, targetMods)) {
        break;
      }
    }

    // Calculate metrics
    const successRate = this.calculateSuccessRate(item, targetMods);
    const averageModTier = this.calculateAverageModTier(item);
    const recommendations = this.generateRecommendations(item, targetMods, totalCost, maxBudget);

    return {
      finalItem: item,
      totalCost,
      stepsUsed: steps,
      successRate,
      averageModTier,
      recommendations
    };
  }

  /**
   * Execute a single crafting step
   */
  private executeCraftingStep(
    item: ItemState,
    step: any
  ): { item: ItemState; cost: number } {
    const newItem = { ...item };
    const cost = this.getCurrencyCost(step.action);
    
    switch (step.action) {
      case 'transmutation':
      case 'transmutation_perfect':
      case 'transmutation_greater':
        if (newItem.rarity === 'normal') {
          newItem.rarity = 'magic';
          const tier = this.getModTier(step.action);
          newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
        }
        break;
        
      case 'augmentation':
      case 'augmentation_perfect':
      case 'augmentation_greater':
        if (newItem.rarity === 'magic' && newItem.prefixes.length + newItem.suffixes.length < 2) {
          const tier = this.getModTier(step.action);
          if (newItem.prefixes.length === 0) {
            newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
          } else {
            newItem.suffixes.push(this.rollModifier('suffix', newItem.base, newItem.itemLevel, tier));
          }
        }
        break;
        
      case 'alteration':
      case 'alteration_perfect':
      case 'alteration_greater':
        if (newItem.rarity === 'magic') {
          newItem.prefixes = [];
          newItem.suffixes = [];
          const tier = this.getModTier(step.action);
          const modCount = this.random() > 0.5 ? 2 : 1;
          newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
          if (modCount === 2) {
            newItem.suffixes.push(this.rollModifier('suffix', newItem.base, newItem.itemLevel, tier));
          }
        }
        break;
        
      case 'regal':
      case 'regal_perfect':
      case 'regal_greater':
        if (newItem.rarity === 'magic') {
          newItem.rarity = 'rare';
          const tier = this.getModTier(step.action);
          if (newItem.prefixes.length < 3) {
            newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
          } else {
            newItem.suffixes.push(this.rollModifier('suffix', newItem.base, newItem.itemLevel, tier));
          }
        }
        break;
        
      case 'alchemy':
      case 'alchemy_perfect':
      case 'alchemy_greater':
        if (newItem.rarity === 'normal') {
          newItem.rarity = 'rare';
          newItem.prefixes = [];
          newItem.suffixes = [];
          const tier = this.getModTier(step.action);
          // PoE2: Alchemy adds exactly 4 mods
          const prefixCount = 2;
          const suffixCount = 2;
          for (let i = 0; i < prefixCount; i++) {
            newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
          }
          for (let i = 0; i < suffixCount; i++) {
            newItem.suffixes.push(this.rollModifier('suffix', newItem.base, newItem.itemLevel, tier));
          }
        }
        break;
        
      case 'chaos':
      case 'chaos_perfect':
      case 'chaos_greater':
        if (newItem.rarity === 'rare') {
          // PoE2: Chaos only swaps ONE mod
          const allMods = [...newItem.prefixes, ...newItem.suffixes];
          if (allMods.length > 0) {
            const removeIndex = Math.floor(this.random() * allMods.length);
            const tier = this.getModTier(step.action);
            
            if (removeIndex < newItem.prefixes.length) {
              newItem.prefixes.splice(removeIndex, 1);
              newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
            } else {
              const suffixIndex = removeIndex - newItem.prefixes.length;
              newItem.suffixes.splice(suffixIndex, 1);
              newItem.suffixes.push(this.rollModifier('suffix', newItem.base, newItem.itemLevel, tier));
            }
          }
        }
        break;
        
      case 'exalted':
      case 'exalted_perfect':
      case 'exalted_greater':
        if (newItem.rarity === 'rare') {
          const tier = this.getModTier(step.action);
          if (newItem.prefixes.length < 3) {
            newItem.prefixes.push(this.rollModifier('prefix', newItem.base, newItem.itemLevel, tier));
          } else if (newItem.suffixes.length < 3) {
            newItem.suffixes.push(this.rollModifier('suffix', newItem.base, newItem.itemLevel, tier));
          }
        }
        break;
        
      case 'annulment':
        if (newItem.rarity === 'magic' || newItem.rarity === 'rare') {
          const allMods = [...newItem.prefixes, ...newItem.suffixes];
          if (allMods.length > 0) {
            const removeIndex = Math.floor(this.random() * allMods.length);
            if (removeIndex < newItem.prefixes.length) {
              newItem.prefixes.splice(removeIndex, 1);
            } else {
              newItem.suffixes.splice(removeIndex - newItem.prefixes.length, 1);
            }
          }
        }
        break;
        
      case 'divine':
        // Reroll all modifier values within their tiers
        newItem.prefixes = newItem.prefixes.map(mod => this.rerollModValues(mod));
        newItem.suffixes = newItem.suffixes.map(mod => this.rerollModValues(mod));
        break;
    }
    
    // Add to crafting history
    newItem.craftingHistory.push({
      currency: step.action,
      result: 'success',
      timestamp: Date.now(),
      cost
    });
    
    return { item: newItem, cost };
  }

  /**
   * Roll a random modifier
   */
  private rollModifier(
    type: 'prefix' | 'suffix',
    itemBase: string,
    itemLevel: number,
    tierRestriction?: 'normal' | 'higher' | 'T1-T2'
  ): ModifierInstance {
    // Determine item category
    let category = 'weapons'; // default
    for (const [cat, items] of Object.entries(ITEM_BASES)) {
      if (Object.keys(items).some(key => itemBase.includes(key))) {
        category = cat;
        break;
      }
    }

    // Get applicable mod pool
    const pool = MODIFIER_POOLS[category as keyof typeof MODIFIER_POOLS];
    let availableMods: any[] = [];
    
    for (const modGroup of Object.values(pool)) {
      const mods = (modGroup as any)[type === 'prefix' ? 'prefixes' : 'suffixes'];
      if (mods) {
        availableMods = availableMods.concat(mods);
      }
    }

    // Filter by tier restriction
    if (tierRestriction === 'T1-T2') {
      availableMods = availableMods.filter(mod => mod.tiers >= 7); // High tier count means good mod
    } else if (tierRestriction === 'higher') {
      availableMods = availableMods.filter(mod => mod.tiers >= 5);
    }

    // Weight-based selection
    const totalWeight = availableMods.reduce((sum, mod) => sum + mod.weight, 0);
    let roll = this.random() * totalWeight;
    
    for (const mod of availableMods) {
      roll -= mod.weight;
      if (roll <= 0) {
        const tier = this.rollTier(mod.tiers, tierRestriction);
        return {
          id: mod.mod,
          name: this.getModName(mod.mod),
          tier,
          values: this.rollModifierValues(mod.mod, tier),
          type,
          tags: this.getModTags(mod.mod)
        };
      }
    }

    // Fallback
    return {
      id: 'generic_' + type,
      name: 'Generic ' + type,
      tier: 5,
      values: [10],
      type,
      tags: []
    };
  }

  /**
   * Roll tier within constraints
   */
  private rollTier(maxTier: number, restriction?: string): number {
    if (restriction === 'T1-T2') {
      return this.random() > 0.3 ? 1 : 2;
    } else if (restriction === 'higher') {
      return Math.floor(this.random() * 3) + 1; // T1-T3
    }
    
    // Weight towards lower tiers (higher numbers)
    const weights = [];
    for (let i = 1; i <= maxTier; i++) {
      weights.push(Math.pow(2, i));
    }
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = this.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        return i + 1;
      }
    }
    
    return maxTier;
  }

  /**
   * Get mod tier from currency type
   */
  private getModTier(currency: string): 'normal' | 'higher' | 'T1-T2' {
    if (currency.includes('perfect')) return 'T1-T2';
    if (currency.includes('greater')) return 'higher';
    return 'normal';
  }

  /**
   * Roll modifier values based on tier
   */
  private rollModifierValues(modId: string, tier: number): number[] {
    // Simplified value rolling
    const baseValue = 100 - (tier * 10); // T1 = 90, T2 = 80, etc.
    const variance = this.random() * 10;
    return [Math.floor(baseValue + variance)];
  }

  /**
   * Reroll modifier values within same tier
   */
  private rerollModValues(mod: ModifierInstance): ModifierInstance {
    return {
      ...mod,
      values: this.rollModifierValues(mod.id, mod.tier)
    };
  }

  /**
   * Get human-readable mod name
   */
  private getModName(modId: string): string {
    const names: { [key: string]: string } = {
      'increased_physical_damage': 'Increased Physical Damage',
      'added_physical_damage': 'Added Physical Damage',
      'attack_speed': 'Increased Attack Speed',
      'critical_strike_chance': 'Increased Critical Strike Chance',
      'critical_strike_multiplier': 'Critical Strike Multiplier',
      'maximum_life': 'Maximum Life',
      'fire_resistance': 'Fire Resistance',
      'cold_resistance': 'Cold Resistance',
      'lightning_resistance': 'Lightning Resistance',
      'movement_speed': 'Movement Speed',
      'spell_damage': 'Increased Spell Damage',
      'cast_speed': 'Increased Cast Speed'
    };
    
    return names[modId] || modId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get mod tags for filtering
   */
  private getModTags(modId: string): string[] {
    const tagMap: { [key: string]: string[] } = {
      'increased_physical_damage': ['damage', 'physical', 'attack'],
      'added_physical_damage': ['damage', 'physical', 'attack', 'flat'],
      'attack_speed': ['speed', 'attack'],
      'critical_strike_chance': ['critical', 'attack'],
      'maximum_life': ['life', 'defense'],
      'fire_resistance': ['resistance', 'fire', 'elemental'],
      'movement_speed': ['speed', 'movement']
    };
    
    return tagMap[modId] || [];
  }

  /**
   * Roll item implicits
   */
  private rollImplicits(itemBase: string): ModifierInstance[] {
    // Simplified implicit system
    const implicitMap: { [key: string]: ModifierInstance } = {
      'sword': {
        id: 'implicit_accuracy',
        name: 'Increased Accuracy Rating',
        tier: 1,
        values: [40],
        type: 'implicit',
        tags: ['accuracy']
      },
      'axe': {
        id: 'implicit_bleed',
        name: 'Chance to cause Bleeding',
        tier: 1,
        values: [25],
        type: 'implicit',
        tags: ['bleed', 'physical']
      },
      'wand': {
        id: 'implicit_spell_damage',
        name: 'Increased Spell Damage',
        tier: 1,
        values: [30],
        type: 'implicit',
        tags: ['spell', 'damage']
      }
    };
    
    for (const [key, implicit] of Object.entries(implicitMap)) {
      if (itemBase.includes(key)) {
        return [implicit];
      }
    }
    
    return [];
  }

  /**
   * Select appropriate crafting route
   */
  private selectCraftingRoute(itemBase: string, strategy: string, targetMods: string[]): any {
    // Find matching route in CRAFTING_ROUTES
    for (const [category, routes] of Object.entries(CRAFTING_ROUTES)) {
      for (const [itemType, strategies] of Object.entries(routes)) {
        if (itemBase.includes(itemType) || category === 'special') {
          const route = (strategies as any)[strategy];
          if (route) return route;
        }
      }
    }
    
    // Default route
    return {
      steps: [
        { action: 'alchemy', description: 'Create rare item' },
        { action: 'chaos', description: 'Improve mods' },
        { action: 'exalted', description: 'Add missing mods' }
      ]
    };
  }

  /**
   * Get currency cost in chaos equivalent
   */
  private getCurrencyCost(currency: string): number {
    const baseCurrency = currency.split('_')[0];
    return this.marketPrices.get(currency) || this.marketPrices.get(baseCurrency) || 1;
  }

  /**
   * Check if item has target mods
   */
  private hasTargetMods(item: ItemState, targetMods: string[]): boolean {
    const allMods = [...item.prefixes, ...item.suffixes];
    return targetMods.every(target => 
      allMods.some(mod => 
        mod.name.toLowerCase().includes(target.toLowerCase()) ||
        mod.id.includes(target.toLowerCase())
      )
    );
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(item: ItemState, targetMods: string[]): number {
    const allMods = [...item.prefixes, ...item.suffixes];
    const foundMods = targetMods.filter(target =>
      allMods.some(mod =>
        mod.name.toLowerCase().includes(target.toLowerCase()) ||
        mod.id.includes(target.toLowerCase())
      )
    );
    
    return (foundMods.length / targetMods.length) * 100;
  }

  /**
   * Calculate average mod tier
   */
  private calculateAverageModTier(item: ItemState): number {
    const allMods = [...item.prefixes, ...item.suffixes];
    if (allMods.length === 0) return 0;
    
    const totalTier = allMods.reduce((sum, mod) => sum + mod.tier, 0);
    return totalTier / allMods.length;
  }

  /**
   * Generate crafting recommendations
   */
  private generateRecommendations(
    item: ItemState,
    targetMods: string[],
    currentCost: number,
    maxBudget: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Check if over budget
    if (currentCost > maxBudget * 0.9) {
      recommendations.push('⚠️ Approaching budget limit - consider stopping');
    }
    
    // Check mod count
    const totalMods = item.prefixes.length + item.suffixes.length;
    if (totalMods < 4 && item.rarity === 'rare') {
      recommendations.push('📝 Item has open mod slots - consider using Exalted Orbs');
    }
    
    // Check for missing target mods
    const missingMods = targetMods.filter(target =>
      ![...item.prefixes, ...item.suffixes].some(mod =>
        mod.name.toLowerCase().includes(target.toLowerCase())
      )
    );
    
    if (missingMods.length > 0) {
      recommendations.push(`🎯 Missing target mods: ${missingMods.join(', ')}`);
      
      if (item.rarity === 'rare' && totalMods === 6) {
        recommendations.push('💡 Consider using Annulment + Exalted to replace unwanted mods');
      }
    }
    
    // Check mod tiers
    const avgTier = this.calculateAverageModTier(item);
    if (avgTier > 3) {
      recommendations.push('⬆️ Low average mod tier - consider using Perfect currencies');
    }
    
    // Check if divining would help
    const lowRolls = [...item.prefixes, ...item.suffixes].filter(mod => 
      mod.values[0] < 70 // Assuming 70% is low roll
    );
    
    if (lowRolls.length >= 2 && avgTier <= 2) {
      recommendations.push('🎲 Multiple low rolls detected - consider using Divine Orb');
    }
    
    // Suggest harvest crafts if available
    if (item.prefixes.length === 3 && item.suffixes.length < 3) {
      recommendations.push('🌱 Prefixes full - use "Prefixes Cannot Be Changed" if available');
    }
    
    return recommendations;
  }

  /**
   * Simulate multiple crafting attempts and return statistics
   */
  simulateMultiple(
    itemBase: string,
    itemLevel: number,
    targetMods: string[],
    maxBudget: number,
    strategy: 'budget' | 'midTier' | 'highEnd',
    attempts: number = 100
  ): {
    averageCost: number;
    averageSuccessRate: number;
    bestItem: ItemState;
    worstItem: ItemState;
    distribution: { [key: string]: number };
  } {
    const results: SimulationResult[] = [];
    let bestItem: ItemState | null = null;
    let worstItem: ItemState | null = null;
    let bestScore = -Infinity;
    let worstScore = Infinity;
    
    for (let i = 0; i < attempts; i++) {
      const result = this.simulateCrafting(itemBase, itemLevel, targetMods, maxBudget, strategy);
      results.push(result);
      
      const score = result.successRate - (result.totalCost / maxBudget) * 20;
      
      if (score > bestScore) {
        bestScore = score;
        bestItem = result.finalItem;
      }
      
      if (score < worstScore) {
        worstScore = score;
        worstItem = result.finalItem;
      }
    }
    
    // Calculate statistics
    const avgCost = results.reduce((sum, r) => sum + r.totalCost, 0) / attempts;
    const avgSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / attempts;
    
    // Cost distribution
    const distribution: { [key: string]: number } = {
      'under_10c': 0,
      '10-50c': 0,
      '50-100c': 0,
      '100-200c': 0,
      'over_200c': 0
    };
    
    results.forEach(r => {
      if (r.totalCost < 10) distribution['under_10c']++;
      else if (r.totalCost < 50) distribution['10-50c']++;
      else if (r.totalCost < 100) distribution['50-100c']++;
      else if (r.totalCost < 200) distribution['100-200c']++;
      else distribution['over_200c']++;
    });
    
    // Convert to percentages
    Object.keys(distribution).forEach(key => {
      distribution[key] = (distribution[key] / attempts) * 100;
    });
    
    return {
      averageCost: avgCost,
      averageSuccessRate: avgSuccess,
      bestItem: bestItem!,
      worstItem: worstItem!,
      distribution
    };
  }

  /**
   * Export item to PoE2 trade format
   */
  exportToTrade(item: ItemState): string {
    let export_str = `${item.base}\n`;
    export_str += `Item Level: ${item.itemLevel}\n`;
    export_str += `Quality: ${item.quality}%\n`;
    export_str += `--------\n`;
    
    // Implicits
    item.implicits.forEach(mod => {
      export_str += `${mod.name}: ${mod.values[0]}\n`;
    });
    
    if (item.implicits.length > 0) {
      export_str += `--------\n`;
    }
    
    // Prefixes
    item.prefixes.forEach(mod => {
      export_str += `${mod.name}: ${mod.values[0]} (T${mod.tier})\n`;
    });
    
    // Suffixes
    item.suffixes.forEach(mod => {
      export_str += `${mod.name}: ${mod.values[0]} (T${mod.tier})\n`;
    });
    
    return export_str;
  }
}

export default AdvancedCraftingSimulator;