// Path of Exile 2 Trade API Mod IDs
export const TRADE_MODS = {
  // Pseudo mods
  PSEUDO_TOTAL_LIFE: 'pseudo.pseudo_total_life',
  PSEUDO_TOTAL_ES: 'pseudo.pseudo_total_energy_shield',
  PSEUDO_TOTAL_MANA: 'pseudo.pseudo_total_mana',
  PSEUDO_MOVEMENT_SPEED: 'pseudo.pseudo_increased_movement_speed',
  PSEUDO_TOTAL_ELEMENTAL_RES: 'pseudo.pseudo_total_elemental_resistance',
  PSEUDO_TOTAL_RESISTANCE: 'pseudo.pseudo_total_resistance',
  PSEUDO_CAST_SPEED: 'pseudo.pseudo_total_cast_speed',
  PSEUDO_SPELL_DAMAGE: 'pseudo.pseudo_increased_spell_damage',
  PSEUDO_ATTACK_SPEED: 'pseudo.pseudo_total_attack_speed',
  PSEUDO_PHYSICAL_DAMAGE: 'pseudo.pseudo_increased_physical_damage',

  // Explicit mods
  RARITY: 'explicit.stat_3917489142',
  FIRE_RESISTANCE: 'explicit.stat_3372524247',
  COLD_RESISTANCE: 'explicit.stat_1671376347',
  LIGHTNING_RESISTANCE: 'explicit.stat_4220027924',
  CHAOS_RESISTANCE: 'explicit.stat_2923486259',
  MAXIMUM_LIFE: 'explicit.stat_3299347043',
  MAXIMUM_ES: 'explicit.stat_3489782002',
  MAXIMUM_MANA: 'explicit.stat_1050105434',
  MOVEMENT_SPEED: 'explicit.stat_2250533757',

  // Crafted mods
  CRAFTED_LIFE: 'crafted.stat_3299347043',
  CRAFTED_ES: 'crafted.stat_3489782002',
  CRAFTED_RESISTANCE: 'crafted.stat_2901986750',
} as const;

export type TradeModId = typeof TRADE_MODS[keyof typeof TRADE_MODS];

// Search query builders
export interface StatFilter {
  id: string;
  value?: {
    min?: number;
    max?: number;
  };
  disabled?: boolean;
}

export function buildStatFilter(modId: string, min?: number, max?: number): StatFilter {
  const filter: StatFilter = { id: modId };

  if (min !== undefined || max !== undefined) {
    filter.value = {};
    if (min !== undefined) filter.value.min = min;
    if (max !== undefined) filter.value.max = max;
  }

  return filter;
}

export function buildRarityGearQuery(
  slot: string,
  minRarity: number = 15,
  minRes: number = 60,
  minLife: number = 40,
  maxLevel: number = 76
) {
  const baseQuery = {
    query: {
      status: { option: "online" },
      stats: [
        {
          type: "and",
          filters: [
            buildStatFilter(TRADE_MODS.RARITY, minRarity),
            buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, minRes),
            buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, minLife)
          ]
        }
      ],
      filters: {
        type_filters: {
          filters: {
            category: { option: slot }
          }
        },
        req_filters: {
          filters: {
            lvl: { max: maxLevel }
          }
        }
      }
    },
    sort: { [TRADE_MODS.RARITY]: "desc" }
  };

  return baseQuery;
}

// Equipment slot categories for PoE2 Trade API
export const TRADE_CATEGORIES = {
  BOOTS: 'armour.boots',
  BODY: 'armour.chest',
  HELMET: 'armour.helmet',
  GLOVES: 'armour.gloves',
  BELT: 'accessory.belt',
  AMULET: 'accessory.amulet',
  RING: 'accessory.ring',
  WEAPON: 'weapon',
  SHIELD: 'armour.shield',
  QUIVER: 'armour.quiver',
} as const;