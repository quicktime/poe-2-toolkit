-- Simplified Path of Exile 2 Game Data Tables
-- Matches the processed data structure

-- Drop existing tables if they exist
DROP TABLE IF EXISTS base_items CASCADE;
DROP TABLE IF EXISTS unique_items CASCADE;
DROP TABLE IF EXISTS skill_gems CASCADE;
DROP TABLE IF EXISTS passive_skills CASCADE;
DROP TABLE IF EXISTS currency_items CASCADE;
DROP TABLE IF EXISTS ascendancies CASCADE;
DROP TABLE IF EXISTS quest_rewards CASCADE;

-- =====================================================
-- BASE ITEMS
-- =====================================================
CREATE TABLE base_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  category VARCHAR(50),
  base_type VARCHAR(100),
  item_class VARCHAR(100),
  required_level INTEGER DEFAULT 1,
  properties JSONB DEFAULT '{}',
  damage_min INTEGER,
  damage_max INTEGER,
  attack_speed DECIMAL(3,2),
  critical_chance DECIMAL(4,2),
  armour INTEGER,
  evasion INTEGER,
  energy_shield INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- UNIQUE ITEMS
-- =====================================================
CREATE TABLE unique_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  base_item VARCHAR(200),
  category VARCHAR(50),
  required_level INTEGER DEFAULT 1,
  implicit_mods TEXT[],
  explicit_mods TEXT[],
  flavor_text TEXT,
  is_replica BOOLEAN DEFAULT false,
  is_corrupted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SKILL GEMS
-- =====================================================
CREATE TABLE skill_gems (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  gem_type VARCHAR(20) NOT NULL, -- 'active' or 'support'
  tags TEXT[],
  primary_attribute VARCHAR(20),
  required_level INTEGER DEFAULT 1,
  mana_cost INTEGER,
  spirit_cost INTEGER DEFAULT 0,
  cast_time DECIMAL(3,2),
  damage_effectiveness DECIMAL(5,2),
  damage_multiplier DECIMAL(5,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSIVE SKILLS
-- =====================================================
CREATE TABLE passive_skills (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200),
  type VARCHAR(50) DEFAULT 'normal',
  stats TEXT[],
  stat_text TEXT,
  connections INTEGER[],
  group_id INTEGER,
  orbit INTEGER,
  orbit_index INTEGER,
  is_keystone BOOLEAN DEFAULT false,
  is_notable BOOLEAN DEFAULT false,
  is_mastery BOOLEAN DEFAULT false,
  is_jewel_socket BOOLEAN DEFAULT false,
  ascendancy_class VARCHAR(50),
  x DECIMAL(10,2),
  y DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CURRENCY ITEMS
-- =====================================================
CREATE TABLE currency_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  type VARCHAR(50),
  effect TEXT,
  tier VARCHAR(20),
  drop_level INTEGER DEFAULT 1,
  stack_size INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASCENDANCIES
-- =====================================================
CREATE TABLE ascendancies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, class)
);

-- =====================================================
-- QUEST REWARDS
-- =====================================================
CREATE TABLE quest_rewards (
  id SERIAL PRIMARY KEY,
  quest_name VARCHAR(200) NOT NULL,
  act INTEGER DEFAULT 1,
  rewards JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_base_items_category ON base_items(category);
CREATE INDEX idx_base_items_name ON base_items(name);
CREATE INDEX idx_unique_items_name ON unique_items(name);
CREATE INDEX idx_unique_items_base ON unique_items(base_item);
CREATE INDEX idx_skill_gems_type ON skill_gems(gem_type);
CREATE INDEX idx_skill_gems_name ON skill_gems(name);
CREATE INDEX idx_passive_skills_type ON passive_skills(type);
CREATE INDEX idx_passive_skills_name ON passive_skills(name);
CREATE INDEX idx_currency_items_type ON currency_items(type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE base_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE unique_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE passive_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ascendancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_rewards ENABLE ROW LEVEL SECURITY;

-- Public read access for all game data
CREATE POLICY "Public read access" ON base_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON unique_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON skill_gems FOR SELECT USING (true);
CREATE POLICY "Public read access" ON passive_skills FOR SELECT USING (true);
CREATE POLICY "Public read access" ON currency_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ascendancies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quest_rewards FOR SELECT USING (true);

-- Allow inserts with anon key (for data import)
CREATE POLICY "Allow inserts" ON base_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON unique_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON skill_gems FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON passive_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON currency_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON ascendancies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON quest_rewards FOR INSERT WITH CHECK (true);

-- Allow deletes with anon key (for data import)
CREATE POLICY "Allow deletes" ON base_items FOR DELETE USING (true);
CREATE POLICY "Allow deletes" ON unique_items FOR DELETE USING (true);
CREATE POLICY "Allow deletes" ON skill_gems FOR DELETE USING (true);
CREATE POLICY "Allow deletes" ON passive_skills FOR DELETE USING (true);
CREATE POLICY "Allow deletes" ON currency_items FOR DELETE USING (true);
CREATE POLICY "Allow deletes" ON ascendancies FOR DELETE USING (true);
CREATE POLICY "Allow deletes" ON quest_rewards FOR DELETE USING (true);