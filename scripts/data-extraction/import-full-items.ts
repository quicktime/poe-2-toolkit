import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importFullItems() {
  console.log('🚀 Importing full base items to Supabase...');

  try {
    // Load the full items data
    const data = JSON.parse(
      await fs.readFile(path.join(__dirname, 'processed_data', 'base_items_full.json'), 'utf-8')
    );

    const items: any[] = [];

    // Flatten the categorized structure
    for (const [category, categoryItems] of Object.entries(data)) {
      if (Array.isArray(categoryItems)) {
        for (const item of categoryItems) {
          // Clean up the item for database insertion
          const cleanItem = {
            name: item.name,
            category: item.category || category.slice(0, -1), // Remove plural 's'
            base_type: item.base_type,
            item_class: item.item_class,
            required_level: item.required_level || 1,
            damage_min: item.damage_min || null,
            damage_max: item.damage_max || null,
            attack_speed: item.attack_speed || null,
            critical_chance: item.critical_chance || null,
            armour: item.armour || null,
            evasion: item.evasion || null,
            energy_shield: item.energy_shield || null
          };

          items.push(cleanItem);
        }
      }
    }

    console.log(`📊 Found ${items.length} items to import`);

    if (items.length > 0) {
      // Delete existing items first
      console.log('🗑️ Clearing existing items...');
      const { error: deleteError } = await supabase
        .from('base_items')
        .delete()
        .neq('id', 0); // Delete all

      if (deleteError) {
        console.error('Error clearing items:', deleteError);
      }

      // Insert in batches
      const batchSize = 50;
      let successCount = 0;

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const { error } = await supabase.from('base_items').insert(batch);

        if (error) {
          console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        } else {
          successCount += batch.length;
          console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1} (${successCount}/${items.length})`);
        }
      }

      console.log(`\n✨ Successfully imported ${successCount} items!`);

      // Show sample counts by category
      const { data: weapons } = await supabase
        .from('base_items')
        .select('id')
        .eq('category', 'weapon');
      const { data: armour } = await supabase
        .from('base_items')
        .select('id')
        .eq('category', 'armour');
      const { data: accessories } = await supabase
        .from('base_items')
        .select('id')
        .in('category', ['accessorie', 'accessory']);

      console.log('\n📊 Database contents:');
      console.log(`  - Weapons: ${weapons?.length || 0}`);
      console.log(`  - Armour: ${armour?.length || 0}`);
      console.log(`  - Accessories: ${accessories?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import
importFullItems().catch(console.error);