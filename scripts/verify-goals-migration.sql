-- Verification Script for Goals Module Migration
-- Run this after migration to verify tables are set up correctly

-- 1. Check if tables exist
SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') 
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_allocations')
    THEN 'PASS: Both tables exist'
    ELSE 'FAIL: Tables missing'
  END as result;

-- 2. Check goals table columns
SELECT 
  'Goals Table Columns' as check_type,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) >= 15 THEN 'PASS: All columns present'
    ELSE 'FAIL: Missing columns'
  END as result
FROM information_schema.columns
WHERE table_name = 'goals';

-- 3. Check goal_allocations table columns
SELECT 
  'Goal Allocations Table Columns' as check_type,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN 'PASS: All columns present'
    ELSE 'FAIL: Missing columns'
  END as result
FROM information_schema.columns
WHERE table_name = 'goal_allocations';

-- 4. Check foreign key constraints
SELECT 
  'Foreign Keys' as check_type,
  COUNT(*) as fk_count,
  CASE 
    WHEN COUNT(*) >= 2 THEN 'PASS: Foreign keys present'
    ELSE 'FAIL: Missing foreign keys'
  END as result
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('goals', 'goal_allocations')
  AND tc.constraint_type = 'FOREIGN KEY';

-- 5. Check indexes
SELECT 
  'Indexes' as check_type,
  COUNT(*) as index_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN 'PASS: All indexes present'
    ELSE 'FAIL: Missing indexes'
  END as result
FROM pg_indexes
WHERE tablename IN ('goals', 'goal_allocations');

-- 6. Check check constraints
SELECT 
  'Check Constraints' as check_type,
  COUNT(*) as constraint_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS: Check constraints present'
    ELSE 'FAIL: Missing check constraints'
  END as result
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('goals', 'goal_allocations')
  AND tc.constraint_type = 'CHECK';

-- 7. Detailed column check for goals table
SELECT 
  'Goals Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'goals'
ORDER BY ordinal_position;

-- 8. Detailed column check for goal_allocations table
SELECT 
  'Goal Allocations Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'goal_allocations'
ORDER BY ordinal_position;

-- 9. Summary
SELECT 
  'Migration Summary' as summary,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('goals', 'goal_allocations')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'goals') as goals_columns,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'goal_allocations') as allocations_columns,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('goals', 'goal_allocations')) as indexes_created,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('goals', 'goal_allocations')) = 2
      AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'goals') >= 15
      AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'goal_allocations') >= 6
    THEN '✅ Migration Successful'
    ELSE '❌ Migration Incomplete - Check above for details'
  END as status;

