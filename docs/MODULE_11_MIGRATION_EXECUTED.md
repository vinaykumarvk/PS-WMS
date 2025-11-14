# Module 11: Migration Execution Guide

**Date:** January 2025  
**Status:** Ready to Execute

---

## Quick Migration Steps

### Option 1: Supabase SQL Editor (Easiest) ✅

1. **Open SQL Editor**
   ```
   https://app.supabase.com/project/yihuqlzbhaptqjcgcpmh/sql
   ```

2. **Copy SQL**
   - File: `scripts/create-automation-tables.sql`
   - Or use: `scripts/automation-migration-ready.sql`

3. **Execute**
   - Paste SQL into editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify**
   ```bash
   npm run db:verify
   ```

### Option 2: Add Database Password

1. **Get Database Password**
   - Go to: https://app.supabase.com/project/yihuqlzbhaptqjcgcpmh/settings/database
   - Copy database password

2. **Add to .env**
   ```bash
   SUPABASE_DB_PASSWORD=your-password-here
   ```

3. **Run Migration**
   ```bash
   npm run db:push
   ```

4. **Verify**
   ```bash
   npm run db:verify
   ```

---

## SQL Files

- **Source:** `scripts/create-automation-tables.sql` (244 lines)
- **Ready:** `scripts/automation-migration-ready.sql` (formatted for copy-paste)

---

## Tables to be Created

1. `auto_invest_rules`
2. `rebalancing_rules`
3. `rebalancing_executions`
4. `trigger_orders`
5. `notification_preferences`
6. `notification_logs`
7. `in_app_notifications`
8. `automation_execution_logs`

---

## Verification

After migration, verify tables:

```bash
npm run db:verify
```

Or manually:

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

**Next:** Execute migration using one of the options above

