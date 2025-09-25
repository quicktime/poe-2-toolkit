export interface Character {
  id: string;
  name: string;
  realm: string;
  class: CharacterClass;
  level: number;
  experience: number;
  league: string;
}

// Path of Exile 2 Classes (Patch 0.3)
export type CharacterClass =
  | 'Warrior'
  | 'Monk'
  | 'Ranger'
  | 'Mercenary'
  | 'Witch'
  | 'Sorceress';

// Path of Exile 2 Ascendancies
export type AscendancyClass =
  // Warrior
  | 'Warbringer'
  | 'Titan'
  // Monk
  | 'Invoker'
  | 'Acolyte of Chayula'
  // Ranger
  | 'Deadeye'
  | 'Survivalist'
  // Mercenary
  | 'Witchhunter'
  | 'Gemling Legionnaire'
  // Witch
  | 'Infernalist'
  | 'Blood Mage'
  // Sorceress
  | 'Stormweaver'
  | 'Chronomancer';

export interface CharacterListItem extends Character {
  ascendancyClass?: string;
  lastActive?: string;
}

export interface CharacterDetails extends Character {
  ascendancyClass: string;
  lastActive: string;
  items: CharacterItem[];
  passives: PassiveSkills;
  stats: CharacterStats;
  skills: CharacterSkill[];
}

// Type alias for compatibility
export type Item = CharacterItem;

export interface CharacterItem {
  id?: string;
  name?: string;
  typeLine?: string;
  frameType?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  icon?: string;
  inventoryId?: string;
  socketedItems?: CharacterItem[];
  sockets?: ItemSocket[];
  properties?: ItemProperty[];
  requirements?: ItemRequirement[];
  implicitMods?: string[];
  explicitMods?: string[];
  craftedMods?: string[];
  enchantMods?: string[];
  fracturedMods?: string[];
  corrupted?: boolean;
  influences?: ItemInfluence;
  ilvl?: number;
  jewelData?: {
    radius?: number;
    limit?: number;
  };
}

export interface ItemSocket {
  group: number;
  attr: 'S' | 'D' | 'I' | 'G' | 'A' | 'DV';
  sColour: 'R' | 'G' | 'B' | 'W' | 'A' | 'DV';
}

export interface ItemProperty {
  name: string;
  values: Array<[string, number]>;
  displayMode: number;
  type?: number;
}

export interface ItemRequirement {
  name: string;
  values: Array<[string, number]>;
  displayMode: number;
}

export interface ItemInfluence {
  elder: boolean;
  shaper: boolean;
  crusader: boolean;
  redeemer: boolean;
  hunter: boolean;
  warlord: boolean;
}

export interface PassiveSkills {
  hashes: number[];
  hashesEx: number[];
  masteryEffects: Record<number, number>;
  jewelData: Record<number, JewelData>;
}

export interface JewelData {
  type: string;
  radius?: number;
  radiusMin?: number;
  radiusVisual?: string;
}

export interface CharacterStats {
  life: StatValues;
  mana: StatValues;
  energyShield: StatValues;
  evasion: number;
  armour: number;
  resistances: Resistances;
  accuracy: number;
  criticalStrikeChance: number;
  criticalStrikeMultiplier: number;
  attackSpeed: number;
  castSpeed: number;
  movementSpeed: number;
  blockChance: number;
  spellBlockChance: number;
}

export interface StatValues {
  current: number;
  max: number;
  reserved: number;
  unreserved: number;
}

export interface Resistances {
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

export interface CharacterSkill {
  id: string;
  name: string;
  icon: string;
  activeGem: SkillGem;
  supportGems: SkillGem[];
  slot: string;
}

export interface SkillGem {
  id: string;
  name: string;
  level: number;
  quality: number;
  experience: number;
  icon: string;
  tags: string[];
}

export interface CharacterListResponse {
  characters: Character[];
}

export interface CharacterDetailsResponse {
  character: CharacterDetails;
}

export interface CharacterInventory {
  character: Character;
  items: CharacterItem[];
}

export interface CharacterPassivesResponse {
  hashes: number[];
  hashesEx: number[];
  masteryEffects: Record<number, number>;
  jewelData: Record<number, JewelData>;
}