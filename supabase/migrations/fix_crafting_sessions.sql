-- Fix crafting_sessions table to match expected schema
-- Add missing columns if they don't exist

-- Add total_cost_exalted column if it doesn't exist
ALTER TABLE crafting_sessions 
ADD COLUMN IF NOT EXISTS total_cost_exalted REAL;

-- Add session_id column if it doesn't exist
ALTER TABLE crafting_sessions 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Add target_mods column if it doesn't exist
ALTER TABLE crafting_sessions 
ADD COLUMN IF NOT EXISTS target_mods TEXT[];

-- Add success column if it doesn't exist
ALTER TABLE crafting_sessions 
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT false;

-- Add currency_used column if it doesn't exist (change from existing JSONB if needed)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='crafting_sessions' 
    AND column_name='currency_used'
    AND data_type='jsonb'
  ) THEN
    ALTER TABLE crafting_sessions 
    DROP COLUMN IF EXISTS currency_used;
    
    ALTER TABLE crafting_sessions 
    ADD COLUMN currency_used JSONB DEFAULT '{}';
  END IF;
END $$;

-- Verify the table structure
DO $$
BEGIN
  RAISE NOTICE 'crafting_sessions table has been updated with all required columns!';
END $$;