-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    poe_account_name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_content_creator BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Templates (shareable builds)
CREATE TABLE public.build_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Build Info
    title TEXT NOT NULL,
    description TEXT,
    class TEXT NOT NULL,
    ascendancy TEXT,
    level INTEGER NOT NULL,

    -- Build Data (JSONB for flexibility)
    passive_tree JSONB NOT NULL,
    equipment JSONB NOT NULL,
    skills JSONB NOT NULL,
    stats JSONB NOT NULL,

    -- Metadata
    league TEXT,
    patch_version TEXT NOT NULL DEFAULT '0.3',
    complexity TEXT CHECK (complexity IN ('beginner', 'intermediate', 'advanced', 'expert')),
    tags TEXT[],
    is_public BOOLEAN DEFAULT TRUE,

    -- Analytics
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Likes (for real-time updates)
CREATE TABLE public.build_likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    build_id UUID REFERENCES public.build_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, build_id)
);

-- Comments with real-time support
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    build_id UUID REFERENCES public.build_templates(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crafting Sessions
CREATE TABLE public.crafting_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_base TEXT NOT NULL,
    item_class TEXT,
    target_mods JSONB NOT NULL,
    steps JSONB NOT NULL,
    total_cost DECIMAL,
    currency_used JSONB,
    success BOOLEAN,
    final_item JSONB,
    session_duration INTEGER, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Character Snapshots for Analytics
CREATE TABLE public.character_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    character_name TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER NOT NULL,
    league TEXT,
    experience BIGINT,
    equipment_hash TEXT,
    passive_tree_hash TEXT,
    stats JSONB,
    calculated_dps DECIMAL,
    calculated_ehp DECIMAL,
    snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Collections
CREATE TABLE public.build_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Collection Items
CREATE TABLE public.build_collection_items (
    collection_id UUID REFERENCES public.build_collections(id) ON DELETE CASCADE,
    build_template_id UUID REFERENCES public.build_templates(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, build_template_id)
);

-- User Follows (social features)
CREATE TABLE public.user_follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX idx_builds_public ON public.build_templates(is_public, created_at DESC);
CREATE INDEX idx_builds_user ON public.build_templates(user_id);
CREATE INDEX idx_builds_class ON public.build_templates(class);
CREATE INDEX idx_builds_tags ON public.build_templates USING GIN(tags);
CREATE INDEX idx_comments_build ON public.comments(build_id, created_at DESC);
CREATE INDEX idx_snapshots_user ON public.character_snapshots(user_id, character_name);
CREATE INDEX idx_snapshots_time ON public.character_snapshots(snapshot_at DESC);
CREATE INDEX idx_crafting_user ON public.crafting_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crafting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Builds: Public builds readable by all, users can CRUD own
CREATE POLICY "Public builds are viewable by everyone"
    ON public.build_templates FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create builds"
    ON public.build_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own builds"
    ON public.build_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own builds"
    ON public.build_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Build Likes
CREATE POLICY "Likes are viewable by everyone"
    ON public.build_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own likes"
    ON public.build_likes FOR ALL
    USING (auth.uid() = user_id);

-- Comments: Everyone can read, authenticated users can create
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- Crafting Sessions: Users can only see and manage their own
CREATE POLICY "Users can view own crafting sessions"
    ON public.crafting_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create crafting sessions"
    ON public.crafting_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crafting sessions"
    ON public.crafting_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Character Snapshots: Users can view own, aggregated data is public
CREATE POLICY "Users can view own snapshots"
    ON public.character_snapshots FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL); -- NULL for anonymous snapshots

CREATE POLICY "Users can create snapshots"
    ON public.character_snapshots FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Build Collections
CREATE POLICY "Public collections are viewable by everyone"
    ON public.build_collections FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create collections"
    ON public.build_collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
    ON public.build_collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
    ON public.build_collections FOR DELETE
    USING (auth.uid() = user_id);

-- Collection Items
CREATE POLICY "Collection items follow collection visibility"
    ON public.build_collection_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.build_collections
            WHERE id = collection_id
            AND (is_public = true OR user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage items in own collections"
    ON public.build_collection_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.build_collections
            WHERE id = collection_id
            AND user_id = auth.uid()
        )
    );

-- User Follows
CREATE POLICY "Follows are viewable by everyone"
    ON public.user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own follows"
    ON public.user_follows FOR ALL
    USING (auth.uid() = follower_id);

-- Functions for automated features

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, poe_account_name, display_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'poe_account_name', new.email),
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment build views
CREATE OR REPLACE FUNCTION public.increment_build_views(build_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.build_templates
    SET views = views + 1
    WHERE id = build_id;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON public.build_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.build_collections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get build statistics
CREATE OR REPLACE FUNCTION public.get_build_stats(build_uuid UUID)
RETURNS TABLE(
    total_likes BIGINT,
    total_comments BIGINT,
    is_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT bl.user_id) AS total_likes,
        COUNT(DISTINCT c.id) AS total_comments,
        EXISTS(
            SELECT 1 FROM public.build_likes
            WHERE build_id = build_uuid
            AND user_id = auth.uid()
        ) AS is_liked
    FROM public.build_templates bt
    LEFT JOIN public.build_likes bl ON bt.id = bl.build_id
    LEFT JOIN public.comments c ON bt.id = c.build_id
    WHERE bt.id = build_uuid
    GROUP BY bt.id;
END;
$$ LANGUAGE plpgsql;