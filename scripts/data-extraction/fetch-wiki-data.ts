#!/usr/bin/env ts-node
/**
 * Fetch data from Path of Exile Wiki API
 * Uses MediaWiki API to get structured game data
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'wiki_data');

const WIKI_API = 'https://www.poewiki.net/api.php';

/**
 * Cargo query for specific data tables
 */
const CARGO_QUERIES = {
  items: {
    tables: 'items',
    fields: 'name,class,base_item,required_level,required_str,required_dex,required_int,inventory_icon,html',
    limit: 500
  },
  uniques: {
    tables: 'items',
    fields: 'name,base_item,required_level,implicit_mods,explicit_mods,inventory_icon',
    where: 'rarity="Unique"',
    limit: 500
  },
  gems: {
    tables: 'skill_gems',
    fields: 'name,primary_attribute,required_level,mana_cost,cast_time,tags,description',
    limit: 500
  },
  passives: {
    tables: 'passive_skills',
    fields: 'name,id,stat_text,connections,is_keystone,is_notable,ascendancy_class',
    limit: 1000
  },
  mods: {
    tables: 'mods',
    fields: 'id,name,domain,generation_type,group,stat_text,tags',
    limit: 1000
  }
};

/**
 * Fetch from MediaWiki API
 */
async function fetchWikiData(params: any): Promise<any | null> {
  try {
    const response = await axios.get(WIKI_API, {
      params: {
        action: 'cargoquery',
        format: 'json',
        ...params
      },
      timeout: 30000
    });
    return response.data;
  } catch (error: any) {
    console.error(`  ❌ Wiki API Error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch category members (for listing pages)
 */
async function fetchCategoryMembers(category: string): Promise<string[]> {
  try {
    const response = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmlimit: 500,
        format: 'json'
      }
    });

    if (response.data?.query?.categorymembers) {
      return response.data.query.categorymembers.map((m: any) => m.title);
    }
    return [];
  } catch (error) {
    console.error(`  ❌ Error fetching category ${category}`);
    return [];
  }
}

/**
 * Fetch page content
 */
async function fetchPageContent(title: string): Promise<string | null> {
  try {
    const response = await axios.get(WIKI_API, {
      params: {
        action: 'query',
        prop: 'revisions',
        titles: title,
        rvprop: 'content',
        format: 'json'
      }
    });

    const pages = response.data?.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0] as any;
      return page?.revisions?.[0]?.['*'] || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parse wiki text for structured data
 */
function parseWikiText(text: string): any {
  const data: any = {};

  // Extract infobox data
  const infoboxMatch = text.match(/\{\{Item\s*\|([^}]+)\}\}/);
  if (infoboxMatch) {
    const infoboxContent = infoboxMatch[1];
    const lines = infoboxContent.split('\n');

    for (const line of lines) {
      const [key, value] = line.split('=').map(s => s.trim());
      if (key && value) {
        data[key.replace(/\s+/g, '_')] = value.replace(/[\[\]]/g, '');
      }
    }
  }

  // Extract stats
  const statsMatch = text.match(/==\s*Stats\s*==\s*\n([\s\S]+?)(?:\n==|$)/);
  if (statsMatch) {
    data.stats = statsMatch[1]
      .split('\n')
      .filter(line => line.startsWith('*'))
      .map(line => line.replace(/^\*\s*/, '').trim());
  }

  return data;
}

/**
 * Save data to file
 */
async function saveData(filename: string, data: any): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ Saved to: ${filename}`);
}

/**
 * Fetch PoE 2 specific categories
 */
async function fetchPoe2Data(): Promise<void> {
  console.log('\n📚 Fetching Path of Exile 2 Wiki Data...');

  // Categories to fetch
  const categories = [
    'Path of Exile 2 items',
    'Path of Exile 2 unique items',
    'Path of Exile 2 skill gems',
    'Path of Exile 2 passive skills',
    'Path of Exile 2 currency items',
    'Path of Exile 2 divination cards'
  ];

  const allData: any = {};

  for (const category of categories) {
    console.log(`\n  Fetching category: ${category}`);
    const members = await fetchCategoryMembers(category);

    if (members.length > 0) {
      console.log(`    Found ${members.length} pages`);

      const categoryData: any[] = [];

      // Fetch first 10 pages as examples
      for (let i = 0; i < Math.min(10, members.length); i++) {
        const content = await fetchPageContent(members[i]);
        if (content) {
          const parsed = parseWikiText(content);
          parsed.name = members[i];
          categoryData.push(parsed);
        }
      }

      const categoryKey = category.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      allData[categoryKey] = categoryData;
    }
  }

  if (Object.keys(allData).length > 0) {
    await saveData('wiki_categories.json', allData);
  }
}

/**
 * Fetch structured data using Cargo extension
 */
async function fetchCargoData(): Promise<void> {
  console.log('\n🚂 Fetching Cargo Table Data...');

  for (const [name, query] of Object.entries(CARGO_QUERIES)) {
    console.log(`\n  Fetching ${name} data...`);

    const data = await fetchWikiData(query);

    if (data?.cargoquery) {
      const results = data.cargoquery.map((item: any) => item.title);
      console.log(`    Found ${results.length} ${name}`);
      await saveData(`cargo_${name}.json`, results);
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Path of Exile Wiki Data Fetcher');
  console.log('='.repeat(60));

  try {
    // Fetch PoE 2 specific categories
    await fetchPoe2Data();

    // Try Cargo queries (structured data)
    await fetchCargoData();

    // Additional manual data for PoE 2 v0.3
    console.log('\n📝 Saving Additional v0.3 Data...');

    // Ascendancy classes for v0.3
    const ascendancies = {
      Warrior: ['Titan', 'Warbringer'],
      Ranger: ['Deadeye', 'Pathfinder'],
      Witch: ['Blood Mage', 'Infernalist'],
      Monk: ['Invoker', 'Acolyte of Chayula'],
      Mercenary: ['Witchhunter', 'Gemling Legionnaire'],
      Sorceress: ['Stormweaver', 'Chronomancer']
    };
    await saveData('ascendancies.json', ascendancies);

    // Skill combos (PoE 2 specific)
    const combos = {
      'Warrior Combos': [
        {
          name: 'Boneshatter + Sunder',
          description: 'Build trauma stacks with Boneshatter, release with Sunder',
          damage_multiplier: 2.5
        },
        {
          name: 'Shield Charge + Shield Bash',
          description: 'Charge in, stun with bash',
          utility: 'mobility + stun'
        }
      ],
      'Monk Combos': [
        {
          name: 'Ice Strike + Glacial Cascade',
          description: 'Freeze with Ice Strike, shatter with cascade',
          damage_type: 'cold'
        }
      ]
    };
    await saveData('skill_combos.json', combos);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Wiki data fetching complete!');
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}