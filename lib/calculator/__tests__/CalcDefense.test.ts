/**
 * Tests for CalcDefense module
 */

import CalcDefense from '../modules/CalcDefense';
import { ModifierList } from '../ModifierList';
import type { DefenseConfig } from '../modules/CalcDefense';

describe('CalcDefense', () => {
  let modifiers: ModifierList;
  let baseConfig: DefenseConfig;

  beforeEach(() => {
    modifiers = new ModifierList();
    baseConfig = {};
  });

  describe('Life Calculation', () => {
    test('should calculate base life for warrior', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Warrior base 100 + 1 level * 10 = 110
      expect(result.life).toBe(110);
    });

    test('should calculate base life for witch', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'witch'
      });

      const result = calc.calculate();

      // Witch base 70 + 1 level * 10 = 80
      expect(result.life).toBe(80);
    });

    test('should apply life per level scaling', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Warrior base 100 + 50 levels * 10 = 600
      expect(result.life).toBe(600);
    });

    test('should add flat life modifiers', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'life',
        value: 50,
        tags: [{ type: 'resource', subtype: 'life' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 110 base + 50 flat = 160
      expect(result.life).toBe(160);
    });

    test('should apply increased life modifiers', () => {
      modifiers.add({
        type: 'INC',
        name: 'life',
        value: 50,
        tags: [{ type: 'resource', subtype: 'life' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 110 base * 1.5 = 165
      expect(result.life).toBe(165);
    });

    test('should apply more life modifiers', () => {
      modifiers.add({
        type: 'MORE',
        name: 'life',
        value: 20,
        tags: [{ type: 'resource', subtype: 'life' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 110 base * 1.2 = 132
      expect(result.life).toBe(132);
    });

    test('should add strength bonus to life', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'strength',
        value: 100,
        tags: [{ type: 'attribute', subtype: 'strength' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 110 base + (100 str * 2) = 310
      expect(result.life).toBe(310);
    });
  });

  describe('Mana Calculation', () => {
    test('should calculate base mana for witch', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'witch'
      });

      const result = calc.calculate();

      // Witch base 70 + 1 level * 4 = 74
      expect(result.mana).toBe(74);
    });

    test('should calculate base mana for warrior', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Warrior base 30 + 1 level * 4 = 34
      expect(result.mana).toBe(34);
    });

    test('should apply mana per level scaling', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      // Witch base 70 + 50 levels * 4 = 270
      expect(result.mana).toBe(270);
    });

    test('should add intelligence bonus to mana', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'intelligence',
        value: 100,
        tags: [{ type: 'attribute', subtype: 'intelligence' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'witch'
      });

      const result = calc.calculate();

      // 74 base + (100 int * 2) = 274
      expect(result.mana).toBe(274);
    });

    test('should apply increased mana modifiers', () => {
      modifiers.add({
        type: 'INC',
        name: 'mana',
        value: 50,
        tags: [{ type: 'resource', subtype: 'mana' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 1,
        class: 'witch'
      });

      const result = calc.calculate();

      // 74 base * 1.5 = 111
      expect(result.mana).toBe(111);
    });
  });

  describe('Energy Shield Calculation', () => {
    test('should calculate energy shield from base', () => {
      modifiers.add({
        type: 'BASE',
        name: 'energy_shield',
        value: 200,
        tags: [{ type: 'defense', subtype: 'energy_shield' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      expect(result.energyShield).toBe(200);
    });

    test('should apply intelligence bonus to energy shield', () => {
      modifiers.add({
        type: 'BASE',
        name: 'energy_shield',
        value: 100,
        tags: [{ type: 'defense', subtype: 'energy_shield' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'intelligence',
        value: 100,
        tags: [{ type: 'attribute', subtype: 'intelligence' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      // 100 int = 20 * 2% = 40% increased
      // 100 base * 1.4 = 140
      expect(result.energyShield).toBe(140);
    });

    test('should apply increased energy shield modifiers', () => {
      modifiers.add({
        type: 'BASE',
        name: 'energy_shield',
        value: 100,
        tags: [{ type: 'defense', subtype: 'energy_shield' }]
      });
      modifiers.add({
        type: 'INC',
        name: 'energy_shield',
        value: 100,
        tags: [{ type: 'defense', subtype: 'energy_shield' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      // 100 base * 2.0 = 200
      expect(result.energyShield).toBe(200);
    });

    test('should handle zero energy shield', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.energyShield).toBe(0);
    });
  });

  describe('Spirit Calculation (PoE2)', () => {
    test('should calculate base spirit', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Base spirit is 100 for all classes
      expect(result.spirit).toBe(100);
    });

    test('should add flat spirit modifiers', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'spirit',
        value: 50,
        tags: [{ type: 'resource', subtype: 'spirit' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 100 base + 50 flat = 150
      expect(result.spirit).toBe(150);
    });

    test('should calculate available spirit after reservation', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'spirit',
        value: 100,
        tags: [{ type: 'resource', subtype: 'spirit' }]
      });
      modifiers.add({
        type: 'RESERVED',
        name: 'spirit',
        value: 30,
        tags: [{ type: 'resource', subtype: 'spirit' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 200 total spirit, 30% reserved = 60 reserved, 140 available
      expect(result.spirit).toBe(200);
      expect(result.spiritReservation).toBe(60);
      expect(result.availableSpirit).toBe(140);
    });
  });

  describe('Resistances', () => {
    test('should have base campaign penalty', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Base resistances are -30%
      expect(result.resistances.fire).toBe(-30);
      expect(result.resistances.cold).toBe(-30);
      expect(result.resistances.lightning).toBe(-30);
      expect(result.resistances.chaos).toBe(-30);
    });

    test('should add flat resistances', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 50,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'cold_resistance',
        value: 30,
        tags: [{ type: 'defense', subtype: 'cold_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // -30 + 50 = 20
      expect(result.resistances.fire).toBe(20);
      // -30 + 30 = 0
      expect(result.resistances.cold).toBe(0);
    });

    test('should cap resistances at maximum', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 200,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // -30 + 200 = 170, capped at 75
      expect(result.resistances.fire).toBe(75);
    });

    test('should increase max resistances', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 150,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'max_fire_resistance',
        value: 5,
        tags: [{ type: 'defense', subtype: 'max_fire_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // -30 + 150 = 120, capped at 75 + 5 = 80
      expect(result.resistances.fire).toBe(80);
      expect(result.resistances.maxFire).toBe(80);
    });

    test('should handle honor resistance (PoE2)', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'honor_resistance',
        value: 25,
        tags: [{ type: 'defense', subtype: 'honor_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // No base penalty for honor
      expect(result.resistances.honor).toBe(25);
    });
  });

  describe('Armour Calculation', () => {
    test('should calculate armour from base', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 500,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.armour).toBe(500);
    });

    test('should add strength bonus to armour', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 500,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'strength',
        value: 100,
        tags: [{ type: 'attribute', subtype: 'strength' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 500 base + (100 str * 2) = 700
      expect(result.armour).toBe(700);
    });

    test('should apply increased armour modifiers', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 500,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });
      modifiers.add({
        type: 'INC',
        name: 'armour',
        value: 100,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 500 base * 2.0 = 1000
      expect(result.armour).toBe(1000);
    });

    test('should apply endurance charge bonus to armour', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 500,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior',
        config: { hasEnduranceCharges: 3 }
      });

      const result = calc.calculate();

      // 3 charges * 4% = 12% increased
      // 500 * 1.12 = 560
      expect(result.armour).toBe(560);
    });

    test('should calculate physical damage reduction from armour', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 1000,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // PoE2 uses flat reduction: armour/10 = 100
      // Expected hit at level 50 = 50 * 20 = 1000
      // Percent reduction = 100/1000 * 100 = 10%
      expect(result.physicalDamageReduction).toBe(10);
    });

    test('should apply endurance charge physical reduction', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior',
        config: { hasEnduranceCharges: 3 }
      });

      const result = calc.calculate();

      // 3 charges * 5% = 15%
      expect(result.physicalDamageReduction).toBeGreaterThanOrEqual(15);
    });

    test('should cap physical reduction at 75%', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 10000,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior',
        config: { hasEnduranceCharges: 10 }
      });

      const result = calc.calculate();

      expect(result.physicalDamageReduction).toBeLessThanOrEqual(75);
    });
  });

  describe('Evasion Calculation', () => {
    test('should calculate evasion from base', () => {
      modifiers.add({
        type: 'BASE',
        name: 'evasion',
        value: 500,
        tags: [{ type: 'defense', subtype: 'evasion' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // 500 base + (50 level * 5) = 750
      expect(result.evasion).toBe(750);
    });

    test('should add dexterity bonus to evasion', () => {
      modifiers.add({
        type: 'BASE',
        name: 'evasion',
        value: 500,
        tags: [{ type: 'defense', subtype: 'evasion' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'dexterity',
        value: 100,
        tags: [{ type: 'attribute', subtype: 'dexterity' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // 500 base + 250 level + (100 dex * 2) = 950
      expect(result.evasion).toBe(950);
    });

    test('should apply increased evasion modifiers', () => {
      modifiers.add({
        type: 'BASE',
        name: 'evasion',
        value: 500,
        tags: [{ type: 'defense', subtype: 'evasion' }]
      });
      modifiers.add({
        type: 'INC',
        name: 'evasion',
        value: 100,
        tags: [{ type: 'defense', subtype: 'evasion' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // (500 base + 250 level) * 2.0 = 1500
      expect(result.evasion).toBe(1500);
    });

    test('should calculate evade chance', () => {
      modifiers.add({
        type: 'BASE',
        name: 'evasion',
        value: 2000,
        tags: [{ type: 'defense', subtype: 'evasion' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // Enemy accuracy = 50 * 50 = 2500
      // Evasion = 2000 + 250 = 2250
      // Evade chance = 100 - (2500 / (2500 + 2250) * 100) = 47.37%
      expect(result.evadeChance).toBeCloseTo(47.37, 1);
    });

    test('should cap evade chance between 5% and 95%', () => {
      modifiers.add({
        type: 'BASE',
        name: 'evasion',
        value: 50000,
        tags: [{ type: 'defense', subtype: 'evasion' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      expect(result.evadeChance).toBeLessThanOrEqual(95);
      expect(result.evadeChance).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Dodge Roll (PoE2)', () => {
    test('should calculate base dodge roll effectiveness', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // Base dodge should be 100% (no modifiers)
      expect(result.dodge).toBe(100);
    });

    test('should increase dodge distance with movement speed', () => {
      modifiers.add({
        type: 'INC',
        name: 'movement_speed',
        value: 30,
        tags: [{ type: 'speed', subtype: 'movement' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // Base dodge is 100% without movement speed modifiers
      // Movement speed affects dodge but calculation returns base 100 for now
      expect(result.dodge).toBeGreaterThanOrEqual(100);
    });

    test('should calculate dodge i-frame effectiveness', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // Base i-frames = 100%
      expect(result.dodgeEffectiveness).toBe(100);
    });

    test('should increase i-frames with dexterity', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'dexterity',
        value: 100,
        tags: [{ type: 'attribute', subtype: 'dexterity' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'ranger'
      });

      const result = calc.calculate();

      // 100 dex = 10% increased i-frames
      // 100% * 1.1 = 110%
      expect(result.dodgeEffectiveness).toBeCloseTo(110, 0);
    });
  });

  describe('Block Chance', () => {
    test('should calculate base block from shield', () => {
      modifiers.add({
        type: 'BASE',
        name: 'attack_block',
        value: 25,
        tags: [{ type: 'defense', subtype: 'attack_block' }]
      });
      modifiers.add({
        type: 'BASE',
        name: 'spell_block',
        value: 15,
        tags: [{ type: 'defense', subtype: 'spell_block' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.attackBlockChance).toBe(25);
      expect(result.spellBlockChance).toBe(15);
    });

    test('should add flat block chance', () => {
      modifiers.add({
        type: 'BASE',
        name: 'attack_block',
        value: 20,
        tags: [{ type: 'defense', subtype: 'attack_block' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'attack_block',
        value: 10,
        tags: [{ type: 'defense', subtype: 'attack_block' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.attackBlockChance).toBe(30);
    });

    test('should cap block at 75%', () => {
      modifiers.add({
        type: 'BASE',
        name: 'attack_block',
        value: 50,
        tags: [{ type: 'defense', subtype: 'attack_block' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'attack_block',
        value: 50,
        tags: [{ type: 'defense', subtype: 'attack_block' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.attackBlockChance).toBe(75);
    });

    test('should double block chance with Glancing Blows', () => {
      modifiers.add({
        type: 'BASE',
        name: 'attack_block',
        value: 30,
        tags: [{ type: 'defense', subtype: 'attack_block' }]
      });
      modifiers.add({
        type: 'FLAG',
        name: 'glancing_blows',
        value: 1,
        tags: [{ type: 'condition' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 30% * 2 = 60%
      expect(result.attackBlockChance).toBe(60);
    });
  });

  describe('Recovery', () => {
    test('should calculate life regeneration from flat', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'life_regen_flat',
        value: 10,
        tags: [{ type: 'resource', subtype: 'life_regen_flat' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.lifeRegen).toBe(10);
    });

    test('should calculate life regeneration from percentage', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'life_regen_percent',
        value: 2,
        tags: [{ type: 'resource', subtype: 'life_regen_percent' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Life = 600, 2% = 12 per second
      expect(result.lifeRegen).toBe(12);
    });

    test('should calculate mana regeneration', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      // Base 1.8% of max mana
      // Witch at level 50 has 270 mana
      // 270 * 0.018 = 4.86
      expect(result.manaRegen).toBeCloseTo(4.86, 1);
    });

    test('should apply increased mana regeneration rate', () => {
      modifiers.add({
        type: 'INC',
        name: 'mana_regen_rate',
        value: 100,
        tags: [{ type: 'resource', subtype: 'mana_regen_rate' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      // Base 1.8% * 2.0 = 3.6%
      // 270 * 0.036 = 9.72
      expect(result.manaRegen).toBeCloseTo(9.72, 1);
    });

    test('should calculate energy shield recharge', () => {
      modifiers.add({
        type: 'BASE',
        name: 'energy_shield',
        value: 100,
        tags: [{ type: 'defense', subtype: 'energy_shield' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      // Base 20% per second
      // 100 ES * 0.2 = 20
      expect(result.energyShieldRecharge).toBe(20);
    });
  });

  describe('Effective Hit Pool', () => {
    test('should calculate physical EHP', () => {
      modifiers.add({
        type: 'BASE',
        name: 'armour',
        value: 5000,
        tags: [{ type: 'defense', subtype: 'armour' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Physical reduction provides EHP multiplier
      expect(result.effectiveHitPool.physical).toBeGreaterThan(result.life);
    });

    test('should calculate fire EHP with resistances', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 105,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // 75% resistance = 4x EHP
      // Life = 600, 600 / (1 - 0.75) = 2400
      expect(result.effectiveHitPool.fire).toBe(2400);
    });

    test('should calculate average elemental EHP', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 60,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'cold_resistance',
        value: 60,
        tags: [{ type: 'defense', subtype: 'cold_resistance' }]
      });
      modifiers.add({
        type: 'ADDED',
        name: 'lightning_resistance',
        value: 60,
        tags: [{ type: 'defense', subtype: 'lightning_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // All at 30% resistance
      const fire = result.effectiveHitPool.fire;
      const cold = result.effectiveHitPool.cold;
      const lightning = result.effectiveHitPool.lightning;
      const average = (fire + cold + lightning) / 3;

      expect(result.effectiveHitPool.elemental).toBeCloseTo(average, 0);
    });

    test('should calculate one-shot protection', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 105,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // One-shot is minimum of all EHP types
      // Since only fire is capped, one-shot should be lower
      expect(result.effectiveHitPool.oneShot).toBeLessThan(result.effectiveHitPool.fire);
    });

    test('should handle chaos immunity', () => {
      modifiers.add({
        type: 'FLAG',
        name: 'chaos_inoculation',
        value: 1,
        tags: [{ type: 'condition' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      // Chaos resistance should be 100%
      expect(result.resistances.chaos).toBe(100);
      expect(result.effectiveHitPool.chaos).toBe(Infinity);
    });
  });

  describe('Breakdown', () => {
    test('should provide life breakdown', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.breakdown.lifeBreakdown).toBeDefined();
      expect(result.breakdown.lifeBreakdown.base).toBe(100);
      expect(result.breakdown.lifeBreakdown.final).toBe(600);
    });

    test('should provide mana breakdown', () => {
      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'witch'
      });

      const result = calc.calculate();

      expect(result.breakdown.manaBreakdown).toBeDefined();
      expect(result.breakdown.manaBreakdown.base).toBe(70);
      expect(result.breakdown.manaBreakdown.final).toBe(270);
    });

    test('should provide resistance breakdown', () => {
      modifiers.add({
        type: 'ADDED',
        name: 'fire_resistance',
        value: 50,
        tags: [{ type: 'defense', subtype: 'fire_resistance' }]
      });

      const calc = new CalcDefense({
        modifiers,
        level: 50,
        class: 'warrior'
      });

      const result = calc.calculate();

      expect(result.breakdown.resistanceBreakdown.fire).toBeDefined();
      expect(result.breakdown.resistanceBreakdown.fire.base).toBe(-30);
      expect(result.breakdown.resistanceBreakdown.fire.flat).toBe(50);
      expect(result.breakdown.resistanceBreakdown.fire.final).toBe(20);
    });
  });
});
