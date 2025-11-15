# Router Migration Plan - Gradual Migration

**Status:** In Progress  
**Started:** January 2025  
**Approach:** Incremental migration with testing at each phase

---

## Migration Strategy

We're migrating from the custom hash router to React Router in small, testable increments. Each phase will:
1. Migrate a small set of routes
2. Test thoroughly
3. Fix any defects
4. Move to next phase

---

## Phase 1: Setup & Simple Routes ✅ IN PROGRESS

**Target Routes:**
- `/login` - Login page
- `/` - Dashboard
- `/help` or `/help-center` - Help center
- `/settings` - Settings page
- `/profile` - Profile page

**Why These Routes:**
- No dynamic parameters
- No complex navigation logic
- Simple components
- Good for proof of concept

**Tasks:**
- [x] Install React Router
- [ ] Set up HashRouter infrastructure
- [ ] Create route configuration file
- [ ] Migrate 5 simple routes
- [ ] Update NavigationContext to work with both routers
- [ ] Test all migrated routes
- [ ] Fix any defects

**Success Criteria:**
- All 5 routes work correctly
- Navigation works (sidebar, mobile nav)
- No regressions in unmigrated routes
- Tests pass

---

## Phase 2: Client List Routes (Next)

**Target Routes:**
- `/clients` - Clients list
- `/clients/add` - Add client page
- `/prospects` - Prospects list
- `/prospects/new` - Add prospect page

**Why These Routes:**
- Still relatively simple
- No dynamic parameters
- Frequently used routes

**Tasks:**
- Migrate client list routes
- Update navigation components
- Test thoroughly
- Fix defects

---

## Phase 3: Dynamic Routes with Parameters

**Target Routes:**
- `/clients/:clientId` - Client detail (defaults to personal)
- `/clients/:clientId/personal` - Client personal info
- `/clients/:clientId/portfolio` - Client portfolio
- `/prospect-detail/:prospectId` - Prospect detail

**Why These Routes:**
- Introduce route parameters
- Start using loaders for data fetching
- More complex navigation

**Tasks:**
- Migrate dynamic routes
- Implement loaders for data fetching
- Update pages to use `useParams()` instead of URL parsing
- Test parameter extraction
- Fix defects

---

## Phase 4: Nested Client Routes

**Target Routes:**
- All `/clients/:clientId/*` routes as nested routes
- Extract shared ClientLayout

**Why These Routes:**
- Demonstrate nested routing
- Reduce layout duplication
- Better code organization

**Tasks:**
- Refactor to nested route structure
- Create ClientLayout component
- Migrate all client detail routes
- Test nested navigation
- Fix defects

---

## Phase 5: Remaining Routes

**Target Routes:**
- All remaining routes
- Calendar, Tasks, Analytics, etc.

**Tasks:**
- Migrate remaining routes
- Clean up old router code
- Update all tests
- Final testing

---

## Phase 6: Cleanup & Optimization

**Tasks:**
- Remove old hash router code
- Remove `useHashRouter` hook
- Update all documentation
- Performance optimization
- Final E2E testing

---

## Testing Strategy

### After Each Phase:
1. **Manual Testing:**
   - Navigate to each migrated route
   - Test navigation from sidebar
   - Test mobile navigation
   - Test browser back/forward
   - Test direct URL access

2. **Automated Testing:**
   - Update E2E tests for migrated routes
   - Add route-specific unit tests
   - Run full test suite

3. **Regression Testing:**
   - Verify unmigrated routes still work
   - Check for console errors
   - Verify no performance degradation

---

## Rollback Plan

If issues arise:
1. Keep old router code until Phase 6
2. Feature flag to switch between routers
3. Can revert individual route migrations
4. Git branches for each phase

---

## Progress Tracking

- **Phase 1:** 🟡 In Progress
- **Phase 2:** ⚪ Not Started
- **Phase 3:** ⚪ Not Started
- **Phase 4:** ⚪ Not Started
- **Phase 5:** ⚪ Not Started
- **Phase 6:** ⚪ Not Started

---

## Notes

- Using `HashRouter` initially to avoid breaking existing URLs
- Can migrate to `BrowserRouter` later if needed
- Both routers can coexist during migration
- Focus on stability over speed

