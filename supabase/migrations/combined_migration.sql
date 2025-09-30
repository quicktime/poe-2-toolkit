-- =====================================================
-- COMBINED POE2 TOOLKIT DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ESSENTIAL TABLES FOR CRAFTING SYSTEM
-- =====================================================

-- Crafting Mods Table
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

-- Currency Rates Table
CREATE TABLE IF NOT EXISTS currency_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value_in_exalted REAL NOT NULL,
  value_in_divine REAL,
  league TEXT DEFAULT 'Standard',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item Bases Table
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

-- Market Prices Table
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

-- Crafting Sessions Table (for tracking user crafts)
CREATE TABLE IF NOT EXISTS crafting_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT,
  item_base TEXT NOT NULL,
  target_mods TEXT[],
  currency_used JSONB DEFAULT '{}',
  total_cost_exalted REAL,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_crafting_mods_type ON crafting_mods(type);
CREATE INDEX IF NOT EXISTS idx_crafting_mods_weight ON crafting_mods(weight);
CREATE INDEX IF NOT EXISTS idx_crafting_mods_item_types ON crafting_mods USING GIN(item_types);
CREATE INDEX IF NOT EXISTS idx_currency_rates_league ON currency_rates(league);
CREATE INDEX IF NOT EXISTS idx_market_prices_item ON market_prices(item_name, league);
CREATE INDEX IF NOT EXISTS idx_market_prices_time ON market_prices(listed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE crafting_mods ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crafting_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for all game data
CREATE POLICY "Public read access" ON crafting_mods FOR SELECT USING (true);
CREATE POLICY "Public read access" ON currency_rates FOR SELECT USING (true);
CREATE POLICY "Public read access" ON item_bases FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_prices FOR SELECT USING (true);
CREATE POLICY "Public read access" ON crafting_sessions FOR SELECT USING (true);

-- Allow inserts for crafting sessions (anonymous users can track their crafts)
CREATE POLICY "Allow inserts" ON crafting_sessions FOR INSERT WITH CHECK (true);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample currency rates (POE2 Patch 0.3)
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

-- Insert sample wand mods
INSERT INTO crafting_mods (id, name, type, tier, weight, min_value, max_value, item_types)
VALUES
  ('spell_plus1', '+1 to Level of all Spell Skill Gems', 'prefix', 1, 25, 1, 1, ARRAY['wand', 'sceptre']),
  ('gain_chaos', 'Gain 10% of Elemental Damage as Extra Chaos Damage', 'prefix', 1, 10, 8, 12, ARRAY['wand']),
  ('spell_damage', 'Increased Spell Damage', 'prefix', 2, 100, 50, 109, ARRAY['wand', 'sceptre']),
  ('cast_speed', 'Increased Cast Speed', 'suffix', 2, 200, 10, 20, ARRAY['wand', 'sceptre']),
  ('spell_crit', 'Increased Critical Strike Chance for Spells', 'suffix', 2, 150, 30, 80, ARRAY['wand', 'sceptre'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample item bases
INSERT INTO item_bases (id, name, category, item_class, required_level)
VALUES
  ('wand_t1', 'Imbued Wand', 'weapon', 'wand', 59),
  ('wand_t2', 'Prophecy Wand', 'weapon', 'wand', 68),
  ('sceptre_t1', 'Void Sceptre', 'weapon', 'sceptre', 68),
  ('helmet_t1', 'Hubris Circlet', 'armour', 'helmet', 69),
  ('body_t1', 'Vaal Regalia', 'armour', 'body', 68)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate crafting cost
CREATE OR REPLACE FUNCTION calculate_crafting_cost(
  currency_used JSONB,
  league TEXT DEFAULT 'Standard'
)
RETURNS REAL AS $$
DECLARE
  total_cost REAL := 0;
  currency_item RECORD;
  rate REAL;
BEGIN
  FOR currency_item IN SELECT * FROM jsonb_each(currency_used)
  LOOP
    SELECT value_in_exalted INTO rate 
    FROM currency_rates 
    WHERE id = currency_item.key 
      AND currency_rates.league = calculate_crafting_cost.league;
    
    IF rate IS NOT NULL THEN
      total_cost := total_cost + (rate * (currency_item.value)::REAL);
    END IF;
  END LOOP;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR EASIER QUERYING
-- =====================================================

-- View for current market values
CREATE OR REPLACE VIEW current_market_values AS
SELECT DISTINCT ON (item_name, league)
  item_name,
  item_type,
  price_in_exalted,
  price_in_divine,
  league,
  listed_at
FROM market_prices
ORDER BY item_name, league, listed_at DESC;

-- View for mod weights by item type
CREATE OR REPLACE VIEW mod_weights_by_item AS
SELECT 
  m.name as mod_name,
  m.type as mod_type,
  m.weight,
  m.tier,
  unnest(m.item_types) as item_type
FROM crafting_mods m;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If you see this comment, the migration completed successfully!
-- Your database is now ready for the POE2 Toolkit crafting system.