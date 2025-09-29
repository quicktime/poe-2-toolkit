/**
 * ModifierList - Comprehensive modifier parsing and aggregation system
 * Based on Path of Building's modifier system but adapted for TypeScript and PoE2
 */

export type ModifierType = 
  | 'BASE' 
  | 'INC'     // Increased (additive)
  | 'MORE'    // More (multiplicative)
  | 'ADDED'   // Added flat damage
  | 'OVERRIDE' // Override base value
  | 'CONVERSION' // Damage conversion
  | 'EXTRA'   // Gain as extra
  | 'PENETRATION' // Resistance penetration
  | 'FLAG'    // Boolean flags

export interface ModifierTag {
  type: 'damage' | 'defense' | 'resource' | 'speed' | 'critical' | 'condition';
  subtype?: string; // fire, cold, lightning, physical, chaos, etc.
  condition?: ModifierCondition;
  source?: string; // Where this modifier came from (item, passive, skill)
}

export interface ModifierCondition {
  type: 'if' | 'while' | 'against' | 'with' | 'for';
  requirement: string; // e.g., "moving", "stationary", "on low life", "using shield"
  value?: number | boolean;
}

export interface Modifier {
  type: ModifierType;
  name: string;
  value: number;
  tags: ModifierTag[];
  source?: string;
  condition?: ModifierCondition;
  isLocal?: boolean; // Local to the item, not global
  isKeystone?: boolean; // From a keystone passive
}

export interface ModifierPattern {
  regex: RegExp;
  handler: (match: RegExpMatchArray, source?: string) => Modifier | Modifier[] | null;
}

export class ModifierList {
  private modifiers: Map<string, Modifier[]> = new Map();
  private patterns: ModifierPattern[] = [];
  private cache: Map<string, number> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * Add a modifier to the list
   */
  add(modifier: Modifier): void {
    const key = this.getModifierKey(modifier);
    
    if (!this.modifiers.has(key)) {
      this.modifiers.set(key, []);
    }
    
    this.modifiers.get(key)!.push(modifier);
    this.invalidateCache();
  }

  /**
   * Parse a modifier string and add to the list
   */
  parseAndAdd(modString: string, source?: string, isLocal: boolean = false): void {
    for (const pattern of this.patterns) {
      const match = modString.match(pattern.regex);
      if (match) {
        const result = pattern.handler(match, source);
        if (result) {
          const modifiers = Array.isArray(result) ? result : [result];
          modifiers.forEach(mod => {
            mod.isLocal = isLocal;
            this.add(mod);
          });
        }
        return;
      }
    }
  }

  /**
   * Sum all modifiers of type INC (increased - additive)
   */
  sum(type: ModifierType, tags?: Partial<ModifierTag>): number {
    const cacheKey = `sum_${type}_${JSON.stringify(tags || {})}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let total = 0;
    
    for (const [_, mods] of this.modifiers) {
      for (const mod of mods) {
        if (mod.type === type && this.matchesTags(mod, tags)) {
          total += mod.value;
        }
      }
    }
    
    this.cache.set(cacheKey, total);
    return total;
  }

  /**
   * Calculate MORE multipliers (multiplicative)
   */
  more(tags?: Partial<ModifierTag>): number {
    const cacheKey = `more_${JSON.stringify(tags || {})}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let multiplier = 1;
    
    for (const [_, mods] of this.modifiers) {
      for (const mod of mods) {
        if (mod.type === 'MORE' && this.matchesTags(mod, tags)) {
          multiplier *= (1 + mod.value / 100);
        }
      }
    }
    
    this.cache.set(cacheKey, multiplier);
    return multiplier;
  }

  /**
   * Get first override value
   */
  override(name: string): number | null {
    const key = `OVERRIDE_${name}`;
    const mods = this.modifiers.get(key);
    return mods && mods.length > 0 ? mods[0].value : null;
  }

  /**
   * Check if a flag is set
   */
  flag(name: string): boolean {
    const key = `FLAG_${name}`;
    return this.modifiers.has(key);
  }

  /**
   * Get all modifiers matching criteria
   */
  getMods(type?: ModifierType, tags?: Partial<ModifierTag>): Modifier[] {
    const result: Modifier[] = [];
    
    for (const [_, mods] of this.modifiers) {
      for (const mod of mods) {
        if ((!type || mod.type === type) && this.matchesTags(mod, tags)) {
          result.push(mod);
        }
      }
    }
    
    return result;
  }

  /**
   * Clear all modifiers
   */
  clear(): void {
    this.modifiers.clear();
    this.cache.clear();
  }

  /**
   * Merge another modifier list into this one
   */
  merge(other: ModifierList): void {
    for (const [key, mods] of other.modifiers) {
      for (const mod of mods) {
        this.add(mod);
      }
    }
  }

  private getModifierKey(modifier: Modifier): string {
    return `${modifier.type}_${modifier.name}`;
  }

  private matchesTags(modifier: Modifier, tags?: Partial<ModifierTag>): boolean {
    if (!tags) return true;
    
    return modifier.tags.some(modTag => {
      if (tags.type && modTag.type !== tags.type) return false;
      if (tags.subtype && modTag.subtype !== tags.subtype) return false;
      return true;
    });
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Initialize all modifier patterns
   * This is where we define how to parse modifier strings
   */
  private initializePatterns(): void {
    // Damage modifiers
    this.patterns.push(
      // Increased damage (generic)
      {
        regex: /^(\d+)% increased damage$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'damage',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage' }]
        })
      },
      
      // Increased damage by type
      {
        regex: /^(\d+)% increased (\w+) damage$/i,
        handler: (match) => ({
          type: 'INC',
          name: `${match[2].toLowerCase()}_damage`,
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: match[2].toLowerCase() }]
        })
      },
      
      // More damage (generic)
      {
        regex: /^(\d+)% more damage$/i,
        handler: (match) => ({
          type: 'MORE',
          name: 'damage',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage' }]
        })
      },
      
      // More damage by type
      {
        regex: /^(\d+)% more (\w+) damage$/i,
        handler: (match) => ({
          type: 'MORE',
          name: `${match[2].toLowerCase()}_damage`,
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: match[2].toLowerCase() }]
        })
      },
      
      // Added damage (flat)
      {
        regex: /^adds (\d+) to (\d+) (\w+) damage$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `${match[3].toLowerCase()}_damage`,
          value: (parseFloat(match[1]) + parseFloat(match[2])) / 2,
          tags: [{ type: 'damage', subtype: match[3].toLowerCase() }]
        })
      },
      
      // Added damage to attacks
      {
        regex: /^adds (\d+) to (\d+) (\w+) damage to attacks$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `${match[3].toLowerCase()}_damage_to_attacks`,
          value: (parseFloat(match[1]) + parseFloat(match[2])) / 2,
          tags: [{ type: 'damage', subtype: `${match[3].toLowerCase()}_to_attacks` }]
        })
      },
      
      // Added damage to spells
      {
        regex: /^adds (\d+) to (\d+) (\w+) damage to spells$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `${match[3].toLowerCase()}_damage_to_spells`,
          value: (parseFloat(match[1]) + parseFloat(match[2])) / 2,
          tags: [{ type: 'damage', subtype: match[3].toLowerCase() }]
        })
      },
      
      // Damage conversion
      {
        regex: /^(\d+)% of (\w+) damage converted to (\w+) damage$/i,
        handler: (match) => ({
          type: 'CONVERSION',
          name: `${match[2].toLowerCase()}_to_${match[3].toLowerCase()}`,
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: `${match[2]}_to_${match[3]}`.toLowerCase() }]
        })
      },
      
      // Gain as extra damage
      {
        regex: /^gain (\d+)% of (\w+) damage as extra (\w+) damage$/i,
        handler: (match) => ({
          type: 'EXTRA',
          name: `${match[2].toLowerCase()}_as_extra_${match[3].toLowerCase()}`,
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: `${match[2].toLowerCase()}_as_extra_${match[3].toLowerCase()}` }]
        })
      },
      
      // Penetration
      {
        regex: /^damage penetrates (\d+)% (\w+) resistance$/i,
        handler: (match) => ({
          type: 'PENETRATION',
          name: `${match[2].toLowerCase()}_penetration`,
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: match[2].toLowerCase() }]
        })
      },
      
      // Critical strike modifiers
      {
        regex: /^(\d+)% increased critical strike chance$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'critical_strike_chance',
          value: parseFloat(match[1]),
          tags: [{ type: 'critical' }]
        })
      },
      
      {
        regex: /^\+(\d+)% to critical strike multiplier$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'critical_strike_multiplier',
          value: parseFloat(match[1]),
          tags: [{ type: 'critical' }]
        })
      },
      
      {
        regex: /^(\d+)% increased critical strike multiplier$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'critical_strike_multiplier',
          value: parseFloat(match[1]),
          tags: [{ type: 'critical' }]
        })
      },
      
      // Attack and cast speed
      {
        regex: /^(\d+)% increased attack speed$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'attack_speed',
          value: parseFloat(match[1]),
          tags: [{ type: 'speed' }]
        })
      },
      
      {
        regex: /^(\d+)% more attack speed$/i,
        handler: (match) => ({
          type: 'MORE',
          name: 'attack_speed',
          value: parseFloat(match[1]),
          tags: [{ type: 'speed' }]
        })
      },
      
      {
        regex: /^(\d+)% increased cast speed$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'cast_speed',
          value: parseFloat(match[1]),
          tags: [{ type: 'speed' }]
        })
      },
      
      {
        regex: /^(\d+)% more cast speed$/i,
        handler: (match) => ({
          type: 'MORE',
          name: 'cast_speed',
          value: parseFloat(match[1]),
          tags: [{ type: 'speed' }]
        })
      },
      
      // Accuracy
      {
        regex: /^\+(\d+) to accuracy rating$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'accuracy_rating',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage' }]
        })
      },
      
      {
        regex: /^(\d+)% increased accuracy rating$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'accuracy_rating',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage' }]
        })
      },
      
      // Life and mana
      {
        regex: /^\+(\d+) to maximum life$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'maximum_life',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource' }]
        })
      },
      
      {
        regex: /^(\d+)% increased maximum life$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'maximum_life',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource' }]
        })
      },
      
      {
        regex: /^\+(\d+) to maximum mana$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'maximum_mana',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource' }]
        })
      },
      
      {
        regex: /^(\d+)% increased maximum mana$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'maximum_mana',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource' }]
        })
      },
      
      // PoE2 SPECIFIC - Spirit System
      {
        regex: /^\+(\d+) to maximum spirit$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'maximum_spirit',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'spirit' }]
        })
      },
      
      {
        regex: /^(\d+)% increased maximum spirit$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'maximum_spirit',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'spirit' }]
        })
      },
      
      {
        regex: /^(\d+)% increased spirit efficiency$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'spirit_efficiency',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'spirit_efficiency' }]
        })
      },
      
      {
        regex: /^(\d+)% reduced spirit cost of skills$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'spirit_cost_reduction',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'spirit' }]
        })
      },
      
      // Resistances
      {
        regex: /^\+(\d+)% to (\w+) resistance$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `${match[2].toLowerCase()}_resistance`,
          value: parseFloat(match[1]),
          tags: [{ type: 'defense', subtype: match[2].toLowerCase() }]
        })
      },
      
      {
        regex: /^\+(\d+)% to all elemental resistances$/i,
        handler: (match) => [
          {
            type: 'ADDED' as ModifierType,
            name: 'fire_resistance',
            value: parseFloat(match[1]),
            tags: [{ type: 'defense' as const, subtype: 'fire' }]
          },
          {
            type: 'ADDED' as ModifierType,
            name: 'cold_resistance',
            value: parseFloat(match[1]),
            tags: [{ type: 'defense' as const, subtype: 'cold' }]
          },
          {
            type: 'ADDED' as ModifierType,
            name: 'lightning_resistance',
            value: parseFloat(match[1]),
            tags: [{ type: 'defense' as const, subtype: 'lightning' }]
          }
        ]
      },
      
      // PoE2 SPECIFIC - Honor Resistance System
      {
        regex: /^\+(\d+)% to honor resistance$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'honor_resistance',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense', subtype: 'honor' }]
        })
      },
      
      {
        regex: /^(\d+)% increased honor resistance$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'honor_resistance',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense', subtype: 'honor' }]
        })
      },
      
      {
        regex: /^damage penetrates (\d+)% honor resistance$/i,
        handler: (match) => ({
          type: 'PENETRATION',
          name: 'honor_penetration',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: 'honor' }]
        })
      },
      
      // PoE2 SPECIFIC - Combo System
      {
        regex: /^(\d+) to maximum combo$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'maximum_combo',
          value: parseFloat(match[1]),
          tags: [{ type: 'combat', subtype: 'combo' }]
        })
      },
      
      {
        regex: /^(\d+)% increased combo damage$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'combo_damage',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: 'combo' }]
        })
      },
      
      {
        regex: /^gain (\d+) combo on (\w+)$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `combo_on_${match[2].toLowerCase()}`,
          value: parseFloat(match[1]),
          tags: [{ type: 'combat', subtype: 'combo' }]
        })
      },
      
      // PoE2 SPECIFIC - Weapon Swap
      {
        regex: /^(\d+)% increased damage while using weapon set (\d)$/i,
        handler: (match) => ({
          type: 'INC',
          name: `weapon_set_${match[2]}_damage`,
          value: parseFloat(match[1]),
          tags: [{ type: 'damage', subtype: 'weapon_swap' }]
        })
      },
      
      {
        regex: /^(\d+)% increased attack speed after weapon swap$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'attack_speed_after_swap',
          value: parseFloat(match[1]),
          tags: [{ type: 'speed', subtype: 'weapon_swap' }]
        })
      },
      
      // Armor and evasion
      {
        regex: /^\+(\d+) to armour$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'armour',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      {
        regex: /^(\d+)% increased armour$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'armour',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      {
        regex: /^\+(\d+) to evasion rating$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'evasion_rating',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      {
        regex: /^(\d+)% increased evasion rating$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'evasion_rating',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      // Block
      {
        regex: /^(\d+)% chance to block attack damage$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'attack_block_chance',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      {
        regex: /^(\d+)% chance to block spell damage$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'spell_block_chance',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      // PoE2 specific - Dodge effectiveness
      {
        regex: /^(\d+)% increased dodge roll effectiveness$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'dodge_effectiveness',
          value: parseFloat(match[1]),
          tags: [{ type: 'defense' }]
        })
      },
      
      // Conditional modifiers
      {
        regex: /^(\d+)% increased damage while (\w+)$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'damage',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage' }],
          condition: { type: 'while', requirement: match[2].toLowerCase() }
        })
      },
      
      {
        regex: /^(\d+)% more damage if you['']ve (\w+) recently$/i,
        handler: (match) => ({
          type: 'MORE',
          name: 'damage',
          value: parseFloat(match[1]),
          tags: [{ type: 'damage' }],
          condition: { type: 'if', requirement: `${match[2].toLowerCase()}_recently` }
        })
      },
      
      {
        regex: /^(\d+)% increased attack speed if you['']ve (\w+) recently$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'attack_speed',
          value: parseFloat(match[1]),
          tags: [{ type: 'speed' }],
          condition: { type: 'if', requirement: `${match[2].toLowerCase()}_recently` }
        })
      },
      
      // Charges
      {
        regex: /^\+(\d+) to maximum (\w+) charges$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `maximum_${match[2].toLowerCase()}_charges`,
          value: parseFloat(match[1]),
          tags: [{ type: 'resource' }]
        })
      },
      
      // Leech
      {
        regex: /^(\d+(?:\.\d+)?)% of (\w+) damage leeched as life$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `${match[2].toLowerCase()}_damage_life_leech`,
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'leech' }]
        })
      },
      
      {
        regex: /^(\d+(?:\.\d+)?)% of (\w+) damage leeched as mana$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: `${match[2].toLowerCase()}_damage_mana_leech`,
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'leech' }]
        })
      },
      
      // Regeneration
      {
        regex: /^regenerate (\d+(?:\.\d+)?)% of life per second$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'life_regeneration_percent',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'regeneration' }]
        })
      },
      
      {
        regex: /^regenerate (\d+) life per second$/i,
        handler: (match) => ({
          type: 'ADDED',
          name: 'life_regeneration_flat',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'regeneration' }]
        })
      },
      
      // Recovery rate
      {
        regex: /^(\d+)% increased life recovery rate$/i,
        handler: (match) => ({
          type: 'INC',
          name: 'life_recovery_rate',
          value: parseFloat(match[1]),
          tags: [{ type: 'resource', subtype: 'recovery' }]
        })
      },
      
      // Keystones and special flags
      {
        regex: /^your (\w+) damage can (\w+)$/i,
        handler: (match) => ({
          type: 'FLAG',
          name: `${match[1].toLowerCase()}_can_${match[2].toLowerCase()}`,
          value: 1,
          tags: [{ type: 'damage' }],
          isKeystone: true
        })
      },
      
      {
        regex: /^cannot (\w+)$/i,
        handler: (match) => ({
          type: 'FLAG',
          name: `cannot_${match[1].toLowerCase()}`,
          value: 1,
          tags: [{ type: 'condition' }],
          isKeystone: true
        })
      }
    );
  }

  /**
   * Export modifier data for debugging
   */
  export(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, mods] of this.modifiers) {
      result[key] = mods.map(mod => ({
        type: mod.type,
        value: mod.value,
        source: mod.source,
        condition: mod.condition,
        isLocal: mod.isLocal
      }));
    }
    
    return result;
  }
}

export default ModifierList;