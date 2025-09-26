/**
 * Generates personalized crafting strategies for specific items
 */

import { CraftingMaterial } from './simpleCraftingCalculator';

export interface ItemGoal {
  itemBase: string;
  itemType: string;
  category: string;
  targetMods: string[];
  currentState?: 'white' | 'magic' | 'rare';
  currentMods?: string[];
  budget?: number;
  league?: string;
}

export interface CraftingStep {
  step: number;
  action: string;
  currency: string;
  quantity: number;
  cost: number;
  explanation: string;
  warning?: string;
  tip?: string;
  successChance?: string;
}

export interface PersonalizedStrategy {
  item: string;
  goal: string[];
  estimatedCost: number;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  steps: CraftingStep[];
  materials: CraftingMaterial[];
  alternativeStrategies?: {
    name: string;
    cost: number;
    reason: string;
  }[];
}

export class CraftingStrategyGenerator {
  /**
   * Generate personalized crafting steps for user's specific item
   */
  generateStrategy(goal: ItemGoal, prices: Map<string, number>): PersonalizedStrategy {
    const { itemBase, itemType, category, targetMods, currentState = 'white', budget = 1000 } = goal;

    // Determine best strategy based on item and goals
    const strategy = this.determineBestStrategy(goal, prices);

    // Generate step-by-step instructions
    const steps = this.generateSteps(goal, strategy, prices);

    // Calculate materials needed
    const materials = this.calculateMaterials(steps, prices);

    // Calculate total cost
    const estimatedCost = materials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0);

    return {
      item: `${itemType} ${itemBase}`,
      goal: targetMods,
      estimatedCost,
      estimatedTime: this.estimateTime(steps),
      difficulty: this.calculateDifficulty(strategy, steps),
      steps,
      materials,
      alternativeStrategies: this.getAlternatives(goal, strategy, prices)
    };
  }

  private determineBestStrategy(goal: ItemGoal, prices: Map<string, number>): string {
    const { targetMods, currentState, budget = 1000 } = goal;

    // For white items with low budget
    if (currentState === 'white' && budget < 10) {
      return 'alchemy_and_go';
    }

    // For white items with specific targets
    if (currentState === 'white' && targetMods.length > 0) {
      if (targetMods.some(mod => mod.includes('life') || mod.includes('resistance'))) {
        return 'essence_spam';
      }
      if (targetMods.length === 1) {
        return 'alteration_regal';
      }
      return 'chaos_spam';
    }

    // For rare items needing improvement
    if (currentState === 'rare') {
      const hasGoodMods = goal.currentMods && goal.currentMods.length >= 3;
      if (hasGoodMods && targetMods.length === 1) {
        return 'exalt_finish';
      }
      if (hasGoodMods && targetMods.length === 2) {
        return 'multimod_craft';
      }
      return 'chaos_reroll';
    }

    // For high-end crafting
    if (budget > 500) {
      if (targetMods.length >= 4) {
        return 'metacraft_perfect';
      }
      return 'fossil_targeted';
    }

    return 'chaos_spam';
  }

  private generateSteps(goal: ItemGoal, strategy: string, prices: Map<string, number>): CraftingStep[] {
    const steps: CraftingStep[] = [];

    switch (strategy) {
      case 'alchemy_and_go':
        return this.generateAlchemySteps(goal, prices);
      case 'essence_spam':
        return this.generateEssenceSteps(goal, prices);
      case 'alteration_regal':
        return this.generateAltRegSteps(goal, prices);
      case 'chaos_spam':
        return this.generateChaosSteps(goal, prices);
      case 'exalt_finish':
        return this.generateExaltSteps(goal, prices);
      case 'multimod_craft':
        return this.generateMultimodSteps(goal, prices);
      case 'chaos_reroll':
        return this.generateChaosRerollSteps(goal, prices);
      case 'metacraft_perfect':
        return this.generateMetacraftSteps(goal, prices);
      case 'fossil_targeted':
        return this.generateFossilSteps(goal, prices);
      default:
        return this.generateGenericSteps(goal, prices);
    }
  }

  private generateAlchemySteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const alchemyPrice = prices.get('alchemy-orb') || 0.1;
    const greaterPrice = prices.get('greater-alchemy-orb') || 10;
    const perfectPrice = prices.get('perfect-alchemy-orb') || 50;

    const tier = goal.budget && goal.budget > 100 ?
      (goal.budget > 500 ? 'perfect' : 'greater') : 'regular';

    const currency = tier === 'perfect' ? 'Perfect Alchemy Orb' :
                     tier === 'greater' ? 'Greater Alchemy Orb' :
                     'Alchemy Orb';

    const price = tier === 'perfect' ? perfectPrice :
                  tier === 'greater' ? greaterPrice :
                  alchemyPrice;

    return [
      {
        step: 1,
        action: 'Verify item is white (normal)',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Check that your ${goal.itemBase} is white/normal rarity. Look for white text on the item name.`,
        warning: 'Cannot use Alchemy on magic or rare items!'
      },
      {
        step: 2,
        action: `Apply ${currency}`,
        currency,
        quantity: 1,
        cost: price,
        explanation: `Right-click the ${currency} in your inventory, then left-click on the white ${goal.itemBase}. This will transform it into a rare item with exactly 4 random modifiers.`,
        tip: tier === 'perfect' ? 'Perfect guarantees T1-T2 modifiers' :
             tier === 'greater' ? 'Greater gives better tier modifiers' :
             'Regular gives standard modifiers',
        successChance: 'Guaranteed rare with 4 mods'
      },
      {
        step: 3,
        action: 'Evaluate the result',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: 'Check if any of the 4 modifiers match your goals. Hold Alt to see tier information.',
        tip: 'If bad, you need a new white base to try again (no Scouring in PoE2!)'
      },
      {
        step: 4,
        action: 'Repeat if needed',
        currency,
        quantity: 5,
        cost: price * 5,
        explanation: `If the modifiers don't meet your needs, you'll need to get another white ${goal.itemBase} and try again. Budget for 5-10 attempts on average.`,
        warning: 'Each attempt requires a new white base item!'
      }
    ];
  }

  private generateEssenceSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    // Determine which essence to use based on target mods
    const essenceType = this.determineEssenceType(goal.targetMods);
    const essencePrice = prices.get(essenceType) || 5;

    return [
      {
        step: 1,
        action: 'Obtain the right Essence',
        currency: essenceType,
        quantity: 10,
        cost: essencePrice * 10,
        explanation: `Purchase ${essenceType} from trade. This essence guarantees "${goal.targetMods[0]}" modifier.`,
        tip: 'Deafening essences give the highest values'
      },
      {
        step: 2,
        action: 'Prepare your base item',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Get a high item level ${goal.itemBase} (ilvl 75+ recommended). Can be white or rare.`,
        warning: 'Using on rare completely rerolls ALL modifiers!'
      },
      {
        step: 3,
        action: `Apply ${essenceType}`,
        currency: essenceType,
        quantity: 1,
        cost: essencePrice,
        explanation: `Right-click the essence, then left-click your ${goal.itemBase}. This guarantees "${goal.targetMods[0]}" plus 3-5 random modifiers.`,
        successChance: '100% for guaranteed mod, RNG for others'
      },
      {
        step: 4,
        action: 'Check additional modifiers',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: 'Evaluate if the random modifiers complement your guaranteed modifier.',
        tip: 'Look for synergistic mods like resistances with life'
      },
      {
        step: 5,
        action: 'Repeat essence spam',
        currency: essenceType,
        quantity: 9,
        cost: essencePrice * 9,
        explanation: 'Keep applying essences until you get good complementary modifiers. Average 5-15 attempts.',
        tip: 'Set a limit - if no success after 20 tries, consider alternative methods'
      }
    ];
  }

  private generateChaosSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const chaosPrice = prices.get('chaos-orb') || 0.5;
    const greaterPrice = prices.get('greater-chaos-orb') || 8;

    if (goal.currentState === 'white') {
      // Need to make it rare first
      return [
        {
          step: 1,
          action: 'Make item rare first',
          currency: 'Alchemy Orb',
          quantity: 1,
          cost: prices.get('alchemy-orb') || 0.1,
          explanation: `Use an Alchemy Orb to turn your white ${goal.itemBase} into a rare item first.`,
          warning: 'Chaos Orbs only work on rare items!'
        },
        ...this.generateChaosSpamSteps(goal, prices, 2)
      ];
    }

    return this.generateChaosSpamSteps(goal, prices, 1);
  }

  private generateChaosSpamSteps(goal: ItemGoal, prices: Map<string, number>, startStep: number): CraftingStep[] {
    const chaosPrice = prices.get('chaos-orb') || 0.5;
    const steps: CraftingStep[] = [];

    steps.push({
      step: startStep,
      action: 'Identify modifiers to replace',
      currency: 'None',
      quantity: 0,
      cost: 0,
      explanation: `Examine your ${goal.itemBase} and identify which modifiers you want to change. In PoE2, Chaos swaps ONE random modifier.`,
      warning: 'You cannot choose which modifier gets replaced!'
    });

    steps.push({
      step: startStep + 1,
      action: 'Apply Chaos Orb',
      currency: 'Chaos Orb',
      quantity: 1,
      cost: chaosPrice,
      explanation: `Right-click Chaos Orb, left-click your rare ${goal.itemBase}. One random modifier will be replaced with a new random one.`,
      tip: 'Better odds when item has more bad mods than good',
      successChance: `1/${goal.currentMods?.length || 6} chance to replace the bad mod`
    });

    steps.push({
      step: startStep + 2,
      action: 'Evaluate the change',
      currency: 'None',
      quantity: 0,
      cost: 0,
      explanation: 'Check if the new modifier is better than what was replaced.',
      warning: 'You might lose a good modifier!'
    });

    steps.push({
      step: startStep + 3,
      action: 'Continue chaos spam',
      currency: 'Chaos Orb',
      quantity: 20,
      cost: chaosPrice * 20,
      explanation: `Keep using Chaos Orbs until you get desired modifiers. Budget for 20-50 attempts for specific mods.`,
      tip: 'Stop if you get 4+ good mods, finish with Exalted'
    });

    return steps;
  }

  private generateExaltSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const exaltPrice = prices.get('exalted-orb') || 1;
    const greaterPrice = prices.get('greater-exalted-orb') || 20;

    return [
      {
        step: 1,
        action: 'Verify open modifier slots',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Check your ${goal.itemBase} has open slots. Rare items can have up to 3 prefixes and 3 suffixes (6 total).`,
        tip: 'Hold Alt to see if mods are prefix or suffix'
      },
      {
        step: 2,
        action: 'Check modifier pool',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Research what modifiers are possible for your ${goal.itemBase} at its item level using poedb or similar.`,
        tip: 'Higher item level = more possible mods'
      },
      {
        step: 3,
        action: 'Apply Exalted Orb',
        currency: goal.budget && goal.budget > 100 ? 'Greater Exalted Orb' : 'Exalted Orb',
        quantity: 1,
        cost: goal.budget && goal.budget > 100 ? greaterPrice : exaltPrice,
        explanation: `Right-click Exalted Orb, left-click your ${goal.itemBase}. Adds one random modifier from available pool.`,
        successChance: 'Depends on mod weights in the pool',
        warning: 'Cannot be undone except with Annulment (risky!)'
      },
      {
        step: 4,
        action: 'Repeat for remaining slots',
        currency: 'Exalted Orb',
        quantity: 2,
        cost: exaltPrice * 2,
        explanation: 'If you have more open slots and the added modifier was good, continue adding.',
        tip: 'Stop when item is "good enough" - perfection is expensive'
      }
    ];
  }

  private generateMultimodSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const divinePrice = prices.get('divine-orb') || 50;

    return [
      {
        step: 1,
        action: 'Unlock crafting recipes',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: 'Ensure you have "Can have multiple crafted modifiers" unlocked from betrayal or other sources.',
        warning: 'This is an expensive endgame craft!'
      },
      {
        step: 2,
        action: 'Verify item has 3 or fewer modifiers',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Your ${goal.itemBase} needs room for multimod (1 slot) plus crafted mods (2+ slots).`,
        tip: 'Best with 2-3 perfect natural mods'
      },
      {
        step: 3,
        action: 'Craft "Can have multiple crafted modifiers"',
        currency: 'Divine Orb',
        quantity: 2,
        cost: divinePrice * 2,
        explanation: 'Go to crafting bench, select the multimod craft (costs 2 Divine Orbs = 100 Exalted).',
        warning: 'This takes up one modifier slot!'
      },
      {
        step: 4,
        action: 'Add crafted modifiers',
        currency: 'Exalted Orb',
        quantity: 10,
        cost: 10,
        explanation: 'Now craft 2-3 additional modifiers from bench. Each costs 1-5 Exalted depending on the mod.',
        tip: 'Choose mods that complement your natural ones'
      }
    ];
  }

  private generateChaosRerollSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    return [
      {
        step: 1,
        action: 'Decide: Improve or Start Over',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Your rare ${goal.itemBase} needs work. In PoE2, Chaos only swaps ONE mod, so decide if it's worth improving.`,
        tip: 'If 3+ bad mods, consider starting fresh with essences'
      },
      ...this.generateChaosSpamSteps(goal, prices, 2)
    ];
  }

  private generateMetacraftSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const divinePrice = prices.get('divine-orb') || 50;

    return [
      {
        step: 1,
        action: 'Get perfect prefixes or suffixes',
        currency: 'Various',
        quantity: 1,
        cost: 100,
        explanation: `Use alteration, regal, or essence to get perfect prefixes OR suffixes on your ${goal.itemBase}.`,
        tip: 'Usually easier to get perfect prefixes first'
      },
      {
        step: 2,
        action: 'Craft "Prefixes/Suffixes Cannot Be Changed"',
        currency: 'Divine Orb',
        quantity: 2,
        cost: divinePrice * 2,
        explanation: 'At crafting bench, apply the appropriate metamod. This protects your good modifiers.',
        warning: 'Costs 2 Divine Orbs (100 Exalted)!'
      },
      {
        step: 3,
        action: 'Reroll the other half',
        currency: 'Chaos Orb',
        quantity: 50,
        cost: 25,
        explanation: 'Use Chaos Orbs - they will only affect the unprotected modifiers.',
        tip: 'In PoE2, this is safer since Chaos only swaps one mod'
      },
      {
        step: 4,
        action: 'Remove metamod',
        currency: 'Crafting Bench',
        quantity: 1,
        cost: 1,
        explanation: 'Once satisfied, remove the metamod at bench to free the slot.',
        warning: 'Or risk Annulment but might remove good mods'
      },
      {
        step: 5,
        action: 'Finish with Exalted or bench craft',
        currency: 'Exalted Orb',
        quantity: 2,
        cost: 2,
        explanation: 'Add final modifiers with Exalted Orbs or bench crafts.',
        tip: 'Bench crafts are deterministic but weaker'
      }
    ];
  }

  private generateFossilSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const fossilType = this.determineFossilType(goal.targetMods);
    const fossilPrice = prices.get(fossilType) || 10;
    const resonatorPrice = prices.get('potent-resonator') || 5;

    return [
      {
        step: 1,
        action: 'Buy fossils and resonators',
        currency: fossilType,
        quantity: 20,
        cost: fossilPrice * 20 + resonatorPrice * 20,
        explanation: `Purchase ${fossilType} and Potent Resonators from trade. Fossils weight the modifier pool.`,
        tip: 'Bulk buying is usually cheaper'
      },
      {
        step: 2,
        action: 'Socket fossil in resonator',
        currency: 'Potent Resonator',
        quantity: 1,
        cost: 0,
        explanation: `Right-click ${fossilType}, then left-click on Potent Resonator to socket it.`,
        tip: 'Can use multiple fossils in Powerful Resonators'
      },
      {
        step: 3,
        action: 'Apply to item',
        currency: 'Socketed Resonator',
        quantity: 1,
        cost: 0,
        explanation: `Right-click the socketed resonator, left-click your ${goal.itemBase}. This rerolls with weighted mods.`,
        warning: 'Completely rerolls the item!'
      },
      {
        step: 4,
        action: 'Repeat fossil crafting',
        currency: fossilType,
        quantity: 19,
        cost: 0,
        explanation: 'Continue until you get desired combination. Fossils increase chances but do not guarantee.',
        tip: `${fossilType} increases weight of ${goal.targetMods[0]} mods`
      }
    ];
  }

  private generateGenericSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    return [
      {
        step: 1,
        action: 'Analyze your starting point',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Examine your ${goal.itemBase} and determine the best path forward.`,
        tip: 'Consider current state and target modifiers'
      }
    ];
  }

  private generateAltRegSteps(goal: ItemGoal, prices: Map<string, number>): CraftingStep[] {
    const altPrice = prices.get('orb-of-alteration') || 0.05;
    const augPrice = prices.get('orb-of-augmentation') || 0.05;
    const regalPrice = prices.get('regal-orb') || 0.3;

    return [
      {
        step: 1,
        action: 'Start with white base',
        currency: 'None',
        quantity: 0,
        cost: 0,
        explanation: `Ensure your ${goal.itemBase} is white (normal) rarity.`,
        warning: 'This method only works starting from white items'
      },
      {
        step: 2,
        action: 'Transmute to magic',
        currency: 'Orb of Transmutation',
        quantity: 1,
        cost: 0.01,
        explanation: 'Use Orb of Transmutation to make the item magic (blue) with 1-2 modifiers.',
        tip: 'Now you can use Alterations'
      },
      {
        step: 3,
        action: 'Roll for desired modifier',
        currency: 'Orb of Alteration',
        quantity: 50,
        cost: altPrice * 50,
        explanation: `Use Alterations to reroll until you get "${goal.targetMods[0]}". Each use gives 1-2 new mods.`,
        tip: 'Hold Alt to check modifier tiers',
        successChance: 'Varies by mod rarity, typically 1/20 to 1/100'
      },
      {
        step: 4,
        action: 'Augment if needed',
        currency: 'Orb of Augmentation',
        quantity: 1,
        cost: augPrice,
        explanation: 'If item has only 1 modifier, use Augmentation to add a second.',
        tip: 'Only works if item has 1 mod'
      },
      {
        step: 5,
        action: 'Regal to rare',
        currency: 'Regal Orb',
        quantity: 1,
        cost: regalPrice,
        explanation: 'Once you have 1-2 good modifiers, use Regal Orb to make it rare and add one more modifier.',
        warning: 'The added mod is random - might be bad'
      },
      {
        step: 6,
        action: 'Finish with Exalted',
        currency: 'Exalted Orb',
        quantity: 3,
        cost: 3,
        explanation: 'Add remaining modifiers with Exalted Orbs to fill the item.',
        tip: 'Can also use bench crafts for guaranteed weak mods'
      }
    ];
  }

  private calculateMaterials(steps: CraftingStep[], prices: Map<string, number>): CraftingMaterial[] {
    const materials = new Map<string, number>();

    // Aggregate all currency needs from steps
    steps.forEach(step => {
      if (step.currency !== 'None' && step.quantity > 0) {
        const current = materials.get(step.currency) || 0;
        materials.set(step.currency, current + step.quantity);
      }
    });

    // Convert to material array with prices
    return Array.from(materials.entries()).map(([currency, quantity]) => {
      const itemId = this.currencyToItemId(currency);
      const pricePerUnit = prices.get(itemId) || 0;

      return {
        itemId,
        quantity,
        pricePerUnit,
        totalCost: pricePerUnit * quantity
      };
    });
  }

  private currencyToItemId(currency: string): string {
    const mapping: Record<string, string> = {
      'Chaos Orb': 'chaos-orb',
      'Exalted Orb': 'exalted-orb',
      'Divine Orb': 'divine-orb',
      'Alchemy Orb': 'alchemy-orb',
      'Orb of Alteration': 'orb-of-alteration',
      'Orb of Augmentation': 'orb-of-augmentation',
      'Orb of Transmutation': 'orb-of-transmutation',
      'Regal Orb': 'regal-orb',
      'Annulment Orb': 'annulment-orb',
      'Greater Chaos Orb': 'greater-chaos-orb',
      'Greater Exalted Orb': 'greater-exalted-orb',
      'Greater Alchemy Orb': 'greater-alchemy-orb',
      'Perfect Chaos Orb': 'perfect-chaos-orb',
      'Perfect Exalted Orb': 'perfect-exalted-orb',
      'Perfect Alchemy Orb': 'perfect-alchemy-orb',
      'Potent Resonator': 'potent-resonator',
      'Powerful Resonator': 'powerful-resonator'
    };

    return mapping[currency] || currency.toLowerCase().replace(/\s+/g, '-');
  }

  private estimateTime(steps: CraftingStep[]): string {
    const totalAttempts = steps.reduce((sum, step) => sum + step.quantity, 0);

    if (totalAttempts < 10) return '5-10 minutes';
    if (totalAttempts < 50) return '15-30 minutes';
    if (totalAttempts < 100) return '30-60 minutes';
    return '1-2 hours';
  }

  private calculateDifficulty(strategy: string, steps: CraftingStep[]): 'Easy' | 'Medium' | 'Hard' | 'Expert' {
    if (strategy.includes('metacraft')) return 'Expert';
    if (strategy.includes('fossil') || strategy.includes('multimod')) return 'Hard';
    if (strategy.includes('chaos') || strategy.includes('essence')) return 'Medium';
    return 'Easy';
  }

  private getAlternatives(goal: ItemGoal, primaryStrategy: string, prices: Map<string, number>): { name: string; cost: number; reason: string; }[] {
    const alternatives = [];

    if (primaryStrategy !== 'essence_spam') {
      alternatives.push({
        name: 'Essence Spam',
        cost: (prices.get('essence-of-wrath') || 5) * 20,
        reason: 'Guarantees one modifier, good for life/resistance crafts'
      });
    }

    if (primaryStrategy !== 'fossil_targeted') {
      alternatives.push({
        name: 'Fossil Crafting',
        cost: (prices.get('pristine-fossil') || 10) * 30,
        reason: 'Weights modifier pool toward desired mods'
      });
    }

    if (primaryStrategy !== 'chaos_spam' && goal.budget && goal.budget < 50) {
      alternatives.push({
        name: 'Buy from Trade',
        cost: goal.budget,
        reason: 'Often cheaper than crafting for common items'
      });
    }

    return alternatives;
  }

  private determineEssenceType(targetMods: string[]): string {
    // Map target mods to essence types
    if (targetMods.some(mod => mod.toLowerCase().includes('life'))) {
      return 'essence-of-vitality';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('fire'))) {
      return 'essence-of-anger';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('cold'))) {
      return 'essence-of-hatred';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('lightning'))) {
      return 'essence-of-wrath';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('chaos'))) {
      return 'essence-of-envy';
    }

    return 'essence-of-greed'; // Generic default
  }

  private determineFossilType(targetMods: string[]): string {
    // Map target mods to fossil types
    if (targetMods.some(mod => mod.toLowerCase().includes('life'))) {
      return 'pristine-fossil';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('defense'))) {
      return 'dense-fossil';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('elemental'))) {
      return 'prismatic-fossil';
    }
    if (targetMods.some(mod => mod.toLowerCase().includes('physical'))) {
      return 'jagged-fossil';
    }

    return 'chaotic-fossil'; // Generic default
  }
}

export const craftingStrategy = new CraftingStrategyGenerator();