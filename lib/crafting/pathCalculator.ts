/**
 * Path of Exile 2 Crafting Path Calculator
 * Calculates optimal crafting strategies based on desired mods and budget
 */

export interface DesiredMod {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  tier: number;
  weight: number;
  requiredLevel: number;
  stat?: string;
  values?: { min: number; max: number };
}

export interface CraftingStep {
  method: string;
  currency: string;
  cost: number; // in exalted orbs
  successRate: number; // 0-1
  expectedAttempts: number;
  expectedCost: number;
  description: string;
  risks: string[];
  alternatives?: CraftingStep[];
}

export interface CraftingPath {
  strategy: 'budget' | 'medium' | 'expensive';
  steps: CraftingStep[];
  totalExpectedCost: number;
  successProbability: number;
  timeEstimate: string; // e.g., "5-10 minutes"
  difficulty: 'easy' | 'medium' | 'hard';
  requiredCurrency: { [key: string]: number };
}

// PoE 2 Currency prices in exalted orbs (approximate)
// In PoE 2, Exalted Orb is the primary currency (not Chaos)
export const CURRENCY_PRICES: { [key: string]: number } = {
  'Orb of Transmutation': 0.001,
  'Orb of Augmentation': 0.002,
  'Orb of Alchemy': 0.005,
  'Chaos Orb': 0.01,  // Chaos is worth much less in PoE 2
  'Regal Orb': 0.02,
  'Greater Orb of Alchemy': 0.05,
  'Perfect Orb of Alchemy': 0.15,
  'Exalted Orb': 1,  // Base currency in PoE 2
  'Greater Exalted Orb': 3,
  'Perfect Exalted Orb': 10,
  'Divine Orb': 1.5,
  'Orb of Annulment': 0.05,
  'Greater Orb of Annulment': 0.15,
  'Essence (Low Tier)': 0.005,
  'Essence (Mid Tier)': 0.02,
  'Essence (High Tier)': 0.1,
  'Essence (Perfect)': 0.5,
  'Orb of Conflict': 0.2,
  'Orb of Dominance': 2,
  'Eldritch Currency': 0.05,
  'Veiled Orb': 0.3,
  'Sacred Orb': 5,
};

export class CraftingPathCalculator {
  private desiredMods: DesiredMod[];
  private itemLevel: number;
  private baseItem: any;
  private customPrices: { [key: string]: number };

  constructor(
    desiredMods: DesiredMod[],
    itemLevel: number,
    baseItem?: any,
    customPrices?: { [key: string]: number }
  ) {
    this.desiredMods = desiredMods;
    this.itemLevel = itemLevel;
    this.baseItem = baseItem;
    this.customPrices = customPrices || {};
  }

  /**
   * Get currency price with custom prices override
   */
  private getCurrencyPrice(currencyName: string): number {
    // Check custom prices first (from real-time market data)
    if (this.customPrices[currencyName] !== undefined) {
      return this.customPrices[currencyName];
    }
    // Fall back to default prices
    return CURRENCY_PRICES[currencyName] || 0.01;
  }

  /**
   * Calculate all possible crafting paths for different budget levels
   */
  calculatePaths(): { budget: CraftingPath; medium: CraftingPath; expensive: CraftingPath } {
    return {
      budget: this.calculateBudgetPath(),
      medium: this.calculateMediumPath(),
      expensive: this.calculateExpensivePath(),
    };
  }

  /**
   * Budget strategy: Use chaos/essence spam
   */
  private calculateBudgetPath(): CraftingPath {
    const steps: CraftingStep[] = [];
    const requiredCurrency: { [key: string]: number } = {};

    // Check if we can use essences for guaranteed mods
    const essenceMods = this.findEssenceMods();

    if (essenceMods.length > 0) {
      // Essence crafting strategy
      const essenceTier = this.determineBudgetEssenceTier();
      const essenceCurrency = `Essence (${essenceTier} Tier)`;
      const essencePrice = this.getCurrencyPrice(essenceCurrency);
      const successRate = this.calculateEssenceSuccessRate(essenceMods);
      const expectedAttempts = Math.ceil(1 / successRate);

      steps.push({
        method: 'essence_spam',
        currency: essenceCurrency,
        cost: essencePrice,
        successRate,
        expectedAttempts,
        expectedCost: expectedAttempts * essencePrice,
        description: `Use ${essenceTier} tier essences to guarantee base mod and roll for others`,
        risks: ['May take many attempts', 'Other mods are random'],
      });

      requiredCurrency[`${essenceTier} Tier Essence`] = expectedAttempts;
    } else {
      // Chaos spam strategy
      const chaosSuccessRate = this.calculateChaosSuccessRate();
      const expectedAttempts = Math.ceil(1 / chaosSuccessRate);

      steps.push({
        method: 'chaos_spam',
        currency: 'Chaos Orb',
        cost: this.getCurrencyPrice('Chaos Orb'),
        successRate: chaosSuccessRate,
        expectedAttempts,
        expectedCost: expectedAttempts * this.getCurrencyPrice('Chaos Orb'),
        description: 'Spam Chaos Orbs to swap modifiers (PoE 2 mechanic)',
        risks: ['Very RNG dependent', 'May take hundreds of attempts', 'Chaos only swaps one mod in PoE 2'],
      });

      requiredCurrency['Chaos Orb'] = expectedAttempts;
    }

    // Add divine orb step if we need good rolls
    if (this.needsGoodRolls()) {
      const divineCount = 3; // Budget uses fewer divines
      steps.push({
        method: 'divine',
        currency: 'Divine Orb',
        cost: this.getCurrencyPrice('Divine Orb'),
        successRate: 0.5,
        expectedAttempts: divineCount,
        expectedCost: divineCount * this.getCurrencyPrice('Divine Orb'),
        description: 'Use Divine Orbs to improve mod values',
        risks: ['May not achieve perfect rolls'],
      });

      requiredCurrency['Divine Orb'] = divineCount;
    }

    const totalCost = steps.reduce((sum, step) => sum + step.expectedCost, 0);

    return {
      strategy: 'budget',
      steps,
      totalExpectedCost: totalCost,
      successProbability: this.calculateOverallSuccess(steps),
      timeEstimate: '10-30 minutes',
      difficulty: 'easy',
      requiredCurrency,
    };
  }

  /**
   * Medium strategy: Use targeted crafting methods
   */
  private calculateMediumPath(): CraftingPath {
    const steps: CraftingStep[] = [];
    const requiredCurrency: { [key: string]: number } = {};

    // Start with Greater Alchemy for better tier weights
    steps.push({
      method: 'greater_alchemy',
      currency: 'Greater Orb of Alchemy',
      cost: this.getCurrencyPrice('Greater Orb of Alchemy'),
      successRate: 0.15,
      expectedAttempts: 7,
      expectedCost: 7 * this.getCurrencyPrice('Greater Orb of Alchemy'),
      description: 'Use Greater Alchemy Orbs for better tier modifiers',
      risks: ['Still RNG dependent', 'More expensive than regular alchemy'],
    });

    requiredCurrency['Greater Orb of Alchemy'] = 7;

    // Add targeted annuls and exalts
    const prefixCount = this.desiredMods.filter(m => m.type === 'prefix').length;
    const suffixCount = this.desiredMods.filter(m => m.type === 'suffix').length;

    if (prefixCount < 3 || suffixCount < 3) {
      // We can use exalts to add missing mods
      const exaltsNeeded = Math.min(2, (3 - prefixCount) + (3 - suffixCount));

      steps.push({
        method: 'targeted_exalt',
        currency: 'Exalted Orb',
        cost: this.getCurrencyPrice('Exalted Orb'),
        successRate: 0.3,
        expectedAttempts: exaltsNeeded,
        expectedCost: exaltsNeeded * this.getCurrencyPrice('Exalted Orb'),
        description: 'Use Exalted Orbs to add missing modifiers',
        risks: ['May add unwanted mods', 'Limited control over outcomes'],
      });

      requiredCurrency['Exalted Orb'] = exaltsNeeded;
    }

    // Use annulment if we need to remove bad mods
    steps.push({
      method: 'targeted_annul',
      currency: 'Greater Orb of Annulment',
      cost: this.getCurrencyPrice('Greater Orb of Annulment'),
      successRate: 0.5,
      expectedAttempts: 2,
      expectedCost: 2 * this.getCurrencyPrice('Greater Orb of Annulment'),
      description: 'Remove unwanted modifiers with Greater Annulment',
      risks: ['May remove desired mods', 'Can brick the item'],
      alternatives: [
        {
          method: 'orb_of_conflict',
          currency: 'Orb of Conflict',
          cost: this.getCurrencyPrice('Orb of Conflict'),
          successRate: 0.5,
          expectedAttempts: 3,
          expectedCost: 3 * this.getCurrencyPrice('Orb of Conflict'),
          description: 'Use Orb of Conflict to upgrade mod tiers',
          risks: ['Can downgrade other mods'],
        }
      ],
    });

    requiredCurrency['Greater Orb of Annulment'] = 2;

    // Divine for better rolls
    const divineCount = 5;
    steps.push({
      method: 'divine',
      currency: 'Divine Orb',
      cost: CURRENCY_PRICES['Divine Orb'],
      successRate: 0.7,
      expectedAttempts: divineCount,
      expectedCost: divineCount * CURRENCY_PRICES['Divine Orb'],
      description: 'Divine Orbs for good roll values',
      risks: ['May not achieve perfect rolls'],
    });

    requiredCurrency['Divine Orb'] = divineCount;

    const totalCost = steps.reduce((sum, step) => sum + step.expectedCost, 0);

    return {
      strategy: 'medium',
      steps,
      totalExpectedCost: totalCost,
      successProbability: this.calculateOverallSuccess(steps),
      timeEstimate: '30-60 minutes',
      difficulty: 'medium',
      requiredCurrency,
    };
  }

  /**
   * Expensive strategy: Use perfect currency and metamods
   */
  private calculateExpensivePath(): CraftingPath {
    const steps: CraftingStep[] = [];
    const requiredCurrency: { [key: string]: number } = {};

    // Start with Perfect Alchemy for guaranteed T1-T2
    steps.push({
      method: 'perfect_alchemy',
      currency: 'Perfect Orb of Alchemy',
      cost: this.getCurrencyPrice('Perfect Orb of Alchemy'),
      successRate: 0.4,
      expectedAttempts: 3,
      expectedCost: 3 * this.getCurrencyPrice('Perfect Orb of Alchemy'),
      description: 'Use Perfect Alchemy for guaranteed T1-T2 modifiers',
      risks: ['Very expensive', 'Still need correct mod types'],
    });

    requiredCurrency['Perfect Orb of Alchemy'] = 3;

    // Use Orb of Dominance for elevation
    if (this.hasElevatableMods()) {
      steps.push({
        method: 'elevate',
        currency: 'Orb of Dominance',
        cost: this.getCurrencyPrice('Orb of Dominance'),
        successRate: 0.5,
        expectedAttempts: 2,
        expectedCost: 2 * this.getCurrencyPrice('Orb of Dominance'),
        description: 'Elevate key modifiers to elevated tier',
        risks: ['Can remove other influenced mods'],
      });

      requiredCurrency['Orb of Dominance'] = 2;
    }

    // Perfect Exalted Orbs for missing T1 mods
    const perfectExaltsNeeded = Math.max(0, this.desiredMods.filter(m => m.tier === 1).length - 2);
    if (perfectExaltsNeeded > 0) {
      steps.push({
        method: 'perfect_exalt',
        currency: 'Perfect Exalted Orb',
        cost: this.getCurrencyPrice('Perfect Exalted Orb'),
        successRate: 0.6,
        expectedAttempts: perfectExaltsNeeded,
        expectedCost: perfectExaltsNeeded * this.getCurrencyPrice('Perfect Exalted Orb'),
        description: 'Add T1 modifiers with Perfect Exalted Orbs',
        risks: ['Extremely expensive', 'Still RNG for mod type'],
      });

      requiredCurrency['Perfect Exalted Orb'] = perfectExaltsNeeded;
    }

    // Veiled Orb for special mods
    if (this.needsVeiledMods()) {
      steps.push({
        method: 'veiled',
        currency: 'Veiled Orb',
        cost: this.getCurrencyPrice('Veiled Orb'),
        successRate: 0.4,
        expectedAttempts: 2,
        expectedCost: 2 * this.getCurrencyPrice('Veiled Orb'),
        description: 'Add veiled modifiers for unique effects',
        risks: ['Need to unveil correctly', 'Limited options'],
      });

      requiredCurrency['Veiled Orb'] = 2;
    }

    // Sacred Orb for perfect base percentile
    steps.push({
      method: 'sacred',
      currency: 'Sacred Orb',
      cost: this.getCurrencyPrice('Sacred Orb'),
      successRate: 0.1,
      expectedAttempts: 5,
      expectedCost: 5 * this.getCurrencyPrice('Sacred Orb'),
      description: 'Perfect the base item percentile with Sacred Orbs',
      risks: ['Extremely expensive', 'Minimal impact'],
    });

    requiredCurrency['Sacred Orb'] = 5;

    // Divine for perfect rolls
    const divineCount = 10;
    steps.push({
      method: 'divine_perfect',
      currency: 'Divine Orb',
      cost: CURRENCY_PRICES['Divine Orb'],
      successRate: 0.9,
      expectedAttempts: divineCount,
      expectedCost: divineCount * CURRENCY_PRICES['Divine Orb'],
      description: 'Divine Orbs for near-perfect roll values',
      risks: ['Diminishing returns'],
    });

    requiredCurrency['Divine Orb'] = divineCount;

    const totalCost = steps.reduce((sum, step) => sum + step.expectedCost, 0);

    return {
      strategy: 'expensive',
      steps,
      totalExpectedCost: totalCost,
      successProbability: this.calculateOverallSuccess(steps),
      timeEstimate: '1-2 hours',
      difficulty: 'hard',
      requiredCurrency,
    };
  }

  /**
   * Helper methods for calculating probabilities
   */

  private calculateChaosSuccessRate(): number {
    // Calculate probability of hitting desired mods with chaos spam
    const totalWeight = 10000; // Approximate total mod weight pool
    const desiredWeight = this.desiredMods.reduce((sum, mod) => sum + mod.weight, 0);

    // Probability of hitting at least 2 desired mods
    const singleModChance = desiredWeight / totalWeight;
    const twoModChance = Math.pow(singleModChance, 2) * 0.3; // Simplified calculation

    return Math.min(twoModChance, 0.01); // Cap at 1% for chaos spam
  }

  private calculateEssenceSuccessRate(essenceMods: DesiredMod[]): number {
    // Essence guarantees one mod, calculate chance for others
    const guaranteedMods = essenceMods.length;
    const remainingMods = this.desiredMods.length - guaranteedMods;

    if (remainingMods === 0) return 1;

    const totalWeight = 8000; // Reduced pool due to essence
    const remainingWeight = this.desiredMods
      .filter(m => !essenceMods.includes(m))
      .reduce((sum, mod) => sum + mod.weight, 0);

    return Math.min((remainingWeight / totalWeight) * 0.5, 0.15);
  }

  private calculateOverallSuccess(steps: CraftingStep[]): number {
    // Calculate compound success probability
    return steps.reduce((prob, step) => prob * Math.pow(step.successRate, 0.5), 1);
  }

  private findEssenceMods(): DesiredMod[] {
    // Check if any desired mods can be guaranteed with essences
    return this.desiredMods.filter(mod => {
      // Simplified: assume life, res, and damage mods have essences
      const modText = (mod.stat || mod.name).toLowerCase();
      return modText.includes('life') ||
             modText.includes('resistance') ||
             modText.includes('damage');
    });
  }

  private determineBudgetEssenceTier(): string {
    const avgTier = this.desiredMods.reduce((sum, mod) => sum + mod.tier, 0) / this.desiredMods.length;
    if (avgTier <= 3) return 'High';
    if (avgTier <= 5) return 'Mid';
    return 'Low';
  }

  private needsGoodRolls(): boolean {
    // Check if the desired mods need high roll values
    return this.desiredMods.some(mod => mod.tier <= 2);
  }

  private hasElevatableMods(): boolean {
    // Check if we have influenced mods that can be elevated
    return this.desiredMods.some(mod => mod.tier === 1);
  }

  private needsVeiledMods(): boolean {
    // Check if build would benefit from veiled mods
    return this.desiredMods.length < 4; // Room for veiled mods
  }

  /**
   * Calculate success rates for specific mod combinations
   */
  calculateModCombinationOdds(): { [key: string]: number } {
    const odds: { [key: string]: number } = {};

    // Calculate odds for each desired mod
    this.desiredMods.forEach(mod => {
      const totalWeight = 10000; // Approximate
      odds[mod.name] = mod.weight / totalWeight;
    });

    // Calculate odds for combinations
    if (this.desiredMods.length >= 2) {
      const combo2 = this.desiredMods.slice(0, 2);
      odds['First 2 mods'] = combo2.reduce((p, m) => p * (m.weight / 10000), 1);
    }

    if (this.desiredMods.length >= 3) {
      const combo3 = this.desiredMods.slice(0, 3);
      odds['First 3 mods'] = combo3.reduce((p, m) => p * (m.weight / 10000), 1);
    }

    odds['All desired mods'] = this.desiredMods.reduce((p, m) => p * (m.weight / 10000), 1);

    return odds;
  }

  /**
   * Optimize path based on market prices
   */
  optimizeForMarket(marketPrices?: { [key: string]: number }): CraftingPath {
    if (marketPrices) {
      // Update custom prices with market data
      this.customPrices = { ...this.customPrices, ...marketPrices };
    }

    const paths = this.calculatePaths();

    // Find the most cost-effective path
    const pathArray = [paths.budget, paths.medium, paths.expensive];
    const bestPath = pathArray.reduce((best, current) => {
      const efficiency = current.successProbability / current.totalExpectedCost;
      const bestEfficiency = best.successProbability / best.totalExpectedCost;
      return efficiency > bestEfficiency ? current : best;
    });

    return bestPath;
  }
}