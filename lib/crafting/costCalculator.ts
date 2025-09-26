/**
 * Crafting Cost Calculator with Market Integration
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
import { craftingSimulator } from './simulator';

/**
 * Calculate crafting costs with real market data
 */
export class CraftingCostCalculator {
  private currencyCache = new Map<string, number>();
  private itemPriceCache = new Map<string, number>();
  private lastCacheUpdate = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Calculate total cost for a crafting strategy
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
  }> {
    // Update currency prices if cache is stale
    await this.updateCurrencyPrices(league);
    
    // Calculate cost for each step
    let totalExpected = 0;
    let totalMinimum = 0;
    let totalMaximum = 0;
    const allMaterials: CraftingMaterial[] = [];
    
    for (const step of strategy.steps) {
      const stepCost = await this.calculateStepCost(step, league);
      
      totalExpected += stepCost.expected;
      totalMinimum += stepCost.minimum;
      totalMaximum += stepCost.maximum;
      
      // Aggregate materials
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
    
    // Calculate standard deviation using simulation data
    const simulation = await craftingSimulator.simulateStrategy(strategy, 1000);
    const standardDeviation = this.calculateStandardDeviation(
      simulation.results.costDistribution.map(d => d.cost)
    );
    
    // Get expected sell price for profit analysis
    const profitAnalysis = await this.calculateProfitAnalysis(
      strategy.targetItem,
      totalExpected,
      league
    );
    
    return {
      expected: totalExpected,
      minimum: totalMinimum,
      maximum: totalMaximum,
      standardDeviation,
      materials: allMaterials,
      profitAnalysis
    };
  }
  
  /**
   * Calculate cost for a single crafting step
   */
  async calculateStepCost(
    step: CraftingStep,
    league: string
  ): Promise<{
    expected: number;
    minimum: number;
    maximum: number;
    materials: CraftingMaterial[];
  }> {
    const materials: CraftingMaterial[] = [];
    let baseCosr = 0;
    
    // Calculate currency costs
    for (const [currency, amount] of Object.entries(step.expectedCost.currency || {})) {
      const price = await this.getCurrencyPrice(currency as CurrencyType, league);
      const totalCost = price * amount * step.expectedAttempts;
      
      materials.push({
        item: currency,
        quantity: amount * step.expectedAttempts,
        currentPrice: { amount: price, currency: 'chaos' },
        totalCost,
        marketAvailability: await this.getCurrencyAvailability(currency, league)
      });
      
      baseCost += totalCost;
    }
    
    // Add special materials (essences, fossils, etc.)
    for (const material of step.materials || []) {
      const price = await this.getItemPrice(material.item, league);
      const totalCost = price * material.quantity;
      
      materials.push({
        ...material,
        currentPrice: { amount: price, currency: 'chaos' },
        totalCost,
        marketAvailability: await this.getItemAvailability(material.item, league)
      });
      
      baseCost += totalCost;
    }
    
    // Calculate ranges based on success probability
    const probability = step.successProbability || 0.5;
    const expectedAttempts = 1 / probability;
    
    return {
      expected: baseCost,
      minimum: baseCost * 0.1, // Lucky scenario
      maximum: baseCost * 10,  // Unlucky scenario
      materials
    };
  }
  
  /**
   * Update currency prices from market
   */
  private async updateCurrencyPrices(league: string): Promise<void> {
    if (Date.now() - this.lastCacheUpdate < this.cacheTimeout) {
      return; // Cache is still fresh
    }
    
    try {
      const rates = await marketService.getCurrencyRates(league);
      
      // Store chaos equivalents for all currencies
      for (const [currency, targets] of Object.entries(rates.rates)) {
        const chaosRate = targets['chaos'] || 1;
        this.currencyCache.set(`${currency}_${league}`, chaosRate);
      }
      
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Failed to update currency prices:', error);
      // Use default values if market is unavailable
      this.setDefaultCurrencyPrices();
    }
  }
  
  /**
   * Set default currency prices as fallback
   */
  private setDefaultCurrencyPrices(): void {
    const defaults: Record<string, number> = {
      chaos: 1,
      divine: 200,
      exalted: 100,
      annulment: 20,
      ancient: 30,
      regal: 1,
      alchemy: 0.5,
      alteration: 0.1,
      augmentation: 0.05,
      transmutation: 0.03,
      scouring: 2,
      vaal: 1,
      blessed: 1,
      jeweller: 0.1,
      fusing: 0.5,
      chromatic: 0.1
    };
    
    for (const [currency, value] of Object.entries(defaults)) {
      this.currencyCache.set(`${currency}_Standard`, value);
    }
  }
  
  /**
   * Get currency price in chaos
   */
  private async getCurrencyPrice(
    currency: CurrencyType,
    league: string
  ): Promise<number> {
    const key = `${currency}_${league}`;
    
    if (!this.currencyCache.has(key)) {
      await this.updateCurrencyPrices(league);
    }
    
    return this.currencyCache.get(key) || 1;
  }
  
  /**
   * Get item price from market
   */
  private async getItemPrice(
    itemName: string,
    league: string
  ): Promise<number> {
    const key = `${itemName}_${league}`;
    
    if (this.itemPriceCache.has(key)) {
      return this.itemPriceCache.get(key)!;
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
        // Use median price to avoid outliers
        const prices = results.listings.map(l => l.price.amount);
        const medianPrice = this.calculateMedian(prices);
        
        this.itemPriceCache.set(key, medianPrice);
        return medianPrice;
      }
    } catch (error) {
      console.error(`Failed to get price for ${itemName}:`, error);
    }
    
    // Default fallback prices for common crafting materials
    const defaults: Record<string, number> = {
      'Essence of Wrath': 5,
      'Essence of Greed': 3,
      'Essence of Hatred': 4,
      'Essence of Woe': 3,
      'Essence of Fear': 2,
      'Essence of Anger': 3,
      'Essence of Torment': 2,
      'Essence of Sorrow': 2,
      'Essence of Rage': 3,
      'Essence of Suffering': 2,
      'Essence of Zeal': 5,
      'Essence of Anguish': 2,
      'Essence of Spite': 3,
      'Essence of Scorn': 8,
      'Essence of Envy': 10,
      'Essence of Misery': 12,
      'Essence of Dread': 15,
      'Essence of Loathing': 10,
      'Essence of Contempt': 8,
      'Essence of Horror': 50,
      'Essence of Insanity': 60,
      'Essence of Hysteria': 70,
      'Essence of Delirium': 80,
      'Jagged Fossil': 5,
      'Dense Fossil': 3,
      'Frigid Fossil': 4,
      'Aberrant Fossil': 5,
      'Pristine Fossil': 8,
      'Scorched Fossil': 3,
      'Metallic Fossil': 4,
      'Prismatic Fossil': 10,
      'Serrated Fossil': 6,
      'Bound Fossil': 8,
      'Perfect Fossil': 15,
      'Shuddering Fossil': 12,
      'Bloodstained Fossil': 20,
      'Hollow Fossil': 25,
      'Fractured Fossil': 150,
      'Faceted Fossil': 100,
      'Primitive Resonator': 1,
      'Potent Resonator': 2,
      'Powerful Resonator': 3,
      'Prime Resonator': 5
    };
    
    return defaults[itemName] || 10;
  }
  
  /**
   * Get currency availability on market
   */
  private async getCurrencyAvailability(
    currency: string,
    league: string
  ): Promise<number> {
    try {
      const results = await marketService.searchBulk({
        have: ['chaos'],
        want: [currency as CurrencyType],
        league,
        onlineOnly: true
      });
      
      return results.reduce((sum, listing) => sum + listing.stock, 0);
    } catch {
      return 1000; // Assume good availability
    }
  }
  
  /**
   * Get item availability on market
   */
  private async getItemAvailability(
    itemName: string,
    league: string
  ): Promise<number> {
    try {
      const searchQuery: MarketSearchQuery = {
        name: itemName,
        league,
        limit: 100,
        onlineOnly: true
      };
      
      const results = await marketService.search(searchQuery);
      return results.total;
    } catch {
      return 100; // Assume moderate availability
    }
  }
  
  /**
   * Calculate profit analysis
   */
  private async calculateProfitAnalysis(
    targetItem: DesiredItem,
    craftCost: number,
    league: string
  ): Promise<{
    expectedSellPrice: number;
    expectedProfit: number;
    roi: number;
  } | undefined> {
    try {
      // Search for similar completed items
      const searchQuery: MarketSearchQuery = {
        type: targetItem.baseType,
        category: 'weapon', // Would be determined from baseType
        league,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'asc',
        onlineOnly: true
      };
      
      // Add mod filters based on required mods
      const statFilters = targetItem.requiredMods.map(mod => ({
        id: mod.modText,
        value: {
          min: mod.minValue,
          max: mod.maxValue
        }
      }));
      
      searchQuery.stats = statFilters;
      
      const results = await marketService.search(searchQuery);
      
      if (results.listings.length > 0) {
        // Calculate expected sell price (use 25th percentile to be conservative)
        const prices = results.listings.map(l => l.price.amount).sort((a, b) => a - b);
        const sellPrice = prices[Math.floor(prices.length * 0.25)] || prices[0];
        
        const profit = sellPrice - craftCost;
        const roi = (profit / craftCost) * 100;
        
        return {
          expectedSellPrice: sellPrice,
          expectedProfit: profit,
          roi
        };
      }
    } catch (error) {
      console.error('Failed to calculate profit analysis:', error);
    }
    
    return undefined;
  }
  
  /**
   * Compare craft vs buy decision
   */
  async compareCraftVsBuy(
    targetItem: DesiredItem,
    craftingStrategy: CraftingStrategy,
    league: string
  ): Promise<{
    craftCost: number;
    buyCost: number;
    recommendation: 'craft' | 'buy' | 'either';
    reasoning: string;
    savings: number;
    riskFactor: number;
  }> {
    // Get crafting cost
    const craftAnalysis = await this.calculateStrategyCost(craftingStrategy, league);
    const craftCost = craftAnalysis.expected;
    
    // Get buy cost for similar item
    let buyCost = Infinity;
    
    try {
      const searchQuery: MarketSearchQuery = {
        type: targetItem.baseType,
        league,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
        onlineOnly: true
      };
      
      const results = await marketService.search(searchQuery);
      
      if (results.listings.length > 0) {
        const prices = results.listings.map(l => l.price.amount);
        buyCost = this.calculateMedian(prices);
      }
    } catch (error) {
      console.error('Failed to get buy price:', error);
    }
    
    // Calculate risk factor based on standard deviation
    const riskFactor = craftAnalysis.standardDeviation / craftCost;
    
    // Make recommendation
    let recommendation: 'craft' | 'buy' | 'either';
    let reasoning: string;
    
    const savings = buyCost - craftCost;
    const savingsPercent = (savings / buyCost) * 100;
    
    if (buyCost === Infinity) {
      recommendation = 'craft';
      reasoning = 'No similar items available on market. Crafting is the only option.';
    } else if (savingsPercent > 30 && riskFactor < 0.5) {
      recommendation = 'craft';
      reasoning = `Crafting saves ${savingsPercent.toFixed(0)}% with low risk.`;
    } else if (savingsPercent < -20) {
      recommendation = 'buy';
      reasoning = `Buying is ${Math.abs(savingsPercent).toFixed(0)}% cheaper than crafting.`;
    } else if (riskFactor > 1) {
      recommendation = 'buy';
      reasoning = `High crafting risk (${(riskFactor * 100).toFixed(0)}% cost variance).`;
    } else {
      recommendation = 'either';
      reasoning = `Similar costs. Choose based on availability and preference.`;
    }
    
    return {
      craftCost,
      buyCost,
      recommendation,
      reasoning,
      savings,
      riskFactor
    };
  }
  
  /**
   * Get bulk discount prices for materials
   */
  async getBulkPrices(
    materials: CraftingMaterial[],
    league: string
  ): Promise<{
    material: string;
    singlePrice: number;
    bulkPrice: number;
    bulkQuantity: number;
    savings: number;
  }[]> {
    const bulkPrices = [];
    
    for (const material of materials) {
      if (material.quantity < 10) continue; // Not worth bulk buying
      
      try {
        // Search for bulk listings
        const searchQuery: MarketSearchQuery = {
          name: material.item,
          league,
          limit: 20,
          minPrice: material.currentPrice.amount * material.quantity * 0.7, // 30% discount threshold
          sortBy: 'price',
          sortOrder: 'asc',
          onlineOnly: true
        };
        
        const results = await marketService.search(searchQuery);
        
        // Find listings with bulk quantities
        const bulkListings = results.listings.filter(l => 
          l.item.properties?.some(p => p.name === 'Stack Size' && p.values[0][0] >= material.quantity)
        );
        
        if (bulkListings.length > 0) {
          const bulkPrice = bulkListings[0].price.amount;
          const singlePrice = material.currentPrice.amount;
          const savings = (singlePrice * material.quantity) - bulkPrice;
          
          bulkPrices.push({
            material: material.item,
            singlePrice,
            bulkPrice: bulkPrice / material.quantity,
            bulkQuantity: material.quantity,
            savings
          });
        }
      } catch (error) {
        console.error(`Failed to get bulk price for ${material.item}:`, error);
      }
    }
    
    return bulkPrices;
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
}

export const craftingCostCalculator = new CraftingCostCalculator();