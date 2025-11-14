/**
 * Verify Automation Tables Script
 * Module 11: Automation Features
 * 
 * This script verifies that all automation tables exist in the database
 */

import { db } from '../server/db';
import { sql } from 'drizzle-orm';

const REQUIRED_TABLES = [
  'auto_invest_rules',
  'rebalancing_rules',
  'rebalancing_executions',
  'trigger_orders',
  'notification_preferences',
  'notification_logs',
  'in_app_notifications',
  'automation_execution_logs',
];

async function verifyAutomationTables() {
  console.log('🔍 Verifying Automation Features Database Tables...\n');

  try {
    // Check if db is available
    if (!db || !db.execute) {
      console.error('❌ Database connection not available');
      console.log('\n💡 Please ensure DATABASE_URL or SUPABASE_URL + SUPABASE_DB_PASSWORD are set in .env\n');
      process.exit(1);
    }

    // Query for all automation tables
    const query = sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${REQUIRED_TABLES})
      ORDER BY table_name;
    `;

    const result = await db.execute(query);
    const existingTables = result.rows.map((row: any) => row.table_name);

    console.log('📊 Table Verification Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let allPresent = true;
    REQUIRED_TABLES.forEach((tableName) => {
      const exists = existingTables.includes(tableName);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${tableName}`);
      if (!exists) {
        allPresent = false;
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allPresent) {
      console.log('✅ All automation tables are present!');
      console.log(`📈 Found ${existingTables.length}/${REQUIRED_TABLES.length} tables\n`);
      
      // Get column counts for each table
      console.log('📋 Table Details:');
      for (const tableName of REQUIRED_TABLES) {
        try {
          const columnQuery = sql`
            SELECT COUNT(*) as count
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ${tableName};
          `;
          const colResult = await db.execute(columnQuery);
          const columnCount = colResult.rows[0]?.count || 0;
          console.log(`   ${tableName}: ${columnCount} columns`);
        } catch (error) {
          console.log(`   ${tableName}: Unable to get column count`);
        }
      }
      
      console.log('\n✅ Database setup complete!');
      process.exit(0);
    } else {
      const missing = REQUIRED_TABLES.filter(t => !existingTables.includes(t));
      console.log('❌ Some tables are missing:');
      missing.forEach(table => console.log(`   - ${table}`));
      console.log('\n💡 To create missing tables, run:');
      console.log('   npm run db:push');
      console.log('   OR');
      console.log('   psql -d your_database -f scripts/create-automation-tables.sql\n');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error verifying tables:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check DATABASE_URL or SUPABASE_URL + SUPABASE_DB_PASSWORD are set');
    console.log('   2. Verify database connection');
    console.log('   3. Ensure database user has SELECT permissions\n');
    process.exit(1);
  }
}

verifyAutomationTables().catch(console.error);

