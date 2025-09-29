/**
 * Path of Exile 2 Complete Modifier Database
 * Dynamic system for all item types and their possible modifiers
 */

export interface ModifierDefinition {
  id: string;
  name: string;
  type: 'prefix' | 'suffix' | 'implicit' | 'corrupted';
  tier: number;
  requiredLevel: number;
  tags: string[];
  weight: number; // How common this mod is
  values: {
    min: number;
    max: number;
  };
  group: string; // Mods in same group are mutually exclusive
  description?: string;
}

export interface ItemModPool {
  itemClass: string;
  itemTypes: string[];
  prefixes: ModifierDefinition[];
  suffixes: ModifierDefinition[];
  implicits: ModifierDefinition[];
  corruptedImplicits: ModifierDefinition[];
}

/**
 * WEAPON MODIFIER POOLS
 */
export const WEAPON_MOD_POOLS: ItemModPool[] = [
  {
    itemClass: 'wand',
    itemTypes: ['wand', 'imbued wand', 'convoking wand'],
    prefixes: [
      // Spell Gem Level Mods
      {
        id: 'SpellSkillGemLevel3',
        name: '+# to Level of all Spell Skills',
        type: 'prefix',
        tier: 1,
        requiredLevel: 80,
        tags: ['caster', 'gem'],
        weight: 25,
        values: { min: 1, max: 3 },
        group: 'AllSpellGems'
      },
      {
        id: 'FireSpellSkillGemLevel5',
        name: '+# to Level of all Fire Spell Skills',
        type: 'prefix',
        tier: 1,
        requiredLevel: 82,
        tags: ['caster', 'fire', 'gem'],
        weight: 20,
        values: { min: 3, max: 5 },
        group: 'FireSpellGems'
      },
      {
        id: 'ColdSpellSkillGemLevel5',
        name: '+# to Level of all Cold Spell Skills',
        type: 'prefix',
        tier: 1,
        requiredLevel: 82,
        tags: ['caster', 'cold', 'gem'],
        weight: 20,
        values: { min: 3, max: 5 },
        group: 'ColdSpellGems'
      },
      {
        id: 'LightningSpellSkillGemLevel5',
        name: '+# to Level of all Lightning Spell Skills',
        type: 'prefix',
        tier: 1,
        requiredLevel: 82,
        tags: ['caster', 'lightning', 'gem'],
        weight: 20,
        values: { min: 3, max: 5 },
        group: 'LightningSpellGems'
      },
      
      // "Gain as Extra" Damage Mods (PoE2 specific!)
      {
        id: 'GainPhysAsExtraPhys',
        name: 'Gain #% of Damage as Extra Physical Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 75,
        tags: ['damage', 'physical', 'caster'],
        weight: 100,
        values: { min: 15, max: 25 },
        group: 'PhysicalAddedAsPhysical'
      },
      {
        id: 'GainPhysAsExtraFire',
        name: 'Gain #% of Damage as Extra Fire Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 75,
        tags: ['damage', 'fire', 'elemental', 'caster'],
        weight: 100,
        values: { min: 20, max: 30 },
        group: 'PhysicalAddedAsFire'
      },
      {
        id: 'GainPhysAsExtraCold',
        name: 'Gain #% of Damage as Extra Cold Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 75,
        tags: ['damage', 'cold', 'elemental', 'caster'],
        weight: 100,
        values: { min: 20, max: 30 },
        group: 'PhysicalAddedAsCold'
      },
      {
        id: 'GainPhysAsExtraLightning',
        name: 'Gain #% of Damage as Extra Lightning Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 75,
        tags: ['damage', 'lightning', 'elemental', 'caster'],
        weight: 100,
        values: { min: 20, max: 30 },
        group: 'PhysicalAddedAsLightning'
      },
      {
        id: 'GainPhysAsExtraChaos',
        name: 'Gain #% of Elemental Damage as Extra Chaos Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 78,
        tags: ['damage', 'chaos', 'caster'],
        weight: 75,
        values: { min: 10, max: 15 },
        group: 'ElementalAddedAsChaos'
      },
      
      // Spell Damage Mods
      {
        id: 'SpellDamageT1',
        name: '#% increased Spell Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 78,
        tags: ['damage', 'spell', 'caster'],
        weight: 200,
        values: { min: 80, max: 99 },
        group: 'SpellDamage'
      },
      {
        id: 'SpellDamageT2',
        name: '#% increased Spell Damage',
        type: 'prefix',
        tier: 2,
        requiredLevel: 65,
        tags: ['damage', 'spell', 'caster'],
        weight: 400,
        values: { min: 60, max: 79 },
        group: 'SpellDamage'
      },
      {
        id: 'FireSpellDamage',
        name: '#% increased Fire Spell Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 76,
        tags: ['damage', 'fire', 'elemental', 'caster'],
        weight: 150,
        values: { min: 90, max: 120 },
        group: 'FireSpellDamage'
      },
      {
        id: 'ColdSpellDamage',
        name: '#% increased Cold Spell Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 76,
        tags: ['damage', 'cold', 'elemental', 'caster'],
        weight: 150,
        values: { min: 90, max: 120 },
        group: 'ColdSpellDamage'
      },
      {
        id: 'LightningSpellDamage',
        name: '#% increased Lightning Spell Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 76,
        tags: ['damage', 'lightning', 'elemental', 'caster'],
        weight: 150,
        values: { min: 90, max: 120 },
        group: 'LightningSpellDamage'
      },
      
      // Added Damage to Spells
      {
        id: 'AddedLightningToSpells',
        name: 'Adds # to # Lightning Damage to Spells',
        type: 'prefix',
        tier: 1,
        requiredLevel: 76,
        tags: ['damage', 'lightning', 'elemental', 'caster'],
        weight: 250,
        values: { min: 15, max: 80 },
        group: 'SpellAddedLightning'
      },
      {
        id: 'AddedFireToSpells',
        name: 'Adds # to # Fire Damage to Spells',
        type: 'prefix',
        tier: 1,
        requiredLevel: 76,
        tags: ['damage', 'fire', 'elemental', 'caster'],
        weight: 250,
        values: { min: 15, max: 80 },
        group: 'SpellAddedFire'
      },
      {
        id: 'AddedColdToSpells',
        name: 'Adds # to # Cold Damage to Spells',
        type: 'prefix',
        tier: 1,
        requiredLevel: 76,
        tags: ['damage', 'cold', 'elemental', 'caster'],
        weight: 250,
        values: { min: 15, max: 80 },
        group: 'SpellAddedCold'
      }
    ],
    suffixes: [
      // Cast Speed
      {
        id: 'CastSpeedT1',
        name: '#% increased Cast Speed',
        type: 'suffix',
        tier: 1,
        requiredLevel: 79,
        tags: ['caster', 'speed'],
        weight: 200,
        values: { min: 30, max: 35 },
        group: 'CastSpeed'
      },
      {
        id: 'CastSpeedT2',
        name: '#% increased Cast Speed',
        type: 'suffix',
        tier: 2,
        requiredLevel: 60,
        tags: ['caster', 'speed'],
        weight: 400,
        values: { min: 20, max: 29 },
        group: 'CastSpeed'
      },
      
      // Critical Strike Mods
      {
        id: 'SpellCritChance',
        name: '#% increased Critical Strike Chance for Spells',
        type: 'suffix',
        tier: 1,
        requiredLevel: 75,
        tags: ['caster', 'critical'],
        weight: 200,
        values: { min: 80, max: 100 },
        group: 'SpellCriticalChance'
      },
      {
        id: 'SpellCritDamageBonus',
        name: '#% increased Critical Spell Damage Bonus',
        type: 'suffix',
        tier: 1,
        requiredLevel: 76,
        tags: ['caster', 'critical', 'damage'],
        weight: 150,
        values: { min: 30, max: 40 },
        group: 'CriticalSpellDamageBonus'
      },
      {
        id: 'SpellCritMultiplier',
        name: '+#% to Critical Strike Multiplier for Spells',
        type: 'suffix',
        tier: 1,
        requiredLevel: 76,
        tags: ['caster', 'critical'],
        weight: 150,
        values: { min: 30, max: 40 },
        group: 'SpellCriticalMultiplier'
      },
      
      // Mana Mods
      {
        id: 'MaxMana',
        name: '+# to maximum Mana',
        type: 'suffix',
        tier: 1,
        requiredLevel: 68,
        tags: ['mana', 'resource'],
        weight: 400,
        values: { min: 80, max: 100 },
        group: 'Mana'
      },
      {
        id: 'ManaRegen',
        name: '#% increased Mana Regeneration Rate',
        type: 'suffix',
        tier: 1,
        requiredLevel: 60,
        tags: ['mana', 'resource'],
        weight: 300,
        values: { min: 50, max: 70 },
        group: 'ManaRegeneration'
      },
      
      // Elemental Penetration (PoE2)
      {
        id: 'ElementalPenetration',
        name: 'Spells have #% Elemental Penetration',
        type: 'suffix',
        tier: 1,
        requiredLevel: 80,
        tags: ['elemental', 'penetration'],
        weight: 50,
        values: { min: 8, max: 12 },
        group: 'ElementalPenetration'
      }
    ],
    implicits: [
      {
        id: 'WandSpellDamage',
        name: '#% increased Spell Damage',
        type: 'implicit',
        tier: 1,
        requiredLevel: 1,
        tags: ['damage', 'spell'],
        weight: 1000,
        values: { min: 10, max: 15 },
        group: 'ImplicitSpellDamage'
      }
    ],
    corruptedImplicits: [
      {
        id: 'GrantsSpellslinger',
        name: 'Grants Skill: Level # Spellslinger',
        type: 'corrupted',
        tier: 1,
        requiredLevel: 78,
        tags: ['skill', 'trigger'],
        weight: 50,
        values: { min: 15, max: 20 },
        group: 'GrantedSkill'
      },
      {
        id: 'CorruptedSpellDamage',
        name: '#% increased Spell Damage',
        type: 'corrupted',
        tier: 1,
        requiredLevel: 75,
        tags: ['damage', 'spell'],
        weight: 100,
        values: { min: 15, max: 25 },
        group: 'CorruptedSpellDamage'
      },
      {
        id: 'CorruptedCastSpeed',
        name: '#% increased Cast Speed',
        type: 'corrupted',
        tier: 1,
        requiredLevel: 75,
        tags: ['speed'],
        weight: 100,
        values: { min: 8, max: 12 },
        group: 'CorruptedCastSpeed'
      }
    ]
  },
  
  // Add more weapon types here...
  {
    itemClass: 'bow',
    itemTypes: ['bow', 'short bow', 'long bow', 'recurve bow'],
    prefixes: [
      {
        id: 'PhysicalDamagePercent',
        name: '#% increased Physical Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 77,
        tags: ['damage', 'physical', 'attack'],
        weight: 200,
        values: { min: 150, max: 179 },
        group: 'PhysicalDamagePercent'
      },
      {
        id: 'AddedPhysicalDamage',
        name: 'Adds # to # Physical Damage',
        type: 'prefix',
        tier: 1,
        requiredLevel: 77,
        tags: ['damage', 'physical', 'attack'],
        weight: 200,
        values: { min: 20, max: 40 },
        group: 'AddedPhysicalDamage'
      },
      {
        id: 'ElementalDamageWithAttacks',
        name: '#% increased Elemental Damage with Attack Skills',
        type: 'prefix',
        tier: 1,
        requiredLevel: 75,
        tags: ['damage', 'elemental', 'attack'],
        weight: 150,
        values: { min: 40, max: 50 },
        group: 'ElementalDamageWithAttacks'
      }
    ],
    suffixes: [
      {
        id: 'AttackSpeed',
        name: '#% increased Attack Speed',
        type: 'suffix',
        tier: 1,
        requiredLevel: 77,
        tags: ['attack', 'speed'],
        weight: 200,
        values: { min: 25, max: 27 },
        group: 'AttackSpeed'
      },
      {
        id: 'CriticalStrikeChance',
        name: '#% increased Critical Strike Chance',
        type: 'suffix',
        tier: 1,
        requiredLevel: 73,
        tags: ['critical', 'attack'],
        weight: 200,
        values: { min: 30, max: 35 },
        group: 'CriticalStrikeChance'
      },
      {
        id: 'ProjectileSpeed',
        name: '#% increased Projectile Speed',
        type: 'suffix',
        tier: 1,
        requiredLevel: 60,
        tags: ['projectile', 'speed'],
        weight: 300,
        values: { min: 20, max: 30 },
        group: 'ProjectileSpeed'
      }
    ],
    implicits: [],
    corruptedImplicits: []
  }
];

/**
 * ARMOR MODIFIER POOLS
 */
export const ARMOR_MOD_POOLS: ItemModPool[] = [
  {
    itemClass: 'body_armour',
    itemTypes: ['body armour', 'robe', 'vest', 'plate'],
    prefixes: [
      {
        id: 'LocalArmour',
        name: '#% increased Armour',
        type: 'prefix',
        tier: 1,
        requiredLevel: 72,
        tags: ['defense', 'armour'],
        weight: 200,
        values: { min: 100, max: 120 },
        group: 'LocalArmour'
      },
      {
        id: 'LocalEvasion',
        name: '#% increased Evasion Rating',
        type: 'prefix',
        tier: 1,
        requiredLevel: 72,
        tags: ['defense', 'evasion'],
        weight: 200,
        values: { min: 100, max: 120 },
        group: 'LocalEvasion'
      },
      {
        id: 'LocalEnergyShield',
        name: '#% increased Energy Shield',
        type: 'prefix',
        tier: 1,
        requiredLevel: 72,
        tags: ['defense', 'energy_shield'],
        weight: 200,
        values: { min: 100, max: 120 },
        group: 'LocalEnergyShield'
      },
      {
        id: 'FlatLife',
        name: '+# to maximum Life',
        type: 'prefix',
        tier: 1,
        requiredLevel: 73,
        tags: ['life'],
        weight: 200,
        values: { min: 90, max: 99 },
        group: 'Life'
      }
    ],
    suffixes: [
      {
        id: 'FireResistance',
        name: '+#% to Fire Resistance',
        type: 'suffix',
        tier: 1,
        requiredLevel: 72,
        tags: ['resistance', 'elemental'],
        weight: 200,
        values: { min: 42, max: 45 },
        group: 'FireResistance'
      },
      {
        id: 'ColdResistance',
        name: '+#% to Cold Resistance',
        type: 'suffix',
        tier: 1,
        requiredLevel: 72,
        tags: ['resistance', 'elemental'],
        weight: 200,
        values: { min: 42, max: 45 },
        group: 'ColdResistance'
      },
      {
        id: 'LightningResistance',
        name: '+#% to Lightning Resistance',
        type: 'suffix',
        tier: 1,
        requiredLevel: 72,
        tags: ['resistance', 'elemental'],
        weight: 200,
        values: { min: 42, max: 45 },
        group: 'LightningResistance'
      },
      {
        id: 'ChaosResistance',
        name: '+#% to Chaos Resistance',
        type: 'suffix',
        tier: 1,
        requiredLevel: 81,
        tags: ['resistance', 'chaos'],
        weight: 100,
        values: { min: 30, max: 35 },
        group: 'ChaosResistance'
      }
    ],
    implicits: [],
    corruptedImplicits: []
  }
];

/**
 * JEWELRY MODIFIER POOLS
 */
export const JEWELRY_MOD_POOLS: ItemModPool[] = [
  {
    itemClass: 'amulet',
    itemTypes: ['amulet', 'talisman'],
    prefixes: [
      {
        id: 'FlatLife',
        name: '+# to maximum Life',
        type: 'prefix',
        tier: 1,
        requiredLevel: 74,
        tags: ['life'],
        weight: 200,
        values: { min: 70, max: 79 },
        group: 'Life'
      },
      {
        id: 'FlatES',
        name: '+# to maximum Energy Shield',
        type: 'prefix',
        tier: 1,
        requiredLevel: 72,
        tags: ['defense', 'energy_shield'],
        weight: 200,
        values: { min: 45, max: 55 },
        group: 'EnergyShield'
      },
      {
        id: 'GlobalCritMultiplier',
        name: '+#% to Global Critical Strike Multiplier',
        type: 'prefix',
        tier: 1,
        requiredLevel: 75,
        tags: ['critical'],
        weight: 150,
        values: { min: 30, max: 35 },
        group: 'GlobalCriticalMultiplier'
      }
    ],
    suffixes: [
      {
        id: 'AllAttributes',
        name: '+# to all Attributes',
        type: 'suffix',
        tier: 1,
        requiredLevel: 72,
        tags: ['attribute'],
        weight: 200,
        values: { min: 30, max: 32 },
        group: 'AllAttributes'
      },
      {
        id: 'AllElementalResistances',
        name: '+#% to all Elemental Resistances',
        type: 'suffix',
        tier: 1,
        requiredLevel: 75,
        tags: ['resistance', 'elemental'],
        weight: 100,
        values: { min: 15, max: 16 },
        group: 'AllResistances'
      },
      {
        id: 'ItemRarity',
        name: '#% increased Rarity of Items found',
        type: 'suffix',
        tier: 1,
        requiredLevel: 62,
        tags: ['loot'],
        weight: 300,
        values: { min: 24, max: 28 },
        group: 'ItemRarity'
      }
    ],
    implicits: [],
    corruptedImplicits: []
  }
];

/**
 * Get all possible mods for an item type
 */
export function getModPoolForItem(itemType: string): ItemModPool | null {
  const normalizedType = itemType.toLowerCase();
  
  // Search all mod pools
  const allPools = [...WEAPON_MOD_POOLS, ...ARMOR_MOD_POOLS, ...JEWELRY_MOD_POOLS];
  
  for (const pool of allPools) {
    if (pool.itemTypes.some(type => normalizedType.includes(type))) {
      return pool;
    }
  }
  
  return null;
}

/**
 * Filter mods by tags and requirements
 */
export function filterMods(
  mods: ModifierDefinition[],
  filters: {
    tags?: string[];
    minTier?: number;
    maxTier?: number;
    minLevel?: number;
    maxLevel?: number;
  }
): ModifierDefinition[] {
  return mods.filter(mod => {
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => mod.tags.includes(tag))) {
        return false;
      }
    }
    
    if (filters.minTier && mod.tier > filters.minTier) return false;
    if (filters.maxTier && mod.tier < filters.maxTier) return false;
    if (filters.minLevel && mod.requiredLevel < filters.minLevel) return false;
    if (filters.maxLevel && mod.requiredLevel > filters.maxLevel) return false;
    
    return true;
  });
}

/**
 * Get mods by specific names (for user selection)
 */
export function getModsByNames(
  itemType: string,
  modNames: string[]
): ModifierDefinition[] {
  const pool = getModPoolForItem(itemType);
  if (!pool) return [];
  
  const allMods = [
    ...pool.prefixes,
    ...pool.suffixes,
    ...pool.implicits,
    ...pool.corruptedImplicits
  ];
  
  return allMods.filter(mod => 
    modNames.some(name => 
      mod.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(mod.name.toLowerCase())
    )
  );
}

/**
 * Check if a set of mods is craftable (respects mod groups)
 */
export function isModSetCraftable(mods: ModifierDefinition[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check prefix/suffix limits
  const prefixes = mods.filter(m => m.type === 'prefix');
  const suffixes = mods.filter(m => m.type === 'suffix');
  
  if (prefixes.length > 3) {
    errors.push(`Too many prefixes: ${prefixes.length}/3`);
  }
  if (suffixes.length > 3) {
    errors.push(`Too many suffixes: ${suffixes.length}/3`);
  }
  
  // Check for conflicting mod groups
  const groups = new Map<string, ModifierDefinition[]>();
  for (const mod of mods) {
    if (!groups.has(mod.group)) {
      groups.set(mod.group, []);
    }
    groups.get(mod.group)!.push(mod);
  }
  
  for (const [group, groupMods] of groups) {
    if (groupMods.length > 1) {
      errors.push(`Conflicting mods in group "${group}": ${groupMods.map(m => m.name).join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  WEAPON_MOD_POOLS,
  ARMOR_MOD_POOLS,
  JEWELRY_MOD_POOLS,
  getModPoolForItem,
  filterMods,
  getModsByNames,
  isModSetCraftable
};