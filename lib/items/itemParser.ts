import type { Item } from '@/types/character';

export interface ParsedWeapon {
  name: string;
  type: string;
  baseDamage: {
    physical?: { min: number; max: number };
    elemental?: {
      fire?: { min: number; max: number };
      cold?: { min: number; max: number };
      lightning?: { min: number; max: number };
    };
    chaos?: { min: number; max: number };
  };
  attacksPerSecond: number;
  criticalChance: number;
  requirements: {
    level: number;
    strength?: number;
    dexterity?: number;
    intelligence?: number;
  };
  sockets: {
    total: number;
    links: number[];
    colors: { R: number; G: number; B: number; W: number };
  };
  mods: {
    implicit: string[];
    explicit: string[];
    crafted: string[];
    fractured: string[];
  };
}

export interface ParsedArmour {
  name: string;
  type: string;
  defenses: {
    armour?: number;
    evasion?: number;
    energyShield?: number;
    ward?: number;
  };
  requirements: {
    level: number;
    strength?: number;
    dexterity?: number;
    intelligence?: number;
  };
  sockets: {
    total: number;
    links: number[];
    colors: { R: number; G: number; B: number; W: number };
  };
  mods: {
    implicit: string[];
    explicit: string[];
    crafted: string[];
    fractured: string[];
  };
}

export interface ParsedJewel {
  name: string;
  type: string;
  radius?: number;
  limit?: number;
  mods: {
    explicit: string[];
  };
}

export class ItemParser {
  static parseWeapon(item: Item): ParsedWeapon | null {
    if (!this.isWeapon(item)) return null;

    const weapon: ParsedWeapon = {
      name: item.name || item.typeLine || 'Unknown',
      type: item.typeLine || 'Unknown',
      baseDamage: this.parseWeaponDamage(item),
      attacksPerSecond: this.parseAttackSpeed(item),
      criticalChance: this.parseCriticalChance(item),
      requirements: this.parseRequirements(item),
      sockets: this.parseSockets(item),
      mods: {
        implicit: item.implicitMods || [],
        explicit: item.explicitMods || [],
        crafted: item.craftedMods || [],
        fractured: item.fracturedMods || []
      }
    };

    return weapon;
  }

  static parseArmour(item: Item): ParsedArmour | null {
    if (!this.isArmour(item)) return null;

    const armour: ParsedArmour = {
      name: item.name || item.typeLine || 'Unknown',
      type: item.typeLine || 'Unknown',
      defenses: this.parseDefenses(item),
      requirements: this.parseRequirements(item),
      sockets: this.parseSockets(item),
      mods: {
        implicit: item.implicitMods || [],
        explicit: item.explicitMods || [],
        crafted: item.craftedMods || [],
        fractured: item.fracturedMods || []
      }
    };

    return armour;
  }

  static parseJewel(item: Item): ParsedJewel | null {
    if (!this.isJewel(item)) return null;

    const jewel: ParsedJewel = {
      name: item.name || item.typeLine || 'Unknown',
      type: item.typeLine || 'Unknown',
      radius: this.parseJewelRadius(item),
      limit: item.jewelData?.limit,
      mods: {
        explicit: item.explicitMods || []
      }
    };

    return jewel;
  }

  private static isWeapon(item: Item): boolean {
    const weaponTypes = ['Weapon', 'Weapon2', 'Offhand', 'Offhand2'];
    return weaponTypes.includes(item.inventoryId || '');
  }

  private static isArmour(item: Item): boolean {
    const armourTypes = ['Helm', 'BodyArmour', 'Gloves', 'Boots', 'Belt', 'Ring', 'Ring2', 'Amulet'];
    return armourTypes.includes(item.inventoryId || '');
  }

  private static isJewel(item: Item): boolean {
    return item.frameType === 4; // Jewel frame type in PoE
  }

  private static parseWeaponDamage(item: Item): ParsedWeapon['baseDamage'] {
    const damage: ParsedWeapon['baseDamage'] = {};

    // Parse physical damage from properties
    const physProp = item.properties?.find(p => p.name === 'Physical Damage');
    if (physProp && physProp.values?.[0]) {
      const damageStr = physProp.values[0][0];
      const match = damageStr.match(/(\d+)-(\d+)/);
      if (match) {
        damage.physical = {
          min: parseInt(match[1]),
          max: parseInt(match[2])
        };
      }
    }

    // Parse elemental damage from properties
    const eleProp = item.properties?.find(p => p.name === 'Elemental Damage');
    if (eleProp && eleProp.values?.[0]) {
      damage.elemental = this.parseElementalDamage(eleProp.values[0][0]);
    }

    // Parse chaos damage
    const chaosProp = item.properties?.find(p => p.name === 'Chaos Damage');
    if (chaosProp && chaosProp.values?.[0]) {
      const damageStr = chaosProp.values[0][0];
      const match = damageStr.match(/(\d+)-(\d+)/);
      if (match) {
        damage.chaos = {
          min: parseInt(match[1]),
          max: parseInt(match[2])
        };
      }
    }

    return damage;
  }

  private static parseElementalDamage(damageStr: string) {
    const elemental: any = {};

    // Parse fire damage
    const fireMatch = damageStr.match(/(\d+)-(\d+) \(Fire\)/);
    if (fireMatch) {
      elemental.fire = {
        min: parseInt(fireMatch[1]),
        max: parseInt(fireMatch[2])
      };
    }

    // Parse cold damage
    const coldMatch = damageStr.match(/(\d+)-(\d+) \(Cold\)/);
    if (coldMatch) {
      elemental.cold = {
        min: parseInt(coldMatch[1]),
        max: parseInt(coldMatch[2])
      };
    }

    // Parse lightning damage
    const lightningMatch = damageStr.match(/(\d+)-(\d+) \(Lightning\)/);
    if (lightningMatch) {
      elemental.lightning = {
        min: parseInt(lightningMatch[1]),
        max: parseInt(lightningMatch[2])
      };
    }

    return elemental;
  }

  private static parseAttackSpeed(item: Item): number {
    const asProp = item.properties?.find(p => p.name === 'Attacks per Second');
    if (asProp && asProp.values?.[0]) {
      return parseFloat(asProp.values[0][0]);
    }
    return 1.0;
  }

  private static parseCriticalChance(item: Item): number {
    const critProp = item.properties?.find(p => p.name === 'Critical Strike Chance');
    if (critProp && critProp.values?.[0]) {
      const critStr = critProp.values[0][0];
      const match = critStr.match(/(\d+\.?\d*)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    return 5.0; // Default crit chance
  }

  private static parseDefenses(item: Item): ParsedArmour['defenses'] {
    const defenses: ParsedArmour['defenses'] = {};

    // Armour
    const armourProp = item.properties?.find(p => p.name === 'Armour');
    if (armourProp && armourProp.values?.[0]) {
      defenses.armour = parseInt(armourProp.values[0][0]);
    }

    // Evasion
    const evasionProp = item.properties?.find(p => p.name === 'Evasion Rating');
    if (evasionProp && evasionProp.values?.[0]) {
      defenses.evasion = parseInt(evasionProp.values[0][0]);
    }

    // Energy Shield
    const esProp = item.properties?.find(p => p.name === 'Energy Shield');
    if (esProp && esProp.values?.[0]) {
      defenses.energyShield = parseInt(esProp.values[0][0]);
    }

    // Ward (PoE 2)
    const wardProp = item.properties?.find(p => p.name === 'Ward');
    if (wardProp && wardProp.values?.[0]) {
      defenses.ward = parseInt(wardProp.values[0][0]);
    }

    return defenses;
  }

  private static parseRequirements(item: Item) {
    const requirements = {
      level: 1,
      strength: undefined as number | undefined,
      dexterity: undefined as number | undefined,
      intelligence: undefined as number | undefined
    };

    if (!item.requirements) return requirements;

    item.requirements.forEach(req => {
      if (req.name === 'Level' && req.values?.[0]) {
        requirements.level = parseInt(req.values[0][0]);
      } else if (req.name === 'Str' && req.values?.[0]) {
        requirements.strength = parseInt(req.values[0][0]);
      } else if (req.name === 'Dex' && req.values?.[0]) {
        requirements.strength = parseInt(req.values[0][0]);
      } else if (req.name === 'Int' && req.values?.[0]) {
        requirements.intelligence = parseInt(req.values[0][0]);
      }
    });

    return requirements;
  }

  private static parseSockets(item: Item) {
    const sockets = {
      total: 0,
      links: [] as number[],
      colors: { R: 0, G: 0, B: 0, W: 0 }
    };

    if (!item.sockets) return sockets;

    sockets.total = item.sockets.length;

    // Count socket colors
    item.sockets.forEach(socket => {
      if (socket.sColour === 'R') sockets.colors.R++;
      else if (socket.sColour === 'G') sockets.colors.G++;
      else if (socket.sColour === 'B') sockets.colors.B++;
      else if (socket.sColour === 'W') sockets.colors.W++;
    });

    // Calculate link groups
    const linkGroups: Map<number, number> = new Map();
    item.sockets.forEach(socket => {
      const group = socket.group || 0;
      linkGroups.set(group, (linkGroups.get(group) || 0) + 1);
    });

    sockets.links = Array.from(linkGroups.values()).sort((a, b) => b - a);

    return sockets;
  }

  private static parseJewelRadius(item: Item): number | undefined {
    // Check for radius in explicit mods
    const radiusMod = item.explicitMods?.find(mod =>
      mod.includes('Radius:') || mod.includes('radius')
    );

    if (radiusMod) {
      const match = radiusMod.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return item.jewelData?.radius;
  }

  // Extract numerical values from mod strings
  static extractModValue(mod: string, pattern: RegExp): number {
    const match = mod.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return 0;
  }

  // Common mod patterns
  static MOD_PATTERNS = {
    INCREASED_PHYSICAL: /(\d+)% increased Physical Damage/,
    ADDED_PHYSICAL: /Adds (\d+) to (\d+) Physical Damage/,
    INCREASED_ATTACK_SPEED: /(\d+)% increased Attack Speed/,
    INCREASED_CRITICAL_CHANCE: /(\d+)% increased Critical Strike Chance/,
    INCREASED_CRITICAL_MULTI: /\+(\d+)% to Critical Strike Multiplier/,
    LIFE: /\+(\d+) to maximum Life/,
    MANA: /\+(\d+) to maximum Mana/,
    RESISTANCE: /\+(\d+)% to (.+) Resistance/,
    ALL_RESISTANCES: /\+(\d+)% to all Elemental Resistances/,
  };
}