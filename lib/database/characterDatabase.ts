interface CharacterSnapshot {
  id: string;
  accountName: string;
  characterName: string;
  class: string;
  level: number;
  league: string;
  timestamp: number;
  experience: number;
  equipment: {
    weapon?: any;
    armor?: any[];
    accessories?: any[];
  };
  passiveHashes: number[];
  skillGems: any[];
  stats: {
    life: number;
    energyShield: number;
    mana: number;
    attributes: {
      strength: number;
      dexterity: number;
      intelligence: number;
    };
  };
  buildComplexity?: number;
  dpsEstimate?: number;
}

interface BuildArchetype {
  name: string;
  class: string;
  keySkills: string[];
  weaponTypes: string[];
  defenseType: 'life' | 'es' | 'hybrid';
  popularity: number;
  averageLevel: number;
  trend: 'rising' | 'stable' | 'falling';
}

interface CommunityMetrics {
  lastUpdated: number;
  totalCharacters: number;
  classDistribution: { [className: string]: number };
  levelDistribution: { [range: string]: number };
  buildArchetypes: BuildArchetype[];
  equipmentUsage: {
    uniques: { [itemName: string]: number };
    weaponTypes: { [weaponType: string]: number };
  };
  averageLevel: number;
  averageDPS: number;
  averageEHP: number;
}

class CharacterDatabase {
  private static instance: CharacterDatabase;
  private snapshots: CharacterSnapshot[] = [];
  private metrics: CommunityMetrics | null = null;
  private readonly STORAGE_KEY = 'poe2-character-snapshots';
  private readonly METRICS_KEY = 'poe2-community-metrics';
  private readonly MAX_SNAPSHOTS = 10000; // Limit storage size

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): CharacterDatabase {
    if (!CharacterDatabase.instance) {
      CharacterDatabase.instance = new CharacterDatabase();
    }
    return CharacterDatabase.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const snapshotsData = localStorage.getItem(this.STORAGE_KEY);
      if (snapshotsData) {
        this.snapshots = JSON.parse(snapshotsData);
      }

      const metricsData = localStorage.getItem(this.METRICS_KEY);
      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }
    } catch (error) {
      console.error('Failed to load character database from storage:', error);
      this.snapshots = [];
      this.metrics = null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Keep only recent snapshots to manage storage size
      const recentSnapshots = this.snapshots
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_SNAPSHOTS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentSnapshots));

      if (this.metrics) {
        localStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
      }
    } catch (error) {
      console.error('Failed to save character database to storage:', error);
    }
  }

  addCharacterSnapshot(character: any): void {
    const snapshot: CharacterSnapshot = {
      id: `${character.name}_${Date.now()}`,
      accountName: character.account || 'unknown',
      characterName: character.name,
      class: character.class,
      level: character.level,
      league: character.league || 'Standard',
      timestamp: Date.now(),
      experience: character.experience || 0,
      equipment: {
        weapon: character.equipment?.find((item: any) =>
          item?.inventoryId === 'Weapon' || item?.inventoryId === 'Weapon2'
        ),
        armor: character.equipment?.filter((item: any) =>
          ['BodyArmour', 'Helmet', 'Gloves', 'Boots'].includes(item?.inventoryId)
        ) || [],
        accessories: character.equipment?.filter((item: any) =>
          ['Ring', 'Ring2', 'Amulet', 'Belt'].includes(item?.inventoryId)
        ) || []
      },
      passiveHashes: character.passives?.hashes || [],
      skillGems: character.skillGems || [],
      stats: {
        life: character.life || 0,
        energyShield: character.energyShield || 0,
        mana: character.mana || 0,
        attributes: {
          strength: character.attributes?.strength || 0,
          dexterity: character.attributes?.dexterity || 0,
          intelligence: character.attributes?.intelligence || 0
        }
      }
    };

    // Remove old snapshots for the same character
    this.snapshots = this.snapshots.filter(
      s => s.characterName !== character.name || s.accountName !== snapshot.accountName
    );

    this.snapshots.push(snapshot);
    this.saveToStorage();
  }

  addMultipleSnapshots(characters: any[]): void {
    characters.forEach(char => this.addCharacterSnapshot(char));
    this.recalculateMetrics();
  }

  private recalculateMetrics(): void {
    if (this.snapshots.length === 0) {
      this.metrics = null;
      return;
    }

    const now = Date.now();
    const recentSnapshots = this.snapshots.filter(
      s => now - s.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    if (recentSnapshots.length === 0) {
      this.metrics = null;
      return;
    }

    // Class distribution
    const classDistribution: { [key: string]: number } = {};
    recentSnapshots.forEach(snapshot => {
      classDistribution[snapshot.class] = (classDistribution[snapshot.class] || 0) + 1;
    });

    // Level distribution
    const levelRanges = [
      { range: '1-20', min: 1, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ];

    const levelDistribution: { [key: string]: number } = {};
    levelRanges.forEach(({ range, min, max }) => {
      levelDistribution[range] = recentSnapshots.filter(
        s => s.level >= min && s.level <= max
      ).length;
    });

    // Equipment usage analysis
    const uniqueItems: { [key: string]: number } = {};
    const weaponTypes: { [key: string]: number } = {};

    recentSnapshots.forEach(snapshot => {
      // Track unique items
      const allEquipment = [
        snapshot.equipment.weapon,
        ...(snapshot.equipment.armor || []),
        ...(snapshot.equipment.accessories || [])
      ].filter(Boolean);

      allEquipment.forEach((item: any) => {
        if (item?.frameType === 3) { // Unique items have frameType 3
          const itemName = item.typeLine || item.baseType || 'Unknown Unique';
          uniqueItems[itemName] = (uniqueItems[itemName] || 0) + 1;
        }
      });

      // Track weapon types
      if (snapshot.equipment.weapon) {
        const weaponType = this.getWeaponType(snapshot.equipment.weapon);
        if (weaponType) {
          weaponTypes[weaponType] = (weaponTypes[weaponType] || 0) + 1;
        }
      }
    });

    // Build archetypes (simplified analysis)
    const buildArchetypes = this.analyzeBuildArchetypes(recentSnapshots);

    // Calculate averages
    const totalLevel = recentSnapshots.reduce((sum, s) => sum + s.level, 0);
    const averageLevel = totalLevel / recentSnapshots.length;

    this.metrics = {
      lastUpdated: now,
      totalCharacters: recentSnapshots.length,
      classDistribution,
      levelDistribution,
      buildArchetypes,
      equipmentUsage: {
        uniques: uniqueItems,
        weaponTypes
      },
      averageLevel: parseFloat(averageLevel.toFixed(1)),
      averageDPS: 0, // Would need DPS calculations
      averageEHP: 0  // Would need EHP calculations
    };

    this.saveToStorage();
  }

  private getWeaponType(weapon: any): string | null {
    if (!weapon?.baseType && !weapon?.typeLine) return null;

    const weaponName = (weapon.typeLine || weapon.baseType || '').toLowerCase();

    if (weaponName.includes('bow')) return 'Bows';
    if (weaponName.includes('crossbow')) return 'Crossbows';
    if (weaponName.includes('staff') || weaponName.includes('quarterstaff')) {
      return weaponName.includes('quarterstaff') ? 'Quarterstaffs' : 'Staves';
    }
    if (weaponName.includes('sword')) return 'Swords';
    if (weaponName.includes('mace') || weaponName.includes('hammer')) return 'Maces';
    if (weaponName.includes('claw')) return 'Claws';
    if (weaponName.includes('dagger')) return 'Daggers';
    if (weaponName.includes('axe')) return 'Axes';
    if (weaponName.includes('wand')) return 'Wands';

    return 'Other';
  }

  private analyzeBuildArchetypes(snapshots: CharacterSnapshot[]): BuildArchetype[] {
    // Group by class and analyze patterns
    const classBuildPatterns: { [className: string]: any[] } = {};

    snapshots.forEach(snapshot => {
      if (!classBuildPatterns[snapshot.class]) {
        classBuildPatterns[snapshot.class] = [];
      }
      classBuildPatterns[snapshot.class].push(snapshot);
    });

    const archetypes: BuildArchetype[] = [];

    Object.entries(classBuildPatterns).forEach(([className, characters]) => {
      if (characters.length < 5) return; // Need minimum sample size

      // Analyze weapon preferences for this class
      const weaponUsage: { [weapon: string]: number } = {};
      characters.forEach(char => {
        const weaponType = this.getWeaponType(char.equipment.weapon);
        if (weaponType) {
          weaponUsage[weaponType] = (weaponUsage[weaponType] || 0) + 1;
        }
      });

      // Create archetype based on most popular weapon type
      const topWeapon = Object.entries(weaponUsage)
        .sort(([,a], [,b]) => b - a)[0];

      if (topWeapon) {
        const [weaponType, count] = topWeapon;
        const popularity = (count / characters.length) * 100;

        if (popularity > 20) { // Only include if weapon is used by >20% of class
          archetypes.push({
            name: `${weaponType} ${className}`,
            class: className,
            keySkills: [], // Would need skill gem analysis
            weaponTypes: [weaponType],
            defenseType: 'life', // Would need defense analysis
            popularity: parseFloat(popularity.toFixed(1)),
            averageLevel: parseFloat((
              characters.reduce((sum, c) => sum + c.level, 0) / characters.length
            ).toFixed(1)),
            trend: 'stable' // Would need historical comparison
          });
        }
      }
    });

    return archetypes.sort((a, b) => b.popularity - a.popularity);
  }

  getCommunityMetrics(): CommunityMetrics | null {
    return this.metrics;
  }

  getRecentSnapshots(days = 7): CharacterSnapshot[] {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return this.snapshots.filter(s => s.timestamp > cutoff);
  }

  getCharacterHistory(characterName: string, accountName?: string): CharacterSnapshot[] {
    return this.snapshots
      .filter(s =>
        s.characterName === characterName &&
        (!accountName || s.accountName === accountName)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getTotalCharacterCount(): number {
    return this.snapshots.length;
  }

  clearOldData(daysToKeep = 30): void {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff);
    this.saveToStorage();
    this.recalculateMetrics();
  }
}

export default CharacterDatabase;
export type { CharacterSnapshot, BuildArchetype, CommunityMetrics };