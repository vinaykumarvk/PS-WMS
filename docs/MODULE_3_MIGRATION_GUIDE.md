# Module 3: Goal-Based Investing - Migration Guide

**Date:** January 2025  
**Purpose:** Guide for setting up the goals database tables

---

## Overview

This guide will help you set up the database tables required for Module 3: Goal-Based Investing. The module requires two tables:
1. `goals` - Stores client financial goals
2. `goal_allocations` - Links transactions to goals

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
   ```

3. **Verify tables created**
   ```sql
   -- Run in Supabase SQL Editor or psql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('goals', 'goal_allocations');
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
   psql -d your_database -f scripts/create-goals-table.sql
   
   # Or copy-paste the SQL from scripts/create-goals-table.sql
   ```

3. **Verify tables created**
   ```sql
   \d goals
   \d goal_allocations
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
WHERE table_name IN ('goals', 'goal_allocations')
ORDER BY table_name, ordinal_position;
```

### 2. Check Indexes
```sql
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('goals', 'goal_allocations')
ORDER BY tablename, indexname;
```

### 3. Check Constraints
```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('goals', 'goal_allocations')
ORDER BY tc.table_name, tc.constraint_type;
```

### 4. Test Insert (Optional)
```sql
-- Test inserting a goal (replace client_id with actual client ID)
INSERT INTO goals (
  id, 
  client_id, 
  name, 
  type, 
  target_amount, 
  target_date
) VALUES (
  'GOAL-TEST-001',
  1,  -- Replace with actual client_id
  'Test Retirement Goal',
  'Retirement',
  1000000,
  '2030-01-01'
);

-- Verify insert
SELECT * FROM goals WHERE id = 'GOAL-TEST-001';

-- Clean up test data
DELETE FROM goals WHERE id = 'GOAL-TEST-001';
```

---

## Expected Schema

### Goals Table
```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Retirement', 'Child Education', 'House Purchase', 'Vacation', 'Emergency Fund', 'Other')),
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  target_date DATE NOT NULL,
  current_amount INTEGER DEFAULT 0 CHECK (current_amount >= 0),
  monthly_contribution INTEGER,
  schemes JSONB DEFAULT '[]'::jsonb,
  progress DOUBLE PRECISION DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused', 'Cancelled')),
  description TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Goal Allocations Table
```sql
CREATE TABLE goal_allocations (
  id SERIAL PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  allocated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);
```

### Indexes
- `idx_goals_client_id` on `goals(client_id)`
- `idx_goals_status` on `goals(status)`
- `idx_goals_type` on `goals(type)`
- `idx_goals_target_date` on `goals(target_date)`
- `idx_goal_allocations_goal_id` on `goal_allocations(goal_id)`
- `idx_goal_allocations_transaction_id` on `goal_allocations(transaction_id)`

---

## Troubleshooting

### Issue: Tables already exist
**Solution:** The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: Foreign key constraint fails
**Solution:** Ensure the `clients` table exists and has data. The `goals` table references `clients(id)`.

### Issue: Permission denied
**Solution:** Ensure your database user has CREATE TABLE permissions.

### Issue: Drizzle push doesn't create tables
**Solution:** 
1. Check that `shared/schema.ts` exports `goals` and `goal_allocations` tables
2. Verify environment variables are set correctly
3. Try manual SQL execution instead

---

## Post-Migration Steps

After successful migration:

1. **Test API Endpoints**
   ```bash
   # Start the server
   npm run dev
   
   # Test creating a goal (replace with actual client_id)
   curl -X POST http://localhost:5000/api/goals \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": 1,
       "name": "Test Goal",
       "type": "Retirement",
       "targetAmount": 1000000,
       "targetDate": "2030-01-01"
     }'
   ```

2. **Verify in Application**
   - Navigate to order management
   - Try creating a goal
   - Verify it appears in the goals list

3. **Check Logs**
   - Monitor server logs for any errors
   - Check browser console for frontend errors

---

## Rollback (If Needed)

If you need to remove the tables:

```sql
-- WARNING: This will delete all goals data!
DROP TABLE IF EXISTS goal_allocations CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
```

---

## Next Steps

After migration:
1. ✅ Run verification queries
2. ✅ Test API endpoints
3. ✅ Test goal creation in UI
4. ✅ Test goal allocation
5. ✅ Verify goal tracking works

---

**Status:** Ready for migration  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (uses IF NOT EXISTS)

