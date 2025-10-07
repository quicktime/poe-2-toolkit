import type { PassiveNode, AllocatedPassives } from '@/types/passiveTree';

/**
 * Keystone mechanics system for Path of Exile 2
 * Keystones have special mechanics that fundamentally alter character behavior
 */

export interface KeystoneEffect {
  id: string;
  name: string;
  description: string;
  /**
   * Apply the keystone's mechanical effects to character stats
   */
  apply: (stats: CharacterStats) => CharacterStats;
  /**
   * Check for conflicts with other keystones
   */
  conflictsWith?: string[];
  /**
   * Category for filtering and organization
   */
  category: 'offensive' | 'defensive' | 'utility' | 'ascendancy';
}

export interface CharacterStats {
  // Offensive
  increasedDamage: number[];
  moreDamage: number[];
  criticalStrikeChance: number;
  criticalStrikeMultiplier: number;
  attackSpeed: number;
  castSpeed: number;
  accuracy: number;

  // Defensive
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  energyShield: number;
  maxEnergyShield: number;
  armour: number;
  evasion: number;

  // Resistances
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  chaosResistance: number;

  // Block
  blockChance: number;
  spellBlockChance: number;

  // Utility
  movementSpeed: number;
  itemRarity: number;
  itemQuantity: number;

  // Special flags for keystones
  alwaysCrit?: boolean;
  cannotCrit?: boolean;
  cannotEvade?: boolean;
  cannotBlock?: boolean;
  cannotUseShield?: boolean;
  painAttunement?: boolean;
  bloodMagic?: boolean;
  chaosInoculation?: boolean;
  avatarOfFire?: boolean;
}

/**
 * Known keystones in Path of Exile 2 (Early Access 0.3+)
 * Note: This is a curated list based on PoE 2 mechanics
 */
export const KEYSTONE_EFFECTS: Record<string, KeystoneEffect> = {
  // Offensive Keystones
  'Perfect Agony': {
    id: 'perfect_agony',
    name: 'Perfect Agony',
    description: 'Modifiers to Critical Strike Multiplier also apply to Damage over Time Multiplier for Ailments from Critical Strikes at 50% of their value',
    category: 'offensive',
    apply: (stats) => {
      // This would require more complex DoT calculation integration
      return stats;
    }
  },

  'Resolute Technique': {
    id: 'resolute_technique',
    name: 'Resolute Technique',
    description: 'Your hits can\'t be Evaded. Never deal Critical Strikes',
    category: 'offensive',
    apply: (stats) => ({
      ...stats,
      cannotEvade: true,
      cannotCrit: true,
      criticalStrikeChance: 0
    })
  },

  'Ancestral Bond': {
    id: 'ancestral_bond',
    name: 'Ancestral Bond',
    description: '+1 to maximum number of Summoned Totems. You can\'t deal damage with Skills yourself',
    category: 'offensive',
    apply: (stats) => {
      // Would need integration with totem system
      return stats;
    }
  },

  'Avatar of Fire': {
    id: 'avatar_of_fire',
    name: 'Avatar of Fire',
    description: '50% of Physical, Lightning and Cold Damage Converted to Fire Damage. Deal no Non-Fire Damage',
    category: 'offensive',
    apply: (stats) => ({
      ...stats,
      avatarOfFire: true
    })
  },

  'Point Blank': {
    id: 'point_blank',
    name: 'Point Blank',
    description: 'Projectile Attack hits deal up to 50% more Damage to targets at close range. Projectile Attack hits deal up to 50% less Damage to targets at long range',
    category: 'offensive',
    apply: (stats) => {
      // Distance-based calculation would be needed
      return stats;
    }
  },

  // Defensive Keystones
  'Chaos Inoculation': {
    id: 'chaos_inoculation',
    name: 'Chaos Inoculation',
    description: 'Maximum Life becomes 1. Immune to Chaos Damage',
    category: 'defensive',
    apply: (stats) => ({
      ...stats,
      maxLife: 1,
      life: Math.min(stats.life, 1),
      chaosResistance: 100,
      chaosInoculation: true
    })
  },

  'Pain Attunement': {
    id: 'pain_attunement',
    name: 'Pain Attunement',
    description: '30% more Spell Damage when on Low Life',
    category: 'offensive',
    apply: (stats) => {
      // Check if low life (< 35% life)
      const isLowLife = stats.life / stats.maxLife < 0.35;
      if (isLowLife) {
        return {
          ...stats,
          moreDamage: [...stats.moreDamage, 30],
          painAttunement: true
        };
      }
      return stats;
    }
  },

  'Blood Magic': {
    id: 'blood_magic',
    name: 'Blood Magic',
    description: 'Removes all mana. Spend Life instead of Mana for Skills',
    category: 'utility',
    apply: (stats) => ({
      ...stats,
      maxMana: 0,
      mana: 0,
      bloodMagic: true
    })
  },

  'Unwavering Stance': {
    id: 'unwavering_stance',
    name: 'Unwavering Stance',
    description: 'Cannot Evade. Cannot be Stunned',
    category: 'defensive',
    apply: (stats) => ({
      ...stats,
      evasion: 0
    })
  },

  'Iron Reflexes': {
    id: 'iron_reflexes',
    name: 'Iron Reflexes',
    description: 'Converts all Evasion Rating to Armour. Dexterity provides no bonus to Evasion Rating',
    category: 'defensive',
    apply: (stats) => ({
      ...stats,
      armour: stats.armour + stats.evasion,
      evasion: 0
    })
  },

  'Acrobatics': {
    id: 'acrobatics',
    name: 'Acrobatics',
    description: '+30% chance to Dodge Attack Hits. 30% less Armour',
    category: 'defensive',
    apply: (stats) => ({
      ...stats,
      armour: Math.floor(stats.armour * 0.7)
    })
  },

  'Eldritch Battery': {
    id: 'eldritch_battery',
    name: 'Eldritch Battery',
    description: 'Spend Energy Shield before Mana for Skill Costs',
    category: 'utility',
    apply: (stats) => {
      // Would need integration with skill cost system
      return stats;
    }
  },

  // Utility Keystones
  'Conduit': {
    id: 'conduit',
    name: 'Conduit',
    description: 'Share Power, Frenzy and Endurance Charges with nearby party members',
    category: 'utility',
    apply: (stats) => {
      // Would need charge system integration
      return stats;
    }
  },

  'Zealot\'s Oath': {
    id: 'zealots_oath',
    name: 'Zealot\'s Oath',
    description: 'Regenerate Energy Shield instead of Life',
    category: 'defensive',
    apply: (stats) => {
      // Would need regeneration system integration
      return stats;
    }
  },

  'Ghost Reaver': {
    id: 'ghost_reaver',
    name: 'Ghost Reaver',
    description: 'Life Leech applies to Energy Shield instead',
    category: 'defensive',
    apply: (stats) => {
      // Would need leech system integration
      return stats;
    }
  },

  'Mind Over Matter': {
    id: 'mind_over_matter',
    name: 'Mind Over Matter',
    description: 'When you take Damage, 30% is taken from Mana before Life',
    category: 'defensive',
    apply: (stats) => {
      // Would need damage calculation integration
      return stats;
    }
  }
};

/**
 * Keystone Manager - handles keystone allocation and conflict resolution
 */
export class KeystoneManager {
  private allocatedKeystones: Map<string, KeystoneEffect>;
  private conflicts: Map<string, Set<string>>;

  constructor() {
    this.allocatedKeystones = new Map();
    this.conflicts = new Map();
    this.initializeConflicts();
  }

  /**
   * Initialize known keystone conflicts
   */
  private initializeConflicts(): void {
    // Some keystones are mutually exclusive
    this.addConflict('Chaos Inoculation', 'Blood Magic'); // CI and BM conflict
    this.addConflict('Resolute Technique', 'Ancestral Bond'); // Can't deal damage vs can't crit
    this.addConflict('Iron Reflexes', 'Acrobatics'); // Evasion conversion vs dodge
    this.addConflict('Ghost Reaver', 'Zealot\'s Oath'); // Leech targets conflict
  }

  private addConflict(keystone1: string, keystone2: string): void {
    if (!this.conflicts.has(keystone1)) {
      this.conflicts.set(keystone1, new Set());
    }
    if (!this.conflicts.has(keystone2)) {
      this.conflicts.set(keystone2, new Set());
    }
    this.conflicts.get(keystone1)!.add(keystone2);
    this.conflicts.get(keystone2)!.add(keystone1);
  }

  /**
   * Check if a keystone can be allocated
   */
  canAllocateKeystone(keystoneName: string): { can: boolean; conflicts: string[] } {
    const conflictingKeystones: string[] = [];
    const conflicts = this.conflicts.get(keystoneName);

    if (conflicts) {
      for (const conflict of conflicts) {
        if (this.allocatedKeystones.has(conflict)) {
          conflictingKeystones.push(conflict);
        }
      }
    }

    return {
      can: conflictingKeystones.length === 0,
      conflicts: conflictingKeystones
    };
  }

  /**
   * Allocate a keystone
   */
  allocateKeystone(keystoneName: string, effect: KeystoneEffect): boolean {
    const check = this.canAllocateKeystone(keystoneName);
    if (!check.can) {
      console.warn(`Cannot allocate ${keystoneName}: conflicts with ${check.conflicts.join(', ')}`);
      return false;
    }

    this.allocatedKeystones.set(keystoneName, effect);
    return true;
  }

  /**
   * Deallocate a keystone
   */
  deallocateKeystone(keystoneName: string): void {
    this.allocatedKeystones.delete(keystoneName);
  }

  /**
   * Get all allocated keystones
   */
  getAllocatedKeystones(): KeystoneEffect[] {
    return Array.from(this.allocatedKeystones.values());
  }

  /**
   * Apply all keystone effects to stats
   */
  applyKeystoneEffects(baseStats: CharacterStats): CharacterStats {
    let stats = { ...baseStats };

    for (const keystone of this.allocatedKeystones.values()) {
      stats = keystone.apply(stats);
    }

    return stats;
  }

  /**
   * Get keystone conflicts for display
   */
  getKeystoneConflicts(keystoneName: string): string[] {
    return Array.from(this.conflicts.get(keystoneName) || []);
  }

  /**
   * Reset all allocations
   */
  reset(): void {
    this.allocatedKeystones.clear();
  }
}

/**
 * Extract keystones from allocated passives
 */
export function extractKeystonesFromAllocations(
  allocations: AllocatedPassives,
  nodes: Record<number, PassiveNode>
): string[] {
  const keystones: string[] = [];

  for (const nodeId of allocations.nodes) {
    const node = nodes[nodeId];
    if (node && node.isKeystone) {
      keystones.push(node.name);
    }
  }

  return keystones;
}

/**
 * Create a keystone manager with allocations
 */
export function createKeystoneManager(
  allocations: AllocatedPassives,
  nodes: Record<number, PassiveNode>
): KeystoneManager {
  const manager = new KeystoneManager();
  const keystoneNames = extractKeystonesFromAllocations(allocations, nodes);

  for (const name of keystoneNames) {
    const effect = KEYSTONE_EFFECTS[name];
    if (effect) {
      manager.allocateKeystone(name, effect);
    }
  }

  return manager;
}

/**
 * Get base stats for calculations
 */
export function getBaseStats(): CharacterStats {
  return {
    increasedDamage: [],
    moreDamage: [],
    criticalStrikeChance: 5,
    criticalStrikeMultiplier: 150,
    attackSpeed: 1.0,
    castSpeed: 1.0,
    accuracy: 100,

    life: 100,
    maxLife: 100,
    mana: 100,
    maxMana: 100,
    energyShield: 0,
    maxEnergyShield: 0,
    armour: 0,
    evasion: 0,

    fireResistance: 0,
    coldResistance: 0,
    lightningResistance: 0,
    chaosResistance: 0,

    blockChance: 0,
    spellBlockChance: 0,

    movementSpeed: 100,
    itemRarity: 0,
    itemQuantity: 0
  };
}
