# Phase 3: Optimization Features - Low Level Implementation Plan

## Implementation Timeline: 8-10 Weeks

## Week 1-3: Genetic Algorithm Build Optimizer

### 1.1 Core Genetic Algorithm Implementation

#### Dependencies Installation
```bash
npm install genetic-js workerpool lodash.clonedeep
npm install -D @types/genetic-js @types/lodash.clonedeep
```

#### Genetic Algorithm Core (`lib/optimization/genetic/core.ts`)
```typescript
import { cloneDeep } from 'lodash';

export interface BuildGenome {
  passiveNodes: boolean[]  // Binary array for passive allocation
  equipment: number[]       // Index array for equipment choices
  skills: number[]         // Index array for skill choices
  jewels: number[]        // Index array for jewel choices
  fitness?: number
  objectives?: ObjectiveScores
}

export interface OptimizationConfig {
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  elitismRate: number
  tournamentSize: number
}

export class GeneticAlgorithm {
  private config: OptimizationConfig;
  private population: BuildGenome[] = [];
  private generation = 0;
  private bestGenome: BuildGenome | null = null;

  constructor(config: OptimizationConfig) {
    this.config = {
      populationSize: 100,
      generations: 50,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.1,
      tournamentSize: 5,
      ...config
    };
  }

  async optimize(
    constraints: BuildConstraints,
    objectives: ObjectiveFunction[]
  ): Promise<OptimizationResult> {
    // Initialize population
    this.population = this.generateInitialPopulation(constraints);

    // Evolution loop
    for (this.generation = 0; this.generation < this.config.generations; this.generation++) {
      // Evaluate fitness
      await this.evaluatePopulation(objectives);

      // Check convergence
      if (this.hasConverged()) {
        break;
      }

      // Create next generation
      this.population = this.evolvePopulation();

      // Track progress
      this.updateBestGenome();

      // Notify progress
      this.notifyProgress({
        generation: this.generation,
        bestFitness: this.bestGenome?.fitness || 0,
        averageFitness: this.getAverageFitness()
      });
    }

    return this.createOptimizationResult();
  }

  private generateInitialPopulation(constraints: BuildConstraints): BuildGenome[] {
    const population: BuildGenome[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      population.push(this.generateRandomGenome(constraints));
    }

    return population;
  }

  private generateRandomGenome(constraints: BuildConstraints): BuildGenome {
    return {
      passiveNodes: this.generateRandomPassives(constraints.passivePoints),
      equipment: this.generateRandomEquipment(constraints.equipmentSlots),
      skills: this.generateRandomSkills(constraints.skillSlots),
      jewels: this.generateRandomJewels(constraints.jewelSlots)
    };
  }

  private async evaluatePopulation(objectives: ObjectiveFunction[]): Promise<void> {
    // Parallel evaluation using worker pool
    const evaluations = await Promise.all(
      this.population.map(genome =>
        this.evaluateGenome(genome, objectives)
      )
    );

    this.population.forEach((genome, i) => {
      genome.fitness = evaluations[i].fitness;
      genome.objectives = evaluations[i].objectives;
    });
  }

  private async evaluateGenome(
    genome: BuildGenome,
    objectives: ObjectiveFunction[]
  ): Promise<EvaluationResult> {
    // Convert genome to character
    const character = this.genomeToCharacter(genome);

    // Calculate objectives
    const scores = await Promise.all(
      objectives.map(obj => obj.evaluate(character))
    );

    // Combine objectives (weighted sum or Pareto)
    const fitness = this.combineObjectives(scores, objectives);

    return { fitness, objectives: scores };
  }

  private evolvePopulation(): BuildGenome[] {
    const newPopulation: BuildGenome[] = [];

    // Elitism - keep best genomes
    const eliteCount = Math.floor(this.config.populationSize * this.config.elitismRate);
    const elite = this.selectElite(eliteCount);
    newPopulation.push(...elite);

    // Generate offspring
    while (newPopulation.length < this.config.populationSize) {
      if (Math.random() < this.config.crossoverRate) {
        // Crossover
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        const [child1, child2] = this.crossover(parent1, parent2);

        newPopulation.push(this.mutate(child1));
        if (newPopulation.length < this.config.populationSize) {
          newPopulation.push(this.mutate(child2));
        }
      } else {
        // Direct reproduction with mutation
        const parent = this.tournamentSelection();
        newPopulation.push(this.mutate(cloneDeep(parent)));
      }
    }

    return newPopulation.slice(0, this.config.populationSize);
  }

  private crossover(parent1: BuildGenome, parent2: BuildGenome): [BuildGenome, BuildGenome] {
    const crossoverPoint = Math.floor(Math.random() * parent1.passiveNodes.length);

    const child1: BuildGenome = {
      passiveNodes: [
        ...parent1.passiveNodes.slice(0, crossoverPoint),
        ...parent2.passiveNodes.slice(crossoverPoint)
      ],
      equipment: this.crossoverArray(parent1.equipment, parent2.equipment),
      skills: this.crossoverArray(parent1.skills, parent2.skills),
      jewels: this.crossoverArray(parent1.jewels, parent2.jewels)
    };

    const child2: BuildGenome = {
      passiveNodes: [
        ...parent2.passiveNodes.slice(0, crossoverPoint),
        ...parent1.passiveNodes.slice(crossoverPoint)
      ],
      equipment: this.crossoverArray(parent2.equipment, parent1.equipment),
      skills: this.crossoverArray(parent2.skills, parent1.skills),
      jewels: this.crossoverArray(parent2.jewels, parent1.jewels)
    };

    return [child1, child2];
  }

  private mutate(genome: BuildGenome): BuildGenome {
    // Passive node mutation
    genome.passiveNodes = genome.passiveNodes.map(node =>
      Math.random() < this.config.mutationRate ? !node : node
    );

    // Equipment mutation
    genome.equipment = genome.equipment.map(item =>
      Math.random() < this.config.mutationRate
        ? Math.floor(Math.random() * this.equipmentPool.length)
        : item
    );

    // Skill mutation
    genome.skills = genome.skills.map(skill =>
      Math.random() < this.config.mutationRate
        ? Math.floor(Math.random() * this.skillPool.length)
        : skill
    );

    return genome;
  }

  private tournamentSelection(): BuildGenome {
    const tournament: BuildGenome[] = [];

    for (let i = 0; i < this.config.tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }

    return tournament.reduce((best, current) =>
      (current.fitness || 0) > (best.fitness || 0) ? current : best
    );
  }
}
```

### 1.2 Multi-Objective Optimization

#### Pareto Optimization (`lib/optimization/genetic/pareto.ts`)
```typescript
export interface Solution {
  genome: BuildGenome;
  objectives: number[];
  rank?: number;
  crowdingDistance?: number;
}

export class ParetoOptimizer {
  findParetoFront(solutions: Solution[]): Solution[] {
    const fronts: Solution[][] = [];
    const dominated: Map<Solution, Solution[]> = new Map();
    const dominationCount: Map<Solution, number> = new Map();

    // Initialize
    solutions.forEach(sol => {
      dominated.set(sol, []);
      dominationCount.set(sol, 0);
    });

    // Find domination relationships
    for (let i = 0; i < solutions.length; i++) {
      for (let j = i + 1; j < solutions.length; j++) {
        const dom = this.checkDomination(solutions[i], solutions[j]);

        if (dom === 1) {
          // i dominates j
          dominated.get(solutions[i])!.push(solutions[j]);
          dominationCount.set(solutions[j], dominationCount.get(solutions[j])! + 1);
        } else if (dom === -1) {
          // j dominates i
          dominated.get(solutions[j])!.push(solutions[i]);
          dominationCount.set(solutions[i], dominationCount.get(solutions[i])! + 1);
        }
      }
    }

    // Create first front
    const firstFront: Solution[] = [];
    solutions.forEach(sol => {
      if (dominationCount.get(sol) === 0) {
        sol.rank = 0;
        firstFront.push(sol);
      }
    });

    fronts.push(firstFront);

    // Create subsequent fronts
    let currentFront = firstFront;
    let frontIndex = 0;

    while (currentFront.length > 0) {
      const nextFront: Solution[] = [];

      currentFront.forEach(sol => {
        dominated.get(sol)!.forEach(dominated => {
          const count = dominationCount.get(dominated)! - 1;
          dominationCount.set(dominated, count);

          if (count === 0) {
            dominated.rank = frontIndex + 1;
            nextFront.push(dominated);
          }
        });
      });

      if (nextFront.length > 0) {
        fronts.push(nextFront);
        currentFront = nextFront;
        frontIndex++;
      } else {
        break;
      }
    }

    // Calculate crowding distance for each front
    fronts.forEach(front => this.assignCrowdingDistance(front));

    return fronts[0]; // Return first Pareto front
  }

  private checkDomination(sol1: Solution, sol2: Solution): number {
    let better = false;
    let worse = false;

    for (let i = 0; i < sol1.objectives.length; i++) {
      if (sol1.objectives[i] > sol2.objectives[i]) {
        better = true;
      } else if (sol1.objectives[i] < sol2.objectives[i]) {
        worse = true;
      }
    }

    if (better && !worse) return 1;   // sol1 dominates sol2
    if (!better && worse) return -1;   // sol2 dominates sol1
    return 0;                          // No domination
  }

  private assignCrowdingDistance(front: Solution[]): void {
    const n = front.length;
    if (n === 0) return;

    // Initialize distances
    front.forEach(sol => sol.crowdingDistance = 0);

    // For each objective
    const numObjectives = front[0].objectives.length;

    for (let obj = 0; obj < numObjectives; obj++) {
      // Sort by objective
      front.sort((a, b) => a.objectives[obj] - b.objectives[obj]);

      // Boundary points get infinite distance
      front[0].crowdingDistance = Infinity;
      front[n - 1].crowdingDistance = Infinity;

      // Calculate distance for middle points
      const range = front[n - 1].objectives[obj] - front[0].objectives[obj];

      if (range > 0) {
        for (let i = 1; i < n - 1; i++) {
          const distance = (front[i + 1].objectives[obj] - front[i - 1].objectives[obj]) / range;
          front[i].crowdingDistance! += distance;
        }
      }
    }
  }
}
```

### 1.3 Objective Functions

#### DPS Objective (`lib/optimization/objectives/dps.ts`)
```typescript
import { DamageCalculator } from '@/lib/calculations/damage';

export class DPSObjective implements ObjectiveFunction {
  name = 'DPS Maximization';
  type: 'maximize' = 'maximize';
  weight = 1.0;

  private calculator = new DamageCalculator();

  async evaluate(character: Character): Promise<number> {
    const calculation = await this.calculator.calculate(character);
    return calculation.totalDPS;
  }

  normalize(value: number): number {
    // Normalize to 0-1 range based on expected DPS values
    const maxExpectedDPS = 50000000; // 50M DPS
    return Math.min(value / maxExpectedDPS, 1);
  }
}
```

#### Survivability Objective (`lib/optimization/objectives/survivability.ts`)
```typescript
import { EHPCalculator } from '@/lib/calculations/defense/ehp';

export class SurvivabilityObjective implements ObjectiveFunction {
  name = 'Survivability';
  type: 'maximize' = 'maximize';
  weight = 0.8;

  private ehpCalculator = new EHPCalculator();

  async evaluate(character: Character): Promise<number> {
    const ehp = await this.ehpCalculator.calculate(character);

    // Combine different EHP types
    const score = (
      ehp.physicalEHP * 0.4 +
      ehp.elementalEHP * 0.4 +
      ehp.chaosEHP * 0.2
    );

    return score;
  }

  normalize(value: number): number {
    const maxExpectedEHP = 100000; // 100k EHP
    return Math.min(value / maxExpectedEHP, 1);
  }
}
```

## Week 4-5: Equipment Optimization

### 2.1 Equipment Upgrade Analyzer

#### Upgrade Analyzer (`lib/optimization/equipment/upgradeAnalyzer.ts`)
```typescript
export interface UpgradeOption {
  item: Item;
  slot: EquipmentSlot;
  improvement: ImprovementMetrics;
  cost: CurrencyAmount;
  efficiency: number;
}

export class EquipmentUpgradeAnalyzer {
  constructor(
    private itemDatabase: ItemDatabase,
    private calculator: DamageCalculator,
    private marketAPI: MarketAPI
  ) {}

  async analyzeUpgrades(
    character: Character,
    budget?: CurrencyAmount
  ): Promise<UpgradeAnalysis> {
    const upgrades: UpgradeOption[] = [];
    const currentBaseline = await this.calculator.calculate(character);

    // Analyze each equipment slot
    for (const slot of EQUIPMENT_SLOTS) {
      const currentItem = character.equipment[slot];
      const potentialUpgrades = await this.findUpgradesForSlot(
        character,
        slot,
        currentItem,
        budget
      );

      upgrades.push(...potentialUpgrades);
    }

    // Sort by efficiency
    upgrades.sort((a, b) => b.efficiency - a.efficiency);

    return {
      currentPerformance: currentBaseline,
      upgradeOptions: upgrades,
      recommendations: this.generateRecommendations(upgrades, budget)
    };
  }

  private async findUpgradesForSlot(
    character: Character,
    slot: EquipmentSlot,
    currentItem: Item | null,
    budget?: CurrencyAmount
  ): Promise<UpgradeOption[]> {
    // Get potential items from database
    const candidates = await this.itemDatabase.searchItems({
      slot,
      maxPrice: budget,
      minLevel: 1,
      maxLevel: character.level,
      requirements: this.getCharacterRequirements(character)
    });

    const upgrades: UpgradeOption[] = [];

    // Evaluate each candidate
    for (const item of candidates) {
      const testCharacter = cloneDeep(character);
      testCharacter.equipment[slot] = item;

      const newCalc = await this.calculator.calculate(testCharacter);
      const improvement = this.calculateImprovement(
        currentBaseline,
        newCalc
      );

      if (this.isSignificantUpgrade(improvement)) {
        const price = await this.marketAPI.getPrice(item);

        upgrades.push({
          item,
          slot,
          improvement,
          cost: price,
          efficiency: this.calculateEfficiency(improvement, price)
        });
      }
    }

    return upgrades;
  }

  private calculateImprovement(
    baseline: CalculationResult,
    upgraded: CalculationResult
  ): ImprovementMetrics {
    return {
      dps: {
        absolute: upgraded.totalDPS - baseline.totalDPS,
        relative: (upgraded.totalDPS - baseline.totalDPS) / baseline.totalDPS
      },
      survivability: {
        absolute: upgraded.ehp - baseline.ehp,
        relative: (upgraded.ehp - baseline.ehp) / baseline.ehp
      },
      overall: this.calculateOverallImprovement(baseline, upgraded)
    };
  }

  private calculateEfficiency(
    improvement: ImprovementMetrics,
    cost: CurrencyAmount
  ): number {
    // Convert cost to chaos equivalent
    const chaosValue = this.convertToChaos(cost);

    // Calculate improvement per chaos
    const dpsPerChaos = improvement.dps.absolute / chaosValue;
    const ehpPerChaos = improvement.survivability.absolute / chaosValue;

    // Weighted efficiency score
    return (dpsPerChaos * 0.6 + ehpPerChaos * 0.4) * 100;
  }

  private generateRecommendations(
    upgrades: UpgradeOption[],
    budget?: CurrencyAmount
  ): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];
    let remainingBudget = budget || Infinity;

    // Greedy selection of best efficiency upgrades
    for (const upgrade of upgrades) {
      const chaosValue = this.convertToChaos(upgrade.cost);

      if (chaosValue <= remainingBudget) {
        recommendations.push({
          priority: recommendations.length + 1,
          upgrade,
          cumulativeImprovement: this.calculateCumulative(recommendations, upgrade),
          reasoning: this.generateReasoning(upgrade)
        });

        remainingBudget -= chaosValue;
      }
    }

    return recommendations;
  }
}
```

### 2.2 Affix Optimization

#### Affix Optimizer (`lib/optimization/equipment/affixOptimizer.ts`)
```typescript
export class AffixOptimizer {
  private affixWeights: Map<string, number> = new Map();

  constructor(private character: Character) {
    this.calculateAffixWeights();
  }

  private calculateAffixWeights(): void {
    // Weight affixes based on build needs
    const scalingStats = this.identifyScalingStats();

    scalingStats.forEach(stat => {
      const weight = this.calculateStatWeight(stat);
      this.affixWeights.set(stat, weight);
    });
  }

  findOptimalAffixes(slot: EquipmentSlot): OptimalAffixSet {
    const availableAffixes = this.getAvailableAffixes(slot);
    const prefixes: Affix[] = [];
    const suffixes: Affix[] = [];

    // Select best prefixes
    const sortedPrefixes = availableAffixes.prefixes
      .sort((a, b) => this.scoreAffix(b) - this.scoreAffix(a));

    prefixes.push(...sortedPrefixes.slice(0, 3));

    // Select best suffixes
    const sortedSuffixes = availableAffixes.suffixes
      .sort((a, b) => this.scoreAffix(b) - this.scoreAffix(a));

    suffixes.push(...sortedSuffixes.slice(0, 3));

    return {
      prefixes,
      suffixes,
      totalScore: this.calculateSetScore(prefixes, suffixes)
    };
  }

  private scoreAffix(affix: Affix): number {
    let score = 0;

    affix.stats.forEach(stat => {
      const weight = this.affixWeights.get(stat.id) || 0;
      score += stat.value * weight;
    });

    return score;
  }

  suggestCraftingPath(
    item: Item,
    targetAffixes: OptimalAffixSet
  ): CraftingPath {
    const steps: CraftingStep[] = [];
    let currentItem = cloneDeep(item);
    let totalCost = 0;

    // Analyze current affixes
    const currentAffixes = this.analyzeItemAffixes(currentItem);

    // Remove unwanted affixes
    if (this.hasUnwantedAffixes(currentAffixes, targetAffixes)) {
      steps.push({
        action: 'annul',
        target: this.selectWorstAffix(currentAffixes),
        cost: { orb_of_annulment: 1 },
        successRate: 0.33
      });
    }

    // Add missing affixes
    targetAffixes.prefixes.forEach(targetAffix => {
      if (!this.hasAffix(currentItem, targetAffix)) {
        steps.push({
          action: 'augment',
          target: targetAffix,
          cost: this.getAugmentCost(targetAffix),
          successRate: this.calculateCraftingSuccess(targetAffix)
        });
      }
    });

    return {
      steps,
      totalCost: this.calculateTotalCost(steps),
      expectedAttempts: this.calculateExpectedAttempts(steps),
      successProbability: this.calculateOverallSuccess(steps)
    };
  }
}
```

## Week 6-7: Build Comparison System

### 3.1 Build Comparator

#### Comparison Engine (`lib/comparison/comparator.ts`)
```typescript
export interface ComparisonResult {
  builds: CharacterComparison[];
  metrics: MetricComparison;
  strengths: StrengthAnalysis[];
  weaknesses: WeaknessAnalysis[];
  recommendations: BuildRecommendation[];
}

export class BuildComparator {
  async compare(builds: Character[]): Promise<ComparisonResult> {
    // Calculate metrics for all builds
    const calculations = await Promise.all(
      builds.map(build => this.calculateMetrics(build))
    );

    // Normalize metrics for comparison
    const normalized = this.normalizeMetrics(calculations);

    // Identify relative strengths and weaknesses
    const analysis = this.analyzeBuilds(builds, normalized);

    return {
      builds: this.createComparisons(builds, calculations),
      metrics: this.compareMetrics(normalized),
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: this.generateRecommendations(analysis)
    };
  }

  private async calculateMetrics(build: Character): Promise<BuildMetrics> {
    const [damage, defense, utility] = await Promise.all([
      this.damageCalculator.calculate(build),
      this.defenseCalculator.calculate(build),
      this.utilityCalculator.calculate(build)
    ]);

    return {
      // Offensive metrics
      totalDPS: damage.totalDPS,
      burstDPS: damage.burstDPS,
      sustainedDPS: damage.sustainedDPS,
      critChance: damage.critChance,
      critMultiplier: damage.critMultiplier,

      // Defensive metrics
      effectiveHP: defense.totalEHP,
      physicalEHP: defense.physicalEHP,
      elementalEHP: defense.elementalEHP,
      maxHit: defense.maxHit,
      recovery: defense.recoveryRate,
      blockChance: defense.blockChance,

      // Utility metrics
      movementSpeed: utility.movementSpeed,
      areaOfEffect: utility.areaOfEffect,
      castSpeed: utility.castSpeed,
      attackSpeed: utility.attackSpeed
    };
  }

  private normalizeMetrics(metrics: BuildMetrics[]): NormalizedMetrics[] {
    const maxValues: Partial<BuildMetrics> = {};
    const minValues: Partial<BuildMetrics> = {};

    // Find min/max for each metric
    Object.keys(metrics[0]).forEach(key => {
      const values = metrics.map(m => m[key as keyof BuildMetrics]);
      maxValues[key as keyof BuildMetrics] = Math.max(...values);
      minValues[key as keyof BuildMetrics] = Math.min(...values);
    });

    // Normalize to 0-100 scale
    return metrics.map(metric => {
      const normalized: any = {};

      Object.keys(metric).forEach(key => {
        const value = metric[key as keyof BuildMetrics];
        const min = minValues[key as keyof BuildMetrics]!;
        const max = maxValues[key as keyof BuildMetrics]!;

        normalized[key] = max > min ? ((value - min) / (max - min)) * 100 : 50;
      });

      return normalized as NormalizedMetrics;
    });
  }

  generateRadarChartData(builds: Character[]): RadarChartData {
    const metrics = ['DPS', 'Survivability', 'Speed', 'AoE', 'Recovery'];

    return {
      axes: metrics.map(metric => ({
        axis: metric,
        maxValue: 100
      })),
      datasets: builds.map((build, index) => ({
        label: build.name,
        data: this.getRadarValues(build),
        backgroundColor: this.getColor(index, 0.2),
        borderColor: this.getColor(index, 1),
        pointBackgroundColor: this.getColor(index, 1)
      }))
    };
  }
}
```

### 3.2 Similarity Analysis

#### Build Similarity (`lib/comparison/similarity.ts`)
```typescript
export class BuildSimilarityAnalyzer {
  calculateSimilarity(build1: Character, build2: Character): number {
    const vectors = {
      passives: this.passiveVectorSimilarity(build1, build2),
      equipment: this.equipmentSimilarity(build1, build2),
      skills: this.skillSimilarity(build1, build2),
      stats: this.statSimilarity(build1, build2)
    };

    // Weighted average
    return (
      vectors.passives * 0.4 +
      vectors.equipment * 0.2 +
      vectors.skills * 0.2 +
      vectors.stats * 0.2
    );
  }

  private passiveVectorSimilarity(build1: Character, build2: Character): number {
    const set1 = new Set(build1.passives.map(p => p.nodeId));
    const set2 = new Set(build2.passives.map(p => p.nodeId));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  findSimilarBuilds(
    target: Character,
    pool: Character[],
    threshold = 0.7
  ): SimilarBuild[] {
    const similarities = pool.map(build => ({
      build,
      similarity: this.calculateSimilarity(target, build)
    }));

    return similarities
      .filter(s => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .map(s => ({
        ...s,
        differences: this.identifyDifferences(target, s.build)
      }));
  }

  clusterBuilds(builds: Character[], k: number = 5): BuildCluster[] {
    // K-means clustering implementation
    const clusters: BuildCluster[] = [];
    const centroids = this.initializeCentroids(builds, k);

    for (let iteration = 0; iteration < 100; iteration++) {
      // Assign builds to clusters
      const assignments = new Map<number, Character[]>();

      builds.forEach(build => {
        const closest = this.findClosestCentroid(build, centroids);
        if (!assignments.has(closest)) {
          assignments.set(closest, []);
        }
        assignments.get(closest)!.push(build);
      });

      // Update centroids
      let changed = false;
      assignments.forEach((clusterBuilds, index) => {
        const newCentroid = this.calculateCentroid(clusterBuilds);
        if (!this.centroidsEqual(centroids[index], newCentroid)) {
          centroids[index] = newCentroid;
          changed = true;
        }
      });

      if (!changed) break;
    }

    // Create cluster objects
    centroids.forEach((centroid, i) => {
      clusters.push({
        id: `cluster_${i}`,
        centroid,
        members: builds.filter(b =>
          this.findClosestCentroid(b, centroids) === i
        ),
        archetype: this.identifyArchetype(centroid)
      });
    });

    return clusters;
  }
}
```

## Week 8-10: Incremental Optimization & UI

### 4.1 Incremental Optimizer

#### Next Best Node Finder (`lib/optimization/incremental/passiveOptimizer.ts`)
```typescript
export class IncrementalPassiveOptimizer {
  constructor(
    private treeData: PassiveTreeData,
    private calculator: DamageCalculator
  ) {}

  async findBestPassiveNodes(
    character: Character,
    availablePoints: number,
    objective: OptimizationObjective = 'balanced'
  ): Promise<PassiveRecommendation[]> {
    const baseline = await this.calculator.calculate(character);
    const reachableNodes = this.getReachableNodes(character);
    const recommendations: PassiveRecommendation[] = [];

    // Evaluate each reachable node
    for (const nodeId of reachableNodes) {
      const node = this.treeData.getNode(nodeId);
      if (!node) continue;

      // Calculate path cost
      const path = this.findShortestPath(character.passives, nodeId);
      const cost = path.length;

      if (cost > availablePoints) continue;

      // Evaluate improvement
      const testCharacter = cloneDeep(character);
      path.forEach(pathNodeId => {
        testCharacter.passives.push({ nodeId: pathNodeId, allocated: true });
      });

      const improved = await this.calculator.calculate(testCharacter);
      const improvement = this.calculateImprovement(baseline, improved, objective);

      recommendations.push({
        node,
        path,
        cost,
        improvement: {
          immediate: this.getImmediateImprovement(node, baseline),
          cumulative: improvement
        },
        efficiency: improvement.overall / cost,
        alternatives: this.findAlternatives(node, reachableNodes)
      });
    }

    // Sort by efficiency
    recommendations.sort((a, b) => b.efficiency - a.efficiency);

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  private getReachableNodes(character: Character): Set<string> {
    const allocated = new Set(character.passives.map(p => p.nodeId));
    const reachable = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [...allocated];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      const connections = this.treeData.getConnections(current);

      connections.forEach(connected => {
        if (!allocated.has(connected)) {
          reachable.add(connected);
        } else if (!visited.has(connected)) {
          queue.push(connected);
        }
      });
    }

    return reachable;
  }

  private findShortestPath(
    allocated: PassiveAllocation[],
    target: string
  ): string[] {
    const allocatedSet = new Set(allocated.map(p => p.nodeId));
    const queue: { node: string; path: string[] }[] = [];
    const visited = new Set<string>();

    // Start from all allocated nodes
    allocated.forEach(p => {
      queue.push({ node: p.nodeId, path: [] });
    });

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === target) {
        return path;
      }

      if (visited.has(node)) continue;
      visited.add(node);

      const connections = this.treeData.getConnections(node);
      connections.forEach(connected => {
        if (!visited.has(connected) && !allocatedSet.has(connected)) {
          queue.push({
            node: connected,
            path: [...path, connected]
          });
        }
      });
    }

    return []; // No path found
  }
}
```

### 4.2 Optimization UI Components

#### Optimization Dashboard (`components/optimization/OptimizationDashboard.tsx`)
```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export function OptimizationDashboard({ character }: { character: Character }) {
  const [objectives, setObjectives] = useState<ObjectiveConfig[]>([
    { type: 'dps', weight: 0.5, enabled: true },
    { type: 'survivability', weight: 0.3, enabled: true },
    { type: 'cost', weight: 0.2, enabled: true }
  ]);

  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setProgress(0);

    const optimizer = new GeneticOptimizer({
      populationSize: 100,
      generations: 50,
      onProgress: (p) => setProgress(p)
    });

    const result = await optimizer.optimize(character, objectives);
    setOptimization(result);
    setIsOptimizing(false);
  };

  return (
    <div className="optimization-dashboard space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Objective Configuration */}
            <div className="objectives-config">
              <h3 className="text-lg font-semibold mb-2">Optimization Goals</h3>
              {objectives.map((obj, index) => (
                <div key={obj.type} className="flex items-center gap-4 mb-2">
                  <label className="w-32">{obj.type}</label>
                  <Slider
                    value={[obj.weight * 100]}
                    onValueChange={(v) => {
                      const newObjs = [...objectives];
                      newObjs[index].weight = v[0] / 100;
                      setObjectives(newObjs);
                    }}
                    max={100}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{Math.round(obj.weight * 100)}%</span>
                </div>
              ))}
            </div>

            {/* Optimization Controls */}
            <div className="flex gap-4">
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex-1"
              >
                {isOptimizing ? `Optimizing... ${Math.round(progress)}%` : 'Start Optimization'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {optimization && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="builds">Top Builds</TabsTrigger>
                <TabsTrigger value="pareto">Pareto Front</TabsTrigger>
                <TabsTrigger value="convergence">Convergence</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <OptimizationSummary result={optimization} />
              </TabsContent>

              <TabsContent value="builds">
                <TopBuildsDisplay builds={optimization.topBuilds} />
              </TabsContent>

              <TabsContent value="pareto">
                <ParetoFrontVisualization solutions={optimization.paretoFront} />
              </TabsContent>

              <TabsContent value="convergence">
                <ConvergenceChart history={optimization.convergenceHistory} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

#### Build Comparison UI (`components/comparison/BuildComparison.tsx`)
```typescript
import { Radar } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';

export function BuildComparisonView({ builds }: { builds: Character[] }) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['dps', 'ehp', 'speed']);

  useEffect(() => {
    const comparator = new BuildComparator();
    comparator.compare(builds).then(setComparison);
  }, [builds]);

  if (!comparison) return <div>Loading comparison...</div>;

  return (
    <div className="build-comparison grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Build Overview</h3>
        <Radar
          data={comparison.radarData}
          options={{
            scales: {
              r: {
                beginAtZero: true,
                max: 100
              }
            }
          }}
        />
      </Card>

      {/* Metrics Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
        <MetricsComparisonTable
          builds={builds}
          metrics={comparison.metrics}
          selectedMetrics={selectedMetrics}
        />
      </Card>

      {/* Strengths & Weaknesses */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Analysis</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {comparison.strengths.map((strength, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-500">+</span>
                  {strength.description}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-600 mb-2">Weaknesses</h4>
            <ul className="space-y-1">
              {comparison.weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-red-500">-</span>
                  {weakness.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        <RecommendationsList recommendations={comparison.recommendations} />
      </Card>
    </div>
  );
}
```

## Implementation Checklist

### Week 1-3: Genetic Algorithm ✅
- [ ] Core GA implementation
- [ ] Multi-objective optimization
- [ ] Pareto front calculation
- [ ] Objective functions (DPS, Survivability, Cost)
- [ ] Constraint handling
- [ ] Worker pool for parallel evaluation

### Week 4-5: Equipment Optimization ✅
- [ ] Upgrade analyzer
- [ ] Market price integration
- [ ] Affix optimization
- [ ] Crafting path suggestions
- [ ] Efficiency calculations
- [ ] Budget constraints

### Week 6-7: Build Comparison ✅
- [ ] Comparison engine
- [ ] Metric normalization
- [ ] Similarity analysis
- [ ] Build clustering
- [ ] Archetype identification
- [ ] Strength/weakness analysis

### Week 8-10: Incremental & UI ✅
- [ ] Passive node recommendations
- [ ] Path finding algorithm
- [ ] Efficiency scoring
- [ ] Optimization dashboard
- [ ] Comparison visualizations
- [ ] Real-time updates

## Performance Optimizations

### Caching Strategy
```typescript
// Cache optimization results
const optimizationCache = new Map<string, OptimizationResult>();

function getCacheKey(character: Character, objectives: Objective[]): string {
  return crypto.createHash('sha256')
    .update(JSON.stringify({ character, objectives }))
    .digest('hex');
}
```

### Parallel Processing
```typescript
// Use worker pool for fitness evaluation
const workerPool = new WorkerPool({
  size: navigator.hardwareConcurrency || 4,
  task: './workers/fitness.worker.js'
});

async function parallelEvaluate(population: BuildGenome[]): Promise<number[]> {
  const chunks = chunkArray(population, workerPool.size);
  const results = await Promise.all(
    chunks.map(chunk => workerPool.exec('evaluate', chunk))
  );
  return results.flat();
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('GeneticAlgorithm', () => {
  it('should find optimal solution for simple problem', async () => {
    const ga = new GeneticAlgorithm({ generations: 10 });
    const result = await ga.optimize(constraints, objectives);

    expect(result.bestSolution.fitness).toBeGreaterThan(0.8);
  });

  it('should maintain population diversity', () => {
    const population = ga.generateInitialPopulation(constraints);
    const diversity = calculateDiversity(population);

    expect(diversity).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests
```typescript
describe('Build Optimization Flow', () => {
  it('should optimize build within constraints', async () => {
    const character = createTestCharacter();
    const optimizer = new BuildOptimizer();

    const result = await optimizer.optimizeBuild(character, {
      budget: 100,
      level: 90
    });

    expect(result.builds).toHaveLength(10);
    expect(result.builds[0].cost).toBeLessThanOrEqual(100);
  });
});
```

## Success Metrics

- Optimization finds 20%+ improvement in 80% of cases
- Genetic algorithm converges within 50 generations
- Equipment recommendations have 70%+ user acceptance
- Comparison analysis completes in < 500ms
- UI updates remain smooth (60 FPS)