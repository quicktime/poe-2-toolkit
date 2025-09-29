/**
 * Path of Exile 2 Unified Crafting System
 * 
 * Main exports for the crafting module
 * All costs in EXALTED equivalent with real-time POE2Scout market integration
 */

// Main unified system
export { 
  UnifiedCraftingSystem,
  craftingSystem,
  POE2_CURRENCY_RATES,
  type CraftingCost,
  type CraftingRoute,
  type CraftingStep,
  type MarketIntegratedItem,
  type ModifierData,
  type MarketListing
} from './UnifiedCraftingSystem';

// Comprehensive crafting data
export {
  POE2_COMPREHENSIVE_CRAFTING,
  ITEM_BASES,
  CRAFTING_ROUTES,
  MODIFIER_POOLS,
  determineCraftingMethod,
  estimateCraftingCost
} from './poe2-comprehensive-crafting-system';

// Advanced simulator for testing
export {
  AdvancedCraftingSimulator,
  type ItemState,
  type ModifierInstance,
  type SimulationResult
} from './AdvancedCraftingSimulator';

// Knowledge base
export {
  POE2_CRAFTING_KNOWLEDGE,
  POE2_CURRENCIES,
  POE2_ESSENCES,
  POE2_RUNES,
  POE2_OMENS,
  POE2_DISTILLED_EMOTIONS,
  POE2_CRAFTING_METHODS,
  POE2_MOD_TIERS,
  POE2_CRAFTING_RULES
} from './poe2-crafting-knowledge';

// Mod database
export {
  weaponPrefixes,
  weaponSuffixes,
  armourPrefixes,
  armourSuffixes,
  jewelryMods,
  getModsForItem,
  rollRandomMod,
  rollModValue,
  type CraftingMod
} from '../data/crafting-mods';

/**
 * Quick access to the singleton crafting system instance
 */
export { craftingSystem as default } from './UnifiedCraftingSystem';

/**
 * Convenience functions for common operations
 */

import { craftingSystem } from './UnifiedCraftingSystem';

/**
 * Quick price check in exalted
 */
export async function quickPriceCheck(
  itemBase: string, 
  mods: string[], 
  league: string = 'Standard'
): Promise<number> {
  const item = {
    base: itemBase,
    category: itemBase.includes('sword') || itemBase.includes('bow') ? 'weapon' : 'armor',
    itemLevel: 86,
    mods: mods.map((mod, i) => ({
      id: `mod_${i}`,
      name: mod,
      tier: 1,
      type: (i % 2 === 0 ? 'prefix' : 'suffix') as 'prefix' | 'suffix',
      value: 90
    })),
    estimatedValue: { currency: 'exalted', amount: 0, exaltedEquivalent: 0 }
  };
  
  const result = await craftingSystem.priceCheckCraftedItem(item, league);
  return result.estimatedValue;
}

/**
 * Get best crafting method for budget
 */
export async function getBestCraftingMethod(
  itemBase: string,
  targetMods: string[],
  maxBudget: number, // in exalted
  league: string = 'Standard'
): Promise<CraftingRoute> {
  return craftingSystem.getOptimalCraftingRoute(itemBase, targetMods, maxBudget, league);
}

/**
 * Calculate profit potential
 */
export async function calculateProfit(
  itemBase: string,
  craftingMethod: string,
  league: string = 'Standard'
): Promise<{ investment: number; expectedReturn: number; profit: number; roi: number }> {
  const route = await craftingSystem.getOptimalCraftingRoute(itemBase, [], 100, league);
  const roi = await craftingSystem.calculateCraftingROI(itemBase, route, league);
  
  return {
    investment: roi.investmentCost,
    expectedReturn: roi.expectedReturn,
    profit: roi.expectedReturn - roi.investmentCost,
    roi: roi.roi
  };
}

/**
 * Get market recommendations
 */
export async function getMarketOpportunities(
  budget: number, // in exalted
  league: string = 'Standard'
): Promise<any[]> {
  return craftingSystem.getMarketBasedRecommendations(budget, league);
}