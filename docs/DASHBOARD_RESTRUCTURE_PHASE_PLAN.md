# Dashboard Restructure Phase Plan: RM's Daily Storyline

## Overview
Transform the dashboard from a grid of independent widgets into a guided narrative that follows an RM's daily workflow. This restructure will improve user experience by presenting information in a logical, actionable sequence.

## Current State Analysis

### Current Dashboard Structure
1. **HeroMetrics** (not currently used in main dashboard)
2. **ActionItemsPriorities** - Shows appointments, tasks, closures, alerts, complaints
3. **TalkingPointsCard** - Market insights
4. **AnnouncementsCard** - Regulatory updates
5. **BusinessSnapshotStructured** - AUM, clients, revenue, pipeline metrics
6. **PerformanceCard** - Performance metrics and trends

### Issues Identified
- Five separate queries rendered as independent cards with similar weight
- Feels like a grid of widgets rather than a guided start to the day
- No clear prioritization or narrative flow
- Missing goals vs actuals visibility
- No scenario-based filtering
- Quick actions not integrated with workflow

## Target Structure

### New Dashboard Layout (Top to Bottom)
1. **Top Ribbon: Goals vs Actuals** - Quick view of performance against targets
2. **Today's Briefing Timeline** - Chronological view of meetings and critical alerts
3. **Opportunity Highlights** - Key prospects and pipeline opportunities
4. **Relationship Insights** - Client relationship health and insights
5. **Scenario Toggles** - Filter views (e.g., "Show clients with expiring KYC")
6. **Quick Actions** - Workflow-integrated actions

---

## Phase 1: Core Component Development (Week 1-2)

### 1.1 Goals vs Actuals Ribbon Component
**Priority: High**  
**Risk Level: Low** (New component, no existing dependencies)

**Requirements:**
- Display key metrics: AUM, Clients, Revenue, Pipeline
- Show actual vs target with progress indicators
- Visual progress bars/gauges
- Color coding (green = on track, yellow = at risk, red = behind)
- Click to drill down to detailed metrics

**API Dependencies:**
- `/api/business-metrics/1` (existing)
- `/api/performance` (existing)
- `/api/performance-metrics` (existing)
- May need new endpoint: `/api/goals/summary` for RM-level goals

**Component:** `client/src/components/dashboard/goals-vs-actuals-ribbon.tsx`

**Acceptance Criteria:**
- [ ] Component renders with 4 key metrics
- [ ] Progress indicators show actual vs target
- [ ] Color coding reflects performance status
- [ ] Responsive design (mobile-friendly)
- [ ] Loading states handled
- [ ] Error states handled

**Testing:**
- Unit tests for component rendering
- Integration tests with API mocks
- Visual regression tests

---

### 1.2 Today's Briefing Timeline Component
**Priority: High**  
**Risk Level: Low** (Uses existing APIs)

**Requirements:**
- Chronological timeline view (morning to evening)
- Combine meetings and critical alerts in one timeline
- Visual timeline with time markers
- Color coding by type (meeting, alert, task)
- Quick actions (reschedule, dismiss, view details)
- Expandable items for more details

**API Dependencies:**
- `/api/appointments/today` (existing)
- `/api/portfolio-alerts` (existing) - filter for critical/high priority
- `/api/tasks` (existing) - filter for today's tasks

**Component:** `client/src/components/dashboard/todays-briefing-timeline.tsx`

**Acceptance Criteria:**
- [ ] Timeline shows chronological order
- [ ] Meetings and alerts integrated seamlessly
- [ ] Time markers visible
- [ ] Expandable details work
- [ ] Quick actions functional
- [ ] Empty states handled
- [ ] Responsive design

**Testing:**
- Unit tests for timeline rendering
- Integration tests with mock data
- Test chronological sorting
- Test filtering logic

---

### 1.3 Opportunity Highlights Component
**Priority: Medium**  
**Risk Level: Low** (Uses existing APIs)

**Requirements:**
- Show top 5-10 prospects by value/probability
- Pipeline stage indicators
- Expected close dates
- Quick actions (view prospect, schedule meeting, update stage)
- Visual pipeline representation

**API Dependencies:**
- `/api/prospects` (existing)
- `/api/action-items/deal-closures` (existing)
- May need: `/api/prospects/highlights` for optimized query

**Component:** `client/src/components/dashboard/opportunity-highlights.tsx`

**Acceptance Criteria:**
- [ ] Shows top opportunities
- [ ] Pipeline stages visible
- [ ] Quick actions work
- [ ] Links to prospect details
- [ ] Empty states handled
- [ ] Responsive design

**Testing:**
- Unit tests for component
- Integration tests with prospect data
- Test sorting/filtering logic

---

### 1.4 Relationship Insights Component
**Priority: Medium**  
**Risk Level: Low** (Uses existing APIs)

**Requirements:**
- Client relationship health indicators
- Recent activity summary
- Upcoming milestones (anniversaries, reviews)
- Risk profile changes
- Communication frequency insights
- Quick actions (schedule review, send message)

**API Dependencies:**
- `/api/clients` (existing)
- `/api/business-metrics/1` (existing)
- May need: `/api/clients/insights` for relationship data

**Component:** `client/src/components/dashboard/relationship-insights.tsx`

**Acceptance Criteria:**
- [ ] Shows relationship health indicators
- [ ] Recent activity visible
- [ ] Milestones highlighted
- [ ] Quick actions functional
- [ ] Empty states handled
- [ ] Responsive design

**Testing:**
- Unit tests for component
- Integration tests with client data
- Test insight calculation logic

---

## Phase 2: Scenario Toggles & Filtering (Week 2-3)

### 2.1 Scenario Toggle System
**Priority: Medium**  
**Risk Level: Medium** (Requires new filtering logic)

**Requirements:**
- Toggle buttons for common scenarios
- Examples:
  - "Show clients with expiring KYC" (risk profile expiry)
  - "Show overdue tasks"
  - "Show high-value opportunities"
  - "Show clients needing attention"
- Filter affects all dashboard components
- State persists in URL params or localStorage
- Visual indication of active filters

**API Dependencies:**
- May need new endpoints:
  - `/api/clients/expiring-kyc` - Clients with expiring risk profiles
  - `/api/tasks/overdue` - Overdue tasks
  - `/api/prospects/high-value` - High-value prospects

**Component:** `client/src/components/dashboard/scenario-toggles.tsx`

**Implementation:**
- Create filter context/provider
- Update existing components to respect filters
- Add filter badges/chips
- Persist filter state

**Acceptance Criteria:**
- [ ] Toggle buttons render correctly
- [ ] Filters apply to all components
- [ ] State persists appropriately
- [ ] Visual feedback for active filters
- [ ] Multiple filters can be active simultaneously
- [ ] Clear filters functionality

**Testing:**
- Unit tests for filter logic
- Integration tests for filtered views
- Test filter persistence
- Test filter combinations

---

## Phase 3: Quick Actions Integration (Week 3)

### 3.1 Workflow-Integrated Quick Actions
**Priority: High**  
**Risk Level: Medium** (Requires workflow engine integration)

**Requirements:**
- Quick actions tied directly to workflow engine
- Context-aware actions based on dashboard state
- Examples:
  - "Schedule Review" → Opens calendar with client pre-selected
  - "Create Task" → Opens task dialog with context
  - "Send Message" → Opens communication dialog
  - "Place Order" → Opens quick order dialog
- Actions should be contextual (e.g., from opportunity → schedule meeting with prospect)

**API Dependencies:**
- Existing workflow endpoints
- `/api/appointments` (POST)
- `/api/tasks` (POST)
- `/api/communications` (POST)
- `/api/quick-order` (existing)

**Component:** `client/src/components/dashboard/quick-actions-workflow.tsx`

**Integration Points:**
- Update existing QuickActions component
- Add context-aware action buttons to timeline items
- Add action buttons to opportunity cards
- Add action buttons to relationship insights

**Acceptance Criteria:**
- [ ] Quick actions appear contextually
- [ ] Actions integrate with workflow engine
- [ ] Forms pre-populate with context
- [ ] Success/error handling works
- [ ] Actions refresh relevant dashboard data

**Testing:**
- Unit tests for action handlers
- Integration tests for workflow integration
- Test context passing
- Test form pre-population

---

## Phase 4: Dashboard Restructure (Week 3-4)

### 4.1 Main Dashboard Layout Update
**Priority: High**  
**Risk Level: High** (Major refactor of main dashboard)

**Requirements:**
- Restructure `dashboard.tsx` to use new narrative layout
- Remove old grid-based layout
- Implement new top-to-bottom flow:
  1. Goals vs Actuals Ribbon (top)
  2. Scenario Toggles (below ribbon)
  3. Today's Briefing Timeline (main section)
  4. Opportunity Highlights (below timeline)
  5. Relationship Insights (below opportunities)
  6. Quick Actions (floating or sidebar)
- Maintain backward compatibility during transition
- Feature flag for new vs old layout

**Implementation Strategy:**
1. Create new dashboard layout component
2. Add feature flag
3. Test new layout thoroughly
4. Gradually migrate users
5. Remove old layout after validation

**File:** `client/src/pages/dashboard.tsx`

**Acceptance Criteria:**
- [ ] New layout renders correctly
- [ ] All components integrated
- [ ] Responsive design works
- [ ] Loading states coordinated
- [ ] Error handling works
- [ ] Performance acceptable (< 2s load time)
- [ ] Feature flag works
- [ ] Old layout still accessible during transition

**Testing:**
- E2E tests for new dashboard flow
- Performance tests
- Visual regression tests
- Cross-browser testing
- Mobile responsiveness tests

---

## Phase 5: Testing & Bug Fixes (Week 4-5)

### 5.1 Comprehensive Testing
**Priority: High**  
**Risk Level: Low** (Testing phase)

**Test Coverage:**
- [ ] Unit tests for all new components (>80% coverage)
- [ ] Integration tests for API interactions
- [ ] E2E tests for user workflows
- [ ] Performance tests (load time, render time)
- [ ] Accessibility tests (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness tests
- [ ] Visual regression tests

### 5.2 Bug Fixes & Optimization
**Priority: High**  
**Risk Level: Medium** (May uncover issues)

**Areas to Address:**
- Performance optimization
- Memory leaks
- API error handling
- Edge cases
- Accessibility improvements
- UI/UX polish

### 5.3 Regression Testing
**Priority: High**  
**Risk Level: Medium** (Ensure no breaking changes)

**Test Areas:**
- [ ] Existing dashboard functionality still works
- [ ] API endpoints unchanged
- [ ] No breaking changes to other pages
- [ ] Data integrity maintained
- [ ] User workflows not disrupted

---

## Risk Mitigation Strategy

### Regression Risk Mitigation
1. **Feature Flags**: Use feature flags to toggle new/old layout
2. **Gradual Rollout**: Deploy to staging → beta users → all users
3. **Backward Compatibility**: Keep old components available during transition
4. **Comprehensive Testing**: Test all existing functionality
5. **Rollback Plan**: Ability to revert to old layout quickly

### Technical Risks
1. **API Performance**: New queries may impact performance
   - Mitigation: Optimize queries, add caching, use pagination
2. **State Management**: Complex filter state
   - Mitigation: Use React Context, persist to localStorage
3. **Component Coupling**: Tight coupling between components
   - Mitigation: Use props/context, keep components independent

### User Experience Risks
1. **Learning Curve**: Users familiar with old layout
   - Mitigation: User training, help documentation, gradual rollout
2. **Information Overload**: Too much information at once
   - Mitigation: Progressive disclosure, collapsible sections, good visual hierarchy

---

## Success Metrics

### Performance Metrics
- Dashboard load time < 2 seconds
- Component render time < 500ms
- API response time < 1 second
- No memory leaks

### User Experience Metrics
- User satisfaction score > 4/5
- Task completion rate improvement > 20%
- Time to find information < 30 seconds
- Error rate < 1%

### Business Metrics
- Daily active users maintained or increased
- Feature adoption rate > 60%
- Support tickets related to dashboard < 5% of total

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Week 1-2 | 4 new components built and tested |
| Phase 2 | Week 2-3 | Scenario toggle system implemented |
| Phase 3 | Week 3 | Quick actions integrated with workflow |
| Phase 4 | Week 3-4 | Dashboard restructured with new layout |
| Phase 5 | Week 4-5 | Testing, bug fixes, optimization |

**Total Estimated Duration: 4-5 weeks**

---

## Dependencies

### External Dependencies
- No external dependencies required
- All APIs exist or can be created from existing data

### Internal Dependencies
- React Query for data fetching (existing)
- UI component library (existing)
- Workflow engine (existing)
- Authentication system (existing)

---

## Next Steps

1. **Review & Approval**: Review this plan with stakeholders
2. **Phase 1 Kickoff**: Begin building Goals vs Actuals ribbon component
3. **Daily Standups**: Track progress daily
4. **Weekly Reviews**: Review completed work weekly
5. **Stakeholder Updates**: Weekly updates to stakeholders

---

## Appendix

### Component File Structure
```
client/src/components/dashboard/
├── goals-vs-actuals-ribbon.tsx      (NEW)
├── todays-briefing-timeline.tsx     (NEW)
├── opportunity-highlights.tsx       (NEW)
├── relationship-insights.tsx         (NEW)
├── scenario-toggles.tsx              (NEW)
├── quick-actions-workflow.tsx        (NEW)
├── action-items-priorities.tsx      (EXISTING - may refactor)
├── business-snapshot-structured.tsx  (EXISTING - may refactor)
└── ...
```

### API Endpoints (New/Modified)
- `GET /api/goals/summary` - RM-level goals summary (NEW)
- `GET /api/clients/expiring-kyc` - Clients with expiring KYC (NEW)
- `GET /api/tasks/overdue` - Overdue tasks (NEW)
- `GET /api/prospects/highlights` - Top opportunities (NEW)
- `GET /api/clients/insights` - Relationship insights (NEW)

### Testing Files
```
client/src/pages/__tests__/
├── dashboard.test.tsx                (UPDATE)
└── dashboard-new.test.tsx            (NEW)

client/src/components/dashboard/__tests__/
├── goals-vs-actuals-ribbon.test.tsx  (NEW)
├── todays-briefing-timeline.test.tsx (NEW)
├── opportunity-highlights.test.tsx   (NEW)
├── relationship-insights.test.tsx    (NEW)
└── scenario-toggles.test.tsx         (NEW)
```

