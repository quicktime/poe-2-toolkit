import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseItems() {
  console.log('🔍 Checking database contents...\n');

  // Check item_bases
  console.log('📦 Item Bases:');
  const { data: items, error: itemsError } = await supabase
    .from('item_bases')
    .select('*')
    .order('name');

  if (items) {
    console.log(`Found ${items.length} items:`);
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.category || 'no-category'}) - Level ${item.required_level}`);
    });
  } else {
    console.log('No items found or error:', itemsError);
  }

  // Check crafting_mods
  console.log('\n🔨 Crafting Mods:');
  const { data: mods, error: modsError } = await supabase
    .from('crafting_mods')
    .select('*')
    .limit(10);

  if (mods) {
    console.log(`Found ${mods.length} mods (showing first 10):`);
    mods.forEach(mod => {
      console.log(`  - [${mod.type}] ${mod.name} (T${mod.tier})`);
    });
  } else {
    console.log('No mods found or error:', modsError);
  }

  // Check unique_items
  console.log('\n⭐ Unique Items:');
  const { data: uniques, error: uniquesError } = await supabase
    .from('unique_items')
    .select('*')
    .limit(5);

  if (uniques && uniques.length > 0) {
    console.log(`Found ${uniques.length} unique items:`);
    uniques.forEach(item => {
      console.log(`  - ${item.name}`);
    });
  } else {
    console.log('No unique items found or table does not exist');
  }

  // Check base_items (alternative table name)
  console.log('\n📦 Base Items (alternative table):');
  const { data: baseItems, error: baseItemsError } = await supabase
    .from('base_items')
    .select('*')
    .limit(10);

  if (baseItems && baseItems.length > 0) {
    console.log(`Found ${baseItems.length} base items:`);
    baseItems.forEach(item => {
      console.log(`  - ${item.name} (${item.category})`);
    });
  } else {
    console.log('No base_items table or empty');
  }
}

checkDatabaseItems().catch(console.error);