import * as fs from 'fs/promises';
import * as path from 'path';

const REPOE_DIR = path.join(__dirname, 'repoe_data');
const OUTPUT_DIR = path.join(__dirname, 'processed_data');

interface RePoEItem {
  domain: string;
  drop_level: number;
  item_class: string;
  name: string;
  properties: any;
  requirements: any;
  tags: string[];
  implicits?: string[];
}

async function processRePoEData() {
  console.log('📦 Processing RePoE base items data...');

  // Load RePoE base items
  const repoeData = JSON.parse(
    await fs.readFile(path.join(REPOE_DIR, 'repoe_base_items.json'), 'utf-8')
  );

  const processedItems = {
    weapons: [] as any[],
    armour: [] as any[],
    accessories: [] as any[],
    flasks: [] as any[],
    jewels: [] as any[],
    other: [] as any[]
  };

  // Track names to handle duplicates
  const nameTracker = new Map<string, number>();

  // Process each item
  for (const [key, item] of Object.entries(repoeData)) {
    const repoeItem = item as RePoEItem;

    // Skip only items explicitly marked as unique_only
    if (repoeItem.release_state === 'unique_only' && !repoeItem.tags?.includes('atlas_base_type')) {
      continue;
    }
    // Include item, flask, and abyss_jewel domains
    if (repoeItem.domain !== 'item' && repoeItem.domain !== 'flask' && repoeItem.domain !== 'abyss_jewel') {
      continue;
    }

    // Categorize item
    let category = 'other';
    let baseType = repoeItem.item_class?.toLowerCase() || '';

    // Weapons
    if (['One Hand Sword', 'Two Hand Sword', 'Thrusting One Hand Sword', 'One Hand Axe', 'Two Hand Axe',
         'One Hand Mace', 'Two Hand Mace', 'Bow', 'Staff', 'Wand', 'Dagger', 'Claw', 'Sceptre', 'Rune Dagger',
         'Warstaff', 'FishingRod'].some(w => repoeItem.item_class === w)) {
      category = 'weapons';
      baseType = repoeItem.item_class.toLowerCase().replace(/ /g, '_');
    }
    // Armour
    else if (['Body Armour', 'Helmet', 'Gloves', 'Boots', 'Shield'].some(a => repoeItem.item_class === a)) {
      category = 'armour';
      baseType = repoeItem.item_class.toLowerCase().replace(/ /g, '_');
    }
    // Accessories
    else if (['Amulet', 'Ring', 'Belt', 'Quiver'].some(a => repoeItem.item_class === a)) {
      category = 'accessories';
      baseType = repoeItem.item_class.toLowerCase();
    }
    // Flasks
    else if (repoeItem.item_class === 'LifeFlask' || repoeItem.item_class === 'ManaFlask' ||
             repoeItem.item_class === 'HybridFlask' || repoeItem.item_class === 'UtilityFlask') {
      category = 'flasks';
      baseType = 'flask';
    }
    // Jewels
    else if (repoeItem.item_class === 'Jewel' || repoeItem.item_class === 'AbyssJewel' ||
             repoeItem.item_class === 'DelveStackableSocketableCurrency' ||
             repoeItem.domain === 'abyss_jewel') {
      category = 'jewels';
      baseType = 'jewel';
    }

    // Extract weapon stats if available
    let damage_min, damage_max, attack_speed, critical_chance;
    if (repoeItem.properties) {
      // Try to extract damage from properties
      if (repoeItem.properties.physical_damage_min) {
        // Handle object format {min: X, max: Y} or direct number
        const dmgMin = repoeItem.properties.physical_damage_min;
        const dmgMax = repoeItem.properties.physical_damage_max;
        damage_min = typeof dmgMin === 'object' ? dmgMin.min : dmgMin;
        damage_max = typeof dmgMax === 'object' ? dmgMax.max : dmgMax;
      }
      if (repoeItem.properties.attack_time) {
        attack_speed = Math.round((1000 / repoeItem.properties.attack_time) * 100) / 100;
      }
      if (repoeItem.properties.critical_strike_chance) {
        critical_chance = repoeItem.properties.critical_strike_chance / 100;
      }
    }

    // Extract armour stats
    let armour, evasion, energy_shield;
    if (repoeItem.properties) {
      const arm = repoeItem.properties.armour;
      const eva = repoeItem.properties.evasion;
      const es = repoeItem.properties.energy_shield;

      // Handle object format {min: X, max: Y} or direct number
      armour = typeof arm === 'object' ? arm.min : arm;
      evasion = typeof eva === 'object' ? eva.min : eva;
      energy_shield = typeof es === 'object' ? es.min : es;
    }

    // Handle duplicate names
    let itemName = repoeItem.name;
    if (nameTracker.has(itemName)) {
      const count = nameTracker.get(itemName)! + 1;
      nameTracker.set(itemName, count);
      itemName = `${itemName} (T${count})`;
    } else {
      nameTracker.set(itemName, 1);
    }

    const processedItem = {
      name: itemName,
      category: category === 'weapons' ? 'weapon' :
                category === 'accessories' ? 'accessory' :
                category === 'flasks' ? 'flask' :
                category === 'jewels' ? 'jewel' :
                category, // Keep 'armour' as is
      base_type: baseType,
      item_class: repoeItem.item_class,
      required_level: repoeItem.drop_level || 1,
      damage_min,
      damage_max,
      attack_speed,
      critical_chance,
      armour,
      evasion,
      energy_shield,
      tags: repoeItem.tags || [],
      implicits: repoeItem.implicits || []
    };

    // Add to appropriate category
    if (category === 'weapons') {
      processedItems.weapons.push(processedItem);
    } else if (category === 'armour') {
      processedItems.armour.push(processedItem);
    } else if (category === 'accessories') {
      processedItems.accessories.push(processedItem);
    } else if (category === 'flasks') {
      processedItems.flasks.push(processedItem);
    } else if (category === 'jewels') {
      processedItems.jewels.push(processedItem);
    } else {
      processedItems.other.push(processedItem);
    }
  }

  // Save processed data
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'base_items_full.json'),
    JSON.stringify(processedItems, null, 2)
  );

  console.log('✅ Processed base items:');
  console.log(`  - Weapons: ${processedItems.weapons.length}`);
  console.log(`  - Armour: ${processedItems.armour.length}`);
  console.log(`  - Accessories: ${processedItems.accessories.length}`);
  console.log(`  - Flasks: ${processedItems.flasks.length}`);
  console.log(`  - Jewels: ${processedItems.jewels.length}`);
  console.log(`  - Other: ${processedItems.other.length}`);
  console.log(`  - Total: ${Object.values(processedItems).flat().length}`);
}

// Run the processing
processRePoEData().catch(console.error);