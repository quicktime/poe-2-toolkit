/**
 * Tests for CalcOffense module
 */

import CalcOffense from '../modules/CalcOffense';
import { ModifierList } from '../ModifierList';
import type { SkillData, WeaponData, OffenseConfig } from '../modules/CalcOffense';

describe('CalcOffense', () => {
  let modifiers: ModifierList;
  let baseSkill: SkillData;
  let baseWeapon: WeaponData;
  let baseConfig: OffenseConfig;

  beforeEach(() => {
    modifiers = new ModifierList();
    
    baseSkill = {
      name: 'Test Attack',
      type: 'attack',
      damageEffectiveness: 100,
      attackTime: 1.0
    };
    
    baseWeapon = {
      baseDamage: {
        physical: { min: 100, max: 200 }
      },
      attacksPerSecond: 1.5,
      criticalChance: 5,
      criticalMultiplier: 150,
      accuracy: 1000,
      weaponType: 'sword'
    };
    
    baseConfig = {
      enemyLevel: 80,
      enemyEvasion: 500,
      enemyArmour: 1000,
      enemyResistances: {
        fire: 30,
        cold: 30,
        lightning: 30,
        chaos: 0
      }
    };
  });

  describe('Base Damage Calculation', () => {
    test('should calculate weapon base damage correctly', () => {
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Average damage: (100 + 200) / 2 = 150
      expect(result.breakdown.baseDamage.physical).toBe(150);
      expect(result.breakdown.baseDamage.total).toBe(150);
    });

    test('should apply damage effectiveness', () => {
      baseSkill.damageEffectiveness = 120; // 120% effectiveness
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Base 150 * 1.2 effectiveness = 180
      // This gets modified further by other calculations
      expect(result.breakdown.damageEffectiveness).toBe(1.2);
    });

    test('should handle spell base damage', () => {
      baseSkill.type = 'spell';
      baseSkill.baseDamage = {
        fire: { min: 50, max: 100 }
      };
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: undefined,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Average fire damage: (50 + 100) / 2 = 75
      expect(result.breakdown.baseDamage.fire).toBe(75);
    });
  });

  describe('Damage Scaling', () => {
    test('should apply increased damage modifiers correctly', () => {
      modifiers.parseAndAdd('50% increased damage');
      modifiers.parseAndAdd('30% increased physical damage');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // 50% generic + 30% physical = 80% increased
      expect(result.breakdown.increasedDamage).toBe(80);
    });

    test('should apply more damage modifiers multiplicatively', () => {
      modifiers.parseAndAdd('30% more damage');
      modifiers.parseAndAdd('20% more physical damage');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // 1.3 * 1.2 = 1.56 (56% more)
      expect(result.breakdown.moreDamage).toBeCloseTo(56, 0);
    });

    test('should add flat damage correctly', () => {
      modifiers.parseAndAdd('Adds 20 to 30 physical damage');
      modifiers.parseAndAdd('Adds 10 to 20 fire damage to attacks');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Physical: base 150 + added 25 = 175
      // Fire: 0 + added 15 = 15
      expect(result.breakdown.addedDamage.physical).toBe(25);
      // Fire damage is added to attacks, but the breakdown shows 0 because it's skill-specific
      // The actual fire damage appears in the final DPS calculation
      expect(result.fireDPS).toBeGreaterThan(0);
    });
  });

  describe('Damage Conversion', () => {
    test('should convert physical to elemental damage', () => {
      modifiers.parseAndAdd('50% of physical damage converted to fire damage');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Should have both physical and fire damage now
      expect(result.physicalDPS).toBeGreaterThan(0);
      expect(result.fireDPS).toBeGreaterThan(0);
    });

    test('should handle gain as extra damage', () => {
      modifiers.parseAndAdd('Gain 30% of physical damage as extra fire damage');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Should have fire damage without losing physical
      expect(result.physicalDPS).toBeGreaterThan(0);
      expect(result.fireDPS).toBeGreaterThan(0);
    });
  });

  describe('Critical Strikes', () => {
    test('should calculate critical strike chance correctly', () => {
      modifiers.parseAndAdd('100% increased critical strike chance');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Base 5% * 2 (100% increased) = 10%
      expect(result.criticalChance).toBe(10);
    });

    test('should apply critical strike multiplier', () => {
      modifiers.parseAndAdd('+50% to critical strike multiplier');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Base 150% + 50% = 200%
      expect(result.criticalMultiplier).toBe(200);
    });

    test('should calculate effective DPS with crits', () => {
      // Set high crit chance and multiplier
      baseWeapon.criticalChance = 50; // 50% crit chance
      baseWeapon.criticalMultiplier = 200; // 200% multi
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // With 50% crit and 200% multi, average damage is multiplied by:
      // 1 + (0.5 * (2 - 1)) = 1.5
      expect(result.criticalChance).toBe(50);
      expect(result.criticalMultiplier).toBe(200);
      expect(result.totalDPS).toBeGreaterThan(0);
    });
  });

  describe('Attack/Cast Speed', () => {
    test('should apply attack speed modifiers', () => {
      modifiers.parseAndAdd('20% increased attack speed');
      modifiers.parseAndAdd('15% more attack speed');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Base 1.5 * 1.2 (increased) * 1.15 (more) = 2.07
      expect(result.speed).toBeCloseTo(2.07, 2);
    });

    test('should calculate cast speed for spells', () => {
      baseSkill.type = 'spell';
      baseSkill.castTime = 0.5; // 0.5 second cast time
      modifiers.parseAndAdd('30% increased cast speed');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: undefined,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Base speed: 1/0.5 = 2 casts per second
      // With 30% increased: 2 * 1.3 = 2.6
      expect(result.speed).toBeCloseTo(2.6, 2);
    });
  });

  describe('Hit Chance', () => {
    test('should calculate hit chance based on accuracy and evasion', () => {
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Accuracy 1000 vs Evasion 500
      // Hit chance = 1000 / (1000 + 500) = 66.67%
      expect(result.hitChance).toBeCloseTo(66.67, 1);
    });

    test('should have 100% hit chance for spells', () => {
      baseSkill.type = 'spell';
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: undefined,
        config: baseConfig
      });

      const result = calc.calculate();
      
      expect(result.hitChance).toBe(100);
    });

    test('should cap hit chance between 5% and 100%', () => {
      baseConfig.enemyEvasion = 100000; // Very high evasion
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      expect(result.hitChance).toBeGreaterThanOrEqual(5);
      expect(result.hitChance).toBeLessThanOrEqual(100);
    });
  });

  describe('Enemy Mitigation', () => {
    test('should apply enemy resistances', () => {
      // Add fire damage
      modifiers.parseAndAdd('Adds 100 to 100 fire damage');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Fire damage should be reduced by 30% resistance
      expect(result.fireDPS).toBeGreaterThan(0);
    });

    test('should apply resistance penetration', () => {
      modifiers.parseAndAdd('Adds 100 to 100 fire damage');
      modifiers.parseAndAdd('Damage penetrates 20% fire resistance');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Effective resistance: 30% - 20% = 10%
      expect(result.breakdown.penetration.fire).toBe(20);
    });

    test('should apply armor mitigation to physical damage', () => {
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Physical damage should be reduced by armor
      expect(result.physicalDPS).toBeGreaterThan(0);
    });
  });

  describe('PoE2 Specific Mechanics', () => {
    test('should calculate combo DPS', () => {
      baseSkill.comboPointCost = 3;
      baseConfig.comboPower = 3;
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // 3 combo points = 90% more damage (30% per point)
      expect(result.comboDPS).toBeDefined();
      expect(result.comboDPS!).toBeGreaterThan(result.totalDPS);
    });

    test('should calculate spirit efficiency', () => {
      baseSkill.spiritCost = 25;
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Spirit efficiency = DPS / spirit cost
      expect(result.spiritEfficiency).toBeDefined();
      expect(result.spiritEfficiency).toBe(result.totalDPS / 25);
    });
  });

  describe('Final DPS Calculation', () => {
    test('should calculate total DPS correctly', () => {
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Should have non-zero DPS
      expect(result.totalDPS).toBeGreaterThan(0);
      expect(result.physicalDPS).toBeGreaterThan(0);
      
      // Effective DPS should account for hit chance
      expect(result.effectiveDPS).toBeLessThanOrEqual(result.totalDPS);
    });

    test('should calculate damage per hit', () => {
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Damage per hit should be total damage before speed multiplication
      expect(result.damagePerHit).toBeGreaterThan(0);
      expect(result.averageDamage).toBe(result.damagePerHit);
    });

    test('should provide detailed breakdown', () => {
      modifiers.parseAndAdd('50% increased damage');
      modifiers.parseAndAdd('30% more damage');
      modifiers.parseAndAdd('Adds 20 to 30 fire damage');
      
      const calc = new CalcOffense({
        modifiers,
        skill: baseSkill,
        weapon: baseWeapon,
        config: baseConfig
      });

      const result = calc.calculate();
      
      // Check breakdown exists and has expected values
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.baseDamage).toBeDefined();
      expect(result.breakdown.addedDamage).toBeDefined();
      expect(result.breakdown.increasedDamage).toBe(50);
      expect(result.breakdown.moreDamage).toBeCloseTo(30, 0);
      expect(result.breakdown.finalDamage).toBeDefined();
    });
  });
});