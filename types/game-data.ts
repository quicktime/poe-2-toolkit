/**
 * Path of Exile 2 Game Data Type Definitions
 * Version 0.3 (The Third Edict)
 */

// ============== Base Items ==============

export interface BaseItem {
  name: string;
  base_type?: string;
  item_class: string;
  category: 'weapon' | 'armour' | 'accessory' | 'flask' | 'jewel';
  properties: {
    damage?: string;
    armor?: number;
    evasion?: number;
    energy_shield?: number;
    attack_speed?: number;
    critical_chance?: number;
    [key: string]: any;
  };
  requirements?: {
    level?: number;
    str?: number;
    dex?: number;
    int?: number;
  };
}

export interface WeaponBase extends BaseItem {
  category: 'weapon';
  weapon_type: 'sword' | 'axe' | 'mace' | 'bow' | 'crossbow' | 'staff' | 'wand' | 'dagger' | 'claw' | 'sceptre' | 'spear' | 'flail';
  physical_damage_min: number;
  physical_damage_max: number;
  attacks_per_second: number;
  critical_strike_chance: number;
  weapon_range?: number;
}

// ============== Unique Items ==============

export interface UniqueItem {
  name: string;
  base_item: string;
  category: string;
  level: number;
  implicit_mods?: string[];
  explicit_mods: string[];
  flavor_text?: string;
  source?: 'drop' | 'boss' | 'vendor' | 'divination_card';
}

// ============== Skill Gems ==============

export interface SkillGem {
  name: string;
  gem_type: 'active' | 'support';
  tags: string[];
  primary_attribute?: 'strength' | 'dexterity' | 'intelligence';
  required_level: number;
  mana_cost?: number;
  spirit_cost?: number;
  cast_time?: number;
  damage_effectiveness?: number;
  damage_multiplier?: number;
  description?: string;
  quality_bonus?: string;
}

export interface SupportGem extends SkillGem {
  gem_type: 'support';
  spirit: number;
  multiplier?: number;
  chains?: number;
  projectiles?: number;
}

// ============== Passive Tree ==============

export interface PassiveNode {
  id: number;
  name: string;
  type: 'normal' | 'notable' | 'keystone' | 'jewel_socket' | 'mastery';
  stats: string[];
  connections: number[];
  group?: number;
  orbit?: number;
  orbitIndex?: number;
  position?: {
    x: number;
    y: number;
  };
  ascendancy_class?: string;
  is_starting_node?: boolean;
  is_multiple_choice?: boolean;
  is_multiple_choice_option?: boolean;
  passive_points_granted?: number;
  granted_stats?: string[];
}

export interface PassiveTreeData {
  nodes: PassiveNode[];
  groups: PassiveGroup[];
  classes: CharacterClass[];
  jewelSlots: { [id: string]: JewelSlot };
  masteries: { [id: string]: Mastery };
  version: string;
}

export interface PassiveGroup {
  id: number;
  position: {
    x: number;
    y: number;
  };
  nodes: number[];
  isProxy?: boolean;
}

export interface JewelSlot {
  name: string;
  radius?: number;
  radiusMin?: number;
  radiusMax?: number;
}

export interface Mastery {
  name: string;
  effects: MasteryEffect[];
}

export interface MasteryEffect {
  id: number;
  stats: string[];
}

// ============== Currency ==============

export interface CurrencyItem {
  name: string;
  type: 'orb' | 'shard' | 'essence' | 'fossil' | 'oil' | 'catalyst';
  effect: string;
  tier?: 'common' | 'uncommon' | 'rare' | 'very_rare';
  drop_level?: number;
  stack_size?: number;
  required?: number; // For shards
  makes?: string; // What orb shards create
}

// ============== Character Classes ==============

export interface CharacterClass {
  id: number;
  name: 'Warrior' | 'Ranger' | 'Witch' | 'Monk' | 'Mercenary' | 'Sorceress';
  starting_attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
  };
  starting_node: number;
  ascendancies: Ascendancy[];
}

export interface Ascendancy {
  id: number;
  name: string;
  class: string;
  description: string;
  passive_skills: number[];
}

// ============== Game Mechanics ==============

export interface SpiritCost {
  minion?: string;
  min?: number;
  max?: number;
  flat?: number;
}

export interface DamageFormula {
  name: string;
  formula: string;
  description?: string;
}

export interface AtlasRegion {
  name: string;
  tier: number;
  map_count: number;
  boss?: string;
}

export interface AtlasMechanic {
  name: string;
  description: string;
  rewards: string[];
}

export interface QuestReward {
  quest_name: string;
  act: number;
  rewards: {
    all?: string[];
    [className: string]: string[] | undefined;
  };
}

export interface VendorRecipe {
  name: string;
  ingredients: string[];
  result: string;
  notes?: string;
}

export interface SkillCombo {
  name: string;
  skills: string[];
  description: string;
  damage_multiplier?: number;
  damage_type?: string;
  utility?: string;
}

// ============== Item Mods ==============

export interface ItemMod {
  id: string;
  name: string;
  type: 'prefix' | 'suffix' | 'implicit' | 'explicit' | 'crafted' | 'veiled';
  domain: 'item' | 'flask' | 'jewel' | 'abyss_jewel' | 'atlas';
  generation_type: 'prefix' | 'suffix' | 'unique' | 'corrupted' | 'enchantment';
  required_level: number;
  stats: ItemModStat[];
  spawn_weights: SpawnWeight[];
  tags: string[];
}

export interface ItemModStat {
  id: string;
  min: number;
  max: number;
  text: string;
}

export interface SpawnWeight {
  tag: string;
  weight: number;
}

// ============== Stats ==============

export interface Stat {
  id: string;
  text: string;
  type?: 'offensive' | 'defensive' | 'utility';
  is_local?: boolean;
  is_per_level?: boolean;
  alias?: string[];
}

export interface StatTranslation {
  id: string;
  english: TranslationEntry[];
}

export interface TranslationEntry {
  condition: {
    min?: number;
    max?: number;
    negated?: boolean;
  };
  format: string;
  index_handlers?: string[][];
}

// ============== Complete Game Data ==============

export interface GameData {
  version: string;
  patch: string;
  base_items: BaseItem[];
  unique_items: UniqueItem[];
  skill_gems: SkillGem[];
  passive_tree: PassiveTreeData;
  currency: CurrencyItem[];
  classes: CharacterClass[];
  item_mods: ItemMod[];
  stats: Stat[];
  stat_translations: StatTranslation[];
  atlas: {
    regions: AtlasRegion[];
    mechanics: AtlasMechanic[];
  };
  quest_rewards: QuestReward[];
  vendor_recipes: VendorRecipe[];
  skill_combos: SkillCombo[];
  spirit_costs: { [key: string]: SpiritCost };
  damage_formulas: { [key: string]: DamageFormula };
}

// Types are already exported inline, no need to re-export