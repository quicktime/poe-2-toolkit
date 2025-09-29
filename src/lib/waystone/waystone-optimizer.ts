/**
 * Waystone Optimizer Service
 * Generates optimal strategies for waystone crafting based on goals
 */

import type {
  Waystone,
  WaystoneBase,
  WaystoneModifier,
  WaystoneCurrency,
  WaystoneOptimizationGoal,
  WaystoneOptimizationStrategy,
  WaystoneOptimizationStep,
  WaystoneAnalysis,
  WaystoneValue,
  WaystoneDanger,
  WaystoneRecommendation,
  WaystoneProfitability,
  CurrencyEffectType,
  WaystoneMarketData
} from '../../types/waystone';

import { WaystoneStat } from '../../types/waystone';

import {
  WAYSTONE_MODIFIERS,
  WAYSTONE_CURRENCY,
  WAYSTONE_PRESETS,
  DEFAULT_MARKET_DATA
} from '../data/waystone-data';

export class WaystoneOptimizer {
  private marketData: WaystoneMarketData;

  constructor(marketData?: WaystoneMarketData) {
    this.marketData = marketData || DEFAULT_MARKET_DATA;
  }

  /**
   * Generate optimization strategy for a specific goal
   */
  generateStrategy(
    goal: WaystoneOptimizationGoal,
    startingWaystone?: Waystone,
    budget?: number
  ): WaystoneOptimizationStrategy {
    const steps: WaystoneOptimizationStep[] = [];
    let totalCost = 0;
    let currentStep = 1;

    // Default starting waystone if not provided
    const waystone = startingWaystone || this.createBaseWaystone();

    // Step 1: Ensure waystone is at least magic quality
    if (waystone.base.rarity === 'normal') {
      const transmute = WAYSTONE_CURRENCY.find(c => c.id === 'transmutation')!;
      steps.push({
        order: currentStep++,
        action: 'Upgrade to Magic',
        currency: transmute,
        condition: 'If waystone is Normal rarity',
        expectedOutcome: 'Waystone becomes Magic with 1-2 random modifiers',
        cost: transmute.cost,
        probability: 1.0
      });
      totalCost += transmute.cost;
    }

    // Step 2: Upgrade to Rare for more modifiers
    if (waystone.base.rarity !== 'rare' && waystone.base.rarity !== 'corrupted') {
      const alchemy = WAYSTONE_CURRENCY.find(c => c.id === 'alchemy')!;
      const regal = WAYSTONE_CURRENCY.find(c => c.id === 'regal')!;

      if (waystone.base.rarity === 'magic') {
        // Use Regal if already magic
        steps.push({
          order: currentStep++,
          action: 'Upgrade to Rare',
          currency: regal,
          condition: 'If waystone is Magic rarity',
          expectedOutcome: 'Waystone becomes Rare with one additional modifier',
          cost: regal.cost,
          probability: 1.0
        });
        totalCost += regal.cost;
      } else {
        // Use Alchemy if normal
        steps.push({
          order: currentStep++,
          action: 'Upgrade to Rare',
          currency: alchemy,
          condition: 'If waystone is Normal rarity',
          expectedOutcome: 'Waystone becomes Rare with 4-6 random modifiers',
          cost: alchemy.cost,
          probability: 1.0
        });
        totalCost += alchemy.cost;
      }
    }

    // Step 3: Add quality for base improvements
    const chisel = WAYSTONE_CURRENCY.find(c => c.id === 'chisel')!;
    if (waystone.quality < 20) {
      const chiselsNeeded = Math.ceil((20 - waystone.quality) / 5);
      steps.push({
        order: currentStep++,
        action: `Apply ${chiselsNeeded} Cartographer's Chisels`,
        currency: chisel,
        condition: 'If quality is below 20%',
        expectedOutcome: 'Waystone reaches 20% quality (+20% quantity)',
        cost: chisel.cost * chiselsNeeded,
        probability: 1.0
      });
      totalCost += chisel.cost * chiselsNeeded;
    }

    // Step 4: Roll for desired modifiers based on goal
    const chaos = WAYSTONE_CURRENCY.find(c => c.id === 'chaos')!;
    const desiredMods = this.getDesiredModifiers(goal);

    steps.push({
      order: currentStep++,
      action: 'Roll for optimal modifiers',
      currency: chaos,
      condition: 'Until desired modifiers are achieved',
      expectedOutcome: `Waystone has: ${desiredMods.map(m => m.name).join(', ')}`,
      cost: chaos.cost * 10, // Average expected rolls
      probability: 0.3, // Chance of getting good mods
      alternatives: [
        {
          order: currentStep,
          action: 'Alternative: Use Harvest or Beast crafting',
          currency: chaos,
          condition: 'If available in stash',
          expectedOutcome: 'Targeted modifier crafting',
          cost: 5,
          probability: 0.5
        }
      ]
    });
    totalCost += chaos.cost * 10;

    // Step 5: Add additional modifiers if under max
    if (budget && totalCost < budget * 0.5) {
      const exalt = WAYSTONE_CURRENCY.find(c => c.id === 'exalted')!;
      steps.push({
        order: currentStep++,
        action: 'Add high-value modifier',
        currency: exalt,
        condition: 'If waystone has fewer than 6 modifiers and budget allows',
        expectedOutcome: 'Add one additional high-tier modifier',
        cost: exalt.cost,
        probability: 0.4
      });
      totalCost += exalt.cost;
    }

    // Step 6: Divine for perfect rolls
    if (goal.acceptableRisk === 'high' && budget && totalCost < budget * 0.7) {
      const divine = WAYSTONE_CURRENCY.find(c => c.id === 'divine')!;
      steps.push({
        order: currentStep++,
        action: 'Divine for perfect rolls',
        currency: divine,
        condition: 'If modifiers are good but rolls are low',
        expectedOutcome: 'Reroll all modifier values to higher tiers',
        cost: divine.cost * 3, // Average divines needed
        probability: 0.5
      });
      totalCost += divine.cost * 3;
    }

    // Step 7: Optional corruption for implicit
    if (goal.acceptableRisk === 'high') {
      const vaal = WAYSTONE_CURRENCY.find(c => c.id === 'vaal')!;
      steps.push({
        order: currentStep++,
        action: 'Corrupt for implicit modifier',
        currency: vaal,
        condition: 'OPTIONAL: Only if comfortable with risk',
        expectedOutcome: 'Add powerful implicit or brick item (25% chance)',
        cost: vaal.cost,
        probability: 0.25
      });
      totalCost += vaal.cost;
    }

    return {
      goal,
      steps,
      expectedCost: totalCost,
      expectedValue: this.calculateExpectedValue(waystone, goal),
      successProbability: this.calculateSuccessProbability(steps),
      alternativeStrategies: this.generateAlternativeStrategies(goal, budget)
    };
  }

  /**
   * Generate step-by-step strategy for maximum experience
   */
  generateMaxExperienceStrategy(): WaystoneOptimizationStrategy {
    const preset = WAYSTONE_PRESETS.find(p => p.id === 'max_experience')!;
    const strategy = this.generateStrategy(preset.goal, undefined, 10);

    // Add specific experience-focused steps
    const experienceSteps: WaystoneOptimizationStep[] = [
      {
        order: 0,
        action: '🎯 GOAL: Maximum Experience Gain',
        currency: WAYSTONE_CURRENCY[0],
        condition: 'Target modifiers for this strategy',
        expectedOutcome: `
• "Enlightening" suffix (+30-50% experience)
• "Populous" prefix (+20-40% pack size)
• "Multitudinous" prefix (3-6 additional packs)
• "Advanced" suffix (+1-3 monster level)
• Avoid: No Regen, Reflect, Twin Boss`,
        cost: 0,
        probability: 1
      },
      ...strategy.steps
    ];

    // Add execution tips
    experienceSteps.push({
      order: strategy.steps.length + 1,
      action: '💡 Execution Tips',
      currency: WAYSTONE_CURRENCY[0],
      condition: 'For maximum efficiency',
      expectedOutcome: `
• Run maps quickly, skip unnecessary loot
• Focus on blue/magic packs for best XP
• Use movement skills to maintain momentum
• Consider using Quicksilver flasks
• Target: 2-3 minute map clears`,
      cost: 0,
      probability: 1
    });

    return {
      ...strategy,
      steps: experienceSteps
    };
  }

  /**
   * Analyze a waystone and provide recommendations
   */
  analyzeWaystone(waystone: Waystone): WaystoneAnalysis {
    const value = this.calculateWaystoneValue(waystone);
    const dangers = this.identifyDangers(waystone);
    const recommendations = this.generateRecommendations(waystone, value);
    const profitability = this.calculateProfitability(waystone, value);

    return {
      waystone,
      value,
      dangers,
      recommendations,
      profitability
    };
  }

  /**
   * Calculate waystone value based on modifiers
   */
  private calculateWaystoneValue(waystone: Waystone): WaystoneValue {
    let experienceMultiplier = 1.0;
    let quantityMultiplier = 1.0 + (waystone.quality / 100);
    let rarityMultiplier = 1.0;
    let packSizeMultiplier = 1.0;

    // Process each modifier
    for (const modifier of waystone.modifiers) {
      for (const effect of modifier.effects) {
        switch (effect.stat) {
          case WaystoneStat.INCREASED_EXPERIENCE:
            experienceMultiplier += effect.value / 100;
            break;
          case WaystoneStat.INCREASED_QUANTITY:
            quantityMultiplier += effect.value / 100;
            break;
          case WaystoneStat.INCREASED_RARITY:
            rarityMultiplier += effect.value / 100;
            break;
          case WaystoneStat.INCREASED_PACK_SIZE:
            packSizeMultiplier += effect.value / 100;
            break;
          case WaystoneStat.MONSTER_LEVEL:
            experienceMultiplier += effect.value * 0.1; // 10% per level
            break;
        }
      }
    }

    // Calculate overall score
    const overallScore =
      (experienceMultiplier * 0.3) +
      (quantityMultiplier * 0.4) +
      (rarityMultiplier * 0.2) +
      (packSizeMultiplier * 0.1);

    // Calculate scores for each preset goal
    const scoreByGoal = new Map<string, number>();
    for (const preset of WAYSTONE_PRESETS) {
      scoreByGoal.set(preset.id, this.calculateGoalScore(waystone, preset.goal));
    }

    return {
      experienceMultiplier,
      quantityMultiplier,
      rarityMultiplier,
      packSizeMultiplier,
      overallScore,
      scoreByGoal
    };
  }

  /**
   * Calculate score for a specific goal
   */
  private calculateGoalScore(waystone: Waystone, goal: WaystoneOptimizationGoal): number {
    let score = 0;

    for (const priority of goal.priority) {
      const modValue = this.getModifierValue(waystone, priority.stat);
      score += modValue * priority.weight;
    }

    // Penalize for avoided modifiers
    for (const avoidStat of goal.avoid) {
      if (this.hasModifier(waystone, avoidStat)) {
        score *= 0.5; // Heavy penalty
      }
    }

    return score;
  }

  /**
   * Get total value of a specific stat on waystone
   */
  private getModifierValue(waystone: Waystone, stat: WaystoneStat): number {
    let total = 0;
    for (const modifier of waystone.modifiers) {
      for (const effect of modifier.effects) {
        if (effect.stat === stat) {
          total += effect.value;
        }
      }
    }
    return total;
  }

  /**
   * Check if waystone has a specific stat
   */
  private hasModifier(waystone: Waystone, stat: WaystoneStat): boolean {
    return this.getModifierValue(waystone, stat) > 0;
  }

  /**
   * Identify dangerous modifiers
   */
  private identifyDangers(waystone: Waystone): WaystoneDanger[] {
    const dangers: WaystoneDanger[] = [];

    // Check each modifier for danger
    for (const modifier of waystone.modifiers) {
      for (const effect of modifier.effects) {
        const danger = this.assessDanger(effect.stat, effect.value);
        if (danger) {
          dangers.push(danger);
        }
      }
    }

    return dangers;
  }

  /**
   * Assess danger level of a specific stat
   */
  private assessDanger(stat: WaystoneStat, value: number): WaystoneDanger | null {
    const dangerMap: Record<string, { level: 'low' | 'medium' | 'high' | 'extreme', desc: string, mitigation?: string }> = {
      [WaystoneStat.NO_REGENERATION]: {
        level: 'extreme',
        desc: 'No life, mana, or ES regeneration',
        mitigation: 'Bring instant recovery flasks, use leech or recoup'
      },
      [WaystoneStat.NO_LEECH]: {
        level: 'high',
        desc: 'Cannot leech life or mana',
        mitigation: 'Rely on regeneration or flask recovery'
      },
      [WaystoneStat.REFLECTED_DAMAGE]: {
        level: 'extreme',
        desc: `${value}% of damage reflected`,
        mitigation: 'Use reduced reflected damage taken mods or skip'
      },
      [WaystoneStat.TWIN_BOSS]: {
        level: 'high',
        desc: 'Two bosses spawn simultaneously',
        mitigation: 'High DPS or strong defenses required'
      },
      [WaystoneStat.REDUCED_RECOVERY]: {
        level: value > 40 ? 'high' : 'medium',
        desc: `${value}% reduced recovery rate`,
        mitigation: 'Increase recovery rate from other sources'
      },
      [WaystoneStat.CURSED_GROUND]: {
        level: 'medium',
        desc: 'Ground applies random curses',
        mitigation: 'Use curse immunity flask or reduced curse effect'
      },
      [WaystoneStat.MONSTER_DAMAGE]: {
        level: value > 35 ? 'high' : 'medium',
        desc: `Monsters deal ${value}% increased damage`,
        mitigation: 'Stack defensive layers and play carefully'
      },
      [WaystoneStat.BEYOND]: {
        level: 'medium',
        desc: 'Beyond demons spawn from slain monsters',
        mitigation: 'Kill monsters spread out to avoid spawns'
      }
    };

    const danger = dangerMap[stat];
    if (!danger) return null;

    return {
      modifier: stat,
      dangerLevel: danger.level,
      description: danger.desc,
      mitigation: danger.mitigation
    };
  }

  /**
   * Generate recommendations for improving waystone
   */
  private generateRecommendations(waystone: Waystone, value: WaystoneValue): WaystoneRecommendation[] {
    const recommendations: WaystoneRecommendation[] = [];

    // Recommend quality improvement
    if (waystone.quality < 20) {
      const chisel = WAYSTONE_CURRENCY.find(c => c.id === 'chisel')!;
      recommendations.push({
        action: 'Add quality',
        currency: chisel,
        expectedImprovement: (20 - waystone.quality) * 0.01, // 1% per quality
        cost: chisel.cost * Math.ceil((20 - waystone.quality) / 5),
        priority: 'high',
        reason: 'Quality directly increases item quantity'
      });
    }

    // Recommend rarity upgrade
    if (waystone.base.rarity === 'normal' || waystone.base.rarity === 'magic') {
      const alchemy = WAYSTONE_CURRENCY.find(c => c.id === 'alchemy')!;
      recommendations.push({
        action: 'Upgrade to Rare',
        currency: alchemy,
        expectedImprovement: 0.3,
        cost: alchemy.cost,
        priority: 'high',
        reason: 'Rare waystones can have more beneficial modifiers'
      });
    }

    // Recommend reroll if value is low
    if (value.overallScore < 1.5 && waystone.base.rarity === 'rare') {
      const chaos = WAYSTONE_CURRENCY.find(c => c.id === 'chaos')!;
      recommendations.push({
        action: 'Reroll with Chaos',
        currency: chaos,
        expectedImprovement: 0.5,
        cost: chaos.cost,
        priority: 'medium',
        reason: 'Current modifiers provide low value'
      });
    }

    // Recommend adding modifiers if not full
    if (waystone.modifiers.length < 6 && waystone.base.rarity === 'rare') {
      const exalt = WAYSTONE_CURRENCY.find(c => c.id === 'exalted')!;
      recommendations.push({
        action: 'Add modifier with Exalted',
        currency: exalt,
        expectedImprovement: 0.2,
        cost: exalt.cost,
        priority: 'low',
        reason: 'Waystone has room for additional modifiers'
      });
    }

    return recommendations;
  }

  /**
   * Calculate profitability of running waystone
   */
  private calculateProfitability(waystone: Waystone, value: WaystoneValue): WaystoneProfitability {
    const baseCost = this.marketData.waystoneBasePrices.get(waystone.base.tier) || 1;
    const investmentCost = baseCost + this.calculateInvestmentCost(waystone);

    // Expected returns based on multipliers
    const baseReturns = waystone.base.tier * 5; // Base value per tier
    const expectedReturns = baseReturns *
      value.quantityMultiplier *
      (1 + value.rarityMultiplier * 0.3) * // Rarity has less impact
      (1 + value.packSizeMultiplier * 0.5); // Pack size moderate impact

    const netProfit = expectedReturns - investmentCost;
    const profitMargin = (netProfit / investmentCost) * 100;
    const breakEvenRuns = investmentCost / (expectedReturns / 10); // Assume 10% chance of big drop

    return {
      expectedReturns,
      investmentCost,
      netProfit,
      profitMargin,
      breakEvenRuns: Math.ceil(breakEvenRuns)
    };
  }

  /**
   * Calculate total investment in waystone
   */
  private calculateInvestmentCost(waystone: Waystone): number {
    let cost = 0;

    // Quality cost
    cost += (waystone.quality / 5) * (this.marketData.currencyPrices.get('chisel') || 0.25);

    // Rarity cost estimate
    if (waystone.base.rarity === 'magic') {
      cost += this.marketData.currencyPrices.get('transmutation') || 0.1;
    } else if (waystone.base.rarity === 'rare') {
      cost += this.marketData.currencyPrices.get('alchemy') || 2;
      // Assume some chaos rolls
      cost += (this.marketData.currencyPrices.get('chaos') || 1) * 5;
    }

    return cost;
  }

  /**
   * Get desired modifiers for a goal
   */
  private getDesiredModifiers(goal: WaystoneOptimizationGoal): WaystoneModifier[] {
    const desired: WaystoneModifier[] = [];

    for (const priority of goal.priority.slice(0, 6)) { // Max 6 modifiers
      const modifier = WAYSTONE_MODIFIERS.find(m =>
        m.effects.some(e => e.stat === priority.stat)
      );
      if (modifier && !desired.includes(modifier)) {
        desired.push(modifier);
      }
    }

    return desired;
  }

  /**
   * Calculate expected value for a waystone with goal
   */
  private calculateExpectedValue(waystone: Waystone, goal: WaystoneOptimizationGoal): number {
    return this.calculateGoalScore(waystone, goal) * 10; // Scale up for display
  }

  /**
   * Calculate success probability of strategy
   */
  private calculateSuccessProbability(steps: WaystoneOptimizationStep[]): number {
    let probability = 1.0;
    for (const step of steps) {
      probability *= step.probability;
    }
    return probability;
  }

  /**
   * Generate alternative strategies
   */
  private generateAlternativeStrategies(
    goal: WaystoneOptimizationGoal,
    budget?: number
  ): WaystoneOptimizationStrategy[] {
    const alternatives: WaystoneOptimizationStrategy[] = [];

    // Budget strategy
    if (budget && budget > 5) {
      const budgetGoal = { ...goal, budgetLimit: 5 };
      alternatives.push(this.generateStrategy(budgetGoal));
    }

    // Safe strategy
    if (goal.acceptableRisk !== 'low') {
      const safeGoal = { ...goal, acceptableRisk: 'low' as const };
      alternatives.push(this.generateStrategy(safeGoal));
    }

    return alternatives;
  }

  /**
   * Create a base waystone for testing
   */
  private createBaseWaystone(): Waystone {
    return {
      base: {
        name: 'Waystone',
        tier: 5,
        itemLevel: 75,
        rarity: 'normal',
        baseDropRate: 1.0
      },
      modifiers: [],
      quality: 0,
      corrupted: false
    };
  }
}

// Export singleton instance
export const waystoneOptimizer = new WaystoneOptimizer();