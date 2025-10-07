import type { PassiveTreeData, PassiveNode, AllocatedPassives, PassiveTreePath } from '@/types/passiveTree';

/**
 * Path validation utilities for passive tree node allocation
 */

export class PassiveTreePathValidator {
  private treeData: PassiveTreeData;
  private startingNodes: Set<number>;

  constructor(treeData: PassiveTreeData) {
    this.treeData = treeData;
    this.startingNodes = new Set();

    // Collect all class starting nodes
    if (treeData.classes) {
      Object.values(treeData.classes).forEach(classData => {
        this.startingNodes.add(classData.startingNode);
      });
    }

    // Also mark nodes that have classStartingNode property
    Object.entries(treeData.nodes).forEach(([nodeId, node]) => {
      if (node.classStartingNode) {
        this.startingNodes.add(parseInt(nodeId));
      }
    });
  }

  /**
   * Check if a node can be allocated given current allocations
   */
  canAllocateNode(nodeId: number, allocated: AllocatedPassives): boolean {
    // If already allocated, can't allocate again
    if (allocated.nodes.has(nodeId)) {
      return false;
    }

    const node = this.treeData.nodes[nodeId];
    if (!node) {
      return false;
    }

    // Check if node is connected to allocated tree
    return this.isConnectedToAllocatedTree(nodeId, allocated);
  }

  /**
   * Check if a node is connected to the allocated tree
   */
  isConnectedToAllocatedTree(nodeId: number, allocated: AllocatedPassives): boolean {
    const node = this.treeData.nodes[nodeId];
    if (!node) {
      return false;
    }

    // Starting nodes can always be allocated if we have that class
    if (this.startingNodes.has(nodeId)) {
      return true;
    }

    // Check if any connected node is allocated
    for (const connectedId of node.connections) {
      if (allocated.nodes.has(connectedId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find the shortest path from any allocated node to target node
   * Returns null if no path exists
   */
  findShortestPath(targetNodeId: number, allocated: AllocatedPassives): PassiveTreePath | null {
    const target = this.treeData.nodes[targetNodeId];
    if (!target) {
      return null;
    }

    // If already allocated, path cost is 0
    if (allocated.nodes.has(targetNodeId)) {
      return { nodes: [targetNodeId], cost: 0 };
    }

    // BFS to find shortest path from any allocated node
    const queue: Array<{ nodeId: number; path: number[]; cost: number }> = [];
    const visited = new Set<number>();

    // Start from all allocated nodes and starting nodes
    const startNodes = new Set([...allocated.nodes, ...this.startingNodes]);

    for (const startId of startNodes) {
      if (this.treeData.nodes[startId]) {
        queue.push({ nodeId: startId, path: [startId], cost: 0 });
        visited.add(startId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Found target
      if (current.nodeId === targetNodeId) {
        return {
          nodes: current.path,
          cost: current.cost
        };
      }

      // Explore neighbors
      const node = this.treeData.nodes[current.nodeId];
      if (!node) continue;

      for (const neighborId of node.connections) {
        if (visited.has(neighborId)) continue;

        visited.add(neighborId);
        const newPath = [...current.path, neighborId];
        // Cost increases by 1 if neighbor is not allocated
        const newCost = allocated.nodes.has(neighborId) ? current.cost : current.cost + 1;

        queue.push({
          nodeId: neighborId,
          path: newPath,
          cost: newCost
        });
      }
    }

    return null;
  }

  /**
   * Get all nodes that can be reached from current allocations
   */
  getReachableNodes(allocated: AllocatedPassives): Set<number> {
    const reachable = new Set<number>();
    const visited = new Set<number>();
    const queue: number[] = [];

    // Start from all allocated nodes and starting nodes
    const startNodes = new Set([...allocated.nodes, ...this.startingNodes]);

    for (const startId of startNodes) {
      if (this.treeData.nodes[startId]) {
        queue.push(startId);
        visited.add(startId);
        reachable.add(startId);
      }
    }

    // BFS
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.treeData.nodes[currentId];
      if (!node) continue;

      for (const neighborId of node.connections) {
        if (visited.has(neighborId)) continue;

        visited.add(neighborId);
        reachable.add(neighborId);
        queue.push(neighborId);
      }
    }

    return reachable;
  }

  /**
   * Validate entire allocated tree is connected
   */
  validateAllocatedTree(allocated: AllocatedPassives): { valid: boolean; orphanedNodes: number[] } {
    if (allocated.nodes.size === 0) {
      return { valid: true, orphanedNodes: [] };
    }

    // Get all nodes reachable from starting nodes
    const reachable = new Set<number>();
    const visited = new Set<number>();
    const queue: number[] = [];

    // Start only from allocated starting nodes
    for (const startId of this.startingNodes) {
      if (allocated.nodes.has(startId)) {
        queue.push(startId);
        visited.add(startId);
        reachable.add(startId);
      }
    }

    // If no starting node allocated, tree is invalid
    if (queue.length === 0) {
      return {
        valid: false,
        orphanedNodes: Array.from(allocated.nodes)
      };
    }

    // BFS to find all reachable allocated nodes
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.treeData.nodes[currentId];
      if (!node) continue;

      for (const neighborId of node.connections) {
        if (visited.has(neighborId)) continue;
        if (!allocated.nodes.has(neighborId)) continue;

        visited.add(neighborId);
        reachable.add(neighborId);
        queue.push(neighborId);
      }
    }

    // Find orphaned nodes
    const orphanedNodes = Array.from(allocated.nodes).filter(id => !reachable.has(id));

    return {
      valid: orphanedNodes.length === 0,
      orphanedNodes
    };
  }

  /**
   * Calculate points required to allocate a node from current state
   */
  calculatePointsRequired(targetNodeId: number, allocated: AllocatedPassives): number {
    const path = this.findShortestPath(targetNodeId, allocated);
    if (!path) {
      return Infinity;
    }

    // Count unallocated nodes in path (excluding the target itself)
    let cost = 0;
    for (let i = 0; i < path.nodes.length; i++) {
      const nodeId = path.nodes[i];
      if (!allocated.nodes.has(nodeId)) {
        cost++;
      }
    }

    return cost;
  }

  /**
   * Get all nodes that can be allocated with current state (1 point away)
   */
  getAvailableNodes(allocated: AllocatedPassives): number[] {
    const available: number[] = [];

    Object.keys(this.treeData.nodes).forEach(nodeIdStr => {
      const nodeId = parseInt(nodeIdStr);
      if (this.canAllocateNode(nodeId, allocated)) {
        available.push(nodeId);
      }
    });

    return available;
  }

  /**
   * Suggest path to allocate a node (auto-allocate intermediate nodes)
   */
  suggestAllocationPath(targetNodeId: number, allocated: AllocatedPassives): number[] {
    const path = this.findShortestPath(targetNodeId, allocated);
    if (!path) {
      return [];
    }

    // Return only unallocated nodes in the path
    return path.nodes.filter(id => !allocated.nodes.has(id));
  }

  /**
   * Check if deallocating a node would orphan other nodes
   */
  canDeallocateNode(nodeId: number, allocated: AllocatedPassives): {
    canDeallocate: boolean;
    affectedNodes: number[]
  } {
    if (!allocated.nodes.has(nodeId)) {
      return { canDeallocate: false, affectedNodes: [] };
    }

    // Create new allocation without this node
    const newAllocated: AllocatedPassives = {
      ...allocated,
      nodes: new Set(allocated.nodes)
    };
    newAllocated.nodes.delete(nodeId);

    // Validate the new tree
    const validation = this.validateAllocatedTree(newAllocated);

    return {
      canDeallocate: validation.valid,
      affectedNodes: validation.orphanedNodes
    };
  }

  /**
   * Get the dependency chain for a node (all nodes that depend on this node)
   */
  getDependentNodes(nodeId: number, allocated: AllocatedPassives): number[] {
    if (!allocated.nodes.has(nodeId)) {
      return [];
    }

    const dependents = new Set<number>();
    const visited = new Set<number>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.treeData.nodes[currentId];
      if (!node) continue;

      // Check each allocated neighbor
      for (const neighborId of node.connections) {
        if (!allocated.nodes.has(neighborId)) continue;
        if (visited.has(neighborId)) continue;
        if (neighborId === nodeId) continue;

        // Check if this neighbor would be orphaned without current node
        const testAllocated: AllocatedPassives = {
          ...allocated,
          nodes: new Set(allocated.nodes)
        };
        testAllocated.nodes.delete(nodeId);

        const path = this.findShortestPath(neighborId, testAllocated);
        if (!path) {
          // This node depends on currentId
          dependents.add(neighborId);
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return Array.from(dependents);
  }
}

/**
 * Create a validator instance
 */
export function createPathValidator(treeData: PassiveTreeData): PassiveTreePathValidator {
  return new PassiveTreePathValidator(treeData);
}

/**
 * Quick validation function for simple checks
 */
export function isNodeAllocatable(
  nodeId: number,
  allocated: AllocatedPassives,
  treeData: PassiveTreeData
): boolean {
  const validator = new PassiveTreePathValidator(treeData);
  return validator.canAllocateNode(nodeId, allocated);
}
