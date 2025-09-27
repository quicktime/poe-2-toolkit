#!/usr/bin/env ts-node
/**
 * Parse all fetched data and import into Supabase database
 * Converts Lua to JSON and normalizes data structure
 */

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Import from project root
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️  Missing Supabase credentials. Please set environment variables.');
  console.log('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Data directories
const DATA_DIRS = {
  poe2: path.join(__dirname, 'poe2_data'),
  repoe: path.join(__dirname, 'repoe_data'),
  community: path.join(__dirname, 'community_data'),
  missing: path.join(__dirname, 'missing_data'),
  wiki: path.join(__dirname, 'wiki_data')
};

/**
 * Enhanced Lua parser for PoB data
 */
class LuaParser {
  /**
   * Parse Lua table to JSON object
   */
  static parseTable(luaContent: string): any {
    try {
      // Remove comments
      let cleaned = luaContent.replace(/--.*$/gm, '');

      // Convert Lua table syntax to JSON
      cleaned = cleaned
        // Convert table keys: ["key"] or ['key'] to "key":
        .replace(/\[["']([^"']+)["']\]\s*=/g, '"$1":')
        // Convert unquoted keys: key = to "key":
        .replace(/(\w+)\s*=/g, '"$1":')
        // Convert Lua strings [[ ]] to regular strings
        .replace(/\[\[([\s\S]*?)\]\]/g, (match, content) => {
          return JSON.stringify(content.trim());
        })
        // Convert single quotes to double quotes
        .replace(/'/g, '"')
        // Convert Lua booleans
        .replace(/\btrue\b/g, 'true')
        .replace(/\bfalse\b/g, 'false')
        .replace(/\bnil\b/g, 'null')
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, '$1');

      // Try to parse as JSON
      return JSON.parse(cleaned);
    } catch (error) {
      // Fallback: extract key-value pairs
      return LuaParser.extractKeyValues(luaContent);
    }
  }

  /**
   * Extract key-value pairs from Lua content
   */
  static extractKeyValues(luaContent: string): any {
    const result: any = {};

    // Extract multiline string blocks [[...]]
    const blockMatches = luaContent.matchAll(/\[["']?([^"'\]]+)["']?\]\s*=\s*\[\[([\s\S]*?)\]\]/g);
    for (const match of blockMatches) {
      const key = match[1];
      const value = match[2].trim().split('\n').map(line => line.trim()).filter(Boolean);
      result[key] = value;
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
   * Parse PoB gems data specifically
   */
  static parseGems(luaContent: string): any[] {
    const gems: any[] = [];

    // Match gem definitions
    const gemMatches = luaContent.matchAll(/gems\[["']([^"']+)["']\]\s*=\s*\{([^}]+)\}/gs);

    for (const match of gemMatches) {
      const gemName = match[1];
      const gemData = match[2];

      const gem: any = {
        name: gemName,
        ...this.extractKeyValues(gemData)
      };

      // Extract tags
      const tagsMatch = gemData.match(/tags\s*=\s*\{([^}]+)\}/);
      if (tagsMatch) {
        gem.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, ''));
      }

      gems.push(gem);
    }

    return gems;
  }

  /**
   * Parse passive tree data
   */
  static parsePassiveTree(jsonContent: string): any {
    try {
      const data = JSON.parse(jsonContent);

      // Extract nodes
      const nodes: any[] = [];
      if (data.nodes) {
        for (const [nodeId, nodeData] of Object.entries(data.nodes)) {
          nodes.push({
            id: parseInt(nodeId),
            ...nodeData
          });
        }
      }

      return {
        nodes,
        classes: data.classes || [],
        groups: data.groups || {},
        jewelSlots: data.jewelSlots || {},
        masteries: data.masteries || {}
      };
    } catch (error) {
      console.error('Error parsing passive tree:', error);
      return null;
    }
  }
}

/**
 * Process and normalize data for database import
 */
class DataProcessor {
  /**
   * Process base items
   */
  static async processBaseItems(): Promise<any[]> {
    const items: any[] = [];

    try {
      // Load PoB base items
      const pobBases = await this.loadJson('poe2_data/export_bases.json');
      for (const [category, data] of Object.entries(pobBases || {})) {
        if (typeof data === 'string') {
          // Parse text format
          const lines = data.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const parts = line.split('\t');
              if (parts.length >= 2) {
                items.push({
                  name: parts[0],
                  category,
                  item_class: parts[1],
                  properties: parts.slice(2)
                });
              }
            }
          }
        }
      }

      // Load RePoE base items for structure
      const repoeBases = await this.loadJson('repoe_data/repoe_base_items.json');
      // Use RePoE structure as reference but don't import (it's PoE1 data)

    } catch (error) {
      console.error('Error processing base items:', error);
    }

    return items;
  }

  /**
   * Process unique items
   */
  static async processUniqueItems(): Promise<any[]> {
    const uniques: any[] = [];

    try {
      // Load custom unique items
      const customUniques = await this.loadJson('missing_data/unique_items.json');

      // Flatten structure
      for (const [category, items] of Object.entries(customUniques || {})) {
        for (const [name, data] of Object.entries(items as any)) {
          uniques.push({
            name,
            category,
            ...data
          });
        }
      }

      // Load PoB uniques
      const pobUniques = await this.loadJson('poe2_data/export_uniques.json');
      for (const [slot, data] of Object.entries(pobUniques || {})) {
        if (data && typeof data === 'object') {
          // Parse Lua data if needed
          const parsed = LuaParser.extractKeyValues(JSON.stringify(data));
          if (parsed.uniques) {
            for (const unique of parsed.uniques) {
              uniques.push({
                ...unique,
                slot
              });
            }
          }
        }
      }

    } catch (error) {
      console.error('Error processing unique items:', error);
    }

    return uniques;
  }

  /**
   * Process skill gems
   */
  static async processSkillGems(): Promise<any[]> {
    const gems: any[] = [];

    try {
      // Load PoB gems
      const pobGems = await this.loadJson('poe2_data/pob_gems.json');
      if (pobGems.raw) {
        const parsed = LuaParser.parseGems(pobGems.raw);
        gems.push(...parsed);
      }

      // Load support gems with spirit costs
      const supportGems = await this.loadJson('missing_data/support_gems.json');
      for (const [name, data] of Object.entries(supportGems || {})) {
        gems.push({
          name,
          gem_type: 'support',
          ...data
        });
      }

    } catch (error) {
      console.error('Error processing skill gems:', error);
    }

    return gems;
  }

  /**
   * Process passive tree
   */
  static async processPassiveTree(): Promise<any> {
    try {
      // Load v0.3 passive tree
      const treeJson = await this.loadJson('poe2_data/pob_passiveTreeJson.json');
      if (treeJson) {
        return LuaParser.parsePassiveTree(JSON.stringify(treeJson));
      }
    } catch (error) {
      console.error('Error processing passive tree:', error);
    }

    return null;
  }

  /**
   * Process currency items
   */
  static async processCurrency(): Promise<any[]> {
    const currency: any[] = [];

    try {
      const currencyData = await this.loadJson('missing_data/currency.json');

      // Process orbs
      for (const [name, data] of Object.entries(currencyData.orbs || {})) {
        currency.push({
          name,
          type: 'orb',
          ...data
        });
      }

      // Process shards
      for (const [name, data] of Object.entries(currencyData.shards || {})) {
        currency.push({
          name,
          type: 'shard',
          ...data
        });
      }

    } catch (error) {
      console.error('Error processing currency:', error);
    }

    return currency;
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
}

/**
 * Import data into Supabase
 */
class DatabaseImporter {
  /**
   * Import base items
   */
  static async importBaseItems(items: any[]): Promise<void> {
    console.log(`  Importing ${items.length} base items...`);

    const { error } = await supabase
      .from('base_items')
      .upsert(items, { onConflict: 'name' });

    if (error) {
      console.error('    ❌ Error importing base items:', error.message);
    } else {
      console.log('    ✅ Base items imported');
    }
  }

  /**
   * Import unique items
   */
  static async importUniqueItems(uniques: any[]): Promise<void> {
    console.log(`  Importing ${uniques.length} unique items...`);

    const { error } = await supabase
      .from('unique_items')
      .upsert(uniques, { onConflict: 'name' });

    if (error) {
      console.error('    ❌ Error importing unique items:', error.message);
    } else {
      console.log('    ✅ Unique items imported');
    }
  }

  /**
   * Import skill gems
   */
  static async importSkillGems(gems: any[]): Promise<void> {
    console.log(`  Importing ${gems.length} skill gems...`);

    const { error } = await supabase
      .from('skill_gems')
      .upsert(gems, { onConflict: 'name' });

    if (error) {
      console.error('    ❌ Error importing skill gems:', error.message);
    } else {
      console.log('    ✅ Skill gems imported');
    }
  }

  /**
   * Import passive skills
   */
  static async importPassiveSkills(tree: any): Promise<void> {
    if (!tree || !tree.nodes) return;

    console.log(`  Importing ${tree.nodes.length} passive skills...`);

    // Import nodes in batches
    const batchSize = 500;
    for (let i = 0; i < tree.nodes.length; i += batchSize) {
      const batch = tree.nodes.slice(i, i + batchSize);

      const { error } = await supabase
        .from('passive_skills')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`    ❌ Error importing batch ${i / batchSize + 1}:`, error.message);
      }
    }

    console.log('    ✅ Passive skills imported');
  }

  /**
   * Import currency items
   */
  static async importCurrency(currency: any[]): Promise<void> {
    console.log(`  Importing ${currency.length} currency items...`);

    const { error } = await supabase
      .from('currency_items')
      .upsert(currency, { onConflict: 'name' });

    if (error) {
      console.error('    ❌ Error importing currency:', error.message);
    } else {
      console.log('    ✅ Currency items imported');
    }
  }
}

/**
 * Main import function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Path of Exile 2 Data Parser & Database Importer');
  console.log('='.repeat(60));

  try {
    // Process data
    console.log('\n📊 Processing data...\n');

    const baseItems = await DataProcessor.processBaseItems();
    const uniqueItems = await DataProcessor.processUniqueItems();
    const skillGems = await DataProcessor.processSkillGems();
    const passiveTree = await DataProcessor.processPassiveTree();
    const currency = await DataProcessor.processCurrency();

    console.log('Data processing complete:');
    console.log(`  - Base items: ${baseItems.length}`);
    console.log(`  - Unique items: ${uniqueItems.length}`);
    console.log(`  - Skill gems: ${skillGems.length}`);
    console.log(`  - Passive nodes: ${passiveTree?.nodes?.length || 0}`);
    console.log(`  - Currency: ${currency.length}`);

    // Import to database
    console.log('\n💾 Importing to database...\n');

    await DatabaseImporter.importBaseItems(baseItems);
    await DatabaseImporter.importUniqueItems(uniqueItems);
    await DatabaseImporter.importSkillGems(skillGems);
    await DatabaseImporter.importPassiveSkills(passiveTree);
    await DatabaseImporter.importCurrency(currency);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data import complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}