/**
 * Unified Path of Exile 2 Crafting System with Real-Time Market Integration
 * Uses POE2Scout API for live currency rates
 * All costs in EXALTED equivalent (PoE2: Chaos > Exalted!)
 * 
 * UPDATE: Now includes Homogenous Omen strategies and actual PoE2 0.3 modifiers
 */

import { POE2ScoutProvider } from '@/lib/market/providers/poe2scout';
import { CurrencyRates } from '@/types/market';
import { POE2_COMPREHENSIVE_CRAFTING } from './poe2-comprehensive-crafting-system';
import { 
  WAND_PREFIXES, 
  WAND_SUFFIXES, 
  WAND_CORRUPTED_IMPLICITS,
  WAND_CRAFTING_METHODS 
} from './poe2-actual-wand-mods';

/**
 * CRITICAL PoE2 Currency Values from POE2Scout (Rise of the Abyssal League)
 * In PoE2: 1 Chaos = 12 Exalted, 1 Divine = 380 Exalted
 */
export const POE2_CURRENCY_RATES = {
  // Base rates in EXALTED equivalent
  'exalted': 1,
  'chaos': 12.01,  // 1 chaos = 12 exalted (chaos is MORE valuable!)
  'divine': 380.31, // 1 divine = 380 exalted
  
  // Basic currencies (estimated based on PoE2 economy)
  'transmutation': 0.05,
  'augmentation': 0.08,
  'alteration': 0.15,
  'regal': 0.8,
  'alchemy': 0.5,
  'annulment': 8,
  'vaal': 4,
  'scouring': 0, // DOESN'T EXIST IN POE2!
  
  // Perfect currencies (guarantee T1-T2 mods)
  'transmutation_perfect': 2,
  'augmentation_perfect': 2.5,
  'alteration_perfect': 3,
  'regal_perfect': 6,
  'alchemy_perfect': 15,
  'chaos_perfect': 20,
  'exalted_perfect': 8,
  
  // Greater currencies (higher tier mods)
  'transmutation_greater': 3.5,
  'augmentation_greater': 4,
  'alteration_greater': 5,
  'regal_greater': 9,
  'alchemy_greater': 22,
  'chaos_greater': 28,
  'exalted_greater': 12,
  
  // Essences (average)
  'essence_normal': 2.5,
  'essence_greater': 6,
  'essence_perfect': 10,
  
  // Omens (meta-crafting)
  'omen_of_prefixes': 8,
  'omen_of_suffixes': 8,
  'omen_of_targeting': 20,
  'omen_of_fortune': 15,
  'omen_of_preservation': 12,
  'omen_of_duplication': 25,
  'homogenous_omen': 190, // 0.5 Divine
  'omen_of_corruption': 380, // 1 Divine
  'omen_of_chance': 150,
  'omen_of_blanching': 100,
  
  // Distilled Emotions
  'distilled_ire': 10,
  'distilled_sorrow': 10,
  'distilled_envy': 12,
  'distilled_guilt': 8,
  'distilled_paranoia': 9,
  'distilled_greed': 15,
  
  // Soul Cores (for Runes)
  'soul_core_minor': 3,
  'soul_core_major': 15,
  'soul_core_prime': 40,
  
  // Runes
  'rune_of_ascension': 5,
  'rune_of_refinement': 8,
  'rune_of_tempering': 20,
  'rune_of_enhancement': 35,
  'rune_of_genesis': 50,
  
  // Special crafting
  'recombinator': 50,
  'multimod': 10 // May not exist in PoE2
};

export interface CraftingCost {
  currency: string;
  amount: number;
  exaltedEquivalent: number;
  marketPrice?: number; // Real-time price if available
}

export interface CraftingRoute {
  name: string;
  description: string;
  steps: CraftingStep[];
  totalCost: CraftingCost;
  successRate: number;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface CraftingStep {
  action: string;
  currency: string;
  description: string;
  cost: CraftingCost;
  expectedOutcome: string;
  alternatives?: CraftingStep[];
}

export interface MarketIntegratedItem {
  base: string;
  category: string;
  itemLevel: number;
  influences?: string[];
  mods: ModifierData[];
  estimatedValue: CraftingCost;
  similarListings?: MarketListing[];
}

export interface ModifierData {
  id: string;
  name: string;
  tier: number;
  type: 'prefix' | 'suffix' | 'implicit';
  value: number | string;
  marketValue?: number; // How much this mod adds to item value
}

export interface MarketListing {
  seller: string;
  price: number; // In exalted
  mods: string[];
  listed: Date;
  whisper: string;
}

export class UnifiedCraftingSystem {
  private marketProvider: POE2ScoutProvider;
  private currencyRates: Map<string, number>;
  private lastRateUpdate: Date;
  private readonly RATE_CACHE_DURATION = 300000; // 5 minutes
  
  constructor() {
    this.marketProvider = new POE2ScoutProvider();
    this.currencyRates = new Map(Object.entries(POE2_CURRENCY_RATES));
    this.lastRateUpdate = new Date(0);
  }

  /**
   * Update currency rates from POE2Scout API
   */
  async updateCurrencyRates(league: string = 'Standard'): Promise<void> {
    try {
      const now = new Date();
      if (now.getTime() - this.lastRateUpdate.getTime() < this.RATE_CACHE_DURATION) {
        return; // Use cached rates
      }

      const rates = await this.marketProvider.getCurrencyRates(league);
      
      // Convert all rates to exalted equivalent
      if (rates.rates.exalted) {
        for (const [currency, exchangeRates] of Object.entries(rates.rates)) {
          if (exchangeRates.exalted) {
            this.currencyRates.set(currency, exchangeRates.exalted);
          }
        }
      }
      
      this.lastRateUpdate = now;
    } catch (error) {
      console.warn('Failed to update currency rates, using defaults:', error);
      // Keep using default rates
    }
  }

  /**
   * Get currency cost in exalted equivalent
   */
  getCurrencyValue(currency: string, amount: number = 1): CraftingCost {
    const rate = this.currencyRates.get(currency) || 1;
    return {
      currency,
      amount,
      exaltedEquivalent: amount * rate,
      marketPrice: rate
    };
  }

  /**
   * Calculate total crafting cost for a route
   */
  calculateRouteCost(steps: any[]): CraftingCost {
    let totalExalted = 0;
    
    for (const step of steps) {
      const currencyBase = step.action || step.currency;
      const cost = this.getCurrencyValue(currencyBase, step.expectedCost || 1);
      totalExalted += cost.exaltedEquivalent;
      
      // Handle repeat steps
      if (step.repeat && typeof step.expectedCost === 'number') {
        totalExalted *= step.expectedCost; // Multiply by expected iterations
      }
    }
    
    return {
      currency: 'exalted',
      amount: totalExalted,
      exaltedEquivalent: totalExalted
    };
  }

  /**
   * Get optimal crafting route for an item
   */
  async getOptimalCraftingRoute(
    itemBase: string,
    targetMods: string[],
    budget: number, // In exalted
    league: string = 'Standard'
  ): Promise<CraftingRoute> {
    // Update rates first
    await this.updateCurrencyRates(league);
    
    // Check if this requires special handling
    const hasGainMods = this.hasGainAsExtraMods(targetMods);
    const modCount = targetMods.length;
    const needsCorruption = modCount > 6;
    
    // Determine budget tier
    let strategy: 'budget' | 'midTier' | 'highEnd';
    if (budget < 10) {
      strategy = 'budget';
    } else if (budget < 100) {
      strategy = 'midTier';
    } else {
      strategy = 'highEnd';
    }
    
    // Override strategy for special items
    if (hasGainMods || needsCorruption) {
      strategy = 'highEnd'; // Force high-end strategy for mirror-tier items
    }
    
    // Find appropriate route from comprehensive system
    const baseRoutes = this.findCraftingRoutes(itemBase, strategy);
    
    // Convert to unified format with real costs
    const routes: CraftingRoute[] = [];
    
    for (const route of baseRoutes) {
      const steps: CraftingStep[] = [];
      let totalCost = 0;
      
      for (const step of route.steps) {
        const cost = this.getCurrencyValue(step.action, step.expectedCost || 1);
        totalCost += cost.exaltedEquivalent;
        
        steps.push({
          action: step.action,
          currency: step.action,
          description: step.description,
          cost,
          expectedOutcome: step.expectedMods?.join(', ') || step.description,
          alternatives: step.alternatives?.map((alt: any) => ({
            action: alt.action,
            currency: alt.action,
            description: alt.description,
            cost: this.getCurrencyValue(alt.action, alt.expectedCost || 1),
            expectedOutcome: alt.expectedMods?.join(', ') || alt.description
          }))
        });
      }
      
      routes.push({
        name: route.name,
        description: route.description,
        steps,
        totalCost: {
          currency: 'exalted',
          amount: totalCost,
          exaltedEquivalent: totalCost
        },
        successRate: this.estimateSuccessRate(route, targetMods),
        estimatedTime: this.estimateCraftingTime(steps),
        difficulty: this.assessDifficulty(route)
      });
    }
    
    // Sort by efficiency (success rate / cost)
    routes.sort((a, b) => {
      const efficiencyA = a.successRate / a.totalCost.exaltedEquivalent;
      const efficiencyB = b.successRate / b.totalCost.exaltedEquivalent;
      return efficiencyB - efficiencyA;
    });
    
    // Return best route within budget
    return routes.find(r => r.totalCost.exaltedEquivalent <= budget) || routes[0];
  }

  /**
   * Price check a crafted item against market
   */
  async priceCheckCraftedItem(
    item: MarketIntegratedItem,
    league: string = 'Standard'
  ): Promise<{ estimatedValue: number; confidence: number; similarItems: MarketListing[] }> {
    try {
      // Build search query based on item
      const query = {
        type: item.base,
        category: item.category as any,
        league,
        minItemLevel: Math.max(0, item.itemLevel - 5),
        maxItemLevel: item.itemLevel + 5,
        stats: item.mods.map(mod => ({
          id: mod.id,
          value: { min: mod.value as number * 0.8 } // 80% of mod value
        })),
        limit: 20
      };
      
      const searchResult = await this.marketProvider.search(query);
      
      // Extract prices in exalted
      const prices = searchResult.listings.map(listing => {
        const price = listing.price;
        if (price.currency === 'exalted') {
          return price.amount;
        } else {
          const rate = this.currencyRates.get(price.currency) || 1;
          return price.amount * rate;
        }
      });
      
      if (prices.length === 0) {
        return {
          estimatedValue: 0,
          confidence: 0,
          similarItems: []
        };
      }
      
      // Calculate statistics
      prices.sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)];
      const average = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      // Convert listings to simplified format
      const similarItems: MarketListing[] = searchResult.listings.slice(0, 5).map(listing => ({
        seller: listing.seller,
        price: listing.price.currency === 'exalted' 
          ? listing.price.amount 
          : listing.price.amount * (this.currencyRates.get(listing.price.currency) || 1),
        mods: [...listing.item.explicitMods, ...listing.item.implicitMods],
        listed: listing.listed,
        whisper: listing.whisper || ''
      }));
      
      // Calculate confidence based on sample size and variance
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / average;
      
      let confidence = Math.min(100, prices.length * 5);
      confidence *= (1 - Math.min(coefficientOfVariation, 1));
      
      return {
        estimatedValue: median,
        confidence: Math.round(confidence),
        similarItems
      };
    } catch (error) {
      console.error('Price check failed:', error);
      return {
        estimatedValue: 0,
        confidence: 0,
        similarItems: []
      };
    }
  }

  /**
   * Calculate ROI for a crafting project
   */
  async calculateCraftingROI(
    itemBase: string,
    craftingRoute: CraftingRoute,
    league: string = 'Standard'
  ): Promise<{
    investmentCost: number;
    expectedReturn: number;
    roi: number;
    breakEvenProbability: number;
  }> {
    // Get base item cost
    const baseItemQuery = {
      type: itemBase,
      league,
      rarity: 'normal' as any,
      limit: 10
    };
    
    const baseItemResult = await this.marketProvider.search(baseItemQuery);
    const baseItemCost = this.getMedianPrice(baseItemResult.listings);
    
    // Total investment
    const investmentCost = baseItemCost + craftingRoute.totalCost.exaltedEquivalent;
    
    // Estimate final item value based on expected mods
    const expectedMods = this.extractExpectedMods(craftingRoute);
    const mockItem: MarketIntegratedItem = {
      base: itemBase,
      category: this.getItemCategory(itemBase),
      itemLevel: 86, // Assume high ilvl
      mods: expectedMods,
      estimatedValue: { currency: 'exalted', amount: 0, exaltedEquivalent: 0 }
    };
    
    const priceCheck = await this.priceCheckCraftedItem(mockItem, league);
    const expectedReturn = priceCheck.estimatedValue;
    
    // Calculate ROI
    const roi = ((expectedReturn - investmentCost) / investmentCost) * 100;
    
    // Break-even probability (simplified)
    const breakEvenProbability = craftingRoute.successRate * (expectedReturn > investmentCost ? 1 : 0.5);
    
    return {
      investmentCost,
      expectedReturn,
      roi,
      breakEvenProbability
    };
  }

  /**
   * Generate crafting recommendations based on market trends
   */
  async getMarketBasedRecommendations(
    budget: number,
    league: string = 'Standard'
  ): Promise<{
    itemType: string;
    reason: string;
    expectedProfit: number;
    difficulty: string;
  }[]> {
    const recommendations = [];
    
    // Check popular item types
    const popularItems = [
      { type: 'bow', mods: ['physical_damage', 'attack_speed', 'critical'] },
      { type: 'wand', mods: ['spell_damage', 'cast_speed', 'critical'] },
      { type: 'body', mods: ['life', 'resistances', 'armor'] },
      { type: 'boots', mods: ['movement_speed', 'life', 'resistances'] },
      { type: 'amulet', mods: ['attributes', 'life', 'damage'] },
      { type: 'ring', mods: ['life', 'resistances', 'damage'] }
    ];
    
    for (const item of popularItems) {
      const route = await this.getOptimalCraftingRoute(item.type, item.mods, budget, league);
      const roi = await this.calculateCraftingROI(item.type, route, league);
      
      if (roi.roi > 20) { // 20% profit threshold
        recommendations.push({
          itemType: item.type,
          reason: `High demand for ${item.mods.join(', ')} mods`,
          expectedProfit: roi.expectedReturn - roi.investmentCost,
          difficulty: route.difficulty
        });
      }
    }
    
    // Sort by expected profit
    recommendations.sort((a, b) => b.expectedProfit - a.expectedProfit);
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Batch craft simulator for profit estimation
   */
  async simulateBatchCrafting(
    itemBase: string,
    craftingRoute: CraftingRoute,
    batchSize: number,
    league: string = 'Standard'
  ): Promise<{
    totalInvestment: number;
    expectedRevenue: number;
    expectedProfit: number;
    successfulCrafts: number;
    failedCrafts: number;
    profitPerHour: number;
  }> {
    const roi = await this.calculateCraftingROI(itemBase, craftingRoute, league);
    
    // Simulate batch
    const successRate = craftingRoute.successRate / 100;
    const successfulCrafts = Math.floor(batchSize * successRate);
    const failedCrafts = batchSize - successfulCrafts;
    
    // Calculate totals
    const totalInvestment = roi.investmentCost * batchSize;
    const expectedRevenue = roi.expectedReturn * successfulCrafts;
    const expectedProfit = expectedRevenue - totalInvestment;
    
    // Estimate time (30 seconds per craft average)
    const totalTimeHours = (batchSize * 30) / 3600;
    const profitPerHour = expectedProfit / totalTimeHours;
    
    return {
      totalInvestment,
      expectedRevenue,
      expectedProfit,
      successfulCrafts,
      failedCrafts,
      profitPerHour
    };
  }

  // Helper methods
  
  private findCraftingRoutes(itemBase: string, strategy: string): any[] {
    // Search through POE2_COMPREHENSIVE_CRAFTING routes
    const routes = [];
    
    // Check if this is a wand requiring special crafting (Gain as Extra mods)
    if (itemBase.toLowerCase().includes('wand') && strategy === 'highEnd') {
      // Add Homogenous Omen strategy for high-end wands
      routes.push(this.getHomogenousOmenWandRoute());
    }
    
    for (const [category, items] of Object.entries(POE2_COMPREHENSIVE_CRAFTING.craftingRoutes)) {
      for (const [itemType, strategies] of Object.entries(items)) {
        if (itemBase.toLowerCase().includes(itemType.toLowerCase())) {
          const route = (strategies as any)[strategy];
          if (route) {
            routes.push(route);
          }
        }
      }
    }
    
    // Fallback to generic routes
    if (routes.length === 0) {
      routes.push({
        name: 'Generic Crafting',
        description: 'Standard crafting approach',
        steps: [
          { action: 'alchemy', description: 'Create rare', expectedCost: 1 },
          { action: 'chaos', description: 'Improve mods', expectedCost: 5 },
          { action: 'exalted', description: 'Add mods', expectedCost: 3 }
        ]
      });
    }
    
    return routes;
  }

  private estimateSuccessRate(route: any, targetMods: string[]): number {
    // Base success rate from route
    let baseRate = 50;
    
    if (route.successRate === 'high') baseRate = 75;
    else if (route.successRate === 'medium') baseRate = 50;
    else if (route.successRate === 'low') baseRate = 25;
    else if (route.successRate === 'very_low') baseRate = 10;
    
    // Adjust based on number of target mods
    const modPenalty = targetMods.length * 10;
    
    return Math.max(5, baseRate - modPenalty);
  }

  private estimateCraftingTime(steps: CraftingStep[]): string {
    const timePerStep = 30; // seconds
    const totalSeconds = steps.length * timePerStep;
    
    if (totalSeconds < 60) return `${totalSeconds} seconds`;
    if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)} minutes`;
    return `${Math.round(totalSeconds / 3600)} hours`;
  }

  private assessDifficulty(route: any): 'easy' | 'medium' | 'hard' | 'extreme' {
    if (route.craftingDifficulty) return route.craftingDifficulty;
    
    const stepCount = route.steps?.length || 0;
    if (stepCount <= 3) return 'easy';
    if (stepCount <= 6) return 'medium';
    if (stepCount <= 10) return 'hard';
    return 'extreme';
  }

  private getMedianPrice(listings: any[]): number {
    if (listings.length === 0) return 0;
    
    const prices = listings.map(l => {
      if (l.price.currency === 'exalted') {
        return l.price.amount;
      }
      const rate = this.currencyRates.get(l.price.currency) || 1;
      return l.price.amount * rate;
    }).sort((a, b) => a - b);
    
    return prices[Math.floor(prices.length / 2)];
  }

  private extractExpectedMods(route: CraftingRoute): ModifierData[] {
    const mods: ModifierData[] = [];
    let modId = 0;
    
    for (const step of route.steps) {
      if (step.expectedOutcome && step.expectedOutcome.includes('T1')) {
        mods.push({
          id: `mod_${modId++}`,
          name: step.expectedOutcome,
          tier: 1,
          type: modId % 2 === 0 ? 'prefix' : 'suffix',
          value: 90 // High roll
        });
      } else if (step.expectedOutcome && step.expectedOutcome.includes('T2')) {
        mods.push({
          id: `mod_${modId++}`,
          name: step.expectedOutcome,
          tier: 2,
          type: modId % 2 === 0 ? 'prefix' : 'suffix',
          value: 75 // Good roll
        });
      }
    }
    
    return mods;
  }

  private getItemCategory(itemBase: string): string {
    const categories: { [key: string]: string } = {
      'sword': 'weapon',
      'axe': 'weapon',
      'mace': 'weapon',
      'bow': 'weapon',
      'wand': 'weapon',
      'staff': 'weapon',
      'body': 'armor',
      'helmet': 'armor',
      'gloves': 'armor',
      'boots': 'armor',
      'shield': 'armor',
      'amulet': 'jewelry',
      'ring': 'jewelry',
      'belt': 'jewelry'
    };
    
    for (const [key, cat] of Object.entries(categories)) {
      if (itemBase.toLowerCase().includes(key)) {
        return cat;
      }
    }
    
    return 'weapon';
  }

  /**
   * Get Homogenous Omen crafting route for mirror-tier wands
   * This handles the "Gain as Extra" mods that actually exist in PoE2
   */
  private getHomogenousOmenWandRoute(): any {
    return {
      name: 'Mirror-Tier Wand (Homogenous Omen Strategy)',
      description: 'Use Homogenous Omens to target multiple "Gain as Extra" damage mods',
      steps: [
        {
          action: 'alteration_perfect',
          description: 'Alt spam for +3 to all spell skills OR +5 lightning skills',
          expectedCost: 300, // Many attempts needed
          targetMod: '+3 to Level of all Spell Skills',
          expectedMods: ['+3 spell skills', '+5 lightning skills']
        },
        {
          action: 'augmentation',
          description: 'Add second mod if good prefix',
          expectedCost: 5
        },
        {
          action: 'regal',
          description: 'Make rare',
          expectedCost: 1
        },
        {
          action: 'homogenous_omen',
          description: 'Homogenous Omen + Greater Exalt for "Gain % as Extra Physical"',
          expectedCost: 1.5, // Uses both omen + greater exalt
          targetMod: 'Gain 24% of Damage as Extra Physical Damage'
        },
        {
          action: 'homogenous_omen',
          description: 'Homogenous Omen + Greater Exalt for "Gain % as Extra Fire"',
          expectedCost: 1.5,
          targetMod: 'Gain 30% of Damage as Extra Fire Damage'
        },
        {
          action: 'homogenous_omen',
          description: 'Homogenous Omen + Greater Exalt for "Gain % as Extra Lightning"',
          expectedCost: 1.5,
          targetMod: 'Gain 28% of Damage as Extra Lightning Damage'
        },
        {
          action: 'homogenous_omen',
          description: 'Homogenous Omen + Greater Dextral Exalt for Critical Spell Damage',
          expectedCost: 1.5,
          targetMod: '38% increased Critical Spell Damage Bonus'
        },
        {
          action: 'homogenous_omen',
          description: 'Homogenous Omen + Greater Dextral Exalt for Cast Speed',
          expectedCost: 1.5,
          targetMod: '35% increased Cast Speed'
        },
        {
          action: 'divine',
          description: 'Perfect all mod rolls (35% cast speed, 38% crit, max damage values)',
          expectedCost: 2, // 2 divines worth of attempts
        },
        {
          action: 'omen_of_corruption',
          description: 'Optional: Use with Vaal Orb for 7th mod (Grants Spellslinger)',
          expectedCost: 1.5, // Omen + vaal orb
          targetMod: 'Grants Skill: Level 18 Spellslinger',
          warning: 'CORRUPTION - Cannot modify after this!'
        }
      ],
      expectedTotalCost: 3800, // ~10 divines
      successRate: 'very_low',
      targetMods: [
        '+3 to Level of all Spell Skills',
        '+5 to Level of all Lightning Spell Skills',
        'Gain 24% of Damage as Extra Physical Damage',
        'Gain 30% of Damage as Extra Fire Damage', 
        'Gain 28% of Damage as Extra Lightning Damage',
        '38% increased Critical Spell Damage Bonus',
        '35% increased Cast Speed',
        'Grants Spellslinger (Corrupted Implicit)'
      ]
    };
  }

  /**
   * Check if target mods include "Gain as Extra" damage
   */
  private hasGainAsExtraMods(targetMods: string[]): boolean {
    return targetMods.some(mod => 
      mod.toLowerCase().includes('gain') && 
      mod.toLowerCase().includes('as extra')
    );
  }

  /**
   * Override mod limit check for corrupted items
   */
  private getMaxModCount(itemBase: string, corrupted: boolean = false): number {
    // Corrupted items can exceed normal 6-mod limit
    if (corrupted) {
      return 8; // Can have implicit + 7 explicit mods
    }
    return 6; // Normal limit: 3 prefixes + 3 suffixes
  }

  /**
   * Export crafting plan to shareable format
   */
  exportCraftingPlan(route: CraftingRoute): string {
    let export_str = `# ${route.name}\n`;
    export_str += `${route.description}\n\n`;
    export_str += `**Total Cost:** ${route.totalCost.exaltedEquivalent.toFixed(1)} Exalted\n`;
    export_str += `**Success Rate:** ${route.successRate}%\n`;
    export_str += `**Estimated Time:** ${route.estimatedTime}\n`;
    export_str += `**Difficulty:** ${route.difficulty}\n\n`;
    export_str += `## Steps:\n`;
    
    route.steps.forEach((step, i) => {
      export_str += `${i + 1}. **${step.currency}** - ${step.description}\n`;
      export_str += `   Cost: ${step.cost.exaltedEquivalent.toFixed(2)} ex\n`;
      export_str += `   Expected: ${step.expectedOutcome}\n\n`;
    });
    
    return export_str;
  }
}

// Singleton instance
export const craftingSystem = new UnifiedCraftingSystem();

export default UnifiedCraftingSystem;