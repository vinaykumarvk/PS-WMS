# Module 11: Automation Features - Migration Guide

**Date:** January 2025  
**Purpose:** Guide for setting up the automation features database tables

---

## Overview

This guide will help you set up the database tables required for Module 11: Automation Features. The module requires 8 tables:

1. `auto_invest_rules` - Stores auto-invest rules
2. `rebalancing_rules` - Stores rebalancing rules
3. `rebalancing_executions` - Stores rebalancing execution history
4. `trigger_orders` - Stores trigger-based orders
5. `notification_preferences` - Stores notification preferences
6. `notification_logs` - Stores notification delivery logs
7. `in_app_notifications` - Stores in-app notifications
8. `automation_execution_logs` - Stores automation execution logs

---

## Migration Options

### Option 1: Using Drizzle ORM (Recommended)

The project uses Drizzle ORM, and the schema is already defined in `shared/schema.ts`. The tables will be automatically created when you push the schema.

#### Steps:

1. **Ensure environment variables are set**
   ```bash
   # Check your .env file has:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   # OR
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. **Push schema to database**
   ```bash
   npm run db:push
   # OR
   npx drizzle-kit push
   ```

3. **Verify tables created**
   ```sql
   -- Run in Supabase SQL Editor or psql
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

### Option 2: Manual SQL Execution

If you prefer to run SQL manually or if Drizzle push doesn't work:

#### Steps:

1. **Connect to your database**
   ```bash
   # Using psql
   psql -h your-host -U your-user -d your-database
   
   # Or use Supabase SQL Editor
   # Navigate to: https://app.supabase.com/project/your-project/sql
   ```

2. **Run the migration script**
   ```bash
   # From project root
   psql -d your_database -f scripts/create-automation-tables.sql
   
   # Or copy-paste the SQL from scripts/create-automation-tables.sql
   ```

3. **Verify tables created**
   ```sql
   \d auto_invest_rules
   \d rebalancing_rules
   \d trigger_orders
   -- etc.
   ```

---

## Verification Queries

After migration, run these queries to verify everything is set up correctly:

### 1. Check Tables Exist
```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
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
ORDER BY table_name, ordinal_position;
```

### 2. Check Indexes
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'auto_invest_rules',
  'rebalancing_rules',
  'rebalancing_executions',
  'trigger_orders',
  'notification_preferences',
  'notification_logs',
  'in_app_notifications',
  'automation_execution_logs'
)
ORDER BY tablename, indexname;
```

### 3. Check Foreign Keys
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
  'auto_invest_rules',
  'rebalancing_rules',
  'rebalancing_executions',
  'trigger_orders',
  'notification_preferences',
  'notification_logs',
  'in_app_notifications',
  'automation_execution_logs'
)
ORDER BY tc.table_name;
```

---

## Table Descriptions

### auto_invest_rules
Stores automated investment rules that execute based on triggers (date, goal progress, portfolio drift, market conditions).

**Key Fields:**
- `id` - Unique rule identifier
- `client_id` - Reference to client
- `scheme_id` - Mutual fund scheme to invest in
- `amount` - Investment amount
- `frequency` - Execution frequency (Daily, Weekly, Monthly, Quarterly)
- `trigger_type` - Type of trigger condition
- `next_execution_date` - When rule should execute next

### rebalancing_rules
Stores portfolio rebalancing rules that maintain target asset allocation.

**Key Fields:**
- `id` - Unique rule identifier
- `client_id` - Reference to client
- `target_allocation` - JSON object with target percentages
- `threshold_percent` - Drift threshold to trigger rebalancing
- `execute_automatically` - Whether to execute without confirmation

### trigger_orders
Stores orders that execute automatically when trigger conditions are met.

**Key Fields:**
- `id` - Unique order identifier
- `trigger_type` - Type of trigger (Price, NAV, Portfolio Value, etc.)
- `trigger_condition` - Condition operator (Greater Than, Less Than, etc.)
- `trigger_value` - Value threshold
- `order_type` - Type of order (Purchase, Redemption, Switch)

### notification_preferences
Stores user preferences for receiving notifications.

**Key Fields:**
- `event` - Event type to notify about
- `channels` - Array of notification channels (Email, SMS, Push, In-App)
- `quiet_hours` - Time range when notifications should be suppressed
- `enabled` - Whether preference is active

---

## Troubleshooting

### Issue: Tables already exist
**Solution:** The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: Foreign key constraint fails
**Solution:** Ensure the referenced tables exist:
- `clients` table must exist
- `products` table must exist (for schemes)
- `goals` table must exist (optional, for goal-linked rules)
- `users` table must exist

### Issue: Permission denied
**Solution:** Ensure your database user has CREATE TABLE permissions.

### Issue: Drizzle push doesn't create tables
**Solution:** 
1. Check database connection string
2. Verify user has CREATE permissions
3. Try manual SQL execution instead

### Issue: JSONB columns causing errors
**Solution:** Ensure PostgreSQL version is 9.4+ (JSONB support required).

---

## Rollback

If you need to rollback the migration:

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS automation_execution_logs CASCADE;
DROP TABLE IF EXISTS in_app_notifications CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS trigger_orders CASCADE;
DROP TABLE IF EXISTS rebalancing_executions CASCADE;
DROP TABLE IF EXISTS rebalancing_rules CASCADE;
DROP TABLE IF EXISTS auto_invest_rules CASCADE;
```

**Warning:** This will delete all automation data. Use with caution!

---

## Next Steps

After successful migration:

1. **Test API Endpoints**
   - Create an auto-invest rule via API
   - Create a rebalancing rule
   - Create a trigger order
   - Set notification preferences

2. **Set Up Scheduler**
   - Configure cron jobs for automation execution
   - See `docs/MODULE_11_SCHEDULER_SETUP.md`

3. **Run Tests**
   - Execute unit tests
   - Run integration tests
   - Perform E2E testing

---

**Migration Status:** Ready to execute  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (uses IF NOT EXISTS)

