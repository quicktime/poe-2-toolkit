/**
 * Loads and converts Path of Exile 2 v0.3 passive tree data
 * from PathOfBuilding format to our application format
 */

import type { PassiveTreeData, PassiveNode } from '@/types/passiveTree';
import type { PoE2PassiveTreeData, PoE2TreeNode } from '@/types/poe2TreeData';
import { POE2_CLASS_ID_MAP } from '@/types/poe2TreeData';

export class PoE2TreeDataLoader {
  private static cachedTreeData: PassiveTreeData | null = null;

  /**
   * Load the real PoE2 v0.3 tree data from the local JSON file
   */
  static async loadRealTreeData(): Promise<PassiveTreeData> {
    if (this.cachedTreeData) {
      return this.cachedTreeData;
    }

    try {
      // Load the tree data JSON
      const response = await fetch('/data/poe2-tree-v0.3.json');
      if (!response.ok) {
        throw new Error('Failed to load PoE2 tree data');
      }

      const poe2Data: PoE2PassiveTreeData = await response.json();
      const convertedData = this.convertToPassiveTreeData(poe2Data);

      this.cachedTreeData = convertedData;
      return convertedData;
    } catch (error) {
      console.error('Error loading real PoE2 tree data:', error);
      throw error;
    }
  }

  /**
   * Convert PathOfBuilding PoE2 data format to our PassiveTreeData format
   */
  private static convertToPassiveTreeData(poe2Data: PoE2PassiveTreeData): PassiveTreeData {
    const nodes: Record<number, PassiveNode> = {};

    // Convert each node from PoE2 format to our format
    for (const [nodeIdStr, poe2Node] of Object.entries(poe2Data.nodes)) {
      const nodeId = parseInt(nodeIdStr);
      nodes[nodeId] = this.convertNode(poe2Node, poe2Data);
    }

    // Build classes mapping
    const classes: Record<string, { startingNode: number }> = {};
    for (const [classId, classData] of Object.entries(poe2Data.classes)) {
      const className = POE2_CLASS_ID_MAP[classId] || classData.name;

      // Find the starting node for this class
      const startNode = this.findClassStartNode(poe2Data, classId);
      if (startNode) {
        classes[className] = { startingNode: startNode };
      }
    }

    return {
      version: poe2Data.tree || '0.3.0',
      nodes,
      groups: this.convertGroups(poe2Data),
      jewelSlots: poe2Data.jewelSlots || [],
      masteries: {}, // Will be populated if mastery data exists
      classes
    };
  }

  /**
   * Convert a single PoE2 node to our PassiveNode format
   */
  private static convertNode(poe2Node: PoE2TreeNode, treeData: PoE2PassiveTreeData): PassiveNode {
    // Get group position
    const group = treeData.groups[poe2Node.group];
    const position = group ? { x: group.x, y: group.y } : { x: 0, y: 0 };

    // Calculate actual position based on orbit
    const orbitRadii = treeData.constants?.orbitRadii || [0, 82, 162, 335, 493, 662, 846];
    const radius = orbitRadii[poe2Node.orbit] || 0;

    if (radius > 0 && group) {
      // Calculate angle based on orbit index and skills per orbit
      const skillsPerOrbit = treeData.constants?.skillsPerOrbit || [1, 6, 12, 12, 16, 16, 16];
      const skillsInThisOrbit = skillsPerOrbit[poe2Node.orbit] || 16;
      const angle = (poe2Node.orbitIndex / skillsInThisOrbit) * 2 * Math.PI;

      position.x = group.x + Math.cos(angle) * radius;
      position.y = group.y + Math.sin(angle) * radius;
    }

    // Convert connections
    const connections = poe2Node.connections.map(conn => conn.id);

    // Determine node type and class start
    let classStartingNode: string | null = null;
    if (!poe2Node.ascendancyName) {
      // Check if this is a class starting node
      for (const [classId, classData] of Object.entries(treeData.classes)) {
        // A simple heuristic: nodes with very few stats near class positions might be starts
        // This needs refinement based on actual PathOfBuilding logic
        if (poe2Node.stats.length === 0 || poe2Node.name.toLowerCase().includes('start')) {
          classStartingNode = POE2_CLASS_ID_MAP[classId];
          break;
        }
      }
    }

    return {
      id: poe2Node.skill,
      name: poe2Node.name,
      description: poe2Node.reminderText?.join('\n') || '',
      position,
      connections,
      stats: poe2Node.stats,
      isKeystone: poe2Node.isKeystone || false,
      isNotable: poe2Node.isNotable || false,
      isJewelSocket: poe2Node.isJewelSocket || false,
      isMastery: poe2Node.isMastery || false,
      isAscendancyStart: false,
      ascendancyName: poe2Node.ascendancyName || null,
      classStartingNode,
      grantedStrength: poe2Node.grantedStrength,
      grantedDexterity: poe2Node.grantedDexterity,
      grantedIntelligence: poe2Node.grantedIntelligence
    };
  }

  /**
   * Convert groups from PoE2 format to our format
   */
  private static convertGroups(poe2Data: PoE2PassiveTreeData): Record<number, any> {
    const groups: Record<number, any> = {};

    poe2Data.groups.forEach((group, index) => {
      if (group) {
        groups[index] = {
          id: index,
          position: { x: group.x, y: group.y },
          nodes: group.nodes,
          orbits: group.orbits
        };
      }
    });

    return groups;
  }

  /**
   * Find the starting node for a given class
   */
  private static findClassStartNode(treeData: PoE2PassiveTreeData, classId: string): number | null {
    // Look for nodes that are likely starting nodes
    // In PoE2, starting nodes typically have:
    // 1. No ascendancy name
    // 2. Empty or minimal stats
    // 3. Located near the class starting position

    const classData = treeData.classes[classId];
    if (!classData) return null;

    // Find nodes in groups near the class background position
    for (const group of treeData.groups) {
      if (!group || group.nodes.length === 0) continue;

      // Check nodes in this group
      for (const nodeId of group.nodes) {
        const node = treeData.nodes[nodeId];
        if (!node || node.ascendancyName) continue;

        // Starting nodes often have empty stats or very basic stats
        if (node.stats.length === 0) {
          // Check if this node is in a reasonable position
          // (near the class background or in the outer ring)
          const distanceFromCenter = Math.sqrt(group.x * group.x + group.y * group.y);
          if (distanceFromCenter > 1000) {
            // Likely a class start node
            return nodeId;
          }
        }
      }
    }

    // Fallback: return first non-ascendancy node
    for (const [nodeIdStr, node] of Object.entries(treeData.nodes)) {
      if (!node.ascendancyName && node.stats.length === 0) {
        return parseInt(nodeIdStr);
      }
    }

    return null;
  }

  /**
   * Get class starting nodes map
   */
  static getClassStartingNodes(treeData: PoE2PassiveTreeData): Record<string, number> {
    const startingNodes: Record<string, number> = {};

    for (const [classId, classData] of Object.entries(treeData.classes)) {
      const className = POE2_CLASS_ID_MAP[classId] || classData.name;
      const startNode = this.findClassStartNode(treeData, classId);

      if (startNode) {
        startingNodes[className] = startNode;
      }
    }

    return startingNodes;
  }
}
