# Unified Task & Alert Hub - Design Plan

**Date:** January 2025  
**Status:** Planning Phase  
**Goal:** Transform tasks screen into a unified command center with timeline-based prioritization

---

## Executive Summary

### Current State
- Tasks screen blends task CRUD, portfolio alerts, filtering, and debugging logs
- Two collapsible cards without clear mental model for urgency or ownership
- No unified view of what requires attention
- Limited prioritization and timeline awareness

### Target State
- Unified command center with timeline-based organization
- Clear sections: "Now," "Next," "Scheduled"
- Pill filters for client/prospect, calendar integration
- Bulk actions support
- Chronological feed merging alerts, tasks, and follow-ups

---

## Detailed Design Plan

### Phase 1: Foundation & Data Model Enhancement

#### 1.1 Unified Data Model
**Goal:** Create a unified data structure that can represent tasks, alerts, and follow-ups

**Changes:**
- Create `UnifiedItem` type that can represent:
  - Tasks (with due dates, priorities)
  - Portfolio Alerts (with severity, actionRequired)
  - Appointments/Follow-ups (with start/end times)
  - Calendar events

**Data Structure:**
```typescript
type UnifiedItemType = 'task' | 'alert' | 'appointment' | 'follow-up';

interface UnifiedItem {
  id: string; // Composite: "task-123" or "alert-456"
  type: UnifiedItemType;
  title: string;
  description?: string;
  
  // Timeline
  dueDate?: Date; // For tasks
  startTime?: Date; // For appointments
  endTime?: Date; // For appointments
  createdAt: Date;
  
  // Priority & Urgency
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'now' | 'next' | 'scheduled'; // Calculated field
  
  // Ownership
  clientId?: number;
  prospectId?: number;
  clientName?: string;
  prospectName?: string;
  assignedTo?: number;
  
  // Status
  completed?: boolean; // For tasks
  read?: boolean; // For alerts
  actionRequired?: boolean; // For alerts
  
  // Metadata
  severity?: 'info' | 'warning' | 'critical'; // For alerts
  source: 'task' | 'portfolio-alert' | 'appointment' | 'follow-up';
}
```

**Risks:**
- Data model complexity
- Migration of existing data
- Performance impact of unified queries

**Mitigation:**
- Start with read-only unified view
- Use adapters to transform existing data
- Implement caching for performance
- Gradual migration approach

---

#### 1.2 Timeline Calculation Logic
**Goal:** Implement smart categorization into "Now," "Next," "Scheduled"

**Logic:**
```typescript
function calculateUrgency(item: UnifiedItem): 'now' | 'next' | 'scheduled' {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const endOfWeek = endOfWeek(today);
  const nextWeek = addWeeks(endOfWeek, 1);
  
  // "Now" - Requires immediate attention
  if (
    item.priority === 'critical' ||
    (item.dueDate && isBefore(item.dueDate, today)) || // Overdue
    (item.dueDate && isToday(item.dueDate)) || // Due today
    (item.severity === 'critical' && item.actionRequired) ||
    (item.startTime && isBefore(item.startTime, addHours(now, 2))) // Starting in 2 hours
  ) {
    return 'now';
  }
  
  // "Next" - Upcoming priority items
  if (
    item.priority === 'high' ||
    (item.dueDate && isBefore(item.dueDate, endOfWeek)) || // Due this week
    (item.severity === 'warning' && item.actionRequired) ||
    (item.startTime && isBefore(item.startTime, nextWeek)) // This week
  ) {
    return 'next';
  }
  
  // "Scheduled" - Future items
  return 'scheduled';
}
```

**Risks:**
- Complex logic may mis-categorize items
- Performance impact of calculations
- User confusion with categorization

**Mitigation:**
- Make logic configurable
- Add manual override capability
- Show reasoning tooltips
- A/B test categorization rules

---

### Phase 2: UI/UX Redesign

#### 2.1 Timeline-Based Layout
**Goal:** Create three-column layout for "Now," "Next," "Scheduled"

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Unified Task & Alert Hub                    [Filters] [+] │
├─────────────────────────────────────────────────────────────┤
│  [All] [Now] [Next] [Scheduled]  [Client/Prospect Pills]   │
├──────────────┬──────────────┬──────────────────────────────┤
│   NOW        │   NEXT       │   SCHEDULED                   │
│  (Urgent)    │  (This Week) │  (Future)                    │
├──────────────┼──────────────┼──────────────────────────────┤
│ • Task 1     │ • Task 5     │ • Appointment                 │
│ • Alert 2    │ • Alert 6    │ • Follow-up                  │
│ • Task 3     │ • Task 7     │                               │
│              │              │                               │
└──────────────┴──────────────┴──────────────────────────────┘
```

**Components:**
- `TimelineView` - Main three-column layout
- `UrgencyColumn` - Individual column component
- `UnifiedItemCard` - Card for each item
- `TimelineFilters` - Filter bar component

**Risks:**
- Mobile responsiveness
- Information overload
- Column balancing

**Mitigation:**
- Responsive design: stack columns on mobile
- Pagination/virtualization for long lists
- Auto-balance columns based on item count
- Collapsible sections

---

#### 2.2 Unified Item Card Design
**Goal:** Create consistent card design for all item types

**Card Structure:**
```
┌─────────────────────────────────────────┐
│ [Icon] Title                    [Badge]│
│         Description                     │
│         [Client/Prospect] [Due Date]   │
│         [Actions] [Checkbox]            │
└─────────────────────────────────────────┘
```

**Features:**
- Color-coded by type (task=blue, alert=orange, appointment=green)
- Priority indicator (border color)
- Quick actions (complete, dismiss, reschedule)
- Expandable details
- Bulk selection checkbox

**Risks:**
- Card complexity
- Visual clutter
- Accessibility

**Mitigation:**
- Progressive disclosure (expand for details)
- Consistent design system
- WCAG compliance
- Keyboard navigation

---

#### 2.3 Filter System
**Goal:** Implement pill filters for client/prospect, type, priority

**Filters:**
- **Entity Type:** All | Client | Prospect
- **Item Type:** All | Tasks | Alerts | Appointments
- **Priority:** All | Critical | High | Medium | Low
- **Status:** All | Pending | Completed | Read
- **Date Range:** Today | This Week | This Month | Custom

**Implementation:**
- `FilterPills` component
- URL-based filter state (shareable links)
- Filter persistence (localStorage)
- Filter combinations

**Risks:**
- Too many filter combinations
- Performance with many filters
- Filter state management

**Mitigation:**
- Limit active filters (max 3-4)
- Debounced filter application
- Optimistic UI updates
- Clear filter button

---

### Phase 3: Calendar Integration

#### 3.1 Calendar Sync
**Goal:** Integrate appointments and follow-ups into unified view

**Features:**
- Pull appointments from calendar API
- Show upcoming appointments in timeline
- Link appointments to clients/prospects
- Create tasks from appointments

**Implementation:**
- Calendar API integration
- Appointment → UnifiedItem adapter
- Two-way sync (create appointment from task)
- Calendar view toggle

**Risks:**
- Calendar API availability
- Sync conflicts
- Performance

**Mitigation:**
- Fallback to manual entry
- Conflict resolution UI
- Incremental sync
- Caching strategy

---

#### 3.2 Follow-up Tracking
**Goal:** Track and display follow-ups as unified items

**Features:**
- Mark appointments as requiring follow-up
- Create follow-up tasks automatically
- Show follow-up timeline
- Reminder notifications

**Risks:**
- Follow-up data model
- Duplicate items
- Notification spam

**Mitigation:**
- Deduplication logic
- Smart notification rules
- User preferences
- Batch notifications

---

### Phase 4: Bulk Actions

#### 4.1 Selection System
**Goal:** Enable multi-select for bulk operations

**Features:**
- Checkbox selection
- Select all in column
- Select by filter
- Selection counter

**Risks:**
- Performance with many items
- Accidental bulk actions
- Undo complexity

**Mitigation:**
- Virtual scrolling
- Confirmation dialogs
- Undo/redo system
- Batch size limits

---

#### 4.2 Bulk Operations
**Goal:** Implement common bulk actions

**Actions:**
- Mark as complete/read
- Assign to user
- Change priority
- Add tags/labels
- Delete/archive
- Export

**Risks:**
- API rate limiting
- Transaction failures
- Partial success handling

**Mitigation:**
- Batch API endpoints
- Transaction support
- Progress indicators
- Error reporting
- Retry mechanism

---

### Phase 5: Chronological Feed

#### 5.1 Unified Feed View
**Goal:** Create chronological feed merging all items

**Features:**
- Single timeline view
- Grouped by date
- Item type indicators
- Quick filters
- Infinite scroll

**Risks:**
- Performance with many items
- Feed ordering complexity
- Real-time updates

**Mitigation:**
- Pagination/virtualization
- Server-side sorting
- WebSocket for updates
- Optimistic updates

---

#### 5.2 Feed Enhancements
**Goal:** Add smart features to feed

**Features:**
- Smart grouping (by date, client, type)
- Search within feed
- Filter presets
- Export feed
- Print view

**Risks:**
- Feature creep
- Complexity
- Maintenance

**Mitigation:**
- Feature flags
- Gradual rollout
- User feedback
- Analytics

---

## Risk Assessment & Mitigation

### High Priority Risks

#### 1. Data Model Complexity
**Risk:** Unified data model may be too complex or inflexible
**Impact:** High - Could require major refactoring
**Mitigation:**
- Start with adapter pattern (transform existing data)
- Keep source data separate
- Gradual migration
- Version the unified model

#### 2. Performance Issues
**Risk:** Unified queries and calculations may be slow
**Impact:** High - Poor user experience
**Mitigation:**
- Implement caching (React Query)
- Server-side filtering/sorting
- Virtual scrolling
- Lazy loading
- Database indexes

#### 3. User Confusion
**Risk:** New UI may confuse existing users
**Impact:** Medium - Adoption issues
**Mitigation:**
- Gradual rollout
- Feature flags
- User training
- Feedback collection
- A/B testing
- Keep old view available initially

#### 4. Calendar Integration Failures
**Risk:** Calendar API may be unavailable or unreliable
**Impact:** Medium - Missing features
**Mitigation:**
- Fallback to manual entry
- Error handling
- Retry logic
- Offline support
- User notifications

#### 5. Data Migration Issues
**Risk:** Existing data may not map cleanly
**Impact:** Medium - Data loss or corruption
**Mitigation:**
- Comprehensive testing
- Backup before migration
- Rollback plan
- Data validation
- Migration scripts

### Medium Priority Risks

#### 6. Mobile Responsiveness
**Risk:** Three-column layout may not work on mobile
**Impact:** Medium - Poor mobile UX
**Mitigation:**
- Mobile-first design
- Responsive breakpoints
- Stack columns on mobile
- Touch-friendly interactions

#### 7. Filter Complexity
**Risk:** Too many filters may overwhelm users
**Impact:** Low-Medium - Usability issues
**Mitigation:**
- Progressive disclosure
- Filter presets
- Smart defaults
- Filter recommendations

#### 8. Bulk Action Errors
**Risk:** Bulk operations may fail partially
**Impact:** Medium - Data inconsistency
**Mitigation:**
- Transaction support
- Error reporting
- Partial success handling
- Undo capability

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up unified data model and basic structure

**Tasks:**
1. Create `UnifiedItem` type and adapters
2. Implement urgency calculation logic
3. Create basic timeline view component
4. Set up API endpoints for unified data
5. Unit tests for data transformation

**Deliverables:**
- Unified data model
- Basic timeline view
- API endpoints
- Unit tests

**Testing:**
- Unit tests for adapters
- Integration tests for API
- Manual testing of timeline view

---

### Phase 2: UI Redesign (Week 3-4)
**Goal:** Implement new UI with timeline columns

**Tasks:**
1. Build three-column timeline layout
2. Create unified item cards
3. Implement filter system
4. Add search functionality
5. Responsive design

**Deliverables:**
- Timeline UI
- Filter system
- Responsive design
- Component library

**Testing:**
- Visual regression tests
- Responsive testing
- Accessibility audit
- User acceptance testing

---

### Phase 3: Calendar Integration (Week 5)
**Goal:** Integrate appointments and follow-ups

**Tasks:**
1. Calendar API integration
2. Appointment adapters
3. Follow-up tracking
4. Calendar view toggle
5. Sync logic

**Deliverables:**
- Calendar integration
- Follow-up tracking
- Sync functionality

**Testing:**
- Calendar API tests
- Sync tests
- Conflict resolution tests

---

### Phase 4: Bulk Actions (Week 6)
**Goal:** Implement bulk selection and operations

**Tasks:**
1. Multi-select system
2. Bulk action UI
3. Batch API endpoints
4. Progress indicators
5. Error handling

**Deliverables:**
- Bulk selection
- Bulk operations
- Batch APIs

**Testing:**
- Bulk operation tests
- Performance tests
- Error scenario tests

---

### Phase 5: Feed View (Week 7)
**Goal:** Create chronological feed view

**Tasks:**
1. Feed component
2. Date grouping
3. Infinite scroll
4. Feed filters
5. Export functionality

**Deliverables:**
- Feed view
- Grouping logic
- Export feature

**Testing:**
- Feed rendering tests
- Performance tests
- Export tests

---

### Phase 6: Polish & Optimization (Week 8)
**Goal:** Final polish and performance optimization

**Tasks:**
1. Performance optimization
2. Bug fixes
3. UI polish
4. Documentation
5. User training materials

**Deliverables:**
- Optimized application
- Documentation
- Training materials

**Testing:**
- Full regression testing
- Performance testing
- User acceptance testing

---

## Success Metrics

### Quantitative Metrics
- **Task completion rate:** Increase by 20%
- **Time to find urgent items:** Reduce by 50%
- **User engagement:** Increase by 30%
- **Error rate:** Reduce by 15%
- **Page load time:** < 2 seconds

### Qualitative Metrics
- User satisfaction scores
- Feature adoption rates
- Support ticket reduction
- User feedback sentiment

---

## Rollout Strategy

### Phase 1: Internal Testing (Week 1-2)
- Team testing
- Bug fixes
- Performance tuning

### Phase 2: Beta Testing (Week 3-4)
- Select user group (10-20 users)
- Feedback collection
- Iterative improvements

### Phase 3: Gradual Rollout (Week 5-6)
- 25% of users
- Monitor metrics
- Fix critical issues

### Phase 4: Full Rollout (Week 7-8)
- 100% of users
- Monitor closely
- Support team ready

---

## Dependencies

### Technical Dependencies
- React Router (already migrated ✅)
- React Query (already in use ✅)
- Date manipulation library (date-fns ✅)
- Calendar API access
- Database schema updates

### Team Dependencies
- Design review
- Backend API support
- QA testing
- User training

---

## Next Steps

1. **Review & Approval:** Get stakeholder approval
2. **Design Mockups:** Create detailed UI mockups
3. **Technical Spike:** Proof of concept for unified model
4. **Kickoff:** Start Phase 1 implementation
5. **Regular Check-ins:** Weekly progress reviews

---

**Ready to proceed with implementation!** 🚀

