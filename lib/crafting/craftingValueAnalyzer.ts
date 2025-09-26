/**
 * Crafting Value Analyzer
 * Determines if higher tier currencies are worth the cost
 */

import { simpleCraftingCalculator, CraftingRoute } from './simpleCraftingCalculator';
import { marketService } from '../market/marketService';

export interface TierAnalysis {
  tier: 'Perfect' | 'Greater' | 'Regular';
  craftCost: number;
  expectedItemValue: number;
  profitMargin: number;
  roi: number; // Return on Investment percentage
  breakEvenPrice: number;
  recommendation: string;
  reasoning: string[];
}

export interface CraftingValueAnalysis {
  item: string;
  targetMods: string[];
  tiers: TierAnalysis[];
  bestValue: TierAnalysis;
  marketComparison: {
    similarItemsPrice: number;
    perfectRollPrice: number;
    averageRollPrice: number;
  };
  finalRecommendation: string;
}

export class CraftingValueAnalyzer {
  /**
   * Analyze if different currency tiers are worth their cost
   */
  async analyzeCraftingValue(
    itemBase: string,
    targetMods: string[],
    league: string = 'Rise of the Abyssal'
  ): Promise<CraftingValueAnalysis> {
    // Define crafting routes for each tier
    const routes: CraftingRoute[] = [
      {
        method: 'Perfect Currency',
        materials: [
          { itemId: 'perfect-alchemy-orb', quantity: 1 },
          { itemId: 'perfect-chaos-orb', quantity: 8 },
          { itemId: 'perfect-exalted-orb', quantity: 2 }
        ],
        steps: [
          'Perfect Alchemy for 4 guaranteed T1-T2 mods',
          'Perfect Chaos to swap any bad mods (preserves tiers)',
          'Perfect Exalted to fill remaining slots with T1-T2'
        ]
      },
      {
        method: 'Greater Currency',
        materials: [
          { itemId: 'greater-alchemy-orb', quantity: 1 },
          { itemId: 'greater-chaos-orb', quantity: 15 },
          { itemId: 'greater-exalted-orb', quantity: 3 }
        ],
        steps: [
          'Greater Alchemy for better tier mods',
          'Greater Chaos to improve mods',
          'Greater Exalted to add higher tier mods'
        ]
      },
      {
        method: 'Regular Currency',
        materials: [
          { itemId: 'alchemy', quantity: 1 },
          { itemId: 'chaos', quantity: 25 },
          { itemId: 'exalted', quantity: 2 },
          { itemId: 'regal', quantity: 1 }
        ],
        steps: [
          'Alchemy for 4 random mods',
          'Chaos spam to get desired mods',
          'Exalted to fill',
          'Regal if needed'
        ]
      }
    ];

    // Calculate costs for each route
    const pricedRoutes = await Promise.all(
      routes.map(route => simpleCraftingCalculator.calculateCraftingCost(route, league))
    );

    // Get market prices for comparison
    const marketPrices = await this.getMarketPrices(itemBase, targetMods, league);

    // Analyze each tier
    const tiers: TierAnalysis[] = [];
    
    for (const route of pricedRoutes) {
      const tier = route.method.includes('Perfect') ? 'Perfect' :
                   route.method.includes('Greater') ? 'Greater' : 'Regular';
      
      const analysis = this.analyzeTier(
        tier,
        route.totalCost || 0,
        marketPrices
      );
      
      tiers.push(analysis);
    }

    // Find best value
    const bestValue = tiers.reduce((best, current) => 
      current.roi > best.roi ? current : best
    );

    return {
      item: itemBase,
      targetMods,
      tiers,
      bestValue,
      marketComparison: marketPrices,
      finalRecommendation: this.generateRecommendation(tiers, marketPrices)
    };
  }

  /**
   * Analyze a specific tier's value proposition
   */
  private analyzeTier(
    tier: 'Perfect' | 'Greater' | 'Regular',
    craftCost: number,
    marketPrices: any
  ): TierAnalysis {
    // Estimate item value based on tier
    let expectedItemValue: number;
    let successRate: number;
    let attempts: number;
    
    switch (tier) {
      case 'Perfect':
        // Perfect guarantees T1-T2, so item value is near perfect roll price
        expectedItemValue = marketPrices.perfectRollPrice * 0.9; // 90% of perfect
        successRate = 0.85; // High success rate
        attempts = 1.2; // Usually succeeds quickly
        break;
      
      case 'Greater':
        // Greater gives T2-T4, so item value is above average
        expectedItemValue = marketPrices.averageRollPrice * 1.5;
        successRate = 0.60;
        attempts = 2;
        break;
      
      case 'Regular':
        // Regular gives T3-T7, so item value is average
        expectedItemValue = marketPrices.averageRollPrice;
        successRate = 0.35;
        attempts = 4;
        break;
    }

    // Adjust craft cost for expected attempts
    const realCraftCost = craftCost * attempts;
    
    // Calculate profit and ROI
    const profitMargin = (expectedItemValue * successRate) - realCraftCost;
    const roi = ((profitMargin / realCraftCost) * 100);
    
    // Break-even price: what the item needs to sell for to cover costs
    const breakEvenPrice = realCraftCost / successRate;
    
    // Generate reasoning
    const reasoning = this.generateReasoning(
      tier,
      realCraftCost,
      expectedItemValue,
      successRate,
      marketPrices
    );
    
    // Generate recommendation
    let recommendation: string;
    if (roi > 50) {
      recommendation = `HIGHLY RECOMMENDED - Excellent ROI of ${roi.toFixed(0)}%`;
    } else if (roi > 20) {
      recommendation = `RECOMMENDED - Good ROI of ${roi.toFixed(0)}%`;
    } else if (roi > 0) {
      recommendation = `MARGINAL - Low ROI of ${roi.toFixed(0)}%`;
    } else {
      recommendation = `NOT RECOMMENDED - Negative ROI of ${roi.toFixed(0)}%`;
    }
    
    return {
      tier,
      craftCost: realCraftCost,
      expectedItemValue,
      profitMargin,
      roi,
      breakEvenPrice,
      recommendation,
      reasoning
    };
  }

  /**
   * Generate reasoning for tier analysis
   */
  private generateReasoning(
    tier: string,
    craftCost: number,
    expectedValue: number,
    successRate: number,
    marketPrices: any
  ): string[] {
    const reasoning: string[] = [];
    
    // Cost analysis
    if (craftCost > marketPrices.averageRollPrice) {
      reasoning.push(`⚠️ Craft cost (${craftCost.toFixed(0)} ex) exceeds average market price`);
    } else {
      reasoning.push(`✓ Craft cost (${craftCost.toFixed(0)} ex) below market average`);
    }
    
    // Success rate analysis
    if (successRate > 0.7) {
      reasoning.push(`✓ High success rate (${(successRate * 100).toFixed(0)}%)`);
    } else if (successRate > 0.4) {
      reasoning.push(`~ Moderate success rate (${(successRate * 100).toFixed(0)}%)`);
    } else {
      reasoning.push(`⚠️ Low success rate (${(successRate * 100).toFixed(0)}%)`);
    }
    
    // Tier-specific reasoning
    switch (tier) {
      case 'Perfect':
        reasoning.push('✓ Guarantees T1-T2 modifiers');
        reasoning.push('✓ Minimal RNG - predictable outcome');
        if (craftCost > marketPrices.perfectRollPrice * 0.7) {
          reasoning.push('⚠️ Consider buying instead - craft cost near market price');
        }
        break;
      
      case 'Greater':
        reasoning.push('~ Better tier mods than regular');
        reasoning.push('~ Good balance of cost vs quality');
        break;
      
      case 'Regular':
        reasoning.push('✓ Most affordable option');
        reasoning.push('⚠️ High RNG - unpredictable outcomes');
        reasoning.push('⚠️ May need many attempts for good rolls');
        break;
    }
    
    return reasoning;
  }

  /**
   * Get market prices for comparison
   */
  private async getMarketPrices(
    itemBase: string,
    targetMods: string[],
    league: string
  ): Promise<any> {
    // This would normally query the actual market
    // For now, return estimated values based on typical patterns
    
    // These multipliers are based on typical PoE 2 market patterns
    const basePrice = 50; // Base price for a decent item
    const modMultiplier = Math.pow(1.5, targetMods.length); // Each mod increases value
    
    return {
      similarItemsPrice: basePrice * modMultiplier,
      perfectRollPrice: basePrice * modMultiplier * 4, // Perfect rolls worth 4x
      averageRollPrice: basePrice * modMultiplier * 1.5 // Average rolls worth 1.5x
    };
  }

  /**
   * Generate final recommendation
   */
  private generateRecommendation(
    tiers: TierAnalysis[],
    marketPrices: any
  ): string {
    // Sort by ROI
    const sortedTiers = [...tiers].sort((a, b) => b.roi - a.roi);
    const best = sortedTiers[0];
    
    // Check if buying is better than crafting
    const bestCraftCost = Math.min(...tiers.map(t => t.craftCost));
    if (bestCraftCost > marketPrices.averageRollPrice * 0.8) {
      return `
🛒 RECOMMENDATION: BUY FROM MARKET

The cost to craft (${bestCraftCost.toFixed(0)} ex minimum) exceeds 80% of market price.
You can find similar items for ${marketPrices.averageRollPrice.toFixed(0)} ex.
Perfect rolls available for ${marketPrices.perfectRollPrice.toFixed(0)} ex.

Only craft if:
- You need very specific mod combinations
- You enjoy the crafting process
- Market has low supply
`;
    }
    
    // Check if best ROI is positive
    if (best.roi < 0) {
      return `
⚠️ RECOMMENDATION: AVOID CRAFTING

All crafting methods show negative ROI.
- Best option (${best.tier}) still loses ${Math.abs(best.profitMargin).toFixed(0)} ex
- Market price: ${marketPrices.averageRollPrice.toFixed(0)} ex
- Minimum craft cost: ${bestCraftCost.toFixed(0)} ex

Consider:
- Buying from market instead
- Waiting for currency prices to drop
- Farming the currencies yourself
`;
    }
    
    // Positive ROI - recommend based on budget
    if (best.tier === 'Perfect' && best.craftCost > 5000) {
      return `
💎 RECOMMENDATION: ${best.tier} TIER (HIGH BUDGET)

Best ROI: ${best.roi.toFixed(0)}%
Cost: ${best.craftCost.toFixed(0)} exalted
Expected Profit: ${best.profitMargin.toFixed(0)} exalted

⚠️ HIGH INVESTMENT REQUIRED
Only proceed if you have ${(best.craftCost * 1.5).toFixed(0)}+ exalted available.

Alternative: ${sortedTiers[1].tier} tier offers ${sortedTiers[1].roi.toFixed(0)}% ROI at ${sortedTiers[1].craftCost.toFixed(0)} ex.
`;
    }
    
    return `
✅ RECOMMENDATION: ${best.tier} TIER

Best ROI: ${best.roi.toFixed(0)}%
Cost: ${best.craftCost.toFixed(0)} exalted
Expected Profit: ${best.profitMargin.toFixed(0)} exalted
Break-even at: ${best.breakEvenPrice.toFixed(0)} exalted

Why ${best.tier}:
${best.reasoning.join('\n')}

Full Analysis:
${sortedTiers.map(t => `• ${t.tier}: ${t.roi.toFixed(0)}% ROI, ${t.craftCost.toFixed(0)} ex cost`).join('\n')}
`;
  }

  /**
   * Quick check: Is it worth using Perfect/Greater currencies?
   */
  async quickWorthCheck(
    regularCost: number,
    greaterCost: number,
    perfectCost: number,
    expectedImprovement: { greater: number; perfect: number }
  ): Promise<{
    greater: { worth: boolean; reason: string };
    perfect: { worth: boolean; reason: string };
  }> {
    // Calculate value per exalted spent
    const greaterValueRatio = expectedImprovement.greater / (greaterCost / regularCost);
    const perfectValueRatio = expectedImprovement.perfect / (perfectCost / regularCost);
    
    return {
      greater: {
        worth: greaterValueRatio > 1.2, // Need 20% better value to justify
        reason: greaterValueRatio > 1.2 
          ? `✓ Greater gives ${(greaterValueRatio * 100).toFixed(0)}% value per exalted`
          : `✗ Greater only gives ${(greaterValueRatio * 100).toFixed(0)}% value per exalted`
      },
      perfect: {
        worth: perfectValueRatio > 1.5, // Need 50% better value for perfect
        reason: perfectValueRatio > 1.5
          ? `✓ Perfect gives ${(perfectValueRatio * 100).toFixed(0)}% value per exalted`
          : `✗ Perfect only gives ${(perfectValueRatio * 100).toFixed(0)}% value per exalted`
      }
    };
  }
}

export const craftingValueAnalyzer = new CraftingValueAnalyzer();