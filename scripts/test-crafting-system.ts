import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCraftingSystem() {
  console.log('🧪 Testing Complete Crafting System Integration\n');
  console.log('='.repeat(50));

  // 1. Test Currency Rates from Database
  console.log('\n📊 Currency Rates from Database:');
  const { data: rates, error: ratesError } = await supabase
    .from('currency_rates')
    .select('*')
    .order('value_in_exalted', { ascending: false });

  if (rates && !ratesError) {
    rates.forEach(rate => {
      console.log(`  ${rate.name}: ${rate.value_in_exalted} Ex (${rate.value_in_divine} Div)`);
    });
  } else {
    console.error('❌ Failed to fetch currency rates:', ratesError);
  }

  // 2. Test Crafting Mods
  console.log('\n🔨 Available Crafting Mods:');
  const { data: mods, error: modsError } = await supabase
    .from('crafting_mods')
    .select('*')
    .eq('type', 'prefix')
    .limit(3);

  if (mods && !modsError) {
    mods.forEach(mod => {
      console.log(`  [${mod.type}] ${mod.name}`);
      console.log(`    - Weight: ${mod.weight}, Tier: ${mod.tier}`);
      console.log(`    - Items: ${mod.item_types?.join(', ')}`);
    });
  } else {
    console.error('❌ Failed to fetch mods:', modsError);
  }

  // 3. Test Item Bases
  console.log('\n🗡️ Available Item Bases:');
  const { data: items, error: itemsError } = await supabase
    .from('item_bases')
    .select('*')
    .limit(3);

  if (items && !itemsError) {
    items.forEach(item => {
      console.log(`  ${item.name} (Level ${item.required_level})`);
    });
  } else {
    console.error('❌ Failed to fetch items:', itemsError);
  }

  // 4. Test API Endpoint
  console.log('\n🌐 Testing API Endpoints:');
  try {
    const response = await fetch('http://localhost:3000/api/market/currency-rates');
    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ Currency API: Working');
      console.log(`  - Divine rate: 1 Div = ${data.rates.divine?.chaos || 'N/A'} Chaos`);
    } else {
      console.log('  ❌ Currency API: Failed');
    }
  } catch (error) {
    console.log('  ⚠️ API not accessible (server may not be running)');
  }

  // 5. Simulate a Crafting Session
  console.log('\n🎮 Simulating Crafting Session:');
  const craftingSession = {
    item_base: 'Prophecy Wand',
    target_mods: ['+1 to Level of all Spell Skill Gems', 'Increased Cast Speed'],
    currency_used: { chaos: 50, alchemy: 10, regal: 5 },
    success: true,
    session_id: `test-${Date.now()}`,
    steps: []  // Required field from the original schema
  };

  // Calculate cost
  const totalCost = await calculateCost(craftingSession.currency_used);
  console.log(`  Item: ${craftingSession.item_base}`);
  console.log(`  Target Mods: ${craftingSession.target_mods.join(', ')}`);
  console.log(`  Currency Used:`);
  Object.entries(craftingSession.currency_used).forEach(([currency, amount]) => {
    console.log(`    - ${amount}x ${currency}`);
  });
  console.log(`  Total Cost: ${totalCost.toFixed(2)} Exalted`);

  // Save session
  const { data: sessionData, error: sessionError } = await supabase
    .from('crafting_sessions')
    .insert([{
      ...craftingSession,
      total_cost_exalted: totalCost
    }])
    .select()
    .single();

  if (sessionData && !sessionError) {
    console.log(`  ✅ Session saved with ID: ${sessionData.id}`);
  } else {
    console.log(`  ❌ Failed to save session:`, sessionError);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Crafting System Test Complete!');
}

async function calculateCost(currencyUsed: Record<string, number>): Promise<number> {
  let total = 0;
  
  for (const [currency, amount] of Object.entries(currencyUsed)) {
    const { data: rate } = await supabase
      .from('currency_rates')
      .select('value_in_exalted')
      .eq('id', currency)
      .single();
    
    if (rate) {
      total += rate.value_in_exalted * amount;
    }
  }
  
  return total;
}

// Run the test
testCraftingSystem().catch(console.error);