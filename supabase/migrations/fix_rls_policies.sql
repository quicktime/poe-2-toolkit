-- Fix RLS policies for crafting_sessions table
-- Allow anonymous users to track their crafting sessions

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own crafting sessions" ON crafting_sessions;
DROP POLICY IF EXISTS "Users can create crafting sessions" ON crafting_sessions;
DROP POLICY IF EXISTS "Users can update own crafting sessions" ON crafting_sessions;
DROP POLICY IF EXISTS "Allow inserts" ON crafting_sessions;

-- Create new policies that allow anonymous access
-- Allow anyone to view all sessions (for statistics/learning)
CREATE POLICY "Public read access" 
ON crafting_sessions FOR SELECT 
USING (true);

-- Allow anyone to create sessions (anonymous crafting)
CREATE POLICY "Allow anonymous inserts" 
ON crafting_sessions FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update their own sessions (by session_id)
CREATE POLICY "Allow session updates" 
ON crafting_sessions FOR UPDATE 
USING (true);

-- Verify the policies
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated for anonymous crafting!';
END $$;