export interface SkillGem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: GemColor;
  tags: SkillTag[];
  requirements: SkillRequirements;
  gemTags: string[];
  baseStats: SkillStats;
  qualityStats?: SkillStats;
  levelStats: SkillLevelStats[];
  isSupport: boolean;
  isActive: boolean;
  isVaal?: boolean;
  weaponRestrictions?: WeaponType[];
}

export type GemColor = 'red' | 'green' | 'blue' | 'white';

export type SkillTag =
  | 'attack'
  | 'spell'
  | 'projectile'
  | 'melee'
  | 'area'
  | 'duration'
  | 'totem'
  | 'minion'
  | 'movement'
  | 'curse'
  | 'aura'
  | 'channelling'
  | 'physical'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'chaos'
  | 'bow'
  | 'trigger'
  | 'critical'
  | 'strike';

export interface SkillRequirements {
  level: number;
  strength?: number;
  dexterity?: number;
  intelligence?: number;
}

export interface SkillStats {
  [key: string]: string | number;
}

export interface SkillLevelStats {
  level: number;
  manaCost?: number;
  damageEffectiveness?: number;
  criticalStrikeChance?: number;
  attackSpeed?: number;
  damageMultiplier?: number;
  stats: SkillStats;
}

export type WeaponType =
  | 'bow'
  | 'claw'
  | 'dagger'
  | 'oneHandedAxe'
  | 'oneHandedMace'
  | 'oneHandedSword'
  | 'sceptre'
  | 'staff'
  | 'twoHandedAxe'
  | 'twoHandedMace'
  | 'twoHandedSword'
  | 'wand'
  | 'fishingRod';

export interface SocketedGem {
  gem: SkillGem;
  level: number;
  quality: number;
  corrupted: boolean;
  socketIndex: number;
  linkGroup: number;
}

export interface SkillSetup {
  id: string;
  name: string;
  activeGem: SocketedGem;
  supportGems: SocketedGem[];
  itemSlot: string;
  enabled: boolean;
}

export interface CalculatedSkill {
  setup: SkillSetup;
  baseDamage: DamageRange;
  elementalDamage: ElementalDamage;
  damagePerHit: number;
  attacksPerSecond: number;
  dps: number;
  criticalChance: number;
  criticalMultiplier: number;
  manaCost: number;
  tags: SkillTag[];
  modifiers: SkillModifier[];
}

export interface DamageRange {
  min: number;
  max: number;
}

export interface ElementalDamage {
  fire: DamageRange;
  cold: DamageRange;
  lightning: DamageRange;
}

export interface SkillModifier {
  source: string;
  stat: string;
  value: number;
  type: 'base' | 'added' | 'increased' | 'more' | 'override';
}

export interface SupportGemEffect {
  stat: string;
  value: number;
  type: 'added' | 'increased' | 'more';
  condition?: string;
}

export interface SkillInteraction {
  trigger?: {
    type: 'onHit' | 'onCrit' | 'onKill' | 'onBlock' | 'periodic';
    chance: number;
    cooldown?: number;
  };
  linked?: {
    skills: string[];
    type: 'sequential' | 'simultaneous';
  };
  aura?: {
    radius: number;
    affectsSelf: boolean;
    affectsAllies: boolean;
    affectsEnemies: boolean;
  };
}

export interface SkillTreeInteraction {
  keystones: string[];
  notables: string[];
  masteries: string[];
  modifiers: SkillModifier[];
}

export interface SkillCalculationContext {
  character: {
    level: number;
    attributes: {
      strength: number;
      dexterity: number;
      intelligence: number;
    };
  };
  weapon?: {
    baseDamage: DamageRange;
    attackSpeed: number;
    criticalChance: number;
  };
  passiveTree: SkillTreeInteraction;
  equipment: SkillModifier[];
  buffs: SkillModifier[];
  charges?: {
    power: number;
    frenzy: number;
    endurance: number;
  };
}