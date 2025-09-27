#!/usr/bin/env ts-node
/**
 * Verify Supabase data import
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyData() {
  console.log('='.repeat(60));
  console.log('Supabase Data Verification');
  console.log('='.repeat(60));
  console.log();

  // Check each table
  const tables = [
    'base_items',
    'unique_items',
    'skill_gems',
    'passive_skills',
    'currency_items',
    'ascendancies',
    'quest_rewards'
  ];

  console.log('📊 Table Row Counts:');
  console.log('-'.repeat(40));

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table.padEnd(20)} Error: ${error.message}`);
    } else {
      console.log(`✅ ${table.padEnd(20)} ${(count || 0).toString().padStart(6)} rows`);
    }
  }

  // Sample data from each table
  console.log('\n📝 Sample Data:');
  console.log('-'.repeat(40));

  // Sample base items
  const { data: baseItems } = await supabase
    .from('base_items')
    .select('name, category, attack_speed, critical_chance')
    .limit(3);

  console.log('\nBase Items:');
  baseItems?.forEach(item => {
    console.log(`  - ${item.name} (${item.category})`);
  });

  // Sample skill gems
  const { data: gems } = await supabase
    .from('skill_gems')
    .select('name, gem_type, spirit_cost')
    .limit(3);

  console.log('\nSkill Gems:');
  gems?.forEach(gem => {
    console.log(`  - ${gem.name} (${gem.gem_type}, Spirit: ${gem.spirit_cost})`);
  });

  // Sample passive skills
  const { data: passives } = await supabase
    .from('passive_skills')
    .select('name, type, is_keystone, is_notable')
    .eq('is_keystone', true)
    .limit(3);

  console.log('\nKeystone Passives:');
  passives?.forEach(passive => {
    console.log(`  - ${passive.name}`);
  });

  // Sample currency
  const { data: currency } = await supabase
    .from('currency_items')
    .select('name, type, tier')
    .limit(3);

  console.log('\nCurrency Items:');
  currency?.forEach(item => {
    console.log(`  - ${item.name} (${item.tier || item.type})`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification complete!');
}

// Run verification
verifyData().catch(console.error);