/**
 * Path of Exile 2 Crafting Optimizer
 * Uses pathfinding and genetic algorithms optimized for PoE 2 mechanics
 */

import {
  CraftingStrategy,
  CraftingStep,
  CraftingMethod,
  DesiredItem,
  RequiredModifier,
  ItemState,
  OptimizerConfig,
  CraftingCost
} from '@/types/crafting';
import { poe2CraftingKnowledge } from './poe2KnowledgeBase';
import { poe2CraftingSimulator } from './poe2Simulator';
import { craftingCostCalculator } from './costCalculator';

/**
 * Node in the crafting path tree
 */
interface CraftingNode {
  id: string;
  itemState: ItemState;
  method: CraftingMethod | null;
  cost: number;
  probability: number;
  depth: number;
  parent: CraftingNode | null;
  children: CraftingNode[];
  score: number;
}

/**
 * Path of Exile 2 Crafting Optimizer
 */
export class PoE2CraftingOptimizer {
  private maxDepth = 20;
  private maxBranches = 5;
  private populationSize = 100;
  private generations = 50;
  
  /**
   * Find optimal crafting strategy for PoE 2
   */
  async optimizeStrategy(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): Promise<CraftingStrategy[]> {
    // Generate multiple strategies using different algorithms
    const strategies: CraftingStrategy[] = [];
    
    // 1. Deterministic strategy (Runes + Essences)
    const deterministicStrategy = this.generateDeterministicStrategy(desiredItem, config);
    if (deterministicStrategy) strategies.push(deterministicStrategy);
    
    // 2. Budget strategy (using basic currency)
    const budgetStrategy = this.generateBudgetStrategy(desiredItem, config);
    if (budgetStrategy) strategies.push(budgetStrategy);
    
    // 3. Premium strategy (using tiered currency)
    const premiumStrategy = this.generatePremiumStrategy(desiredItem, config);
    if (premiumStrategy) strategies.push(premiumStrategy);
    
    // 4. Hybrid strategy (mix of methods)
    const hybridStrategy = await this.generateHybridStrategy(desiredItem, config);
    if (hybridStrategy) strategies.push(hybridStrategy);
    
    // 5. White base strategy (PoE 2 specific - white items are valuable)
    const whiteBaseStrategy = this.generateWhiteBaseStrategy(desiredItem, config);
    if (whiteBaseStrategy) strategies.push(whiteBaseStrategy);
    
    // Sort by optimization criteria
    return this.sortStrategies(strategies, config.optimizeFor);
  }
  
  /**
   * Generate deterministic strategy using Runes and Essences
   */
  private generateDeterministicStrategy(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): CraftingStrategy | null {
    const steps: CraftingStep[] = [];
    let stepNumber = 1;
    
    // Step 1: Start with white base (valuable in PoE 2)
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'acquire_white',
        name: 'Acquire White Base',
        type: 'vendor',
        description: 'Obtain or create white base item (valuable in PoE 2)',
        requirements: {},
        outcomes: [{ probability: 1, effect: 'White base item' }],
        cost: { currency: {}, averageTotal: 10 }
      },
      description: 'Acquire white base - these are rare and valuable in PoE 2',
      expectedCost: { currency: {}, expected: 10 },
      successProbability: 1,
      expectedAttempts: 1,
      materials: [],
      tips: ['White items cannot be created via scouring in PoE 2', 'Check vendors or find drops']
    });
    
    // Step 2: Apply Runes for guaranteed weak mods
    const runeMods = desiredItem.requiredMods.filter(m => 
      m.modText.includes('physical') || m.modText.includes('elemental')
    );
    
    for (const mod of runeMods.slice(0, 2)) {
      steps.push({
        stepNumber: stepNumber++,
        method: {
          id: `rune_${mod.modText}`,
          name: `Apply Rune for ${mod.modText}`,
          type: 'rune',
          description: 'Add guaranteed weak modifier',
          requirements: { openPrefixes: 1 },
          outcomes: [{ probability: 1, effect: 'Add rune modifier' }],
          cost: { currency: {}, averageTotal: 5 }
        },
        description: `Apply Rune with Soul Core for guaranteed ${mod.modText}`,
        expectedCost: { currency: {}, expected: 5 },
        successProbability: 1,
        expectedAttempts: 1,
        materials: [],
        tips: ['Runes provide weak but guaranteed modifiers']
      });
    }
    
    // Step 3: Use Essence for guaranteed mod
    if (desiredItem.requiredMods.some(m => m.modText.includes('damage'))) {
      steps.push({
        stepNumber: stepNumber++,
        method: {
          id: 'essence_damage',
          name: 'Normal Essence Application',
          type: 'essence',
          description: 'White → Magic with guaranteed damage mod',
          requirements: { itemRarity: 'normal' },
          outcomes: [{ probability: 1, effect: 'Guaranteed damage modifier' }],
          cost: { currency: {}, averageTotal: 3 }
        },
        description: 'Use Essence for guaranteed damage modifier',
        expectedCost: { currency: {}, expected: 3 },
        successProbability: 1,
        expectedAttempts: 1,
        materials: []
      });
      
      steps.push({
        stepNumber: stepNumber++,
        method: {
          id: 'greater_essence',
          name: 'Greater Essence Application',
          type: 'essence',
          description: 'Magic → Rare with high-tier guaranteed mod',
          requirements: { itemRarity: 'magic' },
          outcomes: [{ probability: 1, effect: 'Upgrade to rare with guaranteed mod' }],
          cost: { currency: {}, averageTotal: 20 }
        },
        description: 'Use Greater Essence to upgrade to rare',
        expectedCost: { currency: {}, expected: 20 },
        successProbability: 1,
        expectedAttempts: 1,
        materials: []
      });
    }
    
    return {
      id: 'deterministic_strategy',
      name: 'Deterministic Crafting (Runes + Essences)',
      description: 'Use guaranteed modifier methods for predictable results',
      targetItem: desiredItem,
      steps,
      totalCost: {
        expected: steps.reduce((sum, s) => sum + (s.expectedCost.expected || 0), 0),
        minimum: steps.reduce((sum, s) => sum + (s.expectedCost.expected || 0), 0),
        maximum: steps.reduce((sum, s) => sum + (s.expectedCost.expected || 0), 0),
        standardDeviation: 0
      },
      successProbability: 1,
      estimatedTime: 5,
      difficultyRating: 1
    };
  }
  
  /**
   * Generate budget strategy using basic currency
   */
  private generateBudgetStrategy(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): CraftingStrategy | null {
    const steps: CraftingStep[] = [];
    let stepNumber = 1;
    
    // Use Alchemy for 4-mod rare
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'alchemy_craft_poe2',
        name: 'Alchemy Orb (PoE 2)',
        type: 'basic_currency',
        description: 'Create rare with exactly 4 modifiers',
        requirements: { itemRarity: 'normal' },
        outcomes: [{ probability: 1, effect: 'Rare with 4 mods' }],
        cost: { currency: { alchemy: 1 }, averageTotal: 1.5 }
      },
      description: 'Use Alchemy Orb to create rare with 4 mods',
      expectedCost: { currency: { alchemy: 1 }, expected: 1.5 },
      successProbability: 0.01,
      expectedAttempts: 100,
      materials: []
    });
    
    // Chaos spam (PoE 2 version - single mod swap)
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'chaos_reroll_poe2',
        name: 'Chaos Orb Reroll (PoE 2)',
        type: 'basic_currency',
        description: 'Swap one modifier at a time',
        requirements: { itemRarity: 'rare' },
        outcomes: [{ probability: 1, effect: 'Replace one modifier' }],
        cost: { currency: { chaos: 1 }, averageTotal: 1 }
      },
      description: 'Use Chaos Orbs to swap unwanted mods (PoE 2: one at a time)',
      expectedCost: { currency: { chaos: 50 }, expected: 50 },
      successProbability: 0.001,
      expectedAttempts: 50,
      materials: [],
      tips: ['PoE 2 Chaos only swaps ONE mod at a time', 'Much slower than PoE 1']
    });
    
    return {
      id: 'budget_strategy',
      name: 'Budget Crafting (Basic Currency)',
      description: 'Use common currency for budget-friendly crafting',
      targetItem: desiredItem,
      steps,
      totalCost: {
        expected: 51.5,
        minimum: 10,
        maximum: 200,
        standardDeviation: 30
      },
      successProbability: 0.3,
      estimatedTime: 30,
      difficultyRating: 3
    };
  }
  
  /**
   * Generate premium strategy using tiered currency
   */
  private generatePremiumStrategy(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): CraftingStrategy | null {
    const steps: CraftingStep[] = [];
    let stepNumber = 1;
    
    // Start with Alchemy
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'alchemy_craft_poe2',
        name: 'Alchemy Orb',
        type: 'basic_currency',
        description: 'Create rare with 4 mods',
        requirements: { itemRarity: 'normal' },
        outcomes: [{ probability: 1, effect: 'Rare with 4 mods' }],
        cost: { currency: { alchemy: 1 }, averageTotal: 1.5 }
      },
      description: 'Create initial rare item',
      expectedCost: { currency: { alchemy: 1 }, expected: 1.5 },
      successProbability: 0.1,
      expectedAttempts: 10,
      materials: []
    });
    
    // Use Perfect Chaos for high-tier mod swapping
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'perfect_chaos',
        name: 'Perfect Chaos Orb',
        type: 'tiered_currency',
        description: 'Swap for highest-tier modifier',
        requirements: { itemRarity: 'rare' },
        outcomes: [{ probability: 1, effect: 'Replace with T1 mod' }],
        cost: { currency: { chaos_perfect: 1 }, averageTotal: 50 }
      },
      description: 'Use Perfect Chaos to replace low-tier mods with T1 mods',
      expectedCost: { currency: { chaos_perfect: 5 }, expected: 250 },
      successProbability: 0.2,
      expectedAttempts: 5,
      materials: [],
      tips: ['Perfect currency guarantees high-tier modifiers']
    });
    
    // Use Omen-enhanced Exalts
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'omen_double_exalt',
        name: 'Omen + Exalted Orb',
        type: 'omen',
        description: 'Add two modifiers at once',
        requirements: { itemRarity: 'rare', openPrefixes: 1 },
        outcomes: [{ probability: 1, effect: 'Add two mods' }],
        cost: { currency: { exalted: 1 }, averageTotal: 250 }
      },
      description: 'Use Omen of Duplication with Exalted Orb',
      expectedCost: { currency: { exalted: 1 }, expected: 250 },
      successProbability: 0.5,
      expectedAttempts: 2,
      materials: [],
      tips: ['Omens modify currency behavior for better control']
    });
    
    return {
      id: 'premium_strategy',
      name: 'Premium Crafting (Tiered Currency)',
      description: 'Use Greater/Perfect currency for high-tier modifiers',
      targetItem: desiredItem,
      steps,
      totalCost: {
        expected: 501.5,
        minimum: 300,
        maximum: 1000,
        standardDeviation: 150
      },
      successProbability: 0.7,
      estimatedTime: 15,
      difficultyRating: 2
    };
  }
  
  /**
   * Generate hybrid strategy using multiple methods
   */
  private async generateHybridStrategy(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): Promise<CraftingStrategy | null> {
    const steps: CraftingStep[] = [];
    let stepNumber = 1;
    
    // Phase 1: Essence start
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'greater_essence',
        name: 'Greater Essence',
        type: 'essence',
        description: 'Magic → Rare with guaranteed mod',
        requirements: { itemRarity: 'magic' },
        outcomes: [{ probability: 1, effect: 'Guaranteed high-tier mod' }],
        cost: { currency: {}, averageTotal: 20 }
      },
      description: 'Start with Greater Essence for guaranteed mod',
      expectedCost: { currency: {}, expected: 20 },
      successProbability: 1,
      expectedAttempts: 1,
      materials: []
    });
    
    // Phase 2: Omen-targeted Chaos
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'omen_prefix_chaos',
        name: 'Omen + Chaos (Prefix)',
        type: 'omen',
        description: 'Target prefix replacement',
        requirements: { itemRarity: 'rare' },
        outcomes: [{ probability: 1, effect: 'Replace prefix only' }],
        cost: { currency: { chaos: 10 }, averageTotal: 15 }
      },
      description: 'Use Omen to target specific mod types',
      expectedCost: { currency: { chaos: 10 }, expected: 15 },
      successProbability: 0.3,
      expectedAttempts: 10,
      materials: []
    });
    
    // Phase 3: Greater Exalt finish
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'exalted_greater',
        name: 'Greater Exalted Orb',
        type: 'tiered_currency',
        description: 'Add high-tier modifier',
        requirements: { itemRarity: 'rare', openPrefixes: 1 },
        outcomes: [{ probability: 1, effect: 'Add T1-T2 mod' }],
        cost: { currency: { exalted_greater: 1 }, averageTotal: 150 }
      },
      description: 'Finish with Greater Exalt for high-tier final mod',
      expectedCost: { currency: { exalted_greater: 1 }, expected: 150 },
      successProbability: 0.6,
      expectedAttempts: 1,
      materials: []
    });
    
    // Run simulation for accurate probabilities
    const simulation = await poe2CraftingSimulator.simulateStrategy({
      id: 'hybrid_temp',
      name: 'Hybrid',
      description: '',
      targetItem: desiredItem,
      steps,
      totalCost: { expected: 185, minimum: 100, maximum: 500, standardDeviation: 50 },
      successProbability: 0.5,
      difficultyRating: 3
    }, 1000);
    
    return {
      id: 'hybrid_strategy',
      name: 'Hybrid Crafting (Mixed Methods)',
      description: 'Combine Essences, Omens, and Tiered Currency',
      targetItem: desiredItem,
      steps,
      totalCost: {
        expected: simulation.results.averageCost,
        minimum: simulation.results.percentiles.p10,
        maximum: simulation.results.percentiles.p90,
        standardDeviation: 50
      },
      successProbability: simulation.results.successes / simulation.simulations,
      estimatedTime: 20,
      difficultyRating: 3
    };
  }
  
  /**
   * Generate white base strategy (PoE 2 specific)
   */
  private generateWhiteBaseStrategy(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): CraftingStrategy | null {
    const steps: CraftingStep[] = [];
    let stepNumber = 1;
    
    // Emphasize the value of white items in PoE 2
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'preserve_white',
        name: 'Preserve White Base',
        type: 'vendor',
        description: 'Keep item white as long as possible',
        requirements: { itemRarity: 'normal' },
        outcomes: [{ probability: 1, effect: 'Maintain white status' }],
        cost: { currency: {}, averageTotal: 0 }
      },
      description: 'White items are extremely valuable in PoE 2 - no scouring exists!',
      expectedCost: { currency: {}, expected: 0 },
      successProbability: 1,
      expectedAttempts: 1,
      materials: [],
      tips: [
        'White items cannot be created in PoE 2',
        'Consider saving white bases for perfect crafts',
        'Use Runes first for guaranteed weak mods'
      ]
    });
    
    // Optimal white → rare path
    steps.push({
      stepNumber: stepNumber++,
      method: {
        id: 'perfect_alchemy',
        name: 'Perfect Alchemy Orb',
        type: 'tiered_currency',
        description: 'White → Rare with 4 high-tier mods',
        requirements: { itemRarity: 'normal' },
        outcomes: [{ probability: 1, effect: 'Rare with 4 T1-T2 mods' }],
        cost: { currency: {}, averageTotal: 100 }
      },
      description: 'Use Perfect Alchemy on white base for best results',
      expectedCost: { currency: {}, expected: 100 },
      successProbability: 0.3,
      expectedAttempts: 3,
      materials: [],
      tips: ['This is often the best use of white bases']
    });
    
    return {
      id: 'white_base_strategy',
      name: 'White Base Optimization (PoE 2 Special)',
      description: 'Leverage the extreme value of white items in PoE 2',
      targetItem: desiredItem,
      steps,
      totalCost: {
        expected: 300,
        minimum: 100,
        maximum: 1000,
        standardDeviation: 200
      },
      successProbability: 0.3,
      estimatedTime: 10,
      difficultyRating: 2
    };
  }
  
  /**
   * Use genetic algorithm for optimization
   */
  private async geneticOptimization(
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): Promise<CraftingStrategy> {
    // Initialize population
    let population = this.initializePopulation(desiredItem);
    
    for (let gen = 0; gen < this.generations; gen++) {
      // Evaluate fitness
      population = await this.evaluateFitness(population, desiredItem, config);
      
      // Selection
      const parents = this.selectParents(population);
      
      // Crossover and mutation
      const offspring = this.crossoverAndMutate(parents);
      
      // Replace population
      population = [...parents.slice(0, this.populationSize / 2), ...offspring];
    }
    
    // Return best strategy
    return population[0];
  }
  
  /**
   * Initialize population for genetic algorithm
   */
  private initializePopulation(desiredItem: DesiredItem): CraftingStrategy[] {
    const population: CraftingStrategy[] = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const steps = this.generateRandomSteps(desiredItem);
      population.push({
        id: `genetic_${i}`,
        name: `Genetic Strategy ${i}`,
        description: 'Generated by genetic algorithm',
        targetItem: desiredItem,
        steps,
        totalCost: { expected: 0, minimum: 0, maximum: 0, standardDeviation: 0 },
        successProbability: 0,
        difficultyRating: 3
      });
    }
    
    return population;
  }
  
  /**
   * Generate random crafting steps
   */
  private generateRandomSteps(desiredItem: DesiredItem): CraftingStep[] {
    const steps: CraftingStep[] = [];
    const methods = Array.from(poe2CraftingKnowledge['methods'].values());
    
    for (let i = 0; i < Math.min(10, Math.random() * 15 + 5); i++) {
      const method = methods[Math.floor(Math.random() * methods.length)];
      steps.push({
        stepNumber: i + 1,
        method,
        description: method.description,
        expectedCost: method.cost,
        successProbability: Math.random(),
        expectedAttempts: 1,
        materials: []
      });
    }
    
    return steps;
  }
  
  /**
   * Evaluate fitness of strategies
   */
  private async evaluateFitness(
    population: CraftingStrategy[],
    desiredItem: DesiredItem,
    config: OptimizerConfig
  ): Promise<CraftingStrategy[]> {
    for (const strategy of population) {
      // Simulate to get success rate
      const simulation = await poe2CraftingSimulator.simulateStrategy(strategy, 100);
      
      // Calculate fitness based on config
      let fitness = 0;
      
      switch (config.optimizeFor) {
        case 'cost':
          fitness = 1000 / (simulation.results.averageCost + 1);
          break;
        case 'success_rate':
          fitness = simulation.results.successes / simulation.simulations;
          break;
        case 'time':
          fitness = 100 / (strategy.steps.length + 1);
          break;
        case 'profit':
          fitness = (strategy.profitMargin?.expectedProfit || 0) / 100;
          break;
      }
      
      strategy.successProbability = fitness;
    }
    
    return population.sort((a, b) => b.successProbability - a.successProbability);
  }
  
  /**
   * Select parents for next generation
   */
  private selectParents(population: CraftingStrategy[]): CraftingStrategy[] {
    return population.slice(0, this.populationSize / 2);
  }
  
  /**
   * Crossover and mutate strategies
   */
  private crossoverAndMutate(parents: CraftingStrategy[]): CraftingStrategy[] {
    const offspring: CraftingStrategy[] = [];
    
    for (let i = 0; i < parents.length - 1; i += 2) {
      const parent1 = parents[i];
      const parent2 = parents[i + 1];
      
      // Crossover
      const crossPoint = Math.floor(Math.random() * Math.min(parent1.steps.length, parent2.steps.length));
      const child1Steps = [...parent1.steps.slice(0, crossPoint), ...parent2.steps.slice(crossPoint)];
      const child2Steps = [...parent2.steps.slice(0, crossPoint), ...parent1.steps.slice(crossPoint)];
      
      // Mutation
      if (Math.random() < 0.1) {
        const mutateIndex = Math.floor(Math.random() * child1Steps.length);
        child1Steps[mutateIndex] = this.generateRandomSteps(parent1.targetItem)[0];
      }
      
      offspring.push({
        ...parent1,
        id: `offspring_${i}`,
        steps: child1Steps
      });
      
      offspring.push({
        ...parent2,
        id: `offspring_${i + 1}`,
        steps: child2Steps
      });
    }
    
    return offspring;
  }
  
  /**
   * Sort strategies by optimization criteria
   */
  private sortStrategies(
    strategies: CraftingStrategy[],
    optimizeFor: 'cost' | 'time' | 'success_rate' | 'profit'
  ): CraftingStrategy[] {
    return strategies.sort((a, b) => {
      switch (optimizeFor) {
        case 'cost':
          return a.totalCost.expected - b.totalCost.expected;
        case 'time':
          return (a.estimatedTime || 0) - (b.estimatedTime || 0);
        case 'success_rate':
          return b.successProbability - a.successProbability;
        case 'profit':
          return (b.profitMargin?.expectedProfit || 0) - (a.profitMargin?.expectedProfit || 0);
        default:
          return 0;
      }
    });
  }
}

export const poe2CraftingOptimizer = new PoE2CraftingOptimizer();