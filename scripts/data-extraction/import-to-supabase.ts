#!/usr/bin/env ts-node
/**
 * Import processed data into Supabase database
 */

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PROCESSED_DATA_DIR = path.join(__dirname, 'processed_data');

/**
 * Load JSON file
 */
async function loadJson(filename: string): Promise<any> {
  const filePath = path.join(PROCESSED_DATA_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Import base items
 */
async function importBaseItems(): Promise<void> {
  console.log('📦 Importing Base Items...');

  try {
    const data = await loadJson('base_items.json');
    const items: any[] = [];

    // Flatten the categorized structure
    for (const [category, categoryItems] of Object.entries(data)) {
      if (Array.isArray(categoryItems)) {
        for (const item of categoryItems) {
          items.push({
            name: item.name,
            category: category.slice(0, -1), // Remove plural 's'
            base_type: item.base_type || item.type,
            item_class: item.item_class,
            required_level: item.level || item.dropLevel || 1,
            properties: item.properties || {},
            damage_min: item.physMin || item.damage?.split('-')[0],
            damage_max: item.physMax || item.damage?.split('-')[1],
            attack_speed: item.aps,
            critical_chance: item.crit,
            armour: item.armor,
            evasion: item.evasion,
            energy_shield: item.energyShield || item.energy_shield
          });
        }
      }
    }

    if (items.length > 0) {
      // Delete existing items first
      await supabase.from('base_items').delete().neq('id', 0);

      // Insert in batches
      const batchSize = 50;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const { error } = await supabase.from('base_items').insert(batch);

        if (error) {
          console.error(`  ❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }

      console.log(`  ✅ Imported ${items.length} base items`);
    }
  } catch (error) {
    console.error('  ❌ Error importing base items:', error);
  }
}

/**
 * Import unique items
 */
async function importUniqueItems(): Promise<void> {
  console.log('⭐ Importing Unique Items...');

  try {
    const uniques = await loadJson('unique_items.json');

    if (Array.isArray(uniques) && uniques.length > 0) {
      // Delete existing items first
      await supabase.from('unique_items').delete().neq('id', 0);

      // Format for database
      const formatted = uniques.map(item => ({
        name: item.name,
        base_item: item.base || item.base_item,
        category: item.category,
        required_level: item.level || 1,
        implicit_mods: item.implicit_mods || [],
        explicit_mods: item.mods || item.explicit_mods || [],
        flavor_text: item.flavor_text,
        is_replica: false,
        is_corrupted: false
      }));

      const { error } = await supabase.from('unique_items').insert(formatted);

      if (error) {
        console.error('  ❌ Error importing unique items:', error.message);
      } else {
        console.log(`  ✅ Imported ${formatted.length} unique items`);
      }
    }
  } catch (error) {
    console.error('  ❌ Error importing unique items:', error);
  }
}

/**
 * Import skill gems
 */
async function importSkillGems(): Promise<void> {
  console.log('💎 Importing Skill Gems...');

  try {
    const data = await loadJson('skill_gems.json');
    const gems: any[] = [];

    // Process active gems
    if (data.active && Array.isArray(data.active)) {
      for (const gem of data.active) {
        gems.push({
          name: gem.name,
          gem_type: 'active',
          tags: gem.tags || [],
          primary_attribute: gem.primary_attribute,
          required_level: gem.required_level || 1,
          mana_cost: gem.mana_cost,
          spirit_cost: gem.spirit_cost || gem.spirit || 0,
          cast_time: gem.cast_time,
          damage_effectiveness: gem.damage_effectiveness,
          description: gem.description
        });
      }
    }

    // Process support gems
    if (data.support && Array.isArray(data.support)) {
      for (const gem of data.support) {
        gems.push({
          name: gem.name,
          gem_type: 'support',
          tags: gem.tags || [],
          primary_attribute: gem.primary_attribute,
          required_level: gem.required_level || 1,
          mana_cost: 0,
          spirit_cost: gem.spirit || 0,
          damage_multiplier: gem.multiplier,
          description: gem.description
        });
      }
    }

    if (gems.length > 0) {
      // Delete existing gems first
      await supabase.from('skill_gems').delete().neq('id', 0);

      const { error } = await supabase.from('skill_gems').insert(gems);

      if (error) {
        console.error('  ❌ Error importing skill gems:', error.message);
      } else {
        console.log(`  ✅ Imported ${gems.length} skill gems`);
      }
    }
  } catch (error) {
    console.error('  ❌ Error importing skill gems:', error);
  }
}

/**
 * Import passive skills
 */
async function importPassiveSkills(): Promise<void> {
  console.log('🌳 Importing Passive Skills...');

  try {
    const data = await loadJson('passive_tree.json');

    if (data.nodes && Array.isArray(data.nodes)) {
      console.log(`  Found ${data.nodes.length} passive nodes`);

      // Delete existing nodes first
      await supabase.from('passive_skills').delete().neq('id', 0);

      // Format nodes for database
      const formatted = data.nodes.map((node: any) => ({
        id: node.id,
        name: node.name || `Node ${node.id}`,
        type: node.type || 'normal',
        stats: node.stats || [],
        stat_text: Array.isArray(node.stats) ? node.stats.join(', ').substring(0, 1000) : '',
        connections: Array.isArray(node.connections)
          ? node.connections.map((c: any) => typeof c === 'object' ? c.id : c)
          : [],
        group_id: node.group,
        orbit: node.orbit,
        orbit_index: node.orbitIndex,
        is_keystone: node.type === 'keystone',
        is_notable: node.type === 'notable',
        is_mastery: node.type === 'mastery',
        is_jewel_socket: node.type === 'jewel_socket',
        ascendancy_class: node.ascendancy_class,
        x: node.position?.x || node.x,
        y: node.position?.y || node.y
      }));

      // Insert in batches
      const batchSize = 500;
      let successCount = 0;

      for (let i = 0; i < formatted.length; i += batchSize) {
        const batch = formatted.slice(i, i + batchSize);
        const { error } = await supabase.from('passive_skills').insert(batch);

        if (error) {
          console.error(`  ❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        } else {
          successCount += batch.length;
        }
      }

      console.log(`  ✅ Imported ${successCount} passive skills`);
    }
  } catch (error) {
    console.error('  ❌ Error importing passive skills:', error);
  }
}

/**
 * Import currency items
 */
async function importCurrency(): Promise<void> {
  console.log('💰 Importing Currency Items...');

  try {
    const data = await loadJson('currency.json');
    const items: any[] = [];

    // Process all currency types
    for (const [type, typeItems] of Object.entries(data)) {
      if (Array.isArray(typeItems)) {
        for (const item of typeItems) {
          // Skip items with very long names or no name
          if (!item.name || item.name.length > 200) continue;

          items.push({
            name: item.name.substring(0, 200), // Ensure name fits in varchar(200)
            type: item.type || type.slice(0, -1), // Remove plural 's'
            effect: item.effect ? item.effect.substring(0, 500) : '',
            tier: item.tier,
            drop_level: item.drop_level || item.dropLevel || 1,
            stack_size: item.stack_size || 20
          });
        }
      }
    }

    if (items.length > 0) {
      // Delete existing currency first
      await supabase.from('currency_items').delete().neq('id', 0);

      const { error } = await supabase.from('currency_items').insert(items);

      if (error) {
        console.error('  ❌ Error importing currency:', error.message);
      } else {
        console.log(`  ✅ Imported ${items.length} currency items`);
      }
    }
  } catch (error) {
    console.error('  ❌ Error importing currency:', error);
  }
}

/**
 * Import game mechanics
 */
async function importGameMechanics(): Promise<void> {
  console.log('⚙️ Importing Game Mechanics...');

  try {
    const data = await loadJson('game_mechanics.json');

    // Import ascendancies
    if (data.ascendancies) {
      const ascendancies: any[] = [];

      for (const [className, ascList] of Object.entries(data.ascendancies)) {
        if (Array.isArray(ascList)) {
          for (const ascName of ascList) {
            ascendancies.push({
              name: ascName,
              class: className,
              description: `${ascName} ascendancy for ${className}`
            });
          }
        }
      }

      if (ascendancies.length > 0) {
        await supabase.from('ascendancies').delete().neq('id', 0);
        const { error } = await supabase.from('ascendancies').insert(ascendancies);

        if (error) {
          console.error('  ❌ Error importing ascendancies:', error.message);
        } else {
          console.log(`  ✅ Imported ${ascendancies.length} ascendancies`);
        }
      }
    }

    // Import quest rewards
    if (data.quest_rewards) {
      const rewards: any[] = [];

      for (const [questName, questData] of Object.entries(data.quest_rewards as any)) {
        rewards.push({
          quest_name: questName,
          act: questData.act || 1,
          rewards: questData
        });
      }

      if (rewards.length > 0) {
        await supabase.from('quest_rewards').delete().neq('id', 0);
        const { error } = await supabase.from('quest_rewards').insert(rewards);

        if (error) {
          console.error('  ❌ Error importing quest rewards:', error.message);
        } else {
          console.log(`  ✅ Imported ${rewards.length} quest rewards`);
        }
      }
    }

    console.log('  ✅ Game mechanics imported');
  } catch (error) {
    console.error('  ❌ Error importing game mechanics:', error);
  }
}

/**
 * Main import function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Supabase Data Import');
  console.log('='.repeat(60));
  console.log(`\n📍 Database: ${supabaseUrl}\n`);

  try {
    // Import all data types
    await importBaseItems();
    await importUniqueItems();
    await importSkillGems();
    await importPassiveSkills();
    await importCurrency();
    await importGameMechanics();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data import complete!');
    console.log('\nData is now available in your Supabase database.');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}