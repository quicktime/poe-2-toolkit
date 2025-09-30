/**
 * POE2 Crafting Route Calculator
 * Analyzes and calculates optimal crafting routes based on desired modifiers
 */

export interface CraftingMethod {
  name: string;
  description: string;
  avgCost: number;
  successRate: number;
  steps: CraftingStep[];
  requirements?: string[];
  pros: string[];
  cons: string[];
}

export interface CraftingStep {
  action: string;
  item: string;
  quantity: number;
  costPerItem: number;
  successChance: number;
  description: string;
  optional?: boolean;
}

export interface ModifierTarget {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  tier: number;
  weight: number;
  tags: string[];
}

export interface CurrencyPrices {
  exalted: 1;
  divine: 380;
  chaos: 0.083;  // 1/12
  annulment: 45;
  regal: 8;
  alchemy: 3;
  alteration: 0.01;
  augmentation: 0.02;
  transmutation: 0.005;
  scouring: 2;
  blessed: 0.5;
  // Essences
  shrieking_essence: 15;
  deafening_essence: 30;
  // Omens
  omen_amelioration: 190;
  omen_annulment: 100;
  omen_corruption: 150;
  omen_recombination: 200;
  omen_whittling: 80;
  // Others
  vaal: 1;
  chromatic: 0.1;
  jeweller: 0.05;
  fusing: 0.5;
}

export class CraftingCalculator {
  private currencyPrices: CurrencyPrices = {
    exalted: 1,
    divine: 380,
    chaos: 0.083,
    annulment: 45,
    regal: 8,
    alchemy: 3,
    alteration: 0.01,
    augmentation: 0.02,
    transmutation: 0.005,
    scouring: 2,
    blessed: 0.5,
    shrieking_essence: 15,
    deafening_essence: 30,
    omen_amelioration: 190,
    omen_annulment: 100,
    omen_corruption: 150,
    omen_recombination: 200,
    omen_whittling: 80,
    vaal: 1,
    chromatic: 0.1,
    jeweller: 0.05,
    fusing: 0.5
  };

  constructor(customPrices?: Partial<CurrencyPrices>) {
    if (customPrices) {
      this.currencyPrices = { ...this.currencyPrices, ...customPrices };
    }
  }

  /**
   * Calculate optimal crafting routes for given modifiers
   */
  calculateRoutes(
    itemBase: string,
    desiredPrefixes: ModifierTarget[],
    desiredSuffixes: ModifierTarget[],
    itemLevel: number = 85
  ): CraftingMethod[] {
    const routes: CraftingMethod[] = [];
    const totalWeight = this.calculateTotalWeight(desiredPrefixes, desiredSuffixes);
    
    // Method 1: Essence Crafting (if applicable)
    const essenceRoute = this.calculateEssenceRoute(desiredPrefixes, desiredSuffixes, totalWeight);
    if (essenceRoute) routes.push(essenceRoute);
    
    // Method 2: Alt-Regal-Exalt
    routes.push(this.calculateAltRegalRoute(desiredPrefixes, desiredSuffixes, totalWeight));
    
    // Method 3: Chaos Spam
    routes.push(this.calculateChaosSpamRoute(desiredPrefixes, desiredSuffixes, totalWeight));
    
    // Method 4: Omen Crafting
    routes.push(this.calculateOmenRoute(desiredPrefixes, desiredSuffixes, totalWeight));
    
    // Method 5: Recombinator (if 2+ desired mods)
    if (desiredPrefixes.length + desiredSuffixes.length >= 2) {
      routes.push(this.calculateRecombinatorRoute(desiredPrefixes, desiredSuffixes, totalWeight));
    }
    
    // Sort by average cost
    return routes.sort((a, b) => a.avgCost - b.avgCost);
  }

  /**
   * Calculate total modifier weight for probability calculations
   */
  private calculateTotalWeight(prefixes: ModifierTarget[], suffixes: ModifierTarget[]): number {
    // Simplified - in reality, would need full mod pool weights
    const avgPrefixWeight = 1000;
    const avgSuffixWeight = 1000;
    
    const prefixHitChance = prefixes.reduce((sum, mod) => sum + (mod.weight / avgPrefixWeight), 0);
    const suffixHitChance = suffixes.reduce((sum, mod) => sum + (mod.weight / avgSuffixWeight), 0);
    
    return (prefixHitChance * suffixHitChance * 100);
  }

  /**
   * Essence Crafting Method
   */
  private calculateEssenceRoute(
    prefixes: ModifierTarget[],
    suffixes: ModifierTarget[],
    totalWeight: number
  ): CraftingMethod | null {
    // Check if any desired mod can be guaranteed with essence
    const essenceMod = prefixes.find(p => p.tags?.includes('essence')) || 
                       suffixes.find(s => s.tags?.includes('essence'));
    
    if (!essenceMod && prefixes.length === 0) return null;
    
    const essenceType = 'shrieking_essence';
    const essencePrice = this.currencyPrices[essenceType];
    const attempts = Math.ceil(100 / totalWeight);
    
    return {
      name: 'Essence Crafting',
      description: 'Use essences to guarantee one modifier and roll for others',
      avgCost: attempts * essencePrice + (attempts * 0.3 * this.currencyPrices.annulment),
      successRate: Math.min(25, totalWeight),
      steps: [
        {
          action: 'Prepare Base',
          item: 'Base Item',
          quantity: 1,
          costPerItem: 5,
          successChance: 100,
          description: 'Get a high item level base (85+)'
        },
        {
          action: 'Essence Spam',
          item: essenceType,
          quantity: attempts,
          costPerItem: essencePrice,
          successChance: totalWeight,
          description: `Spam ${essenceType} until hitting desired mods (~${attempts} attempts)`
        },
        {
          action: 'Annul Bad Mods',
          item: 'annulment',
          quantity: 2,
          costPerItem: this.currencyPrices.annulment,
          successChance: 66,
          description: 'Remove unwanted modifiers if necessary',
          optional: true
        },
        {
          action: 'Benchcraft',
          item: 'exalted',
          quantity: 1,
          costPerItem: this.currencyPrices.exalted,
          successChance: 100,
          description: 'Craft missing modifier at bench'
        }
      ],
      pros: [
        'Guarantees at least one desired modifier',
        'Relatively deterministic',
        'Good for SSF'
      ],
      cons: [
        'Can be expensive if unlucky',
        'Limited to essence modifiers',
        'May need annulments'
      ]
    };
  }

  /**
   * Alt-Regal-Exalt Method
   */
  private calculateAltRegalRoute(
    prefixes: ModifierTarget[],
    suffixes: ModifierTarget[],
    totalWeight: number
  ): CraftingMethod {
    const altWeight = Math.max(...[...prefixes, ...suffixes].map(m => m.weight));
    const altAttempts = Math.ceil(1000 / altWeight);
    
    return {
      name: 'Alt-Regal-Exalt',
      description: 'Traditional crafting method using alterations and regals',
      avgCost: (altAttempts * this.currencyPrices.alteration) + 
               (5 * this.currencyPrices.augmentation) +
               this.currencyPrices.regal +
               (3 * this.currencyPrices.exalted),
      successRate: Math.min(15, totalWeight * 0.5),
      steps: [
        {
          action: 'Alt Spam',
          item: 'alteration',
          quantity: altAttempts,
          costPerItem: this.currencyPrices.alteration,
          successChance: altWeight / 10,
          description: `Roll for T1/T2 prefix or suffix (~${altAttempts} alts)`
        },
        {
          action: 'Augment',
          item: 'augmentation',
          quantity: 5,
          costPerItem: this.currencyPrices.augmentation,
          successChance: 30,
          description: 'Add second modifier if needed',
          optional: true
        },
        {
          action: 'Regal',
          item: 'regal',
          quantity: 1,
          costPerItem: this.currencyPrices.regal,
          successChance: 100,
          description: 'Upgrade to rare item'
        },
        {
          action: 'Multimod',
          item: 'exalted',
          quantity: 3,
          costPerItem: this.currencyPrices.exalted,
          successChance: 100,
          description: 'Craft multiple modifiers',
          optional: true
        }
      ],
      pros: [
        'Very controlled process',
        'Can target specific mods',
        'Lower risk'
      ],
      cons: [
        'Time consuming',
        'Limited to 3-4 good mods',
        'Expensive multimod'
      ]
    };
  }

  /**
   * Chaos Spam Method
   */
  private calculateChaosSpamRoute(
    prefixes: ModifierTarget[],
    suffixes: ModifierTarget[],
    totalWeight: number
  ): CraftingMethod {
    const chaosAttempts = Math.ceil(10000 / totalWeight);
    
    return {
      name: 'Chaos Spam',
      description: 'Reroll with chaos orbs until hitting desired combination',
      avgCost: chaosAttempts * this.currencyPrices.chaos + this.currencyPrices.divine,
      successRate: Math.min(5, totalWeight * 0.1),
      steps: [
        {
          action: 'Chaos Spam',
          item: 'chaos',
          quantity: chaosAttempts,
          costPerItem: this.currencyPrices.chaos,
          successChance: totalWeight / 100,
          description: `Reroll until desired mods (~${chaosAttempts} chaos)`
        },
        {
          action: 'Divine',
          item: 'divine',
          quantity: 1,
          costPerItem: this.currencyPrices.divine,
          successChance: 50,
          description: 'Perfect the rolls',
          optional: true
        }
      ],
      pros: [
        'Simple method',
        'Can hit all 6 mods',
        'No complex steps'
      ],
      cons: [
        'Very RNG dependent',
        'Can be very expensive',
        'Low success rate'
      ]
    };
  }

  /**
   * Omen Crafting Method
   */
  private calculateOmenRoute(
    prefixes: ModifierTarget[],
    suffixes: ModifierTarget[],
    totalWeight: number
  ): CraftingMethod {
    return {
      name: 'Omen of Amelioration',
      description: 'Use omens to upgrade and manipulate modifiers',
      avgCost: this.currencyPrices.omen_amelioration * 2 + 
               this.currencyPrices.regal +
               this.currencyPrices.exalted * 2,
      successRate: Math.min(20, totalWeight * 0.8),
      steps: [
        {
          action: 'Get Base Mods',
          item: 'alteration',
          quantity: 50,
          costPerItem: this.currencyPrices.alteration,
          successChance: 50,
          description: 'Roll for decent base mods'
        },
        {
          action: 'Regal',
          item: 'regal',
          quantity: 1,
          costPerItem: this.currencyPrices.regal,
          successChance: 100,
          description: 'Make rare'
        },
        {
          action: 'Omen of Amelioration',
          item: 'omen_amelioration',
          quantity: 2,
          costPerItem: this.currencyPrices.omen_amelioration,
          successChance: 35,
          description: 'Upgrade modifier tiers'
        },
        {
          action: 'Fill Affixes',
          item: 'exalted',
          quantity: 2,
          costPerItem: this.currencyPrices.exalted,
          successChance: 30,
          description: 'Add remaining modifiers'
        }
      ],
      pros: [
        'Can upgrade existing mods',
        'More deterministic than chaos',
        'Good success rate'
      ],
      cons: [
        'Omens are expensive',
        'Limited availability',
        'Requires good base'
      ]
    };
  }

  /**
   * Recombinator Method
   */
  private calculateRecombinatorRoute(
    prefixes: ModifierTarget[],
    suffixes: ModifierTarget[],
    totalWeight: number
  ): CraftingMethod {
    return {
      name: 'Recombination',
      description: 'Combine two items to merge their modifiers',
      avgCost: this.currencyPrices.omen_recombination * 3 + 
               this.currencyPrices.alteration * 200 +
               this.currencyPrices.regal * 6,
      successRate: Math.min(30, totalWeight),
      steps: [
        {
          action: 'Craft Base 1',
          item: 'alteration',
          quantity: 100,
          costPerItem: this.currencyPrices.alteration,
          successChance: 40,
          description: 'Create first item with 2-3 desired mods'
        },
        {
          action: 'Craft Base 2',
          item: 'alteration',
          quantity: 100,
          costPerItem: this.currencyPrices.alteration,
          successChance: 40,
          description: 'Create second item with other desired mods'
        },
        {
          action: 'Recombinate',
          item: 'omen_recombination',
          quantity: 3,
          costPerItem: this.currencyPrices.omen_recombination,
          successChance: 35,
          description: 'Combine items (may take multiple attempts)'
        },
        {
          action: 'Finish Item',
          item: 'exalted',
          quantity: 1,
          costPerItem: this.currencyPrices.exalted,
          successChance: 100,
          description: 'Benchcraft final modifier'
        }
      ],
      requirements: [
        'Need 2+ desired modifiers',
        'Access to recombinators'
      ],
      pros: [
        'Can combine exclusive mods',
        'Higher chance for multiple desired mods',
        'Can transfer influenced mods'
      ],
      cons: [
        'Very expensive',
        'Can brick items',
        'Requires two good bases'
      ]
    };
  }

  /**
   * Calculate success probability for hitting specific modifiers
   */
  calculateSuccessProbability(
    modifiers: ModifierTarget[],
    method: 'chaos' | 'essence' | 'alt' | 'omen'
  ): number {
    let baseProbability = 1;
    
    for (const mod of modifiers) {
      const modProbability = mod.weight / 1000; // Simplified calculation
      
      switch (method) {
        case 'chaos':
          baseProbability *= modProbability * 0.1;
          break;
        case 'essence':
          baseProbability *= modProbability * 0.3;
          break;
        case 'alt':
          baseProbability *= modProbability * 0.5;
          break;
        case 'omen':
          baseProbability *= modProbability * 0.4;
          break;
      }
    }
    
    return Math.min(100, baseProbability * 100);
  }

  /**
   * Update currency prices from market data
   */
  updatePrices(marketData: Partial<CurrencyPrices>) {
    this.currencyPrices = { ...this.currencyPrices, ...marketData };
  }
}