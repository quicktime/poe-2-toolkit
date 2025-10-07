import { SkillCalculator } from '../skills';
import type { SkillModifier, DamageRange, ElementalDamage } from '@/types/skills';

describe('SkillCalculator', () => {
  describe('getModifierType', () => {
    it('should identify added modifiers', () => {
      // Access private method through any
      const result = (SkillCalculator as any).getModifierType('added_physical_damage');
      expect(result).toBe('added');
    });

    it('should identify more modifiers', () => {
      const result = (SkillCalculator as any).getModifierType('more_damage');
      expect(result).toBe('more');
    });

    it('should identify less modifiers as more', () => {
      const result = (SkillCalculator as any).getModifierType('less_attack_speed');
      expect(result).toBe('more');
    });

    it('should identify increased modifiers', () => {
      const result = (SkillCalculator as any).getModifierType('increased_crit');
      expect(result).toBe('increased');
    });

    it('should identify reduced modifiers as increased', () => {
      const result = (SkillCalculator as any).getModifierType('reduced_mana_cost');
      expect(result).toBe('increased');
    });

    it('should default to base for unknown types', () => {
      const result = (SkillCalculator as any).getModifierType('unknown_stat');
      expect(result).toBe('base');
    });
  });

  describe('applyModifiers', () => {
    it('should apply added damage modifiers', () => {
      const baseDamage: DamageRange = { min: 100, max: 200 };
      const modifiers: SkillModifier[] = [
        { source: 'Ring', stat: 'added_physical_damage', value: 50, type: 'added' }
      ];

      const result = (SkillCalculator as any).applyModifiers(baseDamage, modifiers, 'physical');
      expect(result.min).toBe(150);
      expect(result.max).toBe(250);
    });

    it('should apply increased damage modifiers', () => {
      const baseDamage: DamageRange = { min: 100, max: 200 };
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_damage', value: 50, type: 'increased' }
      ];

      const result = (SkillCalculator as any).applyModifiers(baseDamage, modifiers, 'physical');
      expect(result.min).toBe(150);
      expect(result.max).toBe(300);
    });

    it('should apply more damage modifiers multiplicatively', () => {
      const baseDamage: DamageRange = { min: 100, max: 200 };
      const modifiers: SkillModifier[] = [
        { source: 'Support', stat: 'more_damage', value: 50, type: 'more' }
      ];

      const result = (SkillCalculator as any).applyModifiers(baseDamage, modifiers, 'physical');
      expect(result.min).toBe(150);
      expect(result.max).toBe(300);
    });

    it('should combine all modifier types correctly', () => {
      const baseDamage: DamageRange = { min: 100, max: 100 };
      const modifiers: SkillModifier[] = [
        { source: 'Ring', stat: 'added_physical_damage', value: 50, type: 'added' },
        { source: 'Passive', stat: 'increased_damage', value: 100, type: 'increased' },
        { source: 'Support', stat: 'more_damage', value: 50, type: 'more' }
      ];

      const result = (SkillCalculator as any).applyModifiers(baseDamage, modifiers, 'physical');
      // (100 + 50) * 2.0 * 1.5 = 450
      expect(result.min).toBe(450);
      expect(result.max).toBe(450);
    });

    it('should floor the final damage values', () => {
      const baseDamage: DamageRange = { min: 100, max: 100 };
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_damage', value: 33, type: 'increased' }
      ];

      const result = (SkillCalculator as any).applyModifiers(baseDamage, modifiers, 'physical');
      expect(result.min).toBe(133); // floor(133)
      expect(result.max).toBe(133);
    });

    it('should handle negative modifiers (reduced/less)', () => {
      const baseDamage: DamageRange = { min: 100, max: 200 };
      const modifiers: SkillModifier[] = [
        { source: 'Debuff', stat: 'increased_damage', value: -25, type: 'increased' }
      ];

      const result = (SkillCalculator as any).applyModifiers(baseDamage, modifiers, 'physical');
      expect(result.min).toBe(75);
      expect(result.max).toBe(150);
    });
  });

  describe('calculateDamagePerHit', () => {
    it('should calculate average damage from all sources', () => {
      const physical: DamageRange = { min: 100, max: 200 };
      const elemental: ElementalDamage = {
        fire: { min: 50, max: 100 },
        cold: { min: 25, max: 75 },
        lightning: { min: 10, max: 30 }
      };

      const result = (SkillCalculator as any).calculateDamagePerHit(physical, elemental);
      // avg(100,200) + avg(50,100) + avg(25,75) + avg(10,30)
      // = 150 + 75 + 50 + 20 = 295
      expect(result).toBe(295);
    });

    it('should handle zero elemental damage', () => {
      const physical: DamageRange = { min: 100, max: 200 };
      const elemental: ElementalDamage = {
        fire: { min: 0, max: 0 },
        cold: { min: 0, max: 0 },
        lightning: { min: 0, max: 0 }
      };

      const result = (SkillCalculator as any).calculateDamagePerHit(physical, elemental);
      expect(result).toBe(150);
    });

    it('should handle zero physical damage', () => {
      const physical: DamageRange = { min: 0, max: 0 };
      const elemental: ElementalDamage = {
        fire: { min: 100, max: 200 },
        cold: { min: 0, max: 0 },
        lightning: { min: 0, max: 0 }
      };

      const result = (SkillCalculator as any).calculateDamagePerHit(physical, elemental);
      expect(result).toBe(150);
    });
  });

  describe('calculateAttackSpeed', () => {
    it('should calculate attack speed for attack skills', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_attack_speed', value: 50, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateAttackSpeed(1.0, modifiers, ['attack']);
      expect(result).toBe(1.5);
    });

    it('should calculate cast speed for spell skills', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_cast_speed', value: 30, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateAttackSpeed(1.0, modifiers, ['spell']);
      expect(result).toBe(1.3);
    });

    it('should apply more speed modifiers multiplicatively', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_attack_speed', value: 50, type: 'increased' },
        { source: 'Support', stat: 'more_attack_speed', value: 20, type: 'more' }
      ];

      const result = (SkillCalculator as any).calculateAttackSpeed(1.0, modifiers, ['attack']);
      // 1.0 * 1.5 * 1.2 = 1.8
      expect(result).toBeCloseTo(1.8, 5);
    });

    it('should handle base speed greater than 1.0', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_attack_speed', value: 100, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateAttackSpeed(2.0, modifiers, ['attack']);
      expect(result).toBe(4.0);
    });

    it('should handle negative modifiers (reduced speed)', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Support', stat: 'increased_attack_speed', value: -30, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateAttackSpeed(1.0, modifiers, ['attack']);
      expect(result).toBe(0.7);
    });
  });

  describe('calculateCriticalChance', () => {
    it('should calculate crit chance with increased modifiers', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_critical_strike_chance', value: 100, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateCriticalChance(5, modifiers);
      expect(result).toBe(10);
    });

    it('should add flat crit chance', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Item', stat: 'base_critical_strike_chance', value: 3, type: 'base' }
      ];

      const result = (SkillCalculator as any).calculateCriticalChance(5, modifiers);
      expect(result).toBe(8);
    });

    it('should combine increased and flat crit', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_critical_strike_chance', value: 100, type: 'increased' },
        { source: 'Item', stat: 'base_critical_strike_chance', value: 2, type: 'base' }
      ];

      const result = (SkillCalculator as any).calculateCriticalChance(5, modifiers);
      // 5 * 2.0 + 2 = 12
      expect(result).toBe(12);
    });

    it('should cap crit chance at 100%', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_critical_strike_chance', value: 1000, type: 'increased' },
        { source: 'Item', stat: 'base_critical_strike_chance', value: 50, type: 'base' }
      ];

      const result = (SkillCalculator as any).calculateCriticalChance(10, modifiers);
      expect(result).toBe(100);
    });
  });

  describe('calculateCriticalMultiplier', () => {
    it('should add increased multiplier to base', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_critical_strike_multiplier', value: 50, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateCriticalMultiplier(150, modifiers);
      expect(result).toBe(200);
    });

    it('should sum multiple multiplier modifiers', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive 1', stat: 'increased_critical_strike_multiplier', value: 30, type: 'increased' },
        { source: 'Passive 2', stat: 'increased_critical_strike_multiplier', value: 20, type: 'increased' },
        { source: 'Item', stat: 'critical_strike_multiplier', value: 25, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateCriticalMultiplier(150, modifiers);
      expect(result).toBe(225); // 150 + 30 + 20 + 25
    });

    it('should handle negative multiplier (reduced)', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Debuff', stat: 'critical_strike_multiplier', value: -25, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateCriticalMultiplier(150, modifiers);
      expect(result).toBe(125);
    });
  });

  describe('calculateDPS', () => {
    it('should calculate DPS without crits', () => {
      const result = (SkillCalculator as any).calculateDPS(100, 2.0, 0, 150);
      expect(result).toBe(200); // 100 * 2.0, no crits
    });

    it('should calculate DPS with 100% crit chance', () => {
      const result = (SkillCalculator as any).calculateDPS(100, 2.0, 100, 200);
      // 100 * (1 + 1.0 * (2.0 - 1)) * 2.0 = 100 * 2.0 * 2.0 = 400
      expect(result).toBe(400);
    });

    it('should calculate DPS with 50% crit chance', () => {
      const result = (SkillCalculator as any).calculateDPS(100, 2.0, 50, 200);
      // 100 * (1 + 0.5 * (2.0 - 1)) * 2.0 = 100 * 1.5 * 2.0 = 300
      expect(result).toBe(300);
    });

    it('should floor the final DPS value', () => {
      const result = (SkillCalculator as any).calculateDPS(100, 1.33, 25, 175);
      // Should be floored
      expect(result).toBe(Math.floor(100 * (1 + 0.25 * 0.75) * 1.33));
    });

    it('should handle high crit multiplier', () => {
      const result = (SkillCalculator as any).calculateDPS(100, 1.0, 50, 500);
      // 100 * (1 + 0.5 * (5.0 - 1)) * 1.0 = 100 * 3.0 = 300
      expect(result).toBe(300);
    });
  });

  describe('calculateManaCost', () => {
    it('should calculate base mana cost', () => {
      const result = (SkillCalculator as any).calculateManaCost(50, []);
      expect(result).toBe(50);
    });

    it('should apply increased mana cost', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Support', stat: 'increased_mana_cost', value: 50, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateManaCost(50, modifiers);
      expect(result).toBe(75);
    });

    it('should apply reduced mana cost', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_mana_cost', value: -40, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateManaCost(50, modifiers);
      expect(result).toBe(30);
    });

    it('should apply more mana cost multipliers', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Support', stat: 'more_mana_cost', value: 100, type: 'more' }
      ];

      const result = (SkillCalculator as any).calculateManaCost(50, modifiers);
      expect(result).toBe(100);
    });

    it('should combine increased and more modifiers', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Support 1', stat: 'increased_mana_cost', value: 50, type: 'increased' },
        { source: 'Support 2', stat: 'more_mana_cost', value: 30, type: 'more' }
      ];

      const result = (SkillCalculator as any).calculateManaCost(50, modifiers);
      // 50 * 1.5 * 1.3 = 97.5, ceil to 98
      expect(result).toBe(98);
    });

    it('should ceil the final mana cost', () => {
      const modifiers: SkillModifier[] = [
        { source: 'Passive', stat: 'increased_mana_cost', value: -33, type: 'increased' }
      ];

      const result = (SkillCalculator as any).calculateManaCost(50, modifiers);
      // 50 * 0.67 = 33.5, ceil to 34
      expect(result).toBe(34);
    });
  });
});
