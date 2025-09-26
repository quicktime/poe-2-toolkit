/**
 * Crafting Route Calculator
 * Determines all possible crafting routes for a desired item
 * and calculates costs using real-time market data
 */

import { 
  POE2_CRAFTING_KNOWLEDGE,
  POE2_CRAFTING_METHODS
} from './poe2-crafting-knowledge';
import { marketService } from '../market/marketService';
import { poe2CostCalculator } from './poe2CostCalculator';

export interface ItemRequirement {
  baseType: string;
  itemLevel: number;
  rarity: 'magic' | 'rare';
  mods: ModRequirement[];
}

export interface ModRequirement {
  modText: string;
  modType: 'prefix' | 'suffix';
  tier?: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8';
  minValue?: number;
  maxValue?: number;
  required: boolean;
  weight?: number;
}

export interface CraftingRoute {
  method: string;
  steps: CraftingStep[];
  estimatedCost: {
    min: number;
    expected: number;
    max: number;
  };
  successProbability: number;
  estimatedAttempts: number;
  pros: string[];
  cons: string[];
  marketComparison?: {
    craftCost: number;
    buyPrice: number;
    savings: number;
    recommendation: 'craft' | 'buy';
  };
}

export interface CraftingStep {
  order: number;
  action: string;
  currency: string;
  quantity: number;
  cost: number; // in exalted orbs
  probability: number;
  note?: string;
}

export class CraftingRouteCalculator {
  private league: string = 'Rise of the Abyssal';
  
  /**
   * Calculate all possible crafting routes for an item
   */
  async calculateRoutes(requirements: ItemRequirement): Promise<CraftingRoute[]> {
    const routes: CraftingRoute[] = [];
    
    // Analyze which methods are suitable
    const suitableMethods = this.determineSuitableMethods(requirements);
    
    // Calculate route for each suitable method
    for (const methodKey of suitableMethods) {
      const method = POE2_CRAFTING_METHODS[methodKey];
      const route = await this.calculateRouteForMethod(methodKey, method, requirements);
      routes.push(route);
    }
    
    // Sort by expected cost
    routes.sort((a, b) => a.estimatedCost.expected - b.estimatedCost.expected);
    
    // Add market comparison to best route
    if (routes.length > 0) {
      const marketPrice = await this.getMarketPrice(requirements);
      routes[0].marketComparison = {
        craftCost: routes[0].estimatedCost.expected,
        buyPrice: marketPrice,
        savings: marketPrice - routes[0].estimatedCost.expected,
        recommendation: routes[0].estimatedCost.expected < marketPrice * 0.7 ? 'craft' : 'buy'
      };
    }
    
    return routes;
  }
  
  /**
   * Determine which crafting methods are suitable for the requirements
   */
  private determineSuitableMethods(requirements: ItemRequirement): string[] {
    const suitable: string[] = [];
    const requiredMods = requirements.mods.filter(m => m.required);
    
    // Check if we need guaranteed mods (essences)
    const needsGuaranteed = requiredMods.some(mod => 
      mod.modText.includes('Life') || 
      mod.modText.includes('Damage') ||
      mod.modText.includes('Critical')
    );
    
    // Check if we need high tier mods
    const needsHighTier = requiredMods.some(mod => 
      mod.tier === 'T1' || mod.tier === 'T2'
    );
    
    // Check number of required mods
    const modCount = requiredMods.length;
    
    // Determine suitable methods based on analysis
    if (needsHighTier && modCount >= 4) {
      suitable.push('white_base_premium');
      suitable.push('omen_targeted');
    }
    
    if (needsGuaranteed) {
      suitable.push('essence_spam');
    }
    
    if (modCount <= 2) {
      suitable.push('alteration_regal');
    }
    
    if (modCount >= 3 && modCount <= 5) {
      suitable.push('chaos_swap');
      suitable.push('omen_targeted');
    }
    
    // Always consider rune enhancement as an option
    suitable.push('rune_soul_core');
    
    // Default to chaos swap if nothing else
    if (suitable.length === 0) {
      suitable.push('chaos_swap');
    }
    
    return suitable;
  }
  
  /**
   * Calculate specific route for a method
   */
  private async calculateRouteForMethod(
    methodKey: string,
    method: any,
    requirements: ItemRequirement
  ): Promise<CraftingRoute> {
    const steps: CraftingStep[] = [];
    let totalCost = 0;
    let stepOrder = 1;
    
    // Get currency prices
    const currencyPrices = await this.getCurrencyPrices();
    
    // Calculate steps based on method
    for (const methodStep of method.steps) {
      const currencyKey = methodStep.currency.replace('*', 'greed'); // Default essence
      const currencyData = POE2_CRAFTING_KNOWLEDGE.currencies[currencyKey] ||
                         POE2_CRAFTING_KNOWLEDGE.essences[currencyKey];
      
      if (!currencyData) continue;
      
      // Estimate attempts needed
      const attempts = this.estimateAttempts(methodStep, requirements);
      
      // Get currency cost in exalted
      const costPerUse = currencyPrices[currencyKey] || 1;
      const totalStepCost = costPerUse * attempts;
      
      steps.push({
        order: stepOrder++,
        action: methodStep.description,
        currency: currencyKey,
        quantity: attempts,
        cost: totalStepCost,
        probability: this.calculateStepProbability(methodStep, requirements),
        note: methodStep.repeat ? `May need ${attempts}-${attempts * 3} attempts` : undefined
      });
      
      totalCost += totalStepCost;
    }
    
    // Calculate probability and attempts
    const overallProbability = this.calculateOverallProbability(steps);
    const estimatedAttempts = Math.ceil(1 / overallProbability);
    
    return {
      method: method.name,
      steps,
      estimatedCost: {
        min: totalCost * 0.5,
        expected: totalCost,
        max: totalCost * 3
      },
      successProbability: overallProbability,
      estimatedAttempts,
      pros: method.pros,
      cons: method.cons
    };
  }
  
  /**
   * Estimate attempts needed for a step
   */
  private estimateAttempts(step: any, requirements: ItemRequirement): number {
    // Base attempts
    let attempts = 1;
    
    // If step can repeat, estimate based on probability
    if (step.repeat) {
      const requiredMods = requirements.mods.filter(m => m.required).length;
      
      // Rough estimates based on method
      if (step.currency.includes('alteration')) {
        attempts = 20 + (requiredMods * 10); // More attempts for more mods
      } else if (step.currency.includes('chaos')) {
        attempts = 5 + (requiredMods * 3);
      } else if (step.currency.includes('essence')) {
        attempts = 10 + (requiredMods * 5);
      }
      
      // Adjust for tier requirements
      const needsT1 = requirements.mods.some(m => m.tier === 'T1');
      if (needsT1) {
        attempts *= 2; // Double attempts for T1 mods
      }
    }
    
    return attempts;
  }
  
  /**
   * Calculate probability of step success
   */
  private calculateStepProbability(step: any, requirements: ItemRequirement): number {
    // Base probability
    let probability = 0.5;
    
    // Adjust based on currency tier
    if (step.currency.includes('perfect')) {
      probability = 0.8; // Perfect currency has better odds
    } else if (step.currency.includes('greater')) {
      probability = 0.65;
    }
    
    // Adjust based on mod requirements
    const requiredMods = requirements.mods.filter(m => m.required).length;
    probability = probability * Math.pow(0.9, requiredMods); // Harder with more mods
    
    return probability;
  }
  
  /**
   * Calculate overall probability of success
   */
  private calculateOverallProbability(steps: CraftingStep[]): number {
    return steps.reduce((prob, step) => prob * step.probability, 1);
  }
  
  /**
   * Get current currency prices in exalted orbs - ALL FROM API
   */
  private async getCurrencyPrices(): Promise<Record<string, number>> {
    try {
      const rates = await marketService.getCurrencyRates(this.league);
      const prices: Record<string, number> = {};
      
      // Convert ALL currencies to exalted orb prices
      // NO HARDCODED VALUES!
      for (const [currency, targets] of Object.entries(rates.rates)) {
        // Get rate to exalted
        if (targets['exalted']) {
          // This tells us how many exalted for 1 of this currency
          prices[currency] = targets['exalted'];
        }
      }
      
      // Also check from exalted perspective
      if (rates.rates['exalted']) {
        prices['exalted'] = 1;
        for (const [targetCurrency, rate] of Object.entries(rates.rates['exalted'])) {
          // rate = how many targetCurrency for 1 exalted
          // so 1 targetCurrency = 1/rate exalted
          if (!prices[targetCurrency] && rate > 0) {
            prices[targetCurrency] = 1 / rate;
          }
        }
      }
      
      // Map POE2Scout API IDs to our internal names
      const currencyMapping: Record<string, string> = {
        // Basic orbs
        'trans': 'transmutation',
        'aug': 'augmentation',
        'alt': 'alteration',
        'alch': 'alchemy',
        'chaos': 'chaos',
        'exalted': 'exalted',
        'divine': 'divine',
        'annul': 'annulment',
        'vaal': 'vaal',
        'regal': 'regal',
        'blessed': 'blessed',
        'gcp': 'gcp',
        
        // Greater versions
        'greater-orb-of-transmutation': 'transmutation_greater',
        'greater-orb-of-augmentation': 'augmentation_greater',
        'greater-chaos-orb': 'chaos_greater',
        'greater-exalted-orb': 'exalted_greater',
        'greater-regal-orb': 'regal_greater',
        
        // Perfect versions
        'perfect-orb-of-transmutation': 'transmutation_perfect',
        'perfect-orb-of-augmentation': 'augmentation_perfect',
        'perfect-chaos-orb': 'chaos_perfect',
        'perfect-exalted-orb': 'exalted_perfect',
        'perfect-regal-orb': 'regal_perfect',
        
        // Omens (need to check actual API IDs)
        'omen-of-amelioration': 'omen_of_prefixes',
        'omen-of-corruption': 'omen_of_suffixes',
        'omen-of-greater-exaltation': 'omen_of_duplication',
        'omen-of-fortune': 'omen_of_fortune',
        
        // Essences (map what we find)
        'greater-essence-of-the-body': 'essence_greed_greater',
        'greater-essence-of-battle': 'essence_contempt_greater',
        'greater-essence-of-ice': 'essence_hatred_greater',
        
        // Soul cores (if they exist in API)
        'soul-core': 'soul_core',
        'prime-soul-core': 'soul_core_prime'
      };
      
      // Create mapped prices
      const mappedPrices: Record<string, number> = {};
      for (const [apiId, internalName] of Object.entries(currencyMapping)) {
        if (prices[apiId] !== undefined) {
          mappedPrices[internalName] = prices[apiId];
        }
      }
      
      // Log what we found for debugging
      console.log(`Found ${Object.keys(prices).length} currencies from POE2Scout`);
      console.log(`Mapped ${Object.keys(mappedPrices).length} to internal names`);
      
      // If we have data, return it; otherwise throw to trigger fallback
      if (Object.keys(mappedPrices).length > 0) {
        return mappedPrices;
      } else {
        throw new Error('No currency data mapped from API');
      }
      
    } catch (error) {
      console.error('Failed to get live currency prices:', error);
      // Only use minimal fallback for critical currencies
      // These should be updated as soon as API is available
      return this.getEmergencyFallbackPrices();
    }
  }
  
  /**
   * Emergency fallback prices - ONLY if API completely fails
   * These are based on last known POE2Scout rates
   * Should be updated regularly from actual API data
   */
  private getEmergencyFallbackPrices(): Record<string, number> {
    console.warn('⚠️ Using emergency fallback prices - API unavailable!');
    console.warn('Prices may be inaccurate. Attempting to reconnect...');
    
    // MINIMAL fallback based on last known rates from POE2Scout
    // These should ONLY be used if API is completely down
    return {
      'exalted': 1,          // Base currency
      'chaos': 12.01,        // IMPORTANT: Chaos > Exalted in PoE 2!
      'divine': 380.31,      // From POE2Scout: 1 Divine = 380.31 Exalted
      'transmutation': 0.01, // Rough estimate
      'alchemy': 0.5,        // Rough estimate
      
      // Log that we're missing most prices
      '_WARNING': 'Most currency prices unavailable - API connection required'
    } as Record<string, number>;
  }
  
  /**
   * Get market price for similar items
   */
  private async getMarketPrice(requirements: ItemRequirement): Promise<number> {
    try {
      const searchQuery = {
        type: requirements.baseType,
        league: this.league,
        minItemLevel: requirements.itemLevel,
        rarity: requirements.rarity,
        stats: requirements.mods.filter(m => m.required).map(mod => ({
          id: mod.modText,
          value: {
            min: mod.minValue,
            max: mod.maxValue
          }
        }))
      };
      
      const results = await marketService.search(searchQuery);
      
      if (results.listings.length > 0) {
        // Get median price in exalted
        const prices = results.listings.map(l => {
          // Convert to exalted based on currency
          const currency = l.price.currency;
          if (currency === 'chaos') {
            return l.price.amount * 12.01; // Chaos > Exalted!
          } else if (currency === 'divine') {
            return l.price.amount * 380.31;
          }
          return l.price.amount;
        });
        
        prices.sort((a, b) => a - b);
        return prices[Math.floor(prices.length / 2)];
      }
    } catch (error) {
      console.error('Failed to get market price:', error);
    }
    
    // Default high price if not found
    return 1000;
  }
}

export const craftingRouteCalculator = new CraftingRouteCalculator();