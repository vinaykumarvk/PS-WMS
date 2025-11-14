/**
 * Prepare Supabase Migration
 * Module 11: Automation Features
 * 
 * Formats SQL for easy copy-paste into Supabase SQL Editor
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

function prepareMigration() {
  console.log('📋 Preparing Automation Features Migration for Supabase SQL Editor\n');

  try {
    // Read SQL migration file
    const sqlPath = resolve(process.cwd(), 'scripts/create-automation-tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Get Supabase project info
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    let sqlEditorUrl = '';
    
    if (supabaseUrl) {
      const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
      if (match) {
        const projectRef = match[1];
        sqlEditorUrl = `https://app.supabase.com/project/${projectRef}/sql`;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 SUPABASE SQL EDITOR MIGRATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (sqlEditorUrl) {
      console.log(`🔗 SQL Editor URL:`);
      console.log(`   ${sqlEditorUrl}\n`);
    } else {
      console.log('🔗 SQL Editor URL:');
      console.log('   https://app.supabase.com/project/YOUR_PROJECT_REF/sql\n');
    }

    console.log('📋 Steps to Execute Migration:\n');
    console.log('   1. Open the SQL Editor URL above');
    console.log('   2. Click "New Query"');
    console.log('   3. Copy the SQL below (between the markers)');
    console.log('   4. Paste into the SQL Editor');
    console.log('   5. Click "Run" or press Cmd/Ctrl + Enter\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 SQL MIGRATION SCRIPT (Copy everything below)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(sql);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ After execution, verify tables with:');
    console.log('   npm run db:verify\n');

    // Also save to a file for easy access
    const fs = require('fs');
    const outputPath = resolve(process.cwd(), 'scripts/automation-migration-ready.sql');
    fs.writeFileSync(outputPath, sql, 'utf-8');
    console.log(`💾 SQL also saved to: ${outputPath}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

prepareMigration();

