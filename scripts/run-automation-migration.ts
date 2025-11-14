/**
 * Run Automation Migration Script
 * Module 11: Automation Features
 * 
 * This script executes the SQL migration using Supabase client
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getServerSupabase } from '../server/lib/supabase';

async function runMigration() {
  console.log('🚀 Running Automation Features Database Migration...\n');

  try {
    // Get Supabase client
    const supabase = getServerSupabase();
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      console.log('\n💡 Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env\n');
      process.exit(1);
    }

    // Read SQL migration file
    const sqlPath = resolve(process.cwd(), 'scripts/create-automation-tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📋 SQL Migration Script Loaded');
    console.log(`📄 File: ${sqlPath}\n`);

    // Split SQL into individual statements
    // Remove comments and split by semicolons
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.length < 10) {
        continue;
      }

      try {
        // Use Supabase RPC or direct query
        // Note: Supabase doesn't support arbitrary SQL execution via client
        // We'll need to use the SQL editor or provide instructions
        
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // For CREATE TABLE statements, we can't execute directly via Supabase client
        // This requires either:
        // 1. Database password for direct connection
        // 2. Supabase SQL Editor
        // 3. Supabase Management API
        
        console.log('⚠️  Direct SQL execution via Supabase client is not supported');
        console.log('💡 Please use one of these methods:\n');
        break;
        
      } catch (error: any) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    if (errorCount === 0 && successCount > 0) {
      console.log(`\n✅ Migration completed successfully!`);
      console.log(`📈 Executed ${successCount} statements\n`);
    } else {
      console.log('\n📝 Migration Instructions:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('Option 1: Supabase SQL Editor (Recommended)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Go to: https://app.supabase.com/project/yihuqlzbhaptqjcgcpmh/sql');
      console.log('2. Copy the SQL from: scripts/create-automation-tables.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click "Run" or press Cmd/Ctrl + Enter\n');
      
      console.log('Option 2: Add Database Password');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Get your database password from Supabase dashboard');
      console.log('2. Add to .env: SUPABASE_DB_PASSWORD=your-password');
      console.log('3. Run: npm run db:push\n');
      
      console.log('Option 3: Direct PostgreSQL Connection');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Get connection string from Supabase dashboard');
      console.log('2. Add to .env: DATABASE_URL=postgresql://...');
      console.log('3. Run: npm run db:push\n');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 See docs/MODULE_11_DATABASE_SETUP.md for detailed instructions\n');
    process.exit(1);
  }
}

runMigration().catch(console.error);

