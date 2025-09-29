/**
 * CalcOffense - Offensive damage calculation module
 * Handles DPS, hit damage, critical strikes, and accuracy
 */

import { ModifierList } from '../ModifierList';

export interface OffenseInput {
  modifiers: ModifierList;
  skill: SkillData;
  weapon?: WeaponData;
  config?: OffenseConfig;
}

export interface SkillData {
  name: string;
  type: 'attack' | 'spell' | 'channeling' | 'combo';
  baseDamage?: DamageRanges;
  damageEffectiveness: number;
  attackTime?: number;
  castTime?: number;
  critChance?: number;
  critMultiplier?: number;
  // PoE2 specific
  spiritCost?: number;
  comboPointCost?: number;
  comboPointsGenerated?: number;
}

export interface WeaponData {
  baseDamage: DamageRanges;
  attacksPerSecond: number;
  criticalChance: number;
  criticalMultiplier: number;
  accuracy?: number;
  weaponType: string;
  isLocal?: boolean;
}

export interface DamageRanges {
  physical?: { min: number; max: number };
  fire?: { min: number; max: number };
  cold?: { min: number; max: number };
  lightning?: { min: number; max: number };
  chaos?: { min: number; max: number };
}

export interface OffenseConfig {
  enemyLevel?: number;
  enemyEvasion?: number;
  enemyArmour?: number;
  enemyResistances?: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
    honor?: number;
  };
  comboPower?: number; // Current combo points
  isMoving?: boolean;
  hasKilledRecently?: boolean;
  onFullLife?: boolean;
  onLowLife?: boolean;
}

export interface OffenseOutput {
  // Total DPS
  totalDPS: number;
  effectiveDPS: number;
  
  // DPS breakdown
  physicalDPS: number;
  fireDPS: number;
  coldDPS: number;
  lightningDPS: number;
  chaosDPS: number;
  
  // Hit damage
  averageDamage: number;
  damagePerHit: number;
  
  // Attack/cast metrics
  speed: number;
  attacksPerSecond: number;
  hitChance: number;
  
  // Critical strikes
  criticalChance: number;
  criticalMultiplier: number;
  effectiveCriticalChance: number;
  
  // PoE2 specific
  comboDPS?: number;
  spiritEfficiency?: number;
  
  // Detailed breakdown
  breakdown: DamageCalculationBreakdown;
}

export interface DamageBreakdown {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
  total: number;
}

export interface DamageCalculationBreakdown {
  baseDamage: DamageBreakdown;
  addedDamage: DamageBreakdown;
  damageEffectiveness: number;
  conversions: ConversionData[];
  increasedDamage: number;
  moreDamage: number;
  penetration: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
  };
  finalDamage: DamageBreakdown;
}

export interface ConversionData {
  from: string;
  to: string;
  percentage: number;
}

export class CalcOffense {
  private modifiers: ModifierList;
  private skill: SkillData;
  private weapon?: WeaponData;
  private config: OffenseConfig;

  constructor(input: OffenseInput) {
    this.modifiers = input.modifiers;
    this.skill = input.skill;
    this.weapon = input.weapon;
    this.config = input.config || {};
  }

  /**
   * Main calculation entry point
   */
  calculate(): OffenseOutput {
    // Step 1: Calculate base damage
    const baseDamage = this.calculateBaseDamage();
    
    // Step 2: Apply damage effectiveness
    const effectiveDamage = this.applyDamageEffectiveness(baseDamage);
    
    // Step 3: Add flat damage
    const withAddedDamage = this.addFlatDamage(effectiveDamage);
    
    // Step 4: Apply conversions
    const convertedDamage = this.applyConversions(withAddedDamage);
    
    // Step 5: Apply increased modifiers (additive)
    const increasedDamage = this.applyIncreasedDamage(convertedDamage);
    
    // Step 6: Apply more modifiers (multiplicative)
    const moreDamage = this.applyMoreDamage(increasedDamage);
    
    // Step 7: Calculate critical strikes
    const { critChance, critMultiplier, effectiveCrit } = this.calculateCritical();
    
    // Step 8: Apply critical damage
    const criticalDamage = this.applyCriticalDamage(moreDamage, critChance, critMultiplier);
    
    // Step 9: Calculate speed (attacks/casts per second)
    const speed = this.calculateSpeed();
    
    // Step 10: Calculate hit chance
    const hitChance = this.calculateHitChance();
    
    // Step 11: Apply enemy mitigation
    const mitigatedDamage = this.applyEnemyMitigation(criticalDamage);
    
    // Step 12: Calculate final DPS
    const dps = this.calculateDPS(mitigatedDamage, speed, hitChance);
    
    // Step 13: Calculate PoE2 specific metrics
    const comboDPS = this.calculateComboDPS(dps);
    const spiritEfficiency = this.calculateSpiritEfficiency(dps);
    
    return {
      totalDPS: dps.total,
      effectiveDPS: dps.total,
      physicalDPS: dps.physical,
      fireDPS: dps.fire,
      coldDPS: dps.cold,
      lightningDPS: dps.lightning,
      chaosDPS: dps.chaos,
      averageDamage: this.sumDamage(mitigatedDamage),
      damagePerHit: this.sumDamage(mitigatedDamage),
      speed,
      attacksPerSecond: speed,
      hitChance,
      criticalChance: critChance,
      criticalMultiplier: critMultiplier,
      effectiveCriticalChance: effectiveCrit,
      comboDPS,
      spiritEfficiency,
      breakdown: {
        baseDamage: { ...baseDamage, total: this.sumDamage(baseDamage) },
        addedDamage: this.getAddedDamageBreakdown(),
        damageEffectiveness: this.skill.damageEffectiveness / 100,
        conversions: this.getConversions(),
        increasedDamage: this.getTotalIncreasedDamage(),
        moreDamage: this.getTotalMoreDamage(),
        penetration: this.getPenetration(),
        finalDamage: { ...mitigatedDamage, total: this.sumDamage(mitigatedDamage) }
      }
    };
  }

  /**
   * Calculate base damage from weapon or spell
   */
  private calculateBaseDamage(): DamageBreakdown {
    const damage: DamageBreakdown = {
      physical: 0,
      fire: 0,
      cold: 0,
      lightning: 0,
      chaos: 0,
      total: 0
    };

    if (this.skill.type === 'spell' && this.skill.baseDamage) {
      // Spell base damage
      damage.physical = this.averageDamage(this.skill.baseDamage.physical);
      damage.fire = this.averageDamage(this.skill.baseDamage.fire);
      damage.cold = this.averageDamage(this.skill.baseDamage.cold);
      damage.lightning = this.averageDamage(this.skill.baseDamage.lightning);
      damage.chaos = this.averageDamage(this.skill.baseDamage.chaos);
    } else if (this.weapon && this.skill.type === 'attack') {
      // Weapon base damage
      damage.physical = this.averageDamage(this.weapon.baseDamage.physical);
      damage.fire = this.averageDamage(this.weapon.baseDamage.fire);
      damage.cold = this.averageDamage(this.weapon.baseDamage.cold);
      damage.lightning = this.averageDamage(this.weapon.baseDamage.lightning);
      damage.chaos = this.averageDamage(this.weapon.baseDamage.chaos);
      
      // Apply local weapon modifiers
      if (this.weapon.isLocal) {
        const localPhysInc = this.modifiers.sum('INC', { type: 'damage', subtype: 'physical' });
        damage.physical *= (1 + localPhysInc / 100);
      }
    }

    damage.total = this.sumDamage(damage);
    return damage;
  }

  /**
   * Apply skill damage effectiveness
   */
  private applyDamageEffectiveness(damage: DamageBreakdown): DamageBreakdown {
    const effectiveness = this.skill.damageEffectiveness / 100;
    return {
      physical: damage.physical * effectiveness,
      fire: damage.fire * effectiveness,
      cold: damage.cold * effectiveness,
      lightning: damage.lightning * effectiveness,
      chaos: damage.chaos * effectiveness,
      total: damage.total * effectiveness
    };
  }

  /**
   * Add flat damage from gear and passives
   */
  private addFlatDamage(damage: DamageBreakdown): DamageBreakdown {
    const isAttack = this.skill.type === 'attack';
    const isSpell = this.skill.type === 'spell';
    
    return {
      physical: damage.physical + 
        this.modifiers.sum('ADDED', { type: 'damage', subtype: 'physical' }) +
        (isAttack ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'physical_to_attacks' }) : 0) +
        (isSpell ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'physical_to_spells' }) : 0),
      fire: damage.fire + 
        this.modifiers.sum('ADDED', { type: 'damage', subtype: 'fire' }) +
        (isAttack ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'fire_to_attacks' }) : 0) +
        (isSpell ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'fire_to_spells' }) : 0),
      cold: damage.cold + 
        this.modifiers.sum('ADDED', { type: 'damage', subtype: 'cold' }) +
        (isAttack ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'cold_to_attacks' }) : 0) +
        (isSpell ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'cold_to_spells' }) : 0),
      lightning: damage.lightning + 
        this.modifiers.sum('ADDED', { type: 'damage', subtype: 'lightning' }) +
        (isAttack ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'lightning_to_attacks' }) : 0) +
        (isSpell ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'lightning_to_spells' }) : 0),
      chaos: damage.chaos + 
        this.modifiers.sum('ADDED', { type: 'damage', subtype: 'chaos' }) +
        (isAttack ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'chaos_to_attacks' }) : 0) +
        (isSpell ? this.modifiers.sum('ADDED', { type: 'damage', subtype: 'chaos_to_spells' }) : 0),
      total: 0
    };
  }

  /**
   * Apply damage conversions
   */
  private applyConversions(damage: DamageBreakdown): DamageBreakdown {
    const result = { ...damage };
    
    // Physical to Lightning
    const physToLight = Math.min(100, this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_lightning' }));
    if (physToLight > 0) {
      const converted = result.physical * (physToLight / 100);
      result.physical -= converted;
      result.lightning += converted;
    }
    
    // Physical to Cold
    const physToCold = Math.min(100 - physToLight, this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_cold' }));
    if (physToCold > 0) {
      const converted = result.physical * (physToCold / 100);
      result.physical -= converted;
      result.cold += converted;
    }
    
    // Physical to Fire
    const physToFire = Math.min(100 - physToLight - physToCold, this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_fire' }));
    if (physToFire > 0) {
      const converted = result.physical * (physToFire / 100);
      result.physical -= converted;
      result.fire += converted;
    }
    
    // Elemental to Chaos conversions
    const eleToChaos = Math.min(100, this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'elemental_to_chaos' }));
    if (eleToChaos > 0) {
      const fireConverted = result.fire * (eleToChaos / 100);
      const coldConverted = result.cold * (eleToChaos / 100);
      const lightConverted = result.lightning * (eleToChaos / 100);
      
      result.fire -= fireConverted;
      result.cold -= coldConverted;
      result.lightning -= lightConverted;
      result.chaos += fireConverted + coldConverted + lightConverted;
    }
    
    // Gain as Extra damage
    // Add extra elemental damage based on physical
    const extraFire = this.modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_fire' });
    const extraCold = this.modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_cold' });
    const extraLightning = this.modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_lightning' });
    const extraChaos = this.modifiers.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_chaos' });
    
    if (extraFire > 0) result.fire += damage.physical * (extraFire / 100);
    if (extraCold > 0) result.cold += damage.physical * (extraCold / 100);
    if (extraLightning > 0) result.lightning += damage.physical * (extraLightning / 100);
    if (extraChaos > 0) result.chaos += damage.physical * (extraChaos / 100);
    
    result.total = this.sumDamage(result);
    return result;
  }

  /**
   * Apply increased damage modifiers (additive)
   */
  private applyIncreasedDamage(damage: DamageBreakdown): DamageBreakdown {
    // Generic increased damage
    const genericInc = this.modifiers.sum('INC', { type: 'damage' });
    
    // Type-specific increased damage
    const physInc = genericInc + this.modifiers.sum('INC', { type: 'damage', subtype: 'physical' });
    const fireInc = genericInc + this.modifiers.sum('INC', { type: 'damage', subtype: 'fire' });
    const coldInc = genericInc + this.modifiers.sum('INC', { type: 'damage', subtype: 'cold' });
    const lightInc = genericInc + this.modifiers.sum('INC', { type: 'damage', subtype: 'lightning' });
    const chaosInc = genericInc + this.modifiers.sum('INC', { type: 'damage', subtype: 'chaos' });
    
    // Elemental damage bonus
    const eleInc = this.modifiers.sum('INC', { type: 'damage', subtype: 'elemental' });
    
    return {
      physical: damage.physical * (1 + physInc / 100),
      fire: damage.fire * (1 + (fireInc + eleInc) / 100),
      cold: damage.cold * (1 + (coldInc + eleInc) / 100),
      lightning: damage.lightning * (1 + (lightInc + eleInc) / 100),
      chaos: damage.chaos * (1 + chaosInc / 100),
      total: 0
    };
  }

  /**
   * Apply more damage modifiers (multiplicative)
   */
  private applyMoreDamage(damage: DamageBreakdown): DamageBreakdown {
    // Generic more damage
    const genericMore = this.modifiers.more({ type: 'damage' });
    
    // Type-specific more damage
    const physMore = this.modifiers.more({ type: 'damage', subtype: 'physical' });
    const fireMore = this.modifiers.more({ type: 'damage', subtype: 'fire' });
    const coldMore = this.modifiers.more({ type: 'damage', subtype: 'cold' });
    const lightMore = this.modifiers.more({ type: 'damage', subtype: 'lightning' });
    const chaosMore = this.modifiers.more({ type: 'damage', subtype: 'chaos' });
    
    // Elemental damage bonus
    const eleMore = this.modifiers.more({ type: 'damage', subtype: 'elemental' });
    
    return {
      physical: damage.physical * genericMore * physMore,
      fire: damage.fire * genericMore * fireMore * eleMore,
      cold: damage.cold * genericMore * coldMore * eleMore,
      lightning: damage.lightning * genericMore * lightMore * eleMore,
      chaos: damage.chaos * genericMore * chaosMore,
      total: 0
    };
  }

  /**
   * Calculate critical strike chance and multiplier - PoE2 System
   * PoE2 has different base crit chances per weapon type and new crit scaling
   */
  private calculateCritical(): { critChance: number; critMultiplier: number; effectiveCrit: number } {
    // PoE2 base crit chances by weapon type
    const POE2_BASE_CRIT: Record<string, number> = {
      'dagger': 8,
      'claw': 7,
      'wand': 7,
      'sword': 6,
      'axe': 5,
      'mace': 5,
      'staff': 6,
      'bow': 6,
      'crossbow': 7, // PoE2 specific
      'focus': 8,    // PoE2 specific
      'quarterstaff': 6, // PoE2 specific
      'spear': 6,    // PoE2 specific
      'flail': 5,    // PoE2 specific
      'default': 5
    };
    
    let baseCrit = 5;
    let baseMulti = 150; // PoE2 base crit multiplier
    
    if (this.skill.type === 'spell' && this.skill.critChance) {
      baseCrit = this.skill.critChance;
    } else if (this.weapon && this.skill.type === 'attack') {
      // Use weapon type specific base crit
      const weaponType = this.weapon.weaponType.toLowerCase();
      baseCrit = this.weapon.criticalChance || POE2_BASE_CRIT[weaponType] || POE2_BASE_CRIT.default;
      baseMulti = this.weapon.criticalMultiplier;
    }
    
    // PoE2 critical strike scaling
    // Base crit is additive in PoE2, not multiplicative like PoE1
    const addedBaseCrit = this.modifiers.sum('ADDED', { type: 'critical', subtype: 'base_chance' });
    const increasedCrit = this.modifiers.sum('INC', { type: 'critical' });
    
    // PoE2 formula: (Base + Added) * (1 + Increased/100)
    const finalCrit = (baseCrit + addedBaseCrit) * (1 + increasedCrit / 100);
    
    // PoE2 crit multiplier calculation
    const addedMulti = this.modifiers.sum('ADDED', { type: 'critical' });
    const increasedMulti = this.modifiers.sum('INC', { type: 'critical', subtype: 'multiplier' });
    const finalMulti = (baseMulti + addedMulti) * (1 + increasedMulti / 100);
    
    // PoE2 crit cap is 100% but with heavy investment
    const effectiveCrit = Math.min(100, finalCrit);
    
    return {
      critChance: finalCrit,
      critMultiplier: finalMulti,
      effectiveCrit
    };
  }

  /**
   * Apply critical damage bonus
   */
  private applyCriticalDamage(damage: DamageBreakdown, critChance: number, critMultiplier: number): DamageBreakdown {
    const critBonus = (critChance / 100) * ((critMultiplier - 100) / 100);
    const multiplier = 1 + critBonus;
    
    return {
      physical: damage.physical * multiplier,
      fire: damage.fire * multiplier,
      cold: damage.cold * multiplier,
      lightning: damage.lightning * multiplier,
      chaos: damage.chaos * multiplier,
      total: 0
    };
  }

  /**
   * Calculate attacks/casts per second
   */
  private calculateSpeed(): number {
    let baseSpeed = 1.0;
    
    if (this.skill.type === 'attack' && this.weapon) {
      baseSpeed = this.weapon.attacksPerSecond;
    } else if (this.skill.castTime) {
      baseSpeed = 1 / this.skill.castTime;
    } else if (this.skill.attackTime) {
      baseSpeed = 1 / this.skill.attackTime;
    }
    
    // Apply speed modifiers
    const speedType = this.skill.type === 'spell' ? 'cast_speed' : 'attack_speed';
    const increasedSpeed = this.modifiers.sum('INC', { type: 'speed' });
    const moreSpeed = this.modifiers.more({ type: 'speed' });
    
    return baseSpeed * (1 + increasedSpeed / 100) * moreSpeed;
  }

  /**
   * Calculate hit chance - PoE2 Accuracy System
   * PoE2 uses a different accuracy formula with glancing blows
   */
  private calculateHitChance(): number {
    if (this.skill.type === 'spell') {
      return 100; // Spells always hit in PoE2
    }
    
    // PoE2 base accuracy calculation
    const baseAccuracy = this.weapon?.accuracy || 100;
    const flatAccuracy = this.modifiers.sum('ADDED', { type: 'accuracy' });
    const increasedAccuracy = this.modifiers.sum('INC', { type: 'accuracy' });
    
    // PoE2 dexterity grants accuracy (2 accuracy per dexterity)
    const dexterity = this.modifiers.sum('ADDED', { type: 'attribute', subtype: 'dexterity' });
    const dexAccuracy = dexterity * 2;
    
    // PoE2 formula includes weapon mastery bonuses
    const weaponMasteryAccuracy = this.modifiers.sum('ADDED', { type: 'accuracy', subtype: 'weapon_mastery' });
    
    const totalAccuracy = (baseAccuracy + flatAccuracy + dexAccuracy + weaponMasteryAccuracy) * 
                         (1 + increasedAccuracy / 100);
    
    const enemyEvasion = this.config.enemyEvasion || 0;
    
    if (enemyEvasion <= 0) return 100;
    
    // PoE2 hit formula with glancing blow mechanics
    // Full hit chance = Accuracy / (Accuracy + Evasion * 1.25)
    const fullHitChance = (totalAccuracy / (totalAccuracy + enemyEvasion * 1.25)) * 100;
    
    // PoE2 has glancing blows between 50-100% hit chance
    // Below 50% is a miss, 50-85% is glancing (50% damage), 85%+ is full hit
    if (fullHitChance < 50) {
      return fullHitChance; // This represents chance to hit at all
    } else if (fullHitChance < 85) {
      // Glancing blow range - return effective damage percentage
      return 50 + (fullHitChance - 50); // Gradual scaling
    } else {
      return Math.min(100, fullHitChance);
    }
  }

  /**
   * Apply enemy mitigation (resistances, armor)
   */
  private applyEnemyMitigation(damage: DamageBreakdown): DamageBreakdown {
    const resistances = this.config.enemyResistances || {
      fire: 0,
      cold: 0,
      lightning: 0,
      chaos: 0
    };
    
    // Get penetration
    const firePen = this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'fire' });
    const coldPen = this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'cold' });
    const lightPen = this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'lightning' });
    const chaosPen = this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'chaos' });
    
    // Apply resistances with penetration
    const effectiveFireRes = Math.max(-200, resistances.fire - firePen);
    const effectiveColdRes = Math.max(-200, resistances.cold - coldPen);
    const effectiveLightRes = Math.max(-200, resistances.lightning - lightPen);
    const effectiveChaosRes = Math.max(-200, resistances.chaos - chaosPen);
    
    // Apply armor mitigation to physical damage
    let physicalMitigation = 1.0;
    if (this.config.enemyArmour && damage.physical > 0) {
      // Simplified armor formula
      const armor = this.config.enemyArmour;
      const damageReduction = armor / (armor + damage.physical * 10);
      physicalMitigation = 1 - Math.min(0.9, damageReduction); // Max 90% reduction
    }
    
    return {
      physical: damage.physical * physicalMitigation,
      fire: damage.fire * (1 - effectiveFireRes / 100),
      cold: damage.cold * (1 - effectiveColdRes / 100),
      lightning: damage.lightning * (1 - effectiveLightRes / 100),
      chaos: damage.chaos * (1 - effectiveChaosRes / 100),
      total: 0
    };
  }

  /**
   * Calculate final DPS
   */
  private calculateDPS(damage: DamageBreakdown, speed: number, hitChance: number): DamageBreakdown {
    const hitMultiplier = hitChance / 100;
    
    return {
      physical: damage.physical * speed * hitMultiplier,
      fire: damage.fire * speed * hitMultiplier,
      cold: damage.cold * speed * hitMultiplier,
      lightning: damage.lightning * speed * hitMultiplier,
      chaos: damage.chaos * speed * hitMultiplier,
      total: (damage.physical + damage.fire + damage.cold + damage.lightning + damage.chaos) * speed * hitMultiplier
    };
  }

  /**
   * Calculate combo DPS bonus - PoE2 Combo System
   * PoE2 combos work differently per weapon type with varying multipliers
   */
  private calculateComboDPS(baseDPS: DamageBreakdown): number | undefined {
    if (!this.skill.comboPointCost || !this.config.comboPower) {
      return undefined;
    }
    
    // PoE2 combo multipliers vary by weapon type
    const COMBO_MULTIPLIERS: Record<string, number> = {
      'quarterstaff': 0.35,  // 35% more per combo point
      'flail': 0.40,         // 40% more per combo point
      'sword': 0.30,         // 30% more per combo point
      'axe': 0.35,           // 35% more per combo point
      'mace': 0.45,          // 45% more per combo point (slower, bigger hits)
      'dagger': 0.25,        // 25% more per combo point (faster, smaller hits)
      'claw': 0.30,          // 30% more per combo point
      'spear': 0.35,         // 35% more per combo point
      'default': 0.30        // Default 30% more per combo point
    };
    
    const weaponType = this.weapon?.weaponType?.toLowerCase() || 'default';
    const comboBonus = COMBO_MULTIPLIERS[weaponType] || COMBO_MULTIPLIERS.default;
    
    // PoE2 combo formula: Base * (1 + ComboPoints * WeaponBonus)
    // Also applies combo finisher bonus if at max combo
    const maxCombo = 3; // PoE2 max combo points
    const isFinisher = this.config.comboPower >= maxCombo;
    const finisherBonus = isFinisher ? 1.5 : 1.0; // 50% more damage on finishers
    
    const comboMultiplier = (1 + (this.config.comboPower * comboBonus)) * finisherBonus;
    return baseDPS.total * comboMultiplier;
  }

  /**
   * Calculate spirit efficiency (DPS per spirit)
   */
  private calculateSpiritEfficiency(dps: DamageBreakdown): number | undefined {
    if (!this.skill.spiritCost || this.skill.spiritCost === 0) {
      return undefined;
    }
    
    return dps.total / this.skill.spiritCost;
  }

  // Helper methods
  private averageDamage(range?: { min: number; max: number }): number {
    if (!range) return 0;
    return (range.min + range.max) / 2;
  }

  private sumDamage(damage: DamageBreakdown): number {
    return damage.physical + damage.fire + damage.cold + damage.lightning + damage.chaos;
  }

  private getAddedDamageBreakdown(): DamageBreakdown {
    return {
      physical: this.modifiers.sum('ADDED', { type: 'damage', subtype: 'physical' }),
      fire: this.modifiers.sum('ADDED', { type: 'damage', subtype: 'fire' }),
      cold: this.modifiers.sum('ADDED', { type: 'damage', subtype: 'cold' }),
      lightning: this.modifiers.sum('ADDED', { type: 'damage', subtype: 'lightning' }),
      chaos: this.modifiers.sum('ADDED', { type: 'damage', subtype: 'chaos' }),
      total: 0
    };
  }

  private getConversions(): ConversionData[] {
    const conversions: ConversionData[] = [];
    
    const physToFire = this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_fire' });
    if (physToFire > 0) conversions.push({ from: 'physical', to: 'fire', percentage: physToFire });
    
    const physToCold = this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_cold' });
    if (physToCold > 0) conversions.push({ from: 'physical', to: 'cold', percentage: physToCold });
    
    const physToLight = this.modifiers.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_lightning' });
    if (physToLight > 0) conversions.push({ from: 'physical', to: 'lightning', percentage: physToLight });
    
    return conversions;
  }

  private getTotalIncreasedDamage(): number {
    return this.modifiers.sum('INC', { type: 'damage' });
  }

  private getTotalMoreDamage(): number {
    const more = this.modifiers.more({ type: 'damage' });
    return (more - 1) * 100; // Convert to percentage
  }

  private getPenetration(): { fire: number; cold: number; lightning: number; chaos: number } {
    return {
      fire: this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'fire' }),
      cold: this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'cold' }),
      lightning: this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'lightning' }),
      chaos: this.modifiers.sum('PENETRATION', { type: 'damage', subtype: 'chaos' })
    };
  }
}

export default CalcOffense;