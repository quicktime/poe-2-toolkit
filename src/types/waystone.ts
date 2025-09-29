/**
 * Path of Exile 2 Waystone Optimization Types
 * Version 0.3 (The Third Edict)
 */

// ============== Waystone Base Types ==============

export interface WaystoneBase {
  name: string;
  tier: number; // 1-16 in PoE 2
  itemLevel: number;
  rarity: 'normal' | 'magic' | 'rare';
  modifierCount?: number; // Important for tablet usage
  hasTower?: boolean; // Precursor Tower presence
  region?: string;
}

export interface WaystoneModifier {
  id: string;
  name: string;
  description: string;
  type: 'prefix' | 'suffix' | 'implicit' | 'corruption';
  tier: number;
  weight: number;
  values: {
    min: number;
    max: number;
  };
  effects: WaystoneEffect[];
  tags: string[];
}

export interface WaystoneEffect {
  stat: WaystoneStat;
  value: number;
  isPercentage?: boolean;
}

export enum WaystoneStat {
  // PoE 2 Waystone-specific stats
  INCREASED_WAYSTONE_DROPS = 'increased_waystone_drops',
  INCREASED_RARITY = 'increased_rarity',
  INCREASED_PACK_SIZE = 'increased_pack_size',
  ADDITIONAL_RARE_MONSTERS = 'additional_rare_monsters',
  HIGHER_TIER_CHANCE = 'higher_tier_chance',

  // Monster Modifiers
  MONSTER_DAMAGE = 'monster_damage',
  MONSTER_LIFE = 'monster_life',
  MONSTER_SPEED = 'monster_speed',
  MONSTER_ELEMENTAL_RESISTANCE = 'monster_elemental_resistance',
  MONSTER_CHAOS_RESISTANCE = 'monster_chaos_resistance',

  // PoE 2 Tower and Tablet Mechanics
  PRECURSOR_TOWER = 'precursor_tower',
  TABLET_SLOTS = 'tablet_slots',
  IRRADIATED_MONSTERS = 'irradiated_monsters',
  STRONGBOX_CHANCE = 'strongbox_chance',

  // Additional Monsters
  ADDITIONAL_PACKS = 'additional_packs',
  ADDITIONAL_RARE_PACKS = 'additional_rare_packs',
  ADDITIONAL_MAGIC_PACKS = 'additional_magic_packs',

  // Boss Modifiers
  BOSS_DAMAGE = 'boss_damage',
  BOSS_LIFE = 'boss_life',
  TWIN_BOSS = 'twin_boss',

  // Dangerous Modifiers
  NO_REGENERATION = 'no_regeneration',
  NO_LEECH = 'no_leech',
  REDUCED_RECOVERY = 'reduced_recovery',
  CURSED_GROUND = 'cursed_ground',
  REFLECTED_DAMAGE = 'reflected_damage'
}

// ============== Currency Types ==============

export interface WaystoneCurrency {
  id: string;
  name: string;
  icon?: string;
  effect: WaystoneCurrencyEffect;
  cost: number; // In chaos orbs equivalent
  weight: number; // Drop weight
  requiredTier?: number;
  maxApplications?: number;
  tags?: string[];
}

export interface WaystoneCurrencyEffect {
  type: CurrencyEffectType;
  modifiers?: WaystoneModifier[];
  guaranteedModifiers?: string[];
  removeModifiers?: string[];
  rerollValues?: boolean;
  addQuality?: number;
  corruptItem?: boolean;
  upgradeRarity?: 'magic' | 'rare';
  addModifierCount?: number;
}

export enum CurrencyEffectType {
  ADD_MODIFIER = 'add_modifier',
  REMOVE_MODIFIER = 'remove_modifier',
  REROLL_ALL = 'reroll_all',
  REROLL_VALUES = 'reroll_values',
  ADD_QUALITY = 'add_quality',
  CORRUPT = 'corrupt',
  UPGRADE_RARITY = 'upgrade_rarity',
  DIVINE = 'divine',
  ANNUL = 'annul',
  EXALT = 'exalt',
  CHAOS = 'chaos',
  ALCHEMY = 'alchemy',
  TRANSMUTE = 'transmute',
  AUGMENT = 'augment',
  REGAL = 'regal',
  SCOUR = 'scour',
  BLESSED = 'blessed',
  VAAL = 'vaal'
}

// ============== Optimization Types ==============

export interface WaystoneOptimizationGoal {
  id: string;
  name: string;
  description: string;
  priority: WaystoneStatPriority[];
  avoid: WaystoneStat[];
  requiredModifiers?: string[];
  budgetLimit?: number; // In chaos orbs
  acceptableRisk?: 'low' | 'medium' | 'high';
}

export interface WaystoneStatPriority {
  stat: WaystoneStat;
  weight: number;
  minValue?: number;
  maxValue?: number;
}

export interface WaystoneOptimizationStrategy {
  goal: WaystoneOptimizationGoal;
  steps: WaystoneOptimizationStep[];
  expectedCost: number;
  expectedValue: number;
  successProbability: number;
  alternativeStrategies?: WaystoneOptimizationStrategy[];
}

export interface WaystoneOptimizationStep {
  order: number;
  action: string;
  currency: WaystoneCurrency;
  condition?: string;
  expectedOutcome: string;
  cost: number;
  probability: number;
  alternatives?: WaystoneOptimizationStep[];
}

// ============== Analysis Types ==============

export interface WaystoneAnalysis {
  waystone: Waystone;
  value: WaystoneValue;
  dangers: WaystoneDanger[];
  recommendations: WaystoneRecommendation[];
  profitability: WaystoneProfitability;
}

export interface Waystone {
  base: WaystoneBase;
  modifiers: WaystoneModifier[];
  quality: number;
  corrupted: boolean;
  influenced?: string[];
  enchant?: string;
}

export interface WaystoneValue {
  experienceMultiplier: number;
  quantityMultiplier: number;
  rarityMultiplier: number;
  packSizeMultiplier: number;
  overallScore: number;
  scoreByGoal: Map<string, number>;
}

export interface WaystoneDanger {
  modifier: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'extreme';
  description: string;
  mitigation?: string;
}

export interface WaystoneRecommendation {
  action: string;
  currency: WaystoneCurrency;
  expectedImprovement: number;
  cost: number;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

export interface WaystoneProfitability {
  expectedReturns: number;
  investmentCost: number;
  netProfit: number;
  profitMargin: number;
  breakEvenRuns: number;
}

// ============== Preset Strategies ==============

export interface WaystonePreset {
  id: string;
  name: string;
  description: string;
  goal: WaystoneOptimizationGoal;
  recommendedLevel?: number;
  recommendedGear?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  profitability: 'low' | 'medium' | 'high' | 'very_high';
  timeInvestment: 'quick' | 'moderate' | 'long';
}

// ============== Market Integration ==============

export interface WaystoneMarketData {
  currencyPrices: Map<string, number>; // In chaos orbs
  modifierValues: Map<string, number>; // Value added by specific modifiers
  waystoneBasePrices: Map<number, number>; // By tier
  lastUpdated: Date;
}

// ============== Simulation Types ==============

export interface WaystoneSimulationConfig {
  iterations: number;
  startingWaystone: Waystone;
  strategy: WaystoneOptimizationStrategy;
  marketData: WaystoneMarketData;
  playerBudget: number;
  acceptableRisk: number; // 0-1
}

export interface WaystoneSimulationResult {
  successRate: number;
  averageCost: number;
  averageValue: number;
  bestOutcome: Waystone;
  worstOutcome: Waystone;
  profitDistribution: number[];
  recommendedAdjustments: string[];
}