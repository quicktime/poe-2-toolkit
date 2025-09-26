# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login to your account
3. Click "New Project"
4. Fill in:
   - Project name: `poe2-toolkit` (or your preferred name)
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to your users
   - Pricing Plan: Free tier is fine to start

5. Wait for project to be provisioned (~2 minutes)

## Step 2: Get Your API Keys

Once your project is created:

1. Go to Settings → API
2. Copy these values to your `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 3: Run Database Migration

### Option A: Using Supabase Dashboard (Easiest)
1. Go to SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

### Option B: Using Supabase CLI
```bash
# Link your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

## Step 4: Configure Authentication

1. In Supabase Dashboard, go to Authentication → Providers
2. Enable "Email" provider (for testing)
3. Later, you can add OAuth providers like Discord, Google, etc.

## Step 5: Update Your .env.local

Create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```

Then update with your Supabase credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 6: Test the Connection

Run the development server:
```bash
npm run dev
```

The Supabase client should now be connected!

## Optional: Local Development with Supabase

For local development without internet:

```bash
# Start Supabase locally
npx supabase start

# This will give you local URLs:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

Update `.env.local` for local development:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

## Next Steps

1. **Test Build Templates**: Create and share builds
2. **Enable Realtime**: Subscribe to build updates
3. **Add Social Features**: Comments, likes, follows
4. **Analytics**: Track popular builds and meta trends

## Troubleshooting

### "Invalid API Key"
- Make sure you're using the `anon` key for client-side
- Check that the key is copied correctly (no spaces)

### "Permission Denied"
- Check Row Level Security policies
- Make sure user is authenticated for protected routes

### "Connection Refused"
- Verify your Supabase project is running
- Check if you're using the correct URL (with https://)

## Useful Supabase Dashboard Sections

- **Table Editor**: View and edit data
- **SQL Editor**: Run queries and migrations
- **Authentication**: Manage users
- **Storage**: Upload images/files
- **Realtime**: Monitor subscriptions
- **Logs**: Debug issues

## Security Reminders

1. Never commit `.env.local` to git
2. Keep `SUPABASE_SERVICE_ROLE_KEY` secret
3. Use Row Level Security (RLS) for all tables
4. Validate user input on the server side
5. Use prepared statements for queries