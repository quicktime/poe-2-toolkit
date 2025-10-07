import { PassiveTreePathValidator, createPathValidator, isNodeAllocatable } from '../pathValidator';
import type { PassiveTreeData, AllocatedPassives, PassiveNode } from '@/types/passiveTree';

// Mock tree data for testing
const createMockTreeData = (): PassiveTreeData => {
  const nodes: Record<number, PassiveNode> = {
    1: {
      id: 1,
      name: 'Start Node',
      isKeystone: false,
      isNotable: false,
      isJewelSocket: false,
      isMastery: false,
      stats: [],
      position: { x: 0, y: 0 },
      connections: [2, 3],
      classStartingNode: 'Warrior'
    },
    2: {
      id: 2,
      name: 'Node A',
      isKeystone: false,
      isNotable: false,
      isJewelSocket: false,
      isMastery: false,
      stats: ['+10 to Strength'],
      position: { x: 100, y: 0 },
      connections: [1, 4]
    },
    3: {
      id: 3,
      name: 'Node B',
      isKeystone: false,
      isNotable: true,
      isJewelSocket: false,
      isMastery: false,
      stats: ['+20% increased Physical Damage'],
      position: { x: 0, y: 100 },
      connections: [1, 5]
    },
    4: {
      id: 4,
      name: 'Node C',
      isKeystone: true,
      isNotable: false,
      isJewelSocket: false,
      isMastery: false,
      stats: ['Your hits always Critical Strike', 'Never deal non-Critical Strikes'],
      position: { x: 200, y: 0 },
      connections: [2]
    },
    5: {
      id: 5,
      name: 'Node D',
      isKeystone: false,
      isNotable: false,
      isJewelSocket: true,
      isMastery: false,
      stats: [],
      position: { x: 0, y: 200 },
      connections: [3, 6]
    },
    6: {
      id: 6,
      name: 'Node E',
      isKeystone: false,
      isNotable: false,
      isJewelSocket: false,
      isMastery: true,
      stats: ['Choose a Mastery Effect'],
      position: { x: 100, y: 200 },
      connections: [5]
    }
  };

  return {
    nodes,
    groups: {},
    jewelSlots: [5],
    classes: {
      'Warrior': { startingNode: 1 }
    }
  };
};

describe('PassiveTreePathValidator', () => {
  let treeData: PassiveTreeData;
  let validator: PassiveTreePathValidator;
  let baseAllocated: AllocatedPassives;

  beforeEach(() => {
    treeData = createMockTreeData();
    validator = new PassiveTreePathValidator(treeData);
    baseAllocated = {
      nodes: new Set([1]), // Start with starting node
      jewelData: new Map(),
      masteryEffects: new Map(),
      classStartNode: 1,
      pointsUsed: 0
    };
  });

  describe('canAllocateNode', () => {
    it('should allow allocating connected nodes', () => {
      expect(validator.canAllocateNode(2, baseAllocated)).toBe(true);
      expect(validator.canAllocateNode(3, baseAllocated)).toBe(true);
    });

    it('should not allow allocating already allocated nodes', () => {
      expect(validator.canAllocateNode(1, baseAllocated)).toBe(false);
    });

    it('should not allow allocating disconnected nodes', () => {
      expect(validator.canAllocateNode(4, baseAllocated)).toBe(false);
      expect(validator.canAllocateNode(6, baseAllocated)).toBe(false);
    });

    it('should allow allocating after path is established', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2])
      };
      expect(validator.canAllocateNode(4, allocated)).toBe(true);
    });
  });

  describe('isConnectedToAllocatedTree', () => {
    it('should return true for starting nodes', () => {
      expect(validator.isConnectedToAllocatedTree(1, baseAllocated)).toBe(true);
    });

    it('should return true for nodes connected to allocated nodes', () => {
      expect(validator.isConnectedToAllocatedTree(2, baseAllocated)).toBe(true);
      expect(validator.isConnectedToAllocatedTree(3, baseAllocated)).toBe(true);
    });

    it('should return false for disconnected nodes', () => {
      expect(validator.isConnectedToAllocatedTree(4, baseAllocated)).toBe(false);
    });
  });

  describe('findShortestPath', () => {
    it('should find path to directly connected node', () => {
      const path = validator.findShortestPath(2, baseAllocated);
      expect(path).not.toBeNull();
      expect(path!.nodes).toContain(1);
      expect(path!.nodes).toContain(2);
      expect(path!.cost).toBe(1);
    });

    it('should find shortest path to distant node', () => {
      const path = validator.findShortestPath(4, baseAllocated);
      expect(path).not.toBeNull();
      expect(path!.nodes).toEqual([1, 2, 4]);
      expect(path!.cost).toBe(2);
    });

    it('should return null for isolated nodes', () => {
      // Remove all connections from node 6 to make it isolated
      const isolatedTreeData = createMockTreeData();
      isolatedTreeData.nodes[6].connections = [];
      isolatedTreeData.nodes[5].connections = [3];
      const isolatedValidator = new PassiveTreePathValidator(isolatedTreeData);

      const path = isolatedValidator.findShortestPath(6, baseAllocated);
      expect(path).toBe(null);
    });

    it('should return 0 cost for already allocated node', () => {
      const path = validator.findShortestPath(1, baseAllocated);
      expect(path).not.toBeNull();
      expect(path!.cost).toBe(0);
    });
  });

  describe('getReachableNodes', () => {
    it('should return all reachable nodes from starting node', () => {
      const reachable = validator.getReachableNodes(baseAllocated);
      expect(reachable.has(1)).toBe(true);
      expect(reachable.has(2)).toBe(true);
      expect(reachable.has(3)).toBe(true);
      expect(reachable.has(4)).toBe(true);
      expect(reachable.has(5)).toBe(true);
      expect(reachable.has(6)).toBe(true);
    });

    it('should include allocated nodes', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 4])
      };
      const reachable = validator.getReachableNodes(allocated);
      expect(reachable.has(1)).toBe(true);
      expect(reachable.has(2)).toBe(true);
      expect(reachable.has(4)).toBe(true);
    });
  });

  describe('validateAllocatedTree', () => {
    it('should validate connected tree', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 4])
      };
      const validation = validator.validateAllocatedTree(allocated);
      expect(validation.valid).toBe(true);
      expect(validation.orphanedNodes).toHaveLength(0);
    });

    it('should detect orphaned nodes', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 6]) // Node 6 not connected
      };
      const validation = validator.validateAllocatedTree(allocated);
      expect(validation.valid).toBe(false);
      expect(validation.orphanedNodes).toContain(6);
    });

    it('should return valid for empty tree', () => {
      const empty: AllocatedPassives = {
        nodes: new Set(),
        jewelData: new Map(),
        masteryEffects: new Map()
      };
      const validation = validator.validateAllocatedTree(empty);
      expect(validation.valid).toBe(true);
      expect(validation.orphanedNodes).toHaveLength(0);
    });

    it('should detect tree with no starting node', () => {
      const allocated: AllocatedPassives = {
        nodes: new Set([2, 4]),
        jewelData: new Map(),
        masteryEffects: new Map()
      };
      const validation = validator.validateAllocatedTree(allocated);
      expect(validation.valid).toBe(false);
      expect(validation.orphanedNodes.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePointsRequired', () => {
    it('should calculate correct points for direct connection', () => {
      const points = validator.calculatePointsRequired(2, baseAllocated);
      expect(points).toBe(1);
    });

    it('should calculate correct points for distant node', () => {
      const points = validator.calculatePointsRequired(4, baseAllocated);
      expect(points).toBe(2);
    });

    it('should return 0 for already allocated node', () => {
      const points = validator.calculatePointsRequired(1, baseAllocated);
      expect(points).toBe(0); // Already allocated, so 0 new points needed
    });

    it('should return Infinity for unreachable node', () => {
      // Create isolated node
      const isolatedTreeData = createMockTreeData();
      isolatedTreeData.nodes[7] = {
        id: 7,
        name: 'Isolated',
        isKeystone: false,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: [],
        position: { x: 1000, y: 1000 },
        connections: []
      };
      const isolatedValidator = new PassiveTreePathValidator(isolatedTreeData);

      const points = isolatedValidator.calculatePointsRequired(7, baseAllocated);
      expect(points).toBe(Infinity);
    });
  });

  describe('getAvailableNodes', () => {
    it('should return directly connected nodes', () => {
      const available = validator.getAvailableNodes(baseAllocated);
      expect(available).toContain(2);
      expect(available).toContain(3);
      expect(available.length).toBe(2);
    });

    it('should not include already allocated nodes', () => {
      const available = validator.getAvailableNodes(baseAllocated);
      expect(available).not.toContain(1);
    });

    it('should update as tree grows', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2])
      };
      const available = validator.getAvailableNodes(allocated);
      expect(available).toContain(4);
    });
  });

  describe('suggestAllocationPath', () => {
    it('should suggest path excluding already allocated nodes', () => {
      const path = validator.suggestAllocationPath(4, baseAllocated);
      expect(path).toEqual([2, 4]); // Exclude starting node 1
    });

    it('should return empty array for already allocated node', () => {
      const path = validator.suggestAllocationPath(1, baseAllocated);
      expect(path).toEqual([]);
    });

    it('should return empty array for unreachable node', () => {
      const isolatedTreeData = createMockTreeData();
      isolatedTreeData.nodes[7] = {
        id: 7,
        name: 'Isolated',
        isKeystone: false,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: [],
        position: { x: 1000, y: 1000 },
        connections: []
      };
      const isolatedValidator = new PassiveTreePathValidator(isolatedTreeData);

      const path = isolatedValidator.suggestAllocationPath(7, baseAllocated);
      expect(path).toEqual([]);
    });
  });

  describe('canDeallocateNode', () => {
    it('should allow deallocating leaf nodes', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 4])
      };
      const result = validator.canDeallocateNode(4, allocated);
      expect(result.canDeallocate).toBe(true);
      expect(result.affectedNodes).toHaveLength(0);
    });

    it('should prevent deallocating nodes with dependents', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 4])
      };
      const result = validator.canDeallocateNode(2, allocated);
      expect(result.canDeallocate).toBe(false);
      expect(result.affectedNodes).toContain(4);
    });

    it('should not allow deallocating unallocated nodes', () => {
      const result = validator.canDeallocateNode(4, baseAllocated);
      expect(result.canDeallocate).toBe(false);
    });

    it('should allow deallocating starting node if it has no dependents', () => {
      // Starting node with no other allocated nodes can be deallocated
      const result = validator.canDeallocateNode(1, baseAllocated);
      expect(result.canDeallocate).toBe(true); // Can deallocate since only this node is allocated
    });
  });

  describe('getDependentNodes', () => {
    it('should find all dependent nodes', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 4])
      };
      const { affectedNodes } = validator.canDeallocateNode(2, allocated);
      // Node 4 will be orphaned if node 2 is removed
      expect(affectedNodes).toContain(4);
    });

    it('should return empty for leaf nodes', () => {
      const allocated: AllocatedPassives = {
        ...baseAllocated,
        nodes: new Set([1, 2, 4])
      };
      const dependents = validator.getDependentNodes(4, allocated);
      expect(dependents).toHaveLength(0);
    });

    it('should return empty for unallocated nodes', () => {
      const dependents = validator.getDependentNodes(4, baseAllocated);
      expect(dependents).toHaveLength(0);
    });
  });

  describe('createPathValidator', () => {
    it('should create validator instance', () => {
      const validator = createPathValidator(treeData);
      expect(validator).toBeInstanceOf(PassiveTreePathValidator);
    });
  });

  describe('isNodeAllocatable', () => {
    it('should return true for allocatable nodes', () => {
      expect(isNodeAllocatable(2, baseAllocated, treeData)).toBe(true);
    });

    it('should return false for non-allocatable nodes', () => {
      expect(isNodeAllocatable(4, baseAllocated, treeData)).toBe(false);
    });
  });
});
