/**
 * Path of Exile 2 Waystone Data (v0.3 - The Third Edict)
 * Accurate waystone modifiers and optimization strategies for PoE 2
 * Note: PoE 2 uses a different system than PoE 1 maps
 */

import type {
  WaystoneModifier,
  WaystoneCurrency,
  WaystonePreset,
  WaystoneStat,
  CurrencyEffectType
} from '../../types/waystone';

// ============== Waystone Modifiers ==============

export const WAYSTONE_MODIFIERS: WaystoneModifier[] = [
  // ===== PoE 2 Waystone Modifiers (Updated for 0.3) =====
  // Note: In PoE 2, waystones have different modifier pools than PoE 1 maps
  {
    id: 'increased_waystone_drops',
    name: 'Bountiful',
    description: '{0}% increased Waystone Drop Chance',
    type: 'prefix',
    tier: 1,
    weight: 100,
    values: { min: 15, max: 30 },
    effects: [{
      stat: WaystoneStat.INCREASED_WAYSTONE_DROPS,
      value: 22.5
    }],
    tags: ['waystone', 'sustain']
  },
  {
    id: 'increased_rarity',
    name: 'Valuable',
    description: '{0}% increased Rarity of Items found',
    type: 'prefix',
    tier: 1,
    weight: 100,
    values: { min: 20, max: 40 },
    effects: [{
      stat: WaystoneStat.INCREASED_RARITY,
      value: 30
    }],
    tags: ['rarity', 'reward']
  },
  {
    id: 'increased_pack_size',
    name: 'Dense',
    description: '{0}% increased Monster Pack Size',
    type: 'prefix',
    tier: 1,
    weight: 80,
    values: { min: 15, max: 35 },
    effects: [{
      stat: WaystoneStat.INCREASED_PACK_SIZE,
      value: 25
    }],
    tags: ['density', 'experience']
  },

  // ===== PoE 2 Specific Modifiers =====
  {
    id: 'rare_monsters',
    name: 'Dangerous',
    description: 'Contains {0} additional Rare Monsters',
    type: 'suffix',
    tier: 2,
    weight: 60,
    values: { min: 3, max: 8 },
    effects: [{
      stat: WaystoneStat.ADDITIONAL_RARE_MONSTERS,
      value: 5.5
    }],
    tags: ['monsters', 'difficulty']
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: '+{0} to Monster Level',
    type: 'suffix',
    tier: 3,
    weight: 40,
    values: { min: 1, max: 3 },
    effects: [{
      stat: WaystoneStat.MONSTER_LEVEL,
      value: 2
    }],
    tags: ['difficulty', 'experience']
  },

  // ===== Monster Modifiers (Dangerous) =====
  {
    id: 'savage',
    name: 'Savage',
    description: 'Monsters deal {0}% increased Damage',
    type: 'prefix',
    tier: 1,
    weight: 120,
    values: { min: 20, max: 40 },
    effects: [{
      stat: WaystoneStat.MONSTER_DAMAGE,
      value: 30
    }],
    tags: ['dangerous', 'monster']
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description: 'Monsters have {0}% increased Life',
    type: 'prefix',
    tier: 1,
    weight: 120,
    values: { min: 30, max: 60 },
    effects: [{
      stat: WaystoneStat.MONSTER_LIFE,
      value: 45
    }],
    tags: ['monster', 'tanky']
  },
  {
    id: 'fleet',
    name: 'Fleet',
    description: 'Monsters have {0}% increased Movement Speed',
    type: 'suffix',
    tier: 1,
    weight: 100,
    values: { min: 20, max: 35 },
    effects: [{
      stat: WaystoneStat.MONSTER_SPEED,
      value: 27.5
    }],
    tags: ['monster', 'speed']
  },

  // ===== League Mechanics =====
  {
    id: 'breaching',
    name: 'Breaching',
    description: 'Area contains {0} additional Breaches',
    type: 'suffix',
    tier: 3,
    weight: 20,
    values: { min: 1, max: 2 },
    effects: [{
      stat: WaystoneStat.BREACH,
      value: 1.5
    }],
    tags: ['league', 'breach', 'reward']
  },
  {
    id: 'otherworldly',
    name: 'Otherworldly',
    description: 'Slaying Enemies close together can attract monsters from Beyond',
    type: 'prefix',
    tier: 3,
    weight: 25,
    values: { min: 1, max: 1 },
    effects: [{
      stat: WaystoneStat.BEYOND,
      value: 1
    }],
    tags: ['league', 'beyond', 'dangerous']
  },
  {
    id: 'delirious',
    name: 'Delirious',
    description: 'Area has a {0}% chance to contain a Delirium Mirror',
    type: 'suffix',
    tier: 4,
    weight: 15,
    values: { min: 20, max: 40 },
    effects: [{
      stat: WaystoneStat.DELIRIUM,
      value: 30
    }],
    tags: ['league', 'delirium', 'reward']
  },
  {
    id: 'excavated',
    name: 'Excavated',
    description: 'Area contains an Expedition Encounter',
    type: 'suffix',
    tier: 3,
    weight: 20,
    values: { min: 1, max: 1 },
    effects: [{
      stat: WaystoneStat.EXPEDITION,
      value: 1
    }],
    tags: ['league', 'expedition', 'reward']
  },
  {
    id: 'ritualistic',
    name: 'Ritualistic',
    description: 'Area contains {0} Ritual Altars',
    type: 'suffix',
    tier: 3,
    weight: 20,
    values: { min: 1, max: 3 },
    effects: [{
      stat: WaystoneStat.RITUAL,
      value: 2
    }],
    tags: ['league', 'ritual', 'reward']
  },

  // ===== Additional Packs =====
  {
    id: 'multitudinous',
    name: 'Multitudinous',
    description: 'Area contains {0} additional Packs of Monsters',
    type: 'prefix',
    tier: 2,
    weight: 60,
    values: { min: 3, max: 6 },
    effects: [{
      stat: WaystoneStat.ADDITIONAL_PACKS,
      value: 4.5
    }],
    tags: ['density', 'monsters']
  },
  {
    id: 'antagonistic',
    name: 'Antagonistic',
    description: 'Area contains {0} additional Packs of Rare Monsters',
    type: 'prefix',
    tier: 3,
    weight: 40,
    values: { min: 1, max: 3 },
    effects: [{
      stat: WaystoneStat.ADDITIONAL_RARE_PACKS,
      value: 2
    }],
    tags: ['density', 'rare', 'dangerous']
  },

  // ===== Dangerous Modifiers =====
  {
    id: 'hexproof',
    name: 'Hexproof',
    description: 'Monsters cannot be Cursed',
    type: 'suffix',
    tier: 2,
    weight: 80,
    values: { min: 1, max: 1 },
    effects: [{
      stat: WaystoneStat.NO_LEECH,
      value: 0
    }],
    tags: ['dangerous', 'curse_immune']
  },
  {
    id: 'drought',
    name: 'of Drought',
    description: 'Players cannot Regenerate Life, Mana or Energy Shield',
    type: 'suffix',
    tier: 4,
    weight: 30,
    values: { min: 1, max: 1 },
    effects: [{
      stat: WaystoneStat.NO_REGENERATION,
      value: 1
    }],
    tags: ['dangerous', 'no_regen']
  },
  {
    id: 'smothering',
    name: 'of Smothering',
    description: 'Players have {0}% less Recovery Rate',
    type: 'suffix',
    tier: 3,
    weight: 50,
    values: { min: 40, max: 60 },
    effects: [{
      stat: WaystoneStat.REDUCED_RECOVERY,
      value: 50
    }],
    tags: ['dangerous', 'recovery']
  },
  {
    id: 'twinned',
    name: 'Twinned',
    description: 'Area contains two Unique Bosses',
    type: 'prefix',
    tier: 4,
    weight: 20,
    values: { min: 1, max: 1 },
    effects: [{
      stat: WaystoneStat.TWIN_BOSS,
      value: 1
    }],
    tags: ['dangerous', 'boss']
  },
  {
    id: 'overlords',
    name: 'Overlord\'s',
    description: 'Unique Boss deals {0}% increased Damage, has {1}% increased Life',
    type: 'prefix',
    tier: 3,
    weight: 40,
    values: { min: 25, max: 35 },
    effects: [
      {
        stat: WaystoneStat.BOSS_DAMAGE,
        value: 30
      },
      {
        stat: WaystoneStat.BOSS_LIFE,
        value: 30
      }
    ],
    tags: ['dangerous', 'boss']
  }
];

// ============== Currency Items ==============

export const WAYSTONE_CURRENCY: WaystoneCurrency[] = [
  // ===== Basic Currency =====
  {
    id: 'transmutation',
    name: 'Orb of Transmutation',
    effect: {
      type: CurrencyEffectType.UPGRADE_RARITY,
      upgradeRarity: 'magic',
      addModifierCount: 2
    },
    cost: 0.1,
    weight: 1000,
    maxApplications: 1
  },
  {
    id: 'augmentation',
    name: 'Orb of Augmentation',
    effect: {
      type: CurrencyEffectType.AUGMENT,
      addModifierCount: 1
    },
    cost: 0.2,
    weight: 800,
    maxApplications: 1
  },
  {
    id: 'alchemy',
    name: 'Orb of Alchemy',
    effect: {
      type: CurrencyEffectType.UPGRADE_RARITY,
      upgradeRarity: 'rare',
      addModifierCount: 4
    },
    cost: 2,
    weight: 200,
    maxApplications: 1
  },
  {
    id: 'chaos',
    name: 'Chaos Orb',
    effect: {
      type: CurrencyEffectType.REROLL_ALL,
      rerollValues: true
    },
    cost: 1,
    weight: 100,
    maxApplications: -1
  },
  {
    id: 'regal',
    name: 'Regal Orb',
    effect: {
      type: CurrencyEffectType.UPGRADE_RARITY,
      upgradeRarity: 'rare',
      addModifierCount: 1
    },
    cost: 3,
    weight: 50,
    requiredTier: 2,
    maxApplications: 1
  },
  {
    id: 'exalted',
    name: 'Exalted Orb',
    effect: {
      type: CurrencyEffectType.EXALT,
      addModifierCount: 1
    },
    cost: 150,
    weight: 1,
    requiredTier: 3,
    maxApplications: 2
  },
  {
    id: 'divine',
    name: 'Divine Orb',
    effect: {
      type: CurrencyEffectType.DIVINE,
      rerollValues: true
    },
    cost: 200,
    weight: 1,
    maxApplications: -1
  },
  {
    id: 'annul',
    name: 'Orb of Annulment',
    effect: {
      type: CurrencyEffectType.ANNUL,
      removeModifiers: ['random']
    },
    cost: 20,
    weight: 5,
    maxApplications: -1
  },
  {
    id: 'scouring',
    name: 'Orb of Scouring',
    effect: {
      type: CurrencyEffectType.SCOUR,
      removeModifiers: ['all']
    },
    cost: 1,
    weight: 100,
    maxApplications: 1
  },
  {
    id: 'blessed',
    name: 'Blessed Orb',
    effect: {
      type: CurrencyEffectType.BLESSED,
      rerollValues: true
    },
    cost: 3,
    weight: 50,
    maxApplications: -1
  },
  {
    id: 'vaal',
    name: 'Vaal Orb',
    effect: {
      type: CurrencyEffectType.CORRUPT,
      corruptItem: true
    },
    cost: 1,
    weight: 100,
    maxApplications: 1,
    tags: ['corruption', 'risky']
  },

  // ===== Quality Currency =====
  {
    id: 'chisel',
    name: 'Cartographer\'s Chisel',
    effect: {
      type: CurrencyEffectType.ADD_QUALITY,
      addQuality: 5
    },
    cost: 0.25,
    weight: 400,
    maxApplications: 4
  }
];

// ============== Optimization Presets ==============

export const WAYSTONE_PRESETS: WaystonePreset[] = [
  {
    id: 'max_experience',
    name: 'Maximum Experience',
    description: 'Optimize for fastest leveling with high monster density and experience bonuses',
    goal: {
      id: 'exp_goal',
      name: 'Experience Farming',
      description: 'Maximize experience gain per hour',
      priority: [
        { stat: WaystoneStat.INCREASED_EXPERIENCE, weight: 10 },
        { stat: WaystoneStat.INCREASED_PACK_SIZE, weight: 8 },
        { stat: WaystoneStat.ADDITIONAL_PACKS, weight: 7 },
        { stat: WaystoneStat.MONSTER_LEVEL, weight: 6 },
        { stat: WaystoneStat.ADDITIONAL_MAGIC_PACKS, weight: 5 }
      ],
      avoid: [
        WaystoneStat.NO_REGENERATION,
        WaystoneStat.REFLECTED_DAMAGE,
        WaystoneStat.TWIN_BOSS
      ],
      budgetLimit: 10,
      acceptableRisk: 'low'
    },
    recommendedLevel: 70,
    difficulty: 'beginner',
    profitability: 'low',
    timeInvestment: 'quick'
  },
  {
    id: 'max_loot',
    name: 'Maximum Loot',
    description: 'Optimize for item quantity and rarity with balanced risk',
    goal: {
      id: 'loot_goal',
      name: 'Loot Farming',
      description: 'Maximize valuable item drops',
      priority: [
        { stat: WaystoneStat.INCREASED_QUANTITY, weight: 10 },
        { stat: WaystoneStat.INCREASED_RARITY, weight: 8 },
        { stat: WaystoneStat.INCREASED_PACK_SIZE, weight: 6 },
        { stat: WaystoneStat.BREACH, weight: 5 },
        { stat: WaystoneStat.DELIRIUM, weight: 5 }
      ],
      avoid: [
        WaystoneStat.NO_REGENERATION,
        WaystoneStat.NO_LEECH
      ],
      budgetLimit: 20,
      acceptableRisk: 'medium'
    },
    recommendedLevel: 75,
    difficulty: 'intermediate',
    profitability: 'high',
    timeInvestment: 'moderate'
  },
  {
    id: 'currency_farm',
    name: 'Currency Farming',
    description: 'Focus on league mechanics that drop currency items',
    goal: {
      id: 'currency_goal',
      name: 'Currency Farming',
      description: 'Maximize currency drops per map',
      priority: [
        { stat: WaystoneStat.EXPEDITION, weight: 10 },
        { stat: WaystoneStat.RITUAL, weight: 8 },
        { stat: WaystoneStat.BREACH, weight: 7 },
        { stat: WaystoneStat.INCREASED_QUANTITY, weight: 6 },
        { stat: WaystoneStat.INCREASED_PACK_SIZE, weight: 5 }
      ],
      avoid: [
        WaystoneStat.REFLECTED_DAMAGE
      ],
      budgetLimit: 30,
      acceptableRisk: 'medium'
    },
    recommendedLevel: 80,
    difficulty: 'intermediate',
    profitability: 'very_high',
    timeInvestment: 'long'
  },
  {
    id: 'boss_rush',
    name: 'Boss Rush',
    description: 'Quick map completion focusing on boss kills for specific drops',
    goal: {
      id: 'boss_goal',
      name: 'Boss Farming',
      description: 'Fast boss kills for targeted drops',
      priority: [
        { stat: WaystoneStat.INCREASED_QUANTITY, weight: 8 },
        { stat: WaystoneStat.INCREASED_RARITY, weight: 10 }
      ],
      avoid: [
        WaystoneStat.TWIN_BOSS,
        WaystoneStat.BOSS_LIFE,
        WaystoneStat.BOSS_DAMAGE,
        WaystoneStat.ADDITIONAL_PACKS,
        WaystoneStat.INCREASED_PACK_SIZE
      ],
      budgetLimit: 5,
      acceptableRisk: 'low'
    },
    recommendedLevel: 75,
    difficulty: 'beginner',
    profitability: 'medium',
    timeInvestment: 'quick'
  },
  {
    id: 'juiced_maps',
    name: 'Fully Juiced Maps',
    description: 'Maximum investment for maximum returns - high risk, high reward',
    goal: {
      id: 'juiced_goal',
      name: 'Juiced Mapping',
      description: 'Maximum modifiers for maximum rewards',
      priority: [
        { stat: WaystoneStat.INCREASED_QUANTITY, weight: 10, minValue: 80 },
        { stat: WaystoneStat.INCREASED_RARITY, weight: 8, minValue: 60 },
        { stat: WaystoneStat.INCREASED_PACK_SIZE, weight: 9, minValue: 40 },
        { stat: WaystoneStat.BEYOND, weight: 7 },
        { stat: WaystoneStat.DELIRIUM, weight: 8 },
        { stat: WaystoneStat.BREACH, weight: 6 },
        { stat: WaystoneStat.EXPEDITION, weight: 6 },
        { stat: WaystoneStat.RITUAL, weight: 5 }
      ],
      avoid: [],
      budgetLimit: 100,
      acceptableRisk: 'high'
    },
    recommendedLevel: 85,
    recommendedGear: [
      'High-end defensive layers',
      'Instant recovery flasks',
      'Corrupted soul or similar defensive keystones'
    ],
    difficulty: 'expert',
    profitability: 'very_high',
    timeInvestment: 'long'
  }
];

// ============== Market Data (Default Values) ==============

export const DEFAULT_MARKET_DATA = {
  currencyPrices: new Map([
    ['transmutation', 0.1],
    ['augmentation', 0.2],
    ['alchemy', 2],
    ['chaos', 1],
    ['regal', 3],
    ['exalted', 150],
    ['divine', 200],
    ['annul', 20],
    ['scouring', 1],
    ['blessed', 3],
    ['vaal', 1],
    ['chisel', 0.25]
  ]),
  modifierValues: new Map([
    ['increased_quantity', 0.5], // Per 1% quantity
    ['increased_rarity', 0.2], // Per 1% rarity
    ['increased_pack_size', 0.3], // Per 1% pack size
    ['breach', 5], // Per breach
    ['expedition', 8], // Per expedition
    ['ritual', 4], // Per ritual
    ['delirium', 10] // Per delirium %
  ]),
  waystoneBasePrices: new Map([
    [1, 0.5],
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 5],
    [6, 8],
    [7, 12],
    [8, 18],
    [9, 25],
    [10, 35],
    [11, 50],
    [12, 70],
    [13, 100],
    [14, 150],
    [15, 200],
    [16, 300]
  ]),
  lastUpdated: new Date()
};