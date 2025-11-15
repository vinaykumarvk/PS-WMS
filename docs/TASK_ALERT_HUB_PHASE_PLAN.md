# Unified Task & Alert Hub - Phase Implementation Plan

## Executive Summary

This document outlines a phased approach to redesigning the tasks screen into a unified command center that surfaces what requires attention "now," "next," and "scheduled," with timeline-based prioritization, pill filters, calendar integration, bulk actions, and a merged chronological feed.

## Current State Assessment

### Existing Implementation
- **Tasks Page** (`client/src/pages/tasks.tsx`): Two collapsible cards (Tasks and Portfolio Alerts)
- **Features**: Basic CRUD operations, simple filtering, due date tracking
- **Limitations**: 
  - No unified mental model for urgency/ownership
  - Tasks and alerts are separate entities
  - No timeline/chronological view
  - No bulk operations
  - No calendar integration
  - No prioritization beyond due dates
  - No unified feed merging tasks, alerts, and follow-ups

### Data Models
- **Tasks**: `id`, `title`, `description`, `dueDate`, `completed`, `priority`, `clientId`, `prospectId`, `assignedTo`
- **Portfolio Alerts**: `id`, `title`, `description`, `clientId`, `severity`, `read`, `actionRequired`, `createdAt`
- **Appointments**: `id`, `title`, `description`, `startTime`, `endTime`, `clientId`, `prospectId`, `priority`, `type`

### API Endpoints
- `/api/tasks` (GET, POST, PUT, DELETE)
- `/api/portfolio-alerts` (GET, POST, PUT)
- `/api/appointments` (GET, POST, PUT, DELETE)

---

## Phase 1: Foundation & Data Layer Enhancement

### Objectives
- Enhance data models to support unified timeline view
- Create unified data aggregation service
- Add priority/urgency calculation logic
- Maintain backward compatibility

### Tasks

#### 1.1 Database Schema Enhancements
- [ ] Add `urgency` field to tasks (calculated: overdue, due_today, due_soon, scheduled)
- [ ] Add `category` field to tasks (task, alert, follow_up, appointment)
- [ ] Add `scheduledFor` timestamp to portfolio alerts (for scheduling)
- [ ] Add `followUpDate` to appointments (for follow-up tracking)
- [ ] Create migration scripts with rollback capability

#### 1.2 Unified Data Service
- [ ] Create `server/services/task-alert-hub-service.ts`
  - `getUnifiedFeed(userId, filters)` - Merges tasks, alerts, appointments chronologically
  - `calculateUrgency(item)` - Determines "now", "next", "scheduled" buckets
  - `getItemsByTimeframe(userId, timeframe)` - Filters by urgency buckets
- [ ] Add caching layer for performance
- [ ] Add comprehensive error handling

#### 1.3 API Endpoints
- [ ] `GET /api/task-hub/feed` - Unified chronological feed
- [ ] `GET /api/task-hub/now` - Items requiring immediate attention
- [ ] `GET /api/task-hub/next` - Items due soon
- [ ] `GET /api/task-hub/scheduled` - Scheduled items
- [ ] `GET /api/task-hub/filters` - Available filter options

#### 1.4 Testing
- [ ] Unit tests for `task-alert-hub-service.ts`
- [ ] Integration tests for new API endpoints
- [ ] Regression tests for existing task/alert endpoints
- [ ] Performance tests for unified feed queries

### Success Criteria
- ✅ All existing functionality remains intact
- ✅ Unified feed returns correctly merged and sorted data
- ✅ Urgency calculation works accurately
- ✅ API response times < 200ms for typical queries
- ✅ 100% test coverage for new service

### Rollback Plan
- Database migrations are reversible
- Old endpoints remain functional
- Feature flag to disable new endpoints

---

## Phase 2: Timeline View & Prioritization UI

### Objectives
- Build timeline-based UI components
- Implement "now", "next", "scheduled" sections
- Add visual prioritization indicators
- Maintain existing card-based view as fallback

### Tasks

#### 2.1 Timeline Components
- [ ] Create `client/src/components/task-hub/TimelineView.tsx`
  - Three-column layout: "Now", "Next", "Scheduled"
  - Drag-and-drop between sections (future enhancement)
  - Visual indicators for urgency (colors, badges, icons)
- [ ] Create `client/src/components/task-hub/TimelineItem.tsx`
  - Unified item card supporting tasks, alerts, appointments
  - Expandable details view
  - Quick actions (complete, dismiss, reschedule)
- [ ] Create `client/src/components/task-hub/UrgencyBadge.tsx`
  - Visual representation of urgency levels

#### 2.2 Prioritization Logic
- [ ] Implement client-side urgency calculation
- [ ] Add sorting by priority + due date
- [ ] Add visual hierarchy (size, color, position)

#### 2.3 State Management
- [ ] Create `client/src/hooks/useTaskHub.ts`
  - Fetches unified feed
  - Manages filter state
  - Handles optimistic updates
- [ ] Add React Query integration for caching

#### 2.4 Testing
- [ ] Component tests for TimelineView
- [ ] Component tests for TimelineItem
- [ ] Visual regression tests
- [ ] E2E tests for timeline interactions
- [ ] Regression tests for existing tasks page

### Success Criteria
- ✅ Timeline view renders correctly with all item types
- ✅ Items appear in correct urgency buckets
- ✅ Visual indicators are clear and accessible
- ✅ No performance degradation
- ✅ Existing tasks page still works

### Rollback Plan
- Feature flag to toggle timeline view
- Keep existing card view as default
- Component isolation allows disabling without breaking

---

## Phase 3: Filtering & Search Enhancement

### Objectives
- Implement pill filters for client/prospect
- Add advanced filtering options
- Enhance search functionality
- Add filter persistence

### Tasks

#### 3.1 Filter Components
- [ ] Create `client/src/components/task-hub/FilterPills.tsx`
  - Client/Prospect filter pills
  - Status filter (all, pending, completed, dismissed)
  - Type filter (tasks, alerts, appointments, all)
  - Priority filter (high, medium, low, all)
- [ ] Create `client/src/components/task-hub/SearchBar.tsx`
  - Enhanced search with autocomplete
  - Search across title, description, client name
  - Highlight matching text

#### 3.2 Filter Logic
- [ ] Implement multi-filter combination logic
- [ ] Add filter state management
- [ ] Add URL query parameter support for filters
- [ ] Add filter persistence (localStorage)

#### 3.3 Backend Filter Support
- [ ] Enhance API endpoints to accept filter parameters
- [ ] Add database indexes for filter queries
- [ ] Optimize filter queries

#### 3.4 Testing
- [ ] Unit tests for filter logic
- [ ] Component tests for FilterPills
- [ ] Integration tests for filter combinations
- [ ] Performance tests for filtered queries
- [ ] E2E tests for filter interactions

### Success Criteria
- ✅ All filter combinations work correctly
- ✅ Filter state persists across sessions
- ✅ Search is fast and accurate
- ✅ No performance degradation with filters
- ✅ Filters work with existing data

### Rollback Plan
- Filters are additive, can be disabled individually
- Default to "all" filters if issues occur
- Search fallback to simple text matching

---

## Phase 4: Bulk Actions

### Objectives
- Implement bulk selection
- Add bulk operations (complete, dismiss, delete, reschedule)
- Add bulk action UI
- Ensure proper error handling

### Tasks

#### 4.1 Bulk Selection UI
- [ ] Add checkbox to each timeline item
- [ ] Add "Select All" functionality
- [ ] Add selection counter
- [ ] Create `client/src/components/task-hub/BulkActionBar.tsx`
  - Shows when items are selected
  - Displays action buttons
  - Shows selection count

#### 4.2 Bulk Operations Backend
- [ ] Create `POST /api/task-hub/bulk` endpoint
  - Accepts array of item IDs and action
  - Validates permissions
  - Processes in transaction
  - Returns success/failure per item
- [ ] Add bulk operation service methods
- [ ] Add rate limiting for bulk operations

#### 4.3 Bulk Actions Implementation
- [ ] Bulk complete tasks
- [ ] Bulk dismiss alerts
- [ ] Bulk delete items (with confirmation)
- [ ] Bulk reschedule (with date picker)
- [ ] Bulk assign to client/prospect

#### 4.4 Testing
- [ ] Unit tests for bulk operation service
- [ ] Integration tests for bulk API endpoint
- [ ] Component tests for BulkActionBar
- [ ] E2E tests for bulk operations
- [ ] Error handling tests (partial failures)
- [ ] Performance tests for large bulk operations

### Success Criteria
- ✅ Bulk operations work correctly
- ✅ Proper error handling for partial failures
- ✅ UI provides clear feedback
- ✅ No performance issues with large selections
- ✅ Permissions are enforced

### Rollback Plan
- Bulk operations are additive
- Can disable bulk selection UI
- Individual operations still work

---

## Phase 5: Calendar Integration

### Objectives
- Integrate calendar view into task hub
- Show appointments alongside tasks/alerts
- Add calendar navigation
- Support scheduling from timeline

### Tasks

#### 5.1 Calendar View Component
- [ ] Create `client/src/components/task-hub/CalendarView.tsx`
  - Month/week/day views
  - Shows tasks, alerts, appointments
  - Color coding by type
  - Click to view details
- [ ] Integrate with existing calendar component
- [ ] Add view toggle (timeline/calendar)

#### 5.2 Calendar Data Integration
- [ ] Enhance unified feed to include calendar context
- [ ] Add date-based filtering
- [ ] Add calendar navigation (prev/next month)
- [ ] Highlight today/selected date

#### 5.3 Scheduling from Timeline
- [ ] Add "Schedule" action to timeline items
- [ ] Create scheduling dialog
- [ ] Update item with scheduled date
- [ ] Move item to "scheduled" bucket

#### 5.4 Testing
- [ ] Component tests for CalendarView
- [ ] Integration tests for calendar data
- [ ] E2E tests for calendar navigation
- [ ] E2E tests for scheduling flow
- [ ] Regression tests for existing calendar page

### Success Criteria
- ✅ Calendar view displays all item types correctly
- ✅ Navigation works smoothly
- ✅ Scheduling from timeline works
- ✅ Existing calendar page unaffected
- ✅ Performance is acceptable

### Rollback Plan
- Calendar view is separate component
- Can disable calendar integration
- Existing calendar page remains independent

---

## Phase 6: Unified Feed & Chronological View

### Objectives
- Create unified chronological feed
- Merge tasks, alerts, and follow-ups
- Add feed filtering and sorting
- Optimize feed performance

### Tasks

#### 6.1 Feed Component
- [ ] Create `client/src/components/task-hub/FeedView.tsx`
  - Chronological list view
  - Group by date (Today, Yesterday, This Week, etc.)
  - Visual separators
  - Infinite scroll or pagination
- [ ] Add feed item rendering
  - Unified card design
  - Type indicators
  - Quick actions

#### 6.2 Feed Logic
- [ ] Implement chronological sorting
- [ ] Add date grouping
- [ ] Add feed filtering
- [ ] Add feed search

#### 6.3 Feed Optimization
- [ ] Implement virtual scrolling for large feeds
- [ ] Add pagination/cursor-based loading
- [ ] Add feed caching
- [ ] Optimize database queries

#### 6.4 Testing
- [ ] Component tests for FeedView
- [ ] Integration tests for feed data
- [ ] Performance tests for large feeds
- [ ] E2E tests for feed interactions
- [ ] Regression tests for existing views

### Success Criteria
- ✅ Feed displays items chronologically
- ✅ Performance is acceptable with 1000+ items
- ✅ Filtering works correctly
- ✅ All item types display correctly
- ✅ No memory leaks

### Rollback Plan
- Feed view is separate component
- Can disable feed view
- Timeline view remains available

---

## Phase 7: Polish & Optimization

### Objectives
- Performance optimization
- Accessibility improvements
- UI/UX polish
- Documentation

### Tasks

#### 7.1 Performance
- [ ] Optimize database queries
- [ ] Add query result caching
- [ ] Implement lazy loading
- [ ] Optimize re-renders
- [ ] Add performance monitoring

#### 7.2 Accessibility
- [ ] Add ARIA labels
- [ ] Keyboard navigation support
- [ ] Screen reader testing
- [ ] Color contrast compliance
- [ ] Focus management

#### 7.3 UI/UX Polish
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error states
- [ ] Improve animations
- [ ] Add tooltips
- [ ] Improve mobile responsiveness

#### 7.4 Documentation
- [ ] Update user documentation
- [ ] Add developer documentation
- [ ] Create migration guide
- [ ] Add API documentation

#### 7.5 Testing
- [ ] Comprehensive E2E test suite
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Mobile testing

### Success Criteria
- ✅ Performance meets targets (<200ms API, <100ms render)
- ✅ Accessibility score >90
- ✅ UI is polished and consistent
- ✅ Documentation is complete
- ✅ All tests pass

---

## Testing Strategy

### Unit Tests
- **Coverage Target**: 90%+ for new code
- **Tools**: Vitest
- **Scope**: Services, utilities, hooks, components

### Integration Tests
- **Coverage Target**: 80%+ for API endpoints
- **Tools**: Vitest + Supertest
- **Scope**: API endpoints, database operations

### Component Tests
- **Coverage Target**: 85%+ for UI components
- **Tools**: React Testing Library + Vitest
- **Scope**: All new components, critical existing components

### E2E Tests
- **Coverage Target**: Critical user flows
- **Tools**: Playwright
- **Scope**: 
  - Creating/viewing/updating tasks
  - Filtering and searching
  - Bulk operations
  - Calendar integration
  - Feed navigation

### Regression Tests
- **After Each Phase**: Run full test suite
- **Before Production**: Full regression suite
- **Scope**: All existing functionality

### Performance Tests
- **API Response Times**: <200ms for typical queries
- **Render Times**: <100ms for initial render
- **Large Dataset**: Handle 1000+ items gracefully

---

## Regression Mitigation Strategy

### Feature Flags
- Use feature flags for all new features
- Allow gradual rollout
- Enable quick rollback

### Backward Compatibility
- Keep existing endpoints functional
- Maintain existing UI as fallback
- Support both old and new data formats

### Incremental Rollout
- Phase 1: Internal testing
- Phase 2: Beta users
- Phase 3: Gradual production rollout
- Phase 4: Full production

### Monitoring
- Add error tracking (Sentry)
- Add performance monitoring
- Add user analytics
- Set up alerts for errors

### Rollback Procedures
- Document rollback steps for each phase
- Test rollback procedures
- Keep rollback scripts ready
- Maintain database migration rollbacks

---

## Risk Assessment

### High Risk
- **Database Schema Changes**: Mitigated by reversible migrations
- **Performance Degradation**: Mitigated by caching and optimization
- **Data Loss**: Mitigated by backups and transactions

### Medium Risk
- **Breaking Changes**: Mitigated by backward compatibility
- **User Confusion**: Mitigated by gradual rollout and documentation
- **Integration Issues**: Mitigated by comprehensive testing

### Low Risk
- **UI Inconsistencies**: Mitigated by design system
- **Minor Bugs**: Mitigated by testing and QA

---

## Timeline Estimate

- **Phase 1**: 1-2 weeks
- **Phase 2**: 1-2 weeks
- **Phase 3**: 1 week
- **Phase 4**: 1-2 weeks
- **Phase 5**: 1-2 weeks
- **Phase 6**: 1-2 weeks
- **Phase 7**: 1-2 weeks

**Total**: 7-13 weeks (depending on team size and complexity)

---

## Success Metrics

### Technical Metrics
- API response time <200ms
- UI render time <100ms
- Test coverage >85%
- Zero critical bugs in production

### User Metrics
- Task completion rate increase
- Time to find items decrease
- User satisfaction score
- Adoption rate of new features

### Business Metrics
- Reduced support tickets
- Increased user engagement
- Improved workflow efficiency

---

## Dependencies

### External
- React Query (already in use)
- date-fns (already in use)
- UI component library (already in use)

### Internal
- Existing task/alert/appointment APIs
- Database schema
- Authentication system

---

## Next Steps

1. Review and approve phase plan
2. Set up feature flags infrastructure
3. Create project board with phase tasks
4. Assign team members
5. Begin Phase 1 implementation

---

## Appendix

### A. Database Migration Examples
```sql
-- Add urgency field to tasks
ALTER TABLE tasks ADD COLUMN urgency TEXT;

-- Add category field to tasks
ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'task';

-- Add scheduledFor to portfolio_alerts
ALTER TABLE portfolio_alerts ADD COLUMN scheduled_for TIMESTAMP;
```

### B. API Endpoint Examples
```typescript
// Unified feed endpoint
GET /api/task-hub/feed?timeframe=now&clientId=1&type=all

// Bulk operation endpoint
POST /api/task-hub/bulk
{
  "itemIds": [1, 2, 3],
  "action": "complete"
}
```

### C. Component Structure
```
client/src/components/task-hub/
├── TimelineView.tsx
├── TimelineItem.tsx
├── FeedView.tsx
├── CalendarView.tsx
├── FilterPills.tsx
├── SearchBar.tsx
├── BulkActionBar.tsx
└── UrgencyBadge.tsx
```

