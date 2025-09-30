import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { WEAPON_MOD_POOLS, ARMOR_MOD_POOLS, JEWELRY_MOD_POOLS } from '../lib/crafting/poe2-mod-database';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populatePOE2Mods() {
  console.log('🚀 Starting POE2 modifiers database population...\n');

  let totalInserted = 0;
  let totalErrors = 0;

  // Clear existing mods first
  console.log('🗑️ Clearing existing mods...');
  const { error: deleteError } = await supabase
    .from('crafting_mods')
    .delete()
    .neq('id', '');
  
  if (deleteError) {
    console.log('Warning: Could not clear existing mods:', deleteError.message);
  }

  // Collect all mods from all pools
  const allMods: any[] = [];
  const allPools = [...WEAPON_MOD_POOLS, ...ARMOR_MOD_POOLS, ...JEWELRY_MOD_POOLS];
  
  for (const pool of allPools) {
    // Add item class info to each mod
    const poolMods = [
      ...pool.prefixes.map(mod => ({
        id: `${pool.itemClass}_${mod.id}`,
        name: mod.name,
        type: mod.type,
        tier: mod.tier,
        required_level: mod.requiredLevel,
        tags: mod.tags,
        weight: mod.weight,
        min_value: mod.values.min,
        max_value: mod.values.max,
        mod_group: mod.group,
        item_types: pool.itemTypes
      })),
      ...pool.suffixes.map(mod => ({
        id: `${pool.itemClass}_${mod.id}`,
        name: mod.name,
        type: mod.type,
        tier: mod.tier,
        required_level: mod.requiredLevel,
        tags: mod.tags,
        weight: mod.weight,
        min_value: mod.values.min,
        max_value: mod.values.max,
        mod_group: mod.group,
        item_types: pool.itemTypes
      })),
      ...pool.implicits.map(mod => ({
        id: `${pool.itemClass}_${mod.id}`,
        name: mod.name,
        type: mod.type,
        tier: mod.tier,
        required_level: mod.requiredLevel,
        tags: mod.tags,
        weight: mod.weight,
        min_value: mod.values.min,
        max_value: mod.values.max,
        mod_group: mod.group,
        item_types: pool.itemTypes
      })),
      ...pool.corruptedImplicits.map(mod => ({
        id: `${pool.itemClass}_${mod.id}`,
        name: mod.name,
        type: mod.type,
        tier: mod.tier,
        required_level: mod.requiredLevel,
        tags: mod.tags,
        weight: mod.weight,
        min_value: mod.values.min,
        max_value: mod.values.max,
        mod_group: mod.group,
        item_types: pool.itemTypes
      }))
    ];
    
    allMods.push(...poolMods);
  }

  // Insert all mods in batches
  const batchSize = 50;
  for (let i = 0; i < allMods.length; i += batchSize) {
    const batch = allMods.slice(i, i + batchSize);
    console.log(`\n📦 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allMods.length / batchSize)}...`);
    
    const { data, error } = await supabase
      .from('crafting_mods')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error inserting batch:`, error.message);
      totalErrors++;
    } else {
      console.log(`✅ Inserted ${data?.length || 0} mods`);
      totalInserted += data?.length || 0;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ POE2 modifiers database population complete!`);
  console.log(`📊 Total mods inserted: ${totalInserted}`);
  if (totalErrors > 0) {
    console.log(`⚠️ Errors encountered: ${totalErrors}`);
  }

  // Verify the data
  const { count } = await supabase
    .from('crafting_mods')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n🔍 Total mods in database: ${count}`);
  
  // Show breakdown by type
  const { data: typeBreakdown } = await supabase
    .from('crafting_mods')
    .select('type');
  
  if (typeBreakdown) {
    const counts = typeBreakdown.reduce((acc: any, mod: any) => {
      acc[mod.type] = (acc[mod.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Breakdown by type:');
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
  }
}

populatePOE2Mods().catch(console.error);