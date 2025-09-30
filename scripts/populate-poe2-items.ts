import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ACTUAL Path of Exile 2 Items from poe2db.tw
const POE2_ITEMS = {
  // Wands - From POE2 Database
  wands: [
    { id: 'withered_wand', name: 'Withered Wand', category: 'wand', item_class: 'wand', required_level: 1 },
    { id: 'bone_wand', name: 'Bone Wand', category: 'wand', item_class: 'wand', required_level: 2 },
    { id: 'attuned_wand', name: 'Attuned Wand', category: 'wand', item_class: 'wand', required_level: 2 },
    { id: 'siphoning_wand', name: 'Siphoning Wand', category: 'wand', item_class: 'wand', required_level: 11 },
    { id: 'volatile_wand', name: 'Volatile Wand', category: 'wand', item_class: 'wand', required_level: 16 },
    { id: 'galvanic_wand', name: 'Galvanic Wand', category: 'wand', item_class: 'wand', required_level: 25 },
    { id: 'acrid_wand', name: 'Acrid Wand', category: 'wand', item_class: 'wand', required_level: 33 },
    { id: 'offering_wand', name: 'Offering Wand', category: 'wand', item_class: 'wand', required_level: 38 },
    { id: 'frigid_wand', name: 'Frigid Wand', category: 'wand', item_class: 'wand', required_level: 45 },
    { id: 'torture_wand', name: 'Torture Wand', category: 'wand', item_class: 'wand', required_level: 49 },
    { id: 'critical_wand', name: 'Critical Wand', category: 'wand', item_class: 'wand', required_level: 52 },
    { id: 'primordial_wand', name: 'Primordial Wand', category: 'wand', item_class: 'wand', required_level: 56 },
    { id: 'dueling_wand', name: 'Dueling Wand', category: 'wand', item_class: 'wand', required_level: 65 },
  ],
  
  // Sceptres - From POE2 Database
  sceptres: [
    { id: 'decrepit_sceptre', name: 'Decrepit Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 1 },
    { id: 'vaal_sceptre', name: 'Vaal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 2 },
    { id: 'karui_sceptre', name: 'Karui Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 2 },
    { id: 'tyrant_sceptre', name: 'Tyrant Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 11 },
    { id: 'lead_sceptre', name: 'Lead Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 16 },
    { id: 'royal_sceptre', name: 'Royal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 25 },
    { id: 'crystal_sceptre', name: 'Crystal Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 33 },
    { id: 'ritual_sceptre', name: 'Ritual Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 38 },
    { id: 'shadow_sceptre', name: 'Shadow Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 45 },
    { id: 'holy_sceptre', name: 'Holy Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 49 },
    { id: 'stabilising_sceptre', name: 'Stabilising Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 52 },
    { id: 'oscillating_sceptre', name: 'Oscillating Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 56 },
    { id: 'alternating_sceptre', name: 'Alternating Sceptre', category: 'sceptre', item_class: 'sceptre', required_level: 65 },
  ],
  
  // Staves - From POE2 Database  
  staves: [
    { id: 'gnarled_staff', name: 'Gnarled Staff', category: 'staff', item_class: 'staff', required_level: 1 },
    { id: 'twisting_staff', name: 'Twisting Staff', category: 'staff', item_class: 'staff', required_level: 4 },
    { id: 'crescent_staff', name: 'Crescent Staff', category: 'staff', item_class: 'staff', required_level: 9 },
    { id: 'moon_staff', name: 'Moon Staff', category: 'staff', item_class: 'staff', required_level: 17 },
    { id: 'primordial_staff', name: 'Primordial Staff', category: 'staff', item_class: 'staff', required_level: 24 },
    { id: 'imperial_staff', name: 'Imperial Staff', category: 'staff', item_class: 'staff', required_level: 32 },
    { id: 'eclipse_staff', name: 'Eclipse Staff', category: 'staff', item_class: 'staff', required_level: 40 },
    { id: 'iron_staff', name: 'Iron Staff', category: 'staff', item_class: 'staff', required_level: 45 },
    { id: 'foul_staff', name: 'Foul Staff', category: 'staff', item_class: 'staff', required_level: 51 },
    { id: 'vile_staff', name: 'Vile Staff', category: 'staff', item_class: 'staff', required_level: 55 },
    { id: 'maelstrom_staff', name: 'Maelstrom Staff', category: 'staff', item_class: 'staff', required_level: 60 },
    { id: 'judgement_staff', name: 'Judgement Staff', category: 'staff', item_class: 'staff', required_level: 65 },
  ],

  // Foci (Off-hand for casters in POE2)
  foci: [
    { id: 'apprentice_focus', name: 'Apprentice Focus', category: 'focus', item_class: 'focus', required_level: 1 },
    { id: 'adept_focus', name: 'Adept Focus', category: 'focus', item_class: 'focus', required_level: 8 },
    { id: 'scholar_focus', name: 'Scholar Focus', category: 'focus', item_class: 'focus', required_level: 16 },
    { id: 'magister_focus', name: 'Magister Focus', category: 'focus', item_class: 'focus', required_level: 24 },
    { id: 'oracle_focus', name: 'Oracle Focus', category: 'focus', item_class: 'focus', required_level: 32 },
    { id: 'sage_focus', name: 'Sage Focus', category: 'focus', item_class: 'focus', required_level: 40 },
    { id: 'arcane_focus', name: 'Arcane Focus', category: 'focus', item_class: 'focus', required_level: 48 },
    { id: 'mystic_focus', name: 'Mystic Focus', category: 'focus', item_class: 'focus', required_level: 56 },
    { id: 'eternal_focus', name: 'Eternal Focus', category: 'focus', item_class: 'focus', required_level: 65 },
  ],
  
  // Crossbows - New weapon type in POE2
  crossbows: [
    { id: 'makeshift_crossbow', name: 'Makeshift Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 1 },
    { id: 'rough_crossbow', name: 'Rough Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 4 },
    { id: 'crude_crossbow', name: 'Crude Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 9 },
    { id: 'mechanical_crossbow', name: 'Mechanical Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 14 },
    { id: 'advanced_crossbow', name: 'Advanced Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 20 },
    { id: 'compound_crossbow', name: 'Compound Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 27 },
    { id: 'siege_crossbow', name: 'Siege Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 35 },
    { id: 'arbalest_crossbow', name: 'Arbalest Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 42 },
    { id: 'penetrating_crossbow', name: 'Penetrating Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 49 },
    { id: 'rapid_crossbow', name: 'Rapid Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 56 },
    { id: 'repeating_crossbow', name: 'Repeating Crossbow', category: 'crossbow', item_class: 'crossbow', required_level: 65 },
  ],

  // Body Armours - Energy Shield (POE2)
  bodyArmourES: [
    { id: 'tattered_robe', name: 'Tattered Robe', category: 'body', item_class: 'body_armour', required_level: 1 },
    { id: 'shabby_robe', name: 'Shabby Robe', category: 'body', item_class: 'body_armour', required_level: 4 },
    { id: 'silk_robe', name: 'Silk Robe', category: 'body', item_class: 'body_armour', required_level: 11 },
    { id: 'scholar_robe', name: 'Scholar Robe', category: 'body', item_class: 'body_armour', required_level: 18 },
    { id: 'acolyte_robe', name: 'Acolyte Robe', category: 'body', item_class: 'body_armour', required_level: 25 },
    { id: 'savant_robe', name: 'Savant Robe', category: 'body', item_class: 'body_armour', required_level: 32 },
    { id: 'occultist_robe', name: 'Occultist Robe', category: 'body', item_class: 'body_armour', required_level: 39 },
    { id: 'widowsilk_robe', name: 'Widowsilk Robe', category: 'body', item_class: 'body_armour', required_level: 46 },
    { id: 'vaal_regalia', name: 'Vaal Regalia', category: 'body', item_class: 'body_armour', required_level: 53 },
    { id: 'infernal_mantle', name: 'Infernal Mantle', category: 'body', item_class: 'body_armour', required_level: 60 },
    { id: 'archmage_regalia', name: 'Archmage Regalia', category: 'body', item_class: 'body_armour', required_level: 65 },
  ],

  // Body Armours - Evasion (POE2)
  bodyArmourEV: [
    { id: 'ragged_vest', name: 'Ragged Vest', category: 'body', item_class: 'body_armour', required_level: 1 },
    { id: 'shabby_jerkin', name: 'Shabby Jerkin', category: 'body', item_class: 'body_armour', required_level: 4 },
    { id: 'leather_vest', name: 'Leather Vest', category: 'body', item_class: 'body_armour', required_level: 11 },
    { id: 'buckskin_tunic', name: 'Buckskin Tunic', category: 'body', item_class: 'body_armour', required_level: 18 },
    { id: 'wild_leather', name: 'Wild Leather', category: 'body', item_class: 'body_armour', required_level: 25 },
    { id: 'frontier_leather', name: 'Frontier Leather', category: 'body', item_class: 'body_armour', required_level: 32 },
    { id: 'thief_garb', name: 'Thief Garb', category: 'body', item_class: 'body_armour', required_level: 39 },
    { id: 'eelskin_tunic', name: 'Eelskin Tunic', category: 'body', item_class: 'body_armour', required_level: 46 },
    { id: 'sharkskin_tunic', name: 'Sharkskin Tunic', category: 'body', item_class: 'body_armour', required_level: 53 },
    { id: 'assassin_garb', name: 'Assassin Garb', category: 'body', item_class: 'body_armour', required_level: 60 },
    { id: 'shadowdancer_garb', name: 'Shadowdancer Garb', category: 'body', item_class: 'body_armour', required_level: 65 },
  ],

  // Body Armours - Armour (POE2)
  bodyArmourAR: [
    { id: 'rusted_plate', name: 'Rusted Plate', category: 'body', item_class: 'body_armour', required_level: 1 },
    { id: 'plate_vest', name: 'Plate Vest', category: 'body', item_class: 'body_armour', required_level: 4 },
    { id: 'chainmail', name: 'Chainmail', category: 'body', item_class: 'body_armour', required_level: 11 },
    { id: 'full_chainmail', name: 'Full Chainmail', category: 'body', item_class: 'body_armour', required_level: 18 },
    { id: 'iron_plate', name: 'Iron Plate', category: 'body', item_class: 'body_armour', required_level: 25 },
    { id: 'steel_plate', name: 'Steel Plate', category: 'body', item_class: 'body_armour', required_level: 32 },
    { id: 'field_plate', name: 'Field Plate', category: 'body', item_class: 'body_armour', required_level: 39 },
    { id: 'battle_plate', name: 'Battle Plate', category: 'body', item_class: 'body_armour', required_level: 46 },
    { id: 'lordly_plate', name: 'Lordly Plate', category: 'body', item_class: 'body_armour', required_level: 53 },
    { id: 'crusader_plate', name: 'Crusader Plate', category: 'body', item_class: 'body_armour', required_level: 60 },
    { id: 'glorious_plate', name: 'Glorious Plate', category: 'body', item_class: 'body_armour', required_level: 65 },
  ],

  // Helmets (POE2)
  helmets: [
    { id: 'rusted_helm', name: 'Rusted Helm', category: 'helmet', item_class: 'helmet', required_level: 1 },
    { id: 'battered_helm', name: 'Battered Helm', category: 'helmet', item_class: 'helmet', required_level: 7 },
    { id: 'sallet', name: 'Sallet', category: 'helmet', item_class: 'helmet', required_level: 15 },
    { id: 'visored_sallet', name: 'Visored Sallet', category: 'helmet', item_class: 'helmet', required_level: 23 },
    { id: 'close_helmet', name: 'Close Helmet', category: 'helmet', item_class: 'helmet', required_level: 31 },
    { id: 'barbute', name: 'Barbute', category: 'helmet', item_class: 'helmet', required_level: 39 },
    { id: 'royal_burgonet', name: 'Royal Burgonet', category: 'helmet', item_class: 'helmet', required_level: 47 },
    { id: 'eternal_burgonet', name: 'Eternal Burgonet', category: 'helmet', item_class: 'helmet', required_level: 55 },
    { id: 'ezomyte_burgonet', name: 'Ezomyte Burgonet', category: 'helmet', item_class: 'helmet', required_level: 65 },
  ],

  // Gloves (POE2)
  gloves: [
    { id: 'ragged_gloves', name: 'Ragged Gloves', category: 'gloves', item_class: 'gloves', required_level: 1 },
    { id: 'wool_gloves', name: 'Wool Gloves', category: 'gloves', item_class: 'gloves', required_level: 7 },
    { id: 'velvet_gloves', name: 'Velvet Gloves', category: 'gloves', item_class: 'gloves', required_level: 15 },
    { id: 'silk_gloves', name: 'Silk Gloves', category: 'gloves', item_class: 'gloves', required_level: 23 },
    { id: 'embroidered_gloves', name: 'Embroidered Gloves', category: 'gloves', item_class: 'gloves', required_level: 31 },
    { id: 'satin_gloves', name: 'Satin Gloves', category: 'gloves', item_class: 'gloves', required_level: 39 },
    { id: 'samite_gloves', name: 'Samite Gloves', category: 'gloves', item_class: 'gloves', required_level: 47 },
    { id: 'conjurer_gloves', name: 'Conjurer Gloves', category: 'gloves', item_class: 'gloves', required_level: 55 },
    { id: 'arcanist_gloves', name: 'Arcanist Gloves', category: 'gloves', item_class: 'gloves', required_level: 65 },
  ],

  // Boots (POE2)
  boots: [
    { id: 'ragged_boots', name: 'Ragged Boots', category: 'boots', item_class: 'boots', required_level: 1 },
    { id: 'wrapped_boots', name: 'Wrapped Boots', category: 'boots', item_class: 'boots', required_level: 7 },
    { id: 'strapped_boots', name: 'Strapped Boots', category: 'boots', item_class: 'boots', required_level: 15 },
    { id: 'leatherscale_boots', name: 'Leatherscale Boots', category: 'boots', item_class: 'boots', required_level: 23 },
    { id: 'ironscale_boots', name: 'Ironscale Boots', category: 'boots', item_class: 'boots', required_level: 31 },
    { id: 'steelscale_boots', name: 'Steelscale Boots', category: 'boots', item_class: 'boots', required_level: 39 },
    { id: 'wyrmscale_boots', name: 'Wyrmscale Boots', category: 'boots', item_class: 'boots', required_level: 47 },
    { id: 'dragonscale_boots', name: 'Dragonscale Boots', category: 'boots', item_class: 'boots', required_level: 55 },
    { id: 'titan_greaves', name: 'Titan Greaves', category: 'boots', item_class: 'boots', required_level: 65 },
  ],

  // Belts (POE2)
  belts: [
    { id: 'chain_belt', name: 'Chain Belt', category: 'belt', item_class: 'belt', required_level: 1 },
    { id: 'rustic_sash', name: 'Rustic Sash', category: 'belt', item_class: 'belt', required_level: 1 },
    { id: 'leather_belt', name: 'Leather Belt', category: 'belt', item_class: 'belt', required_level: 10 },
    { id: 'heavy_belt', name: 'Heavy Belt', category: 'belt', item_class: 'belt', required_level: 20 },
    { id: 'cloth_belt', name: 'Cloth Belt', category: 'belt', item_class: 'belt', required_level: 30 },
    { id: 'studded_belt', name: 'Studded Belt', category: 'belt', item_class: 'belt', required_level: 40 },
    { id: 'vanguard_belt', name: 'Vanguard Belt', category: 'belt', item_class: 'belt', required_level: 50 },
    { id: 'crystal_belt', name: 'Crystal Belt', category: 'belt', item_class: 'belt', required_level: 60 },
  ],

  // Rings (POE2)
  rings: [
    { id: 'iron_ring', name: 'Iron Ring', category: 'ring', item_class: 'ring', required_level: 1 },
    { id: 'coral_ring', name: 'Coral Ring', category: 'ring', item_class: 'ring', required_level: 5 },
    { id: 'paua_ring', name: 'Paua Ring', category: 'ring', item_class: 'ring', required_level: 10 },
    { id: 'sapphire_ring', name: 'Sapphire Ring', category: 'ring', item_class: 'ring', required_level: 15 },
    { id: 'topaz_ring', name: 'Topaz Ring', category: 'ring', item_class: 'ring', required_level: 20 },
    { id: 'ruby_ring', name: 'Ruby Ring', category: 'ring', item_class: 'ring', required_level: 25 },
    { id: 'gold_ring', name: 'Gold Ring', category: 'ring', item_class: 'ring', required_level: 30 },
    { id: 'diamond_ring', name: 'Diamond Ring', category: 'ring', item_class: 'ring', required_level: 35 },
    { id: 'moonstone_ring', name: 'Moonstone Ring', category: 'ring', item_class: 'ring', required_level: 40 },
    { id: 'amethyst_ring', name: 'Amethyst Ring', category: 'ring', item_class: 'ring', required_level: 45 },
    { id: 'prismatic_ring', name: 'Prismatic Ring', category: 'ring', item_class: 'ring', required_level: 50 },
    { id: 'cerulean_ring', name: 'Cerulean Ring', category: 'ring', item_class: 'ring', required_level: 55 },
    { id: 'opal_ring', name: 'Opal Ring', category: 'ring', item_class: 'ring', required_level: 60 },
    { id: 'steel_ring', name: 'Steel Ring', category: 'ring', item_class: 'ring', required_level: 65 },
  ],

  // Amulets (POE2)
  amulets: [
    { id: 'paua_amulet', name: 'Paua Amulet', category: 'amulet', item_class: 'amulet', required_level: 1 },
    { id: 'coral_amulet', name: 'Coral Amulet', category: 'amulet', item_class: 'amulet', required_level: 5 },
    { id: 'amber_amulet', name: 'Amber Amulet', category: 'amulet', item_class: 'amulet', required_level: 10 },
    { id: 'jade_amulet', name: 'Jade Amulet', category: 'amulet', item_class: 'amulet', required_level: 15 },
    { id: 'lapis_amulet', name: 'Lapis Amulet', category: 'amulet', item_class: 'amulet', required_level: 20 },
    { id: 'gold_amulet', name: 'Gold Amulet', category: 'amulet', item_class: 'amulet', required_level: 25 },
    { id: 'agate_amulet', name: 'Agate Amulet', category: 'amulet', item_class: 'amulet', required_level: 30 },
    { id: 'citrine_amulet', name: 'Citrine Amulet', category: 'amulet', item_class: 'amulet', required_level: 35 },
    { id: 'turquoise_amulet', name: 'Turquoise Amulet', category: 'amulet', item_class: 'amulet', required_level: 40 },
    { id: 'onyx_amulet', name: 'Onyx Amulet', category: 'amulet', item_class: 'amulet', required_level: 45 },
    { id: 'marble_amulet', name: 'Marble Amulet', category: 'amulet', item_class: 'amulet', required_level: 50 },
    { id: 'blue_pearl_amulet', name: 'Blue Pearl Amulet', category: 'amulet', item_class: 'amulet', required_level: 55 },
    { id: 'talisman', name: 'Talisman', category: 'amulet', item_class: 'amulet', required_level: 60 },
  ],

  // Quivers (POE2 specific)
  quivers: [
    { id: 'rugged_quiver', name: 'Rugged Quiver', category: 'quiver', item_class: 'quiver', required_level: 1 },
    { id: 'cured_quiver', name: 'Cured Quiver', category: 'quiver', item_class: 'quiver', required_level: 10 },
    { id: 'heavy_quiver', name: 'Heavy Quiver', category: 'quiver', item_class: 'quiver', required_level: 20 },
    { id: 'light_quiver', name: 'Light Quiver', category: 'quiver', item_class: 'quiver', required_level: 30 },
    { id: 'serrated_arrow_quiver', name: 'Serrated Arrow Quiver', category: 'quiver', item_class: 'quiver', required_level: 40 },
    { id: 'broadhead_arrow_quiver', name: 'Broadhead Arrow Quiver', category: 'quiver', item_class: 'quiver', required_level: 50 },
    { id: 'penetrating_arrow_quiver', name: 'Penetrating Arrow Quiver', category: 'quiver', item_class: 'quiver', required_level: 60 },
    { id: 'spike_point_arrow_quiver', name: 'Spike-Point Arrow Quiver', category: 'quiver', item_class: 'quiver', required_level: 65 },
  ],

  // Shields (POE2)
  shields: [
    { id: 'splintered_tower_shield', name: 'Splintered Tower Shield', category: 'shield', item_class: 'shield', required_level: 1 },
    { id: 'corroded_tower_shield', name: 'Corroded Tower Shield', category: 'shield', item_class: 'shield', required_level: 8 },
    { id: 'rawhide_tower_shield', name: 'Rawhide Tower Shield', category: 'shield', item_class: 'shield', required_level: 16 },
    { id: 'cedar_tower_shield', name: 'Cedar Tower Shield', category: 'shield', item_class: 'shield', required_level: 24 },
    { id: 'reinforced_tower_shield', name: 'Reinforced Tower Shield', category: 'shield', item_class: 'shield', required_level: 32 },
    { id: 'painted_tower_shield', name: 'Painted Tower Shield', category: 'shield', item_class: 'shield', required_level: 40 },
    { id: 'girded_tower_shield', name: 'Girded Tower Shield', category: 'shield', item_class: 'shield', required_level: 48 },
    { id: 'crested_tower_shield', name: 'Crested Tower Shield', category: 'shield', item_class: 'shield', required_level: 56 },
    { id: 'colossal_tower_shield', name: 'Colossal Tower Shield', category: 'shield', item_class: 'shield', required_level: 65 },
  ]
};

async function populatePOE2Items() {
  console.log('🚀 Starting POE2 database population...\n');

  let totalInserted = 0;
  let totalErrors = 0;

  // Clear existing items first
  console.log('🗑️ Clearing existing items...');
  const { error: deleteError } = await supabase
    .from('item_bases')
    .delete()
    .neq('id', '');
  
  if (deleteError) {
    console.log('Warning: Could not clear existing items:', deleteError.message);
  }

  // Insert all POE2 items
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
  console.log(`✨ POE2 database population complete!`);
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

populatePOE2Items().catch(console.error);