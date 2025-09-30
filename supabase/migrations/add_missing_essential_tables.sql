-- =====================================================
-- ADD MISSING ESSENTIAL TABLES FOR CRAFTING
-- Run this if some tables already exist
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CRAFTING MODS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS crafting_mods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('prefix', 'suffix', 'implicit', 'corrupted')),
  tier INTEGER,
  required_level INTEGER,
  tags TEXT[],
  weight INTEGER,
  min_value REAL,
  max_value REAL,
  mod_group TEXT,
  item_types TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CURRENCY RATES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS currency_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value_in_exalted REAL NOT NULL,
  value_in_divine REAL,
  league TEXT DEFAULT 'Standard',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ITEM BASES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS item_bases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  item_class TEXT,
  required_level INTEGER DEFAULT 1,
  properties JSONB DEFAULT '{}',
  implicit_mods TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MARKET PRICES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_type TEXT,
  price_in_exalted REAL,
  price_in_divine REAL,
  price_in_chaos REAL,
  league TEXT DEFAULT 'Standard',
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT -- 'poe2scout', 'manual', etc
);

-- =====================================================
-- INDEXES (safe to create if not exists)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_crafting_mods_type ON crafting_mods(type);
CREATE INDEX IF NOT EXISTS idx_crafting_mods_weight ON crafting_mods(weight);
CREATE INDEX IF NOT EXISTS idx_crafting_mods_item_types ON crafting_mods USING GIN(item_types);
CREATE INDEX IF NOT EXISTS idx_currency_rates_league ON currency_rates(league);
CREATE INDEX IF NOT EXISTS idx_market_prices_item ON market_prices(item_name, league);
CREATE INDEX IF NOT EXISTS idx_market_prices_time ON market_prices(listed_at DESC);

-- =====================================================
-- ENABLE RLS (safe to run multiple times)
-- =====================================================
ALTER TABLE crafting_mods ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (drop and recreate to be safe)
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON crafting_mods;
DROP POLICY IF EXISTS "Public read access" ON currency_rates;
DROP POLICY IF EXISTS "Public read access" ON item_bases;
DROP POLICY IF EXISTS "Public read access" ON market_prices;
DROP POLICY IF EXISTS "Allow inserts" ON crafting_sessions;

-- Create policies
CREATE POLICY "Public read access" ON crafting_mods FOR SELECT USING (true);
CREATE POLICY "Public read access" ON currency_rates FOR SELECT USING (true);
CREATE POLICY "Public read access" ON item_bases FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_prices FOR SELECT USING (true);

-- Allow anonymous inserts for market data collection
CREATE POLICY "Allow anon inserts" ON market_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon inserts" ON currency_rates FOR INSERT WITH CHECK (true);

-- =====================================================
-- INSERT SAMPLE DATA (UPSERT to avoid duplicates)
-- =====================================================

-- Currency rates (POE2 current rates)
INSERT INTO currency_rates (id, name, value_in_exalted, value_in_divine, league)
VALUES 
  ('divine', 'Divine Orb', 380, 1, 'Standard'),
  ('chaos', 'Chaos Orb', 12, 0.0316, 'Standard'),
  ('omen', 'Homogenous Omen', 190, 0.5, 'Standard'),
  ('annul', 'Annulment Orb', 45, 0.118, 'Standard'),
  ('regal', 'Regal Orb', 8, 0.021, 'Standard'),
  ('alchemy', 'Orb of Alchemy', 3, 0.0079, 'Standard'),
  ('exalted', 'Exalted Orb', 1, 0.0026, 'Standard')
ON CONFLICT (id) DO UPDATE SET
  value_in_exalted = EXCLUDED.value_in_exalted,
  value_in_divine = EXCLUDED.value_in_divine,
  last_updated = NOW();

-- Sample wand mods
INSERT INTO crafting_mods (id, name, type, tier, weight, min_value, max_value, item_types)
VALUES
  ('spell_plus1', '+1 to Level of all Spell Skill Gems', 'prefix', 1, 25, 1, 1, ARRAY['wand', 'sceptre']),
  ('gain_chaos', 'Gain 10% of Elemental Damage as Extra Chaos Damage', 'prefix', 1, 10, 8, 12, ARRAY['wand']),
  ('spell_damage', 'Increased Spell Damage', 'prefix', 2, 100, 50, 109, ARRAY['wand', 'sceptre']),
  ('cast_speed', 'Increased Cast Speed', 'suffix', 2, 200, 10, 20, ARRAY['wand', 'sceptre']),
  ('spell_crit', 'Increased Critical Strike Chance for Spells', 'suffix', 2, 150, 30, 80, ARRAY['wand', 'sceptre']),
  ('mana_regen', 'Increased Mana Regeneration Rate', 'suffix', 3, 250, 20, 60, ARRAY['wand', 'sceptre', 'staff']),
  ('fire_damage', 'Increased Fire Damage', 'prefix', 2, 120, 20, 40, ARRAY['wand', 'sceptre', 'staff']),
  ('cold_damage', 'Increased Cold Damage', 'prefix', 2, 120, 20, 40, ARRAY['wand', 'sceptre', 'staff']),
  ('lightning_damage', 'Increased Lightning Damage', 'prefix', 2, 120, 20, 40, ARRAY['wand', 'sceptre', 'staff'])
ON CONFLICT (id) DO NOTHING;

-- Sample item bases
INSERT INTO item_bases (id, name, category, item_class, required_level)
VALUES
  ('wand_t1', 'Imbued Wand', 'weapon', 'wand', 59),
  ('wand_t2', 'Prophecy Wand', 'weapon', 'wand', 68),
  ('wand_t3', 'Profane Wand', 'weapon', 'wand', 70),
  ('sceptre_t1', 'Void Sceptre', 'weapon', 'sceptre', 68),
  ('sceptre_t2', 'Sambar Sceptre', 'weapon', 'sceptre', 70)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS CHECK
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Essential crafting tables have been created/updated successfully!';
END $$;