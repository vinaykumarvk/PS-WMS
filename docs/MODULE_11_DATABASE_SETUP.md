# Module 11: Automation Features - Database Setup Guide

**Date:** January 2025  
**Purpose:** Complete guide for setting up automation features database tables

---

## Prerequisites

Before setting up the database, ensure you have:

1. ✅ Database access credentials
2. ✅ PostgreSQL database (local or cloud)
3. ✅ Environment variables configured

---

## Step 1: Configure Environment Variables

### Option A: Direct Database Connection

Add to your `.env` file:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**Examples:**
- Local PostgreSQL: `postgresql://postgres:password@localhost:5432/wealthrm`
- Neon: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb`
- Railway: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

### Option B: Supabase Connection

Add to your `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_PASSWORD=your-database-password
```

**To find your Supabase database password:**
1. Go to https://app.supabase.com/project/your-project/settings/database
2. Under "Database password", click "Reset database password" or use existing password
3. Copy the password to your `.env` file

---

## Step 2: Choose Migration Method

### Method 1: Drizzle Kit Push (Recommended) ✅

This method automatically creates tables based on your schema:

```bash
npm run db:push
```

**What it does:**
- Reads schema from `shared/schema.ts`
- Creates/updates tables in your database
- Handles migrations automatically

**Expected output:**
```
✓ Pushed schema to database
✓ Created 8 tables
```

### Method 2: Manual SQL Execution

If Drizzle push doesn't work or you prefer manual control:

#### Using psql:

```bash
# Connect to database
psql -h your-host -U your-user -d your-database

# Run migration script
\i scripts/create-automation-tables.sql

# Or from command line
psql -d your_database -f scripts/create-automation-tables.sql
```

#### Using Supabase SQL Editor:

1. Go to: https://app.supabase.com/project/your-project/sql
2. Open `scripts/create-automation-tables.sql`
3. Copy all SQL content
4. Paste into SQL Editor
5. Click "Run" or press Cmd/Ctrl + Enter

---

## Step 3: Verify Tables Created

### Verification Query

Run this SQL to verify all tables were created:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
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
  )
ORDER BY table_name;
```

**Expected Result:** 8 rows, one for each table

### Check Table Structure

```sql
-- Check auto_invest_rules structure
\d auto_invest_rules

-- Check indexes
\di auto_invest_rules*
```

---

## Step 4: Verify Database Connection

Test your database connection:

```bash
# Check if server can connect
npm run dev

# Or test health endpoint
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "type": "drizzle"
}
```

---

## Troubleshooting

### Error: "DATABASE_URL not set"

**Solution:** Add `DATABASE_URL` or `SUPABASE_URL` + `SUPABASE_DB_PASSWORD` to `.env`

### Error: "Connection refused"

**Solution:** 
- Check database is running
- Verify connection string is correct
- Check firewall/network settings

### Error: "Table already exists"

**Solution:** 
- Tables use `IF NOT EXISTS`, so this shouldn't happen
- If it does, tables are already created - you're good!

### Error: "Permission denied"

**Solution:**
- Ensure database user has CREATE TABLE permissions
- Check user has access to the database

### Tables not appearing

**Solution:**
- Verify you're connected to the correct database
- Check schema name (should be 'public')
- Run verification query above

---

## Tables Created

### 1. `auto_invest_rules`
Stores auto-invest rules for clients
- **Key columns:** id, client_id, scheme_id, amount, frequency, status
- **Indexes:** client_id, status, next_execution_date, goal_id

### 2. `rebalancing_rules`
Stores rebalancing automation rules
- **Key columns:** id, client_id, strategy, target_allocation, threshold_percent
- **Indexes:** client_id, status

### 3. `rebalancing_executions`
Stores rebalancing execution history
- **Key columns:** id, rule_id, execution_date, status
- **Indexes:** rule_id, execution_date

### 4. `trigger_orders`
Stores trigger-based orders
- **Key columns:** id, client_id, trigger_type, trigger_value, order_type
- **Indexes:** client_id, status, trigger_type

### 5. `notification_preferences`
Stores notification preferences
- **Key columns:** id, client_id, event, channels, enabled
- **Indexes:** client_id, event

### 6. `notification_logs`
Stores notification delivery logs
- **Key columns:** id, client_id, event, channel, status, sent_at
- **Indexes:** client_id, event, sent_at

### 7. `in_app_notifications`
Stores in-app notifications
- **Key columns:** id, client_id, title, message, read, created_at
- **Indexes:** client_id, read, created_at

### 8. `automation_execution_logs`
Stores automation execution logs
- **Key columns:** id, automation_type, automation_id, client_id, status
- **Indexes:** automation_type, automation_id, client_id, execution_date

---

## Next Steps

After database setup:

1. ✅ **Verify tables** - Run verification queries
2. ✅ **Test API endpoints** - Test automation routes
3. ✅ **Run tests** - Execute test suite
4. ✅ **Start scheduler** - Enable automation scheduler

---

## Quick Reference

### Migration Commands

```bash
# Drizzle push
npm run db:push

# Manual SQL
psql -d your_database -f scripts/create-automation-tables.sql

# Verify tables
psql -d your_database -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%auto%' OR table_name LIKE '%notification%';"
```

### Files Reference

- **Schema:** `shared/schema.ts`
- **SQL Script:** `scripts/create-automation-tables.sql`
- **Setup Script:** `scripts/setup-automation-database.ts`
- **Migration Guide:** `docs/MODULE_11_MIGRATION_GUIDE.md`

---

**Status:** Ready for Database Setup  
**Next:** Configure environment variables and run migration

