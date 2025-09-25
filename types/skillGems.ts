// Path of Exile 2 Skill Gem Types

export type GemType = 'Active' | 'Support' | 'Meta' | 'Uncut';
export type GemColor = 'Red' | 'Green' | 'Blue' | 'White';

export interface SkillGem {
  id: string;
  name: string;
  type: GemType;
  color: GemColor;
  level: number;
  quality: number;
  icon?: string;
  description?: string;
  tags: string[];
  requirements: {
    level?: number;
    strength?: number;
    dexterity?: number;
    intelligence?: number;
  };
  stats: GemStat[];
  qualityStats?: GemStat[];
}

export interface GemStat {
  id: string;
  text: string;
  values: number[];
  type: 'base' | 'per_level' | 'quality';
}

export interface SupportGem extends SkillGem {
  type: 'Support';
  supportedTags: string[];
  excludedTags: string[];
  manaMultiplier: number;
}

export interface UncutGem {
  id: string;
  name: string;
  type: 'Uncut';
  tier: number;
  level: number;
  possibleSkills: string[];
  spiritCost: number;
}

export interface SkillLink {
  id: string;
  activeGem: SkillGem;
  supportGems: SupportGem[];
  slot: EquipmentSlot;
  linkGroup: number;
  manaCost: number;
  cooldown?: number;
  castTime?: number;
}

export type EquipmentSlot =
  | 'Weapon'
  | 'Weapon2'
  | 'Helm'
  | 'BodyArmour'
  | 'Gloves'
  | 'Boots'
  | 'Ring'
  | 'Ring2'
  | 'Amulet';

export interface SkillSetup {
  mainSkills: SkillLink[];
  auraSkills: SkillLink[];
  utilitySkills: SkillLink[];
  movementSkills: SkillLink[];
  uncutGems: UncutGem[];
  totalSpiritUsed: number;
}

// PoE 2 Specific: Skill Combos
export interface ComboSkill {
  id: string;
  name: string;
  baseSkill: SkillGem;
  comboStage: number;
  damageMultiplier: number;
  addedEffects: string[];
}

// Common skill tags in PoE 2
export const SKILL_TAGS = [
  'Attack',
  'Spell',
  'Projectile',
  'Area',
  'Melee',
  'Slam',
  'Strike',
  'Channelling',
  'Physical',
  'Fire',
  'Cold',
  'Lightning',
  'Chaos',
  'Minion',
  'Totem',
  'Trap',
  'Mine',
  'Aura',
  'Herald',
  'Curse',
  'Movement',
  'Blink',
  'Guard',
  'Travel',
  'Duration',
  'Vaal',
  'Critical',
  'Trigger'
] as const;

export type SkillTag = typeof SKILL_TAGS[number];

// Mock data for development
export const MOCK_SKILL_GEMS: SkillGem[] = [
  {
    id: 'cleave',
    name: 'Cleave',
    type: 'Active',
    color: 'Red',
    level: 1,
    quality: 0,
    tags: ['Attack', 'Area', 'Melee', 'Physical'],
    requirements: {
      level: 1,
      strength: 16
    },
    stats: [
      {
        id: 'base_damage',
        text: 'Deals {0}% of Base Attack Damage',
        values: [125],
        type: 'base'
      },
      {
        id: 'added_damage',
        text: '{0} to {1} Added Attack Physical Damage',
        values: [2, 3],
        type: 'per_level'
      }
    ]
  },
  {
    id: 'fireball',
    name: 'Fireball',
    type: 'Active',
    color: 'Blue',
    level: 1,
    quality: 0,
    tags: ['Spell', 'Projectile', 'Fire', 'Area'],
    requirements: {
      level: 1,
      intelligence: 16
    },
    stats: [
      {
        id: 'base_damage',
        text: 'Deals {0} to {1} Fire Damage',
        values: [9, 13],
        type: 'base'
      },
      {
        id: 'radius',
        text: 'Base Radius is {0} metres',
        values: [1.5],
        type: 'base'
      }
    ]
  },
  {
    id: 'lightning_arrow',
    name: 'Lightning Arrow',
    type: 'Active',
    color: 'Green',
    level: 1,
    quality: 0,
    tags: ['Attack', 'Projectile', 'Lightning', 'Bow'],
    requirements: {
      level: 12,
      dexterity: 33
    },
    stats: [
      {
        id: 'base_damage',
        text: 'Deals {0}% of Base Attack Damage',
        values: [130],
        type: 'base'
      },
      {
        id: 'conversion',
        text: '50% of Physical Damage Converted to Lightning Damage',
        values: [],
        type: 'base'
      }
    ]
  }
];

export const MOCK_SUPPORT_GEMS: SupportGem[] = [
  {
    id: 'added_fire',
    name: 'Added Fire Damage Support',
    type: 'Support',
    color: 'Red',
    level: 1,
    quality: 0,
    tags: ['Support', 'Fire'],
    supportedTags: ['Attack', 'Spell'],
    excludedTags: ['Totem', 'Minion'],
    manaMultiplier: 1.2,
    requirements: {
      level: 8,
      strength: 18
    },
    stats: [
      {
        id: 'added_fire',
        text: 'Gain {0}% of Physical Damage as Extra Fire Damage',
        values: [20],
        type: 'base'
      }
    ]
  },
  {
    id: 'increased_area',
    name: 'Increased Area of Effect Support',
    type: 'Support',
    color: 'Blue',
    level: 1,
    quality: 0,
    tags: ['Support', 'Area'],
    supportedTags: ['Area'],
    excludedTags: [],
    manaMultiplier: 1.4,
    requirements: {
      level: 8,
      intelligence: 18
    },
    stats: [
      {
        id: 'area_increase',
        text: '{0}% increased Area of Effect',
        values: [30],
        type: 'base'
      }
    ]
  },
  {
    id: 'faster_attacks',
    name: 'Faster Attacks Support',
    type: 'Support',
    color: 'Green',
    level: 1,
    quality: 0,
    tags: ['Support', 'Attack', 'Speed'],
    supportedTags: ['Attack'],
    excludedTags: ['Spell'],
    manaMultiplier: 1.15,
    requirements: {
      level: 8,
      dexterity: 18
    },
    stats: [
      {
        id: 'attack_speed',
        text: '{0}% increased Attack Speed',
        values: [20],
        type: 'base'
      }
    ]
  }
];