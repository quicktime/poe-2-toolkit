/**
 * Path of Exile 2 Crafting Orchestrator
 * Central coordination system for all crafting operations
 */

import {
  DesiredItem,
  CraftingStrategy,
  CraftingStep,
  CraftingSession,
  CraftingAttempt,
  ItemState,
  OptimizerConfig,
  CraftingRecommendation,
  RequiredModifier
} from '@/types/crafting';
import { MarketItem } from '@/types/market';
import { poe2CraftingKnowledge } from './poe2KnowledgeBase';
import { poe2CraftingSimulator } from './poe2Simulator';
import { poe2CraftingOptimizer } from './poe2Optimizer';
import { craftingCostCalculator } from './costCalculator';
import { marketService } from '../market/marketService';

/**
 * Path of Exile 2 Crafting Orchestrator
 */
export class PoE2CraftingOrchestrator {
  private activeSessions: Map<string, CraftingSession> = new Map();
  private strategyCach: Map<string, CraftingStrategy[]> = new Map();
  
  /**
   * Analyze crafting requirements and generate strategies
   */
  async analyzeCraftingRequirements(
    itemDescription: string,
    league: string = 'Standard'
  ): Promise<{
    parsedItem: DesiredItem;
    strategies: CraftingStrategy[];
    recommendations: CraftingRecommendation[];
    marketComparison: any;
  }> {
    // Parse the item description
    const parsedItem = this.parseItemDescription(itemDescription);
    
    // Generate multiple strategies
    const strategies = await this.generateStrategies(parsedItem, league);
    
    // Create recommendations with analysis
    const recommendations = await this.createRecommendations(strategies, parsedItem, league);
    
    // Compare with market prices
    const marketComparison = await this.compareWithMarket(parsedItem, strategies[0], league);
    
    return {
      parsedItem,
      strategies,
      recommendations,
      marketComparison
    };
  }
  
  /**
   * Parse natural language item description
   */
  private parseItemDescription(description: string): DesiredItem {
    const lines = description.split('\n').map(l => l.trim()).filter(l => l);
    
    // Extract base type (first line usually)
    const baseType = lines[0];
    
    // Extract modifiers
    const requiredMods: RequiredModifier[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Parse modifier text and values
      const valueMatch = line.match(/(\d+)(?:-(\d+))?%?\s+(.+)/);
      
      if (valueMatch) {
        const minValue = parseInt(valueMatch[1]);
        const maxValue = valueMatch[2] ? parseInt(valueMatch[2]) : minValue;
        const modText = valueMatch[3];
        
        requiredMods.push({
          modText,
          minValue,
          maxValue,
          weight: this.getModifierWeight(modText)
        });
      } else {
        // No numeric value, just text
        requiredMods.push({
          modText: line,
          weight: this.getModifierWeight(line)
        });
      }
    }
    
    // Determine item class from base type
    const itemClass = this.determineItemClass(baseType);
    
    return {
      baseType,
      itemClass,
      requiredMods,
      budgetLimit: 500, // Default
      riskTolerance: 'medium'
    };
  }
  
  /**
   * Get modifier importance weight
   */
  private getModifierWeight(modText: string): number {
    const criticalMods = ['damage', 'critical', 'attack skill', 'life'];
    const importantMods = ['resistance', 'speed', 'accuracy'];
    
    const lowerText = modText.toLowerCase();
    
    if (criticalMods.some(m => lowerText.includes(m))) return 10;
    if (importantMods.some(m => lowerText.includes(m))) return 5;
    return 1;
  }
  
  /**
   * Determine item class from base type
   */
  private determineItemClass(baseType: string): string {
    const weaponTypes = ['bow', 'sword', 'axe', 'mace', 'staff', 'wand', 'dagger', 'claw'];
    const armourTypes = ['helmet', 'body', 'gloves', 'boots', 'shield'];
    const accessoryTypes = ['ring', 'amulet', 'belt', 'quiver'];
    
    const lower = baseType.toLowerCase();
    
    if (weaponTypes.some(t => lower.includes(t))) return 'weapon';
    if (armourTypes.some(t => lower.includes(t))) return 'armour';
    if (accessoryTypes.some(t => lower.includes(t))) return 'accessory';
    
    return 'weapon'; // Default
  }
  
  /**
   * Generate multiple crafting strategies
   */
  private async generateStrategies(
    desiredItem: DesiredItem,
    league: string
  ): Promise<CraftingStrategy[]> {
    const cacheKey = JSON.stringify({ desiredItem, league });
    
    // Check cache
    if (this.strategyCach.has(cacheKey)) {
      return this.strategyCach.get(cacheKey)!;
    }
    
    // Generate strategies for different optimization goals
    const configs: OptimizerConfig[] = [
      {
        riskTolerance: 'low',
        optimizeFor: 'success_rate',
        preferDeterministic: true
      },
      {
        riskTolerance: 'medium',
        optimizeFor: 'cost'
      },
      {
        riskTolerance: 'high',
        optimizeFor: 'profit'
      }
    ];
    
    const allStrategies: CraftingStrategy[] = [];
    
    for (const config of configs) {
      const strategies = await poe2CraftingOptimizer.optimizeStrategy(desiredItem, config);
      
      // Add cost analysis to each strategy
      for (const strategy of strategies) {
        const costAnalysis = await craftingCostCalculator.calculateStrategyCost(strategy, league);
        strategy.totalCost = costAnalysis;
        strategy.profitMargin = costAnalysis.profitAnalysis;
      }
      
      allStrategies.push(...strategies);
    }
    
    // Cache results
    this.strategyCach.set(cacheKey, allStrategies);
    
    return allStrategies;
  }
  
  /**
   * Create recommendations with AI analysis
   */
  private async createRecommendations(
    strategies: CraftingStrategy[],
    desiredItem: DesiredItem,
    league: string
  ): Promise<CraftingRecommendation[]> {
    const recommendations: CraftingRecommendation[] = [];
    
    for (const strategy of strategies.slice(0, 3)) {
      // Run simulation for accuracy
      const simulation = await poe2CraftingSimulator.simulateStrategy(strategy, 1000);
      
      // Analyze market conditions
      const marketAnalysis = await this.analyzeMarketConditions(strategy, league);
      
      // Create recommendation
      const recommendation: CraftingRecommendation = {
        strategy,
        confidence: this.calculateConfidence(strategy, simulation),
        explanation: this.generateExplanation(strategy),
        prosAndCons: this.analyzeProsAndCons(strategy),
        marketAnalysis,
        riskAssessment: this.assessRisk(strategy, simulation)
      };
      
      recommendations.push(recommendation);
    }
    
    return recommendations;
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(strategy: CraftingStrategy, simulation: any): number {
    let confidence = 0;
    
    // Success rate contributes 40%
    confidence += (simulation.results.successes / simulation.simulations) * 40;
    
    // Cost predictability contributes 30%
    const costVariance = simulation.results.percentiles.p90 / simulation.results.percentiles.p10;
    confidence += Math.max(0, 30 - costVariance * 5);
    
    // Method determinism contributes 30%
    const deterministicSteps = strategy.steps.filter(s => 
      s.method.type === 'rune' || s.method.type === 'essence'
    ).length;
    confidence += (deterministicSteps / strategy.steps.length) * 30;
    
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * Generate explanation for strategy
   */
  private generateExplanation(strategy: CraftingStrategy): string {
    const keyFeatures = [];
    
    // Check for PoE 2 specific features
    if (strategy.steps.some(s => s.method.type === 'rune')) {
      keyFeatures.push('Uses Runes for guaranteed weak modifiers');
    }
    
    if (strategy.steps.some(s => s.method.type === 'essence')) {
      keyFeatures.push('Leverages Essences for deterministic crafting');
    }
    
    if (strategy.steps.some(s => s.method.id.includes('perfect') || s.method.id.includes('greater'))) {
      keyFeatures.push('Utilizes tiered currency for high-tier modifiers');
    }
    
    if (strategy.steps.some(s => s.method.type === 'omen')) {
      keyFeatures.push('Employs Omens for targeted modifier manipulation');
    }
    
    if (strategy.steps.some(s => s.method.id.includes('chaos'))) {
      keyFeatures.push('Uses PoE 2 Chaos Orbs for single-mod swapping');
    }
    
    const explanation = `This ${strategy.name} strategy ${keyFeatures.join(', ')}. `;
    
    // Add cost/benefit analysis
    if (strategy.totalCost.expected < 100) {
      return explanation + 'Budget-friendly approach suitable for league start.';
    } else if (strategy.totalCost.expected < 500) {
      return explanation + 'Moderate investment with balanced risk/reward.';
    } else {
      return explanation + 'Premium strategy for high-value crafting projects.';
    }
  }
  
  /**
   * Analyze pros and cons
   */
  private analyzeProsAndCons(strategy: CraftingStrategy): {
    pros: string[];
    cons: string[];
  } {
    const pros: string[] = [];
    const cons: string[] = [];
    
    // Analyze strategy characteristics
    if (strategy.successProbability > 0.7) {
      pros.push('High success rate');
    } else if (strategy.successProbability < 0.3) {
      cons.push('Low success probability');
    }
    
    if (strategy.totalCost.expected < 100) {
      pros.push('Low cost investment');
    } else if (strategy.totalCost.expected > 500) {
      cons.push('High initial investment required');
    }
    
    // PoE 2 specific pros/cons
    if (strategy.steps.some(s => s.method.type === 'rune' || s.method.type === 'essence')) {
      pros.push('Deterministic modifiers guaranteed');
    }
    
    if (strategy.steps.some(s => s.method.id.includes('chaos'))) {
      cons.push('PoE 2 Chaos Orbs only swap one mod (slower than PoE 1)');
    }
    
    if (strategy.steps.some(s => s.description.includes('white'))) {
      cons.push('Requires valuable white base item (cannot be created in PoE 2)');
    }
    
    if (strategy.steps.some(s => s.method.id.includes('perfect'))) {
      pros.push('Guarantees highest tier modifiers');
      cons.push('Perfect currency is expensive');
    }
    
    if (strategy.steps.length < 5) {
      pros.push('Simple and straightforward process');
    } else if (strategy.steps.length > 10) {
      cons.push('Complex multi-step process');
    }
    
    return { pros, cons };
  }
  
  /**
   * Analyze market conditions
   */
  private async analyzeMarketConditions(
    strategy: CraftingStrategy,
    league: string
  ): Promise<any> {
    // Check material availability
    const materials = strategy.steps.flatMap(s => s.materials || []);
    
    let totalAvailability = 0;
    let scarceMaterials = [];
    
    for (const material of materials) {
      if (material.marketAvailability) {
        totalAvailability += material.marketAvailability;
        if (material.marketAvailability < 10) {
          scarceMaterials.push(material.item);
        }
      }
    }
    
    const avgAvailability = materials.length > 0 ? totalAvailability / materials.length : 100;
    
    return {
      materialAvailability: avgAvailability > 50 ? 'abundant' : avgAvailability > 20 ? 'moderate' : 'scarce',
      priceVolatility: 'moderate', // Would need historical data
      profitPotential: strategy.profitMargin?.roi && strategy.profitMargin.roi > 50 ? 'high' :
                      strategy.profitMargin?.roi && strategy.profitMargin.roi > 0 ? 'moderate' : 'low'
    };
  }
  
  /**
   * Assess risk factors
   */
  private assessRisk(strategy: CraftingStrategy, simulation: any): any {
    const riskFactors: string[] = [];
    
    // Cost variance risk
    const costVariance = simulation.results.percentiles.p90 / simulation.results.percentiles.p10;
    if (costVariance > 5) {
      riskFactors.push('High cost variance - could be much more expensive than expected');
    }
    
    // Success rate risk
    if (strategy.successProbability < 0.3) {
      riskFactors.push('Low success rate - may require many attempts');
    }
    
    // PoE 2 specific risks
    if (strategy.steps.some(s => s.description.includes('white'))) {
      riskFactors.push('Requires white base (cannot recover if failed in PoE 2)');
    }
    
    if (strategy.steps.some(s => s.method.id.includes('chaos'))) {
      riskFactors.push('Chaos crafting is slow in PoE 2 (one mod at a time)');
    }
    
    // Mitigation strategies
    const mitigation: string[] = [];
    
    if (costVariance > 5) {
      mitigation.push('Set a maximum budget and stop if exceeded');
    }
    
    if (strategy.successProbability < 0.3) {
      mitigation.push('Consider buying the item instead if available');
    }
    
    if (riskFactors.some(r => r.includes('white'))) {
      mitigation.push('Practice on non-white items first');
      mitigation.push('Consider saving white bases for guaranteed crafts');
    }
    
    return {
      level: riskFactors.length > 2 ? 'high' : riskFactors.length > 0 ? 'medium' : 'low',
      factors: riskFactors,
      mitigation
    };
  }
  
  /**
   * Compare crafting vs buying
   */
  private async compareWithMarket(
    desiredItem: DesiredItem,
    strategy: CraftingStrategy,
    league: string
  ): Promise<any> {
    return await craftingCostCalculator.compareCraftVsBuy(desiredItem, strategy, league);
  }
  
  /**
   * Start a new crafting session
   */
  startCraftingSession(
    targetItem: DesiredItem,
    strategy: CraftingStrategy
  ): CraftingSession {
    const session: CraftingSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      targetItem,
      strategy,
      currentStep: 0,
      attempts: [],
      totalSpent: {},
      status: 'in_progress'
    };
    
    this.activeSessions.set(session.id, session);
    return session;
  }
  
  /**
   * Record crafting attempt
   */
  recordAttempt(
    sessionId: string,
    attempt: CraftingAttempt
  ): CraftingSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    session.attempts.push(attempt);
    
    // Update total spent
    for (const [currency, amount] of Object.entries(attempt.materials)) {
      session.totalSpent[currency] = (session.totalSpent[currency] || 0) + amount;
    }
    
    // Check if completed
    if (this.checkCompletion(attempt.itemState, session.targetItem)) {
      session.status = 'completed';
      session.result = this.convertToMarketItem(attempt.itemState);
    }
    
    return session;
  }
  
  /**
   * Check if item meets requirements
   */
  private checkCompletion(itemState: ItemState, targetItem: DesiredItem): boolean {
    const allMods = [...itemState.prefixes, ...itemState.suffixes];
    
    for (const required of targetItem.requiredMods) {
      const hasMod = allMods.some(mod => 
        mod.text.toLowerCase().includes(required.modText.toLowerCase())
      );
      
      if (!hasMod) return false;
    }
    
    return true;
  }
  
  /**
   * Convert item state to market item
   */
  private convertToMarketItem(itemState: ItemState): MarketItem {
    return {
      name: 'Crafted Item',
      baseType: 'Custom',
      category: 'weapon',
      rarity: 'rare',
      itemLevel: 85,
      identified: true,
      corrupted: itemState.corrupted,
      explicitMods: [
        ...itemState.prefixes.map(m => m.text),
        ...itemState.suffixes.map(m => m.text)
      ],
      implicitMods: itemState.implicit ? [itemState.implicit.text] : [],
      icon: ''
    };
  }
  
  /**
   * Generate step-by-step instructions
   */
  generateInstructions(strategy: CraftingStrategy): string[] {
    const instructions: string[] = [];
    
    instructions.push(`📋 ${strategy.name}`);
    instructions.push(`💰 Expected Cost: ${strategy.totalCost.expected.toFixed(0)} chaos`);
    instructions.push(`✅ Success Rate: ${(strategy.successProbability * 100).toFixed(1)}%`);
    instructions.push('');
    instructions.push('Step-by-Step Instructions:');
    instructions.push('');
    
    for (const step of strategy.steps) {
      instructions.push(`Step ${step.stepNumber}: ${step.description}`);
      
      // Add PoE 2 specific warnings
      if (step.method.id.includes('chaos')) {
        instructions.push('  ⚠️ PoE 2 Note: Chaos Orb only swaps ONE modifier');
      }
      
      if (step.method.id.includes('white') || step.method.id.includes('normal')) {
        instructions.push('  ⚠️ PoE 2 Note: White items cannot be created (no Scouring)');
      }
      
      if (step.method.id.includes('perfect') || step.method.id.includes('greater')) {
        instructions.push('  💎 Uses tiered currency for guaranteed high-tier mods');
      }
      
      if (step.tips && step.tips.length > 0) {
        for (const tip of step.tips) {
          instructions.push(`  💡 ${tip}`);
        }
      }
      
      instructions.push('');
    }
    
    return instructions;
  }
}

export const poe2CraftingOrchestrator = new PoE2CraftingOrchestrator();