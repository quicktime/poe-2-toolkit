/**
 * SIMPLE Crafting Calculator
 * Just looks up prices for whatever currencies are needed
 * No special handling for any currency type
 */

import { marketService } from '../market/marketService';

export interface CraftingMaterial {
  itemId: string;      // API ID like 'perfect-chaos-orb', 'chaos', etc.
  quantity: number;
  pricePerUnit?: number; // Will be fetched from API
  totalCost?: number;
}

export interface CraftingRoute {
  method: string;
  materials: CraftingMaterial[];
  totalCost?: number;
  steps: string[];
}

export class SimpleCraftingCalculator {
  private priceCache = new Map<string, number>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastUpdate = 0;
  
  /**
   * Calculate cost for any crafting route
   * Just looks up prices for whatever is needed
   */
  async calculateCraftingCost(
    route: CraftingRoute,
    league: string = 'Rise of the Abyssal'
  ): Promise<CraftingRoute> {
    // Get current prices for ALL materials
    await this.updatePrices(league);
    
    // Calculate cost for each material
    let totalCost = 0;
    for (const material of route.materials) {
      // Just look up the price - no special handling!
      const price = this.priceCache.get(material.itemId) || 0;
      material.pricePerUnit = price;
      material.totalCost = price * material.quantity;
      totalCost += material.totalCost;
    }
    
    route.totalCost = totalCost;
    return route;
  }
  
  /**
   * Update prices from API
   */
  private async updatePrices(league: string): Promise<void> {
    // Check if cache is still valid
    if (Date.now() - this.lastUpdate < this.cacheExpiry) {
      return;
    }
    
    try {
      // Get ALL currency rates from API
      const rates = await marketService.getCurrencyRates(league);
      
      // Clear old cache
      this.priceCache.clear();
      
      // Store all prices in exalted
      for (const [currency, targets] of Object.entries(rates.rates)) {
        if (targets['exalted']) {
          // This currency's value in exalted
          this.priceCache.set(currency, targets['exalted']);
        }
      }
      
      // Also get prices from exalted's perspective
      if (rates.rates['exalted']) {
        for (const [currency, rate] of Object.entries(rates.rates['exalted'])) {
          if (!this.priceCache.has(currency) && rate > 0) {
            // 1 exalted = rate currency, so 1 currency = 1/rate exalted
            this.priceCache.set(currency, 1 / rate);
          }
        }
      }
      
      this.lastUpdate = Date.now();
      console.log(`Updated prices for ${this.priceCache.size} currencies`);
      
    } catch (error) {
      console.error('Failed to update prices, using fallback values:', error);
      // Use fallback PoE 2 prices in exalted orbs
      this.priceCache.set('perfect-alchemy-orb', 50);
      this.priceCache.set('perfect-chaos-orb', 40);
      this.priceCache.set('perfect-exalted-orb', 100);
      this.priceCache.set('greater-alchemy-orb', 10);
      this.priceCache.set('greater-chaos-orb', 8);
      this.priceCache.set('greater-exalted-orb', 20);
      this.priceCache.set('alchemy-orb', 0.1);
      this.priceCache.set('chaos-orb', 0.5);
      this.priceCache.set('exalted-orb', 1);
      this.priceCache.set('regal-orb', 0.3);
      this.priceCache.set('divine-orb', 50);
      this.priceCache.set('annulment-orb', 5);
      this.lastUpdate = Date.now();
      console.log('Using fallback prices for Path of Exile 2 currencies');
    }
  }
  
  /**
   * Get price for any item/currency
   */
  async getPrice(itemId: string, league: string = 'Rise of the Abyssal'): Promise<number> {
    await this.updatePrices(league);
    return this.priceCache.get(itemId) || 0;
  }
  
  /**
   * Compare multiple crafting routes
   */
  async compareRoutes(
    routes: CraftingRoute[],
    league: string = 'Rise of the Abyssal'
  ): Promise<CraftingRoute[]> {
    // Calculate cost for each route
    for (const route of routes) {
      await this.calculateCraftingCost(route, league);
    }
    
    // Sort by total cost
    return routes.sort((a, b) => (a.totalCost || 0) - (b.totalCost || 0));
  }
}

export const simpleCraftingCalculator = new SimpleCraftingCalculator();