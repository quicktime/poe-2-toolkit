/**
 * Path of Exile 2 Crafting Simulator - v0.3+ Mechanics
 * Accurate simulation of PoE 2 specific crafting behavior
 */

import {
  CraftingMethod,
  CraftingSimulation,
  CraftingStrategy,
  ItemState,
  ItemModifier,
  ModifierPool,
  ModifierWeight,
  CraftingStep,
  DesiredItem,
  RequiredModifier
} from '@/types/crafting';
import { poe2CraftingKnowledge } from './poe2KnowledgeBase';

/**
 * Path of Exile 2 Crafting Simulator
 */
export class PoE2CraftingSimulator {
  private random: () => number;
  
  constructor(seed?: number) {
    this.random = seed ? this.seededRandom(seed) : Math.random;
  }
  
  /**
   * Create seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    return () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }
  
  /**
   * Run full simulation of a PoE 2 crafting strategy
   */
  async simulateStrategy(
    strategy: CraftingStrategy,
    iterations: number = 10000
  ): Promise<CraftingSimulation> {
    const results = {
      successes: 0,
      failures: 0,
      costs: [] as number[],
      attempts: [] as number[]
    };
    
    for (let i = 0; i < iterations; i++) {
      const result = this.simulateSingleCraft(strategy);
      
      if (result.success) {
        results.successes++;
      } else {
        results.failures++;
      }
      
      results.costs.push(result.totalCost);
      results.attempts.push(result.attempts);
    }
    
    results.costs.sort((a, b) => a - b);
    results.attempts.sort((a, b) => a - b);
    
    const simulation: CraftingSimulation = {
      strategy,
      simulations: iterations,
      results: {
        successes: results.successes,
        failures: results.failures,
        averageCost: results.costs.reduce((a, b) => a + b, 0) / iterations,
        medianCost: results.costs[Math.floor(iterations / 2)],
        percentiles: {
          p10: results.costs[Math.floor(iterations * 0.1)],
          p25: results.costs[Math.floor(iterations * 0.25)],
          p50: results.costs[Math.floor(iterations * 0.5)],
          p75: results.costs[Math.floor(iterations * 0.75)],
          p90: results.costs[Math.floor(iterations * 0.9)]
        },
        costDistribution: this.createDistribution(results.costs),
        timeDistribution: this.createDistribution(results.attempts)
      }
    };
    
    return simulation;
  }
  
  /**
   * Simulate a single crafting attempt
   */
  private simulateSingleCraft(strategy: CraftingStrategy): {
    success: boolean;
    totalCost: number;
    attempts: number;
    finalItem?: ItemState;
  } {
    let currentItem = this.createBaseItem(strategy.targetItem);
    let totalCost = 0;
    let totalAttempts = 0;
    
    for (const step of strategy.steps) {
      const stepResult = this.simulateStep(step, currentItem);
      
      totalCost += stepResult.cost;
      totalAttempts += stepResult.attempts;
      currentItem = stepResult.item;
      
      if (this.meetsRequirements(currentItem, strategy.targetItem)) {
        return {
          success: true,
          totalCost,
          attempts: totalAttempts,
          finalItem: currentItem
        };
      }
      
      if (stepResult.failed && !step.fallback) {
        return {
          success: false,
          totalCost,
          attempts: totalAttempts,
          finalItem: currentItem
        };
      }
    }
    
    const success = this.meetsRequirements(currentItem, strategy.targetItem);
    
    return {
      success,
      totalCost,
      attempts: totalAttempts,
      finalItem: currentItem
    };
  }
  
  /**
   * Simulate a single crafting step
   */
  private simulateStep(step: CraftingStep, item: ItemState): {
    item: ItemState;
    cost: number;
    attempts: number;
    failed: boolean;
  } {
    let attempts = 0;
    let totalCost = 0;
    let currentItem = { ...item };
    
    // Deterministic crafts (Runes, Essences)
    if (step.method.type === 'rune' || step.method.type === 'essence') {
      return {
        item: this.applyPoE2Method(step.method, currentItem),
        cost: step.expectedCost.expected || 0,
        attempts: 1,
        failed: false
      };
    }
    
    const maxAttempts = step.expectedAttempts * 10;
    
    while (attempts < maxAttempts) {
      attempts++;
      totalCost += step.expectedCost.expected || 0;
      
      if (this.random() < step.successProbability) {
        currentItem = this.applyPoE2Method(step.method, currentItem);
        return {
          item: currentItem,
          cost: totalCost,
          attempts,
          failed: false
        };
      }
    }
    
    return {
      item: currentItem,
      cost: totalCost,
      attempts,
      failed: true
    };
  }
  
  /**
   * Apply a PoE 2 crafting method to an item
   */
  private applyPoE2Method(method: CraftingMethod, item: ItemState): ItemState {
    const newItem = { ...item };
    
    switch (method.type) {
      case 'basic_currency':
        return this.applyPoE2Currency(method, newItem);
      case 'tiered_currency':
        return this.applyTieredCurrency(method, newItem);
      case 'essence':
        return this.applyPoE2Essence(method, newItem);
      case 'rune':
        return this.applyRune(method, newItem);
      case 'omen':
        return this.applyOmenEnhanced(method, newItem);
      case 'distilled':
        return this.applyDistilled(method, newItem);
      case 'corrupt':
        return this.applyCorruption(method, newItem);
      default:
        return newItem;
    }
  }
  
  /**
   * Apply PoE 2 basic currency
   */
  private applyPoE2Currency(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    switch (method.id) {
      case 'transmute_craft':
        // PoE 2: Creates magic with ONLY ONE modifier
        return this.transmutePoe2(pool);
        
      case 'chaos_reroll_poe2':
        // PoE 2: Remove ONE mod, add ONE mod (not full reroll)
        return this.chaosOrbPoe2(item, pool);
        
      case 'alchemy_craft_poe2':
        // PoE 2: Creates rare with EXACTLY 4 modifiers
        return this.alchemyPoe2(pool);
        
      case 'augmentation':
        // Add second mod to magic item
        return this.augmentPoe2(item, pool);
        
      case 'regal':
        // Upgrade magic to rare, add one mod
        return this.regalPoe2(item, pool);
        
      case 'exalted':
        // Add one modifier
        return this.exaltPoe2(item, pool);
        
      case 'annulment':
        // Remove random modifier (still works same in PoE 2)
        return this.removeRandomModifier(item);
        
      case 'divine':
        // Reroll values (still works same)
        return this.rerollValues(item);
        
      default:
        return item;
    }
  }
  
  /**
   * PoE 2 Transmutation: Creates magic with ONE modifier
   */
  private transmutePoe2(pool: ModifierPool): ItemState {
    const usePrefix = this.random() > 0.5;
    
    const newItem: ItemState = {
      prefixes: [],
      suffixes: [],
      corrupted: false,
      quality: 0
    };
    
    if (usePrefix) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod) newItem.prefixes.push(mod);
    } else {
      const mod = this.rollModifier(pool.suffixes);
      if (mod) newItem.suffixes.push(mod);
    }
    
    return newItem;
  }
  
  /**
   * PoE 2 Chaos Orb: Remove ONE mod, add ONE mod
   */
  private chaosOrbPoe2(item: ItemState, pool: ModifierPool): ItemState {
    const allMods = [...item.prefixes, ...item.suffixes];
    if (allMods.length === 0) return item;
    
    // Remove one random modifier
    const toRemove = allMods[Math.floor(this.random() * allMods.length)];
    const isPrefix = item.prefixes.some(m => m.id === toRemove.id);
    
    if (isPrefix) {
      item.prefixes = item.prefixes.filter(m => m.id !== toRemove.id);
    } else {
      item.suffixes = item.suffixes.filter(m => m.id !== toRemove.id);
    }
    
    // Add one new modifier of the same type
    if (isPrefix && item.prefixes.length < 3) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod && !item.prefixes.some(m => m.group === mod.group)) {
        item.prefixes.push(mod);
      }
    } else if (!isPrefix && item.suffixes.length < 3) {
      const mod = this.rollModifier(pool.suffixes);
      if (mod && !item.suffixes.some(m => m.group === mod.group)) {
        item.suffixes.push(mod);
      }
    }
    
    return item;
  }
  
  /**
   * PoE 2 Alchemy: Creates rare with EXACTLY 4 modifiers
   */
  private alchemyPoe2(pool: ModifierPool): ItemState {
    const newItem: ItemState = {
      prefixes: [],
      suffixes: [],
      corrupted: false,
      quality: 0
    };
    
    // Always 4 mods total, typically 2 prefixes and 2 suffixes
    // But can be 3-1 or 1-3
    const prefixCount = 1 + Math.floor(this.random() * 3); // 1-3
    const suffixCount = 4 - prefixCount; // Remainder to make 4 total
    
    // Roll prefixes
    for (let i = 0; i < Math.min(prefixCount, 3); i++) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod && !newItem.prefixes.some(m => m.group === mod.group)) {
        newItem.prefixes.push(mod);
      }
    }
    
    // Roll suffixes
    for (let i = 0; i < Math.min(suffixCount, 3); i++) {
      const mod = this.rollModifier(pool.suffixes);
      if (mod && !newItem.suffixes.some(m => m.group === mod.group)) {
        newItem.suffixes.push(mod);
      }
    }
    
    // Ensure we have exactly 4 mods
    while (newItem.prefixes.length + newItem.suffixes.length < 4) {
      if (newItem.prefixes.length < 3 && this.random() > 0.5) {
        const mod = this.rollModifier(pool.prefixes);
        if (mod && !newItem.prefixes.some(m => m.group === mod.group)) {
          newItem.prefixes.push(mod);
        }
      } else if (newItem.suffixes.length < 3) {
        const mod = this.rollModifier(pool.suffixes);
        if (mod && !newItem.suffixes.some(m => m.group === mod.group)) {
          newItem.suffixes.push(mod);
        }
      }
    }
    
    return newItem;
  }
  
  /**
   * PoE 2 Augmentation: Add second mod to magic item
   */
  private augmentPoe2(item: ItemState, pool: ModifierPool): ItemState {
    const totalMods = item.prefixes.length + item.suffixes.length;
    
    // Can only augment magic items with 1 mod
    if (totalMods !== 1) return item;
    
    // Add opposite type
    if (item.prefixes.length === 1) {
      const mod = this.rollModifier(pool.suffixes);
      if (mod) item.suffixes.push(mod);
    } else {
      const mod = this.rollModifier(pool.prefixes);
      if (mod) item.prefixes.push(mod);
    }
    
    return item;
  }
  
  /**
   * PoE 2 Regal: Upgrade magic to rare, add one mod
   */
  private regalPoe2(item: ItemState, pool: ModifierPool): ItemState {
    // Add one modifier
    const canAddPrefix = item.prefixes.length < 3;
    const canAddSuffix = item.suffixes.length < 3;
    
    if (!canAddPrefix && !canAddSuffix) return item;
    
    const addPrefix = canAddPrefix && (!canAddSuffix || this.random() > 0.5);
    
    if (addPrefix) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod && !item.prefixes.some(m => m.group === mod.group)) {
        item.prefixes.push(mod);
      }
    } else {
      const mod = this.rollModifier(pool.suffixes);
      if (mod && !item.suffixes.some(m => m.group === mod.group)) {
        item.suffixes.push(mod);
      }
    }
    
    return item;
  }
  
  /**
   * PoE 2 Exalt: Add one modifier
   */
  private exaltPoe2(item: ItemState, pool: ModifierPool): ItemState {
    const canAddPrefix = item.prefixes.length < 3;
    const canAddSuffix = item.suffixes.length < 3;
    
    if (!canAddPrefix && !canAddSuffix) return item;
    
    const addPrefix = canAddPrefix && (!canAddSuffix || this.random() > 0.5);
    
    if (addPrefix) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod && !item.prefixes.some(m => m.group === mod.group)) {
        item.prefixes.push(mod);
      }
    } else {
      const mod = this.rollModifier(pool.suffixes);
      if (mod && !item.suffixes.some(m => m.group === mod.group)) {
        item.suffixes.push(mod);
      }
    }
    
    return item;
  }
  
  /**
   * Apply tiered currency (Greater/Perfect)
   */
  private applyTieredCurrency(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    // Filter pool for higher tier mods only
    const minTier = method.id.includes('perfect') ? 1 : method.id.includes('greater') ? 2 : 3;
    
    const filteredPool = {
      ...pool,
      prefixes: pool.prefixes.filter(m => m.modifier.tier <= minTier),
      suffixes: pool.suffixes.filter(m => m.modifier.tier <= minTier)
    };
    
    // Apply the base currency effect with filtered pool
    if (method.id.includes('chaos')) {
      return this.chaosOrbPoe2(item, filteredPool);
    } else if (method.id.includes('exalt')) {
      return this.exaltPoe2(item, filteredPool);
    } else if (method.id.includes('transmut')) {
      return this.transmutePoe2(filteredPool);
    } else if (method.id.includes('augment')) {
      return this.augmentPoe2(item, filteredPool);
    } else if (method.id.includes('regal')) {
      return this.regalPoe2(item, filteredPool);
    }
    
    return item;
  }
  
  /**
   * Apply PoE 2 Essence crafting
   */
  private applyPoE2Essence(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    if (method.id === 'essence_normal') {
      // Normal Essence: White → Magic with 1 guaranteed mod
      const essenceMod: ItemModifier = {
        id: 'essence_guaranteed',
        text: 'Essence modifier',
        type: 'prefix',
        tier: 2,
        requiredLevel: 1,
        tags: ['essence'],
        weight: 0,
        values: [{ min: 50, max: 70 }]
      };
      
      return {
        prefixes: [essenceMod],
        suffixes: [],
        corrupted: false,
        quality: 0
      };
    } else if (method.id === 'greater_essence') {
      // Greater Essence: Magic → Rare with guaranteed mod
      const essenceMod: ItemModifier = {
        id: 'greater_essence_guaranteed',
        text: 'Greater Essence modifier',
        type: 'prefix',
        tier: 1,
        requiredLevel: 1,
        tags: ['essence'],
        weight: 0,
        values: [{ min: 80, max: 100 }]
      };
      
      // Keep existing mods and add essence mod + random mods
      const newItem = { ...item };
      newItem.prefixes = [essenceMod, ...item.prefixes.slice(0, 2)];
      
      // Fill remaining slots
      while (newItem.prefixes.length + newItem.suffixes.length < 4) {
        if (newItem.suffixes.length < 3 && this.random() > 0.5) {
          const mod = this.rollModifier(pool.suffixes);
          if (mod && !newItem.suffixes.some(m => m.group === mod.group)) {
            newItem.suffixes.push(mod);
          }
        } else if (newItem.prefixes.length < 3) {
          const mod = this.rollModifier(pool.prefixes);
          if (mod && !newItem.prefixes.some(m => m.group === mod.group)) {
            newItem.prefixes.push(mod);
          }
        }
      }
      
      return newItem;
    }
    
    return item;
  }
  
  /**
   * Apply Rune with Soul Core
   */
  private applyRune(method: CraftingMethod, item: ItemState): ItemState {
    // Runes add weak but guaranteed modifiers
    const runeMod: ItemModifier = {
      id: `rune_${method.id}`,
      text: 'Rune modifier (weak)',
      type: this.random() > 0.5 ? 'prefix' : 'suffix',
      tier: 4, // Weak tier
      requiredLevel: 1,
      tags: ['rune'],
      weight: 0,
      values: [{ min: 10, max: 20 }] // Weak values
    };
    
    if (runeMod.type === 'prefix' && item.prefixes.length < 3) {
      item.prefixes.push(runeMod);
    } else if (runeMod.type === 'suffix' && item.suffixes.length < 3) {
      item.suffixes.push(runeMod);
    }
    
    return item;
  }
  
  /**
   * Apply Omen-enhanced currency
   */
  private applyOmenEnhanced(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    if (method.id === 'omen_prefix_chaos') {
      // Chaos affects only prefixes
      if (item.prefixes.length > 0) {
        const toRemove = item.prefixes[Math.floor(this.random() * item.prefixes.length)];
        item.prefixes = item.prefixes.filter(m => m.id !== toRemove.id);
        
        const mod = this.rollModifier(pool.prefixes);
        if (mod && !item.prefixes.some(m => m.group === mod.group)) {
          item.prefixes.push(mod);
        }
      }
    } else if (method.id === 'omen_suffix_chaos') {
      // Chaos affects only suffixes
      if (item.suffixes.length > 0) {
        const toRemove = item.suffixes[Math.floor(this.random() * item.suffixes.length)];
        item.suffixes = item.suffixes.filter(m => m.id !== toRemove.id);
        
        const mod = this.rollModifier(pool.suffixes);
        if (mod && !item.suffixes.some(m => m.group === mod.group)) {
          item.suffixes.push(mod);
        }
      }
    } else if (method.id === 'omen_double_exalt') {
      // Add two modifiers
      for (let i = 0; i < 2; i++) {
        this.exaltPoe2(item, pool);
      }
    }
    
    return item;
  }
  
  /**
   * Apply Distilled Orb
   */
  private applyDistilled(method: CraftingMethod, item: ItemState): ItemState {
    // Distilled Orbs add special modifiers
    const distilledMod: ItemModifier = {
      id: `distilled_${method.id}`,
      text: 'Distilled modifier',
      type: 'suffix',
      tier: 2,
      requiredLevel: 1,
      tags: ['distilled', 'special'],
      weight: 0,
      values: [{ min: 30, max: 50 }]
    };
    
    if (item.suffixes.length < 3) {
      item.suffixes.push(distilledMod);
    }
    
    return item;
  }
  
  /**
   * Apply corruption (Vaal Orb)
   */
  private applyCorruption(method: CraftingMethod, item: ItemState): ItemState {
    item.corrupted = true;
    
    const outcome = this.random();
    
    if (outcome < 0.25) {
      // No change
    } else if (outcome < 0.5) {
      // Add implicit
      item.implicit = {
        id: 'corrupted_implicit',
        text: 'Corrupted implicit',
        type: 'implicit',
        tier: 1,
        requiredLevel: 1,
        tags: ['corrupted'],
        weight: 0,
        values: [{ min: 20, max: 30 }]
      };
    } else if (outcome < 0.75) {
      // Reroll to rare
      const pool = this.getModifierPool(item);
      return { ...this.alchemyPoe2(pool), corrupted: true };
    } else {
      // Brick item (make it terrible)
      item.prefixes = [];
      item.suffixes = [];
    }
    
    return item;
  }
  
  /**
   * Roll a modifier from weighted pool
   */
  private rollModifier(pool: ModifierWeight[]): ItemModifier | null {
    if (!pool.length) return null;
    
    const totalWeight = pool.reduce((sum, m) => sum + m.weight, 0);
    let roll = this.random() * totalWeight;
    
    for (const modWeight of pool) {
      roll -= modWeight.weight;
      if (roll <= 0) {
        return this.rollModifierValues(modWeight.modifier);
      }
    }
    
    return pool[0].modifier;
  }
  
  /**
   * Roll modifier values within tier range
   */
  private rollModifierValues(mod: ItemModifier): ItemModifier {
    const rolledMod = { ...mod };
    
    rolledMod.values = mod.values.map(range => ({
      min: range.min,
      max: range.min + Math.floor(this.random() * (range.max - range.min + 1))
    }));
    
    return rolledMod;
  }
  
  /**
   * Remove random modifier from item
   */
  private removeRandomModifier(item: ItemState): ItemState {
    const allMods = [...item.prefixes, ...item.suffixes];
    if (!allMods.length) return item;
    
    const toRemove = allMods[Math.floor(this.random() * allMods.length)];
    
    item.prefixes = item.prefixes.filter(m => m.id !== toRemove.id);
    item.suffixes = item.suffixes.filter(m => m.id !== toRemove.id);
    
    return item;
  }
  
  /**
   * Reroll numeric values of modifiers
   */
  private rerollValues(item: ItemState): ItemState {
    item.prefixes = item.prefixes.map(mod => this.rollModifierValues(mod));
    item.suffixes = item.suffixes.map(mod => this.rollModifierValues(mod));
    return item;
  }
  
  /**
   * Get modifier pool for current item
   */
  private getModifierPool(item: ItemState): ModifierPool {
    return poe2CraftingKnowledge.getModifierPool('warmonger_bow', 85) || {
      itemBase: 'unknown',
      itemLevel: 1,
      prefixes: [],
      suffixes: [],
      totalPrefixWeight: 0,
      totalSuffixWeight: 0
    };
  }
  
  /**
   * Create base item from desired specifications
   */
  private createBaseItem(desired: DesiredItem): ItemState {
    return {
      prefixes: [],
      suffixes: [],
      corrupted: false,
      quality: desired.quality || 0
    };
  }
  
  /**
   * Check if item meets requirements
   */
  private meetsRequirements(item: ItemState, desired: DesiredItem): boolean {
    const allMods = [...item.prefixes, ...item.suffixes];
    
    for (const required of desired.requiredMods) {
      const hasMod = allMods.some(mod => 
        mod.text.toLowerCase().includes(required.modText.toLowerCase())
      );
      
      if (!hasMod) return false;
    }
    
    return true;
  }
  
  /**
   * Create distribution from values
   */
  private createDistribution(values: number[]): Array<{ cost: number; frequency: number }> {
    const bins = new Map<number, number>();
    const binSize = Math.max(1, Math.floor((values[values.length - 1] - values[0]) / 20));
    
    for (const value of values) {
      const bin = Math.floor(value / binSize) * binSize;
      bins.set(bin, (bins.get(bin) || 0) + 1);
    }
    
    return Array.from(bins.entries())
      .map(([cost, frequency]) => ({ cost, frequency }))
      .sort((a, b) => a.cost - b.cost);
  }
  
  /**
   * Calculate PoE 2 success probability
   */
  calculatePoE2SuccessProbability(
    method: CraftingMethod,
    targetMods: RequiredModifier[],
    itemState: ItemState
  ): number {
    const pool = this.getModifierPool(itemState);
    
    // Deterministic methods in PoE 2
    if (method.type === 'rune' || method.type === 'essence') {
      return 1; // Guaranteed
    }
    
    // Calculate based on PoE 2 mechanics
    let probability = 1;
    
    for (const target of targetMods) {
      const modProb = this.getModifierProbability(pool, target.modText);
      probability *= modProb;
    }
    
    // Adjust for PoE 2 method types
    switch (method.type) {
      case 'basic_currency':
        if (method.id.includes('chaos')) {
          // PoE 2 Chaos only changes one mod at a time
          // Much lower chance of hitting all mods
          return probability * 0.1;
        } else if (method.id.includes('alchemy')) {
          // Always 4 mods, slightly better odds
          return probability * 1.5;
        }
        break;
        
      case 'tiered_currency':
        // Greater/Perfect currencies have better odds
        if (method.id.includes('perfect')) return probability * 3;
        if (method.id.includes('greater')) return probability * 2;
        break;
        
      case 'omen':
        // Omens provide more control
        return probability * 2;
        
      case 'distilled':
        // Distilled orbs are deterministic for their type
        return targetMods.length === 1 ? 0.8 : probability;
    }
    
    return Math.min(1, probability);
  }
  
  /**
   * Get probability of rolling specific modifier
   */
  private getModifierProbability(pool: ModifierPool, modText: string): number {
    const allMods = [...pool.prefixes, ...pool.suffixes];
    const matching = allMods.filter(m => 
      m.modifier.text.toLowerCase().includes(modText.toLowerCase())
    );
    
    if (!matching.length) return 0;
    
    return matching.reduce((sum, m) => sum + m.probability, 0);
  }
}

export const poe2CraftingSimulator = new PoE2CraftingSimulator();