# Module 3: Goal-Based Investing - Testing Guide

**Date:** January 2025  
**Purpose:** Comprehensive testing guide for Module 3

---

## Testing Overview

This guide covers testing for all aspects of Module 3: Goal-Based Investing, including API endpoints, components, and integration testing.

---

## Prerequisites

1. ✅ Database migration completed
2. ✅ Server running (`npm run dev`)
3. ✅ At least one client exists in the database
4. ✅ Authentication working

---

## API Endpoint Testing

### 1. Create Goal

**Endpoint:** `POST /api/goals`  
**Auth:** Required

```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-id" \
  -d '{
    "clientId": 1,
    "name": "Retirement Fund",
    "type": "Retirement",
    "targetAmount": 5000000,
    "targetDate": "2030-01-01",
    "monthlyContribution": 50000,
    "priority": "High",
    "description": "Building retirement corpus"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "GOAL-20250114-12345",
    "clientId": 1,
    "name": "Retirement Fund",
    "type": "Retirement",
    "targetAmount": 5000000,
    "targetDate": "2030-01-01",
    "currentAmount": 0,
    "monthlyContribution": 50000,
    "progress": 0,
    "status": "Active",
    "priority": "High",
    ...
  },
  "message": "Goal created successfully"
}
```

**Test Cases:**
- ✅ Valid goal creation
- ✅ Missing required fields (should return 400)
- ✅ Invalid goal type (should return 400)
- ✅ Invalid target amount (should return 400)
- ✅ Invalid target date (should return 400)
- ✅ Unauthorized request (should return 401)

---

### 2. Get All Goals

**Endpoint:** `GET /api/goals?clientId=1`  
**Auth:** Not required

```bash
curl http://localhost:5000/api/goals?clientId=1
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "GOAL-20250114-12345",
      "name": "Retirement Fund",
      ...
    }
  ]
}
```

**Test Cases:**
- ✅ Get goals for valid client
- ✅ Get goals for non-existent client (should return empty array)
- ✅ Missing clientId parameter (should return 400)
- ✅ Invalid clientId format (should return 400)

---

### 3. Get Single Goal

**Endpoint:** `GET /api/goals/:id`  
**Auth:** Not required

```bash
curl http://localhost:5000/api/goals/GOAL-20250114-12345
```

**Test Cases:**
- ✅ Get existing goal
- ✅ Get non-existent goal (should return 404)
- ✅ Invalid goal ID format

---

### 4. Update Goal

**Endpoint:** `PUT /api/goals/:id`  
**Auth:** Required

```bash
curl -X PUT http://localhost:5000/api/goals/GOAL-20250114-12345 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-id" \
  -d '{
    "name": "Updated Retirement Fund",
    "targetAmount": 6000000,
    "priority": "Medium"
  }'
```

**Test Cases:**
- ✅ Update goal name
- ✅ Update target amount (should recalculate progress)
- ✅ Update status to Completed (should set completedAt)
- ✅ Update non-existent goal (should return 404)
- ✅ Unauthorized request (should return 401)

---

### 5. Delete Goal

**Endpoint:** `DELETE /api/goals/:id`  
**Auth:** Required

```bash
curl -X DELETE http://localhost:5000/api/goals/GOAL-20250114-12345 \
  -H "Cookie: connect.sid=your-session-id"
```

**Test Cases:**
- ✅ Delete existing goal
- ✅ Delete non-existent goal (should return 404)
- ✅ Verify cascade delete of allocations
- ✅ Unauthorized request (should return 401)

---

### 6. Allocate to Goal

**Endpoint:** `POST /api/goals/:id/allocate`  
**Auth:** Required

```bash
curl -X POST http://localhost:5000/api/goals/GOAL-20250114-12345/allocate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-id" \
  -d '{
    "transactionId": 123,
    "amount": 50000,
    "notes": "Monthly SIP contribution"
  }'
```

**Test Cases:**
- ✅ Allocate valid amount
- ✅ Verify goal progress updates
- ✅ Verify currentAmount increases
- ✅ Invalid amount (should return 400)
- ✅ Missing transactionId (should return 400)
- ✅ Allocate to non-existent goal (should return 404)

---

### 7. Get Goal Progress

**Endpoint:** `GET /api/goals/:id/progress`  
**Auth:** Not required

```bash
curl http://localhost:5000/api/goals/GOAL-20250114-12345/progress
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalId": "GOAL-20250114-12345",
    "currentAmount": 50000,
    "targetAmount": 5000000,
    "progress": 1.0,
    "monthsRemaining": 60,
    "projectedCompletion": "2030-01-01T00:00:00.000Z",
    "onTrack": true,
    "shortfall": 4950000
  }
}
```

**Test Cases:**
- ✅ Get progress for existing goal
- ✅ Verify calculations are correct
- ✅ Get progress for non-existent goal (should return 404)

---

### 8. Get Goal Recommendations

**Endpoint:** `GET /api/goals/recommendations?clientId=1`  
**Auth:** Not required

```bash
curl http://localhost:5000/api/goals/recommendations?clientId=1
```

**Test Cases:**
- ✅ Get recommendations for client with goals
- ✅ Get recommendations for client without goals (should return empty array)
- ✅ Missing clientId (should return 400)

---

## Component Testing

### 1. GoalCreationWizard

**Test Scenarios:**
- ✅ Open wizard dialog
- ✅ Fill step 1 (basic info)
- ✅ Navigate to step 2
- ✅ Go back to step 1
- ✅ Submit valid form
- ✅ Submit invalid form (should show errors)
- ✅ Cancel wizard
- ✅ Verify goal created after submission
- ✅ Verify dialog closes on success

**Manual Test Steps:**
1. Navigate to order management
2. Click "Create Goal" button
3. Fill in goal details
4. Click "Next"
5. Fill in additional details
6. Click "Create Goal"
7. Verify goal appears in list

---

### 2. GoalTrackingDashboard

**Test Scenarios:**
- ✅ Display goals list
- ✅ Filter by status
- ✅ Filter by type
- ✅ Search goals
- ✅ View statistics
- ✅ Create new goal
- ✅ Delete goal
- ✅ View goal details
- ✅ Empty state when no goals
- ✅ Loading state

**Manual Test Steps:**
1. Navigate to goals page
2. Verify goals are displayed
3. Test search functionality
4. Test filters
5. Verify statistics are correct
6. Create a new goal
7. Delete a goal
8. Verify updates reflect immediately

---

### 3. GoalCard

**Test Scenarios:**
- ✅ Display goal information correctly
- ✅ Show progress bar
- ✅ Show status badge
- ✅ Show priority badge
- ✅ Calculate months remaining
- ✅ Show shortfall
- ✅ Action menu works
- ✅ Edit action
- ✅ Delete action
- ✅ View details action

---

### 4. GoalAllocation

**Test Scenarios:**
- ✅ Open allocation dialog
- ✅ Select goal from dropdown
- ✅ Enter allocation amount
- ✅ Add notes
- ✅ Submit allocation
- ✅ Verify amount validation
- ✅ Verify goal progress updates
- ✅ Cancel allocation

**Manual Test Steps:**
1. Place an order
2. Click "Allocate to Goal"
3. Select a goal
4. Enter amount
5. Submit
6. Verify goal progress updated

---

### 5. GoalTimeline

**Test Scenarios:**
- ✅ Display timeline correctly
- ✅ Show milestones
- ✅ Show progress bar
- ✅ Calculate milestone dates
- ✅ Show projected completion
- ✅ Show time remaining
- ✅ Show on-track status
- ✅ Show shortfall warning

---

### 6. GoalRecommendations

**Test Scenarios:**
- ✅ Display recommendations
- ✅ Show priority badges
- ✅ Show recommended amounts
- ✅ Show scheme allocations
- ✅ Apply recommendation callback
- ✅ Loading state
- ✅ Error state
- ✅ Empty state

---

### 7. GoalSelector

**Test Scenarios:**
- ✅ Display goals in dropdown
- ✅ Select goal
- ✅ Show goal progress in dropdown
- ✅ Show "No Goal" option
- ✅ Handle no goals state
- ✅ Create new goal button
- ✅ Update selected goal

---

## Integration Testing

### End-to-End Flow 1: Create and Track Goal

1. **Create Goal**
   - Navigate to goals page
   - Click "Create Goal"
   - Fill form and submit
   - Verify goal appears in list

2. **View Goal Details**
   - Click on goal card
   - Verify timeline displays
   - Verify progress is 0%

3. **Allocate Order to Goal**
   - Place an order
   - Allocate to goal
   - Verify progress updates
   - Verify timeline updates

4. **View Recommendations**
   - Navigate to recommendations
   - Verify recommendations appear
   - Apply a recommendation
   - Verify goal updates

---

### End-to-End Flow 2: Goal-Based Order Placement

1. **Select Goal During Order**
   - Start placing order
   - Select goal from dropdown
   - Complete order
   - Verify order is allocated to goal

2. **Track Progress**
   - View goal dashboard
   - Verify progress increased
   - Verify timeline updated

---

## Performance Testing

### Load Testing

```bash
# Test creating multiple goals
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/goals \
    -H "Content-Type: application/json" \
    -d "{\"clientId\":1,\"name\":\"Goal $i\",\"type\":\"Retirement\",\"targetAmount\":1000000,\"targetDate\":\"2030-01-01\"}" &
done
```

### Query Performance

```sql
-- Test query performance with indexes
EXPLAIN ANALYZE
SELECT * FROM goals WHERE client_id = 1;

EXPLAIN ANALYZE
SELECT * FROM goals WHERE status = 'Active';

EXPLAIN ANALYZE
SELECT * FROM goal_allocations WHERE goal_id = 'GOAL-20250114-12345';
```

---

## Security Testing

### Authentication
- ✅ All write endpoints require authentication
- ✅ Unauthorized requests return 401
- ✅ Session validation works

### Authorization
- ✅ Users can only access their own client's goals
- ✅ Foreign key constraints prevent orphaned records
- ✅ Cascade deletes work correctly

### Input Validation
- ✅ SQL injection prevention (using parameterized queries)
- ✅ XSS prevention (React escapes by default)
- ✅ Type validation (Zod schemas)

---

## Test Checklist

### API Endpoints
- [ ] Create goal
- [ ] Get all goals
- [ ] Get single goal
- [ ] Update goal
- [ ] Delete goal
- [ ] Allocate to goal
- [ ] Get goal progress
- [ ] Get recommendations

### Components
- [ ] GoalCreationWizard
- [ ] GoalTrackingDashboard
- [ ] GoalCard
- [ ] GoalAllocation
- [ ] GoalTimeline
- [ ] GoalRecommendations
- [ ] GoalSelector

### Integration
- [ ] Create and track goal flow
- [ ] Goal-based order placement
- [ ] Order allocation flow
- [ ] Recommendations flow

### Edge Cases
- [ ] Empty states
- [ ] Error states
- [ ] Loading states
- [ ] Invalid inputs
- [ ] Network errors
- [ ] Large datasets

---

## Automated Testing (Future)

Consider adding:
- Unit tests for services
- Integration tests for API routes
- Component tests with React Testing Library
- E2E tests with Playwright

---

**Status:** Ready for testing  
**Estimated Time:** 2-3 hours for comprehensive testing

