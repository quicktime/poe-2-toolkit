// Path of Exile 2 Specific Systems (Patch 0.3)

/**
 * Spirit System - Replaces mana reservation for persistent buffs
 */
export interface SpiritSystem {
  maxSpirit: number;
  usedSpirit: number;
  reservations: SpiritReservation[];
}

export interface SpiritReservation {
  source: string;
  sourceType: 'aura' | 'herald' | 'blessing' | 'permanent_minion';
  amount: number;
  icon: string;
}

/**
 * Uncut Gem Support System - New support gem system
 */
export interface UncutGemSupport {
  id: string;
  name: string;
  level: number;
  supportedSkills: string[];
  spiritCost: number;
  stats: GemStat[];
}

export interface GemStat {
  stat: string;
  value: number | string;
  type: 'flat' | 'increased' | 'more';
}

/**
 * Flask System - New charge-based system
 */
export interface Flask {
  id: string;
  name: string;
  type: 'life' | 'mana' | 'utility';
  charges: number;
  maxCharges: number;
  chargesPerUse: number;
  duration: number;
  effects: FlaskEffect[];
  enchantments?: FlaskEnchantment[];
}

export interface FlaskEffect {
  stat: string;
  value: number;
  duration?: number;
}

export interface FlaskEnchantment {
  name: string;
  effect: string;
}

/**
 * Dodge Roll System
 */
export interface DodgeRoll {
  available: boolean;
  cooldown: number;
  distance: number;
  iframes: number; // Invincibility frames
  modifiers: DodgeModifier[];
}

export interface DodgeModifier {
  source: string;
  effect: string;
  value?: number;
}

/**
 * Combo System for Melee
 */
export interface ComboSystem {
  maxComboCount: number;
  currentCombo: number;
  comboTimeout: number;
  comboSkills: ComboSkill[];
}

export interface ComboSkill {
  skillId: string;
  comboStep: number;
  damageMultiplier: number;
  additionalEffects?: string[];
}

/**
 * Honor System - Currency and resistance
 */
export interface HonorSystem {
  honorResistance: number;
  maxHonorResistance: number;
  goldFind: number;
  currencyDropBonus: number;
}

/**
 * Weapon Swap System
 */
export interface WeaponSet {
  id: 'primary' | 'secondary';
  active: boolean;
  mainHand?: EquippedItem;
  offHand?: EquippedItem;
  passiveSetBonus?: PassiveSetBonus;
}

export interface PassiveSetBonus {
  name: string;
  stats: string[];
}

export interface EquippedItem {
  id: string;
  name: string;
  type: string;
  requirements: ItemRequirements;
  mods: string[];
}

export interface ItemRequirements {
  level?: number;
  strength?: number;
  dexterity?: number;
  intelligence?: number;
}

/**
 * Sanctum System
 */
export interface SanctumProgress {
  floor: number;
  room: number;
  resolve: number;
  maxResolve: number;
  inspiration: number;
  aureus: number;
  relics: SanctumRelic[];
  afflictions: SanctumAffliction[];
  boons: SanctumBoon[];
}

export interface SanctumRelic {
  name: string;
  effect: string;
  tier: number;
}

export interface SanctumAffliction {
  name: string;
  effect: string;
  severity: 'minor' | 'major';
}

export interface SanctumBoon {
  name: string;
  effect: string;
  remaining: number;
}

/**
 * Breach System Updates
 */
export interface BreachRing {
  id: string;
  type: 'breach' | 'catalysed_breach';
  breachstones: number;
  level: number;
  experience: number;
  stats: string[];
}

/**
 * Crossbow Specific Mechanics
 */
export interface CrossbowMechanics {
  reloadTime: number;
  magazineSize: number;
  currentAmmo: number;
  ammoTypes: AmmoType[];
  attachments: CrossbowAttachment[];
}

export interface AmmoType {
  name: string;
  damage: string;
  effect: string;
  count: number;
}

export interface CrossbowAttachment {
  slot: 'sight' | 'grip' | 'mechanism';
  name: string;
  stats: string[];
}

/**
 * Skill Specialization System
 */
export interface SkillSpecialization {
  skillId: string;
  level: number;
  experience: number;
  specializationPoints: number;
  selectedNodes: SpecializationNode[];
}

export interface SpecializationNode {
  id: string;
  name: string;
  effect: string;
  cost: number;
  requirements?: string[];
}