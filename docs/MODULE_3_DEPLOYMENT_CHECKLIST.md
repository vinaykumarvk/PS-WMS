# Module 3: Goal-Based Investing - Deployment Checklist

**Date:** January 2025  
**Status:** ✅ Ready for Deployment

---

## Pre-Deployment Checklist

### ✅ Code Complete
- [x] All components implemented
- [x] All hooks implemented
- [x] All services implemented
- [x] All API routes implemented
- [x] Type definitions complete
- [x] No linter errors
- [x] No TypeScript errors

### ✅ Database Schema
- [x] Goals table schema defined
- [x] Goal allocations table schema defined
- [x] Migration script created
- [x] Verification script created
- [x] Indexes defined
- [x] Constraints defined

### ✅ Documentation
- [x] Migration guide created
- [x] Testing guide created
- [x] Quick start guide created
- [x] API documentation complete
- [x] Component documentation complete

---

## Deployment Steps

### 1. Database Migration

**Option A: Drizzle Push (Recommended)**
```bash
npm run db:push
```

**Option B: Manual SQL**
```bash
psql -d your_database -f scripts/create-goals-table.sql
```

**Verify:**
```bash
psql -d your_database -f scripts/verify-goals-migration.sql
```

### 2. Environment Variables

Ensure these are set:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# OR
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Build and Deploy

```bash
# Build
npm run build

# Start production server
npm start
```

### 4. Smoke Tests

```bash
# Test API health
curl http://localhost:5000/api/health

# Test goals endpoint
curl http://localhost:5000/api/goals?clientId=1
```

---

## Post-Deployment Verification

### API Endpoints
- [ ] POST /api/goals - Create goal
- [ ] GET /api/goals - List goals
- [ ] GET /api/goals/:id - Get goal
- [ ] PUT /api/goals/:id - Update goal
- [ ] DELETE /api/goals/:id - Delete goal
- [ ] POST /api/goals/:id/allocate - Allocate
- [ ] GET /api/goals/:id/progress - Progress
- [ ] GET /api/goals/recommendations - Recommendations

### UI Components
- [ ] GoalCreationWizard renders
- [ ] GoalTrackingDashboard renders
- [ ] GoalCard displays correctly
- [ ] GoalAllocation dialog works
- [ ] GoalTimeline displays
- [ ] GoalRecommendations displays
- [ ] GoalSelector works

### Functionality
- [ ] Can create goal
- [ ] Can view goals
- [ ] Can update goal
- [ ] Can delete goal
- [ ] Can allocate order to goal
- [ ] Progress updates correctly
- [ ] Recommendations appear
- [ ] Timeline displays correctly

---

## Rollback Plan

If issues occur:

1. **Disable Routes** (Temporary)
   ```typescript
   // Comment out in server/routes.ts
   // app.post("/api/goals", authMiddleware, goalRoutes.createGoal);
   // ... etc
   ```

2. **Remove Tables** (If needed)
   ```sql
   DROP TABLE IF EXISTS goal_allocations CASCADE;
   DROP TABLE IF EXISTS goals CASCADE;
   ```

3. **Revert Code** (Git)
   ```bash
   git revert <commit-hash>
   ```

---

## Monitoring

### Key Metrics to Monitor

1. **API Performance**
   - Response times
   - Error rates
   - Request counts

2. **Database Performance**
   - Query execution times
   - Index usage
   - Table sizes

3. **User Activity**
   - Goals created per day
   - Allocations per day
   - Recommendations viewed

### Logs to Check

- Server logs for API errors
- Database logs for query issues
- Browser console for frontend errors

---

## Support Resources

### Documentation
- Migration Guide: `docs/MODULE_3_MIGRATION_GUIDE.md`
- Testing Guide: `docs/MODULE_3_TESTING_GUIDE.md`
- Quick Start: `docs/MODULE_3_QUICK_START.md`

### Code Locations
- Components: `client/src/pages/order-management/components/goals/`
- Hooks: `client/src/pages/order-management/hooks/use-goals.ts`
- Services: `server/services/goal-service.ts`
- Routes: `server/routes/goals.ts`
- Schema: `shared/schema.ts` (goals, goalAllocations)

---

## Success Criteria

✅ **Deployment Successful If:**
- All API endpoints respond correctly
- Database tables created successfully
- Components render without errors
- Can create and manage goals
- Progress tracking works
- Recommendations display

---

## Estimated Deployment Time

- **Database Migration:** 5 minutes
- **Build & Deploy:** 10 minutes
- **Smoke Tests:** 10 minutes
- **Full Verification:** 30 minutes

**Total:** ~1 hour

---

**Status:** ✅ Ready for Production Deployment

