import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Comprehensive POE2 Item Database (Patch 0.3+)
const POE2_ITEMS = {
  // Wands
  wands: [
    { id: 'driftwood_wand', name: 'Driftwood Wand', category: 'wand', item_class: 'wand', required_level: 1 },
    { id: 'goats_horn', name: "Goat's Horn", category: 'wand', item_class: 'wand', required_level: 6 },
    { id: 'carved_wand', name: 'Carved Wand', category: 'wand', item_class: 'wand', required_level: 12 },
    { id: 'quartz_wand', name: 'Quartz Wand', category: 'wand', item_class: 'wand', required_level: 18 },
    { id: 'spiraled_wand', name: 'Spiraled Wand', category: 'wand', item_class: 'wand', required_level: 24 },
    { id: 'sage_wand', name: 'Sage Wand', category: 'wand', item_class: 'wand', required_level: 30 },
    { id: 'pagan_wand', name: 'Pagan Wand', category: 'wand', item_class: 'wand', required_level: 34 },
    { id: 'fauns_horn', name: "Faun's Horn", category: 'wand', item_class: 'wand', required_level: 35 },
    { id: 'engraved_wand', name: 'Engraved Wand', category: 'wand', item_class: 'wand', required_level: 40 },
    { id: 'crystal_wand', name: 'Crystal Wand', category: 'wand', item_class: 'wand', required_level: 45 },
    { id: 'serpent_wand', name: 'Serpent Wand', category: 'wand', item_class: 'wand', required_level: 49 },
    { id: 'omen_wand', name: 'Omen Wand', category: 'wand', item_class: 'wand', required_level: 53 },
    { id: 'demon_horn', name: "Demon's Horn", category: 'wand', item_class: 'wand', required_level: 56 },
    { id: 'imbued_wand', name: 'Imbued Wand', category: 'wand', item_class: 'wand', required_level: 59 },
    { id: 'opal_wand', name: 'Opal Wand', category: 'wand', item_class: 'wand', required_level: 62 },
    { id: 'tornado_wand', name: 'Tornado Wand', category: 'wand', item_class: 'wand', required_level: 65 },
    { id: 'prophecy_wand', name: 'Prophecy Wand', category: 'wand', item_class: 'wand', required_level: 68 },
    { id: 'profane_wand', name: 'Profane Wand', category: 'wand', item_class: 'wand', required_level: 70 },
    { id: 'convoking_wand', name: 'Convoking Wand', category: 'wand', item_class: 'wand', required_level: 72 },
  ],
  
  // Sceptres
  sceptres: [
    { id: 'driftwood_sceptre', name: 'Driftwood Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 1 },
    { id: 'darkwood_sceptre', name: 'Darkwood Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 5 },
    { id: 'bronze_sceptre', name: 'Bronze Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 10 },
    { id: 'quartz_sceptre', name: 'Quartz Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 15 },
    { id: 'iron_sceptre', name: 'Iron Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 20 },
    { id: 'ochre_sceptre', name: 'Ochre Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 24 },
    { id: 'ritual_sceptre', name: 'Ritual Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 28 },
    { id: 'shadow_sceptre', name: 'Shadow Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 32 },
    { id: 'grinning_fetish', name: 'Grinning Fetish', category: 'sceptre', item_class: 'sceptre', required_level: 35 },
    { id: 'sekhem', name: 'Sekhem', category: 'sceptre', item_class: 'sceptre', required_level: 38 },
    { id: 'crystal_sceptre', name: 'Crystal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 41 },
    { id: 'lead_sceptre', name: 'Lead Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 44 },
    { id: 'blood_sceptre', name: 'Blood Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 47 },
    { id: 'royal_sceptre', name: 'Royal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 50 },
    { id: 'abyssal_sceptre', name: 'Abyssal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 53 },
    { id: 'karui_sceptre', name: 'Karui Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 56 },
    { id: 'tyrants_sekhem', name: "Tyrant's Sekhem", category: 'sceptre', item_class: 'sceptre', required_level: 58 },
    { id: 'opal_sceptre', name: 'Opal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 60 },
    { id: 'platinum_sceptre', name: 'Platinum Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 62 },
    { id: 'vaal_sceptre', name: 'Vaal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 64 },
    { id: 'carnal_sceptre', name: 'Carnal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 66 },
    { id: 'void_sceptre', name: 'Void Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 68 },
    { id: 'sambar_sceptre', name: 'Sambar Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 70 },
  ],
  
  // Staves
  staves: [
    { id: 'gnarled_branch', name: 'Gnarled Branch', category: 'staff', item_class: 'staff', required_level: 1 },
    { id: 'primitive_staff', name: 'Primitive Staff', category: 'staff', item_class: 'staff', required_level: 9 },
    { id: 'long_staff', name: 'Long Staff', category: 'staff', item_class: 'staff', required_level: 18 },
    { id: 'iron_staff', name: 'Iron Staff', category: 'staff', item_class: 'staff', required_level: 23 },
    { id: 'coiled_staff', name: 'Coiled Staff', category: 'staff', item_class: 'staff', required_level: 28 },
    { id: 'vile_staff', name: 'Vile Staff', category: 'staff', item_class: 'staff', required_level: 33 },
    { id: 'military_staff', name: 'Military Staff', category: 'staff', item_class: 'staff', required_level: 38 },
    { id: 'serpentine_staff', name: 'Serpentine Staff', category: 'staff', item_class: 'staff', required_level: 43 },
    { id: 'highborn_staff', name: 'Highborn Staff', category: 'staff', item_class: 'staff', required_level: 48 },
    { id: 'foul_staff', name: 'Foul Staff', category: 'staff', item_class: 'staff', required_level: 52 },
    { id: 'moon_staff', name: 'Moon Staff', category: 'staff', item_class: 'staff', required_level: 55 },
    { id: 'primordial_staff', name: 'Primordial Staff', category: 'staff', item_class: 'staff', required_level: 58 },
    { id: 'lathi', name: 'Lathi', category: 'staff', item_class: 'staff', required_level: 60 },
    { id: 'ezomyte_staff', name: 'Ezomyte Staff', category: 'staff', item_class: 'staff', required_level: 62 },
    { id: 'maelstrom_staff', name: 'Maelström Staff', category: 'staff', item_class: 'staff', required_level: 64 },
    { id: 'imperial_staff', name: 'Imperial Staff', category: 'staff', item_class: 'staff', required_level: 66 },
    { id: 'judgement_staff', name: 'Judgement Staff', category: 'staff', item_class: 'staff', required_level: 68 },
    { id: 'eclipse_staff', name: 'Eclipse Staff', category: 'staff', item_class: 'staff', required_level: 70 },
  ],
  
  // Body Armours - Energy Shield
  bodyArmourES: [
    { id: 'simple_robe', name: 'Simple Robe', category: 'body', item_class: 'body_armour', required_level: 1 },
    { id: 'silken_vest', name: 'Silken Vest', category: 'body', item_class: 'body_armour', required_level: 6 },
    { id: 'scholars_robe', name: "Scholar's Robe", category: 'body', item_class: 'body_armour', required_level: 12 },
    { id: 'silken_garb', name: 'Silken Garb', category: 'body', item_class: 'body_armour', required_level: 18 },
    { id: 'mage_vestment', name: 'Mage Vestment', category: 'body', item_class: 'body_armour', required_level: 24 },
    { id: 'silk_robe', name: 'Silk Robe', category: 'body', item_class: 'body_armour', required_level: 30 },
    { id: 'cabalist_regalia', name: 'Cabalist Regalia', category: 'body', item_class: 'body_armour', required_level: 36 },
    { id: 'sages_robe', name: "Sage's Robe", category: 'body', item_class: 'body_armour', required_level: 42 },
    { id: 'silken_wrap', name: 'Silken Wrap', category: 'body', item_class: 'body_armour', required_level: 47 },
    { id: 'conjurer_vestment', name: 'Conjurer Vestment', category: 'body', item_class: 'body_armour', required_level: 52 },
    { id: 'spidersilk_robe', name: 'Spidersilk Robe', category: 'body', item_class: 'body_armour', required_level: 56 },
    { id: 'destroyer_regalia', name: 'Destroyer Regalia', category: 'body', item_class: 'body_armour', required_level: 60 },
    { id: 'savants_robe', name: "Savant's Robe", category: 'body', item_class: 'body_armour', required_level: 63 },
    { id: 'occultists_vestment', name: "Occultist's Vestment", category: 'body', item_class: 'body_armour', required_level: 65 },
    { id: 'widowsilk_robe', name: 'Widowsilk Robe', category: 'body', item_class: 'body_armour', required_level: 67 },
    { id: 'vaal_regalia', name: 'Vaal Regalia', category: 'body', item_class: 'body_armour', required_level: 68 },
  ],
  
  // Body Armours - Evasion
  bodyArmourEV: [
    { id: 'shabby_jerkin', name: 'Shabby Jerkin', category: 'body', item_class: 'body_armour', required_level: 1 },
    { id: 'strapped_leather', name: 'Strapped Leather', category: 'body', item_class: 'body_armour', required_level: 6 },
    { id: 'buckskin_tunic', name: 'Buckskin Tunic', category: 'body', item_class: 'body_armour', required_level: 12 },
    { id: 'wild_leather', name: 'Wild Leather', category: 'body', item_class: 'body_armour', required_level: 18 },
    { id: 'full_leather', name: 'Full Leather', category: 'body', item_class: 'body_armour', required_level: 24 },
    { id: 'sun_leather', name: 'Sun Leather', category: 'body', item_class: 'body_armour', required_level: 30 },
    { id: 'thiefs_garb', name: "Thief's Garb", category: 'body', item_class: 'body_armour', required_level: 36 },
    { id: 'eelskin_tunic', name: 'Eelskin Tunic', category: 'body', item_class: 'body_armour', required_level: 42 },
    { id: 'frontier_leather', name: 'Frontier Leather', category: 'body', item_class: 'body_armour', required_level: 47 },
    { id: 'glorious_leather', name: 'Glorious Leather', category: 'body', item_class: 'body_armour', required_level: 52 },
    { id: 'coronal_leather', name: 'Coronal Leather', category: 'body', item_class: 'body_armour', required_level: 56 },
    { id: 'cutthroats_garb', name: "Cutthroat's Garb", category: 'body', item_class: 'body_armour', required_level: 60 },
    { id: 'sharkskin_tunic', name: 'Sharkskin Tunic', category: 'body', item_class: 'body_armour', required_level: 63 },
    { id: 'destiny_leather', name: 'Destiny Leather', category: 'body', item_class: 'body_armour', required_level: 65 },
    { id: 'exquisite_leather', name: 'Exquisite Leather', category: 'body', item_class: 'body_armour', required_level: 67 },
    { id: 'assassins_garb', name: "Assassin's Garb", category: 'body', item_class: 'body_armour', required_level: 68 },
  ],
  
  // Body Armours - Armour
  bodyArmourAR: [
    { id: 'plate_vest', name: 'Plate Vest', category: 'body', item_class: 'body_armour', required_level: 1 },
    { id: 'chestplate', name: 'Chestplate', category: 'body', item_class: 'body_armour', required_level: 6 },
    { id: 'copper_plate', name: 'Copper Plate', category: 'body', item_class: 'body_armour', required_level: 12 },
    { id: 'war_plate', name: 'War Plate', category: 'body', item_class: 'body_armour', required_level: 18 },
    { id: 'full_plate', name: 'Full Plate', category: 'body', item_class: 'body_armour', required_level: 24 },
    { id: 'arena_plate', name: 'Arena Plate', category: 'body', item_class: 'body_armour', required_level: 30 },
    { id: 'lordly_plate', name: 'Lordly Plate', category: 'body', item_class: 'body_armour', required_level: 36 },
    { id: 'bronze_plate', name: 'Bronze Plate', category: 'body', item_class: 'body_armour', required_level: 42 },
    { id: 'battle_plate', name: 'Battle Plate', category: 'body', item_class: 'body_armour', required_level: 47 },
    { id: 'sun_plate', name: 'Sun Plate', category: 'body', item_class: 'body_armour', required_level: 52 },
    { id: 'colosseum_plate', name: 'Colosseum Plate', category: 'body', item_class: 'body_armour', required_level: 56 },
    { id: 'majestic_plate', name: 'Majestic Plate', category: 'body', item_class: 'body_armour', required_level: 60 },
    { id: 'golden_plate', name: 'Golden Plate', category: 'body', item_class: 'body_armour', required_level: 63 },
    { id: 'crusader_plate', name: 'Crusader Plate', category: 'body', item_class: 'body_armour', required_level: 65 },
    { id: 'astral_plate', name: 'Astral Plate', category: 'body', item_class: 'body_armour', required_level: 67 },
    { id: 'glorious_plate', name: 'Glorious Plate', category: 'body', item_class: 'body_armour', required_level: 68 },
  ],

  // Helmets
  helmets: [
    { id: 'iron_hat', name: 'Iron Hat', category: 'helmet', item_class: 'helmet', required_level: 1 },
    { id: 'cone_helmet', name: 'Cone Helmet', category: 'helmet', item_class: 'helmet', required_level: 7 },
    { id: 'barbute_helmet', name: 'Barbute Helmet', category: 'helmet', item_class: 'helmet', required_level: 18 },
    { id: 'close_helmet', name: 'Close Helmet', category: 'helmet', item_class: 'helmet', required_level: 26 },
    { id: 'gladiator_helmet', name: 'Gladiator Helmet', category: 'helmet', item_class: 'helmet', required_level: 35 },
    { id: 'reaver_helmet', name: 'Reaver Helmet', category: 'helmet', item_class: 'helmet', required_level: 43 },
    { id: 'siege_helmet', name: 'Siege Helmet', category: 'helmet', item_class: 'helmet', required_level: 50 },
    { id: 'samite_helmet', name: 'Samite Helmet', category: 'helmet', item_class: 'helmet', required_level: 55 },
    { id: 'ezomyte_burgonet', name: 'Ezomyte Burgonet', category: 'helmet', item_class: 'helmet', required_level: 60 },
    { id: 'royal_burgonet', name: 'Royal Burgonet', category: 'helmet', item_class: 'helmet', required_level: 65 },
    { id: 'eternal_burgonet', name: 'Eternal Burgonet', category: 'helmet', item_class: 'helmet', required_level: 69 },
  ],

  // Gloves
  gloves: [
    { id: 'iron_gauntlets', name: 'Iron Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 1 },
    { id: 'plated_gauntlets', name: 'Plated Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 11 },
    { id: 'bronze_gauntlets', name: 'Bronze Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 23 },
    { id: 'steel_gauntlets', name: 'Steel Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 35 },
    { id: 'antique_gauntlets', name: 'Antique Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 47 },
    { id: 'ancient_gauntlets', name: 'Ancient Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 54 },
    { id: 'goliath_gauntlets', name: 'Goliath Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 59 },
    { id: 'vaal_gauntlets', name: 'Vaal Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 63 },
    { id: 'titan_gauntlets', name: 'Titan Gauntlets', category: 'gloves', item_class: 'gloves', required_level: 69 },
    { id: 'spiked_gloves', name: 'Spiked Gloves', category: 'gloves', item_class: 'gloves', required_level: 70 },
  ],

  // Boots  
  boots: [
    { id: 'iron_greaves', name: 'Iron Greaves', category: 'boots', item_class: 'boots', required_level: 1 },
    { id: 'steel_greaves', name: 'Steel Greaves', category: 'boots', item_class: 'boots', required_level: 9 },
    { id: 'plated_greaves', name: 'Plated Greaves', category: 'boots', item_class: 'boots', required_level: 18 },
    { id: 'reinforced_greaves', name: 'Reinforced Greaves', category: 'boots', item_class: 'boots', required_level: 28 },
    { id: 'antique_greaves', name: 'Antique Greaves', category: 'boots', item_class: 'boots', required_level: 36 },
    { id: 'ancient_greaves', name: 'Ancient Greaves', category: 'boots', item_class: 'boots', required_level: 44 },
    { id: 'goliath_greaves', name: 'Goliath Greaves', category: 'boots', item_class: 'boots', required_level: 52 },
    { id: 'vaal_greaves', name: 'Vaal Greaves', category: 'boots', item_class: 'boots', required_level: 60 },
    { id: 'titan_greaves', name: 'Titan Greaves', category: 'boots', item_class: 'boots', required_level: 68 },
  ],

  // Belts
  belts: [
    { id: 'chain_belt', name: 'Chain Belt', category: 'belt', item_class: 'belt', required_level: 2 },
    { id: 'rustic_sash', name: 'Rustic Sash', category: 'belt', item_class: 'belt', required_level: 1 },
    { id: 'heavy_belt', name: 'Heavy Belt', category: 'belt', item_class: 'belt', required_level: 8 },
    { id: 'leather_belt', name: 'Leather Belt', category: 'belt', item_class: 'belt', required_level: 10 },
    { id: 'cloth_belt', name: 'Cloth Belt', category: 'belt', item_class: 'belt', required_level: 16 },
    { id: 'studded_belt', name: 'Studded Belt', category: 'belt', item_class: 'belt', required_level: 20 },
    { id: 'vanguard_belt', name: 'Vanguard Belt', category: 'belt', item_class: 'belt', required_level: 78 },
    { id: 'crystal_belt', name: 'Crystal Belt', category: 'belt', item_class: 'belt', required_level: 79 },
  ],

  // Rings
  rings: [
    { id: 'iron_ring', name: 'Iron Ring', category: 'ring', item_class: 'ring', required_level: 1 },
    { id: 'coral_ring', name: 'Coral Ring', category: 'ring', item_class: 'ring', required_level: 4 },
    { id: 'paua_ring', name: 'Paua Ring', category: 'ring', item_class: 'ring', required_level: 7 },
    { id: 'gold_ring', name: 'Gold Ring', category: 'ring', item_class: 'ring', required_level: 10 },
    { id: 'sapphire_ring', name: 'Sapphire Ring', category: 'ring', item_class: 'ring', required_level: 15 },
    { id: 'topaz_ring', name: 'Topaz Ring', category: 'ring', item_class: 'ring', required_level: 20 },
    { id: 'ruby_ring', name: 'Ruby Ring', category: 'ring', item_class: 'ring', required_level: 25 },
    { id: 'diamond_ring', name: 'Diamond Ring', category: 'ring', item_class: 'ring', required_level: 30 },
    { id: 'moonstone_ring', name: 'Moonstone Ring', category: 'ring', item_class: 'ring', required_level: 40 },
    { id: 'amethyst_ring', name: 'Amethyst Ring', category: 'ring', item_class: 'ring', required_level: 50 },
    { id: 'prismatic_ring', name: 'Prismatic Ring', category: 'ring', item_class: 'ring', required_level: 60 },
    { id: 'steel_ring', name: 'Steel Ring', category: 'ring', item_class: 'ring', required_level: 80 },
    { id: 'opal_ring', name: 'Opal Ring', category: 'ring', item_class: 'ring', required_level: 80 },
  ],

  // Amulets
  amulets: [
    { id: 'paua_amulet', name: 'Paua Amulet', category: 'amulet', item_class: 'amulet', required_level: 3 },
    { id: 'coral_amulet', name: 'Coral Amulet', category: 'amulet', item_class: 'amulet', required_level: 5 },
    { id: 'amber_amulet', name: 'Amber Amulet', category: 'amulet', item_class: 'amulet', required_level: 7 },
    { id: 'jade_amulet', name: 'Jade Amulet', category: 'amulet', item_class: 'amulet', required_level: 10 },
    { id: 'lapis_amulet', name: 'Lapis Amulet', category: 'amulet', item_class: 'amulet', required_level: 15 },
    { id: 'gold_amulet', name: 'Gold Amulet', category: 'amulet', item_class: 'amulet', required_level: 20 },
    { id: 'agate_amulet', name: 'Agate Amulet', category: 'amulet', item_class: 'amulet', required_level: 25 },
    { id: 'citrine_amulet', name: 'Citrine Amulet', category: 'amulet', item_class: 'amulet', required_level: 30 },
    { id: 'turquoise_amulet', name: 'Turquoise Amulet', category: 'amulet', item_class: 'amulet', required_level: 35 },
    { id: 'onyx_amulet', name: 'Onyx Amulet', category: 'amulet', item_class: 'amulet', required_level: 45 },
    { id: 'marble_amulet', name: 'Marble Amulet', category: 'amulet', item_class: 'amulet', required_level: 74 },
  ],
};

async function populateItemsDatabase() {
  console.log('🚀 Starting database population...\n');

  let totalInserted = 0;
  let totalErrors = 0;

  // Clear existing items first (optional)
  console.log('🗑️ Clearing existing items...');
  const { error: deleteError } = await supabase
    .from('item_bases')
    .delete()
    .neq('id', '');
  
  if (deleteError) {
    console.log('Warning: Could not clear existing items:', deleteError.message);
  }

  // Insert all items
  for (const [category, items] of Object.entries(POE2_ITEMS)) {
    console.log(`\n📦 Inserting ${category}...`);
    
    const { data, error } = await supabase
      .from('item_bases')
      .insert(items)
      .select();

    if (error) {
      console.error(`❌ Error inserting ${category}:`, error.message);
      totalErrors++;
    } else {
      console.log(`✅ Inserted ${data?.length || 0} ${category}`);
      totalInserted += data?.length || 0;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Database population complete!`);
  console.log(`📊 Total items inserted: ${totalInserted}`);
  if (totalErrors > 0) {
    console.log(`⚠️ Errors encountered: ${totalErrors}`);
  }

  // Verify the data
  const { count } = await supabase
    .from('item_bases')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n🔍 Total items in database: ${count}`);
}

populateItemsDatabase().catch(console.error);