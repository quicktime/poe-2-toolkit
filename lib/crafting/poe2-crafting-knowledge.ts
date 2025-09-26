/**
 * Path of Exile 2 Comprehensive Crafting Knowledge Base
 * This contains ALL crafting methods, currencies, and techniques for PoE 2
 * Version: 0.3+ (Early Access)
 */

/**
 * PoE 2 Currency Types and Their Effects
 * IMPORTANT: In PoE 2, Chaos > Exalted in value!
 */
export const POE2_CURRENCIES = {
  // Basic Currencies
  'transmutation': {
    name: 'Orb of Transmutation',
    effect: 'Upgrades a normal item to magic with ONE random modifier',
    targetRarity: ['normal'],
    resultRarity: 'magic',
    modsAdded: 1,
    tier: 'basic'
  },
  'augmentation': {
    name: 'Orb of Augmentation',
    effect: 'Adds ONE additional modifier to a magic item (max 2 total)',
    targetRarity: ['magic'],
    resultRarity: 'magic',
    modsAdded: 1,
    requirements: { maxMods: 1 },
    tier: 'basic'
  },
  'alteration': {
    name: 'Orb of Alteration',
    effect: 'Rerolls ALL modifiers on a magic item',
    targetRarity: ['magic'],
    resultRarity: 'magic',
    modsChanged: 'all',
    tier: 'basic'
  },
  'regal': {
    name: 'Regal Orb',
    effect: 'Upgrades magic to rare, adding ONE modifier',
    targetRarity: ['magic'],
    resultRarity: 'rare',
    modsAdded: 1,
    tier: 'basic'
  },
  'alchemy': {
    name: 'Orb of Alchemy',
    effect: 'Upgrades normal to rare with EXACTLY 4 modifiers',
    targetRarity: ['normal'],
    resultRarity: 'rare',
    modsAdded: 4,
    tier: 'basic'
  },
  'chaos': {
    name: 'Chaos Orb',
    effect: 'Removes ONE random modifier and adds ONE new modifier',
    targetRarity: ['rare'],
    resultRarity: 'rare',
    modsChanged: 1,
    tier: 'valuable',
    note: 'PoE 2: Single mod swap, not full reroll!'
  },
  'exalted': {
    name: 'Exalted Orb',
    effect: 'Adds ONE modifier to a rare item (max 6)',
    targetRarity: ['rare'],
    resultRarity: 'rare',
    modsAdded: 1,
    requirements: { maxMods: 5 },
    tier: 'basic',
    note: 'Less valuable than Chaos in PoE 2!'
  },
  'divine': {
    name: 'Divine Orb',
    effect: 'Rerolls numeric values of all modifiers',
    targetRarity: ['magic', 'rare', 'unique'],
    resultRarity: 'same',
    modsChanged: 0,
    tier: 'premium'
  },
  'annulment': {
    name: 'Orb of Annulment',
    effect: 'Removes ONE random modifier',
    targetRarity: ['magic', 'rare'],
    resultRarity: 'same',
    modsRemoved: 1,
    tier: 'valuable'
  },
  'vaal': {
    name: 'Vaal Orb',
    effect: 'Corrupts item with unpredictable results',
    targetRarity: ['any'],
    resultRarity: 'corrupted',
    tier: 'risky'
  },

  // Tiered Currencies 
  // IMPORTANT: Based on POE2Scout data, value hierarchy is: Greater > Regular > Perfect
  // Perfect currencies are CHEAPER but guarantee T1-T2 mods
  // Greater currencies are MORE EXPENSIVE and provide better mods
  'transmutation_greater': {
    name: 'Greater Orb of Transmutation',
    effect: 'Upgrades normal to magic with higher tier modifiers',
    targetRarity: ['normal'],
    resultRarity: 'magic',
    modsAdded: 1,
    modTier: 'higher',
    tier: 'greater'
  },
  'transmutation_perfect': {
    name: 'Perfect Orb of Transmutation',
    effect: 'Upgrades normal to magic with T1-T2 modifiers',
    targetRarity: ['normal'],
    resultRarity: 'magic',
    modsAdded: 1,
    modTier: 'T1-T2',
    tier: 'perfect'
  },
  'augmentation_greater': {
    name: 'Greater Orb of Augmentation',
    effect: 'Adds higher tier modifier to magic item',
    targetRarity: ['magic'],
    resultRarity: 'magic',
    modsAdded: 1,
    modTier: 'higher',
    tier: 'greater'
  },
  'augmentation_perfect': {
    name: 'Perfect Orb of Augmentation',
    effect: 'Adds T1-T2 modifier to magic item',
    targetRarity: ['magic'],
    resultRarity: 'magic',
    modsAdded: 1,
    modTier: 'T1-T2',
    tier: 'perfect'
  },
  'alteration_greater': {
    name: 'Greater Orb of Alteration',
    effect: 'Rerolls magic item with higher tier modifiers',
    targetRarity: ['magic'],
    resultRarity: 'magic',
    modTier: 'higher',
    tier: 'greater'
  },
  'alteration_perfect': {
    name: 'Perfect Orb of Alteration',
    effect: 'Rerolls magic item with T1-T2 modifiers',
    targetRarity: ['magic'],
    resultRarity: 'magic',
    modTier: 'T1-T2',
    tier: 'perfect'
  },
  'regal_greater': {
    name: 'Greater Regal Orb',
    effect: 'Upgrades magic to rare with higher tier modifier',
    targetRarity: ['magic'],
    resultRarity: 'rare',
    modsAdded: 1,
    modTier: 'higher',
    tier: 'greater'
  },
  'regal_perfect': {
    name: 'Perfect Regal Orb',
    effect: 'Upgrades magic to rare with T1-T2 modifier',
    targetRarity: ['magic'],
    resultRarity: 'rare',
    modsAdded: 1,
    modTier: 'T1-T2',
    tier: 'perfect'
  },
  'alchemy_greater': {
    name: 'Greater Orb of Alchemy',
    effect: 'Upgrades normal to rare with 4 higher tier modifiers',
    targetRarity: ['normal'],
    resultRarity: 'rare',
    modsAdded: 4,
    modTier: 'higher',
    tier: 'greater'
  },
  'alchemy_perfect': {
    name: 'Perfect Orb of Alchemy',
    effect: 'Upgrades normal to rare with 4 T1-T2 modifiers',
    targetRarity: ['normal'],
    resultRarity: 'rare',
    modsAdded: 4,
    modTier: 'T1-T2',
    tier: 'perfect'
  },
  'chaos_greater': {
    name: 'Greater Chaos Orb',
    effect: 'Swaps one mod for a higher tier mod',
    targetRarity: ['rare'],
    resultRarity: 'rare',
    modsChanged: 1,
    modTier: 'higher',
    tier: 'greater'
  },
  'chaos_perfect': {
    name: 'Perfect Chaos Orb',
    effect: 'Swaps one mod for a T1-T2 mod',
    targetRarity: ['rare'],
    resultRarity: 'rare',
    modsChanged: 1,
    modTier: 'T1-T2',
    tier: 'perfect'
  },
  'exalted_greater': {
    name: 'Greater Exalted Orb',
    effect: 'Adds higher tier modifier to rare',
    targetRarity: ['rare'],
    resultRarity: 'rare',
    modsAdded: 1,
    modTier: 'higher',
    tier: 'greater'
  },
  'exalted_perfect': {
    name: 'Perfect Exalted Orb',
    effect: 'Adds T1-T2 modifier to rare',
    targetRarity: ['rare'],
    resultRarity: 'rare',
    modsAdded: 1,
    modTier: 'T1-T2',
    tier: 'perfect'
  }
};

/**
 * Essences - Guaranteed modifiers
 */
export const POE2_ESSENCES = {
  // Normal Essences
  'essence_greed': { guaranteedMod: 'Life', tier: 'normal' },
  'essence_contempt': { guaranteedMod: 'Weapon Physical Damage', tier: 'normal' },
  'essence_hatred': { guaranteedMod: 'Cold Damage', tier: 'normal' },
  'essence_woe': { guaranteedMod: 'Energy Shield', tier: 'normal' },
  'essence_fear': { guaranteedMod: 'Minion Damage', tier: 'normal' },
  'essence_anger': { guaranteedMod: 'Fire Damage', tier: 'normal' },
  'essence_torment': { guaranteedMod: 'Dexterity', tier: 'normal' },
  'essence_sorrow': { guaranteedMod: 'Chaos Damage', tier: 'normal' },
  'essence_rage': { guaranteedMod: 'Strength', tier: 'normal' },
  'essence_suffering': { guaranteedMod: 'Intelligence', tier: 'normal' },
  'essence_wrath': { guaranteedMod: 'Lightning Damage', tier: 'normal' },
  'essence_doubt': { guaranteedMod: 'Accuracy', tier: 'normal' },
  'essence_loathing': { guaranteedMod: 'Critical Strike Chance', tier: 'normal' },
  'essence_zeal': { guaranteedMod: 'Attack Speed', tier: 'normal' },
  'essence_anguish': { guaranteedMod: 'Cast Speed', tier: 'normal' },
  'essence_spite': { guaranteedMod: 'Critical Strike Multiplier', tier: 'normal' },
  
  // Greater Essences (higher tier guaranteed mod)
  'essence_greed_greater': { guaranteedMod: 'Life', tier: 'greater', modTier: 'T2-T3' },
  'essence_contempt_greater': { guaranteedMod: 'Weapon Physical Damage', tier: 'greater', modTier: 'T2-T3' },
  'essence_hatred_greater': { guaranteedMod: 'Cold Damage', tier: 'greater', modTier: 'T2-T3' },
  'essence_woe_greater': { guaranteedMod: 'Energy Shield', tier: 'greater', modTier: 'T2-T3' },
  'essence_fear_greater': { guaranteedMod: 'Minion Damage', tier: 'greater', modTier: 'T2-T3' },
  'essence_anger_greater': { guaranteedMod: 'Fire Damage', tier: 'greater', modTier: 'T2-T3' },
  'essence_wrath_greater': { guaranteedMod: 'Lightning Damage', tier: 'greater', modTier: 'T2-T3' },
  'essence_loathing_greater': { guaranteedMod: 'Critical Strike Chance', tier: 'greater', modTier: 'T2-T3' },
  'essence_zeal_greater': { guaranteedMod: 'Attack Speed', tier: 'greater', modTier: 'T2-T3' },
  'essence_spite_greater': { guaranteedMod: 'Critical Strike Multiplier', tier: 'greater', modTier: 'T2-T3' }
};

/**
 * Runes - Special crafting with Soul Cores
 */
export const POE2_RUNES = {
  'rune_of_ascension': {
    name: 'Rune of Ascension',
    effect: 'Increases item level by 1-5',
    cost: { soul_core_minor: 1 }
  },
  'rune_of_refinement': {
    name: 'Rune of Refinement',
    effect: 'Improves quality beyond 20%',
    cost: { soul_core_minor: 2 }
  },
  'rune_of_tempering': {
    name: 'Rune of Tempering',
    effect: 'Adds implicit modifier',
    cost: { soul_core_major: 1 }
  },
  'rune_of_enhancement': {
    name: 'Rune of Enhancement',
    effect: 'Enhances existing modifiers',
    cost: { soul_core_major: 2 }
  },
  'rune_of_genesis': {
    name: 'Rune of Genesis',
    effect: 'Rerolls item with lucky values',
    cost: { soul_core_prime: 1 }
  }
};

/**
 * Omens - Modify currency behavior
 */
export const POE2_OMENS = {
  'omen_of_prefixes': {
    name: 'Omen of Prefixes',
    effect: 'Next currency only affects prefixes',
    compatible: ['chaos', 'annulment', 'exalted']
  },
  'omen_of_suffixes': {
    name: 'Omen of Suffixes',
    effect: 'Next currency only affects suffixes',
    compatible: ['chaos', 'annulment', 'exalted']
  },
  'omen_of_duplication': {
    name: 'Omen of Duplication',
    effect: 'Next currency applies twice',
    compatible: ['exalted', 'annulment']
  },
  'omen_of_fortune': {
    name: 'Omen of Fortune',
    effect: 'Next currency has lucky outcomes',
    compatible: ['chaos', 'alchemy', 'alteration']
  },
  'omen_of_preservation': {
    name: 'Omen of Preservation',
    effect: 'Item cannot lose modifiers',
    compatible: ['chaos', 'annulment']
  },
  'omen_of_targeting': {
    name: 'Omen of Targeting',
    effect: 'Choose which modifier to affect',
    compatible: ['annulment', 'chaos']
  }
};

/**
 * Distilled Emotions - New PoE 2 system
 */
export const POE2_DISTILLED_EMOTIONS = {
  'distilled_ire': {
    name: 'Distilled Ire',
    effect: 'Adds fire-related modifier',
    modPool: 'fire'
  },
  'distilled_sorrow': {
    name: 'Distilled Sorrow',
    effect: 'Adds cold-related modifier',
    modPool: 'cold'
  },
  'distilled_envy': {
    name: 'Distilled Envy',
    effect: 'Adds chaos-related modifier',
    modPool: 'chaos'
  },
  'distilled_guilt': {
    name: 'Distilled Guilt',
    effect: 'Adds physical-related modifier',
    modPool: 'physical'
  },
  'distilled_paranoia': {
    name: 'Distilled Paranoia',
    effect: 'Adds defensive modifier',
    modPool: 'defensive'
  },
  'distilled_greed': {
    name: 'Distilled Greed',
    effect: 'Adds quantity/rarity modifier',
    modPool: 'quantity'
  }
};

/**
 * Crafting Methods/Routes
 */
export const POE2_CRAFTING_METHODS = {
  'white_base_premium': {
    name: 'White Base Premium Crafting',
    description: 'Start with valuable white item, use perfect currency',
    steps: [
      { currency: 'alchemy_perfect', description: 'Create rare with 4x T1-T2 mods' },
      { currency: 'chaos_perfect', description: 'Swap bad mods', repeat: true },
      { currency: 'exalted_perfect', description: 'Fill empty slots' }
    ],
    pros: ['High chance of T1 mods', 'Predictable outcomes'],
    cons: ['Requires white base (cannot create)', 'Expensive currency'],
    bestFor: ['End-game weapons', 'Critical items']
  },
  
  'essence_spam': {
    name: 'Essence Spamming',
    description: 'Use essences for guaranteed modifier',
    steps: [
      { currency: 'essence_*', description: 'Apply essence for guaranteed mod' },
      { currency: 'chaos', description: 'Fix other mods if needed' },
      { currency: 'exalted', description: 'Add missing mods' }
    ],
    pros: ['Guaranteed key modifier', 'Relatively cheap'],
    cons: ['Other mods are random', 'May need many attempts'],
    bestFor: ['Items needing specific mod', 'Budget crafting']
  },
  
  'omen_targeted': {
    name: 'Omen-Targeted Crafting',
    description: 'Use omens to precisely control modifications',
    steps: [
      { currency: 'alchemy', description: 'Create rare base' },
      { currency: 'omen_of_prefixes', description: 'Target prefixes' },
      { currency: 'chaos_perfect', description: 'Perfect the prefixes' },
      { currency: 'omen_of_suffixes', description: 'Target suffixes' },
      { currency: 'chaos_perfect', description: 'Perfect the suffixes' }
    ],
    pros: ['Precise control', 'Protects good mods'],
    cons: ['Requires multiple omens', 'Complex process'],
    bestFor: ['High-value crafts', 'Specific mod combinations']
  },
  
  'alteration_regal': {
    name: 'Alt-Regal Method',
    description: 'Classic method adapted for PoE 2',
    steps: [
      { currency: 'transmutation', description: 'Make magic' },
      { currency: 'alteration', description: 'Roll for 2 perfect mods', repeat: true },
      { currency: 'regal', description: 'Upgrade to rare' },
      { currency: 'exalted', description: 'Multimod or add mods' }
    ],
    pros: ['Control over initial mods', 'Lower currency tier'],
    cons: ['Limited to 2 guaranteed mods', 'Many alterations needed'],
    bestFor: ['Jewels', 'Specific 2-mod combinations']
  },
  
  'chaos_swap': {
    name: 'Chaos Swap Method',
    description: 'PoE 2 unique - swap single mods',
    steps: [
      { currency: 'alchemy', description: 'Create rare' },
      { currency: 'chaos', description: 'Swap bad mods one by one', repeat: true },
      { currency: 'divine', description: 'Perfect the values' }
    ],
    pros: ['Keeps good mods', 'Less RNG than PoE 1'],
    cons: ['Can still hit bad mods', 'Chaos is expensive in PoE 2'],
    bestFor: ['Incremental improvements', 'Items with some good mods']
  },
  
  'rune_soul_core': {
    name: 'Rune Enhancement',
    description: 'Use runes with soul cores for special effects',
    steps: [
      { currency: 'alchemy', description: 'Create rare base' },
      { currency: 'rune_of_tempering', description: 'Add implicit' },
      { currency: 'rune_of_enhancement', description: 'Enhance modifiers' },
      { currency: 'rune_of_genesis', description: 'Lucky reroll if needed' }
    ],
    pros: ['Unique enhancements', 'Can exceed normal limits'],
    cons: ['Requires soul cores', 'Limited availability'],
    bestFor: ['Pushing items beyond normal', 'Unique builds']
  }
};

/**
 * Modifier Tiers and Weights
 */
export const POE2_MOD_TIERS = {
  T1: { weight: 5, description: 'Highest tier, rarest' },
  T2: { weight: 10, description: 'Very high tier' },
  T3: { weight: 20, description: 'High tier' },
  T4: { weight: 35, description: 'Above average' },
  T5: { weight: 50, description: 'Average tier' },
  T6: { weight: 75, description: 'Below average' },
  T7: { weight: 100, description: 'Low tier' },
  T8: { weight: 150, description: 'Lowest tier, common' }
};

/**
 * Item Rarity Progression
 */
export const POE2_RARITY_PROGRESSION = {
  normal: { mods: 0, color: 'white' },
  magic: { mods: '1-2', color: 'blue' },
  rare: { mods: '3-6', color: 'yellow' },
  unique: { mods: 'fixed', color: 'orange' }
};

/**
 * Important PoE 2 Crafting Rules
 */
export const POE2_CRAFTING_RULES = [
  'White items CANNOT be created (no Scouring Orb exists)',
  'Chaos Orb only swaps ONE mod (not full reroll like PoE 1)',
  'Transmutation adds exactly ONE mod (not 1-2)',
  'Alchemy adds exactly FOUR mods (not 4-6)',
  'Perfect currency guarantees T1-T2 mods',
  'Greater currency guarantees higher tier than normal',
  'Omens modify how currency works',
  'Runes require Soul Cores to use',
  'Maximum 3 prefixes and 3 suffixes',
  'Corrupted items cannot be modified',
  'Chaos Orbs are MORE valuable than Exalted Orbs in PoE 2!'
];

/**
 * Export all knowledge for use in crafting algorithms
 */
export const POE2_CRAFTING_KNOWLEDGE = {
  currencies: POE2_CURRENCIES,
  essences: POE2_ESSENCES,
  runes: POE2_RUNES,
  omens: POE2_OMENS,
  distilledEmotions: POE2_DISTILLED_EMOTIONS,
  methods: POE2_CRAFTING_METHODS,
  modTiers: POE2_MOD_TIERS,
  rarityProgression: POE2_RARITY_PROGRESSION,
  rules: POE2_CRAFTING_RULES
};