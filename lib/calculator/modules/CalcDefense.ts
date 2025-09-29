/**
 * CalcDefense - Defensive calculation module
 * Handles EHP, resistances, mitigation, recovery, and defensive layers
 */

import { ModifierList } from '../ModifierList';

export interface DefenseInput {
  modifiers: ModifierList;
  level: number;
  class: string;
  config?: DefenseConfig;
}

export interface DefenseConfig {
  // Conditional defenses
  hasEnduranceCharges?: number;
  hasFrenzyCharges?: number;
  hasPowerCharges?: number;
  hasRageCount?: number;
  isStationary?: boolean;
  isMoving?: boolean;
  hasBeenHitRecently?: boolean;
  hasBlockedRecently?: boolean;
  isOnFullLife?: boolean;
  isOnLowLife?: boolean;
  isOnFullES?: boolean;
  // PoE2 specific
  honorStacks?: number;
  isDodging?: boolean;
  comboCounter?: number;
}

export interface DefenseOutput {
  // Life
  life: number;
  lifeRegen: number;
  lifeLeech: number;
  lifeRecoveryRate: number;
  
  // Mana
  mana: number;
  manaRegen: number;
  manaLeech: number;
  manaRecoveryRate: number;
  
  // Energy Shield
  energyShield: number;
  energyShieldRegen: number;
  energyShieldRecharge: number;
  energyShieldRecoveryRate: number;
  
  // PoE2 specific
  spirit: number;
  spiritReservation: number;
  availableSpirit: number;
  
  // Resistances
  resistances: ResistanceData;
  
  // Physical mitigation
  armour: number;
  physicalDamageReduction: number;
  
  // Avoidance
  evasion: number;
  evadeChance: number;
  dodge: number;
  dodgeEffectiveness: number; // PoE2
  
  // Block
  attackBlockChance: number;
  spellBlockChance: number;
  
  // Recovery
  totalRegen: number;
  totalLeech: number;
  netRecovery: number;
  
  // Effective HP
  effectiveHitPool: EffectiveHitPool;
  
  // Detailed breakdown
  breakdown: DefenseBreakdown;
}

export interface ResistanceData {
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
  // PoE2 specific
  honor: number;
  // Max resistances
  maxFire: number;
  maxCold: number;
  maxLightning: number;
  maxChaos: number;
}

export interface EffectiveHitPool {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
  elemental: number; // Average of fire/cold/lightning
  oneShot: number; // Minimum of all
}

export interface DefenseBreakdown {
  lifeBreakdown: ResourceBreakdown;
  manaBreakdown: ResourceBreakdown;
  energyShieldBreakdown: ResourceBreakdown;
  armourBreakdown: MitigationBreakdown;
  evasionBreakdown: MitigationBreakdown;
  blockBreakdown: BlockBreakdown;
  resistanceBreakdown: ResistanceBreakdown;
}

export interface ResourceBreakdown {
  base: number;
  flat: number;
  increased: number;
  more: number;
  final: number;
}

export interface MitigationBreakdown {
  base: number;
  flat: number;
  increased: number;
  more: number;
  final: number;
  effectiveReduction: number;
}

export interface BlockBreakdown {
  attackBase: number;
  attackFinal: number;
  spellBase: number;
  spellFinal: number;
}

export interface ResistanceBreakdown {
  [key: string]: {
    base: number;
    flat: number;
    increased: number;
    max: number;
    final: number;
  };
}

export class CalcDefense {
  private modifiers: ModifierList;
  private level: number;
  private class: string;
  private config: DefenseConfig;

  // PoE2-SPECIFIC base values per class (Patch 0.3)
  private readonly BASE_LIFE: Record<string, number> = {
    // PoE2 Classes Only
    warrior: 100,      // PoE2 Warrior (STR)
    titan: 110,        // PoE2 Warrior Ascendancy
    warbringer: 105,   // PoE2 Warrior Ascendancy
    ranger: 80,        // PoE2 Ranger (DEX)
    deadeye: 75,       // PoE2 Ranger Ascendancy
    pathfinder: 85,    // PoE2 Ranger Ascendancy
    monk: 90,          // PoE2 Monk (STR/INT)
    invoker: 85,       // PoE2 Monk Ascendancy
    acolyte: 95,       // PoE2 Monk Ascendancy
    witch: 70,         // PoE2 Witch (INT)
    bloodmage: 75,     // PoE2 Witch Ascendancy
    infernalist: 65,   // PoE2 Witch Ascendancy
    mercenary: 85,     // PoE2 Mercenary (STR/DEX)
    witchhunter: 90,   // PoE2 Mercenary Ascendancy
    gemling: 80,       // PoE2 Mercenary Ascendancy
    sorceress: 65,     // PoE2 Sorceress (INT/DEX)
    stormweaver: 60,   // PoE2 Sorceress Ascendancy
    chronomancer: 70,  // PoE2 Sorceress Ascendancy
    default: 80
  };

  private readonly BASE_MANA: Record<string, number> = {
    // PoE2 Classes Only
    warrior: 30,
    titan: 25,
    warbringer: 35,
    ranger: 40,
    deadeye: 45,
    pathfinder: 35,
    monk: 50,
    invoker: 60,
    acolyte: 40,
    witch: 70,
    bloodmage: 65,
    infernalist: 80,
    mercenary: 40,
    witchhunter: 35,
    gemling: 45,
    sorceress: 75,
    stormweaver: 85,
    chronomancer: 70,
    default: 40
  };

  private readonly BASE_SPIRIT: number = 100; // PoE2 base spirit for all classes

  // PoE2 scaling per level
  private readonly LIFE_PER_LEVEL: number = 10;  // PoE2 reduced from PoE1's 12
  private readonly MANA_PER_LEVEL: number = 4;   // PoE2 reduced from PoE1's 6
  private readonly EVASION_PER_LEVEL: number = 5; // PoE2 increased from PoE1's 3

  constructor(input: DefenseInput) {
    this.modifiers = input.modifiers;
    this.level = input.level;
    this.class = input.class.toLowerCase();
    this.config = input.config || {};
  }

  /**
   * Main calculation entry point
   */
  calculate(): DefenseOutput {
    // Calculate life
    const life = this.calculateLife();
    const lifeRegen = this.calculateLifeRegen(life);
    const lifeLeech = this.calculateLifeLeech();
    const lifeRecoveryRate = this.calculateRecoveryRate('life');
    
    // Calculate mana
    const mana = this.calculateMana();
    const manaRegen = this.calculateManaRegen(mana);
    const manaLeech = this.calculateManaLeech();
    const manaRecoveryRate = this.calculateRecoveryRate('mana');
    
    // Calculate energy shield
    const energyShield = this.calculateEnergyShield();
    const energyShieldRegen = this.calculateESRegen(energyShield);
    const energyShieldRecharge = this.calculateESRecharge(energyShield);
    const energyShieldRecoveryRate = this.calculateRecoveryRate('energy_shield');
    
    // Calculate spirit (PoE2)
    const spirit = this.calculateSpirit();
    const spiritReservation = this.calculateSpiritReservation();
    
    // Calculate resistances
    const resistances = this.calculateResistances();
    
    // Calculate physical mitigation
    const armour = this.calculateArmour();
    const physicalDamageReduction = this.calculatePhysicalReduction(armour);
    
    // Calculate avoidance
    const evasion = this.calculateEvasion();
    const evadeChance = this.calculateEvadeChance(evasion);
    const dodge = this.calculateDodge();
    const dodgeEffectiveness = this.calculateDodgeEffectiveness();
    
    // Calculate block
    const { attackBlock, spellBlock } = this.calculateBlock();
    
    // Calculate total recovery
    const totalRegen = lifeRegen + manaRegen + energyShieldRegen;
    const totalLeech = lifeLeech + manaLeech;
    const netRecovery = totalRegen + totalLeech;
    
    // Calculate effective hit pool
    const totalHP = life + energyShield;
    const effectiveHitPool = this.calculateEffectiveHitPool(totalHP, resistances, physicalDamageReduction);
    
    // Generate detailed breakdown
    const breakdown = this.generateBreakdown();
    
    return {
      life,
      lifeRegen,
      lifeLeech,
      lifeRecoveryRate,
      mana,
      manaRegen,
      manaLeech,
      manaRecoveryRate,
      energyShield,
      energyShieldRegen,
      energyShieldRecharge,
      energyShieldRecoveryRate,
      spirit,
      spiritReservation,
      availableSpirit: spirit - spiritReservation,
      resistances,
      armour,
      physicalDamageReduction,
      evasion,
      evadeChance,
      dodge,
      dodgeEffectiveness,
      attackBlockChance: attackBlock,
      spellBlockChance: spellBlock,
      totalRegen,
      totalLeech,
      netRecovery,
      effectiveHitPool,
      breakdown
    };
  }

  /**
   * Calculate maximum life
   */
  private calculateLife(): number {
    // Base life from class
    const baseLife = this.BASE_LIFE[this.class] || this.BASE_LIFE.default;
    
    // Life from level
    const levelLife = this.level * this.LIFE_PER_LEVEL;
    
    // Flat added life
    const flatLife = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'life' });
    
    // Strength bonus (2 life per strength)
    const strengthLife = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'strength' }) * 2;
    
    // Total base
    const totalBase = baseLife + levelLife + flatLife + strengthLife;
    
    // Increased modifiers
    const increasedLife = this.modifiers.sum('INC', { type: 'resource', subtype: 'life' });
    
    // More modifiers
    const moreLife = this.modifiers.more({ type: 'resource', subtype: 'life' });
    
    // Final calculation
    return Math.floor(totalBase * (1 + increasedLife / 100) * moreLife);
  }

  /**
   * Calculate maximum mana
   */
  private calculateMana(): number {
    // Base mana from class
    const baseMana = this.BASE_MANA[this.class] || this.BASE_MANA.default;
    
    // Mana from level
    const levelMana = this.level * this.MANA_PER_LEVEL;
    
    // Flat added mana
    const flatMana = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'mana' });
    
    // Intelligence bonus (2 mana per intelligence)
    const intelligenceMana = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'intelligence' }) * 2;
    
    // Total base
    const totalBase = baseMana + levelMana + flatMana + intelligenceMana;
    
    // Increased modifiers
    const increasedMana = this.modifiers.sum('INC', { type: 'resource', subtype: 'mana' });
    
    // More modifiers
    const moreMana = this.modifiers.more({ type: 'resource', subtype: 'mana' });
    
    // PoE2 doesn't have Eldritch Battery in the same way
    // Instead, it has different mana mechanics with spirit
    
    // Final calculation
    return Math.floor(totalBase * (1 + increasedMana / 100) * moreMana);
  }

  /**
   * Calculate energy shield
   */
  private calculateEnergyShield(): number {
    // Base ES from gear
    const baseES = this.modifiers.sum('BASE', { type: 'defense', subtype: 'energy_shield' });
    
    // Flat added ES
    const flatES = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'energy_shield' });
    
    // Intelligence bonus (2% increased ES per 5 intelligence)
    const intelligence = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'intelligence' });
    const intBonus = Math.floor(intelligence / 5) * 2;
    
    // Total base
    const totalBase = baseES + flatES;
    
    // Increased modifiers
    const increasedES = this.modifiers.sum('INC', { type: 'defense', subtype: 'energy_shield' }) + intBonus;
    
    // More modifiers
    const moreES = this.modifiers.more({ type: 'defense', subtype: 'energy_shield' });
    
    // PoE2 doesn't have Chaos Inoculation
    // Energy Shield works differently with new defensive layers
    
    // Final calculation
    return Math.floor(totalBase * (1 + increasedES / 100) * moreES);
  }

  /**
   * Calculate spirit (PoE2 specific)
   */
  private calculateSpirit(): number {
    // Base spirit
    const baseSpirit = this.BASE_SPIRIT;
    
    // Flat added spirit
    const flatSpirit = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'spirit' });
    
    // Total base
    const totalBase = baseSpirit + flatSpirit;
    
    // Increased modifiers
    const increasedSpirit = this.modifiers.sum('INC', { type: 'resource', subtype: 'spirit' });
    
    // More modifiers
    const moreSpirit = this.modifiers.more({ type: 'resource', subtype: 'spirit' });
    
    // Final calculation
    return Math.floor(totalBase * (1 + increasedSpirit / 100) * moreSpirit);
  }

  /**
   * Calculate spirit reservation
   */
  private calculateSpiritReservation(): number {
    // This would calculate based on active auras and persistent effects
    // For now, return a percentage of total spirit
    const reservationPercent = this.modifiers.sum('RESERVED', { type: 'resource', subtype: 'spirit' });
    const spirit = this.calculateSpirit();
    
    // Efficiency modifiers
    const efficiency = this.modifiers.sum('INC', { type: 'resource', subtype: 'spirit_efficiency' });
    const effectiveReservation = reservationPercent / (1 + efficiency / 100);
    
    return Math.floor(spirit * (effectiveReservation / 100));
  }

  /**
   * Calculate resistances including PoE2 honor resistance
   */
  private calculateResistances(): ResistanceData {
    // Base resistances (usually from difficulty penalty)
    const baseFire = -30; // PoE2 campaign penalty
    const baseCold = -30;
    const baseLightning = -30;
    const baseChaos = -30;
    const baseHonor = 0; // No base penalty for honor
    
    // Flat added resistances
    const flatFire = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'fire_resistance' });
    const flatCold = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'cold_resistance' });
    const flatLightning = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'lightning_resistance' });
    const flatChaos = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'chaos_resistance' });
    const flatHonor = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'honor_resistance' });
    
    // Maximum resistances (base 75%)
    const maxFire = 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_fire_resistance' });
    const maxCold = 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_cold_resistance' });
    const maxLightning = 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_lightning_resistance' });
    const maxChaos = 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_chaos_resistance' });
    
    // Check for Chaos Inoculation (immune to chaos)
    const chaosImmune = this.modifiers.flag('chaos_inoculation');
    
    return {
      fire: Math.min(maxFire, baseFire + flatFire),
      cold: Math.min(maxCold, baseCold + flatCold),
      lightning: Math.min(maxLightning, baseLightning + flatLightning),
      chaos: chaosImmune ? 100 : Math.min(maxChaos, baseChaos + flatChaos),
      honor: baseHonor + flatHonor, // Honor might not have a cap
      maxFire,
      maxCold,
      maxLightning,
      maxChaos
    };
  }

  /**
   * Calculate armour
   */
  private calculateArmour(): number {
    // Base armour from gear
    const baseArmour = this.modifiers.sum('BASE', { type: 'defense', subtype: 'armour' });
    
    // Flat added armour
    const flatArmour = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'armour' });
    
    // Strength bonus (2 armour per strength)
    const strengthArmour = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'strength' }) * 2;
    
    // Total base
    const totalBase = baseArmour + flatArmour + strengthArmour;
    
    // Increased modifiers
    const increasedArmour = this.modifiers.sum('INC', { type: 'defense', subtype: 'armour' });
    
    // More modifiers
    const moreArmour = this.modifiers.more({ type: 'defense', subtype: 'armour' });
    
    // Endurance charge bonus (4% physical damage reduction per charge)
    const enduranceBonus = (this.config.hasEnduranceCharges || 0) * 4;
    
    // Final calculation
    return Math.floor(totalBase * (1 + (increasedArmour + enduranceBonus) / 100) * moreArmour);
  }

  /**
   * Calculate physical damage reduction - PoE2 Armor System
   * PoE2 uses flat damage reduction instead of percentage-based
   */
  private calculatePhysicalReduction(armour: number): number {
    // PoE2 armor provides flat physical damage reduction
    // Each point of armor reduces physical damage by a flat amount
    // Formula: Flat Reduction = Armour / 10
    const flatReduction = armour / 10;
    
    // PoE2 endurance charges provide 5% physical damage reduction each
    const enduranceReduction = (this.config.hasEnduranceCharges || 0) * 5;
    
    // Convert to percentage for display (based on expected hit size)
    // PoE2 uses enemy level to determine expected damage
    const expectedHit = this.level * 20; // PoE2 expected hit damage
    const percentReduction = (flatReduction / expectedHit) * 100;
    
    // Add endurance charge reduction
    const totalReduction = percentReduction + enduranceReduction;
    
    // PoE2 caps physical damage reduction at 75%
    return Math.min(75, totalReduction);
  }

  /**
   * Calculate evasion rating
   */
  private calculateEvasion(): number {
    // Base evasion from gear
    const baseEvasion = this.modifiers.sum('BASE', { type: 'defense', subtype: 'evasion' });
    
    // Flat added evasion
    const flatEvasion = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'evasion' });
    
    // Dexterity bonus (2 evasion per dexterity)
    const dexterityEvasion = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'dexterity' }) * 2;
    
    // Level bonus
    const levelEvasion = this.level * this.EVASION_PER_LEVEL;
    
    // Total base
    const totalBase = baseEvasion + flatEvasion + dexterityEvasion + levelEvasion;
    
    // Increased modifiers
    const increasedEvasion = this.modifiers.sum('INC', { type: 'defense', subtype: 'evasion' });
    
    // More modifiers
    const moreEvasion = this.modifiers.more({ type: 'defense', subtype: 'evasion' });
    
    // Final calculation
    return Math.floor(totalBase * (1 + increasedEvasion / 100) * moreEvasion);
  }

  /**
   * Calculate evade chance
   */
  private calculateEvadeChance(evasion: number): number {
    // Assuming enemy accuracy equal to player level * 50
    const enemyAccuracy = this.level * 50;
    
    // PoE2 evasion formula
    const evadeChance = 100 - (enemyAccuracy / (enemyAccuracy + evasion) * 100);
    
    // Cap between 5% and 95%
    return Math.min(95, Math.max(5, evadeChance));
  }

  /**
   * Calculate dodge roll distance - PoE2 Dodge Roll System
   * PoE2 doesn't have dodge chance, instead has dodge roll mechanics
   */
  private calculateDodge(): number {
    // PoE2 dodge roll is an active ability with invincibility frames
    // Base dodge roll distance in units
    const baseDodgeDistance = 15; // PoE2 base dodge distance
    
    // Movement speed affects dodge roll distance
    const movementSpeed = this.modifiers.sum('INC', { type: 'speed', subtype: 'movement' });
    const dodgeDistance = baseDodgeDistance * (1 + movementSpeed / 100);
    
    // Return dodge roll effectiveness as a percentage
    // Higher distance = more effective dodging
    return Math.min(100, (dodgeDistance / baseDodgeDistance) * 100);
  }

  /**
   * Calculate dodge roll invincibility frames - PoE2 Specific
   */
  private calculateDodgeEffectiveness(): number {
    // Base invincibility frames during dodge roll (in milliseconds)
    const baseIFrames = 400; // 0.4 seconds base
    
    // Increased dodge roll effectiveness extends i-frames
    const increasedEffectiveness = this.modifiers.sum('INC', { type: 'defense', subtype: 'dodge_effectiveness' });
    
    // Dexterity provides dodge roll bonuses (1% per 10 dex)
    const dexterity = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'dexterity' });
    const dexBonus = Math.floor(dexterity / 10);
    
    // Calculate total i-frames
    const totalIFrames = baseIFrames * (1 + (increasedEffectiveness + dexBonus) / 100);
    
    // Return as effectiveness percentage (more i-frames = more effective)
    return Math.min(200, (totalIFrames / baseIFrames) * 100);
  }

  /**
   * Calculate block chances
   */
  private calculateBlock(): { attackBlock: number; spellBlock: number } {
    // Base block from shield
    const baseAttackBlock = this.modifiers.sum('BASE', { type: 'defense', subtype: 'attack_block' });
    const baseSpellBlock = this.modifiers.sum('BASE', { type: 'defense', subtype: 'spell_block' });
    
    // Added block
    const addedAttackBlock = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'attack_block' });
    const addedSpellBlock = this.modifiers.sum('ADDED', { type: 'defense', subtype: 'spell_block' });
    
    // Check for Glancing Blows (doubles block chance but half damage)
    const glancingBlows = this.modifiers.flag('glancing_blows') ? 2 : 1;
    
    // Cap at 75% (or higher with investment)
    const maxBlock = 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_block' });
    
    return {
      attackBlock: Math.min(maxBlock, (baseAttackBlock + addedAttackBlock) * glancingBlows),
      spellBlock: Math.min(maxBlock, (baseSpellBlock + addedSpellBlock) * glancingBlows)
    };
  }

  /**
   * Calculate life regeneration
   */
  private calculateLifeRegen(maxLife: number): number {
    // Flat regen
    const flatRegen = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'life_regen_flat' });
    
    // Percentage regen
    const percentRegen = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'life_regen_percent' });
    
    // Vitality aura or similar effects
    const vitalityRegen = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'vitality_regen' });
    
    // Total regen per second
    return flatRegen + (maxLife * (percentRegen + vitalityRegen) / 100);
  }

  /**
   * Calculate mana regeneration
   */
  private calculateManaRegen(maxMana: number): number {
    // Base mana regen (1.8% per second)
    const baseRegenPercent = 1.8;
    
    // Increased mana regeneration rate
    const increasedRegen = this.modifiers.sum('INC', { type: 'resource', subtype: 'mana_regen_rate' });
    
    // Flat regen
    const flatRegen = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'mana_regen_flat' });
    
    // Total regen per second
    const percentRegen = baseRegenPercent * (1 + increasedRegen / 100);
    return flatRegen + (maxMana * percentRegen / 100);
  }

  /**
   * Calculate energy shield regeneration
   */
  private calculateESRegen(maxES: number): number {
    // ES regen (usually from Zealot's Oath or similar)
    const percentRegen = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'es_regen_percent' });
    return maxES * percentRegen / 100;
  }

  /**
   * Calculate energy shield recharge
   */
  private calculateESRecharge(maxES: number): number {
    // Base recharge rate (20% per second after delay)
    const baseRechargeRate = 20;
    
    // Increased recharge rate
    const increasedRecharge = this.modifiers.sum('INC', { type: 'resource', subtype: 'es_recharge_rate' });
    
    // Faster start of recharge
    const fasterStart = this.modifiers.sum('INC', { type: 'resource', subtype: 'es_recharge_start' });
    
    // Total recharge per second (when active)
    const rechargeRate = baseRechargeRate * (1 + increasedRecharge / 100);
    return maxES * rechargeRate / 100;
  }

  /**
   * Calculate life leech
   */
  private calculateLifeLeech(): number {
    // This would need actual damage output to calculate
    // For now, return maximum leech rate
    const maxLeechRate = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'max_life_leech_rate' }) || 20;
    return maxLeechRate; // Placeholder
  }

  /**
   * Calculate mana leech
   */
  private calculateManaLeech(): number {
    // This would need actual damage output to calculate
    // For now, return maximum leech rate
    const maxLeechRate = this.modifiers.sum('ADDED', { type: 'resource', subtype: 'max_mana_leech_rate' }) || 20;
    return maxLeechRate; // Placeholder
  }

  /**
   * Calculate recovery rate modifier
   */
  private calculateRecoveryRate(type: string): number {
    const baseRate = 100;
    const increased = this.modifiers.sum('INC', { type: 'resource', subtype: `${type}_recovery_rate` });
    return baseRate * (1 + increased / 100);
  }

  /**
   * Calculate effective hit pool against different damage types
   */
  private calculateEffectiveHitPool(
    totalHP: number, 
    resistances: ResistanceData,
    physicalReduction: number
  ): EffectiveHitPool {
    // Physical EHP
    const physicalEHP = totalHP / (1 - physicalReduction / 100);
    
    // Elemental EHP
    const fireEHP = totalHP / (1 - resistances.fire / 100);
    const coldEHP = totalHP / (1 - resistances.cold / 100);
    const lightningEHP = totalHP / (1 - resistances.lightning / 100);
    
    // Chaos EHP
    const chaosEHP = resistances.chaos === 100 ? Infinity : totalHP / (1 - resistances.chaos / 100);
    
    // Average elemental
    const elementalEHP = (fireEHP + coldEHP + lightningEHP) / 3;
    
    // One-shot pool (worst case)
    const oneShot = Math.min(physicalEHP, fireEHP, coldEHP, lightningEHP, chaosEHP === Infinity ? physicalEHP : chaosEHP);
    
    return {
      physical: physicalEHP,
      fire: fireEHP,
      cold: coldEHP,
      lightning: lightningEHP,
      chaos: chaosEHP,
      elemental: elementalEHP,
      oneShot
    };
  }

  /**
   * Generate detailed breakdown
   */
  private generateBreakdown(): DefenseBreakdown {
    // This would generate detailed breakdowns for each defensive layer
    // Placeholder implementation
    return {
      lifeBreakdown: {
        base: this.BASE_LIFE[this.class] || this.BASE_LIFE.default,
        flat: this.modifiers.sum('ADDED', { type: 'resource', subtype: 'life' }),
        increased: this.modifiers.sum('INC', { type: 'resource', subtype: 'life' }),
        more: (this.modifiers.more({ type: 'resource', subtype: 'life' }) - 1) * 100,
        final: this.calculateLife()
      },
      manaBreakdown: {
        base: this.BASE_MANA[this.class] || this.BASE_MANA.default,
        flat: this.modifiers.sum('ADDED', { type: 'resource', subtype: 'mana' }),
        increased: this.modifiers.sum('INC', { type: 'resource', subtype: 'mana' }),
        more: (this.modifiers.more({ type: 'resource', subtype: 'mana' }) - 1) * 100,
        final: this.calculateMana()
      },
      energyShieldBreakdown: {
        base: this.modifiers.sum('BASE', { type: 'defense', subtype: 'energy_shield' }),
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'energy_shield' }),
        increased: this.modifiers.sum('INC', { type: 'defense', subtype: 'energy_shield' }),
        more: (this.modifiers.more({ type: 'defense', subtype: 'energy_shield' }) - 1) * 100,
        final: this.calculateEnergyShield()
      },
      armourBreakdown: {
        base: this.modifiers.sum('BASE', { type: 'defense', subtype: 'armour' }),
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'armour' }),
        increased: this.modifiers.sum('INC', { type: 'defense', subtype: 'armour' }),
        more: (this.modifiers.more({ type: 'defense', subtype: 'armour' }) - 1) * 100,
        final: this.calculateArmour(),
        effectiveReduction: this.calculatePhysicalReduction(this.calculateArmour())
      },
      evasionBreakdown: {
        base: this.modifiers.sum('BASE', { type: 'defense', subtype: 'evasion' }),
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'evasion' }),
        increased: this.modifiers.sum('INC', { type: 'defense', subtype: 'evasion' }),
        more: (this.modifiers.more({ type: 'defense', subtype: 'evasion' }) - 1) * 100,
        final: this.calculateEvasion(),
        effectiveReduction: this.calculateEvadeChance(this.calculateEvasion())
      },
      blockBreakdown: this.calculateBlock(),
      resistanceBreakdown: this.generateResistanceBreakdown()
    };
  }

  /**
   * Generate resistance breakdown
   */
  private generateResistanceBreakdown(): ResistanceBreakdown {
    return {
      fire: {
        base: -30,
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'fire_resistance' }),
        increased: 0,
        max: 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_fire_resistance' }),
        final: this.calculateResistances().fire
      },
      cold: {
        base: -30,
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'cold_resistance' }),
        increased: 0,
        max: 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_cold_resistance' }),
        final: this.calculateResistances().cold
      },
      lightning: {
        base: -30,
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'lightning_resistance' }),
        increased: 0,
        max: 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_lightning_resistance' }),
        final: this.calculateResistances().lightning
      },
      chaos: {
        base: -30,
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'chaos_resistance' }),
        increased: 0,
        max: 75 + this.modifiers.sum('ADDED', { type: 'defense', subtype: 'max_chaos_resistance' }),
        final: this.calculateResistances().chaos
      },
      honor: {
        base: 0,
        flat: this.modifiers.sum('ADDED', { type: 'defense', subtype: 'honor_resistance' }),
        increased: 0,
        max: 100,
        final: this.calculateResistances().honor
      }
    };
  }
}

export default CalcDefense;