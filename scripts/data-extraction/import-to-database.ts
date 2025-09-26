#!/usr/bin/env ts-node
/**
 * Import extracted PoE 2 data into Supabase database
 * Run after extract_poe2_data.py
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

// Data directory
const DATA_DIR = path.join(__dirname, 'extracted_data');

/**
 * Import base items
 */
async function importBaseItems(data: any) {
  console.log('Importing base items...');

  const baseItems = data.BaseItemTypes || [];
  const itemClasses = data.ItemClasses || [];

  // First, create item categories
  const categoryMap = new Map();

  for (const itemClass of itemClasses) {
    const category = {
      name: itemClass.Id || itemClass.Name,
      display_name: itemClass.Name,
      item_class: itemClass.Category || 'misc'
    };

    const { data: catData, error } = await supabase
      .from('item_categories')
      .upsert(category, { onConflict: 'name' })
      .select()
      .single();

    if (!error && catData) {
      categoryMap.set(category.name, catData.id);
    }
  }

  // Import base items
  const batchSize = 100;
  for (let i = 0; i < baseItems.length; i += batchSize) {
    const batch = baseItems.slice(i, i + batchSize);

    const items = batch.map((item: any) => ({
      name: item.Name,
      category_id: categoryMap.get(item.ItemClass) || null,
      item_level: item.DropLevel || 1,
      req_level: item.RequiredLevel || null,
      req_str: item.RequiredStrength || null,
      req_dex: item.RequiredDexterity || null,
      req_int: item.RequiredIntelligence || null,
      properties: {
        width: item.Width || 1,
        height: item.Height || 1,
        identified: item.AlwaysShow || false,
        base_type: item.BaseType || null
      },
      implicit_mods: item.ImplicitMods || [],
      inventory_width: item.Width || 1,
      inventory_height: item.Height || 1,
      drop_level: item.DropLevel || 1,
      patch_version: '0.3'
    }));

    const { error } = await supabase
      .from('base_items')
      .upsert(items, { onConflict: 'name' });

    if (error) {
      console.error('Error importing base items batch:', error);
    } else {
      console.log(`  Imported ${i + batch.length}/${baseItems.length} base items`);
    }
  }
}

/**
 * Import unique items
 */
async function importUniqueItems(data: any) {
  console.log('Importing unique items...');

  const uniqueItems = data.UniqueItems || [];

  // Get base item mapping
  const { data: baseItems } = await supabase
    .from('base_items')
    .select('id, name');

  const baseItemMap = new Map(
    baseItems?.map(item => [item.name, item.id]) || []
  );

  const batchSize = 50;
  for (let i = 0; i < uniqueItems.length; i += batchSize) {
    const batch = uniqueItems.slice(i, i + batchSize);

    const items = batch.map((item: any) => ({
      name: item.Name,
      base_item_id: baseItemMap.get(item.BaseItem) || null,
      flavor_text: item.FlavourText || null,
      explicit_mods: item.ExplicitMods || [],
      req_level: item.RequiredLevel || null,
      properties: {
        league: item.League || 'Standard',
        is_replica: item.IsReplica || false,
        artwork: item.ArtFile || null
      },
      is_drop_enabled: !item.IsDisabled,
      is_legacy: item.IsLegacy || false,
      patch_version: '0.3'
    }));

    const { error } = await supabase
      .from('unique_items')
      .upsert(items, { onConflict: 'name' });

    if (error) {
      console.error('Error importing unique items batch:', error);
    } else {
      console.log(`  Imported ${i + batch.length}/${uniqueItems.length} unique items`);
    }
  }
}

/**
 * Import skill gems
 */
async function importSkillGems(data: any) {
  console.log('Importing skill gems...');

  const activeSkills = data.ActiveSkills || [];
  const grantedEffects = data.GrantedEffects || [];
  const grantedEffectsPerLevel = data.GrantedEffectsPerLevel || [];

  // Create skill categories
  const categories = [
    { name: 'strength', display_name: 'Strength', color: 'red' },
    { name: 'dexterity', display_name: 'Dexterity', color: 'green' },
    { name: 'intelligence', display_name: 'Intelligence', color: 'blue' },
    { name: 'hybrid', display_name: 'Hybrid', color: 'white' }
  ];

  for (const cat of categories) {
    await supabase
      .from('skill_categories')
      .upsert(cat, { onConflict: 'name' });
  }

  // Get category mapping
  const { data: cats } = await supabase
    .from('skill_categories')
    .select('id, name');

  const categoryMap = new Map(
    cats?.map(cat => [cat.name, cat.id]) || []
  );

  // Process skill gems
  const batchSize = 50;
  for (let i = 0; i < activeSkills.length; i += batchSize) {
    const batch = activeSkills.slice(i, i + batchSize);

    const gems = batch.map((skill: any) => {
      // Determine category based on requirements
      let category = 'hybrid';
      if (skill.StrRequirement > skill.DexRequirement && skill.StrRequirement > skill.IntRequirement) {
        category = 'strength';
      } else if (skill.DexRequirement > skill.StrRequirement && skill.DexRequirement > skill.IntRequirement) {
        category = 'dexterity';
      } else if (skill.IntRequirement > skill.StrRequirement && skill.IntRequirement > skill.DexRequirement) {
        category = 'intelligence';
      }

      // Build level requirements and stats
      const levelReqs = [];
      const levelStats = [];

      for (let level = 1; level <= 30; level++) {
        levelReqs.push({
          level,
          str: Math.floor(skill.StrRequirement * (1 + (level - 1) * 0.04)),
          dex: Math.floor(skill.DexRequirement * (1 + (level - 1) * 0.04)),
          int: Math.floor(skill.IntRequirement * (1 + (level - 1) * 0.04))
        });

        // Find matching granted effect level data
        const effectData = grantedEffectsPerLevel.find(
          (e: any) => e.GrantedEffect === skill.GrantedEffect && e.Level === level
        );

        if (effectData) {
          levelStats.push({
            level,
            damage: effectData.Damage || null,
            mana_cost: effectData.ManaCost || 0,
            cast_time: effectData.CastTime || 1000,
            critical_chance: effectData.CriticalChance || 0,
            attack_speed: effectData.AttackSpeed || null,
            effectiveness: effectData.DamageEffectiveness || 100
          });
        }
      }

      return {
        name: skill.DisplayName || skill.Id,
        category_id: categoryMap.get(category),
        gem_tags: skill.Tags || [],
        max_level: 30,
        quality_bonus: skill.QualityBonus || null,
        level_requirements: levelReqs,
        level_stats: levelStats,
        spirit_cost_base: skill.SpiritCost || 0,
        spirit_cost_per_level: skill.SpiritCostPerLevel || 0,
        damage_effectiveness: skill.DamageEffectiveness || 100,
        is_support: skill.IsSupport || false,
        is_vaal: skill.IsVaal || false,
        patch_version: '0.3'
      };
    });

    const { error } = await supabase
      .from('skill_gems')
      .upsert(gems, { onConflict: 'name' });

    if (error) {
      console.error('Error importing skill gems batch:', error);
    } else {
      console.log(`  Imported ${i + batch.length}/${activeSkills.length} skill gems`);
    }
  }
}

/**
 * Import passive tree
 */
async function importPassiveTree(treeData: any) {
  console.log('Importing passive tree...');

  // Store the entire tree as a version
  const treeVersion = {
    patch_version: '0.3',
    tree_data: treeData,
    is_current: true
  };

  // Deactivate previous versions
  await supabase
    .from('passive_tree_versions')
    .update({ is_current: false })
    .eq('is_current', true);

  // Insert new version
  const { data: versionData, error: versionError } = await supabase
    .from('passive_tree_versions')
    .insert(treeVersion)
    .select()
    .single();

  if (versionError) {
    console.error('Error importing passive tree:', versionError);
    return;
  }

  // Extract and store notable passives for quick lookup
  const notables = [];

  if (treeData.nodes) {
    for (const [nodeId, node] of Object.entries(treeData.nodes)) {
      if ((node as any).isNotable || (node as any).isKeystone) {
        notables.push({
          tree_version_id: versionData.id,
          node_id: parseInt(nodeId),
          name: (node as any).name,
          stats: (node as any).stats || [],
          is_keystone: (node as any).isKeystone || false,
          is_notable: (node as any).isNotable || false
        });
      }
    }
  }

  if (notables.length > 0) {
    const { error } = await supabase
      .from('notable_passives')
      .insert(notables);

    if (error) {
      console.error('Error importing notable passives:', error);
    } else {
      console.log(`  Imported ${notables.length} notable/keystone passives`);
    }
  }

  console.log('  Passive tree imported successfully');
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Path of Exile 2 Data Importer');
  console.log('='.repeat(60));

  try {
    // Load extracted data files
    const itemsData = await loadJsonFile('items_data.json');
    const skillsData = await loadJsonFile('skills_data.json');
    const passiveData = await loadJsonFile('passive_tree.json');
    const modsData = await loadJsonFile('mods_data.json');

    // Import data in order
    if (itemsData) {
      await importBaseItems(itemsData);
      await importUniqueItems(itemsData);
    }

    if (skillsData) {
      await importSkillGems(skillsData);
    }

    if (passiveData) {
      await importPassiveTree(passiveData);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Import complete!');
    console.log('Data has been imported to Supabase database');

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

/**
 * Load JSON file helper
 */
async function loadJsonFile(filename: string): Promise<any> {
  const filePath = path.join(DATA_DIR, filename);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Could not load ${filename}:`, error);
    return null;
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}