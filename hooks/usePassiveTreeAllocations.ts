import { useState, useCallback, useMemo } from 'react';
import type { PassiveTreeData, AllocatedPassives, PassiveNodeModifier } from '@/types/passiveTree';
import { PassiveTreePathValidator } from '@/lib/passiveTree/pathValidator';

interface UsePassiveTreeAllocationsOptions {
  treeData: PassiveTreeData;
  initialAllocations?: AllocatedPassives;
  maxPoints?: number;
  classStartNode?: number;
}

export function usePassiveTreeAllocations({
  treeData,
  initialAllocations,
  maxPoints = 123, // PoE 2 max passive points
  classStartNode
}: UsePassiveTreeAllocationsOptions) {
  // Initialize with class start node if provided
  const getInitialAllocations = (): AllocatedPassives => {
    if (initialAllocations) {
      return initialAllocations;
    }

    const nodes = new Set<number>();
    if (classStartNode !== undefined) {
      nodes.add(classStartNode);
    }

    return {
      nodes,
      jewelData: new Map(),
      masteryEffects: new Map(),
      classStartNode,
      pointsUsed: classStartNode !== undefined ? 0 : 0 // Start node is free
    };
  };

  const [allocated, setAllocated] = useState<AllocatedPassives>(getInitialAllocations);
  const [history, setHistory] = useState<AllocatedPassives[]>([getInitialAllocations()]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Create validator
  const validator = useMemo(() => new PassiveTreePathValidator(treeData), [treeData]);

  // Calculate points used
  const pointsUsed = useMemo(() => {
    let count = 0;
    allocated.nodes.forEach(nodeId => {
      const node = treeData.nodes[nodeId];
      if (node && !node.classStartingNode) {
        count++;
      }
    });
    return count;
  }, [allocated.nodes, treeData.nodes]);

  // Get available points
  const pointsAvailable = maxPoints - pointsUsed;

  // Add to history
  const addToHistory = useCallback((newAllocated: AllocatedPassives) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newAllocated);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Allocate a node
  const allocateNode = useCallback((nodeId: number, autoPath: boolean = false): boolean => {
    // Check if we have points
    if (pointsUsed >= maxPoints) {
      return false;
    }

    // Check if node exists
    const node = treeData.nodes[nodeId];
    if (!node) {
      return false;
    }

    // Check if already allocated
    if (allocated.nodes.has(nodeId)) {
      return false;
    }

    // If auto-path is enabled, allocate all nodes in path
    if (autoPath) {
      const path = validator.suggestAllocationPath(nodeId, allocated);
      if (path.length === 0 || pointsUsed + path.length > maxPoints) {
        return false;
      }

      const newNodes = new Set(allocated.nodes);
      path.forEach(id => newNodes.add(id));

      const newAllocated: AllocatedPassives = {
        ...allocated,
        nodes: newNodes,
        pointsUsed: pointsUsed + path.length
      };

      setAllocated(newAllocated);
      addToHistory(newAllocated);
      return true;
    } else {
      // Check if node is connected
      if (!validator.canAllocateNode(nodeId, allocated)) {
        return false;
      }

      const newNodes = new Set(allocated.nodes);
      newNodes.add(nodeId);

      const newAllocated: AllocatedPassives = {
        ...allocated,
        nodes: newNodes,
        pointsUsed: pointsUsed + 1
      };

      setAllocated(newAllocated);
      addToHistory(newAllocated);
      return true;
    }
  }, [allocated, maxPoints, pointsUsed, treeData.nodes, validator, addToHistory]);

  // Deallocate a node
  const deallocateNode = useCallback((nodeId: number, autoDeallocate: boolean = false): boolean => {
    // Check if allocated
    if (!allocated.nodes.has(nodeId)) {
      return false;
    }

    // Check if it's the class start node
    if (nodeId === allocated.classStartNode) {
      return false;
    }

    const { canDeallocate, affectedNodes } = validator.canDeallocateNode(nodeId, allocated);

    if (!canDeallocate && !autoDeallocate) {
      return false;
    }

    const newNodes = new Set(allocated.nodes);
    newNodes.delete(nodeId);

    // If auto-deallocate, remove affected nodes too
    if (autoDeallocate && affectedNodes.length > 0) {
      affectedNodes.forEach(id => newNodes.delete(id));
    }

    const newAllocated: AllocatedPassives = {
      ...allocated,
      nodes: newNodes,
      pointsUsed: Math.max(0, pointsUsed - (1 + (autoDeallocate ? affectedNodes.length : 0)))
    };

    setAllocated(newAllocated);
    addToHistory(newAllocated);
    return true;
  }, [allocated, pointsUsed, validator, addToHistory]);

  // Toggle node allocation
  const toggleNode = useCallback((nodeId: number, autoPath: boolean = true): boolean => {
    if (allocated.nodes.has(nodeId)) {
      return deallocateNode(nodeId, true);
    } else {
      return allocateNode(nodeId, autoPath);
    }
  }, [allocated.nodes, allocateNode, deallocateNode]);

  // Reset allocations
  const reset = useCallback(() => {
    const newAllocated = getInitialAllocations();
    setAllocated(newAllocated);
    setHistory([newAllocated]);
    setHistoryIndex(0);
  }, [classStartNode]);

  // Undo
  const undo = useCallback((): boolean => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setAllocated(history[historyIndex - 1]);
      return true;
    }
    return false;
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback((): boolean => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setAllocated(history[historyIndex + 1]);
      return true;
    }
    return false;
  }, [historyIndex, history]);

  // Get calculated stats from allocated nodes
  const calculatedStats = useMemo(() => {
    const stats: Record<string, number> = {};
    const modifiers: PassiveNodeModifier[] = [];

    allocated.nodes.forEach(nodeId => {
      const node = treeData.nodes[nodeId];
      if (!node) return;

      // Add stat attributes
      if (node.grantedStrength) {
        stats.strength = (stats.strength || 0) + node.grantedStrength;
      }
      if (node.grantedDexterity) {
        stats.dexterity = (stats.dexterity || 0) + node.grantedDexterity;
      }
      if (node.grantedIntelligence) {
        stats.intelligence = (stats.intelligence || 0) + node.grantedIntelligence;
      }

      // Parse stat strings into modifiers (simplified - would need full parser)
      node.stats.forEach(stat => {
        modifiers.push({
          stat,
          value: 0, // Would need parsing
          type: 'increased'
        });
      });
    });

    return { stats, modifiers };
  }, [allocated.nodes, treeData.nodes]);

  // Get available nodes (1 point away)
  const availableNodes = useMemo(() => {
    return validator.getAvailableNodes(allocated);
  }, [validator, allocated]);

  // Validate current tree
  const validation = useMemo(() => {
    return validator.validateAllocatedTree(allocated);
  }, [validator, allocated]);

  // Check if a specific node can be allocated
  const canAllocate = useCallback((nodeId: number): boolean => {
    if (pointsUsed >= maxPoints) return false;
    return validator.canAllocateNode(nodeId, allocated);
  }, [validator, allocated, pointsUsed, maxPoints]);

  // Get shortest path to a node
  const getPathToNode = useCallback((nodeId: number) => {
    return validator.findShortestPath(nodeId, allocated);
  }, [validator, allocated]);

  // Load allocations from external source
  const loadAllocations = useCallback((newAllocated: AllocatedPassives) => {
    setAllocated(newAllocated);
    setHistory([newAllocated]);
    setHistoryIndex(0);
  }, []);

  return {
    // State
    allocated,
    pointsUsed,
    pointsAvailable,
    maxPoints,
    calculatedStats,
    availableNodes,
    validation,

    // History
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // Actions
    allocateNode,
    deallocateNode,
    toggleNode,
    reset,
    undo,
    redo,
    loadAllocations,

    // Utilities
    canAllocate,
    getPathToNode,
    validator
  };
}
