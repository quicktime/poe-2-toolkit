# Supabase Implementation Guide for PoE2 Toolkit

## Quick Start Setup

### 1. Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
npx supabase init

# Install Supabase client
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2. Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Database Schema (Supabase SQL Editor)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
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

-- Build Templates
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
    patch_version TEXT NOT NULL,
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
    target_mods JSONB NOT NULL,
    steps JSONB NOT NULL,
    total_cost DECIMAL,
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character Snapshots for Analytics
CREATE TABLE public.character_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    character_name TEXT NOT NULL,
    class TEXT NOT NULL,
    level INTEGER NOT NULL,
    league TEXT,
    stats JSONB,
    calculated_dps DECIMAL,
    snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_builds_public ON public.build_templates(is_public, created_at DESC);
CREATE INDEX idx_builds_user ON public.build_templates(user_id);
CREATE INDEX idx_builds_class ON public.build_templates(class);
CREATE INDEX idx_comments_build ON public.comments(build_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crafting_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

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

-- Comments: Everyone can read, authenticated users can create
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Functions for automated features
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, poe_account_name, display_name)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'poe_account_name',
        new.raw_user_meta_data->>'display_name'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON public.build_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## TypeScript Integration

### 1. Create Supabase Client (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2. Server Client (`lib/supabase/server.ts`)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
```

### 3. Generate TypeScript Types

```bash
# Generate types from your database schema
npx supabase gen types typescript --project-id your_project_id > types/supabase.ts
```

### 4. Example: Build Templates API (`app/api/builds/route.ts`)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const classFilter = searchParams.get('class')

  let query = supabase
    .from('build_templates')
    .select(`
      *,
      profiles!inner(display_name, avatar_url),
      build_likes(count)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (classFilter) {
    query = query.eq('class', classFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('build_templates')
    .insert({
      ...body,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### 5. Real-time Subscriptions (Client Component)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function BuildComments({ buildId }: { buildId: string }) {
  const [comments, setComments] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(display_name, avatar_url)')
        .eq('build_id', buildId)
        .order('created_at', { ascending: false })

      if (data) setComments(data)
    }

    fetchComments()

    // Real-time subscription
    const channel = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `build_id=eq.${buildId}`
        },
        (payload) => {
          setComments(current => [payload.new, ...current])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [buildId])

  // Render comments...
}
```

## Migration Strategy

### Phase 1: Setup & Auth (Day 1-3)
1. Create Supabase project
2. Set up authentication with PoE OAuth
3. Migrate user sessions to Supabase Auth
4. Create profile sync

### Phase 2: Build Templates (Day 4-7)
1. Migrate localStorage builds to Supabase
2. Implement CRUD operations
3. Add public sharing with unique URLs
4. Enable real-time likes/views

### Phase 3: Social Features (Week 2)
1. Implement comments with real-time updates
2. Add follow system
3. Create build collections
4. Add notifications using Supabase Realtime

### Phase 4: Analytics (Week 3)
1. Set up character snapshot collection
2. Create analytics views in PostgreSQL
3. Implement dashboard with aggregated data
4. Add cron jobs for data aggregation (Supabase Edge Functions)

## Advantages Over Self-Hosted PostgreSQL

1. **No DevOps**: No server management, automatic backups, scaling
2. **Built-in Auth**: Integrates with your existing OAuth flow
3. **Real-time**: WebSocket subscriptions out of the box
4. **Security**: RLS policies enforce data access at database level
5. **Type Safety**: Auto-generated TypeScript types
6. **Edge Functions**: Serverless functions for background jobs
7. **Storage**: Built-in CDN for images/videos
8. **Instant APIs**: RESTful and GraphQL APIs automatically generated

## Cost Breakdown

### Free Tier (Perfect for Start)
- 500MB database
- 2GB storage
- 50,000 monthly active users
- 200,000 Edge Function invocations
- Real-time subscriptions

### Pro Tier ($25/month) When You Need
- 8GB database
- 100GB storage
- Automatic daily backups
- Point-in-time recovery
- No user limits

## Conclusion

Supabase provides everything you need for the PoE2 Toolkit's database requirements with minimal setup. It's particularly well-suited because:

1. **PostgreSQL with JSONB** - Perfect for flexible game data
2. **Real-time subscriptions** - Live build updates and comments
3. **Built-in Auth** - Seamless OAuth integration
4. **Row Level Security** - Secure multi-user environment
5. **Type safety** - Full TypeScript support
6. **Instant deployment** - Start building immediately

The migration from localStorage to Supabase can be done incrementally, starting with user profiles and build templates, then expanding to social features and analytics.