#!/usr/bin/env ts-node
/**
 * Fetch data from RePoE - Reverse engineered PoE game data
 * This provides structured JSON data from GGPK extraction
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'repoe_data');

// RePoE repository - structured JSON data
const REPOE_SOURCES = {
  // Main RePoE repository (PoE 1 data, but structure is useful)
  repoe: {
    baseUrl: 'https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/',
    endpoints: [
      'base_items.json',
      'crafting_bench_options.json',
      'essences.json',
      'fossils.json',
      'item_classes.json',
      'mods.json',
      'stat_translations.json',
      'stats.json',
      'tags.json',
      'unique_items.json',
      'gem_tags.json',
      'gems.json',
      'passive_skills.json',
      'passive_skill_tree.json'
    ]
  },

  // PoE2 specific data from community efforts
  poe2Community: {
    baseUrl: 'https://raw.githubusercontent.com/',
    endpoints: [
      // Check if any community members have PoE2 RePoE forks
      'Lothrik/PoE2-Data/main/data/base_items.json',
      'poe-tool-dev/dat-schema/main/bundles/poe2.json'
    ]
  },

  // Alternative: poedb.tw API endpoints (unofficial)
  poedbApi: {
    baseUrl: 'https://poedb.tw/api/',
    endpoints: [
      'poe2/base_items',
      'poe2/unique_items',
      'poe2/gems',
      'poe2/passive_tree',
      'poe2/mods'
    ]
  }
};

/**
 * Fetch JSON data with error handling
 */
async function fetchJsonData(url: string): Promise<any | null> {
  try {
    console.log(`  Fetching: ${url}`);
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'PoE2-Toolkit/1.0',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`    ❌ Not found (404)`);
    } else {
      console.error(`    ❌ Error: ${error.message}`);
    }
    return null;
  }
}

/**
 * Save data to file
 */
async function saveData(filename: string, data: any): Promise<void> {
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`    ✅ Saved to: ${filename}`);
}

/**
 * Fetch RePoE structured data
 */
async function fetchRePoEData(): Promise<void> {
  console.log('\n📊 Fetching RePoE Structured Data...');

  const source = REPOE_SOURCES.repoe;

  for (const endpoint of source.endpoints) {
    const url = source.baseUrl + endpoint;
    const data = await fetchJsonData(url);

    if (data) {
      await saveData(`repoe_${endpoint}`, data);
    }
  }
}

/**
 * Fetch community PoE2 data
 */
async function fetchCommunityPoe2Data(): Promise<void> {
  console.log('\n🤝 Fetching Community PoE2 Data...');

  const source = REPOE_SOURCES.poe2Community;

  for (const endpoint of source.endpoints) {
    const url = source.baseUrl + endpoint;
    const data = await fetchJsonData(url);

    if (data) {
      const filename = endpoint.split('/').pop() || 'data.json';
      await saveData(`community_${filename}`, data);
    }
  }
}

/**
 * Verify what data we have
 */
async function verifyData(): Promise<void> {
  console.log('\n✅ Verifying fetched RePoE data...\n');

  try {
    const files = await fs.readdir(OUTPUT_DIR);

    for (const file of files) {
      const filePath = path.join(OUTPUT_DIR, file);
      const stats = await fs.stat(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`  📁 ${file} (${size} KB)`);
    }
  } catch (error) {
    console.log('  No data fetched yet');
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('RePoE Data Fetcher for Path of Exile 2');
  console.log('='.repeat(60));

  try {
    // Fetch RePoE data (structured JSON)
    await fetchRePoEData();

    // Fetch community PoE2 specific data
    await fetchCommunityPoe2Data();

    // Verify what we have
    await verifyData();

    console.log('\n' + '='.repeat(60));
    console.log('✅ RePoE data fetching complete!');
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}