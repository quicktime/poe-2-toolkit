/**
 * Web Worker for Build Optimization
 * Runs genetic algorithm and optimization calculations off main thread
 */

interface PassiveNode {
  id: number;
  name: string;
  stats: string[];
  position: { x: number; y: number };
  allocated: boolean;
}

interface OptimizationRequest {
  type: 'optimize_passives';
  payload: {
    currentNodes: number[];
    availableNodes: PassiveNode[];
    targetStat: string;
    maxPoints: number;
  };
  requestId: string;
}

interface GeneticOptimizationRequest {
  type: 'genetic_optimize';
  payload: {
    population: number;
    generations: number;
    currentBuild: any;
    constraints: any;
  };
  requestId: string;
}

type WorkerRequest = OptimizationRequest | GeneticOptimizationRequest;

interface WorkerResponse {
  type: string;
  requestId: string;
  result: any;
  error?: string;
  progress?: number;
}

/**
 * Simple genetic algorithm for build optimization
 */
function geneticOptimize(payload: GeneticOptimizationRequest['payload']): any {
  const { population, generations, currentBuild } = payload;

  // Simplified genetic algorithm implementation
  let bestSolution = currentBuild;
  let bestScore = 0;

  for (let gen = 0; gen < generations; gen++) {
    // Generate population
    const candidates = [];
    for (let i = 0; i < population; i++) {
      // Mutate current build
      const candidate = mutateBuild(currentBuild);
      const score = evaluateBuild(candidate);

      candidates.push({ build: candidate, score });

      if (score > bestScore) {
        bestScore = score;
        bestSolution = candidate;
      }
    }

    // Report progress every 10 generations
    if (gen % 10 === 0) {
      self.postMessage({
        type: 'progress',
        progress: (gen / generations) * 100,
      });
    }
  }

  return {
    optimizedBuild: bestSolution,
    score: bestScore,
  };
}

/**
 * Mutate a build (simplified)
 */
function mutateBuild(build: any): any {
  // Create a copy
  const mutated = JSON.parse(JSON.stringify(build));

  // Random mutations
  const mutationChance = 0.1;
  if (Math.random() < mutationChance) {
    // Swap a passive node
    if (mutated.passiveNodes && mutated.passiveNodes.length > 0) {
      const idx = Math.floor(Math.random() * mutated.passiveNodes.length);
      mutated.passiveNodes[idx] = Math.floor(Math.random() * 1000);
    }
  }

  return mutated;
}

/**
 * Evaluate a build (simplified scoring)
 */
function evaluateBuild(build: any): number {
  let score = 0;

  // Score based on number of allocated nodes (placeholder)
  if (build.passiveNodes) {
    score += build.passiveNodes.length * 10;
  }

  // Add randomness for demonstration
  score += Math.random() * 100;

  return score;
}

/**
 * Optimize passive tree allocation
 */
function optimizePassives(payload: OptimizationRequest['payload']): number[] {
  const { currentNodes, availableNodes, targetStat, maxPoints } = payload;

  // Simple greedy algorithm to allocate passive nodes
  const allocated = [...currentNodes];
  const unallocated = availableNodes.filter(n => !currentNodes.includes(n.id));

  // Sort by value for target stat
  const scored = unallocated.map(node => ({
    node,
    score: calculateNodeValue(node, targetStat),
  })).sort((a, b) => b.score - a.score);

  // Allocate up to maxPoints
  const pointsAvailable = maxPoints - currentNodes.length;
  for (let i = 0; i < Math.min(pointsAvailable, scored.length); i++) {
    allocated.push(scored[i].node.id);
  }

  return allocated;
}

/**
 * Calculate value of a passive node for target stat
 */
function calculateNodeValue(node: PassiveNode, targetStat: string): number {
  let value = 0;

  for (const stat of node.stats) {
    if (stat.toLowerCase().includes(targetStat.toLowerCase())) {
      // Extract numeric value if present
      const match = stat.match(/(\d+)/);
      if (match) {
        value += parseInt(match[1]);
      } else {
        value += 1; // Default value for non-numeric stats
      }
    }
  }

  return value;
}

/**
 * Handle incoming messages
 */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload, requestId } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'optimize_passives':
        result = optimizePassives(payload as OptimizationRequest['payload']);
        break;

      case 'genetic_optimize':
        result = geneticOptimize(payload as GeneticOptimizationRequest['payload']);
        break;

      default:
        throw new Error(`Unknown optimization type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      requestId,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      requestId,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
};

// Notify that worker is ready
self.postMessage({ type: 'ready' });
