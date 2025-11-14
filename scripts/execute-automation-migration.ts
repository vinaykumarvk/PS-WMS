/**
 * Execute Automation Migration
 * Module 11: Automation Features
 * 
 * Attempts to execute migration using available database connection
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function executeMigration() {
  console.log('🚀 Executing Automation Features Database Migration...\n');

  try {
    // Check if db connection is available
    if (!db || !db.execute) {
      console.error('❌ Database connection not available');
      console.log('\n💡 Database connection requires one of:');
      console.log('   1. DATABASE_URL in .env');
      console.log('   2. SUPABASE_URL + SUPABASE_DB_PASSWORD in .env\n');
      
      // Provide Supabase SQL Editor link
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
        if (match) {
          const projectRef = match[1];
          console.log('📝 Alternative: Use Supabase SQL Editor');
          console.log(`   URL: https://app.supabase.com/project/${projectRef}/sql\n`);
          console.log('   Steps:');
          console.log('   1. Open the URL above');
          console.log('   2. Copy SQL from: scripts/create-automation-tables.sql');
          console.log('   3. Paste and execute\n');
        }
      }
      
      process.exit(1);
    }

    // Read SQL migration file
    const sqlPath = resolve(process.cwd(), 'scripts/create-automation-tables.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📋 SQL Migration Script Loaded');
    console.log(`📄 File: ${sqlPath}\n`);

    // Split SQL into statements (simple approach)
    // Remove comments and empty lines
    const cleanSql = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');

    // Split by semicolons but keep CREATE TABLE statements together
    const statements: string[] = [];
    let currentStatement = '';
    
    for (const line of cleanSql.split('\n')) {
      currentStatement += line + '\n';
      if (line.trim().endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 10) { // Ignore very short statements
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute statements
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip very short statements
      if (statement.length < 20) {
        continue;
      }

      try {
        // Extract table name for logging
        const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : `statement_${i + 1}`;
        
        console.log(`⏳ Creating table: ${tableName}...`);
        
        // Execute using Drizzle's sql template
        await db.execute(sql.raw(statement));
        
        console.log(`✅ Created table: ${tableName}`);
        successCount++;
        
      } catch (error: any) {
        // Check if error is "already exists" - that's okay
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`ℹ️  Table already exists (skipping)`);
          successCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
          errors.push(`Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (errorCount === 0) {
      console.log(`✅ Migration completed successfully!`);
      console.log(`📈 Executed ${successCount} statements\n`);
      
      // Verify tables
      console.log('🔍 Verifying tables...\n');
      await verifyTables();
      
    } else {
      console.log(`⚠️  Migration completed with ${errorCount} error(s)`);
      console.log(`✅ Successfully executed: ${successCount}`);
      console.log(`❌ Failed: ${errorCount}\n`);
      
      if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach(err => console.log(`   - ${err}`));
        console.log('');
      }
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 See docs/MODULE_11_DATABASE_SETUP.md for detailed instructions\n');
    process.exit(1);
  }
}

async function verifyTables() {
  const requiredTables = [
    'auto_invest_rules',
    'rebalancing_rules',
    'rebalancing_executions',
    'trigger_orders',
    'notification_preferences',
    'notification_logs',
    'in_app_notifications',
    'automation_execution_logs',
  ];

  try {
    const query = sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${requiredTables})
      ORDER BY table_name;
    `;

    const result = await db.execute(query);
    const existingTables = result.rows.map((row: any) => row.table_name);

    console.log('📊 Table Verification:');
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    if (existingTables.length === requiredTables.length) {
      console.log(`\n✅ All ${requiredTables.length} tables verified!\n`);
    } else {
      const missing = requiredTables.filter(t => !existingTables.includes(t));
      console.log(`\n⚠️  Missing tables: ${missing.join(', ')}\n`);
    }
  } catch (error: any) {
    console.log(`⚠️  Could not verify tables: ${error.message}\n`);
  }
}

executeMigration().catch(console.error);

