# Module 11: Automation Features - Scheduler Setup Guide

**Date:** January 2025  
**Purpose:** Guide for setting up and configuring the automation scheduler

---

## Overview

The automation scheduler is responsible for executing automation rules automatically:
- Auto-invest rules (scheduled investments)
- Rebalancing rules (portfolio rebalancing)
- Trigger orders (condition-based orders)

---

## Scheduler Architecture

The scheduler runs as part of the Node.js server process and checks for automation rules that need execution at regular intervals.

### Components

1. **Automation Scheduler Service** (`server/services/automation-scheduler-service.ts`)
   - Main scheduler loop
   - Processes all automation types
   - Handles execution and error logging

2. **Automation Service** (`server/services/automation-service.ts`)
   - Business logic for rule execution
   - Order creation
   - Status updates

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Enable/disable automation scheduler (default: enabled)
AUTOMATION_SCHEDULER_ENABLED=true

# Check interval in milliseconds (default: 3600000 = 1 hour)
AUTOMATION_CHECK_INTERVAL=3600000

# For production, consider:
# AUTOMATION_CHECK_INTERVAL=1800000  # 30 minutes
# AUTOMATION_CHECK_INTERVAL=900000   # 15 minutes
```

### Recommended Intervals

- **Development:** 1 hour (3600000 ms)
- **Staging:** 30 minutes (1800000 ms)
- **Production:** 15 minutes (900000 ms) or less

---

## Starting the Scheduler

### Automatic Start (Default)

The scheduler starts automatically when the server starts (if `AUTOMATION_SCHEDULER_ENABLED` is not `false`).

```bash
npm start
# or
npm run dev
```

### Manual Start

You can also start/stop the scheduler programmatically:

```typescript
import { startScheduler, stopScheduler } from './services/automation-scheduler-service';

// Start scheduler
startScheduler();

// Stop scheduler
stopScheduler();
```

---

## Scheduler Behavior

### Execution Flow

1. **Scheduler Loop Runs** (every CHECK_INTERVAL)
   - Checks auto-invest rules scheduled for today
   - Checks rebalancing rules that need execution
   - Checks trigger orders for conditions met

2. **Rule Execution**
   - Validates rule is active and enabled
   - Checks trigger conditions
   - Creates orders via order service
   - Updates rule status and execution count
   - Logs execution results

3. **Error Handling**
   - Failed executions are logged
   - Rules remain active for retry
   - Errors don't stop scheduler loop

### Execution Times

- **Auto-Invest Rules:** Execute on `next_execution_date`
- **Rebalancing Rules:** Execute when drift threshold exceeded or schedule matches
- **Trigger Orders:** Execute when trigger conditions are met

---

## Manual Execution (Testing/Admin)

### API Endpoints

#### Execute Auto-Invest Rule
```bash
POST /api/automation/scheduler/execute
Content-Type: application/json

{
  "type": "auto-invest",
  "ruleId": "AUTO-20250101-12345"
}
```

#### Check Rebalancing
```bash
POST /api/automation/scheduler/execute
Content-Type: application/json

{
  "type": "rebalancing",
  "ruleId": "REBAL-20250101-12345"
}
```

#### Check Trigger Orders
```bash
POST /api/automation/scheduler/execute
Content-Type: application/json

{
  "type": "triggers",
  "clientId": 123  # optional
}
```

#### Get Scheduler Status
```bash
GET /api/automation/scheduler/status
```

Response:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "checkInterval": "3600000"
  }
}
```

---

## Production Deployment

### Option 1: In-Process Scheduler (Current)

**Pros:**
- Simple setup
- No external dependencies
- Integrated with application

**Cons:**
- Stops if server restarts
- Shares resources with web server
- Single point of failure

**Use Case:** Small to medium deployments

### Option 2: External Cron Job

For production, consider using external cron jobs:

```bash
# Add to crontab (runs every hour)
0 * * * * curl -X POST http://localhost:3000/api/automation/scheduler/execute -H "Content-Type: application/json" -d '{"type":"auto-invest"}'
```

### Option 3: Dedicated Worker Process

For large-scale deployments:

1. Create separate worker process
2. Use message queue (Redis, RabbitMQ)
3. Scale workers independently

---

## Monitoring

### Logs

The scheduler logs all activities:

```
[Automation Scheduler] Starting scheduler (check interval: 3600000ms)
[Automation Scheduler] Running scheduled checks...
[Automation Scheduler] Processing auto-invest rules...
[Automation Scheduler] Executing auto-invest rule: AUTO-20250101-12345
[Automation Scheduler] Auto-invest rule AUTO-20250101-12345 executed successfully. Order ID: ORD-123
[Automation Scheduler] Scheduled checks completed
```

### Execution Logs

Check execution logs via API:

```bash
GET /api/automation/execution-logs?clientId=123&automationType=AutoInvest
```

### Database Queries

Check recent executions:

```sql
SELECT * FROM automation_execution_logs
WHERE execution_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Troubleshooting

### Scheduler Not Running

1. Check environment variable:
   ```bash
   echo $AUTOMATION_SCHEDULER_ENABLED
   ```

2. Check server logs for startup messages

3. Check scheduler status:
   ```bash
   curl http://localhost:3000/api/automation/scheduler/status
   ```

### Rules Not Executing

1. **Check Rule Status:**
   ```sql
   SELECT id, name, status, is_enabled, next_execution_date
   FROM auto_invest_rules
   WHERE next_execution_date <= CURRENT_DATE
   AND status = 'Active'
   AND is_enabled = true;
   ```

2. **Check Execution Logs:**
   ```sql
   SELECT * FROM automation_execution_logs
   WHERE automation_id = 'RULE-ID'
   ORDER BY created_at DESC;
   ```

3. **Manual Execution Test:**
   ```bash
   POST /api/automation/scheduler/execute
   { "type": "auto-invest", "ruleId": "RULE-ID" }
   ```

### High CPU/Memory Usage

1. Increase check interval
2. Add rate limiting
3. Process rules in batches
4. Consider external worker process

---

## Best Practices

1. **Start with Longer Intervals**
   - Begin with 1 hour checks
   - Reduce based on needs

2. **Monitor Execution Logs**
   - Set up alerts for failures
   - Track execution success rates

3. **Test Thoroughly**
   - Test rules in staging first
   - Use manual execution for testing

4. **Set Reasonable Limits**
   - Use `max_total_amount` for auto-invest rules
   - Set `require_confirmation` for rebalancing

5. **Error Handling**
   - Rules continue after failures
   - Check logs regularly
   - Set up monitoring alerts

---

## Security Considerations

1. **Authentication Required**
   - Manual execution endpoints require auth
   - Use `authMiddleware` for admin routes

2. **Rate Limiting**
   - Consider rate limiting for manual execution
   - Prevent abuse of scheduler endpoints

3. **Audit Logging**
   - All executions are logged
   - Track who triggered manual executions

---

## Next Steps

1. **Set Up Monitoring**
   - Configure alerts for failures
   - Set up dashboards for execution metrics

2. **Optimize Performance**
   - Add database indexes
   - Optimize queries
   - Consider caching

3. **Scale as Needed**
   - Monitor execution times
   - Consider external worker if needed

---

**Scheduler Status:** Ready to use  
**Default Interval:** 1 hour  
**Production Ready:** Yes (with monitoring)

