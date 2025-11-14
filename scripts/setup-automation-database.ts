/**
 * Automation Database Setup Script
 * Module 11: Automation Features
 * 
 * This script helps set up the automation tables in the database
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

async function setupAutomationDatabase() {
  console.log('🚀 Setting up Automation Features Database Tables...\n');

  // Read the SQL migration file
  const sqlPath = resolve(process.cwd(), 'scripts/create-automation-tables.sql');
  
  try {
    const sql = readFileSync(sqlPath, 'utf-8');
    
    console.log('📋 SQL Migration Script Ready');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📝 To apply the migration, choose one of the following options:\n');
    
    console.log('Option 1: Using Drizzle Kit (Recommended)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Set up your database connection in .env:');
    console.log('   DATABASE_URL=postgresql://user:password@host:port/database');
    console.log('   OR');
    console.log('   SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_DB_PASSWORD=your-password\n');
    console.log('2. Run: npm run db:push\n');
    
    console.log('Option 2: Manual SQL Execution');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Connect to your database:');
    console.log('   psql -h your-host -U your-user -d your-database\n');
    console.log('2. Run the SQL script:');
    console.log(`   psql -d your_database -f ${sqlPath}\n`);
    console.log('   OR copy-paste the SQL from: scripts/create-automation-tables.sql\n');
    
    console.log('Option 3: Supabase SQL Editor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: https://app.supabase.com/project/your-project/sql');
    console.log('2. Copy-paste the SQL from: scripts/create-automation-tables.sql');
    console.log('3. Execute the SQL\n');
    
    console.log('📊 Tables to be created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    console.log('\n✅ Migration script is ready at: scripts/create-automation-tables.sql');
    console.log('📖 See docs/MODULE_11_MIGRATION_GUIDE.md for detailed instructions\n');
    
  } catch (error: any) {
    console.error('❌ Error reading SQL file:', error.message);
    console.log('\n📝 You can manually run the SQL from: scripts/create-automation-tables.sql');
  }
}

setupAutomationDatabase().catch(console.error);

