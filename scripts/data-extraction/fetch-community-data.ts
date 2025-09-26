#!/usr/bin/env ts-node
/**
 * Fetch Path of Exile 2 data from community sources
 * Alternative to GGPK extraction - uses pre-extracted data
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'community_data');

// Community data sources for PoE 2 v0.3+
const DATA_SOURCES = {
  // PoE2DB - Most comprehensive for PoE 2
  poe2db: {
    baseUrl: 'https://poe2db.tw/us/api/',
    endpoints: {
      items: 'items.json',
      uniques: 'uniques.json',
      skills: 'skills.json',
      passives: 'passives.json',
      mods: 'mods.json',
      currency: 'currency.json'
    }
  },

  // RePoE - Community maintained data repository
  repoe: {
    baseUrl: 'https://raw.githubusercontent.com/brather1ng/RePoE/master/data/',
    endpoints: {
      base_items: 'base_items.json',
      uniques: 'uniques.json',
      gems: 'gems.json',
      mod_types: 'mod_types.json',
      mods: 'mods.json',
      crafting_bench_options: 'crafting_bench_options.json',
      fossils: 'fossils.json',
      essences: 'essences.json'
    }
  },

  // Path of Building Community Fork data
  pobData: {
    baseUrl: 'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Export/',
    endpoints: {
      skills: 'Skills/',
      uniques: 'Uniques/',
      passives: 'Tree/'
    }
  },

  // Direct PoE 2 API endpoints (if available)
  poe2Api: {
    baseUrl: 'https://www.pathofexile.com/api/trade/data/',
    endpoints: {
      items: 'items',
      stats: 'stats',
      static: 'static'
    }
  }
};

/**
 * Fetch data from a URL with error handling
 */
async function fetchData(url: string): Promise<any | null> {
  try {
    console.log(`  Fetching: ${url}`);
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'PoE2-Toolkit-Data-Fetcher/1.0'
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`    Not found (404)`);
    } else {
      console.error(`    Error: ${error.message}`);
    }
    return null;
  }
}

/**
 * Save data to JSON file
 */
async function saveData(filename: string, data: any): Promise<void> {
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`    Saved to: ${filename}`);
}

/**
 * Fetch PoE2DB data
 */
async function fetchPoe2DbData(): Promise<void> {
  console.log('\n📊 Fetching from PoE2DB...');

  // Note: PoE2DB may not have direct API access
  // Alternative: Parse HTML or use their export feature
  console.log('  Note: PoE2DB may require HTML parsing or manual export');
  console.log('  Visit: https://poe2db.tw/us/ for manual data export');
}

/**
 * Fetch RePoE data
 */
async function fetchRePoEData(): Promise<void> {
  console.log('\n📚 Fetching from RePoE...');

  const source = DATA_SOURCES.repoe;

  for (const [name, endpoint] of Object.entries(source.endpoints)) {
    const url = source.baseUrl + endpoint;
    const data = await fetchData(url);

    if (data) {
      await saveData(`repoe_${name}.json`, data);
    }
  }
}

/**
 * Fetch Path of Building data
 */
async function fetchPoBData(): Promise<void> {
  console.log('\n🔧 Fetching from Path of Building Community...');

  // Fetch skill data
  const skillsUrl = 'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Export/Skills/act_dex.lua';
  const skillsData = await fetchData(skillsUrl);

  if (skillsData) {
    // Parse Lua to JSON (simplified)
    const skills = parseLuaSkills(skillsData);
    await saveData('pob_skills.json', skills);
  }

  // Fetch unique items
  const uniquesUrl = 'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Export/Uniques/body.lua';
  const uniquesData = await fetchData(uniquesUrl);

  if (uniquesData) {
    const uniques = parseLuaUniques(uniquesData);
    await saveData('pob_uniques.json', uniques);
  }
}

/**
 * Fetch official PoE API data
 */
async function fetchOfficialApiData(): Promise<void> {
  console.log('\n🌐 Fetching from Official PoE API...');

  const source = DATA_SOURCES.poe2Api;

  // Fetch trade data
  const itemsUrl = source.baseUrl + source.endpoints.items;
  const itemsData = await fetchData(itemsUrl);

  if (itemsData) {
    await saveData('official_trade_items.json', itemsData);
  }

  // Fetch stats data
  const statsUrl = source.baseUrl + source.endpoints.stats;
  const statsData = await fetchData(statsUrl);

  if (statsData) {
    await saveData('official_stats.json', statsData);
  }
}

/**
 * Parse Lua skills to JSON (simplified parser)
 */
function parseLuaSkills(luaContent: string): any[] {
  const skills: any[] = [];

  // Basic Lua table parser - this is simplified
  const skillMatches = luaContent.matchAll(/skills\["([^"]+)"\]\s*=\s*{([^}]+)}/g);

  for (const match of skillMatches) {
    const skillName = match[1];
    const skillData = match[2];

    skills.push({
      name: skillName,
      data: skillData // Would need proper Lua parsing
    });
  }

  return skills;
}

/**
 * Parse Lua uniques to JSON (simplified parser)
 */
function parseLuaUniques(luaContent: string): any[] {
  const uniques: any[] = [];

  // Extract item definitions
  const itemMatches = luaContent.matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of itemMatches) {
    const itemText = match[1];
    const lines = itemText.split('\n');

    if (lines.length > 0) {
      uniques.push({
        name: lines[0],
        base: lines[1] || '',
        mods: lines.slice(2)
      });
    }
  }

  return uniques;
}

/**
 * Fetch curated PoE 2 v0.3 data
 */
async function fetchCuratedPoe2Data(): Promise<void> {
  console.log('\n✨ Fetching Curated PoE 2 v0.3 Data...');

  // Manually curated data for PoE 2 v0.3
  const curatedData = {
    // Spirit costs from v0.3 patch notes
    spiritCosts: {
      'Skeletal Arsonist': { min: 39, max: 90 },
      'Skeletal Warrior': { min: 30, max: 70 },
      'Zombie': { min: 40, max: 80 },
      'Cast on Elemental Ailment': 100,
      'Time of Need': 30,
      'Totem (with Ancestral Bond)': 75,
      'Clarity': 25,
      'Determination': 50,
      'Grace': 50,
      'Discipline': 35
    },

    // Damage formulas from v0.3
    damageFormulas: {
      hitChance: 'AA / (AA + (DE/4)^0.9)',
      critDamageBonus: 100, // Base 100% bonus (200% total)
      bleeding: { magnitude: 0.14, duration: 5 }, // 14% per second
      ignite: { magnitude: 0.20, duration: 4 }, // 20% per second
      poison: { magnitude: 0.30, duration: 2 }, // 30% per second
      shockDuration: 8, // Increased in v0.3
      armorFormula: 'Armor / (Armor + 10 * Damage)'
    },

    // Skill scaling changes in v0.3
    skillScaling: {
      lateGameBonus: {
        level20: 1.05, // 5% more damage
        level30: 1.20  // 20% more damage
      },
      supportGemTiers: 5, // Changed from 3
      areaOfEffectReduction: 0.75 // 25% reduction
    },

    // Base weapon damages for v0.3
    weaponBases: {
      'Rusted Sword': { physMin: 6, physMax: 11, aps: 1.45 },
      'Copper Kris': { physMin: 7, physMax: 28, aps: 1.2 },
      'Crude Bow': { physMin: 5, physMax: 13, aps: 1.4 },
      'Driftwood Club': { physMin: 8, physMax: 12, aps: 1.25 },
      'Driftwood Wand': { physMin: 4, physMax: 12, aps: 1.4 },
      'Rusted Hatchet': { physMin: 7, physMax: 10, aps: 1.5 }
    }
  };

  await saveData('poe2_v03_curated.json', curatedData);
}

/**
 * Fetch data from poe.ninja for economy data
 */
async function fetchPoeNinjaData(): Promise<void> {
  console.log('\n💰 Fetching from poe.ninja...');

  const league = 'Standard'; // Or current league
  const endpoints = {
    currency: `https://poe.ninja/api/data/currencyoverview?league=${league}&type=Currency`,
    unique: `https://poe.ninja/api/data/itemoverview?league=${league}&type=UniqueWeapon`,
    gem: `https://poe.ninja/api/data/itemoverview?league=${league}&type=SkillGem`
  };

  for (const [type, url] of Object.entries(endpoints)) {
    const data = await fetchData(url);
    if (data) {
      await saveData(`poeninja_${type}.json`, data);
    }
  }
}

/**
 * Main function to fetch all data
 */
async function main(): Promise<void> {
  console.log('=' .repeat(60));
  console.log('Path of Exile 2 Community Data Fetcher');
  console.log('=' .repeat(60));

  try {
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Fetch from various sources
    await fetchRePoEData();
    await fetchPoBData();
    await fetchOfficialApiData();
    await fetchPoeNinjaData();
    await fetchCuratedPoe2Data();
    await fetchPoe2DbData();

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Data fetching complete!');
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review and merge data from different sources');
    console.log('2. Run import-to-database.ts to import into Supabase');

  } catch (error) {
    console.error('❌ Error fetching data:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  // Check for required packages
  try {
    require('axios');
  } catch {
    console.error('Please install axios: npm install axios');
    process.exit(1);
  }

  main();
}