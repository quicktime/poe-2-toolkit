-- Path of Exile 2 Game Data Schema (v0.3)
-- This migration creates tables for storing PoE 2 game data

-- =====================================================
-- ITEMS SCHEMA
-- =====================================================

-- Item categories and types
CREATE TABLE IF NOT EXISTS item_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  item_class VARCHAR(50) NOT NULL, -- weapon, armor, jewelry, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Base item types (e.g., "Rustic Sash", "Leather Belt")
CREATE TABLE IF NOT EXISTS base_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  category_id UUID REFERENCES item_categories(id),
  item_level INTEGER NOT NULL DEFAULT 1,

  -- Requirements
  req_level INTEGER,
  req_str INTEGER,
  req_dex INTEGER,
  req_int INTEGER,

  -- Base properties
  properties JSONB NOT NULL DEFAULT '{}', -- armor, evasion, energy shield, etc
  implicit_mods TEXT[], -- implicit modifiers

  -- Item specifics
  inventory_width INTEGER NOT NULL DEFAULT 1,
  inventory_height INTEGER NOT NULL DEFAULT 1,
  drop_level INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  patch_version VARCHAR(20) NOT NULL DEFAULT '0.3',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique items
CREATE TABLE IF NOT EXISTS unique_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  base_item_id UUID REFERENCES base_items(id),

  -- Unique properties
  flavor_text TEXT,
  explicit_mods TEXT[] NOT NULL,

  -- Requirements (can override base)
  req_level INTEGER,

  -- Stats
  properties JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  is_drop_enabled BOOLEAN DEFAULT true,
  is_legacy BOOLEAN DEFAULT false,
  patch_version VARCHAR(20) NOT NULL DEFAULT '0.3',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SKILL GEMS SCHEMA
-- =====================================================

-- Skill gem categories
CREATE TABLE IF NOT EXISTS skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL, -- red, green, blue, white
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill gems data
CREATE TABLE IF NOT EXISTS skill_gems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  category_id UUID REFERENCES skill_categories(id),

  -- Gem properties
  gem_tags TEXT[] NOT NULL, -- [spell, aoe, fire, etc]
  max_level INTEGER NOT NULL DEFAULT 20,
  quality_bonus TEXT, -- what quality provides

  -- Requirements per level (array index = gem level - 1)
  level_requirements JSONB NOT NULL DEFAULT '[]', -- [{level: 1, str: 0, dex: 0, int: 16}, ...]

  -- Damage and stats per level
  level_stats JSONB NOT NULL DEFAULT '[]', -- per-level stats

  -- Spirit cost (v0.3)
  spirit_cost_base INTEGER,
  spirit_cost_per_level DECIMAL(5,2),

  -- Damage effectiveness
  damage_effectiveness INTEGER DEFAULT 100,

  -- Metadata
  is_support BOOLEAN DEFAULT false,
  is_vaal BOOLEAN DEFAULT false,
  patch_version VARCHAR(20) NOT NULL DEFAULT '0.3',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support gem specific data
CREATE TABLE IF NOT EXISTS support_gems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_gem_id UUID REFERENCES skill_gems(id) UNIQUE,

  -- Support properties
  support_tags TEXT[] NOT NULL, -- what it can support
  excluded_tags TEXT[], -- what it cannot support

  -- Cost multipliers
  mana_multiplier INTEGER DEFAULT 100,
  spirit_multiplier INTEGER DEFAULT 100,

  -- Per-level bonuses
  level_bonuses JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASSIVE TREE SCHEMA
-- =====================================================

-- Passive tree versions
CREATE TABLE IF NOT EXISTS passive_tree_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patch_version VARCHAR(20) NOT NULL UNIQUE,
  tree_data JSONB NOT NULL, -- full tree structure
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notable passives for quick lookup
CREATE TABLE IF NOT EXISTS notable_passives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_version_id UUID REFERENCES passive_tree_versions(id),
  node_id INTEGER NOT NULL,
  name VARCHAR(200) NOT NULL,
  stats TEXT[] NOT NULL,
  is_keystone BOOLEAN DEFAULT false,
  is_notable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tree_version_id, node_id)
);

-- =====================================================
-- CRAFTING SCHEMA
-- =====================================================

-- Mod pools for crafting
CREATE TABLE IF NOT EXISTS item_mods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mod_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  mod_type VARCHAR(20) NOT NULL, -- prefix, suffix
  mod_group VARCHAR(100) NOT NULL, -- for blocking

  -- What items can have this mod
  required_level INTEGER NOT NULL DEFAULT 1,
  item_classes TEXT[] NOT NULL, -- [weapon, armor, etc]
  tags_required TEXT[], -- item must have these tags
  tags_forbidden TEXT[], -- item cannot have these tags

  -- Mod tiers (T1, T2, etc)
  tiers JSONB NOT NULL DEFAULT '[]', -- [{tier: 1, level: 84, values: [35, 40]}, ...]

  -- Weight for rolling
  spawn_weight INTEGER NOT NULL DEFAULT 1000,

  -- Metadata
  is_essence_only BOOLEAN DEFAULT false,
  is_drop_only BOOLEAN DEFAULT false,
  patch_version VARCHAR(20) NOT NULL DEFAULT '0.3',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currency items and their effects
CREATE TABLE IF NOT EXISTS currency_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL,

  -- Currency properties
  stack_size INTEGER NOT NULL DEFAULT 10,
  tab_stack_size INTEGER NOT NULL DEFAULT 5000,

  -- Crafting behavior
  crafting_effect JSONB NOT NULL DEFAULT '{}', -- what it does

  -- Trade value (in chaos orbs equivalent)
  chaos_value DECIMAL(10,2),

  -- Metadata
  is_league_specific BOOLEAN DEFAULT false,
  patch_version VARCHAR(20) NOT NULL DEFAULT '0.3',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_base_items_category ON base_items(category_id);
CREATE INDEX IF NOT EXISTS idx_base_items_level ON base_items(item_level);
CREATE INDEX IF NOT EXISTS idx_unique_items_base ON unique_items(base_item_id);
CREATE INDEX IF NOT EXISTS idx_skill_gems_category ON skill_gems(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_gems_tags ON skill_gems USING GIN(gem_tags);
CREATE INDEX IF NOT EXISTS idx_item_mods_classes ON item_mods USING GIN(item_classes);
CREATE INDEX IF NOT EXISTS idx_notable_passives_tree ON notable_passives(tree_version_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get current passive tree
CREATE OR REPLACE FUNCTION get_current_passive_tree()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT tree_data
    FROM passive_tree_versions
    WHERE is_current = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to search items by mods
CREATE OR REPLACE FUNCTION search_items_by_mods(search_mods TEXT[])
RETURNS TABLE(item_id UUID, item_name VARCHAR, mod_matches INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    COUNT(*) AS mod_matches
  FROM unique_items u
  WHERE u.explicit_mods && search_mods
  GROUP BY u.id, u.name
  ORDER BY mod_matches DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE unique_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_gems ENABLE ROW LEVEL SECURITY;
ALTER TABLE passive_tree_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notable_passives ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_mods ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_items ENABLE ROW LEVEL SECURITY;

-- Public read access for game data
CREATE POLICY "Public read access for game data" ON item_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON base_items FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON unique_items FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON skill_gems FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON support_gems FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON passive_tree_versions FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON notable_passives FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON item_mods FOR SELECT USING (true);
CREATE POLICY "Public read access for game data" ON currency_items FOR SELECT USING (true);

-- Admin write access (requires admin role)
CREATE POLICY "Admin write access" ON item_categories FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON base_items FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON unique_items FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON skill_gems FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON support_gems FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON passive_tree_versions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON notable_passives FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON item_mods FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write access" ON currency_items FOR ALL USING (auth.jwt() ->> 'role' = 'admin');