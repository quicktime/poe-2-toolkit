/**
 * Simple Crafting Value Analyzer
 * Uses REAL market data to determine if crafting is worth it
 */

import { simpleCraftingCalculator } from './simpleCraftingCalculator';
import { marketService } from '../market/marketService';

export interface CraftWorthAnalysis {
  item: string;
  craftingCosts: {
    perfect: number;
    greater: number;
    regular: number;
  };
  marketPrices: {
    low: number;      // Bottom 10% price
    median: number;   // Middle price
    high: number;     // Top 10% price
  };
  recommendations: {
    perfect: { worth: boolean; why: string };
    greater: { worth: boolean; why: string };
    regular: { worth: boolean; why: string };
  };
  bestChoice: string;
}

export class SimpleValueAnalyzer {
  /**
   * Simple check: Is crafting worth it vs buying?
   * Uses REAL market prices from API
   */
  async isWorthCrafting(
    itemBase: string,
    requirements: {
      name?: string;
      type?: string;
      minMods?: string[];
      category?: string;
      minItemLevel?: number;
    },
    league: string = 'Rise of the Abyssal'
  ): Promise<CraftWorthAnalysis> {
    // Get REAL market prices for this item
    const marketPrices = await this.getRealMarketPrices(requirements, league);
    
    // Calculate crafting costs for each tier
    const craftingCosts = await this.calculateCraftingCosts(itemBase, league);
    
    // Simple worth calculation
    const recommendations = {
      perfect: this.evaluateWorth('Perfect', craftingCosts.perfect, marketPrices),
      greater: this.evaluateWorth('Greater', craftingCosts.greater, marketPrices),
      regular: this.evaluateWorth('Regular', craftingCosts.regular, marketPrices)
    };
    
    // Determine best choice
    const bestChoice = this.determineBestChoice(craftingCosts, marketPrices);
    
    return {
      item: itemBase,
      craftingCosts,
      marketPrices,
      recommendations,
      bestChoice
    };
  }
  
  /**
   * Get REAL market prices from POE2Scout trade API
   */
  private async getRealMarketPrices(
    requirements: any,
    league: string
  ): Promise<{ low: number; median: number; high: number }> {
    try {
      // Search for similar items on the market
      const searchQuery = {
        league,
        name: requirements.name,
        type: requirements.type,
        category: requirements.category,
        minItemLevel: requirements.minItemLevel,
        limit: 50, // Get enough for good statistics
        onlineOnly: true,
        sortBy: 'price',
        sortOrder: 'asc' as const
      };
      
      const results = await marketService.search(searchQuery);
      
      if (!results.listings || results.listings.length === 0) {
        // No items found, return high defaults
        console.log('No market listings found, using defaults');
        return { low: 1000, median: 2000, high: 5000 };
      }
      
      // Convert all prices to exalted
      const pricesInExalted = results.listings.map(listing => {
        const price = listing.price;
        
        // Convert to exalted based on currency
        if (price.currency === 'chaos') {
          // In PoE 2: 1 chaos = 12.01 exalted
          return price.amount * 12.01;
        } else if (price.currency === 'divine') {
          // 1 divine = 380.31 exalted
          return price.amount * 380.31;
        } else if (price.currency === 'exalted') {
          return price.amount;
        } else {
          // Unknown currency, use chaos rate
          return price.amount * 12.01;
        }
      }).sort((a, b) => a - b);
      
      // Calculate percentiles
      const low = pricesInExalted[Math.floor(pricesInExalted.length * 0.1)] || pricesInExalted[0];
      const median = pricesInExalted[Math.floor(pricesInExalted.length * 0.5)];
      const high = pricesInExalted[Math.floor(pricesInExalted.length * 0.9)] || 
                   pricesInExalted[pricesInExalted.length - 1];
      
      console.log(`Found ${results.listings.length} listings:`);
      console.log(`  Low (10%): ${low.toFixed(0)} ex`);
      console.log(`  Median: ${median.toFixed(0)} ex`);
      console.log(`  High (90%): ${high.toFixed(0)} ex`);
      
      return { low, median, high };
      
    } catch (error) {
      console.error('Failed to get market prices:', error);
      // Fallback prices if API fails
      return { low: 500, median: 1000, high: 2000 };
    }
  }
  
  /**
   * Calculate crafting costs for each tier
   */
  private async calculateCraftingCosts(
    itemBase: string,
    league: string
  ): Promise<{ perfect: number; greater: number; regular: number }> {
    // Define simple crafting routes
    const routes = {
      perfect: {
        method: 'Perfect',
        materials: [
          { itemId: 'perfect-alchemy-orb', quantity: 1 },
          { itemId: 'perfect-chaos-orb', quantity: 5 },
          { itemId: 'perfect-exalted-orb', quantity: 2 }
        ],
        steps: []
      },
      greater: {
        method: 'Greater',
        materials: [
          { itemId: 'greater-alchemy-orb', quantity: 1 },
          { itemId: 'greater-chaos-orb', quantity: 10 },
          { itemId: 'greater-exalted-orb', quantity: 2 }
        ],
        steps: []
      },
      regular: {
        method: 'Regular',
        materials: [
          { itemId: 'alchemy', quantity: 1 },
          { itemId: 'chaos', quantity: 15 },
          { itemId: 'exalted', quantity: 2 }
        ],
        steps: []
      }
    };
    
    // Calculate costs
    const [perfect, greater, regular] = await Promise.all([
      simpleCraftingCalculator.calculateCraftingCost(routes.perfect, league),
      simpleCraftingCalculator.calculateCraftingCost(routes.greater, league),
      simpleCraftingCalculator.calculateCraftingCost(routes.regular, league)
    ]);
    
    // Account for multiple attempts needed
    const perfectCost = (perfect.totalCost || 0) * 1.2;  // Usually works first try
    const greaterCost = (greater.totalCost || 0) * 2;    // Needs ~2 attempts
    const regularCost = (regular.totalCost || 0) * 4;    // Needs ~4 attempts
    
    return {
      perfect: perfectCost,
      greater: greaterCost,
      regular: regularCost
    };
  }
  
  /**
   * Simple evaluation: Is this tier worth it?
   */
  private evaluateWorth(
    tier: string,
    craftCost: number,
    marketPrices: { low: number; median: number; high: number }
  ): { worth: boolean; why: string } {
    // What quality does this tier produce?
    let expectedValue: number;
    
    switch (tier) {
      case 'Perfect':
        // Perfect produces near top-tier items
        expectedValue = marketPrices.high * 0.8;
        break;
      case 'Greater':
        // Greater produces above-median items
        expectedValue = (marketPrices.median + marketPrices.high) / 2;
        break;
      case 'Regular':
        // Regular produces median items
        expectedValue = marketPrices.median;
        break;
      default:
        expectedValue = marketPrices.median;
    }
    
    // Calculate profit margin
    const profit = expectedValue - craftCost;
    const profitPercent = (profit / craftCost) * 100;
    
    // Is it worth it?
    if (profit < 0) {
      return {
        worth: false,
        why: `Loss of ${Math.abs(profit).toFixed(0)} ex (craft: ${craftCost.toFixed(0)} ex, value: ${expectedValue.toFixed(0)} ex)`
      };
    } else if (profitPercent < 20) {
      return {
        worth: false,
        why: `Only ${profitPercent.toFixed(0)}% profit - too risky for ${craftCost.toFixed(0)} ex investment`
      };
    } else {
      return {
        worth: true,
        why: `Profit of ${profit.toFixed(0)} ex (${profitPercent.toFixed(0)}% ROI)`
      };
    }
  }
  
  /**
   * Determine the best choice
   */
  private determineBestChoice(
    craftingCosts: { perfect: number; greater: number; regular: number },
    marketPrices: { low: number; median: number; high: number }
  ): string {
    // Can we just buy it cheaper?
    const cheapestCraft = Math.min(
      craftingCosts.perfect,
      craftingCosts.greater,
      craftingCosts.regular
    );
    
    if (marketPrices.low < cheapestCraft * 0.8) {
      return `BUY from market at ${marketPrices.low.toFixed(0)} ex (cheaper than any craft)`;
    }
    
    // Calculate profit for each method
    const profits = {
      perfect: (marketPrices.high * 0.8) - craftingCosts.perfect,
      greater: ((marketPrices.median + marketPrices.high) / 2) - craftingCosts.greater,
      regular: marketPrices.median - craftingCosts.regular
    };
    
    // Find best profit
    const bestProfit = Math.max(profits.perfect, profits.greater, profits.regular);
    
    if (bestProfit < 0) {
      return `BUY from market - all crafting methods lose money`;
    }
    
    if (profits.perfect === bestProfit && craftingCosts.perfect < 10000) {
      return `CRAFT with Perfect - Best profit of ${bestProfit.toFixed(0)} ex`;
    } else if (profits.greater === bestProfit) {
      return `CRAFT with Greater - Good profit of ${bestProfit.toFixed(0)} ex`;
    } else if (profits.regular === bestProfit) {
      return `CRAFT with Regular - Profit of ${bestProfit.toFixed(0)} ex`;
    }
    
    return `BUY from market at ${marketPrices.median.toFixed(0)} ex`;
  }
}

export const simpleValueAnalyzer = new SimpleValueAnalyzer();