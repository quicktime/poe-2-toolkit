/**
 * Game Data Service for Path of Exile 2
 * Manages items, skills, passives, and other game data
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

export interface BaseItem {
  id: string;
  name: string;
  category_id: string;
  item_level: number;
  req_level?: number;
  req_str?: number;
  req_dex?: number;
  req_int?: number;
  properties: Record<string, any>;
  implicit_mods: string[];
}

export interface UniqueItem {
  id: string;
  name: string;
  base_item_id: string;
  flavor_text?: string;
  explicit_mods: string[];
  req_level?: number;
  properties: Record<string, any>;
}

export interface SkillGem {
  id: string;
  name: string;
  gem_tags: string[];
  max_level: number;
  level_requirements: Array<{
    level: number;
    str?: number;
    dex?: number;
    int?: number;
  }>;
  level_stats: Array<{
    level: number;
    damage?: string;
    mana_cost?: number;
    cast_time?: number;
    [key: string]: any;
  }>;
  spirit_cost_base?: number;
  spirit_cost_per_level?: number;
  damage_effectiveness: number;
  is_support: boolean;
}

export class GameDataService {
  private static instance: GameDataService;
  private supabase = createClient();

  // In-memory caches
  private baseItemsCache: Map<string, BaseItem> = new Map();
  private uniqueItemsCache: Map<string, UniqueItem> = new Map();
  private skillGemsCache: Map<string, SkillGem> = new Map();
  private passiveTreeCache: any = null;

  // Cache timestamps
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  private constructor() {}

  static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Get all base items
   */
  async getBaseItems(category?: string): Promise<BaseItem[]> {
    const cacheKey = `base_items_${category || 'all'}`;

    if (this.isCacheValid(cacheKey) && this.baseItemsCache.size > 0) {
      const items = Array.from(this.baseItemsCache.values());
      return category
        ? items.filter(item => item.category_id === category)
        : items;
    }

    let query = this.supabase
      .from('base_items')
      .select('*')
      .eq('is_enabled', true);

    if (category) {
      query = query.eq('category_id', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching base items:', error);
      return [];
    }

    // Update cache
    data?.forEach(item => {
      this.baseItemsCache.set(item.name, item as BaseItem);
    });
    this.cacheTimestamps.set(cacheKey, Date.now());

    return data as BaseItem[];
  }

  /**
   * Get unique items
   */
  async getUniqueItems(baseItemName?: string): Promise<UniqueItem[]> {
    const cacheKey = `unique_items_${baseItemName || 'all'}`;

    if (this.isCacheValid(cacheKey) && this.uniqueItemsCache.size > 0) {
      const items = Array.from(this.uniqueItemsCache.values());
      return baseItemName
        ? items.filter(item => item.base_item_id === baseItemName)
        : items;
    }

    let query = this.supabase
      .from('unique_items')
      .select('*')
      .eq('is_drop_enabled', true)
      .eq('is_legacy', false);

    if (baseItemName) {
      // First get base item ID
      const baseItem = this.baseItemsCache.get(baseItemName);
      if (baseItem) {
        query = query.eq('base_item_id', baseItem.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching unique items:', error);
      return [];
    }

    // Update cache
    data?.forEach(item => {
      this.uniqueItemsCache.set(item.name, item as UniqueItem);
    });
    this.cacheTimestamps.set(cacheKey, Date.now());

    return data as UniqueItem[];
  }

  /**
   * Get skill gems
   */
  async getSkillGems(tags?: string[]): Promise<SkillGem[]> {
    const cacheKey = `skill_gems_${tags?.join(',') || 'all'}`;

    if (this.isCacheValid(cacheKey) && this.skillGemsCache.size > 0) {
      const gems = Array.from(this.skillGemsCache.values());
      return tags
        ? gems.filter(gem => tags.some(tag => gem.gem_tags.includes(tag)))
        : gems;
    }

    let query = this.supabase
      .from('skill_gems')
      .select('*')
      .eq('is_support', false);

    if (tags && tags.length > 0) {
      query = query.contains('gem_tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching skill gems:', error);
      return [];
    }

    // Update cache
    data?.forEach(gem => {
      this.skillGemsCache.set(gem.name, gem as SkillGem);
    });
    this.cacheTimestamps.set(cacheKey, Date.now());

    return data as SkillGem[];
  }

  /**
   * Get support gems
   */
  async getSupportGems(supportedTags?: string[]): Promise<SkillGem[]> {
    const cacheKey = `support_gems_${supportedTags?.join(',') || 'all'}`;

    let query = this.supabase
      .from('skill_gems')
      .select(`
        *,
        support_gems!inner (
          support_tags,
          excluded_tags,
          mana_multiplier,
          spirit_multiplier
        )
      `)
      .eq('is_support', true);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching support gems:', error);
      return [];
    }

    // Filter by supported tags if provided
    let filtered = data as any[];
    if (supportedTags && supportedTags.length > 0) {
      filtered = filtered.filter(gem => {
        const supportData = gem.support_gems;
        if (!supportData) return false;

        // Check if any supported tag matches
        return supportedTags.some(tag =>
          supportData.support_tags.includes(tag) &&
          !supportData.excluded_tags?.includes(tag)
        );
      });
    }

    return filtered as SkillGem[];
  }

  /**
   * Get passive tree data
   */
  async getPassiveTree(version?: string): Promise<any> {
    const cacheKey = `passive_tree_${version || 'current'}`;

    if (this.isCacheValid(cacheKey) && this.passiveTreeCache) {
      return this.passiveTreeCache;
    }

    // Use the function we created in the migration
    const { data, error } = await this.supabase
      .rpc('get_current_passive_tree');

    if (error) {
      console.error('Error fetching passive tree:', error);

      // Fall back to local data if available
      const localTree = await this.loadLocalPassiveTree();
      if (localTree) {
        this.passiveTreeCache = localTree;
        this.cacheTimestamps.set(cacheKey, Date.now());
        return localTree;
      }

      return null;
    }

    this.passiveTreeCache = data;
    this.cacheTimestamps.set(cacheKey, Date.now());

    return data;
  }

  /**
   * Load passive tree from local file as fallback
   */
  private async loadLocalPassiveTree(): Promise<any> {
    try {
      const response = await fetch('/data/passive-tree-v0.3.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading local passive tree:', error);
    }
    return null;
  }

  /**
   * Search for items by name
   */
  async searchItems(query: string, limit = 20): Promise<(BaseItem | UniqueItem)[]> {
    const results: (BaseItem | UniqueItem)[] = [];

    // Search in caches first if available
    if (this.baseItemsCache.size > 0) {
      this.baseItemsCache.forEach(item => {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
      });
    }

    if (this.uniqueItemsCache.size > 0) {
      this.uniqueItemsCache.forEach(item => {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
      });
    }

    // If we have results from cache, return them
    if (results.length > 0) {
      return results.slice(0, limit);
    }

    // Otherwise, search in database
    const [baseItems, uniqueItems] = await Promise.all([
      this.supabase
        .from('base_items')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit / 2),
      this.supabase
        .from('unique_items')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(limit / 2)
    ]);

    if (baseItems.data) {
      results.push(...(baseItems.data as BaseItem[]));
    }
    if (uniqueItems.data) {
      results.push(...(uniqueItems.data as UniqueItem[]));
    }

    return results.slice(0, limit);
  }

  /**
   * Get item mods for crafting
   */
  async getItemMods(
    itemClass: string,
    itemLevel: number,
    modType?: 'prefix' | 'suffix'
  ): Promise<any[]> {
    let query = this.supabase
      .from('item_mods')
      .select('*')
      .contains('item_classes', [itemClass])
      .lte('required_level', itemLevel);

    if (modType) {
      query = query.eq('mod_type', modType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching item mods:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.baseItemsCache.clear();
    this.uniqueItemsCache.clear();
    this.skillGemsCache.clear();
    this.passiveTreeCache = null;
    this.cacheTimestamps.clear();
  }

  /**
   * Preload commonly used data
   */
  async preloadData(): Promise<void> {
    console.log('Preloading game data...');

    await Promise.all([
      this.getBaseItems(),
      this.getSkillGems(),
      this.getPassiveTree()
    ]);

    console.log('Game data preloaded successfully');
  }
}