/**
 * Waystone Optimizer
 * PoE2 v0.3 Waystone (endgame map) optimization utilities
 */

export interface WaystoneModifier {
  id: string;
  name: string;
  description: string;
  tier: number;
  packSize?: number;
  itemQuantity?: number;
  itemRarity?: number;
  monsterLevel?: number;
  difficulty: number; // 1-10 scale
}

export interface Waystone {
  name: string;
  tier: number;
  modifiers: WaystoneModifier[];
  difficulty: number;
  reward: number;
}

export interface OptimizerConfig {
  minTier: number;
  maxTier: number;
  preferredMods: string[];
  avoidedMods: string[];
  targetDifficulty: number;
}

export class WaystoneOptimizer {
  /**
   * Calculate waystone difficulty based on mods
   */
  calculateDifficulty(waystone: Waystone): number {
    if (waystone.modifiers.length === 0) return waystone.tier;

    const modDifficulty = waystone.modifiers.reduce(
      (sum, mod) => sum + mod.difficulty,
      0
    );

    return waystone.tier + modDifficulty / 10;
  }

  /**
   * Calculate expected reward multiplier
   */
  calculateReward(waystone: Waystone): number {
    let multiplier = 1;

    waystone.modifiers.forEach((mod) => {
      if (mod.itemQuantity) multiplier += mod.itemQuantity / 100;
      if (mod.itemRarity) multiplier += mod.itemRarity / 200; // Rarity worth less
      if (mod.packSize) multiplier += mod.packSize / 150;
    });

    return multiplier * (1 + waystone.tier / 20);
  }

  /**
   * Score a waystone based on config preferences
   */
  scoreWaystone(waystone: Waystone, config: OptimizerConfig): number {
    const difficulty = this.calculateDifficulty(waystone);
    const reward = this.calculateReward(waystone);

    // Penalty for being outside tier range
    let tierScore = 1;
    if (waystone.tier < config.minTier || waystone.tier > config.maxTier) {
      tierScore = 0.5;
    }

    // Bonus for preferred mods
    let modScore = 1;
    waystone.modifiers.forEach((mod) => {
      if (config.preferredMods.includes(mod.id)) {
        modScore += 0.2;
      }
      if (config.avoidedMods.includes(mod.id)) {
        modScore -= 0.3;
      }
    });

    // Penalty for difficulty being too far from target
    const difficultyDelta = Math.abs(difficulty - config.targetDifficulty);
    const difficultyScore = Math.max(0, 1 - difficultyDelta / 10);

    return reward * tierScore * modScore * difficultyScore;
  }

  /**
   * Get recommended waystones from a list
   */
  recommendWaystones(
    waystones: Waystone[],
    config: OptimizerConfig,
    count: number = 5
  ): Waystone[] {
    const scored = waystones.map((ws) => ({
      waystone: ws,
      score: this.scoreWaystone(ws, config),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map((s) => s.waystone);
  }

  /**
   * Suggest mods to add to a waystone
   */
  suggestMods(
    currentWaystone: Waystone,
    availableMods: WaystoneModifier[],
    config: OptimizerConfig
  ): WaystoneModifier[] {
    const currentDifficulty = this.calculateDifficulty(currentWaystone);
    const allowedDifficulty = config.targetDifficulty - currentDifficulty;

    return availableMods
      .filter((mod) => mod.difficulty <= allowedDifficulty)
      .filter((mod) => !config.avoidedMods.includes(mod.id))
      .sort((a, b) => {
        const aPreferred = config.preferredMods.includes(a.id) ? 1 : 0;
        const bPreferred = config.preferredMods.includes(b.id) ? 1 : 0;
        return bPreferred - aPreferred;
      })
      .slice(0, 6 - currentWaystone.modifiers.length);
  }
}

export const waystoneOptimizer = new WaystoneOptimizer();
