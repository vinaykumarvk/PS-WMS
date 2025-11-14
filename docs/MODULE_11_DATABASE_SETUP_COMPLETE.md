# Module 11: Database Setup - Complete Guide

**Date:** January 2025  
**Status:** Ready for Setup

---

## Quick Start

### 1. Configure Environment

Add to `.env`:

```bash
# Option A: Direct connection
DATABASE_URL=postgresql://user:password@host:port/database

# Option B: Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_PASSWORD=your-password
```

### 2. Run Migration

```bash
# Method 1: Drizzle (Recommended)
npm run db:push

# Method 2: Manual SQL
psql -d your_database -f scripts/create-automation-tables.sql
```

### 3. Verify Setup

```bash
npm run db:verify
```

---

## Available Commands

### Database Setup Commands

```bash
# Show setup instructions
npm run db:setup

# Push schema to database (Drizzle)
npm run db:push

# Verify tables exist
npm run db:verify
```

---

## Migration Methods

### Method 1: Drizzle Kit Push ✅ Recommended

**Pros:**
- Automatic schema sync
- Handles migrations
- Type-safe

**Command:**
```bash
npm run db:push
```

**Requirements:**
- `DATABASE_URL` or `SUPABASE_URL` + `SUPABASE_DB_PASSWORD` in `.env`

### Method 2: Manual SQL Execution

**Pros:**
- Full control
- Can review SQL first
- Works with any PostgreSQL client

**Command:**
```bash
psql -d your_database -f scripts/create-automation-tables.sql
```

**Or use Supabase SQL Editor:**
1. Go to: https://app.supabase.com/project/your-project/sql
2. Copy content from `scripts/create-automation-tables.sql`
3. Paste and execute

---

## Verification

### Automated Verification

```bash
npm run db:verify
```

**Expected Output:**
```
✅ All automation tables are present!
📈 Found 8/8 tables

📋 Table Details:
   auto_invest_rules: 20 columns
   rebalancing_rules: 15 columns
   ...
```

### Manual Verification

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'auto_invest_rules',
    'rebalancing_rules',
    'rebalancing_executions',
    'trigger_orders',
    'notification_preferences',
    'notification_logs',
    'in_app_notifications',
    'automation_execution_logs'
  );
```

---

## Troubleshooting

### "DATABASE_URL not set"

**Solution:** Add database connection to `.env`

### "Connection refused"

**Solution:** 
- Check database is running
- Verify connection string
- Check network/firewall

### "Permission denied"

**Solution:**
- Ensure user has CREATE TABLE permission
- Check database access

### Tables not found after migration

**Solution:**
- Run verification: `npm run db:verify`
- Check you're connected to correct database
- Verify schema name is 'public'

---

## Files Reference

- **Schema Definition:** `shared/schema.ts`
- **SQL Script:** `scripts/create-automation-tables.sql`
- **Setup Helper:** `scripts/setup-automation-database.ts`
- **Verification Script:** `scripts/verify-automation-tables.ts`
- **Migration Guide:** `docs/MODULE_11_MIGRATION_GUIDE.md`
- **Database Setup Guide:** `docs/MODULE_11_DATABASE_SETUP.md`

---

## Next Steps After Setup

1. ✅ **Verify tables** - Run `npm run db:verify`
2. ✅ **Test API** - Test automation endpoints
3. ✅ **Run tests** - Execute test suite
4. ✅ **Start server** - Begin using automation features

---

**Status:** Ready for Database Setup  
**Commands:** `npm run db:setup` | `npm run db:push` | `npm run db:verify`

