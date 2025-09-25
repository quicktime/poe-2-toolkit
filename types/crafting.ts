/**
 * Comprehensive crafting system types for Path of Exile 2
 */

import { MarketItem, PriceInfo, CurrencyType } from './market';

/**
 * Item modifier with all necessary crafting information
 */
export interface ItemModifier {
  id: string;
  text: string;
  type: 'prefix' | 'suffix' | 'implicit' | 'enchant' | 'corrupt';
  tier: number;
  requiredLevel: number;
  tags: string[];
  weight: number;
  values: {
    min: number;
    max: number;
  }[];
  group?: string; // Modifier group for blocking
  essence?: string; // Essence-only modifier
  fossil?: string[]; // Fossil-exclusive modifiers
  influence?: string[]; // Influence requirements
}

/**
 * Crafting currency types and their effects (PoE 2 version)
 */
export interface CraftingCurrency {
  id: string;
  name: string;
  type: CraftingMethodType;
  tier?: 'normal' | 'greater' | 'perfect'; // PoE 2 currency tiers
  effect: string;
  tags?: string[]; // Tags it affects
  guaranteedMods?: string[]; // For essences and runes
  modifierTier?: number; // Minimum modifier tier for Greater/Perfect
  cost?: PriceInfo; // Current market price
}

/**
 * All crafting method types in Path of Exile 2 (v0.3+)
 */
export type CraftingMethodType = 
  | 'basic_currency'      // Chaos, Alchemy, Transmutation, etc.
  | 'tiered_currency'     // Greater and Perfect versions
  | 'essence'             // Normal and Greater Essences
  | 'rune'                // Runes with Soul Cores
  | 'soul_core'           // Soul Core application
  | 'omen'                // Omens that modify currency behavior
  | 'distilled'           // Distilled Orbs (emotion-based)
  | 'bench'               // Crafting bench (limited in PoE 2)
  | 'corrupt'             // Vaal Orb corruption
  | 'vendor'              // Vendor recipes
  // REMOVED from PoE 2:
  // fossil, harvest, metacraft, beast, catalyst, recombinator

/**
 * Crafting method definition
 */
export interface CraftingMethod {
  id: string;
  name: string;
  type: CraftingMethodType;
  description: string;
  requirements: CraftingRequirements;
  outcomes: CraftingOutcome[];
  cost: CraftingCost;
  successRate?: number; // For deterministic crafts
  averageAttempts?: number; // For RNG crafts
  tags?: string[]; // Affected modifier tags
}

/**
 * Requirements for a crafting method
 */
export interface CraftingRequirements {
  itemLevel?: number;
  itemRarity?: 'normal' | 'magic' | 'rare';
  itemBase?: string[];
  influences?: string[];
  openPrefixes?: number;
  openSuffixes?: number;
  hasModifier?: string[];
  doesNotHaveModifier?: string[];
  itemClass?: string[];
  qualityMin?: number;
}

/**
 * Possible outcome of a crafting method
 */
export interface CraftingOutcome {
  probability: number;
  modifiers?: ItemModifier[];
  effect?: string; // Description of effect
  preserves?: ('prefixes' | 'suffixes')[];
  removes?: ('prefixes' | 'suffixes')[];
  adds?: ('prefixes' | 'suffixes')[];
}

/**
 * Cost breakdown for a crafting method
 */
export interface CraftingCost {
  currency: Record<CurrencyType, number>;
  averageTotal?: number; // In chaos equivalent
  worstCase?: number;
  bestCase?: number;
  standardDeviation?: number;
}

/**
 * Desired item specifications from user
 */
export interface DesiredItem {
  baseType: string;
  itemClass: string;
  requiredMods: RequiredModifier[];
  optionalMods?: RequiredModifier[];
  minSockets?: number;
  minLinks?: number;
  quality?: number;
  influences?: string[];
  enchant?: string;
  implicit?: string;
  budgetLimit?: number; // In chaos equivalent
  riskTolerance?: 'low' | 'medium' | 'high';
}

/**
 * Required modifier specification
 */
export interface RequiredModifier {
  modText: string; // Can be partial match
  minTier?: number;
  minValue?: number;
  maxValue?: number;
  weight?: number; // Importance weight for optimization
}

/**
 * Crafting step in a sequence
 */
export interface CraftingStep {
  stepNumber: number;
  method: CraftingMethod;
  description: string;
  expectedCost: CraftingCost;
  successProbability: number;
  expectedAttempts: number;
  materials: CraftingMaterial[];
  conditions?: string[]; // Conditions that must be met
  fallback?: CraftingStep; // Alternative if this fails
  tips?: string[]; // Helpful tips for this step
}

/**
 * Crafting material requirement
 */
export interface CraftingMaterial {
  item: string;
  quantity: number;
  currentPrice: PriceInfo;
  totalCost: number;
  marketAvailability?: number; // Number available on market
}

/**
 * Complete crafting strategy
 */
export interface CraftingStrategy {
  id: string;
  name: string;
  description: string;
  targetItem: DesiredItem;
  steps: CraftingStep[];
  totalCost: {
    expected: number;
    minimum: number;
    maximum: number;
    standardDeviation: number;
  };
  successProbability: number;
  estimatedTime?: number; // In minutes
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  profitMargin?: {
    expectedSellPrice: number;
    expectedProfit: number;
    roi: number; // Return on investment percentage
  };
  alternativeStrategies?: CraftingStrategy[]; // Other viable options
  marketComparison?: {
    buyPrice: number;
    craftVsBuyRecommendation: 'craft' | 'buy' | 'either';
    reasoning: string;
  };
}

/**
 * Crafting simulation result
 */
export interface CraftingSimulation {
  strategy: CraftingStrategy;
  simulations: number;
  results: {
    successes: number;
    failures: number;
    averageCost: number;
    medianCost: number;
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
    costDistribution: Array<{
      cost: number;
      frequency: number;
    }>;
    timeDistribution?: Array<{
      attempts: number;
      frequency: number;
    }>;
  };
}

/**
 * Modifier pool for an item base
 */
export interface ModifierPool {
  itemBase: string;
  itemLevel: number;
  prefixes: ModifierWeight[];
  suffixes: ModifierWeight[];
  implicits?: ModifierWeight[];
  totalPrefixWeight: number;
  totalSuffixWeight: number;
}

/**
 * Modifier with weight in pool
 */
export interface ModifierWeight {
  modifier: ItemModifier;
  weight: number;
  probability: number; // weight / totalWeight
  tags: string[];
  fossils?: {
    increased?: string[];  // Fossils that increase weight
    decreased?: string[];  // Fossils that decrease weight
    blocked?: string[];    // Fossils that block this mod
  };
}

/**
 * Crafting knowledge base entry
 */
export interface CraftingKnowledge {
  itemClass: string;
  baseType: string;
  modifierPools: {
    [itemLevel: number]: ModifierPool;
  };
  craftingMethods: CraftingMethod[];
  metamods: MetamodOption[];
  benchCrafts: BenchCraft[];
  beastCrafts: BeastCraft[];
  harvestCrafts: HarvestCraft[];
}

/**
 * Rune application option (PoE 2 replacement for deterministic crafting)
 */
export interface RuneOption {
  id: string;
  runeName: string;
  soulCoreRequired: 'minor' | 'major' | 'prime';
  guaranteedModifier: string;
  modifierStrength: 'weak' | 'moderate' | 'strong';
  cost: CraftingCost;
  slot: 'prefix' | 'suffix';
}

/**
 * Bench craft option
 */
export interface BenchCraft {
  id: string;
  modText: string;
  cost: CraftingCost;
  requiredUnlock?: string;
  slot: 'prefix' | 'suffix';
  tags: string[];
}

/**
 * Beast craft option
 */
export interface BeastCraft {
  id: string;
  name: string;
  beasts: string[];
  effect: string;
  deterministic: boolean;
  cost: CraftingCost;
}

/**
 * Omen enhancement option (PoE 2)
 */
export interface OmenEnhancement {
  id: string;
  name: string;
  omenType: 'prefix' | 'suffix' | 'double' | 'fortune' | 'protection';
  effect: string;
  currencyAffected: string[]; // Which currencies this omen works with
  cost: CraftingCost;
}

/**
 * Crafting optimizer configuration
 */
export interface OptimizerConfig {
  maxSteps?: number;
  maxCost?: number;
  targetSuccessRate?: number;
  riskTolerance: 'low' | 'medium' | 'high';
  includeMetacrafting?: boolean;
  includeHarvest?: boolean;
  includeBeast?: boolean;
  includeFossils?: boolean;
  includeEssences?: boolean;
  preferDeterministic?: boolean;
  optimizeFor: 'cost' | 'time' | 'success_rate' | 'profit';
}

/**
 * Machine learning model input for crafting prediction
 */
export interface CraftingMLInput {
  itemBase: string;
  itemLevel: number;
  currentMods: ItemModifier[];
  targetMods: RequiredModifier[];
  availableCurrency: Record<CurrencyType, number>;
  marketPrices: Record<string, number>;
  historicalAttempts?: number;
  previousMethods?: string[];
}

/**
 * ML model output prediction
 */
export interface CraftingMLPrediction {
  recommendedMethod: CraftingMethod;
  expectedSuccess: number;
  expectedCost: number;
  confidence: number;
  reasoning: string;
  alternativeMethods: Array<{
    method: CraftingMethod;
    score: number;
  }>;
}

/**
 * Crafting session tracking
 */
export interface CraftingSession {
  id: string;
  startTime: Date;
  targetItem: DesiredItem;
  strategy: CraftingStrategy;
  currentStep: number;
  attempts: CraftingAttempt[];
  totalSpent: Record<CurrencyType, number>;
  status: 'in_progress' | 'completed' | 'abandoned';
  result?: MarketItem;
}

/**
 * Single crafting attempt record
 */
export interface CraftingAttempt {
  stepNumber: number;
  method: string;
  materials: Record<string, number>;
  result: 'success' | 'failure' | 'partial';
  itemState: ItemState;
  timestamp: Date;
  cost: number;
}

/**
 * Item state at a point in crafting
 */
export interface ItemState {
  prefixes: ItemModifier[];
  suffixes: ItemModifier[];
  implicit?: ItemModifier;
  enchant?: ItemModifier;
  corrupted: boolean;
  influenced?: string[];
  fractured?: ItemModifier[];
  synthesized?: boolean;
  quality: number;
  sockets?: {
    number: number;
    links: number[];
    colors: string;
  };
}

/**
 * Crafting recommendation from AI/ML system
 */
export interface CraftingRecommendation {
  strategy: CraftingStrategy;
  confidence: number;
  explanation: string;
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  marketAnalysis: {
    materialAvailability: 'abundant' | 'moderate' | 'scarce';
    priceVolatility: 'stable' | 'moderate' | 'volatile';
    profitPotential: 'high' | 'moderate' | 'low' | 'negative';
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
}