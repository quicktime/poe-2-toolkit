import { Character } from '@/types/character';
import { OptimizationRecommendation, OptimizationGoal } from './buildOptimizer';
import { calculateDamage, calculateEffectiveHP } from '@/lib/calculations/poe2Calculations';
import { getPassiveTreeData } from '@/lib/passiveTree/treeDataService';

export interface IncrementalStep {
  action: string;
  cost: number; // In chaos orbs or respec points
  impact: {
    immediate: number; // Immediate benefit
    cumulative: number; // Total benefit including future steps
  };
  requirements: string[];
  unlocks: string[]; // What this step enables
}

export class IncrementalOptimizer {
  private character: Character;
  private goal: OptimizationGoal;
  private cache: Map<string, any> = new Map();

  constructor(character: Character, goal: OptimizationGoal) {
    this.character = character;
    this.goal = goal;
  }

  /**
   * Find the single best next action for the character
   */
  async findNextBestAction(): Promise<OptimizationRecommendation | null> {
    const candidates: OptimizationRecommendation[] = [];

    // Check different improvement categories
    const [
      passiveAction,
      gemAction,
      equipmentAction,
      jewelAction
    ] = await Promise.all([
      this.findBestPassiveAction(),
      this.findBestGemAction(),
      this.findBestEquipmentAction(),
      this.findBestJewelAction()
    ]);

    if (passiveAction) candidates.push(passiveAction);
    if (gemAction) candidates.push(gemAction);
    if (equipmentAction) candidates.push(equipmentAction);
    if (jewelAction) candidates.push(jewelAction);

    if (candidates.length === 0) return null;

    // Return the highest priority action
    return candidates.reduce((best, current) =>
      current.priority > best.priority ? current : best
    );
  }

  /**
   * Generate an optimization path with multiple steps
   */
  async generateOptimizationPath(steps: number = 10): Promise<IncrementalStep[]> {
    const path: IncrementalStep[] = [];
    let simulatedChar = this.cloneCharacter(this.character);
    let cumulativeBenefit = 0;

    for (let i = 0; i < steps; i++) {
      const optimizer = new IncrementalOptimizer(simulatedChar, this.goal);
      const nextAction = await optimizer.findNextBestAction();

      if (!nextAction) break;

      // Apply the action to our simulated character
      simulatedChar = this.applyRecommendation(simulatedChar, nextAction);

      // Calculate cumulative benefit
      const stepBenefit = this.calculateBenefit(nextAction);
      cumulativeBenefit += stepBenefit;

      path.push({
        action: nextAction.description,
        cost: nextAction.impact.cost || 0,
        impact: {
          immediate: stepBenefit,
          cumulative: cumulativeBenefit
        },
        requirements: this.getRequirements(nextAction),
        unlocks: this.getUnlocks(nextAction, simulatedChar)
      });
    }

    return path;
  }

  /**
   * Find the best passive tree action (single node)
   */
  private async findBestPassiveAction(): Promise<OptimizationRecommendation | null> {
    const treeData = getPassiveTreeData();
    const allocatedNodes = new Set(this.character.passiveTree?.allocatedNodes || []);
    const availablePoints = this.getAvailablePoints();

    if (availablePoints <= 0) {
      return this.findBestPassiveRespec();
    }

    // Find all reachable nodes
    const reachableNodes = this.getReachableNodes(allocatedNodes, treeData);

    let bestNode: OptimizationRecommendation | null = null;
    let bestScore = 0;

    for (const nodeId of reachableNodes) {
      const node = treeData.nodes[nodeId];
      if (!node) continue;

      // Calculate the value of this node
      const score = this.scorePassiveNode(node, nodeId);

      if (score > bestScore) {
        bestScore = score;
        bestNode = this.createPassiveRecommendation(node, nodeId, score);
      }
    }

    return bestNode;
  }

  /**
   * Find the best gem upgrade action
   */
  private async findBestGemAction(): Promise<OptimizationRecommendation | null> {
    const gems = this.character.gems || [];
    let bestAction: OptimizationRecommendation | null = null;
    let bestScore = 0;

    // Check each gem slot for potential upgrades
    for (const gem of gems) {
      if (gem.type !== 'support') continue;

      // Find the best alternative for this slot
      const alternatives = this.getGemAlternatives(gem);

      for (const alt of alternatives) {
        const score = await this.scoreGemSwap(gem, alt);

        if (score > bestScore) {
          bestScore = score;
          bestAction = this.createGemRecommendation(gem, alt, score);
        }
      }
    }

    // Check for new gem additions
    const emptySlots = this.getEmptyGemSlots();
    for (const slot of emptySlots) {
      const bestGem = this.findBestGemForSlot(slot);
      if (bestGem) {
        const score = await this.scoreGemAddition(bestGem);
        if (score > bestScore) {
          bestScore = score;
          bestAction = this.createGemAddRecommendation(bestGem, score);
        }
      }
    }

    return bestAction;
  }

  /**
   * Find the best equipment upgrade
   */
  private async findBestEquipmentAction(): Promise<OptimizationRecommendation | null> {
    const equipment = this.character.equipment || {};
    let bestAction: OptimizationRecommendation | null = null;
    let bestEfficiency = 0;

    // Check each slot for cost-effective upgrades
    const slots = ['weapon', 'body', 'helmet', 'gloves', 'boots', 'amulet', 'ring1', 'ring2', 'belt'];

    for (const slot of slots) {
      const current = equipment[slot];
      if (!current) continue;

      // Find upgrades within budget
      const upgrades = await this.findAffordableUpgrades(slot, current);

      for (const upgrade of upgrades) {
        const efficiency = await this.calculateUpgradeEfficiency(current, upgrade, slot);

        if (efficiency > bestEfficiency) {
          bestEfficiency = efficiency;
          bestAction = this.createEquipmentRecommendation(slot, current, upgrade, efficiency);
        }
      }
    }

    return bestAction;
  }

  /**
   * Find the best jewel action
   */
  private async findBestJewelAction(): Promise<OptimizationRecommendation | null> {
    const jewels = this.character.jewels || [];
    let bestAction: OptimizationRecommendation | null = null;
    let bestScore = 0;

    // Check existing jewels for upgrades
    for (const jewel of jewels) {
      const alternatives = await this.findJewelUpgrades(jewel);

      for (const alt of alternatives) {
        const score = this.scoreJewelSwap(jewel, alt);

        if (score > bestScore) {
          bestScore = score;
          bestAction = this.createJewelRecommendation(jewel, alt, score);
        }
      }
    }

    // Check empty jewel sockets
    const emptySlots = this.findEmptyJewelSockets();
    for (const slot of emptySlots) {
      const bestJewel = await this.findBestJewelForSocket(slot);
      if (bestJewel) {
        const score = this.scoreJewelAddition(bestJewel, slot);
        if (score > bestScore) {
          bestScore = score;
          bestAction = this.createJewelAddRecommendation(bestJewel, slot, score);
        }
      }
    }

    return bestAction;
  }

  /**
   * Score a passive node based on character needs
   */
  private scorePassiveNode(node: any, nodeId: number): number {
    let score = 0;
    const stats = node.stats || [];

    for (const stat of stats) {
      // Parse stat and calculate value
      if (stat.includes('% increased maximum Life')) {
        const value = this.extractValue(stat);
        score += value * (this.goal.weights?.life || 0.5);
      } else if (stat.includes('% increased Damage')) {
        const value = this.extractValue(stat);
        score += value * (this.goal.weights?.dps || 1);
      } else if (stat.includes('% to') && stat.includes('Resistance')) {
        const value = this.extractValue(stat);
        const currentRes = this.getCurrentResistance(stat);
        const resNeeded = Math.max(0, 75 - currentRes); // PoE 2 resistance cap
        score += value * Math.min(1, resNeeded / 10) * (this.goal.weights?.resistance || 0.3);
      }
    }

    // Bonus for notables and keystones
    if (node.isNotable) score *= 1.5;
    if (node.isKeystone) score *= 2;

    // Consider path efficiency
    const pathLength = this.getPathLength(nodeId);
    score /= Math.max(1, pathLength / 3); // Penalize long paths

    return score;
  }

  /**
   * Calculate upgrade efficiency (value per chaos orb)
   */
  private async calculateUpgradeEfficiency(
    current: any,
    upgrade: any,
    slot: string
  ): Promise<number> {
    const simulatedChar = this.cloneCharacter(this.character);
    simulatedChar.equipment[slot] = upgrade;

    const baseline = calculateDamage(this.character);
    const upgraded = calculateDamage(simulatedChar);

    const dpsGain = upgraded.total - baseline.total;
    const dpsGainPercent = (dpsGain / baseline.total) * 100;

    const cost = await this.getItemCost(upgrade);
    if (cost === 0) return 0;

    // Calculate efficiency: % improvement per chaos orb
    const efficiency = dpsGainPercent / cost;

    // Bonus for defensive stats
    const lifeGain = (upgrade.life || 0) - (current.life || 0);
    const resGain = this.calculateResistanceGain(current, upgrade);

    const defenseBonus = (lifeGain / 10 + resGain) / cost;

    return efficiency + defenseBonus;
  }

  /**
   * Apply a recommendation to create a new character state
   */
  private applyRecommendation(
    character: Character,
    recommendation: OptimizationRecommendation
  ): Character {
    const newChar = this.cloneCharacter(character);

    switch (recommendation.type) {
      case 'passive':
        if (recommendation.action === 'add') {
          newChar.passiveTree.allocatedNodes.push(parseInt(recommendation.target));
        } else if (recommendation.action === 'replace' && recommendation.replacement) {
          const index = newChar.passiveTree.allocatedNodes.indexOf(parseInt(recommendation.target));
          if (index > -1) {
            newChar.passiveTree.allocatedNodes[index] = parseInt(recommendation.replacement);
          }
        }
        break;

      case 'gem':
        if (recommendation.action === 'replace' && recommendation.replacement) {
          const gemIndex = newChar.gems.findIndex(g => g.id === recommendation.target);
          if (gemIndex > -1) {
            // Replace with new gem (would need actual gem data)
            newChar.gems[gemIndex].id = recommendation.replacement;
          }
        }
        break;

      case 'equipment':
        if (recommendation.action === 'replace' && recommendation.replacement) {
          const [slot] = recommendation.target.split(':');
          // Replace with new equipment (would need actual item data)
          newChar.equipment[slot] = { id: recommendation.replacement } as any;
        }
        break;

      case 'jewel':
        if (recommendation.action === 'replace' && recommendation.replacement) {
          const jewelIndex = newChar.jewels.findIndex(j => j.id === recommendation.target);
          if (jewelIndex > -1) {
            newChar.jewels[jewelIndex] = { id: recommendation.replacement } as any;
          }
        }
        break;
    }

    return newChar;
  }

  // Helper methods

  private cloneCharacter(character: Character): Character {
    return JSON.parse(JSON.stringify(character));
  }

  private getAvailablePoints(): number {
    const level = this.character.level || 1;
    const questPoints = 22; // PoE 2 quest rewards
    const total = (level - 1) + questPoints;
    const used = this.character.passiveTree?.allocatedNodes?.length || 0;
    return total - used;
  }

  private getReachableNodes(allocated: Set<number>, treeData: any): number[] {
    const reachable: number[] = [];
    const visited = new Set(allocated);

    // BFS to find all nodes connected to allocated nodes
    const queue = Array.from(allocated);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = treeData.nodes[nodeId];

      if (!node) continue;

      for (const connection of node.out || []) {
        if (!visited.has(connection)) {
          visited.add(connection);
          if (!allocated.has(connection)) {
            reachable.push(connection);
          } else {
            queue.push(connection);
          }
        }
      }
    }

    return reachable;
  }

  private getPathLength(nodeId: number): number {
    // Calculate minimum path length from start to node
    // This would use BFS from class start node
    return 1; // Placeholder
  }

  private extractValue(stat: string): number {
    const match = stat.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private getCurrentResistance(stat: string): number {
    if (stat.includes('Fire')) return this.character.resistances?.fire || 0;
    if (stat.includes('Cold')) return this.character.resistances?.cold || 0;
    if (stat.includes('Lightning')) return this.character.resistances?.lightning || 0;
    if (stat.includes('Chaos')) return this.character.resistances?.chaos || 0;
    return 0;
  }

  private calculateBenefit(recommendation: OptimizationRecommendation): number {
    const weights = this.goal.weights || { dps: 1, life: 0.5 };
    let benefit = 0;

    benefit += recommendation.impact.dps.changePercent * weights.dps;
    benefit += recommendation.impact.life.changePercent * weights.life;
    benefit += recommendation.impact.ehp.changePercent * 0.7;

    return benefit;
  }

  private getRequirements(recommendation: OptimizationRecommendation): string[] {
    const reqs: string[] = [];

    if (recommendation.type === 'passive') {
      reqs.push('1 passive point');
    } else if (recommendation.impact.cost) {
      reqs.push(`${recommendation.impact.cost} chaos orbs`);
    }

    return reqs;
  }

  private getUnlocks(recommendation: OptimizationRecommendation, character: Character): string[] {
    const unlocks: string[] = [];

    if (recommendation.type === 'passive') {
      // Check if this node unlocks access to notables or keystones
      const nodeId = parseInt(recommendation.target);
      const treeData = getPassiveTreeData();
      const node = treeData.nodes[nodeId];

      if (node) {
        for (const connection of node.out || []) {
          const connectedNode = treeData.nodes[connection];
          if (connectedNode?.isNotable) {
            unlocks.push(`Access to ${connectedNode.name} (Notable)`);
          } else if (connectedNode?.isKeystone) {
            unlocks.push(`Access to ${connectedNode.name} (Keystone)`);
          }
        }
      }
    }

    return unlocks;
  }

  private findBestPassiveRespec(): Promise<OptimizationRecommendation | null> {
    // Find the best node to respec for better value
    return Promise.resolve(null);
  }

  private createPassiveRecommendation(node: any, nodeId: number, score: number): OptimizationRecommendation {
    const baseline = calculateDamage(this.character);
    const simChar = this.cloneCharacter(this.character);
    simChar.passiveTree.allocatedNodes.push(nodeId);
    const upgraded = calculateDamage(simChar);

    return {
      type: 'passive',
      action: 'add',
      target: nodeId.toString(),
      impact: {
        dps: {
          before: baseline.total,
          after: upgraded.total,
          change: upgraded.total - baseline.total,
          changePercent: ((upgraded.total - baseline.total) / baseline.total) * 100
        },
        life: {
          before: this.character.life?.maximum || 0,
          after: simChar.life?.maximum || 0,
          change: (simChar.life?.maximum || 0) - (this.character.life?.maximum || 0),
          changePercent: 0
        },
        ehp: {
          before: 0,
          after: 0,
          change: 0,
          changePercent: 0
        }
      },
      confidence: 0.9,
      priority: score,
      description: `Allocate ${node.name || `Node ${nodeId}`}`,
      reasoning: `Optimal next node for your build path`
    };
  }

  // Placeholder implementations for remaining helper methods
  private getGemAlternatives(gem: any): any[] { return []; }
  private scoreGemSwap(current: any, alternative: any): Promise<number> { return Promise.resolve(0); }
  private createGemRecommendation(current: any, alternative: any, score: number): OptimizationRecommendation | null { return null; }
  private getEmptyGemSlots(): any[] { return []; }
  private findBestGemForSlot(slot: any): any { return null; }
  private scoreGemAddition(gem: any): Promise<number> { return Promise.resolve(0); }
  private createGemAddRecommendation(gem: any, score: number): OptimizationRecommendation | null { return null; }
  private findAffordableUpgrades(slot: string, current: any): Promise<any[]> { return Promise.resolve([]); }
  private createEquipmentRecommendation(slot: string, current: any, upgrade: any, efficiency: number): OptimizationRecommendation | null { return null; }
  private findJewelUpgrades(jewel: any): Promise<any[]> { return Promise.resolve([]); }
  private scoreJewelSwap(current: any, alternative: any): number { return 0; }
  private createJewelRecommendation(current: any, alternative: any, score: number): OptimizationRecommendation | null { return null; }
  private findEmptyJewelSockets(): any[] { return []; }
  private findBestJewelForSocket(slot: any): Promise<any> { return Promise.resolve(null); }
  private scoreJewelAddition(jewel: any, slot: any): number { return 0; }
  private createJewelAddRecommendation(jewel: any, slot: any, score: number): OptimizationRecommendation | null { return null; }
  private async getItemCost(item: any): Promise<number> { return 1; }
  private calculateResistanceGain(current: any, upgrade: any): number { return 0; }
}