# Phase 2: Scenario Toggles Implementation

## Status: ✅ Core Implementation Complete

**Date:** January 2025  
**Phase:** 2 of 5

---

## ✅ Completed Components

### 1. Dashboard Filter Context (`dashboard-filter-context.tsx`)
- **Status:** ✅ Complete
- **Features:**
  - React Context for managing filter state
  - LocalStorage persistence
  - Toggle, clear, and check filter functions
  - Type-safe filter definitions

### 2. Scenario Toggles Component (`scenario-toggles.tsx`)
- **Status:** ✅ Complete
- **Features:**
  - 6 scenario filters:
    - Expiring KYC (risk profiles expiring within 30 days)
    - Overdue Tasks
    - High-Value Opportunities (prospects > ₹1Cr)
    - Clients Needing Attention (low activity)
    - Upcoming Reviews (next 7 days)
    - Critical Alerts
  - Visual toggle buttons with icons
  - Active filter indicators
  - Clear all filters functionality
  - Filter count display

### 3. Integration
- **Status:** ✅ Complete
- **Changes:**
  - Added `DashboardFilterProvider` to App.tsx
  - Integrated `ScenarioToggles` into dashboard layout
  - Positioned below Goals vs Actuals ribbon

---

## 🚧 Next Steps: Filter Logic Implementation

### Components to Update

1. **TodaysBriefingTimeline** - Filter by:
   - `overdue-tasks` - Show only overdue tasks
   - `critical-alerts` - Show only critical alerts

2. **OpportunityHighlights** - Filter by:
   - `high-value-opportunities` - Show only prospects > ₹1Cr

3. **RelationshipInsights** - Filter by:
   - `expiring-kyc` - Show clients with expiring risk profiles
   - `clients-needing-attention` - Show clients with low activity
   - `upcoming-reviews` - Show clients with reviews in next 7 days

4. **GoalsVsActualsRibbon** - Could highlight metrics affected by filters

### API Endpoints Needed

1. **`GET /api/clients/expiring-kyc`** - Clients with expiring risk profiles
   - Query risk_assessment table for expiry_date within 30 days
   - Return client IDs or full client objects

2. **`GET /api/tasks/overdue`** - Overdue tasks
   - Filter tasks where due_date < today AND completed = false
   - Return task list

3. **`GET /api/prospects/high-value`** - High-value prospects
   - Filter prospects where potential_aum_value > 10000000 (₹1Cr)
   - Return prospect list

### Implementation Strategy

1. **Update Components** to use `useDashboardFilters()` hook
2. **Add Filter Logic** to each component's data processing
3. **Create API Endpoints** for filtered data (optional - can filter client-side)
4. **Test Filter Combinations** - ensure multiple filters work together

---

## 📝 Example Filter Implementation

### For RelationshipInsights Component:

```typescript
import { useDashboardFilters } from "@/context/dashboard-filter-context";

export function RelationshipInsights({ className, maxItems = 5 }: RelationshipInsightsProps) {
  const { activeFilters, hasFilter } = useDashboardFilters();
  
  // ... existing code ...
  
  const getRelationshipInsights = (): RelationshipInsight[] => {
    // ... existing calculation ...
    
    let filteredInsights = insights;
    
    // Apply expiring-kyc filter
    if (hasFilter('expiring-kyc')) {
      filteredInsights = filteredInsights.filter(insight => {
        // Check if client has expiring risk profile
        // This would require API call or data from risk_assessment
        return insight.hasExpiringKYC;
      });
    }
    
    // Apply clients-needing-attention filter
    if (hasFilter('clients-needing-attention')) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.needsAttention
      );
    }
    
    // Apply upcoming-reviews filter
    if (hasFilter('upcoming-reviews')) {
      filteredInsights = filteredInsights.filter(insight => {
        if (!insight.nextReviewDate) return false;
        const daysUntilReview = Math.ceil(
          (new Date(insight.nextReviewDate).getTime() - Date.now()) / 
          (1000 * 60 * 60 * 24)
        );
        return daysUntilReview <= 7 && daysUntilReview >= 0;
      });
    }
    
    return filteredInsights.slice(0, maxItems);
  };
  
  // ... rest of component ...
}
```

---

## 🎯 Acceptance Criteria Status

- [x] Toggle buttons render correctly
- [x] Filter state persists (localStorage)
- [x] Visual feedback for active filters
- [x] Multiple filters can be active simultaneously
- [x] Clear filters functionality
- [ ] Filters apply to all components (IN PROGRESS)
- [ ] Filter combinations work correctly (PENDING)

---

## 📦 Files Created/Modified

### New Files
- `client/src/context/dashboard-filter-context.tsx`
- `client/src/components/dashboard/scenario-toggles.tsx`
- `docs/PHASE_2_SCENARIO_TOGGLES_IMPLEMENTATION.md`

### Modified Files
- `client/src/App.tsx` - Added DashboardFilterProvider
- `client/src/pages/dashboard.tsx` - Added ScenarioToggles component

---

## 🔍 Testing Status

- ✅ Build successful (no compilation errors)
- ✅ No linter errors
- ⏳ Filter logic implementation (IN PROGRESS)
- ⏳ Component integration tests (PENDING)
- ⏳ Filter persistence tests (PENDING)

---

## 💡 Notes

- Filter state persists in localStorage, so filters remain active across page refreshes
- Multiple filters can be active simultaneously - components should show items matching ANY active filter (OR logic) or ALL active filters (AND logic) depending on use case
- For now, filtering can be done client-side. API endpoints can be added later for performance optimization with large datasets

---

## 🚀 Next Actions

1. Update `TodaysBriefingTimeline` to respect filters
2. Update `OpportunityHighlights` to respect filters
3. Update `RelationshipInsights` to respect filters
4. Add API endpoints for filtered data (optional)
5. Test filter combinations
6. Add visual indicators when filters are active

