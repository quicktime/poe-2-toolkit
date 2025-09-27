#!/usr/bin/env ts-node
/**
 * Process and normalize all fetched data into structured JSON
 * Prepares data for database import
 */

import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'processed_data');

/**
 * Enhanced Lua parser for PoB data
 */
class LuaParser {
  /**
   * Parse Lua table to JSON object
   */
  static parseTable(luaContent: string): any {
    const result: any = {};

    // Extract multiline string blocks [[...]]
    const blockMatches = luaContent.matchAll(/\[["']?([^"'\]]+)["']?\]\s*=\s*\[\[([\s\S]*?)\]\]/g);
    for (const match of blockMatches) {
      const key = match[1];
      const value = match[2].trim().split('\n').map(line => line.trim()).filter(Boolean);
      result[key] = value;
    }

    // Extract table entries
    const tableMatches = luaContent.matchAll(/(\w+)\s*=\s*\{([^}]+)\}/gs);
    for (const match of tableMatches) {
      const key = match[1];
      const content = match[2];
      result[key] = this.extractKeyValues(content);
    }

    // Extract simple key-value pairs
    const kvMatches = luaContent.matchAll(/["']?(\w+)["']?\s*=\s*["']?([^,\n}]+)["']?/g);
    for (const match of kvMatches) {
      const key = match[1];
      let value: any = match[2].trim();

      // Convert to appropriate type
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'nil' || value === 'null') value = null;
      else if (/^\d+$/.test(value)) value = parseInt(value);
      else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);

      result[key] = value;
    }

    return result;
  }

  /**
   * Extract key-value pairs from Lua content
   */
  static extractKeyValues(luaContent: string): any {
    const result: any = {};

    const kvMatches = luaContent.matchAll(/["']?(\w+)["']?\s*=\s*["']?([^,\n}]+)["']?/g);
    for (const match of kvMatches) {
      const key = match[1];
      let value: any = match[2].trim();

      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'nil' || value === 'null') value = null;
      else if (/^\d+$/.test(value)) value = parseInt(value);
      else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
      else value = value.replace(/["']/g, '');

      result[key] = value;
    }

    return result;
  }
}

/**
 * Process and normalize data
 */
class DataProcessor {
  /**
   * Process all base items
   */
  static async processBaseItems(): Promise<any> {
    console.log('📦 Processing Base Items...');
    const allBaseItems: any = {
      weapons: [],
      armour: [],
      accessories: [],
      flasks: [],
      jewels: []
    };

    try {
      // Load export bases (text format)
      const exportBases = await this.loadJson('poe2_data/export_bases.json');
      for (const [category, data] of Object.entries(exportBases || {})) {
        if (typeof data === 'string') {
          const lines = data.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const parts = line.split('\t');
              if (parts.length >= 2) {
                const item = {
                  name: parts[0].trim(),
                  base_type: parts[1]?.trim(),
                  item_class: category,
                  properties: {}
                };

                // Parse properties
                for (let i = 2; i < parts.length; i++) {
                  const prop = parts[i].trim();
                  if (prop.includes(':')) {
                    const [key, val] = prop.split(':');
                    item.properties[key.trim()] = val.trim();
                  }
                }

                // Categorize
                if (['sword', 'axe', 'mace', 'bow', 'staff', 'wand', 'dagger', 'claw', 'sceptre', 'spear', 'flail', 'crossbow'].includes(category)) {
                  allBaseItems.weapons.push(item);
                } else if (['body', 'helmet', 'gloves', 'boots', 'shield', 'focus'].includes(category)) {
                  allBaseItems.armour.push(item);
                } else if (['amulet', 'ring', 'belt', 'quiver'].includes(category)) {
                  allBaseItems.accessories.push(item);
                } else if (category === 'flask') {
                  allBaseItems.flasks.push(item);
                } else if (category === 'jewel') {
                  allBaseItems.jewels.push(item);
                }
              }
            }
          }
        }
      }

      // Add manual base items
      const manualBases = await this.loadJson('poe2_data/base_items.json');
      if (manualBases) {
        for (const [category, items] of Object.entries(manualBases)) {
          if (category === 'weapons' && items) {
            for (const [name, stats] of Object.entries(items as any)) {
              allBaseItems.weapons.push({ name, ...stats });
            }
          } else if (category === 'armor' && items) {
            for (const [name, stats] of Object.entries(items as any)) {
              allBaseItems.armour.push({ name, ...stats });
            }
          }
        }
      }

      console.log(`  ✅ Processed ${Object.values(allBaseItems).flat().length} base items`);
    } catch (error) {
      console.error('  ❌ Error processing base items:', error);
    }

    return allBaseItems;
  }

  /**
   * Process unique items
   */
  static async processUniqueItems(): Promise<any[]> {
    console.log('⭐ Processing Unique Items...');
    const uniques: any[] = [];

    try {
      // Load custom unique items
      const customUniques = await this.loadJson('missing_data/unique_items.json');
      for (const [category, items] of Object.entries(customUniques || {})) {
        for (const [name, data] of Object.entries(items as any)) {
          uniques.push({
            name,
            category,
            ...data,
            source: 'custom'
          });
        }
      }

      // Load PoB uniques
      const pobUniques = await this.loadJson('poe2_data/export_uniques.json');
      for (const [slot, data] of Object.entries(pobUniques || {})) {
        if (data && typeof data === 'object') {
          const parsed = LuaParser.parseTable(JSON.stringify(data));
          if (parsed.uniques && Array.isArray(parsed.uniques)) {
            for (const unique of parsed.uniques) {
              uniques.push({
                ...unique,
                slot,
                source: 'pob'
              });
            }
          }
        }
      }

      console.log(`  ✅ Processed ${uniques.length} unique items`);
    } catch (error) {
      console.error('  ❌ Error processing unique items:', error);
    }

    return uniques;
  }

  /**
   * Process skill gems
   */
  static async processSkillGems(): Promise<any> {
    console.log('💎 Processing Skill Gems...');
    const gems: any = {
      active: [],
      support: []
    };

    try {
      // Process PoB gems
      const pobGems = await this.loadJson('poe2_data/pob_gems.json');
      if (pobGems) {
        if (pobGems.gems) {
          // Already parsed
          gems.active = pobGems.gems;
        } else if (pobGems.raw) {
          // Parse from raw Lua
          const lines = pobGems.raw.split('\n');
          for (const line of lines) {
            if (line.includes('name:') || line.includes('tags:')) {
              // Extract gem data
              const nameMatch = line.match(/name:\s*["']([^"']+)["']/);
              const tagsMatch = line.match(/tags:\s*\{([^}]+)\}/);
              if (nameMatch) {
                gems.active.push({
                  name: nameMatch[1],
                  tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : []
                });
              }
            }
          }
        }
      }

      // Load support gems with spirit costs
      const supportGems = await this.loadJson('missing_data/support_gems.json');
      for (const [name, data] of Object.entries(supportGems || {})) {
        gems.support.push({
          name,
          gem_type: 'support',
          ...data
        });
      }

      // Load manual skill gems
      const manualGems = await this.loadJson('poe2_data/skill_gems.json');
      for (const [name, data] of Object.entries(manualGems || {})) {
        gems.active.push({
          name,
          gem_type: 'active',
          ...data
        });
      }

      console.log(`  ✅ Processed ${gems.active.length} active gems, ${gems.support.length} support gems`);
    } catch (error) {
      console.error('  ❌ Error processing skill gems:', error);
    }

    return gems;
  }

  /**
   * Process passive tree
   */
  static async processPassiveTree(): Promise<any> {
    console.log('🌳 Processing Passive Tree...');

    try {
      // Load v0.3 passive tree JSON
      const treeJson = await this.loadJson('poe2_data/pob_passiveTreeJson.json');

      if (treeJson) {
        const nodes = [];
        const groups = [];
        const connections = [];

        // Extract nodes
        if (treeJson.nodes) {
          for (const [nodeId, nodeData] of Object.entries(treeJson.nodes)) {
            nodes.push({
              id: parseInt(nodeId),
              ...nodeData
            });
          }
        }

        // Extract groups
        if (treeJson.groups) {
          for (const [groupId, groupData] of Object.entries(treeJson.groups)) {
            groups.push({
              id: parseInt(groupId),
              ...groupData
            });
          }
        }

        console.log(`  ✅ Processed ${nodes.length} nodes, ${groups.length} groups`);

        return {
          nodes,
          groups,
          classes: treeJson.classes || [],
          jewelSlots: treeJson.jewelSlots || {},
          masteries: treeJson.masteries || {},
          version: '0.3'
        };
      }
    } catch (error) {
      console.error('  ❌ Error processing passive tree:', error);
    }

    return null;
  }

  /**
   * Process currency items
   */
  static async processCurrency(): Promise<any> {
    console.log('💰 Processing Currency...');
    const currency: any = {
      orbs: [],
      shards: [],
      essences: []
    };

    try {
      const currencyData = await this.loadJson('missing_data/currency.json');

      // Process orbs
      for (const [name, data] of Object.entries(currencyData.orbs || {})) {
        currency.orbs.push({
          name,
          type: 'orb',
          ...data
        });
      }

      // Process shards
      for (const [name, data] of Object.entries(currencyData.shards || {})) {
        currency.shards.push({
          name,
          type: 'shard',
          ...data
        });
      }

      // Process essences
      const essenceData = await this.loadJson('poe2_data/pob_essence.json');
      if (essenceData && essenceData.raw) {
        // Parse essence data
        const lines = essenceData.raw.split('\n');
        for (const line of lines) {
          if (line.includes('Essence')) {
            currency.essences.push({
              name: line.trim(),
              type: 'essence'
            });
          }
        }
      }

      console.log(`  ✅ Processed ${currency.orbs.length} orbs, ${currency.shards.length} shards, ${currency.essences.length} essences`);
    } catch (error) {
      console.error('  ❌ Error processing currency:', error);
    }

    return currency;
  }

  /**
   * Process game mechanics data
   */
  static async processGameMechanics(): Promise<any> {
    console.log('⚙️ Processing Game Mechanics...');

    const mechanics: any = {
      atlas: {},
      ascendancies: {},
      quest_rewards: {},
      vendor_recipes: {},
      spirit_costs: {},
      damage_formulas: {},
      skill_combos: {}
    };

    try {
      // Atlas data
      mechanics.atlas = await this.loadJson('missing_data/atlas.json');

      // Ascendancies
      mechanics.ascendancies = await this.loadJson('wiki_data/ascendancies.json');

      // Quest rewards
      mechanics.quest_rewards = await this.loadJson('missing_data/quest_rewards.json');

      // Vendor recipes
      mechanics.vendor_recipes = await this.loadJson('missing_data/vendor_recipes.json');

      // Spirit costs
      const spiritData = await this.loadJson('community_data/poe2_v03_curated.json');
      mechanics.spirit_costs = spiritData?.spiritCosts || {};
      mechanics.damage_formulas = spiritData?.damageFormulas || {};

      // Skill combos
      mechanics.skill_combos = await this.loadJson('wiki_data/skill_combos.json');

      console.log('  ✅ Processed all game mechanics');
    } catch (error) {
      console.error('  ❌ Error processing game mechanics:', error);
    }

    return mechanics;
  }

  /**
   * Load JSON file helper
   */
  static async loadJson(relativePath: string): Promise<any> {
    try {
      const fullPath = path.join(__dirname, relativePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save processed data
   */
  static async saveProcessedData(filename: string, data: any): Promise<void> {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const filePath = path.join(OUTPUT_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`  💾 Saved: ${filename}`);
  }
}

/**
 * Main processing function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Path of Exile 2 Data Processing Pipeline');
  console.log('='.repeat(60));

  try {
    // Process all data categories
    console.log('\n📊 Processing all data categories...\n');

    const baseItems = await DataProcessor.processBaseItems();
    await DataProcessor.saveProcessedData('base_items.json', baseItems);

    const uniqueItems = await DataProcessor.processUniqueItems();
    await DataProcessor.saveProcessedData('unique_items.json', uniqueItems);

    const skillGems = await DataProcessor.processSkillGems();
    await DataProcessor.saveProcessedData('skill_gems.json', skillGems);

    const passiveTree = await DataProcessor.processPassiveTree();
    await DataProcessor.saveProcessedData('passive_tree.json', passiveTree);

    const currency = await DataProcessor.processCurrency();
    await DataProcessor.saveProcessedData('currency.json', currency);

    const mechanics = await DataProcessor.processGameMechanics();
    await DataProcessor.saveProcessedData('game_mechanics.json', mechanics);

    // Create master index
    const masterIndex = {
      version: '0.3',
      patch: 'The Third Edict',
      generated: new Date().toISOString(),
      data_categories: {
        base_items: `${Object.values(baseItems).flat().length} items`,
        unique_items: `${uniqueItems.length} items`,
        skill_gems: `${skillGems.active.length + skillGems.support.length} gems`,
        passive_tree: `${passiveTree?.nodes?.length || 0} nodes`,
        currency: `${Object.values(currency).flat().length} items`,
        mechanics: 'Complete'
      }
    };

    await DataProcessor.saveProcessedData('index.json', masterIndex);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data processing complete!');
    console.log(`📁 Processed data saved to: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review processed data in processed_data/');
    console.log('2. Import to database using database-import.ts');
    console.log('3. Generate TypeScript interfaces');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}