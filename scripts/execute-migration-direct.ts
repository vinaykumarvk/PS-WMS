/**
 * Execute Migration Directly
 * Attempts to execute migration using available Supabase credentials
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

async function executeMigration() {
  console.log('🚀 Attempting to execute automation migration...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // Read SQL file
  const sqlPath = resolve(process.cwd(), 'scripts/create-automation-tables.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('📋 SQL Migration Script Loaded\n');

  // Supabase REST API doesn't support arbitrary DDL execution
  // We need to use the SQL Editor or direct PostgreSQL connection
  console.log('⚠️  Supabase REST API does not support DDL execution');
  console.log('💡 Migration must be executed via:');
  console.log('   1. Supabase SQL Editor (recommended)');
  console.log('   2. Direct PostgreSQL connection with password\n');

  // Extract project ref for SQL Editor URL
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    const projectRef = match[1];
    console.log(`🔗 SQL Editor URL:`);
    console.log(`   https://app.supabase.com/project/${projectRef}/sql\n`);
  }

  console.log('📝 To execute migration:');
  console.log('   1. Open SQL Editor URL above');
  console.log('   2. Copy SQL from: scripts/create-automation-tables.sql');
  console.log('   3. Paste and execute\n');

  // However, let's try to check if tables already exist
  console.log('🔍 Checking existing tables...\n');
  
  const tablesToCheck = [
    'auto_invest_rules',
    'rebalancing_rules',
    'trigger_orders',
    'notification_preferences',
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          console.log(`   ❌ ${table} - Not found`);
        } else {
          console.log(`   ⚠️  ${table} - Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table} - Exists`);
      }
    } catch (err: any) {
      console.log(`   ⚠️  ${table} - ${err.message}`);
    }
  }

  console.log('\n💡 To create missing tables, use Supabase SQL Editor\n');
}

executeMigration().catch(console.error);

