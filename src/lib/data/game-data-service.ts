/**
 * Game Data Service
 * Provides access to all Path of Exile 2 game data
 */

import type {
  GameData,
  BaseItem,
  UniqueItem,
  SkillGem,
  PassiveTreeData,
  CurrencyItem,
  PassiveNode,
  SupportGem
} from '../../types/game-data';

/**
 * Game Data Service
 * Singleton service for accessing game data
 */
export class GameDataService {
  private static instance: GameDataService;
  private gameData: Partial<GameData> = {};
  private cache: Map<string, any> = new Map();
  private loaded: boolean = false;

  private constructor() {
    // Initialize empty, will load data async
    this.loadData();
  }

  /**
   * Load data from public folder
   */
  private async loadData(): Promise<void> {
    try {
      const [baseItems, uniqueItems, skillGems, passiveTree, currency, mechanics] = await Promise.all([
        fetch('/data/base_items.json').then(r => r.json()),
        fetch('/data/unique_items.json').then(r => r.json()),
        fetch('/data/skill_gems.json').then(r => r.json()),
        fetch('/data/passive_tree.json').then(r => r.json()),
        fetch('/data/currency.json').then(r => r.json()),
        fetch('/data/game_mechanics.json').then(r => r.json())
      ]);

      this.gameData = {
        version: '0.3',
        patch: 'The Third Edict',
        base_items: this.processBaseItems(baseItems),
        unique_items: uniqueItems as UniqueItem[],
        skill_gems: this.processSkillGems(skillGems),
        passive_tree: passiveTree as PassiveTreeData,
        currency: this.processCurrency(currency),
        spirit_costs: mechanics.spirit_costs,
        damage_formulas: mechanics.damage_formulas,
        atlas: mechanics.atlas,
        quest_rewards: mechanics.quest_rewards,
        vendor_recipes: mechanics.vendor_recipes,
        skill_combos: mechanics.skill_combos
      };

      this.loaded = true;
      console.log('✅ Game data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load game data:', error);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  /**
   * Process base items data
   */
  private processBaseItems(data: any): BaseItem[] {
    const items: BaseItem[] = [];

    for (const [category, categoryItems] of Object.entries(data)) {
      if (Array.isArray(categoryItems)) {
        for (const item of categoryItems) {
          items.push({
            ...item,
            category: category.slice(0, -1) as any // Remove plural 's'
          });
        }
      }
    }

    return items;
  }

  /**
   * Process skill gems data
   */
  private processSkillGems(data: any): SkillGem[] {
    const gems: SkillGem[] = [];

    if (data.active && Array.isArray(data.active)) {
      gems.push(...data.active);
    }

    if (data.support && Array.isArray(data.support)) {
      gems.push(...data.support);
    }

    return gems;
  }

  /**
   * Process currency data
   */
  private processCurrency(data: any): CurrencyItem[] {
    const currency: CurrencyItem[] = [];

    if (data.orbs) currency.push(...data.orbs);
    if (data.shards) currency.push(...data.shards);
    if (data.essences) currency.push(...data.essences);

    return currency;
  }

  // ============== Data Access Methods ==============

  /**
   * Get all base items
   */
  getBaseItems(): BaseItem[] {
    return this.gameData.base_items || [];
  }

  /**
   * Get base items by category
   */
  getBaseItemsByCategory(category: string): BaseItem[] {
    return this.getBaseItems().filter(item => item.category === category);
  }

  /**
   * Get base item by name
   */
  getBaseItem(name: string): BaseItem | undefined {
    return this.getBaseItems().find(item => item.name === name);
  }

  /**
   * Get all unique items
   */
  getUniqueItems(): UniqueItem[] {
    return this.gameData.unique_items || [];
  }

  /**
   * Get unique item by name
   */
  getUniqueItem(name: string): UniqueItem | undefined {
    return this.getUniqueItems().find(item => item.name === name);
  }

  /**
   * Get all skill gems
   */
  getSkillGems(): SkillGem[] {
    return this.gameData.skill_gems || [];
  }

  /**
   * Get active skill gems
   */
  getActiveGems(): SkillGem[] {
    return this.getSkillGems().filter(gem => gem.gem_type === 'active');
  }

  /**
   * Get support gems
   */
  getSupportGems(): SupportGem[] {
    return this.getSkillGems().filter(gem => gem.gem_type === 'support') as SupportGem[];
  }

  /**
   * Get skill gem by name
   */
  getSkillGem(name: string): SkillGem | undefined {
    return this.getSkillGems().find(gem => gem.name === name);
  }

  /**
   * Get passive tree data
   */
  getPassiveTree(): PassiveTreeData | undefined {
    return this.gameData.passive_tree;
  }

  /**
   * Get passive node by ID
   */
  getPassiveNode(id: number): PassiveNode | undefined {
    const tree = this.getPassiveTree();
    return tree?.nodes.find(node => node.id === id);
  }

  /**
   * Get keystone passives
   */
  getKeystones(): PassiveNode[] {
    const tree = this.getPassiveTree();
    return tree?.nodes.filter(node => node.type === 'keystone') || [];
  }

  /**
   * Get notable passives
   */
  getNotables(): PassiveNode[] {
    const tree = this.getPassiveTree();
    return tree?.nodes.filter(node => node.type === 'notable') || [];
  }

  /**
   * Get all currency items
   */
  getCurrency(): CurrencyItem[] {
    return this.gameData.currency || [];
  }

  /**
   * Get currency by type
   */
  getCurrencyByType(type: string): CurrencyItem[] {
    return this.getCurrency().filter(item => item.type === type);
  }

  /**
   * Get spirit costs
   */
  getSpiritCosts(): any {
    return this.gameData.spirit_costs || {};
  }

  /**
   * Get spirit cost for a specific minion or skill
   */
  getSpiritCost(name: string): number | { min: number; max: number } | undefined {
    const costs = this.getSpiritCosts();
    return costs[name];
  }

  /**
   * Get damage formulas
   */
  getDamageFormulas(): any {
    return this.gameData.damage_formulas || {};
  }

  /**
   * Get specific damage formula
   */
  getDamageFormula(name: string): any {
    const formulas = this.getDamageFormulas();
    return formulas[name];
  }

  /**
   * Search items by query
   */
  searchItems(query: string): (BaseItem | UniqueItem)[] {
    const lowerQuery = query.toLowerCase();
    const results: (BaseItem | UniqueItem)[] = [];

    // Search base items
    results.push(...this.getBaseItems().filter(item =>
      item.name.toLowerCase().includes(lowerQuery)
    ));

    // Search unique items
    results.push(...this.getUniqueItems().filter(item =>
      item.name.toLowerCase().includes(lowerQuery)
    ));

    return results;
  }

  /**
   * Search skill gems by query
   */
  searchGems(query: string): SkillGem[] {
    const lowerQuery = query.toLowerCase();
    return this.getSkillGems().filter(gem =>
      gem.name.toLowerCase().includes(lowerQuery) ||
      gem.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Search passive nodes by query
   */
  searchPassives(query: string): PassiveNode[] {
    const lowerQuery = query.toLowerCase();
    const tree = this.getPassiveTree();

    if (!tree) return [];

    return tree.nodes.filter(node =>
      node.name?.toLowerCase().includes(lowerQuery) ||
      node.stats?.some(stat => stat.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get atlas data
   */
  getAtlasData(): any {
    return this.gameData.atlas || {};
  }

  /**
   * Get quest rewards
   */
  getQuestRewards(): any {
    return this.gameData.quest_rewards || {};
  }

  /**
   * Get vendor recipes
   */
  getVendorRecipes(): any {
    return this.gameData.vendor_recipes || {};
  }

  /**
   * Get skill combos
   */
  getSkillCombos(): any {
    return this.gameData.skill_combos || {};
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Wait for data to be loaded
   */
  async waitForLoad(): Promise<void> {
    while (!this.loaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get data statistics
   */
  getStats(): any {
    return {
      base_items: this.getBaseItems().length,
      unique_items: this.getUniqueItems().length,
      skill_gems: this.getSkillGems().length,
      active_gems: this.getActiveGems().length,
      support_gems: this.getSupportGems().length,
      passive_nodes: this.getPassiveTree()?.nodes.length || 0,
      keystones: this.getKeystones().length,
      notables: this.getNotables().length,
      currency_items: this.getCurrency().length,
      version: this.gameData.version,
      patch: this.gameData.patch
    };
  }
}

// Export singleton instance
export const gameDataService = GameDataService.getInstance();