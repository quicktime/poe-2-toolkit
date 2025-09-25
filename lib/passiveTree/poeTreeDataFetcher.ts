import type { PassiveTreeData, PassiveNode } from '@/types/passiveTree';

// PoE CDN URLs - These would need to be updated for PoE 2's actual CDN
const POE_CDN_BASE = 'https://web.poecdn.com';
const POE2_TREE_DATA_URL = `${POE_CDN_BASE}/skilltree/passive-skill-tree.json`;

// For development, we can use PoE 1 data as a template
// In production, this would point to actual PoE 2 data
const FALLBACK_TREE_URL = 'https://www.pathofexile.com/passive-skill-tree/data.json';

export interface RawPoETreeData {
  version?: string;
  tree?: string;
  classes?: Array<{
    name: string;
    base_str: number;
    base_dex: number;
    base_int: number;
    ascendancies: Array<{
      id: string;
      name: string;
    }>;
  }>;
  groups?: Record<string, {
    x: number;
    y: number;
    oo: Record<string, boolean>;
    n: string[];
  }>;
  nodes?: Record<string, RawPoENode>;
  sprites?: Record<string, Record<string, {
    filename: string;
    w: number;
    h: number;
    coords: Record<string, {
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
  }>>;
  min_x?: number;
  min_y?: number;
  max_x?: number;
  max_y?: number;
  constants?: {
    classes: Record<string, number>;
    characterAttributes: Record<string, number>;
    PSSCentreInnerRadius: number;
  };
}

export interface RawPoENode {
  id?: number;
  skill?: number;
  name?: string;
  icon?: string;
  isNotable?: boolean;
  isKeystone?: boolean;
  isMastery?: boolean;
  isJewelSocket?: boolean;
  isMultipleChoice?: boolean;
  isMultipleChoiceOption?: boolean;
  passivePointsGranted?: number;
  stats?: string[];
  reminderText?: string[];
  flavourText?: string[];
  ascendancyName?: string;
  isAscendancyStart?: boolean;
  out?: string[];
  in?: string[];
  g?: number;
  o?: number;
  oidx?: number;
  sa?: number;
  da?: number;
  ia?: number;
  spc?: number[];
}

export class PoETreeDataFetcher {
  private static instance: PoETreeDataFetcher;
  private cache: Map<string, any> = new Map();
  private fetchPromise: Promise<PassiveTreeData> | null = null;

  private constructor() {}

  static getInstance(): PoETreeDataFetcher {
    if (!PoETreeDataFetcher.instance) {
      PoETreeDataFetcher.instance = new PoETreeDataFetcher();
    }
    return PoETreeDataFetcher.instance;
  }

  async fetchTreeData(version: string = 'latest'): Promise<PassiveTreeData> {
    // Check cache first
    const cacheKey = `tree_${version}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Prevent multiple simultaneous fetches
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.fetchFromCDN(version);

    try {
      const data = await this.fetchPromise;
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async fetchFromCDN(version: string): Promise<PassiveTreeData> {
    try {
      // Try to fetch from PoE 2 CDN first
      const response = await fetch(POE2_TREE_DATA_URL, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tree data: ${response.status}`);
      }

      const rawData: RawPoETreeData = await response.json();
      return this.transformRawData(rawData);
    } catch (error) {
      console.error('Failed to fetch from CDN, using fallback:', error);

      // Try fallback URL
      try {
        const response = await fetch(FALLBACK_TREE_URL);
        if (response.ok) {
          const rawData = await response.json();
          return this.transformRawData(rawData);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      // Return mock data as last resort
      return this.getMockTreeData();
    }
  }

  private transformRawData(raw: RawPoETreeData): PassiveTreeData {
    const nodes: Record<number, PassiveNode> = {};
    const groups = raw.groups || {};

    // Transform nodes
    if (raw.nodes) {
      Object.entries(raw.nodes).forEach(([nodeId, rawNode]) => {
        const id = parseInt(nodeId);

        // Skip if no skill ID
        if (!rawNode.skill && !rawNode.id) return;

        // Calculate position from group and orbit
        const position = this.calculateNodePosition(rawNode, groups);

        // Transform to our format
        nodes[id] = {
          id,
          name: rawNode.name || 'Unknown',
          description: rawNode.flavourText?.join(' '),
          icon: rawNode.icon,
          isKeystone: rawNode.isKeystone || false,
          isNotable: rawNode.isNotable || false,
          isJewelSocket: rawNode.isJewelSocket || false,
          isMastery: rawNode.isMastery || false,
          isAscendancy: !!rawNode.ascendancyName,
          isAscendancyStart: rawNode.isAscendancyStart,
          ascendancyName: rawNode.ascendancyName || null,
          stats: rawNode.stats || [],
          reminderText: rawNode.reminderText,
          grantedStrength: rawNode.sa,
          grantedDexterity: rawNode.da,
          grantedIntelligence: rawNode.ia,
          position,
          connections: this.parseConnections(rawNode),
          orbit: rawNode.o,
          orbitIndex: rawNode.oidx,
          classStartingNode: null
        };
      });
    }

    // Mark class starting nodes
    if (raw.classes) {
      raw.classes.forEach(cls => {
        const startNodeId = raw.constants?.classes[cls.name];
        if (startNodeId && nodes[startNodeId]) {
          nodes[startNodeId].classStartingNode = cls.name;
        }
      });
    }

    return {
      version: raw.version || '1.0.0',
      nodes,
      groups: this.transformGroups(groups),
      jewelSlots: this.findJewelSlots(nodes),
      masteries: this.extractMasteries(nodes),
      classes: this.transformClasses(raw.classes, raw.constants?.classes),
      constants: raw.constants,
      sprites: raw.sprites
    };
  }

  private calculateNodePosition(
    node: RawPoENode,
    groups: Record<string, any>
  ): { x: number; y: number } {
    if (!node.g || !groups[node.g]) {
      return { x: 0, y: 0 };
    }

    const group = groups[node.g];
    const orbit = node.o || 0;
    const orbitIndex = node.oidx || 0;

    // Calculate position based on group center and orbit
    // This is simplified - actual calculation depends on PoE's orbit system
    const orbitRadius = orbit * 40; // Approximate radius per orbit
    const angle = (orbitIndex / 16) * 2 * Math.PI; // Assuming 16 positions per orbit

    return {
      x: group.x + Math.cos(angle) * orbitRadius,
      y: group.y + Math.sin(angle) * orbitRadius
    };
  }

  private parseConnections(node: RawPoENode): number[] {
    const connections: number[] = [];

    if (node.out) {
      node.out.forEach(id => {
        const numId = parseInt(id);
        if (!isNaN(numId)) {
          connections.push(numId);
        }
      });
    }

    if (node.in) {
      node.in.forEach(id => {
        const numId = parseInt(id);
        if (!isNaN(numId) && !connections.includes(numId)) {
          connections.push(numId);
        }
      });
    }

    return connections;
  }

  private transformGroups(rawGroups: Record<string, any>): Record<number, any> {
    const groups: Record<number, any> = {};

    Object.entries(rawGroups).forEach(([id, group]) => {
      const numId = parseInt(id);
      if (!isNaN(numId)) {
        groups[numId] = {
          x: group.x,
          y: group.y,
          orbits: Object.keys(group.oo || {}).map(o => parseInt(o)),
          nodes: group.n || [],
          isProxy: group.isProxy
        };
      }
    });

    return groups;
  }

  private findJewelSlots(nodes: Record<number, PassiveNode>): number[] {
    return Object.values(nodes)
      .filter(node => node.isJewelSocket)
      .map(node => node.id);
  }

  private extractMasteries(nodes: Record<number, PassiveNode>): Record<number, any> {
    const masteries: Record<number, any> = {};

    Object.values(nodes)
      .filter(node => node.isMastery)
      .forEach(node => {
        masteries[node.id] = {
          name: node.name,
          effects: node.stats.map((stat, index) => ({
            id: index,
            stat,
            reminder: node.reminderText?.[index]
          }))
        };
      });

    return masteries;
  }

  private transformClasses(
    rawClasses: any[] | undefined,
    classConstants: Record<string, number> | undefined
  ): Record<string, { startingNode: number }> | undefined {
    if (!rawClasses || !classConstants) return undefined;

    const classes: Record<string, { startingNode: number }> = {};

    rawClasses.forEach(cls => {
      const startNode = classConstants[cls.name];
      if (startNode) {
        classes[cls.name] = { startingNode: startNode };
      }
    });

    return classes;
  }

  private getMockTreeData(): PassiveTreeData {
    // Return minimal mock data structure
    return {
      version: 'mock',
      nodes: {},
      groups: {},
      jewelSlots: [],
      masteries: {},
      classes: {
        Warrior: { startingNode: 1 },
        Monk: { startingNode: 2 },
        Ranger: { startingNode: 3 },
        Mercenary: { startingNode: 4 },
        Witch: { startingNode: 5 },
        Sorceress: { startingNode: 6 }
      }
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Fetch and cache sprites for rendering
  async fetchSprites(spriteSheet: string): Promise<HTMLImageElement> {
    const cacheKey = `sprite_${spriteSheet}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(cacheKey, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = `${POE_CDN_BASE}/${spriteSheet}`;
    });
  }
}

export const poeTreeDataFetcher = PoETreeDataFetcher.getInstance();