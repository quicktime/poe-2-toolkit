# Database Design Document - Path of Exile 2 Toolkit

## Executive Summary

After analyzing the project requirements, I recommend implementing a **hybrid approach** using both SQL database (PostgreSQL) and the existing localStorage/cache solutions. The SQL database will handle persistent, shared, and relational data while keeping real-time API data and user preferences in cache/localStorage.

## Database Requirements Analysis

### Current State
- **LocalStorage**: Character snapshots, build templates, community metrics
- **Memory Cache**: API responses, market prices, passive tree data
- **IndexedDB**: Planned for offline support (not yet implemented)
- **API-only**: Real-time character data, market prices from POE2Scout

### Data Categories Requiring SQL Persistence

#### 1. User Account & Authentication
- User profiles beyond OAuth session
- User preferences and settings
- API rate limit tracking per user
- Subscription/premium features (future)

#### 2. Build Management
- **Build Templates** (currently in localStorage)
  - Shareable URLs needed
  - Version history
  - Community ratings/comments
  - Build guides and descriptions
- **Build Snapshots**
  - Historical character progression
  - Build comparison over time
  - League-specific builds

#### 3. Community Features
- **Build Sharing & Discovery**
  - Published builds with metadata
  - Build ratings and reviews
  - Build categories and tags
  - Author profiles
- **Social Features**
  - Following system
  - Comments and discussions
  - Build collections/favorites

#### 4. Crafting System
- **Crafting Sessions**
  - Multi-step crafting history
  - Success/failure tracking
  - Cost analysis over time
- **Custom Crafting Strategies**
  - User-created strategies
  - Strategy sharing and ratings
  - Strategy success metrics

#### 5. Analytics & Metrics
- **Aggregated Community Data**
  - Build popularity trends
  - Meta analysis
  - League statistics
- **User Analytics**
  - Personal progress tracking
  - Achievement system
  - Play pattern analysis

## Proposed Database Schema

### Core Tables

```sql
-- Users (extends OAuth data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poe_account_name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    is_content_creator BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Templates (shareable builds)
CREATE TABLE build_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class VARCHAR(50) NOT NULL,
    ascendancy VARCHAR(50),
    level INTEGER NOT NULL,

    -- Build Data
    passive_tree JSONB NOT NULL, -- Passive node IDs and jewels
    equipment JSONB NOT NULL,     -- Full equipment data
    skills JSONB NOT NULL,        -- Skills and support gems
    stats JSONB NOT NULL,         -- Calculated stats snapshot

    -- Metadata
    league VARCHAR(100),
    patch_version VARCHAR(20) NOT NULL,
    complexity VARCHAR(20), -- beginner, intermediate, advanced, expert
    tags TEXT[], -- Array of tags
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Analytics
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for search
    INDEX idx_build_class (class),
    INDEX idx_build_public (is_public, created_at DESC),
    INDEX idx_build_user (user_id)
);

-- Build Versions (history tracking)
CREATE TABLE build_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_template_id UUID REFERENCES build_templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes TEXT,
    passive_tree JSONB NOT NULL,
    equipment JSONB NOT NULL,
    skills JSONB NOT NULL,
    stats JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(build_template_id, version_number)
);

-- Build Ratings & Reviews
CREATE TABLE build_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    build_template_id UUID REFERENCES build_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_verified_clear BOOLEAN DEFAULT FALSE, -- User has cleared content with this build
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(build_template_id, user_id)
);

-- Character Snapshots (for analytics)
CREATE TABLE character_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    league VARCHAR(100),
    experience BIGINT,

    -- Snapshot data
    equipment_hash VARCHAR(64), -- Hash of equipment for deduplication
    passive_tree_hash VARCHAR(64),
    stats JSONB,

    -- DPS calculations
    calculated_dps NUMERIC,
    calculated_ehp NUMERIC,

    snapshot_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_snapshot_user (user_id, character_name),
    INDEX idx_snapshot_time (snapshot_at DESC)
);

-- Crafting Sessions
CREATE TABLE crafting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_base VARCHAR(255) NOT NULL,
    item_class VARCHAR(100) NOT NULL,
    target_mods JSONB NOT NULL,

    -- Session data
    steps JSONB NOT NULL, -- Array of crafting steps
    total_cost NUMERIC,
    currency_used JSONB,
    success BOOLEAN,
    final_item JSONB,

    -- Analytics
    session_duration INTEGER, -- in seconds
    attempt_count INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    INDEX idx_crafting_user (user_id),
    INDEX idx_crafting_item (item_base, item_class)
);

-- Custom Crafting Strategies
CREATE TABLE crafting_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_base VARCHAR(255),
    item_class VARCHAR(100),

    -- Strategy definition
    strategy_steps JSONB NOT NULL,
    expected_cost NUMERIC,
    success_rate NUMERIC,

    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    uses_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_strategy_public (is_public, created_at DESC)
);

-- User Follows (social features)
CREATE TABLE user_follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (follower_id, following_id)
);

-- Build Collections
CREATE TABLE build_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Build Collection Items
CREATE TABLE build_collection_items (
    collection_id UUID REFERENCES build_collections(id) ON DELETE CASCADE,
    build_template_id UUID REFERENCES build_templates(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (collection_id, build_template_id)
);

-- Analytics Events (for tracking user behavior)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_analytics_user (user_id, created_at DESC),
    INDEX idx_analytics_type (event_type, created_at DESC)
);

-- Comments (for builds and guides)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    build_template_id UUID REFERENCES build_templates(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_comments_build (build_template_id, created_at DESC)
);

-- Market Price History (aggregated data)
CREATE TABLE market_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id VARCHAR(255) NOT NULL,
    league VARCHAR(100) NOT NULL,
    price_in_chaos NUMERIC NOT NULL,
    price_in_divine NUMERIC,
    volume INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_price_item (item_id, league, recorded_at DESC)
);

-- User API Rate Limits
CREATE TABLE api_rate_limits (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    requests_made INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, endpoint)
);
```

## Data Migration Strategy

### Phase 1: User System (Week 1-2)
1. Implement user table and authentication integration
2. Migrate OAuth sessions to include database user reference
3. Add user preferences migration from localStorage

### Phase 2: Build Templates (Week 3-4)
1. Migrate existing localStorage build templates to database
2. Implement build sharing endpoints
3. Add versioning system for builds
4. Create build discovery features

### Phase 3: Social Features (Week 5-6)
1. Implement following system
2. Add comments and ratings
3. Create build collections
4. Implement notifications

### Phase 4: Analytics (Week 7-8)
1. Implement character snapshot collection
2. Create analytics aggregation jobs
3. Build analytics dashboard
4. Add personal progress tracking

## Technology Recommendations

### Database Choice: PostgreSQL
- **Why PostgreSQL:**
  - Excellent JSONB support for flexible schema (equipment, skills, etc.)
  - Full-text search for build discovery
  - Strong performance with proper indexing
  - Array and composite types for complex data
  - Window functions for analytics

### ORM: Prisma
- Type-safe database access
- Automatic migrations
- Excellent TypeScript integration
- Built-in connection pooling

### Caching Strategy
- **Redis** for:
  - Session management
  - API response caching
  - Rate limiting
  - Real-time leaderboards

### Implementation Example

```typescript
// prisma/schema.prisma
model User {
  id            String   @id @default(uuid())
  poeAccountName String  @unique @map("poe_account_name")
  displayName   String?  @map("display_name")
  avatarUrl     String?  @map("avatar_url")
  bio           String?
  settings      Json     @default("{}")

  buildTemplates BuildTemplate[]
  reviews       BuildReview[]
  followers     UserFollow[] @relation("followers")
  following     UserFollow[] @relation("following")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  lastSeenAt    DateTime @default(now()) @map("last_seen_at")

  @@map("users")
}

model BuildTemplate {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  user          User     @relation(fields: [userId], references: [id])

  title         String
  description   String?
  class         String
  ascendancy    String?
  level         Int

  passiveTree   Json     @map("passive_tree")
  equipment     Json
  skills        Json
  stats         Json

  league        String?
  patchVersion  String   @map("patch_version")
  complexity    String?
  tags          String[]
  isPublic      Boolean  @default(true) @map("is_public")

  views         Int      @default(0)
  likes         Int      @default(0)

  versions      BuildVersion[]
  reviews       BuildReview[]

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([class])
  @@index([userId])
  @@index([isPublic, createdAt(sort: Desc)])
  @@map("build_templates")
}
```

## Benefits of SQL Database

1. **Data Persistence**: No 5MB localStorage limit
2. **Data Sharing**: Builds and strategies can be shared via URL
3. **Analytics**: Aggregate data across all users for meta analysis
4. **Version Control**: Track build changes over time
5. **Social Features**: Comments, ratings, follows
6. **Search & Discovery**: Find builds by class, skills, items
7. **Data Integrity**: Foreign keys and constraints
8. **Scalability**: Can handle millions of builds
9. **Backup & Recovery**: Professional database backups

## What Stays in Cache/API

1. **Real-time Market Prices**: Too volatile for database
2. **Live Character Data**: Always fetch fresh from PoE API
3. **Passive Tree Structure**: Static data, cache is sufficient
4. **Temporary Calculations**: DPS calculations, what-if scenarios
5. **User Session State**: Current character selection, UI state

## Next Steps

1. Set up PostgreSQL database (local Docker for dev, cloud for production)
2. Install Prisma and create schema
3. Implement user authentication with database
4. Create API endpoints for build CRUD operations
5. Migrate existing localStorage data
6. Implement build sharing features
7. Add social features progressively
8. Set up analytics pipeline

## Cost Considerations

- **Development**: PostgreSQL (free), Redis (free tier sufficient initially)
- **Production**:
  - Database: ~$25/month (DigitalOcean/Supabase)
  - Redis: ~$15/month (Redis Cloud)
  - Total: ~$40/month for initial scale (10k users)

## Conclusion

Implementing a SQL database is essential for the toolkit's growth beyond a single-user tool to a community platform. The hybrid approach maintains performance while adding persistence, sharing, and social features that users expect from a modern build planning tool.