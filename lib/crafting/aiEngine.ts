/**
 * Path of Exile 2 AI/ML Crafting Engine
 * Uses pattern recognition and LLM integration for intelligent recommendations
 */

import {
  CraftingMLInput,
  CraftingMLPrediction,
  CraftingMethod,
  ItemModifier,
  RequiredModifier,
  CraftingStrategy,
  DesiredItem
} from '@/types/crafting';
import { poe2CraftingKnowledge } from './poe2KnowledgeBase';
import { poe2CraftingSimulator } from './poe2Simulator';

/**
 * Pattern for successful crafting sequences
 */
interface CraftingPattern {
  sequence: string[];
  successRate: number;
  avgCost: number;
  itemType: string;
  modifiers: string[];
}

/**
 * AI-powered crafting recommendation engine
 */
export class PoE2AIEngine {
  private patterns: Map<string, CraftingPattern[]> = new Map();
  private successfulCrafts: CraftingPattern[] = [];
  private modelWeights: Map<string, number> = new Map();
  
  constructor() {
    this.initializePatterns();
    this.initializeWeights();
  }
  
  /**
   * Initialize known successful patterns for PoE 2
   */
  private initializePatterns() {
    // Pattern 1: White Base Premium - PoE 2 specific
    this.addPattern({
      sequence: ['acquire_white', 'perfect_alchemy', 'perfect_chaos', 'perfect_exalt'],
      successRate: 0.65,
      avgCost: 800,
      itemType: 'weapon',
      modifiers: ['physical', 'critical', 'attack']
    });
    
    // Pattern 2: Essence Deterministic - PoE 2
    this.addPattern({
      sequence: ['essence_normal', 'augmentation', 'regal', 'greater_essence'],
      successRate: 0.85,
      avgCost: 50,
      itemType: 'all',
      modifiers: ['guaranteed']
    });
    
    // Pattern 3: Rune Budget - PoE 2
    this.addPattern({
      sequence: ['rune_physical', 'rune_elemental', 'essence_normal', 'augmentation'],
      successRate: 0.95,
      avgCost: 20,
      itemType: 'all',
      modifiers: ['weak', 'guaranteed']
    });
    
    // Pattern 4: Omen Control - PoE 2
    this.addPattern({
      sequence: ['alchemy', 'omen_prefix_chaos', 'omen_suffix_chaos', 'omen_double_exalt'],
      successRate: 0.55,
      avgCost: 400,
      itemType: 'all',
      modifiers: ['targeted', 'controlled']
    });
    
    // Pattern 5: Tiered Progression - PoE 2
    this.addPattern({
      sequence: ['transmutation', 'augmentation', 'regal_greater', 'exalt_greater'],
      successRate: 0.70,
      avgCost: 300,
      itemType: 'all',
      modifiers: ['progressive', 'tiered']
    });
  }
  
  /**
   * Initialize model weights for different factors
   */
  private initializeWeights() {
    // PoE 2 specific weights
    this.modelWeights.set('white_base_value', 2.0); // White items are very valuable
    this.modelWeights.set('deterministic_preference', 1.5); // Prefer guaranteed mods
    this.modelWeights.set('chaos_penalty', 0.5); // Chaos is less effective in PoE 2
    this.modelWeights.set('tiered_currency_bonus', 1.3); // Tiered currency is good
    this.modelWeights.set('omen_control_bonus', 1.4); // Omens provide control
    this.modelWeights.set('rune_reliability', 1.8); // Runes are very reliable
    this.modelWeights.set('essence_guarantee', 1.7); // Essences guarantee mods
  }
  
  /**
   * Add a crafting pattern
   */
  private addPattern(pattern: CraftingPattern) {
    const key = pattern.itemType;
    if (!this.patterns.has(key)) {
      this.patterns.set(key, []);
    }
    this.patterns.get(key)!.push(pattern);
    this.successfulCrafts.push(pattern);
  }
  
  /**
   * Predict best crafting method using ML
   */
  async predictBestMethod(input: CraftingMLInput): Promise<CraftingMLPrediction> {
    // Analyze current item state
    const itemAnalysis = this.analyzeItemState(input);
    
    // Find matching patterns
    const matchingPatterns = this.findMatchingPatterns(input);
    
    // Score each available method
    const methodScores = await this.scoreAvailableMethods(input, itemAnalysis);
    
    // Select best method
    const bestMethod = methodScores[0];
    
    // Generate reasoning
    const reasoning = this.generateReasoning(bestMethod, input, itemAnalysis);
    
    return {
      recommendedMethod: bestMethod.method,
      expectedSuccess: bestMethod.score / 100,
      expectedCost: bestMethod.expectedCost,
      confidence: this.calculateConfidence(bestMethod, matchingPatterns),
      reasoning,
      alternativeMethods: methodScores.slice(1, 4).map(m => ({
        method: m.method,
        score: m.score
      }))
    };
  }
  
  /**
   * Analyze current item state
   */
  private analyzeItemState(input: CraftingMLInput): {
    hasValuableBase: boolean;
    modQuality: 'low' | 'medium' | 'high';
    craftingStage: 'early' | 'mid' | 'late';
    missingCriticalMods: string[];
  } {
    const currentModCount = input.currentMods.length;
    const targetModCount = input.targetMods.length;
    
    // Check if we have a white base (valuable in PoE 2)
    const hasValuableBase = currentModCount === 0;
    
    // Assess mod quality
    const avgTier = input.currentMods.reduce((sum, m) => sum + m.tier, 0) / (currentModCount || 1);
    const modQuality = avgTier <= 2 ? 'high' : avgTier <= 3 ? 'medium' : 'low';
    
    // Determine crafting stage
    const progress = currentModCount / targetModCount;
    const craftingStage = progress < 0.3 ? 'early' : progress < 0.7 ? 'mid' : 'late';
    
    // Find missing critical mods
    const missingCriticalMods = input.targetMods
      .filter(t => t.weight && t.weight > 5)
      .filter(t => !input.currentMods.some(c => 
        c.text.toLowerCase().includes(t.modText.toLowerCase())
      ))
      .map(t => t.modText);
    
    return {
      hasValuableBase,
      modQuality,
      craftingStage,
      missingCriticalMods
    };
  }
  
  /**
   * Find matching successful patterns
   */
  private findMatchingPatterns(input: CraftingMLInput): CraftingPattern[] {
    const patterns = this.patterns.get(input.itemBase) || [];
    const allPatterns = [...patterns, ...this.patterns.get('all') || []];
    
    return allPatterns.filter(pattern => {
      // Check if pattern modifiers match target
      const targetModTexts = input.targetMods.map(m => m.modText.toLowerCase());
      return pattern.modifiers.some(mod => 
        targetModTexts.some(target => target.includes(mod))
      );
    });
  }
  
  /**
   * Score available methods
   */
  private async scoreAvailableMethods(
    input: CraftingMLInput,
    analysis: any
  ): Promise<Array<{
    method: CraftingMethod;
    score: number;
    expectedCost: number;
  }>> {
    const methods = poe2CraftingKnowledge.getAvailableMethods(
      { 
        prefixes: input.currentMods.filter(m => m.type === 'prefix'),
        suffixes: input.currentMods.filter(m => m.type === 'suffix'),
        rarity: input.currentMods.length === 0 ? 'normal' : 
                input.currentMods.length <= 2 ? 'magic' : 'rare',
        itemLevel: input.itemLevel
      },
      input.targetMods.map(m => m.modText)
    );
    
    const scored = [];
    
    for (const method of methods) {
      let score = 50; // Base score
      
      // Apply PoE 2 specific scoring
      
      // White base preservation (PoE 2)
      if (analysis.hasValuableBase && method.requirements.itemRarity === 'normal') {
        score += this.modelWeights.get('white_base_value')! * 20;
      }
      
      // Deterministic methods (Runes, Essences)
      if (method.type === 'rune') {
        score += this.modelWeights.get('rune_reliability')! * 25;
      }
      if (method.type === 'essence') {
        score += this.modelWeights.get('essence_guarantee')! * 20;
      }
      
      // Tiered currency bonus
      if (method.id.includes('greater') || method.id.includes('perfect')) {
        score += this.modelWeights.get('tiered_currency_bonus')! * 15;
      }
      
      // Omen control bonus
      if (method.type === 'omen') {
        score += this.modelWeights.get('omen_control_bonus')! * 18;
      }
      
      // Chaos penalty (less effective in PoE 2)
      if (method.id.includes('chaos') && !method.id.includes('perfect')) {
        score *= this.modelWeights.get('chaos_penalty')!;
      }
      
      // Stage-appropriate methods
      if (analysis.craftingStage === 'early' && method.type === 'essence') {
        score += 15;
      } else if (analysis.craftingStage === 'mid' && method.type === 'tiered_currency') {
        score += 10;
      } else if (analysis.craftingStage === 'late' && method.type === 'omen') {
        score += 12;
      }
      
      // Cost efficiency
      const costEfficiency = 100 / (method.cost.averageTotal || 1);
      score += Math.min(20, costEfficiency);
      
      // Success probability
      const successProb = poe2CraftingSimulator.calculatePoE2SuccessProbability(
        method,
        input.targetMods,
        {
          prefixes: input.currentMods.filter(m => m.type === 'prefix'),
          suffixes: input.currentMods.filter(m => m.type === 'suffix'),
          corrupted: false,
          quality: 0
        }
      );
      score += successProb * 30;
      
      scored.push({
        method,
        score: Math.min(100, score),
        expectedCost: method.cost.averageTotal || 0
      });
    }
    
    return scored.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Calculate confidence in recommendation
   */
  private calculateConfidence(
    bestMethod: any,
    patterns: CraftingPattern[]
  ): number {
    let confidence = 50; // Base confidence
    
    // Pattern matching confidence
    if (patterns.length > 0) {
      const avgSuccess = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
      confidence += avgSuccess * 30;
    }
    
    // Method score confidence
    confidence += (bestMethod.score / 100) * 20;
    
    return Math.min(100, confidence);
  }
  
  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    bestMethod: any,
    input: CraftingMLInput,
    analysis: any
  ): string {
    const reasons = [];
    
    // PoE 2 specific reasoning
    if (analysis.hasValuableBase) {
      reasons.push('You have a valuable white base (cannot be created in PoE 2)');
    }
    
    if (bestMethod.method.type === 'rune') {
      reasons.push('Runes provide guaranteed weak modifiers with no RNG');
    } else if (bestMethod.method.type === 'essence') {
      reasons.push('Essences guarantee specific modifiers deterministically');
    } else if (bestMethod.method.type === 'tiered_currency') {
      reasons.push('Tiered currency ensures high-tier modifier rolls');
    } else if (bestMethod.method.type === 'omen') {
      reasons.push('Omens allow targeted modifier manipulation');
    }
    
    if (analysis.craftingStage === 'early') {
      reasons.push('Early stage crafting benefits from deterministic methods');
    } else if (analysis.craftingStage === 'late') {
      reasons.push('Late stage crafting requires precision targeting');
    }
    
    if (bestMethod.method.id.includes('chaos')) {
      reasons.push('Note: PoE 2 Chaos only swaps one modifier at a time');
    }
    
    if (analysis.missingCriticalMods.length > 0) {
      reasons.push(`Critical mods needed: ${analysis.missingCriticalMods.join(', ')}`);
    }
    
    return reasons.join('. ') + '.';
  }
  
  /**
   * Learn from crafting outcome
   */
  learnFromOutcome(
    method: CraftingMethod,
    input: CraftingMLInput,
    success: boolean,
    actualCost: number
  ) {
    // Create pattern from this craft
    const pattern: CraftingPattern = {
      sequence: [method.id, ...input.previousMethods || []],
      successRate: success ? 1 : 0,
      avgCost: actualCost,
      itemType: input.itemBase,
      modifiers: input.targetMods.map(m => m.modText)
    };
    
    // Add to successful crafts if successful
    if (success) {
      this.successfulCrafts.push(pattern);
    }
    
    // Update weights based on outcome
    this.updateWeights(method, success);
    
    // Store pattern for future reference
    this.addPattern(pattern);
  }
  
  /**
   * Update model weights based on outcomes
   */
  private updateWeights(method: CraftingMethod, success: boolean) {
    const learningRate = 0.1;
    const adjustment = success ? learningRate : -learningRate;
    
    // Update relevant weights
    if (method.type === 'rune') {
      const current = this.modelWeights.get('rune_reliability')!;
      this.modelWeights.set('rune_reliability', current + adjustment);
    } else if (method.type === 'essence') {
      const current = this.modelWeights.get('essence_guarantee')!;
      this.modelWeights.set('essence_guarantee', current + adjustment);
    } else if (method.id.includes('chaos')) {
      const current = this.modelWeights.get('chaos_penalty')!;
      this.modelWeights.set('chaos_penalty', Math.max(0.1, current - adjustment));
    }
  }
  
  /**
   * Generate natural language crafting advice
   */
  async generateCraftingAdvice(
    desiredItem: DesiredItem,
    currentBudget: number
  ): Promise<string> {
    const advice = [];
    
    // PoE 2 specific advice
    advice.push('🎯 Path of Exile 2 Crafting Strategy:\n');
    
    // Budget analysis
    if (currentBudget < 50) {
      advice.push('💰 Budget Strategy: Focus on Runes and basic Essences for guaranteed results.');
      advice.push('• Use Runes with Soul Cores for weak but guaranteed modifiers');
      advice.push('• Normal Essences are cheap and guarantee one modifier');
      advice.push('• Avoid Chaos Orbs - they only swap one mod in PoE 2\n');
    } else if (currentBudget < 200) {
      advice.push('💎 Mid-Range Strategy: Combine Essences with Greater currency.');
      advice.push('• Start with Greater Essence for guaranteed high-tier mod');
      advice.push('• Use Greater Chaos/Regal for better tier rolls');
      advice.push('• Consider Omens for targeted crafting\n');
    } else {
      advice.push('👑 Premium Strategy: Leverage Perfect currency and white bases.');
      advice.push('• White bases are extremely valuable - use Perfect Alchemy');
      advice.push('• Perfect Chaos guarantees T1 modifier swaps');
      advice.push('• Omen + Perfect Exalt for finishing touches\n');
    }
    
    // Item-specific advice
    const criticalMods = desiredItem.requiredMods.filter(m => m.weight && m.weight > 5);
    if (criticalMods.length > 0) {
      advice.push(`⚡ Critical Modifiers to Target:`);
      for (const mod of criticalMods) {
        advice.push(`  • ${mod.modText}`);
      }
      advice.push('');
    }
    
    // PoE 2 warnings
    advice.push('⚠️ PoE 2 Important Notes:');
    advice.push('• No Orb of Scouring - white items cannot be created');
    advice.push('• Chaos Orbs only swap ONE modifier (much slower)');
    advice.push('• Alchemy always creates exactly 4 modifiers');
    advice.push('• Use Tiered currency (Greater/Perfect) for high-tier mods');
    
    return advice.join('\n');
  }
  
  /**
   * Analyze crafting history for patterns
   */
  analyzeHistory(history: CraftingPattern[]): {
    mostSuccessful: string[];
    avgCost: number;
    commonFailures: string[];
    recommendations: string[];
  } {
    // Find most successful sequences
    const successfulSequences = history
      .filter(p => p.successRate > 0.7)
      .map(p => p.sequence.join(' → '));
    
    // Calculate average costs
    const avgCost = history.reduce((sum, p) => sum + p.avgCost, 0) / history.length;
    
    // Find common failures
    const failures = history
      .filter(p => p.successRate < 0.3)
      .map(p => p.sequence[0]);
    
    // Generate recommendations
    const recommendations = [];
    
    if (failures.includes('chaos_reroll_poe2')) {
      recommendations.push('Avoid basic Chaos Orbs - use Greater/Perfect instead');
    }
    
    if (successfulSequences.some(s => s.includes('essence'))) {
      recommendations.push('Essences show high success rate - prioritize them');
    }
    
    if (successfulSequences.some(s => s.includes('rune'))) {
      recommendations.push('Runes are reliable for base modifiers');
    }
    
    return {
      mostSuccessful: successfulSequences.slice(0, 3),
      avgCost,
      commonFailures: [...new Set(failures)].slice(0, 3),
      recommendations
    };
  }
}

export const poe2AIEngine = new PoE2AIEngine();