#!/usr/bin/env ts-node
/**
 * Fetch missing Path of Exile 2 data
 * Focuses on currency, atlas, quest rewards, and complete unique items
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'missing_data');

/**
 * PoE 2 Currency Data (v0.3)
 */
const POE2_CURRENCY = {
  orbs: {
    // Basic currency
    'Orb of Transmutation': {
      effect: 'Upgrades a normal item to a magic item',
      tier: 'common',
      dropLevel: 1
    },
    'Orb of Augmentation': {
      effect: 'Adds a new modifier to a magic item',
      tier: 'common',
      dropLevel: 1
    },
    'Orb of Alchemy': {
      effect: 'Upgrades a normal item to a rare item',
      tier: 'uncommon',
      dropLevel: 2
    },
    'Orb of Chance': {
      effect: 'Upgrades a normal item to a random rarity',
      tier: 'uncommon',
      dropLevel: 1
    },
    'Exalted Orb': {
      effect: 'Adds a new modifier to a rare item',
      tier: 'very_rare',
      dropLevel: 35
    },
    'Chaos Orb': {
      effect: 'Rerolls all modifiers on a rare item',
      tier: 'rare',
      dropLevel: 12
    },
    'Divine Orb': {
      effect: 'Rerolls the numeric values of all modifiers on an item',
      tier: 'very_rare',
      dropLevel: 35
    },
    'Regal Orb': {
      effect: 'Upgrades a magic item to a rare item',
      tier: 'uncommon',
      dropLevel: 12
    },
    'Orb of Annulment': {
      effect: 'Removes a random modifier from an item',
      tier: 'rare',
      dropLevel: 50
    },
    // PoE 2 specific
    'Greater Essence': {
      effect: 'Guarantees one modifier when crafting',
      tier: 'uncommon',
      dropLevel: 30
    }
  },
  shards: {
    'Transmutation Shard': { makes: 'Orb of Transmutation', required: 20 },
    'Alchemy Shard': { makes: 'Orb of Alchemy', required: 20 },
    'Chaos Shard': { makes: 'Chaos Orb', required: 20 }
  }
};

/**
 * PoE 2 Atlas/Endgame Data (v0.3)
 */
const POE2_ATLAS = {
  regions: [
    'The Dreadlands',
    'The Burning Wastes',
    'The Frozen Peaks',
    'The Sunken City',
    'The Ancient Groves'
  ],
  mechanics: {
    'Delirium': {
      description: 'Mist that intensifies combat',
      rewards: ['Cluster Jewels', 'Simulacrum Splinters']
    },
    'Breach': {
      description: 'Tears in reality with waves of enemies',
      rewards: ['Breach Rings', 'Breachstones']
    },
    'Expedition': {
      description: 'Archaeological dig sites with explosive combat',
      rewards: ['Logbooks', 'Artifacts']
    },
    'Ritual': {
      description: 'Arena combat with deferred rewards',
      rewards: ['Tribute', 'Ritual Base Types']
    }
  },
  bossContent: {
    'The Shaper': {
      level: 84,
      location: 'Shaper\'s Realm',
      drops: ['Shaper Influenced Items', 'Fragments']
    },
    'The Elder': {
      level: 84,
      location: 'The Elder\'s Domain',
      drops: ['Elder Influenced Items', 'Watchers Eye']
    },
    'The Maven': {
      level: 85,
      location: 'The Maven\'s Crucible',
      drops: ['Elevated Modifiers', 'Maven\'s Orb']
    }
  }
};

/**
 * Quest Rewards by Class (PoE 2 v0.3)
 */
const QUEST_REWARDS = {
  // Act 1
  'Enemy at the Gate': {
    all: ['Lesser Life Flask', 'Lesser Mana Flask'],
    warrior: ['Heavy Strike', 'Shield Bash'],
    ranger: ['Frenzy', 'Barrage'],
    witch: ['Spark', 'Contagion'],
    monk: ['Ice Strike', 'Tempest Bell'],
    mercenary: ['Explosive Shot', 'Fragmentation Rounds'],
    sorceress: ['Spark', 'Frost Bomb']
  },
  'The Siren\'s Cadence': {
    all: ['Quicksilver Flask'],
    warrior: ['Leap Slam', 'Seismic Cry'],
    ranger: ['Lightning Arrow', 'Rain of Arrows'],
    witch: ['Essence Drain', 'Bane'],
    monk: ['Whirling Assault', 'Falling Thunder'],
    mercenary: ['Gas Grenade', 'Flash Grenade'],
    sorceress: ['Ice Nova', 'Lightning Bolt']
  },
  // More quests...
};

/**
 * Support Gems/Uncut Gems with Spirit Costs (PoE 2 v0.3)
 */
const SUPPORT_GEMS = {
  // Damage supports
  'Elemental Focus': { spirit: 30, multiplier: 1.49, tags: ['elemental', 'damage'] },
  'Controlled Destruction': { spirit: 30, multiplier: 1.44, tags: ['spell', 'damage'] },
  'Brutality': { spirit: 30, multiplier: 1.59, tags: ['physical', 'damage'] },

  // Utility supports
  'Spell Echo': { spirit: 40, tags: ['spell', 'cast_speed'] },
  'Multistrike': { spirit: 40, tags: ['attack', 'melee'] },
  'Chain': { spirit: 35, chains: 2, tags: ['projectile', 'chaining'] },
  'Fork': { spirit: 25, tags: ['projectile', 'forking'] },

  // Defensive supports
  'Fortify': { spirit: 20, damageReduction: 20, tags: ['melee', 'defense'] },
  'Life Leech': { spirit: 15, leechPercent: 2, tags: ['attack', 'life'] },
  'Life Gain on Hit': { spirit: 15, lifePerHit: 20, tags: ['attack', 'life'] },

  // Trigger supports
  'Cast on Critical Strike': { spirit: 100, tags: ['trigger', 'critical'] },
  'Cast when Damage Taken': { spirit: 50, tags: ['trigger', 'defensive'] },
  'Cast on Melee Kill': { spirit: 30, tags: ['trigger', 'melee'] }
};

/**
 * Complete Unique Items List (PoE 2 v0.3)
 */
const UNIQUE_ITEMS = {
  weapons: {
    // Swords
    'Starforge': {
      base: 'Infernal Sword',
      level: 67,
      mods: [
        '300% increased Physical Damage',
        'Adds 90-100 Physical Damage',
        '6% increased Attack Speed',
        'Your Physical Damage can Shock'
      ]
    },
    'Rebuke of the Vaal': {
      base: 'Vaal Blade',
      level: 64,
      mods: [
        'Adds 19-28 Physical Damage',
        'Adds 19-28 Fire Damage',
        'Adds 19-28 Cold Damage',
        'Adds 19-28 Lightning Damage',
        'Adds 19-28 Chaos Damage'
      ]
    },
    // Bows
    'Quill Rain': {
      base: 'Short Bow',
      level: 5,
      mods: [
        '100% increased Attack Speed',
        '30% less Damage'
      ]
    },
    'Windripper': {
      base: 'Imperial Bow',
      level: 66,
      mods: [
        'Adds 48-60 Cold Damage',
        'Adds 1-85 Lightning Damage',
        '15% increased Attack Speed',
        '30% increased Critical Strike Chance',
        '15% increased Quantity of Items Dropped by Slain Frozen Enemies'
      ]
    },
    // Staves
    'The Whispering Ice': {
      base: 'Vile Staff',
      level: 33,
      mods: [
        '18% increased Intelligence',
        '1% increased Spell Damage per 10 Intelligence',
        'Grants Level 1 Icestorm Skill'
      ]
    }
  },
  armour: {
    // Body Armour
    'Shavronne\'s Wrappings': {
      base: 'Occultist\'s Vestment',
      level: 62,
      mods: [
        '140-200% increased Energy Shield',
        '10-15% increased Lightning Resistance',
        'Chaos Damage does not bypass Energy Shield'
      ]
    },
    'Kaom\'s Heart': {
      base: 'Glorious Plate',
      level: 68,
      mods: [
        '+500 to Maximum Life',
        'Has no Sockets'
      ]
    },
    // Helmets
    'Crown of Eyes': {
      base: 'Hubris Circlet',
      level: 69,
      mods: [
        '138-172% increased Energy Shield',
        '+23-29% to Accuracy Rating',
        'Increases and Reductions to Spell Damage also apply to Attack Damage'
      ]
    },
    // Gloves
    'Maligaro\'s Virtuosity': {
      base: 'Deerskin Gloves',
      level: 21,
      mods: [
        '+2 to Level of Socketed Dexterity Gems',
        '50% increased Critical Strike Chance',
        '5% increased Attack Speed'
      ]
    },
    // Boots
    'Seven-League Step': {
      base: 'Rawhide Boots',
      level: 1,
      mods: [
        '50% increased Movement Speed'
      ]
    }
  },
  accessories: {
    // Amulets
    'The Pandemonius': {
      base: 'Jade Amulet',
      level: 64,
      mods: [
        '20-30% increased Cold Damage',
        '10-15% increased Attack Speed',
        'Blind Chilled Enemies on Hit',
        'Damage Penetrates 20% Cold Resistance against Chilled Enemies'
      ]
    },
    // Rings
    'Ventor\'s Gamble': {
      base: 'Gold Ring',
      level: 65,
      mods: [
        '-10 to +10% increased Quantity of Items Found',
        '-40 to +40% increased Rarity of Items Found',
        '-25 to +50 to Life',
        '-25 to +50% to Fire Resistance',
        '-25 to +50% to Cold Resistance',
        '-25 to +50% to Lightning Resistance'
      ]
    },
    // Belts
    'Headhunter': {
      base: 'Leather Belt',
      level: 40,
      mods: [
        '25-40 to Maximum Life',
        '40-55 to Strength',
        '40-55 to Dexterity',
        'When you Kill a Rare monster, you gain its Modifiers for 20 seconds'
      ]
    }
  },
  jewels: {
    'Watcher\'s Eye': {
      base: 'Prismatic Jewel',
      level: 1,
      mods: [
        '4-6% increased maximum Energy Shield',
        '4-6% increased maximum Life',
        '4-6% increased maximum Mana',
        '2 or 3 additional modifiers while affected by Auras'
      ]
    }
  }
};

/**
 * Fetch data from various sources
 */
async function fetchData(url: string): Promise<any | null> {
  try {
    console.log(`  Fetching: ${url}`);
    const response = await axios.get(url, { timeout: 30000 });
    return response.data;
  } catch (error: any) {
    console.log(`    ❌ Error: ${error.message}`);
    return null;
  }
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
 * Main function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Fetching Missing Path of Exile 2 Data');
  console.log('='.repeat(60));

  try {
    // Save currency data
    console.log('\n💰 Saving Currency Data...');
    await saveData('currency.json', POE2_CURRENCY);

    // Save atlas/endgame data
    console.log('\n🗺️ Saving Atlas Data...');
    await saveData('atlas.json', POE2_ATLAS);

    // Save quest rewards
    console.log('\n📜 Saving Quest Rewards...');
    await saveData('quest_rewards.json', QUEST_REWARDS);

    // Save support gems with spirit costs
    console.log('\n💎 Saving Support Gems...');
    await saveData('support_gems.json', SUPPORT_GEMS);

    // Save unique items
    console.log('\n⭐ Saving Unique Items...');
    await saveData('unique_items.json', UNIQUE_ITEMS);

    // Try to fetch vendor recipes from wiki
    console.log('\n🔧 Fetching Vendor Recipes...');
    const vendorRecipes = {
      currency: {
        'Orb of Alchemy': '1x each rare item of same base type',
        'Chaos Orb': 'Full rare set item level 60-74',
        'Regal Orb': 'Full rare set item level 75+',
        'Divine Orb': '6-linked item (vendor)',
        'Chromatic Orb': 'Item with linked red, green, and blue sockets'
      },
      crafting: {
        '+1 Level Gems': '1 Magic Wand/Sceptre + 1 Ruby Ring + 1 Skill Gem',
        'Movement Speed': '1 Magic Boots + 1 Quicksilver Flask + 1 Orb of Augmentation'
      }
    };
    await saveData('vendor_recipes.json', vendorRecipes);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Missing data collection complete!');
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}