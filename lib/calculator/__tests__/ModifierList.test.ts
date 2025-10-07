/**
 * Tests for ModifierList
 */

import { ModifierList } from '../ModifierList';

describe('ModifierList', () => {
  let modifierList: ModifierList;

  beforeEach(() => {
    modifierList = new ModifierList();
  });

  describe('Damage Modifiers', () => {
    test('should parse increased damage modifiers', () => {
      modifierList.parseAndAdd('50% increased damage');
      expect(modifierList.sum('INC', { type: 'damage' })).toBe(50);
    });

    test('should parse increased elemental damage', () => {
      modifierList.parseAndAdd('30% increased fire damage');
      modifierList.parseAndAdd('20% increased cold damage');
      expect(modifierList.sum('INC', { type: 'damage', subtype: 'fire' })).toBe(30);
      expect(modifierList.sum('INC', { type: 'damage', subtype: 'cold' })).toBe(20);
    });

    test('should parse more damage modifiers', () => {
      modifierList.parseAndAdd('40% more damage');
      modifierList.parseAndAdd('20% more damage');
      // More modifiers are multiplicative: 1.4 * 1.2 = 1.68
      expect(modifierList.more({ type: 'damage' })).toBeCloseTo(1.68, 2);
    });

    test('should parse added flat damage', () => {
      modifierList.parseAndAdd('Adds 10 to 20 physical damage');
      modifierList.parseAndAdd('Adds 5 to 10 fire damage to attacks');
      expect(modifierList.sum('ADDED', { type: 'damage', subtype: 'physical' })).toBe(15); // Average
      expect(modifierList.sum('ADDED', { type: 'damage', subtype: 'fire_to_attacks' })).toBe(7.5);
    });

    test('should parse damage conversion', () => {
      modifierList.parseAndAdd('50% of physical damage converted to fire damage');
      expect(modifierList.sum('CONVERSION', { type: 'damage', subtype: 'physical_to_fire' })).toBe(50);
    });

    test('should parse gain as extra damage', () => {
      modifierList.parseAndAdd('Gain 20% of physical damage as extra fire damage');
      expect(modifierList.sum('EXTRA', { type: 'damage', subtype: 'physical_as_extra_fire' })).toBe(20);
    });

    test('should parse penetration', () => {
      modifierList.parseAndAdd('Damage penetrates 15% fire resistance');
      expect(modifierList.sum('PENETRATION', { type: 'damage', subtype: 'fire' })).toBe(15);
    });
  });

  describe('Critical Strike Modifiers', () => {
    test('should parse increased critical strike chance', () => {
      modifierList.parseAndAdd('100% increased critical strike chance');
      expect(modifierList.sum('INC', { type: 'critical' })).toBe(100);
    });

    test('should parse added critical strike multiplier', () => {
      modifierList.parseAndAdd('+50% to critical strike multiplier');
      expect(modifierList.sum('ADDED', { type: 'critical' })).toBe(50);
    });
  });

  describe('Speed Modifiers', () => {
    test('should parse attack and cast speed', () => {
      modifierList.parseAndAdd('25% increased attack speed');
      modifierList.parseAndAdd('15% increased cast speed');
      expect(modifierList.sum('INC', { type: 'speed' })).toBe(40);
    });

    test('should parse more attack speed', () => {
      modifierList.parseAndAdd('20% more attack speed');
      expect(modifierList.more({ type: 'speed' })).toBeCloseTo(1.2, 2);
    });
  });

  describe('Resource Modifiers', () => {
    test('should parse life modifiers', () => {
      modifierList.parseAndAdd('+100 to maximum life');
      modifierList.parseAndAdd('20% increased maximum life');
      expect(modifierList.sum('ADDED', { type: 'resource' })).toBe(100);
      expect(modifierList.sum('INC', { type: 'resource' })).toBe(20);
    });

    test('should parse mana modifiers', () => {
      modifierList.parseAndAdd('+50 to maximum mana');
      modifierList.parseAndAdd('15% increased maximum mana');
      expect(modifierList.sum('ADDED', { type: 'resource' })).toBe(50);
      expect(modifierList.sum('INC', { type: 'resource' })).toBe(15);
    });

    test('should parse PoE2 spirit modifiers', () => {
      modifierList.parseAndAdd('+25 to maximum spirit');
      modifierList.parseAndAdd('10% increased maximum spirit');
      expect(modifierList.sum('ADDED', { type: 'resource' })).toBe(25);
      expect(modifierList.sum('INC', { type: 'resource' })).toBe(10);
    });

    test('should parse regeneration', () => {
      modifierList.parseAndAdd('Regenerate 2% of life per second');
      modifierList.parseAndAdd('Regenerate 50 life per second');
      expect(modifierList.sum('ADDED', { type: 'resource', subtype: 'regeneration' })).toBe(52);
    });

    test('should parse leech', () => {
      modifierList.parseAndAdd('0.4% of physical damage leeched as life');
      modifierList.parseAndAdd('0.2% of fire damage leeched as mana');
      expect(modifierList.sum('ADDED', { type: 'resource', subtype: 'leech' })).toBeCloseTo(0.6, 2);
    });
  });

  describe('Defensive Modifiers', () => {
    test('should parse resistances', () => {
      modifierList.parseAndAdd('+30% to fire resistance');
      modifierList.parseAndAdd('+25% to all elemental resistances');
      // Should have 55% fire res (30 + 25)
      expect(modifierList.sum('ADDED', { type: 'defense', subtype: 'fire' })).toBe(55);
      expect(modifierList.sum('ADDED', { type: 'defense', subtype: 'cold' })).toBe(25);
      expect(modifierList.sum('ADDED', { type: 'defense', subtype: 'lightning' })).toBe(25);
    });

    test('should parse PoE2 honor resistance', () => {
      modifierList.parseAndAdd('+15% to honor resistance');
      expect(modifierList.sum('ADDED', { type: 'defense', subtype: 'honor' })).toBe(15);
    });

    test('should parse armour and evasion', () => {
      modifierList.parseAndAdd('+500 to armour');
      modifierList.parseAndAdd('40% increased armour');
      modifierList.parseAndAdd('+300 to evasion rating');
      modifierList.parseAndAdd('30% increased evasion rating');
      
      expect(modifierList.sum('ADDED', { type: 'defense' })).toBe(800);
      expect(modifierList.sum('INC', { type: 'defense' })).toBe(70);
    });

    test('should parse block chance', () => {
      modifierList.parseAndAdd('25% chance to block attack damage');
      modifierList.parseAndAdd('15% chance to block spell damage');
      expect(modifierList.sum('ADDED', { type: 'defense' })).toBe(40);
    });

    test('should parse PoE2 dodge effectiveness', () => {
      modifierList.parseAndAdd('30% increased dodge roll effectiveness');
      expect(modifierList.sum('INC', { type: 'defense' })).toBe(30);
    });
  });

  describe('Conditional Modifiers', () => {
    test('should parse conditional damage modifiers', () => {
      modifierList.parseAndAdd('40% increased damage while stationary');
      const mods = modifierList.getMods('INC', { type: 'damage' });
      expect(mods[0].condition?.requirement).toBe('stationary');
      expect(mods[0].value).toBe(40);
    });

    test('should parse recently conditions', () => {
      modifierList.parseAndAdd("50% more damage if you've killed recently");
      modifierList.parseAndAdd("20% increased attack speed if you've crit recently");
      
      const moreMods = modifierList.getMods('MORE');
      expect(moreMods[0].condition?.requirement).toBe('killed_recently');
      
      const speedMods = modifierList.getMods('INC', { type: 'speed' });
      expect(speedMods[0].condition?.requirement).toBe('crit_recently');
    });
  });

  describe('Charge Modifiers', () => {
    test('should parse charge limits', () => {
      modifierList.parseAndAdd('+1 to maximum endurance charges');
      modifierList.parseAndAdd('+2 to maximum frenzy charges');
      modifierList.parseAndAdd('+1 to maximum power charges');
      
      expect(modifierList.sum('ADDED', { type: 'resource' })).toBe(4);
    });
  });

  describe('Flag Modifiers', () => {
    test('should parse keystone flags', () => {
      modifierList.parseAndAdd('Your fire damage can ignite');
      modifierList.parseAndAdd('Cannot evade');
      
      expect(modifierList.flag('fire_can_ignite')).toBe(true);
      expect(modifierList.flag('cannot_evade')).toBe(true);
      expect(modifierList.flag('nonexistent_flag')).toBe(false);
    });
  });

  describe('Complex Calculations', () => {
    test('should correctly aggregate multiple modifiers', () => {
      // Add various damage increases
      modifierList.parseAndAdd('30% increased physical damage');
      modifierList.parseAndAdd('20% increased damage');
      modifierList.parseAndAdd('15% increased physical damage');
      
      // Physical specific: 30 + 15 = 45
      // Generic damage: 20
      // Total for physical would be: 45 + 20 = 65 in real calculations
      const physicalInc = modifierList.sum('INC', { type: 'damage', subtype: 'physical' });
      const genericInc = modifierList.sum('INC', { type: 'damage' });
      expect(physicalInc).toBe(45); // 30 + 15 (physical specific)
      expect(genericInc).toBe(65); // 30 + 20 + 15 (all damage mods)
    });

    test('should handle multiple more multipliers correctly', () => {
      modifierList.parseAndAdd('30% more physical damage');
      modifierList.parseAndAdd('20% more damage');
      modifierList.parseAndAdd('10% more physical damage');
      
      // More multipliers are multiplicative
      const physMore = modifierList.more({ type: 'damage', subtype: 'physical' });
      const genericMore = modifierList.more({ type: 'damage' });
      // Physical: 1.3 * 1.1 = 1.43
      // Generic includes all: 1.3 * 1.2 * 1.1 = 1.716
      expect(physMore).toBeCloseTo(1.43, 2);
      expect(genericMore).toBeCloseTo(1.716, 2);
    });
  });

  describe('Caching', () => {
    test('should cache sum calculations', () => {
      modifierList.parseAndAdd('50% increased damage');
      
      // First call calculates
      const result1 = modifierList.sum('INC', { type: 'damage' });
      // Second call should use cache
      const result2 = modifierList.sum('INC', { type: 'damage' });
      
      expect(result1).toBe(result2);
      expect(result1).toBe(50);
    });

    test('should invalidate cache when modifiers added', () => {
      modifierList.parseAndAdd('50% increased damage');
      const result1 = modifierList.sum('INC', { type: 'damage' });
      
      modifierList.parseAndAdd('30% increased damage');
      const result2 = modifierList.sum('INC', { type: 'damage' });
      
      expect(result1).toBe(50);
      expect(result2).toBe(80);
    });
  });

  describe('Export and Debug', () => {
    test('should export modifier data', () => {
      modifierList.parseAndAdd('50% increased damage', 'test_source');
      modifierList.parseAndAdd('+100 to maximum life', 'test_source_2');

      const exported = modifierList.export();
      expect(exported).toHaveProperty('INC_damage');
      expect(exported).toHaveProperty('ADDED_maximum_life');
    });
  });

  describe('Subtype Verification', () => {
    test('should include subtypes in life and mana modifier tags', () => {
      modifierList.parseAndAdd('+50 to maximum life');
      modifierList.parseAndAdd('+30 to maximum mana');
      modifierList.parseAndAdd('20% increased maximum life');

      const lifeMods = modifierList.getMods('ADDED', { type: 'resource', subtype: 'life' });
      expect(lifeMods).toHaveLength(1);
      expect(lifeMods[0].value).toBe(50);

      const manaMods = modifierList.getMods('ADDED', { type: 'resource', subtype: 'mana' });
      expect(manaMods).toHaveLength(1);
      expect(manaMods[0].value).toBe(30);

      const incLifeMods = modifierList.getMods('INC', { type: 'resource', subtype: 'life' });
      expect(incLifeMods).toHaveLength(1);
      expect(incLifeMods[0].value).toBe(20);
    });

    test('should include subtypes in attribute modifier tags', () => {
      modifierList.parseAndAdd('+50 to strength');
      modifierList.parseAndAdd('+30 to dexterity');
      modifierList.parseAndAdd('+40 to intelligence');

      const strMods = modifierList.getMods('ADDED', { type: 'attribute', subtype: 'strength' });
      expect(strMods).toHaveLength(1);
      expect(strMods[0].value).toBe(50);

      const dexMods = modifierList.getMods('ADDED', { type: 'attribute', subtype: 'dexterity' });
      expect(dexMods).toHaveLength(1);
      expect(dexMods[0].value).toBe(30);

      const intMods = modifierList.getMods('ADDED', { type: 'attribute', subtype: 'intelligence' });
      expect(intMods).toHaveLength(1);
      expect(intMods[0].value).toBe(40);
    });

    test('should include subtypes in defense modifier tags', () => {
      modifierList.parseAndAdd('+500 to armour');
      modifierList.parseAndAdd('+300 to evasion rating');
      modifierList.parseAndAdd('25% increased armour');

      const armourMods = modifierList.getMods('ADDED', { type: 'defense', subtype: 'armour' });
      expect(armourMods).toHaveLength(1);
      expect(armourMods[0].value).toBe(500);

      const evasionMods = modifierList.getMods('ADDED', { type: 'defense', subtype: 'evasion' });
      expect(evasionMods).toHaveLength(1);
      expect(evasionMods[0].value).toBe(300);

      const incArmourMods = modifierList.getMods('INC', { type: 'defense', subtype: 'armour' });
      expect(incArmourMods).toHaveLength(1);
      expect(incArmourMods[0].value).toBe(25);
    });

    test('should include subtypes in block modifier tags', () => {
      modifierList.parseAndAdd('20% chance to block attack damage');
      modifierList.parseAndAdd('15% chance to block spell damage');

      const attackBlockMods = modifierList.getMods('ADDED', { type: 'defense', subtype: 'attack_block' });
      expect(attackBlockMods).toHaveLength(1);
      expect(attackBlockMods[0].value).toBe(20);

      const spellBlockMods = modifierList.getMods('ADDED', { type: 'defense', subtype: 'spell_block' });
      expect(spellBlockMods).toHaveLength(1);
      expect(spellBlockMods[0].value).toBe(15);
    });

    test('should parse all attributes modifier', () => {
      modifierList.parseAndAdd('+20 to all attributes');

      const strMods = modifierList.getMods('ADDED', { type: 'attribute', subtype: 'strength' });
      const dexMods = modifierList.getMods('ADDED', { type: 'attribute', subtype: 'dexterity' });
      const intMods = modifierList.getMods('ADDED', { type: 'attribute', subtype: 'intelligence' });

      expect(strMods).toHaveLength(1);
      expect(dexMods).toHaveLength(1);
      expect(intMods).toHaveLength(1);

      expect(strMods[0].value).toBe(20);
      expect(dexMods[0].value).toBe(20);
      expect(intMods[0].value).toBe(20);
    });

    test('should include specific subtypes in charge modifiers', () => {
      modifierList.parseAndAdd('+2 to maximum endurance charges');
      modifierList.parseAndAdd('+1 to maximum frenzy charges');

      const enduranceMods = modifierList.getMods('ADDED', { type: 'resource', subtype: 'endurance_charges' });
      expect(enduranceMods).toHaveLength(1);
      expect(enduranceMods[0].value).toBe(2);

      const frenzyMods = modifierList.getMods('ADDED', { type: 'resource', subtype: 'frenzy_charges' });
      expect(frenzyMods).toHaveLength(1);
      expect(frenzyMods[0].value).toBe(1);
    });
  });
});