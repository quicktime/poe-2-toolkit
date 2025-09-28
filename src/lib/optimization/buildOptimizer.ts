import { Character } from '@/types/character';
import { PassiveNode } from '@/types/passiveTree';
import { Item, GemItem } from '@/types/items';
import { calculateDamage, calculateEffectiveHP } from '@/lib/calculations/poe2Calculations';
import { getPassiveTreeData } from '@/lib/passiveTree/treeDataService';

export interface OptimizationGoal {
  metric: 'dps' | 'ehp' | 'balanced' | 'cost-efficient';
  weights?: {
    dps?: number;
    life?: number;
    resistance?: number;
    spirit?: number;
    cost?: number;
  };
  constraints?: {
    maxCost?: number;
    minLife?: number;
    minResistance?: number;
    maxPassivePoints?: number;
    maxSpiritUsed?: number;
  };
}

export interface OptimizationRecommendation {
  type: 'passive' | 'gem' | 'equipment' | 'jewel';
  action: 'add' | 'remove' | 'replace';
  target: string; // Item/node ID to change
  replacement?: string; // New item/node ID
  impact: {
    dps: { before: number; after: number; change: number; changePercent: number };
    life: { before: number; after: number; change: number; changePercent: number };
    ehp: { before: number; after: number; change: number; changePercent: number };
    resistance?: { [key: string]: { before: number; after: number; change: number } };
    spirit?: { before: number; after: number; change: number };
    cost?: number; // Market cost in chaos orbs
  };
  confidence: number; // 0-1 confidence score
  priority: number; // Higher = more impactful
  description: string;
  reasoning: string;
}

export interface BuildGenome {
  passiveNodes: number[]; // Allocated node IDs
  equipment: { [slot: string]: Item };
  gems: GemItem[];
  jewels: Item[];
  fitness?: number;
}

export class BuildOptimizer {
  private character: Character;
  private goal: OptimizationGoal;
  private passiveTreeData: any;
  private marketPrices: Map<string, number> = new Map();

  constructor(character: Character, goal: OptimizationGoal) {
    this.character = character;
    this.goal = goal;
    this.passiveTreeData = getPassiveTreeData();
  }

  /**
   * Main optimization method that returns top recommendations
   */
  async optimize(limit: number = 10): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Calculate baseline metrics
    const baseline = this.calculateMetrics(this.character);

    // Run different optimization strategies in parallel
    const [
      passiveRecs,
      gemRecs,
      equipmentRecs,
      jewelRecs
    ] = await Promise.all([
      this.optimizePassiveTree(baseline, limit),
      this.optimizeGems(baseline, limit),
      this.optimizeEquipment(baseline, limit),
      this.optimizeJewels(baseline, limit)
    ]);

    // Combine and sort recommendations
    recommendations.push(...passiveRecs, ...gemRecs, ...equipmentRecs, ...jewelRecs);

    // Sort by priority (impact * confidence)
    recommendations.sort((a, b) => b.priority - a.priority);

    return recommendations.slice(0, limit);
  }

  /**
   * Optimize passive tree allocations
   */
  private async optimizePassiveTree(
    baseline: any,
    limit: number
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const allocatedNodes = new Set(this.character.passiveTree?.allocatedNodes || []);
    const availablePoints = this.getAvailablePassivePoints();

    if (availablePoints <= 0) {
      // Look for node swaps instead of additions
      return this.findPassiveSwaps(baseline, limit);
    }

    // Find best nodes to allocate
    const candidateNodes = this.findReachableNodes(allocatedNodes);

    for (const nodeId of candidateNodes) {
      const node = this.passiveTreeData.nodes[nodeId];
      if (!node || node.isKeystone || node.isNotable) {
        // Handle keystones and notables separately with more careful analysis
        continue;
      }

      // Simulate allocation
      const simulatedChar = this.cloneCharacter(this.character);
      simulatedChar.passiveTree.allocatedNodes.push(nodeId);

      const newMetrics = this.calculateMetrics(simulatedChar);
      const impact = this.calculateImpact(baseline, newMetrics);

      if (this.isWorthwhile(impact)) {
        recommendations.push({
          type: 'passive',
          action: 'add',
          target: nodeId.toString(),
          impact,
          confidence: 0.9, // High confidence for passive recommendations
          priority: this.calculatePriority(impact, 0.9),
          description: `Allocate ${node.name || `Node ${nodeId}`}`,
          reasoning: this.generateReasoning(impact, node)
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Find passive node swaps for respec recommendations
   */
  private async findPassiveSwaps(
    baseline: any,
    limit: number
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const allocatedNodes = Array.from(this.character.passiveTree?.allocatedNodes || []);

    // Find low-value nodes that could be respecced
    const nodeValues = allocatedNodes.map(nodeId => {
      const node = this.passiveTreeData.nodes[nodeId];
      const value = this.evaluateNodeValue(node, this.character);
      return { nodeId, value, node };
    }).sort((a, b) => a.value - b.value);

    // Consider removing bottom 20% of nodes
    const weakNodes = nodeValues.slice(0, Math.ceil(nodeValues.length * 0.2));

    for (const weak of weakNodes) {
      // Find better alternatives
      const alternatives = this.findAlternativeNodes(weak.nodeId, allocatedNodes);

      for (const altId of alternatives) {
        const altNode = this.passiveTreeData.nodes[altId];

        // Simulate the swap
        const simulatedChar = this.cloneCharacter(this.character);
        const nodeIndex = simulatedChar.passiveTree.allocatedNodes.indexOf(weak.nodeId);
        if (nodeIndex > -1) {
          simulatedChar.passiveTree.allocatedNodes[nodeIndex] = altId;
        }

        const newMetrics = this.calculateMetrics(simulatedChar);
        const impact = this.calculateImpact(baseline, newMetrics);

        if (this.isWorthwhile(impact)) {
          recommendations.push({
            type: 'passive',
            action: 'replace',
            target: weak.nodeId.toString(),
            replacement: altId.toString(),
            impact,
            confidence: 0.75, // Lower confidence for respec recommendations
            priority: this.calculatePriority(impact, 0.75),
            description: `Replace ${weak.node.name} with ${altNode.name}`,
            reasoning: `This swap provides better value for your build goals. ${this.generateReasoning(impact, altNode)}`
          });
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Optimize skill gems and support gems
   */
  private async optimizeGems(
    baseline: any,
    limit: number
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const currentGems = this.character.gems || [];

    // Analyze current gem setup
    for (const gem of currentGems) {
      if (gem.type === 'support') {
        // Find better support gem alternatives
        const alternatives = this.findAlternativeSupportGems(gem, currentGems);

        for (const altGem of alternatives) {
          // Simulate gem replacement
          const simulatedChar = this.cloneCharacter(this.character);
          const gemIndex = simulatedChar.gems.findIndex(g => g.id === gem.id);
          if (gemIndex > -1) {
            simulatedChar.gems[gemIndex] = altGem;
          }

          const newMetrics = this.calculateMetrics(simulatedChar);
          const impact = this.calculateImpact(baseline, newMetrics);

          if (this.isWorthwhile(impact)) {
            const cost = await this.getMarketPrice(altGem.name);
            impact.cost = cost;

            recommendations.push({
              type: 'gem',
              action: 'replace',
              target: gem.id,
              replacement: altGem.id,
              impact,
              confidence: 0.85,
              priority: this.calculatePriority(impact, 0.85, cost),
              description: `Replace ${gem.name} with ${altGem.name}`,
              reasoning: this.generateGemReasoning(gem, altGem, impact)
            });
          }
        }
      }
    }

    // Check for missing optimal support gems
    const missingSupports = this.findMissingOptimalSupports(currentGems);
    for (const support of missingSupports) {
      const simulatedChar = this.cloneCharacter(this.character);
      simulatedChar.gems.push(support);

      const newMetrics = this.calculateMetrics(simulatedChar);
      const impact = this.calculateImpact(baseline, newMetrics);

      if (this.isWorthwhile(impact)) {
        const cost = await this.getMarketPrice(support.name);
        impact.cost = cost;

        recommendations.push({
          type: 'gem',
          action: 'add',
          target: support.id,
          impact,
          confidence: 0.9,
          priority: this.calculatePriority(impact, 0.9, cost),
          description: `Add ${support.name} support gem`,
          reasoning: `This support gem synergizes well with your current setup. ${this.generateReasoning(impact, support)}`
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Optimize equipment pieces
   */
  private async optimizeEquipment(
    baseline: any,
    limit: number
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const equipment = this.character.equipment || {};

    // Priority order for equipment slots
    const slotPriority = ['weapon', 'body', 'helmet', 'gloves', 'boots', 'amulet', 'ring1', 'ring2', 'belt'];

    for (const slot of slotPriority) {
      const currentItem = equipment[slot];
      if (!currentItem) continue;

      // Find upgrade candidates
      const upgrades = await this.findEquipmentUpgrades(slot, currentItem);

      for (const upgrade of upgrades) {
        // Simulate equipment change
        const simulatedChar = this.cloneCharacter(this.character);
        simulatedChar.equipment[slot] = upgrade;

        const newMetrics = this.calculateMetrics(simulatedChar);
        const impact = this.calculateImpact(baseline, newMetrics);

        const cost = await this.getMarketPrice(upgrade.name);
        impact.cost = cost;

        // Check cost-effectiveness
        if (this.isCostEffective(impact, cost)) {
          recommendations.push({
            type: 'equipment',
            action: 'replace',
            target: `${slot}:${currentItem.id}`,
            replacement: upgrade.id,
            impact,
            confidence: 0.7, // Lower confidence due to market volatility
            priority: this.calculatePriority(impact, 0.7, cost),
            description: `Upgrade ${slot}: ${currentItem.name} → ${upgrade.name}`,
            reasoning: this.generateEquipmentReasoning(currentItem, upgrade, impact, cost)
          });
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Optimize jewels
   */
  private async optimizeJewels(
    baseline: any,
    limit: number
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    const jewels = this.character.jewels || [];

    // Analyze each jewel slot
    for (const jewel of jewels) {
      const alternatives = await this.findJewelAlternatives(jewel);

      for (const altJewel of alternatives) {
        // Simulate jewel replacement
        const simulatedChar = this.cloneCharacter(this.character);
        const jewelIndex = simulatedChar.jewels.findIndex(j => j.id === jewel.id);
        if (jewelIndex > -1) {
          simulatedChar.jewels[jewelIndex] = altJewel;
        }

        const newMetrics = this.calculateMetrics(simulatedChar);
        const impact = this.calculateImpact(baseline, newMetrics);

        const cost = await this.getMarketPrice(altJewel.name);
        impact.cost = cost;

        if (this.isCostEffective(impact, cost)) {
          recommendations.push({
            type: 'jewel',
            action: 'replace',
            target: jewel.id,
            replacement: altJewel.id,
            impact,
            confidence: 0.8,
            priority: this.calculatePriority(impact, 0.8, cost),
            description: `Replace jewel: ${jewel.name} → ${altJewel.name}`,
            reasoning: this.generateJewelReasoning(jewel, altJewel, impact)
          });
        }
      }
    }

    // Check for empty jewel sockets
    const emptySlots = this.findEmptyJewelSlots();
    for (const slot of emptySlots) {
      const optimalJewel = await this.findOptimalJewelForSlot(slot);
      if (optimalJewel) {
        const simulatedChar = this.cloneCharacter(this.character);
        simulatedChar.jewels.push(optimalJewel);

        const newMetrics = this.calculateMetrics(simulatedChar);
        const impact = this.calculateImpact(baseline, newMetrics);

        const cost = await this.getMarketPrice(optimalJewel.name);
        impact.cost = cost;

        recommendations.push({
          type: 'jewel',
          action: 'add',
          target: slot,
          impact,
          confidence: 0.85,
          priority: this.calculatePriority(impact, 0.85, cost),
          description: `Socket ${optimalJewel.name} in empty slot`,
          reasoning: `This jewel provides excellent value for your build. ${this.generateReasoning(impact, optimalJewel)}`
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  // Helper methods

  private calculateMetrics(character: Character): any {
    const damage = calculateDamage(character);
    const ehp = calculateEffectiveHP(character);

    return {
      dps: damage.total,
      life: character.life?.maximum || 0,
      ehp: ehp.physical,
      resistance: {
        fire: character.resistances?.fire || 0,
        cold: character.resistances?.cold || 0,
        lightning: character.resistances?.lightning || 0,
        chaos: character.resistances?.chaos || 0
      },
      spirit: {
        used: character.spirit?.used || 0,
        total: character.spirit?.total || 0
      }
    };
  }

  private calculateImpact(baseline: any, newMetrics: any): any {
    return {
      dps: {
        before: baseline.dps,
        after: newMetrics.dps,
        change: newMetrics.dps - baseline.dps,
        changePercent: ((newMetrics.dps - baseline.dps) / baseline.dps) * 100
      },
      life: {
        before: baseline.life,
        after: newMetrics.life,
        change: newMetrics.life - baseline.life,
        changePercent: ((newMetrics.life - baseline.life) / baseline.life) * 100
      },
      ehp: {
        before: baseline.ehp,
        after: newMetrics.ehp,
        change: newMetrics.ehp - baseline.ehp,
        changePercent: ((newMetrics.ehp - baseline.ehp) / baseline.ehp) * 100
      },
      resistance: Object.keys(baseline.resistance).reduce((acc, type) => {
        acc[type] = {
          before: baseline.resistance[type],
          after: newMetrics.resistance[type],
          change: newMetrics.resistance[type] - baseline.resistance[type]
        };
        return acc;
      }, {} as any),
      spirit: {
        before: baseline.spirit.used,
        after: newMetrics.spirit.used,
        change: newMetrics.spirit.used - baseline.spirit.used
      }
    };
  }

  private calculatePriority(impact: any, confidence: number, cost?: number): number {
    const weights = this.goal.weights || { dps: 1, life: 0.5, resistance: 0.3, cost: 0.2 };

    let score = 0;
    score += Math.abs(impact.dps.changePercent) * (weights.dps || 1);
    score += Math.abs(impact.life.changePercent) * (weights.life || 0.5);
    score += Math.abs(impact.ehp.changePercent) * 0.8;

    // Penalize expensive upgrades if cost-efficiency is a goal
    if (cost && this.goal.metric === 'cost-efficient') {
      const costPenalty = Math.log10(cost + 1) / 10;
      score *= (1 - costPenalty);
    }

    return score * confidence;
  }

  private isWorthwhile(impact: any): boolean {
    // Check if the improvement meets minimum thresholds
    const dpsImprovement = impact.dps.changePercent > 1; // At least 1% DPS increase
    const lifeImprovement = impact.life.changePercent > 0.5; // At least 0.5% life increase
    const ehpImprovement = impact.ehp.changePercent > 1; // At least 1% EHP increase

    return dpsImprovement || lifeImprovement || ehpImprovement;
  }

  private isCostEffective(impact: any, cost: number): boolean {
    if (!cost) return true;

    const constraints = this.goal.constraints;
    if (constraints?.maxCost && cost > constraints.maxCost) {
      return false;
    }

    // Calculate value per chaos orb
    const totalImprovement = Math.abs(impact.dps.changePercent) +
                            Math.abs(impact.life.changePercent) * 0.5 +
                            Math.abs(impact.ehp.changePercent) * 0.7;

    const valuePerChaos = totalImprovement / cost;

    // Require at least 0.1% improvement per chaos orb
    return valuePerChaos > 0.1;
  }

  private generateReasoning(impact: any, item: any): string {
    const reasons = [];

    if (impact.dps.changePercent > 0) {
      reasons.push(`+${impact.dps.changePercent.toFixed(1)}% DPS`);
    }
    if (impact.life.changePercent > 0) {
      reasons.push(`+${impact.life.changePercent.toFixed(1)}% Life`);
    }
    if (impact.ehp.changePercent > 0) {
      reasons.push(`+${impact.ehp.changePercent.toFixed(1)}% EHP`);
    }

    const mainReason = reasons.join(', ');
    return `${mainReason}. ${item.name ? `${item.name} provides optimal stats for your build.` : ''}`;
  }

  private generateGemReasoning(oldGem: GemItem, newGem: GemItem, impact: any): string {
    const reasons = [`${newGem.name} provides better scaling for your build`];

    if (impact.dps.changePercent > 5) {
      reasons.push(`significant DPS increase (+${impact.dps.changePercent.toFixed(1)}%)`);
    }

    if (impact.spirit && impact.spirit.change < 0) {
      reasons.push(`frees up ${Math.abs(impact.spirit.change)} Spirit`);
    }

    return reasons.join(' and ') + '.';
  }

  private generateEquipmentReasoning(oldItem: Item, newItem: Item, impact: any, cost: number): string {
    const improvements = [];

    if (impact.dps.changePercent > 0) {
      improvements.push(`DPS: +${impact.dps.changePercent.toFixed(1)}%`);
    }
    if (impact.life.changePercent > 0) {
      improvements.push(`Life: +${impact.life.changePercent.toFixed(1)}%`);
    }

    const costEfficiency = (impact.dps.changePercent + impact.life.changePercent) / cost;
    if (costEfficiency > 0.5) {
      improvements.push('excellent cost efficiency');
    }

    return `Upgrade provides: ${improvements.join(', ')}. Estimated cost: ${cost} chaos orbs.`;
  }

  private generateJewelReasoning(oldJewel: Item, newJewel: Item, impact: any): string {
    return `This jewel better aligns with your build's needs, providing ${impact.dps.changePercent.toFixed(1)}% more damage and ${impact.life.changePercent.toFixed(1)}% more survivability.`;
  }

  private cloneCharacter(character: Character): Character {
    return JSON.parse(JSON.stringify(character));
  }

  private getAvailablePassivePoints(): number {
    const level = this.character.level || 1;
    const questPoints = 22; // PoE 2 gives 22 passive points from quests
    const totalPoints = (level - 1) + questPoints;
    const usedPoints = this.character.passiveTree?.allocatedNodes?.length || 0;
    return totalPoints - usedPoints;
  }

  private findReachableNodes(allocatedNodes: Set<number>): number[] {
    // Implementation would check tree connectivity
    return [];
  }

  private evaluateNodeValue(node: any, character: Character): number {
    // Evaluate node value based on character needs
    return 0;
  }

  private findAlternativeNodes(nodeId: number, allocated: number[]): number[] {
    // Find alternative nodes of similar point cost
    return [];
  }

  private findAlternativeSupportGems(gem: GemItem, currentGems: GemItem[]): GemItem[] {
    // Find alternative support gems
    return [];
  }

  private findMissingOptimalSupports(currentGems: GemItem[]): GemItem[] {
    // Find missing optimal support gems
    return [];
  }

  private async findEquipmentUpgrades(slot: string, current: Item): Promise<Item[]> {
    // Find equipment upgrades from market/database
    return [];
  }

  private async findJewelAlternatives(jewel: Item): Promise<Item[]> {
    // Find alternative jewels
    return [];
  }

  private findEmptyJewelSlots(): string[] {
    // Find empty jewel slots in passive tree
    return [];
  }

  private async findOptimalJewelForSlot(slot: string): Promise<Item | null> {
    // Find optimal jewel for empty slot
    return null;
  }

  private async getMarketPrice(itemName: string): Promise<number> {
    // Get market price in chaos orbs
    return this.marketPrices.get(itemName) || 0;
  }
}

// Genetic Algorithm Implementation
export class GeneticBuildOptimizer {
  private populationSize: number = 50;
  private generations: number = 100;
  private mutationRate: number = 0.1;
  private eliteSize: number = 5;

  async optimizeBuild(
    character: Character,
    goal: OptimizationGoal
  ): Promise<BuildGenome> {
    // Initialize population
    let population = this.initializePopulation(character);

    for (let gen = 0; gen < this.generations; gen++) {
      // Evaluate fitness
      population = this.evaluateFitness(population, goal);

      // Selection
      const parents = this.selection(population);

      // Crossover
      const offspring = this.crossover(parents);

      // Mutation
      this.mutate(offspring);

      // Create new generation
      population = this.createNewGeneration(population, offspring);
    }

    // Return best genome
    return population[0];
  }

  private initializePopulation(character: Character): BuildGenome[] {
    // Create initial population based on character
    return [];
  }

  private evaluateFitness(population: BuildGenome[], goal: OptimizationGoal): BuildGenome[] {
    // Evaluate fitness for each genome
    return population;
  }

  private selection(population: BuildGenome[]): BuildGenome[] {
    // Tournament selection
    return [];
  }

  private crossover(parents: BuildGenome[]): BuildGenome[] {
    // Uniform crossover for build genomes
    return [];
  }

  private mutate(offspring: BuildGenome[]): void {
    // Random mutations
  }

  private createNewGeneration(
    population: BuildGenome[],
    offspring: BuildGenome[]
  ): BuildGenome[] {
    // Combine elite and offspring
    return [];
  }
}