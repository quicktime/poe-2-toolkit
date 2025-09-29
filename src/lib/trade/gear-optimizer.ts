import { TRADE_MODS, TRADE_CATEGORIES, buildStatFilter } from '@/lib/data/trade-mods';

export interface ItemRequirements {
  slot: string;
  minRarity: number;
  minLife: number;
  minResistance: number;
  minMovementSpeed?: number;
  maxLevel: number;
  weight: {
    rarity: number;
    life: number;
    resistance: number;
    movementSpeed?: number;
    price: number;
  };
}

export interface OptimizedItem {
  id: string;
  slot: string;
  score: number;
  rarity: number;
  life: number;
  resistance: number;
  movementSpeed?: number;
  price: number;
  pricePerRarity: number;
  item: any;
  whisper: string;
  tradeUrl: string;
}

export class GearOptimizer {
  private readonly requirements: Record<string, ItemRequirements> = {
    boots: {
      slot: TRADE_CATEGORIES.BOOTS,
      minRarity: 15,
      minLife: 70,
      minResistance: 70,
      minMovementSpeed: 30,
      maxLevel: 76,
      weight: {
        rarity: 0.3,
        life: 0.1,
        resistance: 0.1,
        movementSpeed: 0.4,
        price: 0.1
      }
    },
    body: {
      slot: TRADE_CATEGORIES.BODY,
      minRarity: 20,
      minLife: 90,
      minResistance: 80,
      maxLevel: 76,
      weight: {
        rarity: 0.4,
        life: 0.2,
        resistance: 0.3,
        price: 0.1
      }
    },
    helmet: {
      slot: TRADE_CATEGORIES.HELMET,
      minRarity: 15,
      minLife: 80,
      minResistance: 70,
      maxLevel: 76,
      weight: {
        rarity: 0.4,
        life: 0.2,
        resistance: 0.3,
        price: 0.1
      }
    },
    gloves: {
      slot: TRADE_CATEGORIES.GLOVES,
      minRarity: 12,
      minLife: 70,
      minResistance: 70,
      maxLevel: 76,
      weight: {
        rarity: 0.4,
        life: 0.2,
        resistance: 0.3,
        price: 0.1
      }
    },
    belt: {
      slot: TRADE_CATEGORIES.BELT,
      minRarity: 18,
      minLife: 90,
      minResistance: 70,
      maxLevel: 76,
      weight: {
        rarity: 0.35,
        life: 0.25,
        resistance: 0.3,
        price: 0.1
      }
    },
    ring1: {
      slot: TRADE_CATEGORIES.RING,
      minRarity: 35, // Including implicit
      minLife: 60,
      minResistance: 70,
      maxLevel: 76,
      weight: {
        rarity: 0.5,
        life: 0.15,
        resistance: 0.25,
        price: 0.1
      }
    },
    ring2: {
      slot: TRADE_CATEGORIES.RING,
      minRarity: 35, // Including implicit
      minLife: 60,
      minResistance: 70,
      maxLevel: 76,
      weight: {
        rarity: 0.5,
        life: 0.15,
        resistance: 0.25,
        price: 0.1
      }
    },
    amulet: {
      slot: TRADE_CATEGORIES.AMULET,
      minRarity: 28,
      minLife: 70,
      minResistance: 50,
      maxLevel: 76,
      weight: {
        rarity: 0.5,
        life: 0.2,
        resistance: 0.2,
        price: 0.1
      }
    },
    weapon: {
      slot: TRADE_CATEGORIES.WEAPON,
      minRarity: 25,
      minLife: 0,
      minResistance: 0,
      maxLevel: 76,
      weight: {
        rarity: 0.6,
        life: 0,
        resistance: 0,
        price: 0.4
      }
    }
  };

  private parseItemMods(item: any): {
    rarity: number;
    life: number;
    resistance: number;
    movementSpeed: number;
    spellDamage: number;
    castSpeed: number;
  } {
    let stats = {
      rarity: 0,
      life: 0,
      resistance: 0,
      movementSpeed: 0,
      spellDamage: 0,
      castSpeed: 0
    };

    // Parse implicit mods
    item.item.implicitMods?.forEach((mod: string) => {
      const rarityMatch = mod.match(/(\d+)% increased Rarity/);
      if (rarityMatch) stats.rarity += parseInt(rarityMatch[1]);
    });

    // Parse explicit mods
    item.item.explicitMods?.forEach((mod: string) => {
      // Rarity
      const rarityMatch = mod.match(/(\d+)% increased Rarity/);
      if (rarityMatch) stats.rarity += parseInt(rarityMatch[1]);

      // Life
      const lifeMatch = mod.match(/\+(\d+) to maximum Life/);
      if (lifeMatch) stats.life = Math.max(stats.life, parseInt(lifeMatch[1]));

      // Resistances
      const resMatch = mod.match(/\+(\d+)% to (Fire|Cold|Lightning|all Elemental) Resistance/);
      if (resMatch) {
        const value = parseInt(resMatch[1]);
        if (resMatch[2] === 'all Elemental') {
          stats.resistance += value * 3;
        } else {
          stats.resistance += value;
        }
      }

      // Movement Speed
      const msMatch = mod.match(/(\d+)% increased Movement Speed/);
      if (msMatch) stats.movementSpeed = parseInt(msMatch[1]);

      // Spell Damage
      const spellMatch = mod.match(/(\d+)% increased Spell Damage/);
      if (spellMatch) stats.spellDamage += parseInt(spellMatch[1]);

      // Cast Speed
      const castMatch = mod.match(/(\d+)% increased Cast Speed/);
      if (castMatch) stats.castSpeed += parseInt(castMatch[1]);
    });

    return stats;
  }

  private calculateItemScore(
    item: any,
    requirements: ItemRequirements
  ): number {
    const stats = this.parseItemMods(item);

    // Base score from meeting minimum requirements
    let score = 0;
    let meetsRequirements = true;

    // Check minimums
    if (stats.rarity < requirements.minRarity) meetsRequirements = false;
    if (stats.life < requirements.minLife) meetsRequirements = false;
    if (stats.resistance < requirements.minResistance) meetsRequirements = false;
    if (requirements.minMovementSpeed && stats.movementSpeed < requirements.minMovementSpeed) {
      meetsRequirements = false;
    }

    if (!meetsRequirements) return 0;

    // Calculate weighted score
    score += stats.rarity * requirements.weight.rarity * 10;
    score += stats.life * requirements.weight.life;
    score += stats.resistance * requirements.weight.resistance;

    if (requirements.weight.movementSpeed) {
      score += stats.movementSpeed * requirements.weight.movementSpeed * 5;
    }

    // Price efficiency factor
    const price = this.parsePrice(item.listing.price);
    const priceEfficiency = 100 / (price + 1); // Inverse price weighting
    score += priceEfficiency * requirements.weight.price * 10;

    // Bonus for exceeding requirements
    if (stats.rarity > requirements.minRarity * 1.5) score *= 1.2;
    if (stats.life > requirements.minLife * 1.3) score *= 1.1;
    if (stats.resistance > requirements.minResistance * 1.3) score *= 1.1;

    return Math.round(score);
  }

  private parsePrice(priceObj: { amount: number; currency: string }): number {
    // Convert to chaos equivalent
    const rates: Record<string, number> = {
      'chaos': 1,
      'exalted': 150,
      'divine': 200,
      'alch': 0.5,
      'chance': 0.2,
      'chrom': 0.1,
      'jew': 0.15,
      'fuse': 0.5,
      'gcp': 1,
      'regret': 1,
      'scour': 0.8,
      'blessed': 0.5,
      'c': 1,
      'ex': 150,
      'div': 200
    };

    const currency = priceObj.currency.toLowerCase();
    const rate = rates[currency] || 1;
    return priceObj.amount * rate;
  }

  public optimizeGear(
    slot: string,
    items: any[],
    budget?: number
  ): OptimizedItem[] {
    const requirements = this.requirements[slot];
    if (!requirements) return [];

    const optimizedItems: OptimizedItem[] = [];

    for (const item of items) {
      const score = this.calculateItemScore(item, requirements);
      if (score === 0) continue;

      const stats = this.parseItemMods(item);
      const price = this.parsePrice(item.listing.price);

      if (budget && price > budget) continue;

      optimizedItems.push({
        id: item.id,
        slot: slot,
        score: score,
        rarity: stats.rarity,
        life: stats.life,
        resistance: stats.resistance,
        movementSpeed: stats.movementSpeed || 0,
        price: price,
        pricePerRarity: stats.rarity > 0 ? price / stats.rarity : Infinity,
        item: item,
        whisper: `@${item.listing.account.name} Hi, I would like to buy your ${
          item.item.name || item.item.typeLine
        } listed for ${item.listing.price.amount} ${item.listing.price.currency} in Standard`,
        tradeUrl: `https://www.pathofexile.com/trade2/search/poe2/Standard`
      });
    }

    // Sort by score descending
    return optimizedItems.sort((a, b) => b.score - a.score);
  }

  public buildOptimalLoadout(
    allItems: Record<string, any[]>,
    totalBudget: number
  ): {
    loadout: Record<string, OptimizedItem>;
    totalRarity: number;
    totalCost: number;
    totalLife: number;
    totalResistance: number;
  } {
    const loadout: Record<string, OptimizedItem> = {};
    let remainingBudget = totalBudget;
    let totalRarity = 0;
    let totalLife = 0;
    let totalResistance = 0;

    // Priority order for spending budget
    const slotPriority = [
      'ring1', 'ring2',    // Rings first (highest rarity)
      'amulet',            // Amulet next
      'boots',             // Movement speed critical
      'weapon',            // Rarity weapon
      'body',              // 6-link expensive but important
      'helmet',            // Good rarity slot
      'belt',              // Life and res
      'gloves'             // Lowest priority
    ];

    for (const slot of slotPriority) {
      const items = this.optimizeGear(slot, allItems[slot] || [], remainingBudget);

      if (items.length > 0) {
        // Pick best item within budget
        const bestItem = items[0];

        if (bestItem.price <= remainingBudget) {
          loadout[slot] = bestItem;
          remainingBudget -= bestItem.price;
          totalRarity += bestItem.rarity;
          totalLife += bestItem.life;
          totalResistance += bestItem.resistance;
        }
      }
    }

    return {
      loadout,
      totalRarity,
      totalCost: totalBudget - remainingBudget,
      totalLife,
      totalResistance: Math.min(totalResistance, 225) // Cap at 75% each res
    };
  }

  public generateSearchQuery(slot: string): any {
    const req = this.requirements[slot];
    if (!req) return null;

    const filters = [
      buildStatFilter(TRADE_MODS.RARITY, req.minRarity),
      buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, req.minLife)
    ];

    if (req.minResistance > 0) {
      filters.push(
        buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, req.minResistance)
      );
    }

    if (req.minMovementSpeed) {
      filters.push(
        buildStatFilter(TRADE_MODS.PSEUDO_MOVEMENT_SPEED, req.minMovementSpeed)
      );
    }

    return {
      query: {
        status: { option: "online" },
        stats: [{
          type: "and",
          filters: filters
        }],
        filters: {
          type_filters: {
            filters: {
              category: { option: req.slot }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: req.maxLevel }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
  }
}