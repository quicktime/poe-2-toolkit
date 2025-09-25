import type {
  SkillGem,
  SupportGem,
  SkillLink,
  UncutGem,
  SkillSetup,
  EquipmentSlot
} from '@/types/skillGems';
import { MOCK_SKILL_GEMS, MOCK_SUPPORT_GEMS } from '@/types/skillGems';

export class SkillGemService {
  private static instance: SkillGemService;
  private activeGems: Map<string, SkillGem> = new Map();
  private supportGems: Map<string, SupportGem> = new Map();

  private constructor() {
    this.loadMockData();
  }

  static getInstance(): SkillGemService {
    if (!SkillGemService.instance) {
      SkillGemService.instance = new SkillGemService();
    }
    return SkillGemService.instance;
  }

  private loadMockData() {
    // Load mock skill gems
    MOCK_SKILL_GEMS.forEach(gem => {
      this.activeGems.set(gem.id, gem);
    });

    // Load mock support gems
    MOCK_SUPPORT_GEMS.forEach(gem => {
      this.supportGems.set(gem.id, gem);
    });
  }

  // Get all available active skill gems
  getActiveGems(): SkillGem[] {
    return Array.from(this.activeGems.values());
  }

  // Get all available support gems
  getSupportGems(): SupportGem[] {
    return Array.from(this.supportGems.values());
  }

  // Get gems by color
  getGemsByColor(color: string): (SkillGem | SupportGem)[] {
    const gems: (SkillGem | SupportGem)[] = [];
    this.activeGems.forEach(gem => {
      if (gem.color === color) gems.push(gem);
    });
    this.supportGems.forEach(gem => {
      if (gem.color === color) gems.push(gem);
    });
    return gems;
  }

  // Check if a support gem can support an active gem
  canSupport(supportGem: SupportGem, activeGem: SkillGem): boolean {
    // Check if active gem has any of the supported tags
    const hasSupported = supportGem.supportedTags.some(tag =>
      activeGem.tags.includes(tag)
    );

    // Check if active gem has any excluded tags
    const hasExcluded = supportGem.excludedTags.some(tag =>
      activeGem.tags.includes(tag)
    );

    return hasSupported && !hasExcluded;
  }

  // Get valid support gems for an active gem
  getValidSupports(activeGem: SkillGem): SupportGem[] {
    return Array.from(this.supportGems.values()).filter(support =>
      this.canSupport(support, activeGem)
    );
  }

  // Calculate mana cost for a skill link
  calculateManaCost(skillLink: SkillLink): number {
    let baseCost = 10; // Base mana cost (would come from gem data)
    let multiplier = 1;

    // Apply support gem multipliers
    skillLink.supportGems.forEach(support => {
      multiplier *= support.manaMultiplier;
    });

    return Math.round(baseCost * multiplier);
  }

  // Calculate total damage effectiveness
  calculateDamageEffectiveness(skillLink: SkillLink): number {
    let effectiveness = 1;

    // Base effectiveness from active gem
    const baseStat = skillLink.activeGem.stats.find(s => s.id === 'base_damage');
    if (baseStat && baseStat.values[0]) {
      effectiveness = baseStat.values[0] / 100;
    }

    // Apply support gem modifiers
    skillLink.supportGems.forEach(support => {
      support.stats.forEach(stat => {
        if (stat.id === 'damage_effectiveness') {
          effectiveness *= (1 + stat.values[0] / 100);
        }
      });
    });

    return effectiveness;
  }

  // Create a skill link
  createSkillLink(
    activeGem: SkillGem,
    supportGems: SupportGem[],
    slot: EquipmentSlot,
    linkGroup: number = 0
  ): SkillLink {
    // Filter out invalid supports
    const validSupports = supportGems.filter(support =>
      this.canSupport(support, activeGem)
    );

    const skillLink: SkillLink = {
      id: `${activeGem.id}_${slot}_${linkGroup}`,
      activeGem,
      supportGems: validSupports,
      slot,
      linkGroup,
      manaCost: 0,
      castTime: this.getCastTime(activeGem),
      cooldown: this.getCooldown(activeGem)
    };

    // Calculate mana cost
    skillLink.manaCost = this.calculateManaCost(skillLink);

    return skillLink;
  }

  private getCastTime(gem: SkillGem): number | undefined {
    const castStat = gem.stats.find(s => s.id === 'cast_time');
    return castStat ? castStat.values[0] : undefined;
  }

  private getCooldown(gem: SkillGem): number | undefined {
    const cdStat = gem.stats.find(s => s.id === 'cooldown');
    return cdStat ? cdStat.values[0] : undefined;
  }

  // Parse skill setup from character items
  parseCharacterSkills(items: any[]): SkillSetup {
    const setup: SkillSetup = {
      mainSkills: [],
      auraSkills: [],
      utilitySkills: [],
      movementSkills: [],
      uncutGems: [],
      totalSpiritUsed: 0
    };

    // Parse socketed gems from items
    items.forEach(item => {
      if (item.socketedItems && item.socketedItems.length > 0) {
        const slot = item.inventoryId as EquipmentSlot;

        // Group gems by link group
        const linkGroups: Map<number, any[]> = new Map();
        item.socketedItems.forEach((socketedItem: any, index: number) => {
          const group = item.sockets?.[index]?.group || 0;
          if (!linkGroups.has(group)) {
            linkGroups.set(group, []);
          }
          linkGroups.get(group)?.push(socketedItem);
        });

        // Create skill links for each group
        linkGroups.forEach((gems, group) => {
          const activeGem = gems.find(g => g.type === 'Active');
          if (activeGem) {
            const supports = gems.filter(g => g.type === 'Support');
            const skillLink = this.createSkillLinkFromItems(activeGem, supports, slot, group);

            // Categorize skill
            if (activeGem.tags?.includes('Aura')) {
              setup.auraSkills.push(skillLink);
            } else if (activeGem.tags?.includes('Movement')) {
              setup.movementSkills.push(skillLink);
            } else if (this.isUtilitySkill(activeGem)) {
              setup.utilitySkills.push(skillLink);
            } else {
              setup.mainSkills.push(skillLink);
            }
          }
        });
      }
    });

    return setup;
  }

  private createSkillLinkFromItems(
    activeItem: any,
    supportItems: any[],
    slot: EquipmentSlot,
    linkGroup: number
  ): SkillLink {
    // Convert item data to skill gem format
    const activeGem: SkillGem = {
      id: activeItem.typeLine?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
      name: activeItem.typeLine || 'Unknown',
      type: 'Active',
      color: this.getGemColor(activeItem),
      level: activeItem.properties?.find((p: any) => p.name === 'Level')?.values[0][0] || 1,
      quality: activeItem.properties?.find((p: any) => p.name === 'Quality')?.values[0][0] || 0,
      tags: activeItem.explicitMods?.[0]?.split(', ') || [],
      requirements: {
        level: activeItem.requirements?.find((r: any) => r.name === 'Level')?.values[0][0] || 1
      },
      stats: []
    };

    const supportGems: SupportGem[] = supportItems.map(item => ({
      id: item.typeLine?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
      name: item.typeLine || 'Unknown',
      type: 'Support' as const,
      color: this.getGemColor(item),
      level: item.properties?.find((p: any) => p.name === 'Level')?.values[0][0] || 1,
      quality: item.properties?.find((p: any) => p.name === 'Quality')?.values[0][0] || 0,
      tags: ['Support'],
      supportedTags: [],
      excludedTags: [],
      manaMultiplier: 1.2,
      requirements: {
        level: item.requirements?.find((r: any) => r.name === 'Level')?.values[0][0] || 1
      },
      stats: []
    }));

    return this.createSkillLink(activeGem, supportGems, slot, linkGroup);
  }

  private getGemColor(item: any): 'Red' | 'Green' | 'Blue' | 'White' {
    if (item.properties) {
      const prop = item.properties.find((p: any) => p.name === 'Gem Colour');
      if (prop?.values?.[0]?.[0]) {
        const color = prop.values[0][0];
        if (color.includes('Red')) return 'Red';
        if (color.includes('Green')) return 'Green';
        if (color.includes('Blue')) return 'Blue';
        if (color.includes('White')) return 'White';
      }
    }
    return 'Red'; // Default
  }

  private isUtilitySkill(gem: any): boolean {
    const utilityTags = ['Curse', 'Guard', 'Banner', 'Golem', 'Trap', 'Mine', 'Totem'];
    return utilityTags.some(tag => gem.tags?.includes(tag));
  }

  // Export/Import skill setup
  exportSetup(setup: SkillSetup): string {
    const exportData = {
      version: '1.0.0',
      mainSkills: setup.mainSkills.map(s => ({
        gem: s.activeGem.id,
        supports: s.supportGems.map(sg => sg.id),
        slot: s.slot
      })),
      auraSkills: setup.auraSkills.map(s => ({
        gem: s.activeGem.id,
        supports: s.supportGems.map(sg => sg.id),
        slot: s.slot
      })),
      uncutGems: setup.uncutGems.map(u => u.id)
    };

    return btoa(JSON.stringify(exportData));
  }

  importSetup(encoded: string): SkillSetup | null {
    try {
      const data = JSON.parse(atob(encoded));

      const setup: SkillSetup = {
        mainSkills: [],
        auraSkills: [],
        utilitySkills: [],
        movementSkills: [],
        uncutGems: [],
        totalSpiritUsed: 0
      };

      // Reconstruct main skills
      data.mainSkills?.forEach((skill: any) => {
        const activeGem = this.activeGems.get(skill.gem);
        if (activeGem) {
          const supports = skill.supports
            .map((id: string) => this.supportGems.get(id))
            .filter(Boolean) as SupportGem[];

          const skillLink = this.createSkillLink(activeGem, supports, skill.slot);
          setup.mainSkills.push(skillLink);
        }
      });

      // Reconstruct aura skills
      data.auraSkills?.forEach((skill: any) => {
        const activeGem = this.activeGems.get(skill.gem);
        if (activeGem) {
          const supports = skill.supports
            .map((id: string) => this.supportGems.get(id))
            .filter(Boolean) as SupportGem[];

          const skillLink = this.createSkillLink(activeGem, supports, skill.slot);
          setup.auraSkills.push(skillLink);
        }
      });

      return setup;
    } catch (error) {
      console.error('Failed to import skill setup:', error);
      return null;
    }
  }
}

export const skillGemService = SkillGemService.getInstance();