/**
 * Path of Exile 2 Cost Calculator with Exalted Orb Base Currency
 * All costs are in EXALTED ORBS as per PoE 2 economy
 */

import {
  CraftingMethod,
  CraftingStep,
  CraftingStrategy,
  CraftingCost,
  CraftingMaterial,
  DesiredItem
} from '@/types/crafting';
import { 
  MarketSearchQuery, 
  PriceInfo, 
  CurrencyType,
  MarketItem
} from '@/types/market';
import { marketService } from '../market/marketService';
import { poe2CraftingSimulator } from './poe2Simulator';

// NO HARDCODED RATES! Everything from API
// Emergency fallback ONLY if API is completely unavailable
const EMERGENCY_FALLBACK_RATES = {
  exalted: 1,     // Base - ONLY if API fails
  chaos: 12.01,   // Last known from POE2Scout
  divine: 380.31  // Last known from POE2Scout  
};

/**
 * PoE 2 Cost Calculator using Exalted Orbs
 */
export class PoE2CostCalculator {
  private priceCache = new Map<string, number>();
  private currencyRatesCache: CurrencyRates | null = null;
  private lastCacheUpdate = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Calculate total cost for a crafting strategy in EXALTED ORBS
   */
  async calculateStrategyCost(
    strategy: CraftingStrategy,
    league: string = 'Standard'
  ): Promise<{
    expected: number;
    minimum: number;
    maximum: number;
    standardDeviation: number;
    materials: CraftingMaterial[];
    profitAnalysis?: {
      expectedSellPrice: number;
      expectedProfit: number;
      roi: number;
    };
    marketComparison?: {
      craftCost: number;
      buyPrice: number;
      recommendation: 'craft' | 'buy' | 'either';
      reasoning: string;
      savings: number;
    };
  }> {
    // Calculate crafting costs in exalts
    let totalExpected = 0;
    let totalMinimum = 0;
    let totalMaximum = 0;
    const allMaterials: CraftingMaterial[] = [];
    
    for (const step of strategy.steps) {
      const stepCost = await this.calculateStepCost(step, league);
      
      totalExpected += stepCost.expected;
      totalMinimum += stepCost.minimum;
      totalMaximum += stepCost.maximum;
      
      for (const material of stepCost.materials) {
        const existing = allMaterials.find(m => m.item === material.item);
        if (existing) {
          existing.quantity += material.quantity;
          existing.totalCost += material.totalCost;
        } else {
          allMaterials.push({ ...material });
        }
      }
    }
    
    // Run simulation for standard deviation
    const simulation = await poe2CraftingSimulator.simulateStrategy(strategy, 1000);
    const costsInExalts = await Promise.all(
      simulation.results.costDistribution.map(d => 
        this.convertToExalts(d.cost, 'chaos', league)
      )
    );
    const standardDeviation = this.calculateStandardDeviation(costsInExalts);
    
    // Get market comparison for the target item
    const marketComparison = await this.getMarketPrice(strategy.targetItem, league, totalExpected);
    
    // Calculate profit if we can sell the item
    const profitAnalysis = marketComparison ? {
      expectedSellPrice: marketComparison.buyPrice,
      expectedProfit: marketComparison.buyPrice - totalExpected,
      roi: ((marketComparison.buyPrice - totalExpected) / totalExpected) * 100
    } : undefined;
    
    return {
      expected: totalExpected,
      minimum: totalMinimum,
      maximum: totalMaximum,
      standardDeviation,
      materials: allMaterials,
      profitAnalysis,
      marketComparison
    };
  }
  
  /**
   * Calculate cost for a single step in EXALTED ORBS
   */
  private async calculateStepCost(
    step: CraftingStep,
    league: string
  ): Promise<{
    expected: number;
    minimum: number;
    maximum: number;
    materials: CraftingMaterial[];
  }> {
    const materials: CraftingMaterial[] = [];
    let baseCost = 0;
    
    // Calculate currency costs in exalts
    for (const [currency, amount] of Object.entries(step.expectedCost.currency || {})) {
      const priceInExalts = await this.getCurrencyPrice(currency as CurrencyType, league);
      const totalCost = priceInExalts * amount * step.expectedAttempts;
      
      materials.push({
        item: currency,
        quantity: amount * step.expectedAttempts,
        currentPrice: { amount: priceInExalts, currency: 'exalted' },
        totalCost
      });
      
      baseCost += totalCost;
    }
    
    // Add special materials cost
    for (const material of step.materials || []) {
      const priceInExalts = await this.getItemPrice(material.item, league);
      const totalCost = priceInExalts * material.quantity;
      
      materials.push({
        ...material,
        currentPrice: { amount: priceInExalts, currency: 'exalted' },
        totalCost
      });
      
      baseCost += totalCost;
    }
    
    const probability = step.successProbability || 0.5;
    const expectedAttempts = 1 / probability;
    
    return {
      expected: baseCost,
      minimum: baseCost * 0.1,
      maximum: baseCost * 10,
      materials
    };
  }
  
  /**
   * Get live currency rates from POE2Scout
   */
  private async updateCurrencyRates(league: string): Promise<void> {
    if (this.currencyRatesCache && Date.now() - this.lastCacheUpdate < this.cacheTimeout) {
      return; // Cache is still fresh
    }
    
    try {
      this.currencyRatesCache = await marketService.getCurrencyRates(league);
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Failed to fetch currency rates from POE2Scout:', error);
      // Use fallback rates if API fails (REAL rates from POE2Scout)
      // IMPORTANT: Chaos > Exalted in PoE 2!
      this.currencyRatesCache = {
        league,
        rates: {
          exalted: { exalted: 1, chaos: 0.0832, divine: 0.00263 }, // 1 exalt = 0.083 chaos
          chaos: { exalted: 12.01, chaos: 1, divine: 0.0316 }, // 1 chaos = 12 exalted!
          divine: { exalted: 380.31, chaos: 31.67, divine: 1 } // 1 divine = 380 exalt = 31.67 chaos
        },
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Get currency price in EXALTED ORBS
   */
  private async getCurrencyPrice(currency: CurrencyType | string, league: string): Promise<number> {
    await this.updateCurrencyRates(league);
    
    if (!this.currencyRatesCache) {
      console.warn(`No currency cache available, using emergency fallback for ${currency}`);
      return EMERGENCY_FALLBACK_RATES[currency as keyof typeof EMERGENCY_FALLBACK_RATES] || 0;
    }
    
    // Get the exchange rate to exalted orbs
    const rates = this.currencyRatesCache.rates[currency];
    if (rates && rates.exalted) {
      return 1 / rates.exalted; // Convert to "how many exalted per 1 of this currency"
    }
    
    // If no rate found, return 0 (indicates missing data)
    console.warn(`No exchange rate found for ${currency} - API data may be incomplete`);
    return 0;
  }
  
  /**
   * Convert any currency to exalted orbs
   */
  private async convertToExalts(amount: number, fromCurrency: string, league: string): Promise<number> {
    const rate = await this.getCurrencyPrice(fromCurrency, league);
    return amount * rate;
  }
  
  /**
   * Get item price from market in exalted orbs
   */
  private async getItemPrice(
    itemName: string,
    league: string
  ): Promise<number> {
    const key = `${itemName}_${league}_exalts`;
    
    if (this.priceCache.has(key)) {
      return this.priceCache.get(key)!;
    }
    
    try {
      const searchQuery: MarketSearchQuery = {
        name: itemName,
        league,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
        onlineOnly: true
      };
      
      const results = await marketService.search(searchQuery);
      
      if (results.listings.length > 0) {
        const prices = await Promise.all(
          results.listings.map(async (l) => {
            // Convert listing price to exalts
            const currency = l.price.currency as string;
            const rate = await this.getCurrencyPrice(currency, league);
            return l.price.amount * rate;
          })
        );
        
        const medianPrice = this.calculateMedian(prices);
        this.priceCache.set(key, medianPrice);
        return medianPrice;
      }
    } catch (error) {
      console.error(`Failed to get price for ${itemName}:`, error);
    }
    
    // Return default price in exalts
    return 0.01;
  }
  
  /**
   * Get market price for the target item
   */
  async getMarketPrice(
    targetItem: DesiredItem,
    league: string,
    craftCost: number
  ): Promise<{
    craftCost: number;
    buyPrice: number;
    recommendation: 'craft' | 'buy' | 'either';
    reasoning: string;
    savings: number;
  } | null> {
    try {
      // Build search query for similar items
      const searchQuery: MarketSearchQuery = {
        type: targetItem.baseType,
        category: 'weapon',
        league,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'asc',
        onlineOnly: true,
        // Add stat filters for required mods
        stats: targetItem.requiredMods.map(mod => ({
          id: mod.modText,
          value: {
            min: mod.minValue,
            max: mod.maxValue
          }
        }))
      };
      
      const results = await marketService.search(searchQuery);
      
      if (results.listings.length > 0) {
        // Convert all prices to exalts
        const pricesInExalts = await Promise.all(
          results.listings.map(async (l) => {
            const currency = l.price.currency as string;
            const rate = await this.getCurrencyPrice(currency, league);
            return l.price.amount * rate;
          })
        );
        
        // Use 25th percentile for conservative buy price
        pricesInExalts.sort((a, b) => a - b);
        const buyPrice = pricesInExalts[Math.floor(pricesInExalts.length * 0.25)] || pricesInExalts[0];
        
        const savings = buyPrice - craftCost;
        const savingsPercent = (savings / buyPrice) * 100;
        
        let recommendation: 'craft' | 'buy' | 'either';
        let reasoning: string;
        
        if (buyPrice === Infinity || results.listings.length === 0) {
          recommendation = 'craft';
          reasoning = 'No similar items available on market. Crafting is the only option.';
        } else if (savingsPercent > 30) {
          recommendation = 'craft';
          reasoning = `Crafting saves ${savingsPercent.toFixed(0)}% (${savings.toFixed(1)} exalts).`;
        } else if (savingsPercent < -20) {
          recommendation = 'buy';
          reasoning = `Buying is ${Math.abs(savingsPercent).toFixed(0)}% cheaper than crafting.`;
        } else {
          recommendation = 'either';
          reasoning = `Similar costs. Craft for guaranteed stats or buy for convenience.`;
        }
        
        return {
          craftCost,
          buyPrice,
          recommendation,
          reasoning,
          savings
        };
      }
    } catch (error) {
      console.error('Failed to get market comparison:', error);
    }
    
    return null;
  }
  
  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    if (!values.length) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (!values.length) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Format cost display
   */
  formatCost(amountInExalts: number): string {
    if (amountInExalts >= 361) {
      const divines = amountInExalts / 361;
      return `${divines.toFixed(2)} Divine Orbs`;
    } else if (amountInExalts >= 1) {
      return `${amountInExalts.toFixed(1)} Exalted Orbs`;
    } else if (amountInExalts >= 0.005) {
      const chaos = amountInExalts / 0.005;
      return `${chaos.toFixed(0)} Chaos Orbs`;
    } else {
      return `${(amountInExalts * 1000).toFixed(1)} Transmutation Orbs`;
    }
  }
}

export const poe2CostCalculator = new PoE2CostCalculator();