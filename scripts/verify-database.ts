import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTables() {
  console.log('🔍 Verifying Supabase database tables...\n');

  const tables = [
    // From combined_migration.sql (Essential crafting tables)
    { name: 'crafting_mods', essential: true },
    { name: 'currency_rates', essential: true },
    { name: 'item_bases', essential: true },
    { name: 'market_prices', essential: true },
    { name: 'crafting_sessions', essential: true },
    
    // From 001_initial_schema.sql (User/social features)
    { name: 'profiles', essential: false },
    { name: 'build_templates', essential: false },
    { name: 'build_likes', essential: false },
    { name: 'comments', essential: false },
    { name: 'character_snapshots', essential: false },
    
    // From 002_game_data_schema.sql (Advanced game data)
    { name: 'item_categories', essential: false },
    { name: 'unique_items', essential: false },
    { name: 'skill_gems', essential: false },
    { name: 'passive_tree_versions', essential: false },
  ];

  let essentialTablesOk = true;
  let allTablesOk = true;

  for (const table of tables) {
    try {
      // Try to query the table (limit 1 for speed)
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table.name}: ${error.message}`);
        if (table.essential) essentialTablesOk = false;
        allTablesOk = false;
      } else {
        console.log(`✅ ${table.name}: Table exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table.name}: Unexpected error`);
      if (table.essential) essentialTablesOk = false;
      allTablesOk = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (essentialTablesOk) {
    console.log('✅ All essential crafting tables are ready!');
    
    // Test currency rates
    console.log('\n📊 Testing currency rates data...');
    const { data: rates, error: ratesError } = await supabase
      .from('currency_rates')
      .select('*')
      .order('value_in_exalted', { ascending: false })
      .limit(5);

    if (!ratesError && rates && rates.length > 0) {
      console.log('Currency rates found:');
      rates.forEach(rate => {
        console.log(`  - ${rate.name}: ${rate.value_in_exalted} Ex`);
      });
    } else {
      console.log('⚠️  No currency rates found. You may need to insert sample data.');
    }

    // Test crafting mods
    console.log('\n🔨 Testing crafting mods data...');
    const { data: mods, error: modsError } = await supabase
      .from('crafting_mods')
      .select('*')
      .limit(5);

    if (!modsError && mods && mods.length > 0) {
      console.log(`Found ${mods.length} crafting mods`);
    } else {
      console.log('⚠️  No crafting mods found. You may need to insert sample data.');
    }

  } else {
    console.log('❌ Some essential tables are missing!');
    console.log('\nPlease run the combined_migration.sql in your Supabase dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/zarlahwegnnhfyqrqhew/editor');
    console.log('2. Copy the contents of supabase/migrations/combined_migration.sql');
    console.log('3. Paste and run in the SQL editor');
  }

  if (!allTablesOk && essentialTablesOk) {
    console.log('\n⚠️  Some optional tables are missing (this is OK for basic functionality)');
  }

  return essentialTablesOk;
}

async function testDatabaseOperations() {
  console.log('\n🧪 Testing database operations...\n');

  try {
    // Test inserting a crafting session
    const testSession = {
      item_base: 'test_wand',
      target_mods: ['spell_plus1', 'cast_speed'],
      currency_used: { chaos: 10, alchemy: 5 },
      total_cost_exalted: 42,
      success: true
    };

    console.log('📝 Testing INSERT operation...');
    const { data: insertData, error: insertError } = await supabase
      .from('crafting_sessions')
      .insert([testSession])
      .select()
      .single();

    if (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`);
      return false;
    }

    console.log('✅ Insert successful!');
    console.log(`   Created session with ID: ${insertData.id}`);

    // Test reading back
    console.log('\n📖 Testing SELECT operation...');
    const { data: selectData, error: selectError } = await supabase
      .from('crafting_sessions')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (selectError) {
      console.log(`❌ Select failed: ${selectError.message}`);
      return false;
    }

    console.log('✅ Select successful!');
    console.log(`   Retrieved session: ${selectData.item_base}`);

    // Clean up test data
    console.log('\n🗑️  Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('crafting_sessions')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log(`⚠️  Cleanup failed: ${deleteError.message}`);
    } else {
      console.log('✅ Test data cleaned up');
    }

    return true;

  } catch (err) {
    console.error('❌ Database operation test failed:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database verification...\n');
  console.log('URL:', supabaseUrl);
  console.log('='.repeat(50) + '\n');

  const tablesOk = await verifyTables();
  
  if (tablesOk) {
    const opsOk = await testDatabaseOperations();
    
    if (opsOk) {
      console.log('\n' + '='.repeat(50));
      console.log('✨ Database is fully operational!');
      console.log('Your crafting system is ready to use.');
    }
  }
}

main().catch(console.error);