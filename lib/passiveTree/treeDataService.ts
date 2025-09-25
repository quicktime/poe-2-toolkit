import type { PassiveTreeData, PassiveNode, AllocatedPassives } from '@/types/passiveTree';
import { poeTreeDataFetcher } from './poeTreeDataFetcher';

export class PassiveTreeDataService {
  private static instance: PassiveTreeDataService;
  private treeData: PassiveTreeData | null = null;
  private loading: boolean = false;
  private loadPromise: Promise<PassiveTreeData> | null = null;
  private useCDN: boolean = false; // Toggle for CDN vs mock data

  private constructor() {}

  static getInstance(): PassiveTreeDataService {
    if (!PassiveTreeDataService.instance) {
      PassiveTreeDataService.instance = new PassiveTreeDataService();
    }
    return PassiveTreeDataService.instance;
  }

  async loadTreeData(forceCDN: boolean = false): Promise<PassiveTreeData> {
    if (this.treeData && !forceCDN) {
      return this.treeData;
    }

    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.useCDN = forceCDN || process.env.NEXT_PUBLIC_USE_POE_CDN === 'true';
    this.loadPromise = this.fetchTreeData();

    try {
      this.treeData = await this.loadPromise;
      return this.treeData;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  private async fetchTreeData(): Promise<PassiveTreeData> {
    try {
      // Try CDN first if enabled
      if (this.useCDN) {
        console.log('Fetching tree data from PoE CDN...');
        const cdnData = await poeTreeDataFetcher.fetchTreeData();
        if (cdnData && Object.keys(cdnData.nodes).length > 0) {
          console.log('Successfully loaded tree data from CDN');
          return cdnData;
        }
      }

      // Fall back to our API endpoint
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/passive-tree/data`);
      if (!response.ok) {
        throw new Error('Failed to fetch passive tree data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching passive tree data:', error);
      // Return mock data as fallback
      return this.generateMockTreeData();
    }
  }

  private generateMockTreeData(): PassiveTreeData {
    // Generate a simplified mock tree for development
    const nodes: Record<number, PassiveNode> = {};
    const classes = ['Warrior', 'Monk', 'Ranger', 'Mercenary', 'Witch', 'Sorceress'];

    // Create starting nodes for each class
    classes.forEach((className, index) => {
      const angle = (index * 60) * Math.PI / 180;
      const radius = 150;
      const nodeId = index + 1;

      nodes[nodeId] = {
        id: nodeId,
        name: `${className} Start`,
        description: `Starting point for ${className}`,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        },
        connections: [],
        stats: [`+10 to Strength`, `+10 to Dexterity`, `+10 to Intelligence`],
        isKeystone: false,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        isAscendancyStart: false,
        ascendancyName: null,
        classStartingNode: className
      };
    });

    // Add some notable and keystone nodes
    this.addNotableNodes(nodes);
    this.addKeystoneNodes(nodes);
    this.addRegularNodes(nodes);
    this.connectNodes(nodes);

    return {
      version: '0.3.0',
      nodes,
      groups: {},
      jewelSlots: [],
      masteries: {},
      classes: classes.reduce((acc, className, index) => {
        acc[className] = { startingNode: index + 1 };
        return acc;
      }, {} as Record<string, { startingNode: number }>)
    };
  }

  private addNotableNodes(nodes: Record<number, PassiveNode>) {
    const notables = [
      { id: 100, name: 'Heart of the Warrior', stats: ['+50 to maximum Life', '+20% increased Physical Damage'] },
      { id: 101, name: 'Eagle Eye', stats: ['+30% increased Accuracy Rating', '+20% increased Critical Strike Chance'] },
      { id: 102, name: 'Arcane Potency', stats: ['+30% increased Spell Damage', '+20% increased Cast Speed'] },
      { id: 103, name: 'Iron Grip', stats: ['+40% increased Armour', '+20% increased Stun Threshold'] },
      { id: 104, name: 'Wind Dancer', stats: ['+40% increased Evasion Rating', '+10% increased Movement Speed'] }
    ];

    notables.forEach((notable, index) => {
      const angle = (index * 72) * Math.PI / 180;
      const radius = 300;

      nodes[notable.id] = {
        id: notable.id,
        name: notable.name,
        description: `Notable passive: ${notable.name}`,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        },
        connections: [],
        stats: notable.stats,
        isKeystone: false,
        isNotable: true,
        isJewelSocket: false,
        isMastery: false,
        isAscendancyStart: false,
        ascendancyName: null,
        classStartingNode: null
      };
    });
  }

  private addKeystoneNodes(nodes: Record<number, PassiveNode>) {
    const keystones = [
      {
        id: 200,
        name: 'Blood Magic',
        stats: ['Removes all Mana', 'Spend Life instead of Mana for Skills', '50% more Life']
      },
      {
        id: 201,
        name: 'Chaos Inoculation',
        stats: ['Maximum Life becomes 1', 'Immune to Chaos Damage']
      },
      {
        id: 202,
        name: 'Resolute Technique',
        stats: ['Your hits can\'t be Evaded', 'Never deal Critical Strikes']
      }
    ];

    keystones.forEach((keystone, index) => {
      const angle = (index * 120 + 60) * Math.PI / 180;
      const radius = 450;

      nodes[keystone.id] = {
        id: keystone.id,
        name: keystone.name,
        description: `Keystone passive: ${keystone.name}`,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        },
        connections: [],
        stats: keystone.stats,
        isKeystone: true,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        isAscendancyStart: false,
        ascendancyName: null,
        classStartingNode: null
      };
    });
  }

  private addRegularNodes(nodes: Record<number, PassiveNode>) {
    // Add regular nodes between notables and start nodes
    for (let i = 20; i < 80; i++) {
      const angle = (i * 6) * Math.PI / 180;
      const radius = 200 + (i % 3) * 50;

      nodes[i] = {
        id: i,
        name: `Passive ${i}`,
        description: `Regular passive node`,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        },
        connections: [],
        stats: this.getRandomStats(),
        isKeystone: false,
        isNotable: false,
        isJewelSocket: i % 15 === 0,
        isMastery: false,
        isAscendancyStart: false,
        ascendancyName: null,
        classStartingNode: null
      };
    }
  }

  private getRandomStats(): string[] {
    const statOptions = [
      '+10 to Strength',
      '+10 to Dexterity',
      '+10 to Intelligence',
      '+5% increased Attack Speed',
      '+5% increased Cast Speed',
      '+8% increased maximum Life',
      '+12% increased Physical Damage',
      '+15% increased Elemental Damage',
      '+10% increased Critical Strike Chance',
      '+6% increased Movement Speed',
      '+20% increased Armour',
      '+20% increased Evasion Rating',
      '+15% increased Energy Shield'
    ];

    const numStats = Math.floor(Math.random() * 2) + 1;
    const selectedStats: string[] = [];

    for (let i = 0; i < numStats; i++) {
      const randomIndex = Math.floor(Math.random() * statOptions.length);
      selectedStats.push(statOptions[randomIndex]);
    }

    return selectedStats;
  }

  private connectNodes(nodes: Record<number, PassiveNode>) {
    // Connect starting nodes to nearby regular nodes
    Object.values(nodes).forEach(node => {
      if (node.classStartingNode) {
        // Find 3-4 nearby nodes to connect
        const nearbyNodes = this.findNearbyNodes(node, nodes, 100, 3);
        node.connections = nearbyNodes;
        nearbyNodes.forEach(nearbyId => {
          if (!nodes[nearbyId].connections.includes(node.id)) {
            nodes[nearbyId].connections.push(node.id);
          }
        });
      }
    });

    // Connect regular nodes to form a web
    Object.values(nodes).forEach(node => {
      if (!node.isKeystone && !node.isNotable && !node.classStartingNode) {
        const nearbyNodes = this.findNearbyNodes(node, nodes, 80, 2);
        nearbyNodes.forEach(nearbyId => {
          if (!node.connections.includes(nearbyId)) {
            node.connections.push(nearbyId);
          }
          if (!nodes[nearbyId].connections.includes(node.id)) {
            nodes[nearbyId].connections.push(node.id);
          }
        });
      }
    });

    // Connect notables to regular nodes
    Object.values(nodes).forEach(node => {
      if (node.isNotable) {
        const nearbyNodes = this.findNearbyNodes(node, nodes, 120, 2);
        node.connections = nearbyNodes;
        nearbyNodes.forEach(nearbyId => {
          if (!nodes[nearbyId].connections.includes(node.id)) {
            nodes[nearbyId].connections.push(node.id);
          }
        });
      }
    });

    // Connect keystones to notables
    Object.values(nodes).forEach(node => {
      if (node.isKeystone) {
        const nearbyNotables = Object.values(nodes)
          .filter(n => n.isNotable)
          .sort((a, b) => this.getDistance(node, a) - this.getDistance(node, b))
          .slice(0, 2)
          .map(n => n.id);

        node.connections = nearbyNotables;
        nearbyNotables.forEach(notableId => {
          if (!nodes[notableId].connections.includes(node.id)) {
            nodes[notableId].connections.push(node.id);
          }
        });
      }
    });
  }

  private findNearbyNodes(
    node: PassiveNode,
    allNodes: Record<number, PassiveNode>,
    maxDistance: number,
    maxCount: number
  ): number[] {
    return Object.values(allNodes)
      .filter(n => n.id !== node.id && this.getDistance(node, n) <= maxDistance)
      .sort((a, b) => this.getDistance(node, a) - this.getDistance(node, b))
      .slice(0, maxCount)
      .map(n => n.id);
  }

  private getDistance(node1: PassiveNode, node2: PassiveNode): number {
    const dx = node1.position.x - node2.position.x;
    const dy = node1.position.y - node2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  searchNodes(query: string): PassiveNode[] {
    if (!this.treeData) return [];

    const lowercaseQuery = query.toLowerCase();
    return Object.values(this.treeData.nodes).filter(node =>
      node.name.toLowerCase().includes(lowercaseQuery) ||
      node.stats.some(stat => stat.toLowerCase().includes(lowercaseQuery))
    );
  }

  findPath(fromNodeId: number, toNodeId: number): number[] | null {
    if (!this.treeData) return null;

    const visited = new Set<number>();
    const queue: { nodeId: number; path: number[] }[] = [{ nodeId: fromNodeId, path: [fromNodeId] }];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === toNodeId) {
        return path;
      }

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.treeData.nodes[nodeId];
      if (!node) continue;

      for (const connectedId of node.connections) {
        if (!visited.has(connectedId)) {
          queue.push({ nodeId: connectedId, path: [...path, connectedId] });
        }
      }
    }

    return null;
  }

  validateAllocation(allocated: AllocatedPassives): { valid: boolean; errors: string[] } {
    if (!this.treeData) {
      return { valid: false, errors: ['Tree data not loaded'] };
    }

    const errors: string[] = [];
    const allocatedArray = Array.from(allocated.nodes);

    // Check if all allocated nodes exist
    for (const nodeId of allocatedArray) {
      if (!this.treeData.nodes[nodeId]) {
        errors.push(`Node ${nodeId} does not exist`);
      }
    }

    // Check if allocated nodes form a connected tree from start
    if (allocatedArray.length > 0 && allocated.classStartNode) {
      const connected = this.getConnectedNodes(allocated.classStartNode, allocated.nodes);
      const disconnected = allocatedArray.filter(id => !connected.has(id));

      if (disconnected.length > 0) {
        errors.push(`Nodes ${disconnected.join(', ')} are not connected to the tree`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private getConnectedNodes(startNode: number, allocated: Set<number>): Set<number> {
    if (!this.treeData) return new Set();

    const connected = new Set<number>();
    const queue = [startNode];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (connected.has(nodeId)) continue;

      connected.add(nodeId);

      const node = this.treeData.nodes[nodeId];
      if (!node) continue;

      for (const connectedId of node.connections) {
        if (allocated.has(connectedId) && !connected.has(connectedId)) {
          queue.push(connectedId);
        }
      }
    }

    return connected;
  }

  exportBuild(allocated: AllocatedPassives): string {
    const buildData = {
      version: '0.3.0',
      classStartNode: allocated.classStartNode,
      nodes: Array.from(allocated.nodes),
      pointsUsed: allocated.pointsUsed
    };

    return btoa(JSON.stringify(buildData));
  }

  importBuild(encodedBuild: string): AllocatedPassives | null {
    try {
      const buildData = JSON.parse(atob(encodedBuild));

      if (!buildData.version || !buildData.nodes) {
        throw new Error('Invalid build data format');
      }

      return {
        nodes: new Set(buildData.nodes),
        classStartNode: buildData.classStartNode,
        pointsUsed: buildData.pointsUsed || buildData.nodes.length
      };
    } catch (error) {
      console.error('Failed to import build:', error);
      return null;
    }
  }
}

export const passiveTreeService = PassiveTreeDataService.getInstance();