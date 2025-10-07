import {
  KeystoneManager,
  KEYSTONE_EFFECTS,
  extractKeystonesFromAllocations,
  createKeystoneManager,
  getBaseStats,
  type CharacterStats
} from '../keystoneMechanics';
import type { AllocatedPassives, PassiveNode } from '@/types/passiveTree';

describe('KeystoneManager', () => {
  let manager: KeystoneManager;
  let baseStats: CharacterStats;

  beforeEach(() => {
    manager = new KeystoneManager();
    baseStats = getBaseStats();
  });

  describe('allocateKeystone', () => {
    it('should allocate non-conflicting keystones', () => {
      const effect = KEYSTONE_EFFECTS['Perfect Agony'];
      const success = manager.allocateKeystone('Perfect Agony', effect);
      expect(success).toBe(true);
      expect(manager.getAllocatedKeystones()).toContain(effect);
    });

    it('should prevent conflicting keystone allocations', () => {
      const ci = KEYSTONE_EFFECTS['Chaos Inoculation'];
      const bm = KEYSTONE_EFFECTS['Blood Magic'];

      manager.allocateKeystone('Chaos Inoculation', ci);
      const success = manager.allocateKeystone('Blood Magic', bm);

      expect(success).toBe(false);
      expect(manager.getAllocatedKeystones()).toHaveLength(1);
    });

    it('should allow multiple non-conflicting keystones', () => {
      const pa = KEYSTONE_EFFECTS['Perfect Agony'];
      const pb = KEYSTONE_EFFECTS['Point Blank'];

      manager.allocateKeystone('Perfect Agony', pa);
      manager.allocateKeystone('Point Blank', pb);

      expect(manager.getAllocatedKeystones()).toHaveLength(2);
    });
  });

  describe('canAllocateKeystone', () => {
    it('should allow allocation when no conflicts exist', () => {
      const result = manager.canAllocateKeystone('Perfect Agony');
      expect(result.can).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect conflicts', () => {
      const ci = KEYSTONE_EFFECTS['Chaos Inoculation'];
      manager.allocateKeystone('Chaos Inoculation', ci);

      const result = manager.canAllocateKeystone('Blood Magic');
      expect(result.can).toBe(false);
      expect(result.conflicts).toContain('Chaos Inoculation');
    });

    it('should detect multiple conflicts', () => {
      const ir = KEYSTONE_EFFECTS['Iron Reflexes'];
      manager.allocateKeystone('Iron Reflexes', ir);

      const result = manager.canAllocateKeystone('Acrobatics');
      expect(result.can).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('deallocateKeystone', () => {
    it('should remove allocated keystones', () => {
      const effect = KEYSTONE_EFFECTS['Perfect Agony'];
      manager.allocateKeystone('Perfect Agony', effect);
      expect(manager.getAllocatedKeystones()).toHaveLength(1);

      manager.deallocateKeystone('Perfect Agony');
      expect(manager.getAllocatedKeystones()).toHaveLength(0);
    });

    it('should allow previously conflicting keystones after deallocation', () => {
      const ci = KEYSTONE_EFFECTS['Chaos Inoculation'];
      const bm = KEYSTONE_EFFECTS['Blood Magic'];

      manager.allocateKeystone('Chaos Inoculation', ci);
      manager.deallocateKeystone('Chaos Inoculation');

      const success = manager.allocateKeystone('Blood Magic', bm);
      expect(success).toBe(true);
    });
  });

  describe('applyKeystoneEffects', () => {
    it('should apply Chaos Inoculation effects', () => {
      const ci = KEYSTONE_EFFECTS['Chaos Inoculation'];
      manager.allocateKeystone('Chaos Inoculation', ci);

      const stats = manager.applyKeystoneEffects(baseStats);
      expect(stats.maxLife).toBe(1);
      expect(stats.chaosResistance).toBe(100);
      expect(stats.chaosInoculation).toBe(true);
    });

    it('should apply Resolute Technique effects', () => {
      const rt = KEYSTONE_EFFECTS['Resolute Technique'];
      manager.allocateKeystone('Resolute Technique', rt);

      const stats = manager.applyKeystoneEffects(baseStats);
      expect(stats.cannotEvade).toBe(true);
      expect(stats.cannotCrit).toBe(true);
      expect(stats.criticalStrikeChance).toBe(0);
    });

    it('should apply Blood Magic effects', () => {
      const bm = KEYSTONE_EFFECTS['Blood Magic'];
      manager.allocateKeystone('Blood Magic', bm);

      const stats = manager.applyKeystoneEffects(baseStats);
      expect(stats.maxMana).toBe(0);
      expect(stats.mana).toBe(0);
      expect(stats.bloodMagic).toBe(true);
    });

    it('should apply Iron Reflexes effects', () => {
      const modifiedBase = { ...baseStats, evasion: 500, armour: 200 };
      const ir = KEYSTONE_EFFECTS['Iron Reflexes'];
      manager.allocateKeystone('Iron Reflexes', ir);

      const stats = manager.applyKeystoneEffects(modifiedBase);
      expect(stats.armour).toBe(700); // 200 + 500
      expect(stats.evasion).toBe(0);
    });

    it('should apply Unwavering Stance effects', () => {
      const modifiedBase = { ...baseStats, evasion: 500 };
      const us = KEYSTONE_EFFECTS['Unwavering Stance'];
      manager.allocateKeystone('Unwavering Stance', us);

      const stats = manager.applyKeystoneEffects(modifiedBase);
      expect(stats.evasion).toBe(0);
    });

    it('should apply Acrobatics effects', () => {
      const modifiedBase = { ...baseStats, armour: 1000 };
      const acro = KEYSTONE_EFFECTS['Acrobatics'];
      manager.allocateKeystone('Acrobatics', acro);

      const stats = manager.applyKeystoneEffects(modifiedBase);
      expect(stats.armour).toBe(700); // 1000 * 0.7
    });

    it('should apply Pain Attunement when on low life', () => {
      const lowLifeBase = { ...baseStats, life: 30, maxLife: 100 };
      const pa = KEYSTONE_EFFECTS['Pain Attunement'];
      manager.allocateKeystone('Pain Attunement', pa);

      const stats = manager.applyKeystoneEffects(lowLifeBase);
      expect(stats.moreDamage).toContain(30);
      expect(stats.painAttunement).toBe(true);
    });

    it('should not apply Pain Attunement when not on low life', () => {
      const highLifeBase = { ...baseStats, life: 80, maxLife: 100 };
      const pa = KEYSTONE_EFFECTS['Pain Attunement'];
      manager.allocateKeystone('Pain Attunement', pa);

      const stats = manager.applyKeystoneEffects(highLifeBase);
      expect(stats.moreDamage).not.toContain(30);
      expect(stats.painAttunement).toBeUndefined();
    });

    it('should apply multiple keystone effects', () => {
      const rt = KEYSTONE_EFFECTS['Resolute Technique'];
      const bm = KEYSTONE_EFFECTS['Blood Magic'];

      manager.allocateKeystone('Resolute Technique', rt);
      manager.allocateKeystone('Blood Magic', bm);

      const stats = manager.applyKeystoneEffects(baseStats);
      expect(stats.cannotCrit).toBe(true);
      expect(stats.maxMana).toBe(0);
    });
  });

  describe('getKeystoneConflicts', () => {
    it('should return conflicts for Chaos Inoculation', () => {
      const conflicts = manager.getKeystoneConflicts('Chaos Inoculation');
      expect(conflicts).toContain('Blood Magic');
    });

    it('should return conflicts for Iron Reflexes', () => {
      const conflicts = manager.getKeystoneConflicts('Iron Reflexes');
      expect(conflicts).toContain('Acrobatics');
    });

    it('should return empty array for non-conflicting keystones', () => {
      const conflicts = manager.getKeystoneConflicts('Perfect Agony');
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should clear all allocations', () => {
      const pa = KEYSTONE_EFFECTS['Perfect Agony'];
      const pb = KEYSTONE_EFFECTS['Point Blank'];

      manager.allocateKeystone('Perfect Agony', pa);
      manager.allocateKeystone('Point Blank', pb);
      expect(manager.getAllocatedKeystones()).toHaveLength(2);

      manager.reset();
      expect(manager.getAllocatedKeystones()).toHaveLength(0);
    });
  });
});

describe('extractKeystonesFromAllocations', () => {
  it('should extract keystone names from allocations', () => {
    const nodes: Record<number, PassiveNode> = {
      1: {
        id: 1,
        name: 'Chaos Inoculation',
        isKeystone: true,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: ['Maximum Life becomes 1', 'Immune to Chaos Damage'],
        position: { x: 0, y: 0 },
        connections: []
      },
      2: {
        id: 2,
        name: 'Normal Node',
        isKeystone: false,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: ['+10 to Strength'],
        position: { x: 100, y: 0 },
        connections: []
      }
    };

    const allocations: AllocatedPassives = {
      nodes: new Set([1, 2]),
      jewelData: new Map(),
      masteryEffects: new Map()
    };

    const keystones = extractKeystonesFromAllocations(allocations, nodes);
    expect(keystones).toContain('Chaos Inoculation');
    expect(keystones).not.toContain('Normal Node');
  });

  it('should return empty array when no keystones allocated', () => {
    const nodes: Record<number, PassiveNode> = {
      1: {
        id: 1,
        name: 'Normal Node',
        isKeystone: false,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: ['+10 to Strength'],
        position: { x: 0, y: 0 },
        connections: []
      }
    };

    const allocations: AllocatedPassives = {
      nodes: new Set([1]),
      jewelData: new Map(),
      masteryEffects: new Map()
    };

    const keystones = extractKeystonesFromAllocations(allocations, nodes);
    expect(keystones).toHaveLength(0);
  });
});

describe('createKeystoneManager', () => {
  it('should create manager with pre-allocated keystones', () => {
    const nodes: Record<number, PassiveNode> = {
      1: {
        id: 1,
        name: 'Chaos Inoculation',
        isKeystone: true,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: [],
        position: { x: 0, y: 0 },
        connections: []
      }
    };

    const allocations: AllocatedPassives = {
      nodes: new Set([1]),
      jewelData: new Map(),
      masteryEffects: new Map()
    };

    const manager = createKeystoneManager(allocations, nodes);
    expect(manager.getAllocatedKeystones()).toHaveLength(1);
  });

  it('should skip unknown keystones', () => {
    const nodes: Record<number, PassiveNode> = {
      1: {
        id: 1,
        name: 'Unknown Keystone',
        isKeystone: true,
        isNotable: false,
        isJewelSocket: false,
        isMastery: false,
        stats: [],
        position: { x: 0, y: 0 },
        connections: []
      }
    };

    const allocations: AllocatedPassives = {
      nodes: new Set([1]),
      jewelData: new Map(),
      masteryEffects: new Map()
    };

    const manager = createKeystoneManager(allocations, nodes);
    expect(manager.getAllocatedKeystones()).toHaveLength(0);
  });
});

describe('getBaseStats', () => {
  it('should return valid base stats', () => {
    const stats = getBaseStats();
    expect(stats.life).toBe(100);
    expect(stats.maxLife).toBe(100);
    expect(stats.criticalStrikeChance).toBe(5);
    expect(stats.increasedDamage).toHaveLength(0);
    expect(stats.moreDamage).toHaveLength(0);
  });
});
