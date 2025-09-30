# Database Setup Guide

## Quick Start

Your Supabase database needs to be initialized with the required tables. Follow these steps:

### Step 1: Run Database Migrations

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/zarlahwegnnhfyqrqhew/editor
   - Click on "SQL Editor" in the left sidebar

2. **Run the Combined Migration**
   - Open the file: `supabase/migrations/combined_migration.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL editor
   - Click "Run" to execute

   This migration creates:
   - ✅ Essential crafting tables (crafting_mods, currency_rates, item_bases, market_prices)
   - ✅ Currency conversion functions
   - ✅ Sample data for testing
   - ✅ Proper indexes and RLS policies

### Step 2: Verify Installation

After running the migration, verify everything is working:

```bash
npm run db:verify
```

You should see output like:
```
✅ crafting_mods: Table exists and is accessible
✅ currency_rates: Table exists and is accessible
✅ item_bases: Table exists and is accessible
✅ market_prices: Table exists and is accessible
✅ crafting_sessions: Table exists and is accessible
✨ Database is fully operational!
```

### Step 3: (Optional) Additional Migrations

If you want the full feature set including user profiles and build sharing:

1. Run `001_initial_schema.sql` - User profiles, builds, social features
2. Run `002_game_data_schema.sql` - Extended game data tables
3. Run `003_simplified_game_data.sql` - Simplified game data structure

## Database Structure

### Essential Tables (Required)

| Table | Purpose |
|-------|---------|
| `crafting_mods` | Stores all possible item modifiers |
| `currency_rates` | Real-time currency exchange rates |
| `item_bases` | Base item types and properties |
| `market_prices` | Market price tracking |
| `crafting_sessions` | User crafting history |

### Optional Tables (For full features)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles and settings |
| `build_templates` | Shareable character builds |
| `skill_gems` | Skill gem data |
| `passive_tree_versions` | Passive tree snapshots |

## Common Issues

### Issue: "permission denied for schema public"
**Solution**: Make sure you're using the SQL Editor in Supabase Dashboard, not a client connection

### Issue: Tables not appearing after migration
**Solution**: Check the SQL editor output for errors. The migration might have partially failed.

### Issue: RLS policies blocking access
**Solution**: The migration includes proper RLS policies. If you're still blocked, check that your anon key is correct in `.env.local`

## Testing the Database

Once setup is complete, test the crafting system:

1. Start the development server: `npm run dev`
2. Navigate to: http://localhost:3000/crafting
3. The page should load without errors
4. Currency rates should display (Divine=380 Ex, etc.)

## Manual Data Management

If you need to manually add or modify data:

1. Go to Table Editor: https://supabase.com/dashboard/project/zarlahwegnnhfyqrqhew/editor/data
2. Select the table you want to modify
3. Use the UI to add/edit/delete rows

## Environment Variables

Ensure these are set in both `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zarlahwegnnhfyqrqhew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Run `npm run db:verify` to diagnose
3. Check Supabase logs: https://supabase.com/dashboard/project/zarlahwegnnhfyqrqhew/logs/explorer