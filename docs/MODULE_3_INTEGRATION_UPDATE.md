# Module 3: Goal-Based Investing - Integration Update

**Date:** January 2025  
**Status:** ✅ Updated to match refactored hooks API

---

## Summary

All goal components have been updated to work with the refactored `use-goals.ts` hook structure. The hook API was changed to return an object with multiple hooks/mutations instead of separate exported functions.

---

## Changes Made

### 1. Hook Structure Update (`use-goals.ts`)

**Before:**
- Separate exported functions: `useGoals()`, `useGoal()`, `useCreateGoal()`, etc.

**After:**
- `useGoals(clientId)` returns an object with:
  - `goals` - array of goals
  - `isLoadingGoals` - loading state
  - `createGoal` - mutation hook
  - `updateGoal` - mutation hook
  - `deleteGoal` - mutation hook
  - `allocateToGoal` - mutation hook
- Standalone hooks: `useGoal(goalId)`, `useGoalProgress(goalId)`, `useGoalRecommendations(clientId)`

### 2. Component Updates

#### `goal-tracking-dashboard.tsx`
- ✅ Updated to use `useGoals(clientId)` and destructure `goals`, `isLoadingGoals`, `deleteGoal`
- ✅ Changed `isLoading` to `isLoadingGoals`
- ✅ Updated imports to use shared types from `shared/types/order-management.types`

#### `goal-creation-wizard.tsx`
- ✅ Updated to use `createGoal` from `useGoals(clientId)`
- ✅ Updated to use `CreateGoalInput` interface
- ✅ Updated imports to use shared types

#### `goal-allocation.tsx`
- ✅ Updated to use `allocateToGoal` from `useGoals(clientId)`
- ✅ Updated `GoalSelector` import to named export
- ✅ Updated `GoalSelector` props to match new API
- ✅ Fixed `useGoalProgress` to handle null values

#### `goal-timeline.tsx`
- ✅ Updated to use standalone `useGoal()` hook
- ✅ Updated `useGoalProgress` to handle null values
- ✅ No changes needed - already using standalone hooks

#### `goal-recommendations.tsx`
- ✅ Updated to use standalone `useGoalRecommendations()` hook
- ✅ Updated imports to use shared types
- ✅ Removed unused `useGoal` import

#### `goal-card.tsx`
- ✅ Updated imports to use shared types

#### `goal-selector.tsx`
- ✅ Already updated by user - uses new API structure
- ✅ Changed to named export

### 3. Type Updates

All components now import types from:
```typescript
import { Goal, GoalType, GoalProgress, GoalRecommendation } from '../../../../../../shared/types/order-management.types';
```

Instead of:
```typescript
import { Goal, GoalType } from '../../types/order.types';
```

---

## API Usage Patterns

### Getting Goals for a Client
```typescript
const { goals, isLoadingGoals, createGoal, deleteGoal } = useGoals(clientId);
```

### Getting a Single Goal
```typescript
const { data: goal, isLoading } = useGoal(goalId);
```

### Creating a Goal
```typescript
const { createGoal } = useGoals(clientId);
await createGoal.mutateAsync({
  clientId,
  name: 'Retirement Fund',
  type: 'Retirement',
  targetAmount: 1000000,
  targetDate: '2030-01-01',
  // ... other fields
});
```

### Allocating to Goal
```typescript
const { allocateToGoal } = useGoals(clientId);
await allocateToGoal.mutateAsync({
  goalId: 'GOAL-20250101-12345',
  transactionId: 123,
  amount: 50000,
  notes: 'Monthly contribution'
});
```

### Getting Goal Progress
```typescript
const { data: progress } = useGoalProgress(goalId);
```

### Getting Recommendations
```typescript
const { data: recommendations } = useGoalRecommendations(clientId);
```

---

## Files Modified

1. ✅ `client/src/pages/order-management/hooks/use-goals.ts`
   - Added standalone `useGoal()` hook
   - Updated `useGoalProgress()` to handle null values
   - Removed unused `goalQuery` from return object

2. ✅ `client/src/pages/order-management/components/goals/goal-tracking-dashboard.tsx`
   - Updated hook usage
   - Updated type imports

3. ✅ `client/src/pages/order-management/components/goals/goal-creation-wizard.tsx`
   - Updated hook usage
   - Updated type imports
   - Updated mutation call

4. ✅ `client/src/pages/order-management/components/goals/goal-allocation.tsx`
   - Updated hook usage
   - Updated GoalSelector import and props
   - Fixed null handling

5. ✅ `client/src/pages/order-management/components/goals/goal-timeline.tsx`
   - Updated null handling

6. ✅ `client/src/pages/order-management/components/goals/goal-recommendations.tsx`
   - Updated type imports
   - Removed unused imports

7. ✅ `client/src/pages/order-management/components/goals/goal-card.tsx`
   - Updated type imports

8. ✅ `client/src/pages/order-management/components/goals/index.ts`
   - Updated GoalSelector export to named export

---

## Testing Checklist

- [x] All components compile without errors
- [x] Type imports updated to shared types
- [x] Hook API usage matches new structure
- [x] Null/undefined handling fixed
- [x] GoalSelector props updated
- [ ] Integration testing with actual API
- [ ] End-to-end testing of goal creation flow
- [ ] End-to-end testing of goal allocation flow

---

## Next Steps

1. **Run Database Migration**
   ```bash
   # Execute the SQL migration script
   psql -d your_database -f scripts/create-goals-table.sql
   ```

2. **Test API Endpoints**
   - Test all 8 goal API endpoints
   - Verify error handling
   - Test authentication middleware

3. **Integration Testing**
   - Test goal creation wizard
   - Test goal allocation flow
   - Test goal tracking dashboard
   - Test recommendations engine

4. **UI/UX Testing**
   - Test all components render correctly
   - Test responsive design
   - Test loading states
   - Test error states

---

## Notes

- All components now use shared types from `shared/types/order-management.types`
- The hook structure is more consistent and follows React Query best practices
- Standalone hooks (`useGoal`, `useGoalProgress`, `useGoalRecommendations`) don't require `clientId` and can be used independently
- The main `useGoals` hook groups related operations together for better code organization

---

**Status:** ✅ All components updated and ready for testing

