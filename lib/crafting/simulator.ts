/**
 * Crafting Simulator - Monte Carlo simulation and probability calculations
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
import { craftingKnowledge } from './knowledgeBase';

/**
 * Crafting simulator for probability and cost calculations
 */
export class CraftingSimulator {
  private random: () => number;
  
  constructor(seed?: number) {
    // Seeded random for reproducible simulations
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
   * Run full simulation of a crafting strategy
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
    
    // Calculate statistics
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
      
      // Check if we've achieved our goal
      if (this.meetsRequirements(currentItem, strategy.targetItem)) {
        return {
          success: true,
          totalCost,
          attempts: totalAttempts,
          finalItem: currentItem
        };
      }
      
      // Check for failure conditions
      if (stepResult.failed && !step.fallback) {
        return {
          success: false,
          totalCost,
          attempts: totalAttempts,
          finalItem: currentItem
        };
      }
    }
    
    // Final check after all steps
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
    
    // For deterministic crafts
    if (step.successProbability === 1) {
      return {
        item: this.applyMethod(step.method, currentItem),
        cost: step.expectedCost.expected || 0,
        attempts: 1,
        failed: false
      };
    }
    
    // For RNG crafts, simulate until success or max attempts
    const maxAttempts = step.expectedAttempts * 10; // Reasonable cutoff
    
    while (attempts < maxAttempts) {
      attempts++;
      totalCost += step.expectedCost.expected || 0;
      
      if (this.random() < step.successProbability) {
        currentItem = this.applyMethod(step.method, currentItem);
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
   * Apply a crafting method to an item
   */
  private applyMethod(method: CraftingMethod, item: ItemState): ItemState {
    const newItem = { ...item };
    
    switch (method.type) {
      case 'basic_currency':
        return this.applyBasicCurrency(method, newItem);
      case 'essence':
        return this.applyEssence(method, newItem);
      case 'fossil':
        return this.applyFossil(method, newItem);
      case 'harvest':
        return this.applyHarvest(method, newItem);
      case 'bench':
        return this.applyBenchCraft(method, newItem);
      case 'metacraft':
        return this.applyMetacraft(method, newItem);
      default:
        return newItem;
    }
  }
  
  /**
   * Apply basic currency orb
   */
  private applyBasicCurrency(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    switch (method.id) {
      case 'chaos_spam':
        // Reroll all modifiers
        return this.rerollRareItem(pool);
        
      case 'alteration_spam':
        // Reroll magic item
        return this.rerollMagicItem(pool);
        
      case 'exalt_slam':
        // Add one modifier
        return this.addRandomModifier(item, pool);
        
      case 'annulment':
        // Remove random modifier
        return this.removeRandomModifier(item);
        
      case 'divine':
        // Reroll values
        return this.rerollValues(item);
        
      default:
        return item;
    }
  }
  
  /**
   * Apply essence crafting
   */
  private applyEssence(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    const newItem = this.rerollRareItem(pool);
    
    // Add guaranteed essence modifier
    // This would be specific to the essence type
    const essenceMod: ItemModifier = {
      id: 'essence_mod',
      text: 'Essence modifier',
      type: 'prefix',
      tier: 1,
      requiredLevel: 1,
      tags: ['essence'],
      weight: 0,
      values: [{ min: 100, max: 120 }]
    };
    
    newItem.prefixes.push(essenceMod);
    return newItem;
  }
  
  /**
   * Apply fossil crafting
   */
  private applyFossil(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    // Modify weights based on fossil type
    const modifiedPool = this.applyFossilWeights(pool, method);
    
    return this.rerollRareItem(modifiedPool);
  }
  
  /**
   * Apply harvest crafting
   */
  private applyHarvest(method: CraftingMethod, item: ItemState): ItemState {
    const pool = this.getModifierPool(item);
    
    switch (method.id) {
      case 'harvest_augment':
        // Add modifier with specific tag
        return this.addModifierWithTag(item, pool, method.tags?.[0] || '');
        
      case 'harvest_remove':
        // Remove modifier with specific tag
        return this.removeModifierWithTag(item, method.tags?.[0] || '');
        
      case 'harvest_remove_add':
        // Remove and add with same tag
        const removed = this.removeModifierWithTag(item, method.tags?.[0] || '');
        return this.addModifierWithTag(removed, pool, method.tags?.[0] || '');
        
      case 'harvest_reforge':
        // Reforge with weighted mods
        return this.reforgeWithTag(pool, method.tags?.[0] || '');
        
      default:
        return item;
    }
  }
  
  /**
   * Apply bench craft
   */
  private applyBenchCraft(method: CraftingMethod, item: ItemState): ItemState {
    // Add specific crafted modifier
    const benchMod: ItemModifier = {
      id: `crafted_${method.id}`,
      text: 'Crafted modifier',
      type: 'prefix', // Or suffix based on craft
      tier: 1,
      requiredLevel: 1,
      tags: ['crafted'],
      weight: 0,
      values: [{ min: 10, max: 15 }]
    };
    
    if (benchMod.type === 'prefix' && item.prefixes.length < 3) {
      item.prefixes.push(benchMod);
    } else if (benchMod.type === 'suffix' && item.suffixes.length < 3) {
      item.suffixes.push(benchMod);
    }
    
    return item;
  }
  
  /**
   * Apply metacraft
   */
  private applyMetacraft(method: CraftingMethod, item: ItemState): ItemState {
    // Add metacraft modifier
    const metamod: ItemModifier = {
      id: method.id,
      text: method.name,
      type: method.id.includes('suffix') ? 'prefix' : 'suffix',
      tier: 0,
      requiredLevel: 1,
      tags: ['metacraft'],
      weight: 0,
      values: []
    };
    
    if (metamod.type === 'prefix') {
      item.prefixes.push(metamod);
    } else {
      item.suffixes.push(metamod);
    }
    
    return item;
  }
  
  /**
   * Reroll rare item with random modifiers
   */
  private rerollRareItem(pool: ModifierPool): ItemState {
    const prefixCount = this.randomRange(1, 3);
    const suffixCount = this.randomRange(1, 3);
    
    const newItem: ItemState = {
      prefixes: [],
      suffixes: [],
      corrupted: false,
      quality: 0
    };
    
    // Roll prefixes
    for (let i = 0; i < prefixCount; i++) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod && !newItem.prefixes.some(m => m.group === mod.group)) {
        newItem.prefixes.push(mod);
      }
    }
    
    // Roll suffixes
    for (let i = 0; i < suffixCount; i++) {
      const mod = this.rollModifier(pool.suffixes);
      if (mod && !newItem.suffixes.some(m => m.group === mod.group)) {
        newItem.suffixes.push(mod);
      }
    }
    
    return newItem;
  }
  
  /**
   * Reroll magic item
   */
  private rerollMagicItem(pool: ModifierPool): ItemState {
    const hasPrefix = this.random() > 0.5;
    const hasSuffix = this.random() > 0.5 || !hasPrefix;
    
    const newItem: ItemState = {
      prefixes: [],
      suffixes: [],
      corrupted: false,
      quality: 0
    };
    
    if (hasPrefix) {
      const mod = this.rollModifier(pool.prefixes);
      if (mod) newItem.prefixes.push(mod);
    }
    
    if (hasSuffix) {
      const mod = this.rollModifier(pool.suffixes);
      if (mod) newItem.suffixes.push(mod);
    }
    
    return newItem;
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
   * Add random modifier to item
   */
  private addRandomModifier(item: ItemState, pool: ModifierPool): ItemState {
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
   * Add modifier with specific tag
   */
  private addModifierWithTag(
    item: ItemState,
    pool: ModifierPool,
    tag: string
  ): ItemState {
    const prefixPool = pool.prefixes.filter(m => m.tags.includes(tag));
    const suffixPool = pool.suffixes.filter(m => m.tags.includes(tag));
    
    const canAddPrefix = item.prefixes.length < 3 && prefixPool.length > 0;
    const canAddSuffix = item.suffixes.length < 3 && suffixPool.length > 0;
    
    if (!canAddPrefix && !canAddSuffix) return item;
    
    const addPrefix = canAddPrefix && (!canAddSuffix || this.random() > 0.5);
    
    if (addPrefix) {
      const mod = this.rollModifier(prefixPool);
      if (mod && !item.prefixes.some(m => m.group === mod.group)) {
        item.prefixes.push(mod);
      }
    } else {
      const mod = this.rollModifier(suffixPool);
      if (mod && !item.suffixes.some(m => m.group === mod.group)) {
        item.suffixes.push(mod);
      }
    }
    
    return item;
  }
  
  /**
   * Remove modifier with specific tag
   */
  private removeModifierWithTag(item: ItemState, tag: string): ItemState {
    const prefixesToRemove = item.prefixes.filter(m => m.tags.includes(tag));
    const suffixesToRemove = item.suffixes.filter(m => m.tags.includes(tag));
    const allToRemove = [...prefixesToRemove, ...suffixesToRemove];
    
    if (!allToRemove.length) return item;
    
    const toRemove = allToRemove[Math.floor(this.random() * allToRemove.length)];
    
    item.prefixes = item.prefixes.filter(m => m.id !== toRemove.id);
    item.suffixes = item.suffixes.filter(m => m.id !== toRemove.id);
    
    return item;
  }
  
  /**
   * Reforge with weighted tag modifiers
   */
  private reforgeWithTag(pool: ModifierPool, tag: string): ItemState {
    // Increase weight for tagged modifiers
    const modifiedPool = { ...pool };
    
    modifiedPool.prefixes = pool.prefixes.map(m => ({
      ...m,
      weight: m.tags.includes(tag) ? m.weight * 10 : m.weight
    }));
    
    modifiedPool.suffixes = pool.suffixes.map(m => ({
      ...m,
      weight: m.tags.includes(tag) ? m.weight * 10 : m.weight
    }));
    
    return this.rerollRareItem(modifiedPool);
  }
  
  /**
   * Apply fossil weight modifications
   */
  private applyFossilWeights(pool: ModifierPool, method: CraftingMethod): ModifierPool {
    // This would be based on actual fossil data
    // For now, simplified version
    return pool;
  }
  
  /**
   * Get modifier pool for current item
   */
  private getModifierPool(item: ItemState): ModifierPool {
    // Get from knowledge base - simplified for now
    return craftingKnowledge.getModifierPool('warmonger_bow', 85) || {
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
      const hasmod = allMods.some(mod => 
        mod.text.toLowerCase().includes(required.modText.toLowerCase())
      );
      
      if (!hasmod) return false;
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
   * Random number in range
   */
  private randomRange(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  /**
   * Calculate success probability for a method
   */
  calculateSuccessProbability(
    method: CraftingMethod,
    targetMods: RequiredModifier[],
    itemState: ItemState
  ): number {
    const pool = this.getModifierPool(itemState);
    
    // For deterministic methods
    if (method.successRate === 1) {
      return 1;
    }
    
    // Calculate based on modifier weights
    let probability = 1;
    
    for (const target of targetMods) {
      const modProb = this.getModifierProbability(pool, target.modText);
      probability *= modProb;
    }
    
    // Adjust for method type
    switch (method.type) {
      case 'chaos_spam':
        // Need all mods in one roll
        return probability;
        
      case 'alteration_spam':
        // Easier for 1-2 mods
        return targetMods.length <= 2 ? probability * 2 : probability;
        
      case 'fossil':
        // Fossils can greatly increase chances
        return Math.min(1, probability * 5);
        
      case 'essence':
        // Guarantees one mod
        return targetMods.length === 1 ? 1 : probability * 2;
        
      default:
        return probability;
    }
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

export const craftingSimulator = new CraftingSimulator();