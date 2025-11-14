/**
 * Execute Migration via Supabase API
 * Attempts to use Supabase REST API to execute SQL
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env file
config({ path: resolve(process.cwd(), '.env') });

async function executeViaAPI() {
  console.log('🚀 Attempting to execute migration via Supabase API...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // Read SQL file
  const sqlPath = resolve(process.cwd(), 'scripts/create-automation-tables.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('📋 SQL Migration Script Loaded\n');

  // Supabase doesn't support arbitrary DDL via REST API
  // However, we can try using their SQL execution endpoint if available
  // Or use the Management API
  
  console.log('⚠️  Supabase REST API does not support DDL execution');
  console.log('💡 DDL operations require direct database access\n');

  // Check if tables already exist
  console.log('🔍 Checking existing tables...\n');
  
  const tables = [
    'auto_invest_rules',
    'rebalancing_rules',
    'rebalancing_executions',
    'trigger_orders',
    'notification_preferences',
    'notification_logs',
    'in_app_notifications',
    'automation_execution_logs',
  ];

  const existingTables: string[] = [];
  const missingTables: string[] = [];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          missingTables.push(table);
          console.log(`   ❌ ${table} - Not found`);
        } else {
          console.log(`   ⚠️  ${table} - Error: ${error.message}`);
        }
      } else {
        existingTables.push(table);
        console.log(`   ✅ ${table} - Exists`);
      }
    } catch (err: any) {
      missingTables.push(table);
      console.log(`   ❌ ${table} - ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (missingTables.length === 0) {
    console.log('✅ All automation tables already exist!');
    console.log('📊 No migration needed\n');
    return;
  }

  console.log(`📊 Status: ${existingTables.length}/${tables.length} tables exist`);
  console.log(`📋 Missing: ${missingTables.length} tables\n`);

  // Extract project ref for SQL Editor URL
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    const projectRef = match[1];
    console.log('📝 To create missing tables:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Option 1: Supabase SQL Editor (Recommended)');
    console.log(`   URL: https://app.supabase.com/project/${projectRef}/sql\n`);
    console.log('   Steps:');
    console.log('   1. Open the URL above');
    console.log('   2. Copy SQL from: scripts/create-automation-tables.sql');
    console.log('   3. Paste and execute\n');
    
    console.log('Option 2: Add Database Password');
    console.log('   1. Get password from: https://app.supabase.com/project/' + projectRef + '/settings/database');
    console.log('   2. Add to .env: SUPABASE_DB_PASSWORD=your-password');
    console.log('   3. Run: npm run db:push\n');
  }
}

executeViaAPI().catch(console.error);

