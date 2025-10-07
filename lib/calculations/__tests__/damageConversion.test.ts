/**
 * Tests for DamageConversionManager
 * Path of Exile 2 v0.3+ damage conversion mechanics
 */

import { DamageConversionManager, DamageBreakdown, ConversionStep } from '../damageConversion';
import { ModifierList } from '@/lib/calculator/ModifierList';

describe('DamageConversionManager', () => {
  let manager: DamageConversionManager;
  let modifiers: ModifierList;
  let baseDamage: DamageBreakdown;

  beforeEach(() => {
    manager = new DamageConversionManager();
    modifiers = new ModifierList();
    baseDamage = {
      physical: 1000,
      fire: 0,
      cold: 0,
      lightning: 0,
      chaos: 0,
    };
  });

  describe('Physical Conversion Chain', () => {
    test('should convert physical to fire', () => {
      modifiers.parseAndAdd('50% of physical damage converted to fire damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(500);
      expect(result.finalDamage.fire).toBe(500);
      expect(result.conversions).toHaveLength(1);
      expect(result.conversions[0]).toMatchObject({
        from: 'physical',
        to: 'fire',
        percentage: 50,
      });
    });

    test('should convert physical to lightning', () => {
      modifiers.parseAndAdd('60% of physical damage converted to lightning damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(400);
      expect(result.finalDamage.lightning).toBe(600);
    });

    test('should convert physical to cold', () => {
      modifiers.parseAndAdd('40% of physical damage converted to cold damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(600);
      expect(result.finalDamage.cold).toBe(400);
    });

    test('should follow conversion priority: lightning > cold > fire', () => {
      // All three conversions present
      modifiers.parseAndAdd('40% of physical damage converted to fire damage');
      modifiers.parseAndAdd('30% of physical damage converted to cold damage');
      modifiers.parseAndAdd('50% of physical damage converted to lightning damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      // Lightning applies first: 50%
      expect(result.finalDamage.lightning).toBe(500);
      // Cold applies second: 30% of remaining
      expect(result.finalDamage.cold).toBe(300);
      // Fire applies third: 20% of remaining (capped at 100% total)
      expect(result.finalDamage.fire).toBe(200);
      // Physical remaining: 0
      expect(result.finalDamage.physical).toBe(0);
    });

    test('should cap total conversion at 100%', () => {
      modifiers.parseAndAdd('60% of physical damage converted to fire damage');
      modifiers.parseAndAdd('50% of physical damage converted to cold damage');
      modifiers.parseAndAdd('40% of physical damage converted to lightning damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      // Lightning: 40% (first in priority, under cap)
      // Cold: 50% (second, but capped at remaining 60%)
      // Fire: 10% (third, capped at remaining 10%)
      // Total: 100%
      expect(result.finalDamage.lightning).toBe(400);
      expect(result.finalDamage.cold).toBe(500);
      expect(result.finalDamage.fire).toBe(100);
      expect(result.finalDamage.physical).toBe(0);
    });
  });

  describe('Elemental Conversion Chain', () => {
    test('should convert lightning to cold', () => {
      baseDamage.lightning = 500;
      baseDamage.physical = 0;

      modifiers.parseAndAdd('50% of lightning damage converted to cold damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.lightning).toBe(250);
      expect(result.finalDamage.cold).toBe(250);
    });

    test('should convert lightning to fire', () => {
      baseDamage.lightning = 500;
      baseDamage.physical = 0;

      modifiers.parseAndAdd('60% of lightning damage converted to fire damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.lightning).toBe(200);
      expect(result.finalDamage.fire).toBe(300);
    });

    test('should convert cold to fire', () => {
      baseDamage.cold = 500;
      baseDamage.physical = 0;

      modifiers.parseAndAdd('40% of cold damage converted to fire damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.cold).toBe(300);
      expect(result.finalDamage.fire).toBe(200);
    });

    test('should convert fire to chaos', () => {
      baseDamage.fire = 500;
      baseDamage.physical = 0;

      modifiers.parseAndAdd('50% of fire damage converted to chaos damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.fire).toBe(250);
      expect(result.finalDamage.chaos).toBe(250);
    });
  });

  describe('Full Conversion Chain', () => {
    test('should apply full chain: physical → lightning → cold → fire → chaos', () => {
      // Start with physical
      modifiers.parseAndAdd('50% of physical damage converted to lightning damage');
      modifiers.parseAndAdd('40% of lightning damage converted to cold damage');
      modifiers.parseAndAdd('30% of cold damage converted to fire damage');
      modifiers.parseAndAdd('50% of fire damage converted to chaos damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      // Physical: 1000 * 50% = 500 → lightning, 500 remains
      expect(result.finalDamage.physical).toBe(500);

      // Lightning: 500 * 40% = 200 → cold, 300 remains
      expect(result.finalDamage.lightning).toBe(300);

      // Cold: 200 * 30% = 60 → fire, 140 remains
      expect(result.finalDamage.cold).toBe(140);

      // Fire: 60 * 50% = 30 → chaos, 30 remains
      expect(result.finalDamage.fire).toBe(30);

      // Chaos: 30 from fire conversion
      expect(result.finalDamage.chaos).toBe(30);

      // Total damage should be preserved
      const total = manager.calculateTotalDamage(result.finalDamage);
      expect(total).toBe(1000);
    });

    test('should handle 100% conversion through entire chain', () => {
      modifiers.parseAndAdd('100% of physical damage converted to lightning damage');
      modifiers.parseAndAdd('100% of lightning damage converted to cold damage');
      modifiers.parseAndAdd('100% of cold damage converted to fire damage');
      modifiers.parseAndAdd('100% of fire damage converted to chaos damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(0);
      expect(result.finalDamage.lightning).toBe(0);
      expect(result.finalDamage.cold).toBe(0);
      expect(result.finalDamage.fire).toBe(0);
      expect(result.finalDamage.chaos).toBe(1000);
    });
  });

  describe('Gain as Extra', () => {
    test('should add extra fire damage without reducing physical', () => {
      modifiers.parseAndAdd('Gain 20% of physical damage as extra fire damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(1000); // Unchanged
      expect(result.finalDamage.fire).toBe(200); // 20% extra
      expect(result.gainAsExtra).toHaveLength(1);
      expect(result.gainAsExtra[0]).toMatchObject({
        type: 'fire',
        amount: 200,
      });

      const total = manager.calculateTotalDamage(result.finalDamage);
      expect(total).toBe(1200); // Total increased
    });

    test('should add extra cold damage without reducing physical', () => {
      modifiers.parseAndAdd('Gain 15% of physical damage as extra cold damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(1000);
      expect(result.finalDamage.cold).toBe(150);
    });

    test('should add extra chaos damage without reducing physical', () => {
      modifiers.parseAndAdd('Gain 25% of physical damage as extra chaos damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(1000);
      expect(result.finalDamage.chaos).toBe(250);
    });

    test('should combine conversion and gain as extra correctly', () => {
      // Convert 50% physical to fire
      modifiers.parseAndAdd('50% of physical damage converted to fire damage');
      // Gain 30% of ORIGINAL physical as extra chaos
      modifiers.parseAndAdd('Gain 30% of physical damage as extra chaos damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      // Conversion uses base physical (1000)
      expect(result.finalDamage.physical).toBe(500); // 50% converted
      expect(result.finalDamage.fire).toBe(500); // From conversion

      // Gain as extra uses ORIGINAL base damage (1000)
      expect(result.finalDamage.chaos).toBe(300); // 30% of original 1000

      const total = manager.calculateTotalDamage(result.finalDamage);
      expect(total).toBe(1300); // 1000 + 300 extra
    });

    test('should handle multiple gain as extra modifiers', () => {
      modifiers.parseAndAdd('Gain 10% of physical damage as extra fire damage');
      modifiers.parseAndAdd('Gain 15% of physical damage as extra cold damage');
      modifiers.parseAndAdd('Gain 20% of physical damage as extra lightning damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(1000);
      expect(result.finalDamage.fire).toBe(100);
      expect(result.finalDamage.cold).toBe(150);
      expect(result.finalDamage.lightning).toBe(200);
      expect(result.gainAsExtra).toHaveLength(3);

      const total = manager.calculateTotalDamage(result.finalDamage);
      expect(total).toBe(1450);
    });
  });

  describe('Skill Conversions', () => {
    test('should apply skill conversions before gear conversions', () => {
      const skillConversions: ConversionStep[] = [
        { from: 'physical', to: 'fire', percentage: 50, source: 'skill' },
      ];

      // Gear also has physical to cold conversion
      modifiers.parseAndAdd('30% of physical damage converted to cold damage');

      const result = manager.applyConversions(baseDamage, modifiers, skillConversions);

      // Skill conversion applies first: 50% to fire
      // Gear conversion applies to remaining: 30% of remaining 50% = 15% total
      expect(result.finalDamage.fire).toBe(500);
      expect(result.finalDamage.cold).toBe(300);
      expect(result.finalDamage.physical).toBe(200);

      // Check conversions include both sources
      const skillConv = result.conversions.filter(c => c.source === 'skill');
      const gearConv = result.conversions.filter(c => c.source === 'gear');
      expect(skillConv).toHaveLength(1);
      expect(gearConv).toHaveLength(1);
    });

    test('should respect 100% conversion cap with skill conversions', () => {
      const skillConversions: ConversionStep[] = [
        { from: 'physical', to: 'lightning', percentage: 60, source: 'skill' },
      ];

      modifiers.parseAndAdd('50% of physical damage converted to fire damage');
      modifiers.parseAndAdd('30% of physical damage converted to cold damage');

      const result = manager.applyConversions(baseDamage, modifiers, skillConversions);

      // Skill: 60% to lightning
      expect(result.finalDamage.lightning).toBe(600);
      // Cold has higher priority than fire in conversion chain
      // Cold: 30% of original (capped at remaining 40%)
      expect(result.finalDamage.cold).toBe(300);
      // Fire: wants 50%, but only 10% capacity left (100% - 60% - 30%)
      expect(result.finalDamage.fire).toBe(100);
      expect(result.finalDamage.physical).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    test('should calculate total damage correctly', () => {
      const damage: DamageBreakdown = {
        physical: 100,
        fire: 200,
        cold: 150,
        lightning: 300,
        chaos: 250,
      };

      const total = manager.calculateTotalDamage(damage);
      expect(total).toBe(1000);
    });

    test('should calculate damage breakdown percentages', () => {
      const damage: DamageBreakdown = {
        physical: 400,
        fire: 200,
        cold: 200,
        lightning: 100,
        chaos: 100,
      };

      const percentages = manager.getDamageBreakdownPercentages(damage);

      expect(percentages.physical).toBe(40);
      expect(percentages.fire).toBe(20);
      expect(percentages.cold).toBe(20);
      expect(percentages.lightning).toBe(10);
      expect(percentages.chaos).toBe(10);
    });

    test('should handle zero damage in percentage calculation', () => {
      const damage: DamageBreakdown = {
        physical: 0,
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0,
      };

      const percentages = manager.getDamageBreakdownPercentages(damage);

      expect(percentages.physical).toBe(0);
      expect(percentages.fire).toBe(0);
      expect(percentages.cold).toBe(0);
      expect(percentages.lightning).toBe(0);
      expect(percentages.chaos).toBe(0);
    });

    test('should validate conversions within 100% limit', () => {
      const conversions: ConversionStep[] = [
        { from: 'physical', to: 'fire', percentage: 50, source: 'skill' },
        { from: 'physical', to: 'cold', percentage: 30, source: 'gear' },
      ];

      const validation = manager.validateConversions(conversions);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid conversions exceeding 100%', () => {
      const conversions: ConversionStep[] = [
        { from: 'physical', to: 'fire', percentage: 60, source: 'skill' },
        { from: 'physical', to: 'cold', percentage: 50, source: 'gear' },
        { from: 'physical', to: 'lightning', percentage: 30, source: 'gear' },
      ];

      const validation = manager.validateConversions(conversions);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('physical');
      expect(validation.errors[0]).toContain('140%');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero base damage', () => {
      baseDamage.physical = 0;
      modifiers.parseAndAdd('50% of physical damage converted to fire damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      expect(result.finalDamage.physical).toBe(0);
      expect(result.finalDamage.fire).toBe(0);
    });

    test('should preserve total damage through complex conversions', () => {
      baseDamage = {
        physical: 500,
        fire: 300,
        cold: 200,
        lightning: 0,
        chaos: 0,
      };

      modifiers.parseAndAdd('30% of physical damage converted to lightning damage');
      modifiers.parseAndAdd('40% of cold damage converted to fire damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      const originalTotal = manager.calculateTotalDamage(baseDamage);
      const finalTotal = manager.calculateTotalDamage(result.finalDamage);

      expect(finalTotal).toBe(originalTotal);
    });

    test('should handle multiple elemental conversions simultaneously', () => {
      baseDamage = {
        physical: 0,
        fire: 300,
        cold: 400,
        lightning: 300,
        chaos: 0,
      };

      modifiers.parseAndAdd('50% of fire damage converted to chaos damage');
      modifiers.parseAndAdd('40% of cold damage converted to fire damage');
      modifiers.parseAndAdd('30% of lightning damage converted to cold damage');

      const result = manager.applyConversions(baseDamage, modifiers);

      // Complex chain, but total should be preserved
      const total = manager.calculateTotalDamage(result.finalDamage);
      expect(total).toBe(1000);
    });
  });
});
