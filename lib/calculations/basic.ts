import type { CharacterStats, CharacterItem, ItemProperty } from '@/types/character';

/**
 * Basic calculation utilities for Path of Exile 2
 */

export interface DamageRange {
  min: number;
  max: number;
}

export interface ElementalDamage {
  fire: DamageRange;
  cold: DamageRange;
  lightning: DamageRange;
  chaos: DamageRange;
}

export interface AttackCalculation {
  physicalDamage: DamageRange;
  elementalDamage: ElementalDamage;
  totalDps: number;
  attacksPerSecond: number;
  criticalChance: number;
  criticalMultiplier: number;
  accuracy: number;
}

/**
 * Calculate the average of a damage range
 */
export function averageDamage(damage: DamageRange): number {
  return (damage.min + damage.max) / 2;
}

/**
 * Calculate DPS from damage and attack speed
 */
export function calculateDps(damage: DamageRange, attackSpeed: number): number {
  return averageDamage(damage) * attackSpeed;
}

/**
 * Calculate effective HP considering mitigation
 */
export function calculateEffectiveHp(
  life: number,
  energyShield: number,
  armour: number,
  evasion: number,
  resistances: { fire: number; cold: number; lightning: number; chaos: number }
): number {
  // Simplified calculation - in reality this is much more complex
  const baseEhp = life + energyShield;

  // Average elemental resistance mitigation
  const avgElementalResist = (resistances.fire + resistances.cold + resistances.lightning) / 3;
  const elementalMitigation = 1 / (1 - avgElementalResist / 100);

  // Simplified physical mitigation from armour (actual formula is more complex)
  const physicalMitigation = 1 + (armour / 10000);

  // Simplified evasion contribution (actual formula involves entropy)
  const evasionMitigation = 1 + (evasion / 20000);

  return baseEhp * elementalMitigation * physicalMitigation * evasionMitigation;
}

/**
 * Calculate critical strike chance with accuracy
 */
export function calculateCriticalChance(
  baseCrit: number,
  increasedCrit: number,
  accuracy: number
): number {
  // Crit chance is capped at 100%
  const critChance = Math.min(100, baseCrit * (1 + increasedCrit / 100));

  // Need to hit twice to crit (initial hit + crit confirmation)
  const hitChance = accuracy / 100;
  return critChance * hitChance * hitChance;
}

/**
 * Calculate mana reservation
 */
export function calculateManaReservation(
  maxMana: number,
  reservationPercentage: number,
  flatReservation: number = 0
): { reserved: number; unreserved: number } {
  const percentReserved = maxMana * (reservationPercentage / 100);
  const totalReserved = Math.min(maxMana, percentReserved + flatReservation);

  return {
    reserved: totalReserved,
    unreserved: maxMana - totalReserved
  };
}

/**
 * Parse item property values
 */
export function parseItemProperty(property: ItemProperty): number {
  if (!property.values || property.values.length === 0) {
    return 0;
  }

  const value = property.values[0][0];
  // Remove any formatting and parse the number
  const cleanValue = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleanValue) || 0;
}

/**
 * Calculate weapon DPS from item properties
 */
export function calculateWeaponDps(item: CharacterItem): number {
  if (!item.properties) {
    return 0;
  }

  let physicalDamage: DamageRange = { min: 0, max: 0 };
  let attackSpeed = 1.0;
  let elementalDamage = 0;

  for (const prop of item.properties) {
    if (prop.name === 'Physical Damage') {
      const damageStr = prop.values[0][0];
      const [min, max] = damageStr.split('-').map(v => parseInt(v) || 0);
      physicalDamage = { min, max };
    } else if (prop.name === 'Attacks per Second') {
      attackSpeed = parseItemProperty(prop);
    } else if (prop.name.includes('Damage')) {
      // Handle elemental damage
      const damageStr = prop.values[0][0];
      const [min, max] = damageStr.split('-').map(v => parseInt(v) || 0);
      elementalDamage += (min + max) / 2;
    }
  }

  const avgPhysDamage = averageDamage(physicalDamage);
  const totalDamage = avgPhysDamage + elementalDamage;

  return totalDamage * attackSpeed;
}

/**
 * Calculate total resistances from items
 */
export function calculateTotalResistances(items: CharacterItem[]): {
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
} {
  const resistances = {
    fire: 0,
    cold: 0,
    lightning: 0,
    chaos: 0
  };

  for (const item of items) {
    const mods = [...(item.explicitMods || []), ...(item.implicitMods || []), ...(item.craftedMods || [])];

    for (const mod of mods) {
      // Parse resistance mods
      const fireMatch = mod.match(/\+(\d+)% to Fire Resistance/);
      const coldMatch = mod.match(/\+(\d+)% to Cold Resistance/);
      const lightningMatch = mod.match(/\+(\d+)% to Lightning Resistance/);
      const chaosMatch = mod.match(/\+(\d+)% to Chaos Resistance/);
      const allResMatch = mod.match(/\+(\d+)% to all Elemental Resistances/);

      if (fireMatch) resistances.fire += parseInt(fireMatch[1]);
      if (coldMatch) resistances.cold += parseInt(coldMatch[1]);
      if (lightningMatch) resistances.lightning += parseInt(lightningMatch[1]);
      if (chaosMatch) resistances.chaos += parseInt(chaosMatch[1]);
      if (allResMatch) {
        const value = parseInt(allResMatch[1]);
        resistances.fire += value;
        resistances.cold += value;
        resistances.lightning += value;
      }
    }
  }

  // Apply resistance cap (75% default, can be increased)
  resistances.fire = Math.min(75, resistances.fire);
  resistances.cold = Math.min(75, resistances.cold);
  resistances.lightning = Math.min(75, resistances.lightning);
  // Chaos res is not capped at 75

  return resistances;
}

/**
 * Calculate experience required for next level
 */
export function calculateExperienceForLevel(level: number): number {
  // Simplified PoE experience formula
  if (level >= 100) return 0;

  const baseExp = [
    0, 525, 1760, 3781, 7184, 12186, 19324, 29377, 43181, 61693,
    85990, 117506, 157384, 207736, 269997, 346462, 439268, 551295,
    685171, 843709, 1030734, 1249629, 1504995, 1800847, 2142652,
    2535122, 2984677, 3496798, 4080655, 4742836, 5490247, 6334393,
    7283446, 8384398, 9541110, 10874351, 12361842, 14018289, 15859432,
    17905634, 20171471, 22679999, 25456123, 28517857, 31897771, 35621447,
    39721017, 44225461, 49176560, 54607467, 60565335, 67094245, 74247659,
    82075627, 90631041, 99984974, 110197515, 121340161, 133497202, 146749362,
    161191120, 176922628, 194049893, 212684946, 232956711, 255001620, 278952403,
    304972236, 333233648, 363906163, 397194041, 433312945, 472476370, 514937180,
    560961898, 610815862, 664824416, 723298169, 786612664, 855129128, 929261318,
    1009443795, 1096169525, 1189918242, 1291270350, 1400795257, 1519130326,
    1646943474, 1784977296, 1934009687, 2094900291, 2268549086, 2455921256,
    2658074992, 2876116901, 3111280300, 3364828162, 3638186694, 3932818530
  ];

  return baseExp[Math.min(level, baseExp.length - 1)];
}

/**
 * Calculate percentage to next level
 */
export function calculateLevelProgress(currentExp: number, currentLevel: number): number {
  const currentLevelExp = calculateExperienceForLevel(currentLevel);
  const nextLevelExp = calculateExperienceForLevel(currentLevel + 1);

  if (nextLevelExp === 0) return 100; // Max level

  const expIntoLevel = currentExp - currentLevelExp;
  const expNeeded = nextLevelExp - currentLevelExp;

  return Math.min(100, (expIntoLevel / expNeeded) * 100);
}