/**
 * Jewel Analysis System
 * Analyzes real jewel data from PoE API and calculates passive tree effects
 */

import type { PoEItem } from '@/lib/api/poeApiService';
import type { PassiveNode, PassiveTreeData } from '@/types/passiveTree';

export interface JewelData {
  id: string;
  name: string;
  typeLine: string;
  socketId: number;

  // Jewel properties
  radius?: number;
  rarity: string;
  ilvl?: number;

  // Modifiers
  explicitMods: string[];
  implicitMods: string[];

  // Parsed effects
  effects: JewelEffect[];

  // Affected nodes
  affectedNodeIds: number[];
  affectedNodes: PassiveNode[];

  // Position in tree
  socketPosition: { x: number; y: number };
}

export interface JewelEffect {
  type: 'stat_bonus' | 'node_transformation' | 'conditional' | 'threshold';
  description: string;
  values: Record<string, number>;
  conditions?: string[];
  affects?: 'allocated' | 'unallocated' | 'all';
}

export interface JewelSocketInfo {
  nodeId: number;
  position: { x: number; y: number };
  radius: number;
  isOccupied: boolean;
  jewel?: JewelData;
}

export class JewelAnalyzer {
  private static instance: JewelAnalyzer;

  private constructor() {}

  static getInstance(): JewelAnalyzer {
    if (!JewelAnalyzer.instance) {
      JewelAnalyzer.instance = new JewelAnalyzer();
    }
    return JewelAnalyzer.instance;
  }

  /**
   * Analyze all jewels from character data
   */
  analyzeCharacterJewels(
    equipment: PoEItem[],
    jewelSocketData: Record<number, any>,
    treeData: PassiveTreeData
  ): Map<number, JewelData> {
    const jewelMap = new Map<number, JewelData>();

    // Find jewels in equipment
    const jewels = equipment.filter(item =>
      item.category?.gem?.includes('jewel') ||
      item.typeLine.toLowerCase().includes('jewel')
    );

    // Process each jewel with socket data
    Object.entries(jewelSocketData).forEach(([socketIdStr, jewelInfo]) => {
      const socketId = parseInt(socketIdStr);
      const socket = this.findJewelSocket(socketId, treeData);

      if (!socket) return;

      // Find the corresponding jewel item
      const jewelItem = jewels.find(jewel =>
        jewelInfo.id === jewel.id || jewelInfo.name === jewel.name
      );

      if (jewelItem) {
        const analyzedJewel = this.analyzeJewel(jewelItem, socketId, socket, treeData);
        jewelMap.set(socketId, analyzedJewel);
      }
    });

    return jewelMap;
  }

  /**
   * Analyze a single jewel's effects
   */
  private analyzeJewel(
    jewelItem: PoEItem,
    socketId: number,
    socket: JewelSocketInfo,
    treeData: PassiveTreeData
  ): JewelData {
    const jewel: JewelData = {
      id: jewelItem.id || `socket_${socketId}`,
      name: jewelItem.name || jewelItem.typeLine,
      typeLine: jewelItem.typeLine,
      socketId,
      radius: this.getJewelRadius(jewelItem),
      rarity: jewelItem.rarity || 'normal',
      ilvl: jewelItem.ilvl,
      explicitMods: jewelItem.explicitMods || [],
      implicitMods: jewelItem.implicitMods || [],
      effects: [],
      affectedNodeIds: [],
      affectedNodes: [],
      socketPosition: socket.position
    };

    // Parse jewel effects
    jewel.effects = this.parseJewelEffects(jewel);

    // Calculate affected nodes
    const affectedNodes = this.getNodesInRadius(
      socket.position,
      jewel.radius || 0,
      treeData
    );

    jewel.affectedNodeIds = affectedNodes.map(node => node.id);
    jewel.affectedNodes = affectedNodes;

    return jewel;
  }

  /**
   * Parse jewel modifiers into structured effects
   */
  private parseJewelEffects(jewel: JewelData): JewelEffect[] {
    const effects: JewelEffect[] = [];
    const allMods = [...jewel.explicitMods, ...jewel.implicitMods];

    for (const mod of allMods) {
      const effect = this.parseMod(mod);
      if (effect) {
        effects.push(effect);
      }
    }

    return effects;
  }

  /**
   * Parse individual modifier string
   */
  private parseMod(mod: string): JewelEffect | null {
    // Common jewel mod patterns
    const patterns = [
      // Stat bonuses: "+10 to Strength"
      {
        regex: /\+?(\d+)%?\s+to\s+(\w+)/i,
        type: 'stat_bonus' as const,
        parse: (match: RegExpMatchArray) => ({
          description: mod,
          values: { [match[2].toLowerCase()]: parseInt(match[1]) },
          affects: 'all' as const
        })
      },
      // Percentage increases: "10% increased Damage"
      {
        regex: /(\d+)%\s+increased\s+(.+)/i,
        type: 'stat_bonus' as const,
        parse: (match: RegExpMatchArray) => ({
          description: mod,
          values: { [`increased_${match[2].toLowerCase().replace(/\s+/g, '_')}`]: parseInt(match[1]) },
          affects: 'all' as const
        })
      },
      // Conditional effects: "Passives in Radius grant..."
      {
        regex: /passives?\s+in\s+radius\s+(.+)/i,
        type: 'conditional' as const,
        parse: (match: RegExpMatchArray) => ({
          description: mod,
          values: {},
          conditions: ['in_radius'],
          affects: 'allocated' as const
        })
      },
      // Threshold effects: "With at least 40 Strength in Radius..."
      {
        regex: /with\s+at\s+least\s+(\d+)\s+(\w+)\s+in\s+radius/i,
        type: 'threshold' as const,
        parse: (match: RegExpMatchArray) => ({
          description: mod,
          values: { threshold: parseInt(match[1]), stat: match[2].toLowerCase() },
          conditions: ['threshold_met'],
          affects: 'all' as const
        })
      }
    ];

    for (const pattern of patterns) {
      const match = mod.match(pattern.regex);
      if (match) {
        return {
          type: pattern.type,
          ...pattern.parse(match)
        };
      }
    }

    // Fallback for unparsed mods
    return {
      type: 'stat_bonus',
      description: mod,
      values: {},
      affects: 'all'
    };
  }

  /**
   * Get jewel radius based on type
   */
  private getJewelRadius(jewelItem: PoEItem): number {
    const typeLine = jewelItem.typeLine.toLowerCase();

    // PoE 2 jewel radius values (these may need adjustment)
    if (typeLine.includes('large')) return 1500;
    if (typeLine.includes('medium')) return 1200;
    if (typeLine.includes('small')) return 800;
    if (typeLine.includes('crimson') || typeLine.includes('viridian') || typeLine.includes('cobalt')) return 1200;

    // Default radius for unrecognized jewels
    return 1200;
  }

  /**
   * Find jewel socket by ID in tree data
   */
  private findJewelSocket(socketId: number, treeData: PassiveTreeData): JewelSocketInfo | null {
    // Look for jewel socket node
    const socketNode = treeData.nodes[socketId];
    if (!socketNode || !socketNode.isJewelSocket) {
      return null;
    }

    return {
      nodeId: socketId,
      position: socketNode.position,
      radius: this.getJewelRadius({ typeLine: 'Standard Jewel' } as PoEItem),
      isOccupied: true
    };
  }

  /**
   * Get all passive nodes within radius of a position
   */
  private getNodesInRadius(
    center: { x: number; y: number },
    radius: number,
    treeData: PassiveTreeData
  ): PassiveNode[] {
    const nodesInRadius: PassiveNode[] = [];

    Object.values(treeData.nodes).forEach(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - center.x, 2) +
        Math.pow(node.position.y - center.y, 2)
      );

      if (distance <= radius) {
        nodesInRadius.push(node);
      }
    });

    return nodesInRadius;
  }

  /**
   * Calculate total stat bonuses from all jewels
   */
  calculateJewelBonuses(
    jewelMap: Map<number, JewelData>,
    allocatedNodes: Set<number>
  ): Record<string, number> {
    const totalBonuses: Record<string, number> = {};

    jewelMap.forEach(jewel => {
      jewel.effects.forEach(effect => {
        // Check if effect applies
        let applies = true;

        if (effect.conditions) {
          applies = this.checkEffectConditions(effect, jewel, allocatedNodes);
        }

        if (applies) {
          // Add bonuses to total
          Object.entries(effect.values).forEach(([stat, value]) => {
            totalBonuses[stat] = (totalBonuses[stat] || 0) + value;
          });
        }
      });
    });

    return totalBonuses;
  }

  /**
   * Check if jewel effect conditions are met
   */
  private checkEffectConditions(
    effect: JewelEffect,
    jewel: JewelData,
    allocatedNodes: Set<number>
  ): boolean {
    if (!effect.conditions) return true;

    for (const condition of effect.conditions) {
      switch (condition) {
        case 'in_radius':
          // Effect applies to nodes in radius
          if (effect.affects === 'allocated') {
            // Only applies if there are allocated nodes in radius
            return jewel.affectedNodeIds.some(id => allocatedNodes.has(id));
          }
          break;

        case 'threshold_met':
          // Check if threshold condition is met
          if (effect.values.threshold && effect.values.stat) {
            const statTotal = this.calculateStatInRadius(
              jewel,
              effect.values.stat,
              allocatedNodes
            );
            return statTotal >= effect.values.threshold;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Calculate total of a stat in jewel radius
   */
  private calculateStatInRadius(
    jewel: JewelData,
    statName: string,
    allocatedNodes: Set<number>
  ): number {
    let total = 0;

    jewel.affectedNodes.forEach(node => {
      if (allocatedNodes.has(node.id)) {
        // Look for stat in node's stats
        node.stats.forEach(stat => {
          const match = stat.match(new RegExp(`(\\d+)\\s+${statName}`, 'i'));
          if (match) {
            total += parseInt(match[1]);
          }
        });
      }
    });

    return total;
  }

  /**
   * Get all jewel sockets in the tree
   */
  getAllJewelSockets(treeData: PassiveTreeData): JewelSocketInfo[] {
    const sockets: JewelSocketInfo[] = [];

    Object.values(treeData.nodes).forEach(node => {
      if (node.isJewelSocket) {
        sockets.push({
          nodeId: node.id,
          position: node.position,
          radius: this.getJewelRadius({ typeLine: 'Standard Jewel' } as PoEItem),
          isOccupied: false
        });
      }
    });

    return sockets;
  }
}

export const jewelAnalyzer = JewelAnalyzer.getInstance();
export default jewelAnalyzer;