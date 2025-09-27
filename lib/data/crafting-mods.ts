/**
 * Path of Exile 2 Crafting Mods Database
 * Version 0.3 (The Third Edict)
 */

export interface CraftingMod {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  tier: number;
  requiredLevel: number;
  tags: string[];
  stat: string;
  values: {
    min: number;
    max: number;
  };
  weight: number;
}

// Weapon Prefixes
export const weaponPrefixes: CraftingMod[] = [
  {
    id: 'phys_dmg_t1',
    name: 'Tyrannical',
    type: 'prefix',
    tier: 1,
    requiredLevel: 83,
    tags: ['physical', 'damage'],
    stat: '% increased Physical Damage',
    values: { min: 150, max: 179 },
    weight: 50
  },
  {
    id: 'phys_dmg_t2',
    name: 'Merciless',
    type: 'prefix',
    tier: 2,
    requiredLevel: 73,
    tags: ['physical', 'damage'],
    stat: '% increased Physical Damage',
    values: { min: 120, max: 149 },
    weight: 100
  },
  {
    id: 'phys_dmg_t3',
    name: 'Bloodthirsty',
    type: 'prefix',
    tier: 3,
    requiredLevel: 64,
    tags: ['physical', 'damage'],
    stat: '% increased Physical Damage',
    values: { min: 90, max: 119 },
    weight: 200
  },
  {
    id: 'flat_phys_t1',
    name: 'Flaring',
    type: 'prefix',
    tier: 1,
    requiredLevel: 77,
    tags: ['physical', 'damage'],
    stat: 'Adds # to # Physical Damage',
    values: { min: 20, max: 35 },
    weight: 100
  },
  {
    id: 'ele_dmg_t1',
    name: 'Electrocuting',
    type: 'prefix',
    tier: 1,
    requiredLevel: 76,
    tags: ['elemental', 'lightning'],
    stat: 'Adds # to # Lightning Damage',
    values: { min: 15, max: 80 },
    weight: 150
  },
  {
    id: 'spell_dmg_t1',
    name: 'Runic',
    type: 'prefix',
    tier: 1,
    requiredLevel: 78,
    tags: ['spell', 'damage'],
    stat: '% increased Spell Damage',
    values: { min: 80, max: 99 },
    weight: 100
  }
];

// Weapon Suffixes
export const weaponSuffixes: CraftingMod[] = [
  {
    id: 'attack_speed_t1',
    name: 'of Celebration',
    type: 'suffix',
    tier: 1,
    requiredLevel: 77,
    tags: ['attack', 'speed'],
    stat: '% increased Attack Speed',
    values: { min: 25, max: 27 },
    weight: 50
  },
  {
    id: 'attack_speed_t2',
    name: 'of Fervor',
    type: 'suffix',
    tier: 2,
    requiredLevel: 60,
    tags: ['attack', 'speed'],
    stat: '% increased Attack Speed',
    values: { min: 20, max: 24 },
    weight: 150
  },
  {
    id: 'crit_chance_t1',
    name: 'of Penetrating',
    type: 'suffix',
    tier: 1,
    requiredLevel: 73,
    tags: ['critical'],
    stat: '% increased Critical Strike Chance',
    values: { min: 30, max: 35 },
    weight: 100
  },
  {
    id: 'crit_multi_t1',
    name: 'of Destruction',
    type: 'suffix',
    tier: 1,
    requiredLevel: 73,
    tags: ['critical'],
    stat: '% increased Critical Strike Multiplier',
    values: { min: 35, max: 40 },
    weight: 100
  },
  {
    id: 'accuracy_t1',
    name: 'of the Ranger',
    type: 'suffix',
    tier: 1,
    requiredLevel: 76,
    tags: ['attack', 'accuracy'],
    stat: '% increased Accuracy Rating',
    values: { min: 100, max: 120 },
    weight: 200
  }
];

// Armour Prefixes
export const armourPrefixes: CraftingMod[] = [
  {
    id: 'life_t1',
    name: 'Prime',
    type: 'prefix',
    tier: 1,
    requiredLevel: 86,
    tags: ['life'],
    stat: 'to maximum Life',
    values: { min: 100, max: 109 },
    weight: 50
  },
  {
    id: 'life_t2',
    name: 'Vigorous',
    type: 'prefix',
    tier: 2,
    requiredLevel: 73,
    tags: ['life'],
    stat: 'to maximum Life',
    values: { min: 80, max: 99 },
    weight: 100
  },
  {
    id: 'life_t3',
    name: 'Sanguine',
    type: 'prefix',
    tier: 3,
    requiredLevel: 64,
    tags: ['life'],
    stat: 'to maximum Life',
    values: { min: 60, max: 79 },
    weight: 200
  },
  {
    id: 'es_percent_t1',
    name: 'Resplendent',
    type: 'prefix',
    tier: 1,
    requiredLevel: 86,
    tags: ['energy_shield'],
    stat: '% increased Energy Shield',
    values: { min: 110, max: 132 },
    weight: 100
  },
  {
    id: 'armour_percent_t1',
    name: 'Impregnable',
    type: 'prefix',
    tier: 1,
    requiredLevel: 86,
    tags: ['armour'],
    stat: '% increased Armour',
    values: { min: 110, max: 132 },
    weight: 100
  },
  {
    id: 'evasion_percent_t1',
    name: 'Agile',
    type: 'prefix',
    tier: 1,
    requiredLevel: 86,
    tags: ['evasion'],
    stat: '% increased Evasion Rating',
    values: { min: 110, max: 132 },
    weight: 100
  }
];

// Armour Suffixes
export const armourSuffixes: CraftingMod[] = [
  {
    id: 'fire_res_t1',
    name: 'of the Phoenix',
    type: 'suffix',
    tier: 1,
    requiredLevel: 84,
    tags: ['resistance', 'fire'],
    stat: '% to Fire Resistance',
    values: { min: 42, max: 45 },
    weight: 100
  },
  {
    id: 'cold_res_t1',
    name: 'of the Yeti',
    type: 'suffix',
    tier: 1,
    requiredLevel: 84,
    tags: ['resistance', 'cold'],
    stat: '% to Cold Resistance',
    values: { min: 42, max: 45 },
    weight: 100
  },
  {
    id: 'lightning_res_t1',
    name: 'of the Storm',
    type: 'suffix',
    tier: 1,
    requiredLevel: 84,
    tags: ['resistance', 'lightning'],
    stat: '% to Lightning Resistance',
    values: { min: 42, max: 45 },
    weight: 100
  },
  {
    id: 'all_res_t1',
    name: 'of the Rainbow',
    type: 'suffix',
    tier: 1,
    requiredLevel: 81,
    tags: ['resistance'],
    stat: '% to all Elemental Resistances',
    values: { min: 13, max: 16 },
    weight: 50
  },
  {
    id: 'chaos_res_t1',
    name: 'of the Void',
    type: 'suffix',
    tier: 1,
    requiredLevel: 81,
    tags: ['resistance', 'chaos'],
    stat: '% to Chaos Resistance',
    values: { min: 28, max: 35 },
    weight: 50
  },
  {
    id: 'movement_speed_t1',
    name: 'of the Cheetah',
    type: 'suffix',
    tier: 1,
    requiredLevel: 86,
    tags: ['speed'],
    stat: '% increased Movement Speed',
    values: { min: 32, max: 35 },
    weight: 50
  },
  {
    id: 'str_t1',
    name: 'of the Titan',
    type: 'suffix',
    tier: 1,
    requiredLevel: 82,
    tags: ['attribute'],
    stat: 'to Strength',
    values: { min: 51, max: 55 },
    weight: 150
  },
  {
    id: 'dex_t1',
    name: 'of the Wind',
    type: 'suffix',
    tier: 1,
    requiredLevel: 82,
    tags: ['attribute'],
    stat: 'to Dexterity',
    values: { min: 51, max: 55 },
    weight: 150
  },
  {
    id: 'int_t1',
    name: 'of the Genius',
    type: 'suffix',
    tier: 1,
    requiredLevel: 82,
    tags: ['attribute'],
    stat: 'to Intelligence',
    values: { min: 51, max: 55 },
    weight: 150
  }
];

// Jewelry Mods
export const jewelryMods: CraftingMod[] = [
  {
    id: 'wed_t1',
    name: 'Devastating',
    type: 'prefix',
    tier: 1,
    requiredLevel: 81,
    tags: ['damage', 'elemental'],
    stat: '% increased Elemental Damage with Attack Skills',
    values: { min: 37, max: 42 },
    weight: 100
  },
  {
    id: 'life_regen_t1',
    name: 'Regenerating',
    type: 'prefix',
    tier: 1,
    requiredLevel: 78,
    tags: ['life', 'regeneration'],
    stat: 'Life Regenerated per second',
    values: { min: 6, max: 7 },
    weight: 150
  },
  {
    id: 'mana_regen_t1',
    name: 'Dynamo',
    type: 'suffix',
    tier: 1,
    requiredLevel: 79,
    tags: ['mana', 'regeneration'],
    stat: '% increased Mana Regeneration Rate',
    values: { min: 64, max: 69 },
    weight: 150
  },
  {
    id: 'cast_speed_t1',
    name: 'of Talent',
    type: 'suffix',
    tier: 1,
    requiredLevel: 79,
    tags: ['caster', 'speed'],
    stat: '% increased Cast Speed',
    values: { min: 13, max: 16 },
    weight: 100
  }
];

/**
 * Get applicable mods for an item type
 */
export function getModsForItem(itemType: string, modType: 'prefix' | 'suffix'): CraftingMod[] {
  if (itemType.includes('sword') || itemType.includes('axe') || itemType.includes('mace') ||
      itemType.includes('bow') || itemType.includes('staff') || itemType.includes('wand') ||
      itemType.includes('dagger') || itemType.includes('claw')) {
    return modType === 'prefix' ? weaponPrefixes : weaponSuffixes;
  }

  if (itemType.includes('body') || itemType.includes('helmet') || itemType.includes('gloves') ||
      itemType.includes('boots') || itemType.includes('shield')) {
    return modType === 'prefix' ? armourPrefixes : armourSuffixes;
  }

  if (itemType.includes('amulet') || itemType.includes('ring') || itemType.includes('belt')) {
    return jewelryMods.filter(mod => mod.type === modType);
  }

  return [];
}

/**
 * Roll a random mod from available pool
 */
export function rollRandomMod(
  itemType: string,
  modType: 'prefix' | 'suffix',
  itemLevel: number = 86
): CraftingMod | null {
  const availableMods = getModsForItem(itemType, modType)
    .filter(mod => mod.requiredLevel <= itemLevel);

  if (availableMods.length === 0) return null;

  // Weight-based selection
  const totalWeight = availableMods.reduce((sum, mod) => sum + mod.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const mod of availableMods) {
    roll -= mod.weight;
    if (roll <= 0) {
      return mod;
    }
  }

  return availableMods[0];
}

/**
 * Generate a random value within mod range
 */
export function rollModValue(mod: CraftingMod): string {
  const value = Math.floor(
    mod.values.min + Math.random() * (mod.values.max - mod.values.min + 1)
  );

  if (mod.stat.includes('#')) {
    // For mods with ranges like "Adds # to # Physical Damage"
    const minVal = Math.floor(value * 0.8);
    const maxVal = value;
    return `+${minVal} to ${maxVal} ${mod.stat.replace(/# to #/, '').trim()}`;
  }

  return `+${value}${mod.stat.startsWith('%') ? '' : ' '}${mod.stat}`;
}