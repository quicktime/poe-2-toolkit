/**
 * Types for Path of Exile 2 Passive Tree Data (v0.3)
 * Based on PathOfBuilding Community data structure
 */

export interface PoE2TreeConnection {
  orbit: number;
  id: number;
}

export interface PoE2TreeNode {
  skill: number;
  name: string;
  icon: string;
  stats: string[];
  group: number;
  orbit: number;
  orbitIndex: number;
  connections: PoE2TreeConnection[];

  // Optional properties
  isNotable?: boolean;
  isKeystone?: boolean;
  isJewelSocket?: boolean;
  isMultipleChoice?: boolean;
  isMultipleChoiceOption?: boolean;
  isMastery?: boolean;

  // Ascendancy nodes
  ascendancyName?: string;

  // Additional metadata
  grantedStrength?: number;
  grantedDexterity?: number;
  grantedIntelligence?: number;

  // Recipe/crafting
  recipe?: string[];
  reminderText?: string[];
}

export interface PoE2TreeGroup {
  x: number;
  y: number;
  nodes: number[];
  orbits: number[];
  background?: {
    image: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

export interface PoE2AscendancyBackground {
  x: number;
  y: number;
  image: string;
  width: number;
  height: number;
  section: string;
}

export interface PoE2Ascendancy {
  id: string;
  name: string;
  internalId: string;
  background: PoE2AscendancyBackground;
}

export interface PoE2ClassBackground {
  image: string;
  section: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active?: {
    width: number;
    height: number;
  };
  bg?: {
    width: number;
    height: number;
  };
}

export interface PoE2Class {
  name: string;
  base_str: number;
  base_dex: number;
  base_int: number;
  ascendancies: PoE2Ascendancy[];
  background: PoE2ClassBackground;
}

export interface PoE2TreeConstants {
  classes?: Record<string, number>;
  characterAttributes?: Record<string, number>;
  PSSCentreInnerRadius?: number;
  skillsPerOrbit?: number[];
  orbitRadii?: number[];
}

export interface PoE2TreeAssets {
  [key: string]: string[];
}

export interface PoE2TreeDDSCoords {
  [key: string]: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface PoE2PassiveTreeData {
  // Tree structure
  nodes: Record<string, PoE2TreeNode>;
  groups: (PoE2TreeGroup | null)[];

  // Classes and ascendancies
  classes: Record<string, PoE2Class>;

  // Assets and visuals
  assets: PoE2TreeAssets;
  ddsCoords?: PoE2TreeDDSCoords;

  // Bounds
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;

  // Metadata
  tree?: string;
  constants?: PoE2TreeConstants;
  jewelSlots?: number[];
}

/**
 * Mapping between PathOfBuilding class IDs and class names
 */
export const POE2_CLASS_ID_MAP: Record<string, string> = {
  '0': 'Ranger',
  '1': 'Witch',
  '2': 'Sorceress',
  '3': 'Mercenary',
  '4': 'Warrior',
  '5': 'Monk',
  '6': 'Duelist'
};

/**
 * Helper to get class name from ID
 */
export function getClassName(classId: string | number): string {
  return POE2_CLASS_ID_MAP[classId.toString()] || 'Unknown';
}

/**
 * Helper to find starting node for a class
 */
export function findClassStartNode(treeData: PoE2PassiveTreeData, className: string): number | null {
  // Find class ID
  const classId = Object.keys(POE2_CLASS_ID_MAP).find(
    id => POE2_CLASS_ID_MAP[id] === className
  );

  if (!classId || !treeData.classes[classId]) {
    return null;
  }

  // Find a node that belongs to this class (usually the first one in the class's starting area)
  // This is a simplified approach - may need refinement based on actual tree structure
  const classData = treeData.classes[classId];

  // Look for nodes in groups near the class background position
  for (const group of treeData.groups) {
    if (!group) continue;

    // Check if group is near class background
    if (classData.background && group.nodes.length > 0) {
      const node = treeData.nodes[group.nodes[0]];
      if (node && !node.ascendancyName) {
        // Simple heuristic: first non-ascendancy node in a group could be start
        // This needs better logic based on actual tree structure
        return group.nodes[0];
      }
    }
  }

  return null;
}
