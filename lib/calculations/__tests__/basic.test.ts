import {
  averageDamage,
  calculateDps,
  calculateEffectiveHp,
  calculateCriticalChance,
  calculateManaReservation,
  parseItemProperty,
  calculateWeaponDps,
  calculateTotalResistances,
  calculateExperienceForLevel,
  calculateLevelProgress,
  type DamageRange
} from '../basic';
import type { CharacterItem, ItemProperty } from '@/types/character';

describe('basic calculations', () => {
  describe('averageDamage', () => {
    it('should calculate average damage correctly', () => {
      expect(averageDamage({ min: 10, max: 20 })).toBe(15);
    });

    it('should handle equal min and max', () => {
      expect(averageDamage({ min: 50, max: 50 })).toBe(50);
    });

    it('should handle zero damage', () => {
      expect(averageDamage({ min: 0, max: 0 })).toBe(0);
    });

    it('should handle decimal values', () => {
      expect(averageDamage({ min: 10.5, max: 20.5 })).toBe(15.5);
    });
  });

  describe('calculateDps', () => {
    it('should calculate DPS correctly', () => {
      const damage: DamageRange = { min: 100, max: 200 };
      const attackSpeed = 2.0;
      expect(calculateDps(damage, attackSpeed)).toBe(300); // avg(150) * 2
    });

    it('should handle 1.0 attack speed', () => {
      const damage: DamageRange = { min: 50, max: 100 };
      expect(calculateDps(damage, 1.0)).toBe(75);
    });

    it('should handle slow attack speed', () => {
      const damage: DamageRange = { min: 100, max: 200 };
      expect(calculateDps(damage, 0.5)).toBe(75);
    });

    it('should handle fast attack speed', () => {
      const damage: DamageRange = { min: 10, max: 20 };
      expect(calculateDps(damage, 5.0)).toBe(75);
    });
  });

  describe('calculateEffectiveHp', () => {
    it('should calculate base EHP with no mitigation', () => {
      const ehp = calculateEffectiveHp(1000, 0, 0, 0, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });
      expect(ehp).toBeGreaterThanOrEqual(1000);
    });

    it('should increase EHP with resistances', () => {
      const noResEhp = calculateEffectiveHp(1000, 0, 0, 0, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });

      const withResEhp = calculateEffectiveHp(1000, 0, 0, 0, {
        fire: 75,
        cold: 75,
        lightning: 75,
        chaos: 0
      });

      expect(withResEhp).toBeGreaterThan(noResEhp);
    });

    it('should include energy shield in EHP', () => {
      const ehp = calculateEffectiveHp(1000, 500, 0, 0, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });
      expect(ehp).toBeGreaterThan(1000);
    });

    it('should increase EHP with armour', () => {
      const noArmourEhp = calculateEffectiveHp(1000, 0, 0, 0, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });

      const withArmourEhp = calculateEffectiveHp(1000, 0, 10000, 0, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });

      expect(withArmourEhp).toBeGreaterThan(noArmourEhp);
    });

    it('should increase EHP with evasion', () => {
      const noEvasionEhp = calculateEffectiveHp(1000, 0, 0, 0, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });

      const withEvasionEhp = calculateEffectiveHp(1000, 0, 0, 20000, {
        fire: 0,
        cold: 0,
        lightning: 0,
        chaos: 0
      });

      expect(withEvasionEhp).toBeGreaterThan(noEvasionEhp);
    });
  });

  describe('calculateCriticalChance', () => {
    it('should calculate crit chance with 100% accuracy', () => {
      const crit = calculateCriticalChance(5, 0, 100);
      expect(crit).toBe(5);
    });

    it('should reduce crit chance with lower accuracy', () => {
      const highAccuracy = calculateCriticalChance(5, 0, 100);
      const lowAccuracy = calculateCriticalChance(5, 0, 50);
      expect(lowAccuracy).toBeLessThan(highAccuracy);
    });

    it('should apply increased crit modifier', () => {
      const baseCrit = calculateCriticalChance(5, 0, 100);
      const increasedCrit = calculateCriticalChance(5, 100, 100); // 100% increased
      expect(increasedCrit).toBeGreaterThan(baseCrit);
    });

    it('should cap crit chance at 100%', () => {
      const crit = calculateCriticalChance(50, 200, 100); // Would be 150%
      expect(crit).toBeLessThanOrEqual(100);
    });

    it('should handle 0% accuracy', () => {
      const crit = calculateCriticalChance(5, 0, 0);
      expect(crit).toBe(0);
    });
  });

  describe('calculateManaReservation', () => {
    it('should calculate percentage reservation', () => {
      const result = calculateManaReservation(1000, 50);
      expect(result.reserved).toBe(500);
      expect(result.unreserved).toBe(500);
    });

    it('should calculate flat reservation', () => {
      const result = calculateManaReservation(1000, 0, 200);
      expect(result.reserved).toBe(200);
      expect(result.unreserved).toBe(800);
    });

    it('should combine percentage and flat reservation', () => {
      const result = calculateManaReservation(1000, 50, 100);
      expect(result.reserved).toBe(600); // 500 + 100
      expect(result.unreserved).toBe(400);
    });

    it('should cap reservation at max mana', () => {
      const result = calculateManaReservation(1000, 120); // 120%
      expect(result.reserved).toBe(1000);
      expect(result.unreserved).toBe(0);
    });

    it('should handle 100% reservation', () => {
      const result = calculateManaReservation(500, 100);
      expect(result.reserved).toBe(500);
      expect(result.unreserved).toBe(0);
    });
  });

  describe('parseItemProperty', () => {
    it('should parse numeric values', () => {
      const prop: ItemProperty = {
        name: 'Test',
        values: [['123', 0]],
        displayMode: 0
      };
      expect(parseItemProperty(prop)).toBe(123);
    });

    it('should parse values with formatting', () => {
      const prop: ItemProperty = {
        name: 'Test',
        values: [['+50%', 1]],
        displayMode: 0
      };
      expect(parseItemProperty(prop)).toBe(50);
    });

    it('should handle decimal values', () => {
      const prop: ItemProperty = {
        name: 'Test',
        values: [['1.75', 0]],
        displayMode: 0
      };
      expect(parseItemProperty(prop)).toBe(1.75);
    });

    it('should return 0 for empty values', () => {
      const prop: ItemProperty = {
        name: 'Test',
        values: [],
        displayMode: 0
      };
      expect(parseItemProperty(prop)).toBe(0);
    });

    it('should handle negative values', () => {
      const prop: ItemProperty = {
        name: 'Test',
        values: [['-25', 0]],
        displayMode: 0
      };
      expect(parseItemProperty(prop)).toBe(-25);
    });
  });

  describe('calculateWeaponDps', () => {
    it('should calculate physical DPS', () => {
      const weapon: CharacterItem = {
        id: 'weapon-1',
        name: 'Test Sword',
        typeLine: 'Sword',
        baseType: 'Sword',
        ilvl: 70,
        properties: [
          { name: 'Physical Damage', values: [['100-200', 0]], displayMode: 0 },
          { name: 'Attacks per Second', values: [['2.0', 0]], displayMode: 0 }
        ]
      };

      expect(calculateWeaponDps(weapon)).toBe(300); // avg(150) * 2.0
    });

    it('should include elemental damage', () => {
      const weapon: CharacterItem = {
        id: 'weapon-2',
        name: 'Elemental Sword',
        typeLine: 'Sword',
        baseType: 'Sword',
        ilvl: 70,
        properties: [
          { name: 'Physical Damage', values: [['100-200', 0]], displayMode: 0 },
          { name: 'Fire Damage', values: [['50-100', 0]], displayMode: 0 },
          { name: 'Attacks per Second', values: [['1.0', 0]], displayMode: 0 }
        ]
      };

      expect(calculateWeaponDps(weapon)).toBe(225); // (150 + 75) * 1.0
    });

    it('should return 0 for items without properties', () => {
      const weapon: CharacterItem = {
        id: 'weapon-3',
        name: 'Broken Sword',
        typeLine: 'Sword',
        baseType: 'Sword',
        ilvl: 1
      };

      expect(calculateWeaponDps(weapon)).toBe(0);
    });

    it('should handle missing attack speed', () => {
      const weapon: CharacterItem = {
        id: 'weapon-4',
        name: 'Test Weapon',
        typeLine: 'Weapon',
        baseType: 'Weapon',
        ilvl: 70,
        properties: [
          { name: 'Physical Damage', values: [['100-200', 0]], displayMode: 0 }
        ]
      };

      expect(calculateWeaponDps(weapon)).toBe(150); // avg(150) * 1.0 default
    });
  });

  describe('calculateTotalResistances', () => {
    it('should sum fire resistance from multiple items', () => {
      const items: CharacterItem[] = [
        {
          id: 'item-1',
          name: 'Ring 1',
          typeLine: 'Ring',
          baseType: 'Ring',
          ilvl: 70,
          explicitMods: ['+20% to Fire Resistance']
        },
        {
          id: 'item-2',
          name: 'Ring 2',
          typeLine: 'Ring',
          baseType: 'Ring',
          ilvl: 70,
          explicitMods: ['+30% to Fire Resistance']
        }
      ];

      const res = calculateTotalResistances(items);
      expect(res.fire).toBe(50);
    });

    it('should apply resistance cap at 75%', () => {
      const items: CharacterItem[] = [
        {
          id: 'item-1',
          name: 'Over-capped Item',
          typeLine: 'Body Armour',
          baseType: 'Body Armour',
          ilvl: 70,
          explicitMods: ['+100% to Fire Resistance']
        }
      ];

      const res = calculateTotalResistances(items);
      expect(res.fire).toBe(75);
    });

    it('should handle all elemental resistances', () => {
      const items: CharacterItem[] = [
        {
          id: 'item-1',
          name: 'Tri-res Ring',
          typeLine: 'Ring',
          baseType: 'Ring',
          ilvl: 70,
          explicitMods: ['+25% to all Elemental Resistances']
        }
      ];

      const res = calculateTotalResistances(items);
      expect(res.fire).toBe(25);
      expect(res.cold).toBe(25);
      expect(res.lightning).toBe(25);
      expect(res.chaos).toBe(0);
    });

    it('should not cap chaos resistance', () => {
      const items: CharacterItem[] = [
        {
          id: 'item-1',
          name: 'Chaos Item',
          typeLine: 'Amulet',
          baseType: 'Amulet',
          ilvl: 70,
          explicitMods: ['+100% to Chaos Resistance']
        }
      ];

      const res = calculateTotalResistances(items);
      expect(res.chaos).toBe(100); // Not capped
    });

    it('should combine explicit, implicit, and crafted mods', () => {
      const items: CharacterItem[] = [
        {
          id: 'item-1',
          name: 'Ring',
          typeLine: 'Ring',
          baseType: 'Ring',
          ilvl: 70,
          explicitMods: ['+20% to Fire Resistance'],
          implicitMods: ['+10% to Fire Resistance'],
          craftedMods: ['+15% to Fire Resistance']
        }
      ];

      const res = calculateTotalResistances(items);
      expect(res.fire).toBe(45);
    });

    it('should return 0 for all resistances with no items', () => {
      const res = calculateTotalResistances([]);
      expect(res.fire).toBe(0);
      expect(res.cold).toBe(0);
      expect(res.lightning).toBe(0);
      expect(res.chaos).toBe(0);
    });
  });

  describe('calculateExperienceForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(calculateExperienceForLevel(1)).toBe(525);
    });

    it('should return increasing values for higher levels', () => {
      const level10 = calculateExperienceForLevel(10);
      const level20 = calculateExperienceForLevel(20);
      expect(level20).toBeGreaterThan(level10);
    });

    it('should return 0 for level 100+', () => {
      expect(calculateExperienceForLevel(100)).toBe(0);
      expect(calculateExperienceForLevel(101)).toBe(0);
    });

    it('should return correct values for specific levels', () => {
      expect(calculateExperienceForLevel(50)).toBeGreaterThan(0);
      expect(calculateExperienceForLevel(75)).toBeGreaterThan(calculateExperienceForLevel(50));
    });
  });

  describe('calculateLevelProgress', () => {
    it('should return 0% at start of level', () => {
      const levelExp = calculateExperienceForLevel(10);
      const progress = calculateLevelProgress(levelExp, 10);
      expect(progress).toBe(0);
    });

    it('should return 50% at halfway point', () => {
      const currentLevelExp = calculateExperienceForLevel(10);
      const nextLevelExp = calculateExperienceForLevel(11);
      const midpointExp = currentLevelExp + (nextLevelExp - currentLevelExp) / 2;

      const progress = calculateLevelProgress(midpointExp, 10);
      expect(progress).toBeCloseTo(50, 0);
    });

    it('should return 100% at max level', () => {
      const progress = calculateLevelProgress(999999999, 99);
      expect(progress).toBe(100);
    });

    it('should not exceed 100%', () => {
      const nextLevelExp = calculateExperienceForLevel(11);
      const excessExp = nextLevelExp + 1000000;

      const progress = calculateLevelProgress(excessExp, 10);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should calculate correct progress for mid-level', () => {
      const currentLevelExp = calculateExperienceForLevel(50);
      const nextLevelExp = calculateExperienceForLevel(51);
      const quarterExp = currentLevelExp + (nextLevelExp - currentLevelExp) * 0.25;

      const progress = calculateLevelProgress(quarterExp, 50);
      expect(progress).toBeCloseTo(25, 0);
    });
  });
});
