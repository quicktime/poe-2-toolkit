-- Direct SQL import for Supabase
-- Run this in the Supabase SQL editor after creating tables

-- Example: Import some base items
INSERT INTO base_items (name, category, base_type, item_class, damage_min, damage_max, attack_speed, critical_chance) VALUES
('Rusted Sword', 'weapon', 'sword', 'sword', 6, 11, 1.45, 5),
('Copper Kris', 'weapon', 'dagger', 'dagger', 7, 28, 1.2, 6.5),
('Crude Bow', 'weapon', 'bow', 'bow', 5, 13, 1.4, 5),
('Driftwood Club', 'weapon', 'mace', 'mace', 8, 12, 1.25, 5),
('Driftwood Wand', 'weapon', 'wand', 'wand', 4, 12, 1.4, 7),
('Rusted Hatchet', 'weapon', 'axe', 'axe', 7, 10, 1.5, 5),
('Gnarled Branch', 'weapon', 'staff', 'staff', 9, 27, 1.15, 6),
('Plate Vest', 'armour', 'chest', 'body', NULL, NULL, NULL, NULL),
('Shabby Jerkin', 'armour', 'chest', 'body', NULL, NULL, NULL, NULL),
('Simple Robe', 'armour', 'chest', 'body', NULL, NULL, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- Example: Import currency items
INSERT INTO currency_items (name, type, effect, tier, drop_level) VALUES
('Orb of Transmutation', 'orb', 'Upgrades a normal item to a magic item', 'common', 1),
('Orb of Augmentation', 'orb', 'Adds a new modifier to a magic item', 'common', 1),
('Orb of Alchemy', 'orb', 'Upgrades a normal item to a rare item', 'uncommon', 2),
('Chaos Orb', 'orb', 'Rerolls all modifiers on a rare item', 'rare', 12),
('Exalted Orb', 'orb', 'Adds a new modifier to a rare item', 'very_rare', 35),
('Divine Orb', 'orb', 'Rerolls the numeric values of all modifiers on an item', 'very_rare', 35)
ON CONFLICT (name) DO NOTHING;

-- Example: Import skill gems
INSERT INTO skill_gems (name, gem_type, tags, spirit_cost, required_level) VALUES
('Fireball', 'active', ARRAY['spell', 'fire', 'projectile'], 0, 1),
('Freezing Pulse', 'active', ARRAY['spell', 'cold', 'projectile'], 0, 1),
('Lightning Strike', 'active', ARRAY['attack', 'lightning', 'projectile'], 0, 1),
('Raise Zombie', 'active', ARRAY['spell', 'minion'], 40, 1),
('Summon Skeletons', 'active', ARRAY['spell', 'minion'], 30, 1),
('Elemental Focus', 'support', ARRAY['elemental', 'damage'], 30, 1),
('Controlled Destruction', 'support', ARRAY['spell', 'damage'], 30, 1),
('Brutality', 'support', ARRAY['physical', 'damage'], 30, 1),
('Spell Echo', 'support', ARRAY['spell', 'cast_speed'], 40, 1),
('Multistrike', 'support', ARRAY['attack', 'melee'], 40, 1),
('Chain', 'support', ARRAY['projectile', 'chaining'], 35, 1),
('Fortify', 'support', ARRAY['melee', 'defense'], 20, 1),
('Life Leech', 'support', ARRAY['attack', 'life'], 15, 1)
ON CONFLICT (name) DO NOTHING;

-- Example: Import ascendancies
INSERT INTO ascendancies (name, class, description) VALUES
('Titan', 'Warrior', 'Titan ascendancy for Warrior'),
('Warbringer', 'Warrior', 'Warbringer ascendancy for Warrior'),
('Deadeye', 'Ranger', 'Deadeye ascendancy for Ranger'),
('Pathfinder', 'Ranger', 'Pathfinder ascendancy for Ranger'),
('Blood Mage', 'Witch', 'Blood Mage ascendancy for Witch'),
('Infernalist', 'Witch', 'Infernalist ascendancy for Witch'),
('Invoker', 'Monk', 'Invoker ascendancy for Monk'),
('Acolyte of Chayula', 'Monk', 'Acolyte of Chayula ascendancy for Monk'),
('Witchhunter', 'Mercenary', 'Witchhunter ascendancy for Mercenary'),
('Gemling Legionnaire', 'Mercenary', 'Gemling Legionnaire ascendancy for Mercenary'),
('Stormweaver', 'Sorceress', 'Stormweaver ascendancy for Sorceress'),
('Chronomancer', 'Sorceress', 'Chronomancer ascendancy for Sorceress')
ON CONFLICT (name, class) DO NOTHING;

-- Verify the import
SELECT 'Base Items:' as table_name, COUNT(*) as count FROM base_items
UNION ALL
SELECT 'Unique Items:', COUNT(*) FROM unique_items
UNION ALL
SELECT 'Skill Gems:', COUNT(*) FROM skill_gems
UNION ALL
SELECT 'Currency Items:', COUNT(*) FROM currency_items
UNION ALL
SELECT 'Ascendancies:', COUNT(*) FROM ascendancies
UNION ALL
SELECT 'Passive Skills:', COUNT(*) FROM passive_skills;