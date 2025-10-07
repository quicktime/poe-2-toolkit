/**
 * Tests for DoTCalculator
 */

import DoTCalculator from '../dot';
import { ModifierList } from '@/lib/calculator/ModifierList';
import type { DamageBreakdown, AilmentConfig } from '../dot';

describe('DoTCalculator', () => {
  let modifiers: ModifierList;
  let baseDamage: DamageBreakdown;

  beforeEach(() => {
    modifiers = new ModifierList();
    baseDamage = {
      physical: 0,
      fire: 0,
      cold: 0,
      lightning: 0,
      chaos: 0
    };
  });

  describe('Bleed Calculations', () => {
    test('should calculate base bleed damage', () => {
      baseDamage.physical = 1000;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 70% of 1000 over 5 seconds = 700 / 5 = 140 DPS
      expect(result.bleed.canApply).toBe(true);
      expect(result.bleed.baseDamagePerSecond).toBe(140);
      expect(result.bleed.totalDamagePerSecond).toBe(140);
      expect(result.bleed.duration).toBe(5);
      expect(result.bleed.totalDamage).toBe(700);
    });

    test('should triple bleed damage when enemy is moving', () => {
      baseDamage.physical = 1000;

      const config: AilmentConfig = { enemyIsMoving: true };
      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      // Base 140 DPS * 3 = 420 DPS
      expect(result.bleed.totalDamagePerSecond).toBe(420);
      expect(result.bleed.movingMultiplier).toBe(3);
      expect(result.bleed.totalDamage).toBe(2100); // 420 * 5
    });

    test('should apply increased bleed damage', () => {
      baseDamage.physical = 1000;
      modifiers.add({
        type: 'INC',
        name: 'bleed_damage',
        value: 50,
        tags: [{ type: 'damage', subtype: 'bleed' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 140 base * 1.5 = 210 DPS
      expect(result.bleed.totalDamagePerSecond).toBe(210);
    });

    test('should apply increased ailment damage to bleed', () => {
      baseDamage.physical = 1000;
      modifiers.add({
        type: 'INC',
        name: 'ailment_damage',
        value: 100,
        tags: [{ type: 'damage', subtype: 'ailment' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 140 base * 2.0 = 280 DPS
      expect(result.bleed.totalDamagePerSecond).toBe(280);
    });

    test('should apply more bleed damage multipliers', () => {
      baseDamage.physical = 1000;
      modifiers.add({
        type: 'MORE',
        name: 'bleed_damage',
        value: 30,
        tags: [{ type: 'damage', subtype: 'bleed' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 140 base * 1.3 = 182 DPS
      expect(result.bleed.totalDamagePerSecond).toBe(182);
    });

    test('should combine increased and more modifiers', () => {
      baseDamage.physical = 1000;
      modifiers.add({
        type: 'INC',
        name: 'bleed_damage',
        value: 50,
        tags: [{ type: 'damage', subtype: 'bleed' }]
      });
      modifiers.add({
        type: 'MORE',
        name: 'ailment_damage',
        value: 20,
        tags: [{ type: 'damage', subtype: 'ailment' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 140 * 1.5 * 1.2 = 252 DPS
      expect(result.bleed.totalDamagePerSecond).toBe(252);
    });

    test('should apply increased bleed duration', () => {
      baseDamage.physical = 1000;
      const config: AilmentConfig = { increasedBleedDuration: 50 };

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      // 5 seconds * 1.5 = 7.5 seconds
      expect(result.bleed.duration).toBe(7.5);
      // Total damage: 140 DPS * 7.5s = 1050
      expect(result.bleed.totalDamage).toBe(1050);
    });

    test('should not apply bleed with zero physical damage', () => {
      baseDamage.physical = 0;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      expect(result.bleed.canApply).toBe(false);
      expect(result.bleed.totalDamagePerSecond).toBe(0);
    });

    test('should not apply bleed when disabled', () => {
      baseDamage.physical = 1000;
      const config: AilmentConfig = { canBleed: false };

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      expect(result.bleed.canApply).toBe(false);
      expect(result.bleed.totalDamagePerSecond).toBe(0);
    });
  });

  describe('Ignite Calculations', () => {
    test('should calculate base ignite damage', () => {
      baseDamage.fire = 1000;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 20% of 1000 per second = 200 DPS
      expect(result.ignite.canApply).toBe(true);
      expect(result.ignite.baseDamagePerSecond).toBe(200);
      expect(result.ignite.totalDamagePerSecond).toBe(200);
      expect(result.ignite.duration).toBe(4);
      expect(result.ignite.totalDamage).toBe(800);
    });

    test('should apply increased ignite damage', () => {
      baseDamage.fire = 1000;
      modifiers.add({
        type: 'INC',
        name: 'ignite_damage',
        value: 75,
        tags: [{ type: 'damage', subtype: 'ignite' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 200 base * 1.75 = 350 DPS
      expect(result.ignite.totalDamagePerSecond).toBe(350);
    });

    test('should apply increased burning damage to ignite', () => {
      baseDamage.fire = 1000;
      modifiers.add({
        type: 'INC',
        name: 'burning_damage',
        value: 50,
        tags: [{ type: 'damage', subtype: 'burning' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 200 base * 1.5 = 300 DPS
      expect(result.ignite.totalDamagePerSecond).toBe(300);
    });

    test('should apply more ignite damage multipliers', () => {
      baseDamage.fire = 1000;
      modifiers.add({
        type: 'MORE',
        name: 'ignite_damage',
        value: 40,
        tags: [{ type: 'damage', subtype: 'ignite' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 200 base * 1.4 = 280 DPS
      expect(result.ignite.totalDamagePerSecond).toBe(280);
    });

    test('should combine multiple damage type modifiers', () => {
      baseDamage.fire = 1000;
      modifiers.add({
        type: 'INC',
        name: 'burning_damage',
        value: 50,
        tags: [{ type: 'damage', subtype: 'burning' }]
      });
      modifiers.add({
        type: 'INC',
        name: 'fire_dot',
        value: 30,
        tags: [{ type: 'damage', subtype: 'fire_dot' }]
      });
      modifiers.add({
        type: 'MORE',
        name: 'ailment_damage',
        value: 25,
        tags: [{ type: 'damage', subtype: 'ailment' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 200 * (1 + 0.5 + 0.3) * 1.25 = 200 * 1.8 * 1.25 = 450 DPS
      expect(result.ignite.totalDamagePerSecond).toBe(450);
    });

    test('should apply increased ignite duration', () => {
      baseDamage.fire = 1000;
      const config: AilmentConfig = { increasedIgniteDuration: 100 };

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      // 4 seconds * 2.0 = 8 seconds
      expect(result.ignite.duration).toBe(8);
      // Total damage: 200 DPS * 8s = 1600
      expect(result.ignite.totalDamage).toBe(1600);
    });

    test('should not apply ignite with zero fire damage', () => {
      baseDamage.fire = 0;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      expect(result.ignite.canApply).toBe(false);
      expect(result.ignite.totalDamagePerSecond).toBe(0);
    });
  });

  describe('Poison Calculations', () => {
    test('should calculate base poison damage from physical', () => {
      baseDamage.physical = 1000;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 30% of 1000 per second = 300 DPS
      expect(result.poison.canApply).toBe(true);
      expect(result.poison.baseDamagePerSecond).toBe(300);
      expect(result.poison.totalDamagePerSecond).toBe(300);
      expect(result.poison.duration).toBe(2);
      expect(result.poison.totalDamagePerStack).toBe(600);
    });

    test('should calculate poison damage from physical + chaos', () => {
      baseDamage.physical = 600;
      baseDamage.chaos = 400;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 30% of 1000 per second = 300 DPS
      expect(result.poison.baseDamagePerSecond).toBe(300);
    });

    test('should handle poison stacking', () => {
      baseDamage.physical = 1000;
      const config: AilmentConfig = { maxPoisonStacks: 5 };

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      expect(result.poison.maxStacks).toBe(5);
      expect(result.poison.totalDPSWithStacks).toBe(1500); // 300 * 5
    });

    test('should apply increased max poison stacks', () => {
      baseDamage.physical = 1000;
      const config: AilmentConfig = { maxPoisonStacks: 3 };
      modifiers.add({
        type: 'ADDED',
        name: 'max_poison_stacks',
        value: 2,
        tags: [{ type: 'ailment', subtype: 'max_poison_stacks' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      // Base 3 + 2 from modifiers = 5 stacks
      expect(result.poison.maxStacks).toBe(5);
      expect(result.poison.totalDPSWithStacks).toBe(1500);
    });

    test('should apply increased poison damage', () => {
      baseDamage.physical = 1000;
      modifiers.add({
        type: 'INC',
        name: 'poison_damage',
        value: 100,
        tags: [{ type: 'damage', subtype: 'poison' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // 300 base * 2.0 = 600 DPS
      expect(result.poison.totalDamagePerSecond).toBe(600);
    });

    test('should apply increased poison duration', () => {
      baseDamage.physical = 1000;
      const config: AilmentConfig = { increasedPoisonDuration: 50 };

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      // 2 seconds * 1.5 = 3 seconds
      expect(result.poison.duration).toBe(3);
      // Total damage per stack: 300 DPS * 3s = 900
      expect(result.poison.totalDamagePerStack).toBe(900);
    });

    test('should not apply poison with zero physical and chaos damage', () => {
      baseDamage.physical = 0;
      baseDamage.chaos = 0;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      expect(result.poison.canApply).toBe(false);
      expect(result.poison.totalDamagePerSecond).toBe(0);
    });
  });

  describe('Combined Calculations', () => {
    test('should calculate total DoT DPS from all ailments', () => {
      baseDamage.physical = 1000;
      baseDamage.fire = 500;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // Bleed: 140 DPS
      // Ignite: 100 DPS
      // Poison: 300 DPS (1 stack)
      // Total: 540 DPS
      expect(result.totalDoTDPS).toBe(540);
    });

    test('should calculate total with stacking poison', () => {
      baseDamage.physical = 1000;
      baseDamage.fire = 500;
      const config: AilmentConfig = { maxPoisonStacks: 3 };

      const calc = new DoTCalculator({ baseDamage, modifiers, config });
      const result = calc.calculate();

      // Bleed: 140 DPS
      // Ignite: 100 DPS
      // Poison: 300 * 3 = 900 DPS
      // Total: 1140 DPS
      expect(result.totalDoTDPS).toBe(1140);
    });

    test('should apply generic ailment modifiers to all ailments', () => {
      baseDamage.physical = 1000;
      baseDamage.fire = 1000;
      modifiers.add({
        type: 'INC',
        name: 'ailment_damage',
        value: 100,
        tags: [{ type: 'damage', subtype: 'ailment' }]
      });

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const result = calc.calculate();

      // Bleed: 140 * 2 = 280 DPS
      // Ignite: 200 * 2 = 400 DPS
      // Poison: 300 * 2 = 600 DPS
      // Total: 1280 DPS
      expect(result.bleed.totalDamagePerSecond).toBe(280);
      expect(result.ignite.totalDamagePerSecond).toBe(400);
      expect(result.poison.totalDamagePerSecond).toBe(600);
      expect(result.totalDoTDPS).toBe(1280);
    });
  });

  describe('Effective DPS with Enemy Resistances', () => {
    test('should calculate effective DPS against resistant enemy', () => {
      baseDamage.physical = 1000;
      baseDamage.fire = 1000;
      baseDamage.chaos = 500;

      const calc = new DoTCalculator({ baseDamage, modifiers });

      // Enemy with 50% resistances
      const effectiveDPS = calc.calculateEffectiveDPS({
        physical: 50,
        fire: 50,
        chaos: 50
      });

      // Bleed: 140 * 0.5 = 70
      // Ignite: 200 * 0.5 = 100
      // Poison: 450 * 0.5 = 225  (30% of 1500 combined)
      // Total: 395
      expect(effectiveDPS).toBeCloseTo(395, 0);
    });

    test('should handle zero resistance', () => {
      baseDamage.physical = 1000;
      baseDamage.fire = 1000;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const effectiveDPS = calc.calculateEffectiveDPS({});

      // Same as totalDoTDPS
      const result = calc.calculate();
      expect(effectiveDPS).toBe(result.totalDoTDPS);
    });

    test('should handle negative resistance (vulnerability)', () => {
      baseDamage.physical = 1000;

      const calc = new DoTCalculator({ baseDamage, modifiers });
      const effectiveDPS = calc.calculateEffectiveDPS({
        physical: -30, // 30% more damage taken
        chaos: -30     // Also affects poison
      });

      // Bleed: 140 * 1.3 = 182
      // Poison: 300 * 1.3 = 390 (poison uses physical + chaos)
      // Total: 182 + 390 = 572
      expect(effectiveDPS).toBeCloseTo(572, 0);
    });
  });
});
