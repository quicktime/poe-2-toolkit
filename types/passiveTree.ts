export interface PassiveNode {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  isKeystone: boolean;
  isNotable: boolean;
  isJewelSocket: boolean;
  isMastery: boolean;
  isAscendancy?: boolean;
  isAscendancyStart?: boolean;
  ascendancyName?: string | null;
  stats: string[];
  reminderText?: string[];
  grantedStrength?: number;
  grantedDexterity?: number;
  grantedIntelligence?: number;
  position: {
    x: number;
    y: number;
  };
  connections: number[]; // Node IDs this connects to
  orbit?: number; // For cluster jewel nodes
  orbitIndex?: number;
  classStartingNode?: string | null; // Class name if this is a starting node
}

export interface PassiveTreeData {
  version?: string;
  nodes: Record<number, PassiveNode>;
  groups: Record<number, PassiveGroup>;
  jewelSlots: number[];
  constants?: PassiveTreeConstants;
  sprites?: PassiveTreeSprites;
  imageRoot?: string;
  skillSprites?: SkillSprites;
  masteries?: Record<number, MasteryInfo>;
  classes?: Record<string, { startingNode: number }>;
}

export interface MasteryInfo {
  name: string;
  effects: Array<{
    id: number;
    stat: string;
    reminder?: string;
  }>;
}

export interface PassiveGroup {
  x: number;
  y: number;
  orbits: number[];
  nodes: number[];
  isProxy?: boolean;
}

export interface PassiveTreeConstants {
  classes: Record<string, number>;
  characterAttributes: Record<string, number>;
  PSSCentreInnerRadius: number;
  skillsPerOrbit: number[];
  orbitRadii: number[];
}

export interface PassiveTreeSprites {
  normalActive: SpriteSheet;
  normalInactive: SpriteSheet;
  notableActive: SpriteSheet;
  notableInactive: SpriteSheet;
  keystoneActive: SpriteSheet;
  keystoneInactive: SpriteSheet;
  mastery: SpriteSheet;
  startNode: SpriteSheet;
  groupBackground: SpriteSheet;
  frame: SpriteSheet;
  jewelSocket: SpriteSheet;
}

export interface SpriteSheet {
  filename: string;
  coords: Record<string, SpriteCoords>;
}

export interface SpriteCoords {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SkillSprites {
  normalActive: SkillSprite[];
  normalInactive: SkillSprite[];
  notableActive: SkillSprite[];
  notableInactive: SkillSprite[];
  keystoneActive: SkillSprite[];
  keystoneInactive: SkillSprite[];
  mastery: SkillSprite[];
}

export interface SkillSprite {
  filename: string;
  coords: SpriteCoords;
}

export interface AllocatedPassives {
  nodes: Set<number>;
  jewelData?: Map<number, JewelData>;
  masteryEffects?: Map<number, number>;
  classStartNode?: number;
  pointsUsed?: number;
}

export interface JewelData {
  type: string;
  name: string;
  itemLevel?: number;
  explicit?: string[];
  radius?: number;
  radiusMin?: number;
  radiusVisual?: string;
}

export interface PassiveTreePath {
  nodes: number[];
  cost: number;
}

export interface PassiveNodeModifier {
  stat: string;
  value: number;
  type: 'flat' | 'increased' | 'more' | 'base';
}

export interface PassiveTreeStats {
  life: number;
  mana: number;
  energyShield: number;
  armour: number;
  evasion: number;

  strength: number;
  dexterity: number;
  intelligence: number;

  // Offensive
  physicalDamageIncreased: number;
  elementalDamageIncreased: number;
  criticalStrikeChance: number;
  criticalStrikeMultiplier: number;
  attackSpeed: number;
  castSpeed: number;
  accuracy: number;

  // Defensive
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  chaosResistance: number;
  blockChance: number;
  spellBlockChance: number;

  // Utility
  movementSpeed: number;
  itemRarity: number;
  itemQuantity: number;

  // Raw modifiers for calculation
  modifiers: PassiveNodeModifier[];
}

export type CharacterClass =
  | 'Witch'
  | 'Monk'
  | 'Ranger'
  | 'Warrior'
  | 'Mercenary'
  | 'Sorceress';

export interface CharacterStartingNode {
  class: CharacterClass;
  nodeId: number;
}