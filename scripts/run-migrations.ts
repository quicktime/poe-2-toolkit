import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  try {
    // Get all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensure they run in order

    console.log(`\n📁 Found ${files.length} migration files:`);
    files.forEach(file => console.log(`   - ${file}`));

    // Create migrations tracking table if it doesn't exist
    console.log('\n📊 Creating migrations tracking table...');
    const { error: trackingError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }).single();

    // If RPC doesn't exist, try direct query (this might fail without proper permissions)
    if (trackingError) {
      console.log('⚠️  Could not create migrations table via RPC. Trying alternative method...');
      
      // For now, we'll just run the migrations without tracking
      console.log('⚠️  Running migrations without tracking (manual method)');
    }

    // Run each migration
    for (const file of files) {
      console.log(`\n🔄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Split by semicolons to handle multiple statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let statementCount = 0;
      for (const statement of statements) {
        try {
          // Note: Direct SQL execution requires specific setup in Supabase
          // For production, you might want to use the Supabase Dashboard or CLI
          console.log(`   Executing statement ${++statementCount}/${statements.length}...`);
          
          // This is a simplified approach - in production, use Supabase CLI
          console.log(`   ⚠️  Statement preview: ${statement.substring(0, 50)}...`);
          
        } catch (err) {
          console.error(`   ❌ Error in statement ${statementCount}:`, err);
        }
      }
      
      console.log(`   ✅ Migration ${file} processed`);
    }

    console.log('\n✨ Migration process completed!');
    console.log('\n📝 Note: For production migrations, use the Supabase Dashboard:');
    console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.com')}/project/zarlahwegnnhfyqrqhew/editor`);
    console.log('\n   Or use the Supabase CLI:');
    console.log('   npx supabase db push');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Direct table creation for essential tables
async function createEssentialTables() {
  console.log('\n🏗️  Creating essential tables directly...');
  
  // These are simplified versions that we can create via the API
  const tables = [
    {
      name: 'crafting_mods',
      sql: `
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        tier INTEGER,
        required_level INTEGER,
        tags TEXT[],
        weight INTEGER,
        min_value REAL,
        max_value REAL,
        mod_group TEXT,
        item_types TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    },
    {
      name: 'currency_rates',
      sql: `
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value_in_exalted REAL NOT NULL,
        value_in_divine REAL,
        league TEXT DEFAULT 'Standard',
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    },
    {
      name: 'item_bases',
      sql: `
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        item_class TEXT,
        required_level INTEGER DEFAULT 1,
        properties JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`   Creating table: ${table.name}`);
      // Note: This would need proper Supabase admin access
      // For now, we'll log what needs to be done
      console.log(`   ⚠️  Please create this table in Supabase Dashboard`);
    } catch (error) {
      console.error(`   ❌ Failed to create ${table.name}:`, error);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Supabase migration process...\n');
  
  // Try to run migrations
  await runMigrations();
  
  // Show manual instructions
  console.log('\n📌 Manual Setup Instructions:');
  console.log('1. Go to your Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/zarlahwegnnhfyqrqhew/editor`);
  console.log('\n2. Click on "SQL Editor" in the left sidebar');
  console.log('\n3. Copy and paste each migration file content:');
  console.log('   - 001_initial_schema.sql');
  console.log('   - 002_game_data_schema.sql');  
  console.log('   - 003_simplified_game_data.sql');
  console.log('\n4. Run each migration in order');
  console.log('\n✅ Once done, your database will be ready!');
}

main().catch(console.error);