# Phase 4 Testing Guide - Nested Routes

**Date:** January 2025  
**Status:** Ready for Testing

---

## What Changed in Phase 4

### Refactored to Nested Routes Structure
- Client routes are now nested under `/clients/:clientId`
- All child routes share the same loader (better performance)
- Better code organization
- Routes are cleaner and more maintainable

### Route Structure
```
/clients/:clientId (parent)
  ├── index → redirects to /personal
  ├── personal
  ├── portfolio
  ├── actions
  ├── interactions
  ├── transactions
  ├── communications
  ├── appointments
  ├── tasks
  ├── insights
  └── goals
```

---

## Testing Checklist

### 1. Basic Navigation ✅
- [ ] Navigate to `/clients/1` → Should redirect to `/clients/1/personal`
- [ ] Navigate to `/clients/1/personal` → Should load personal page
- [ ] Navigate to `/clients/1/portfolio` → Should load portfolio page
- [ ] Navigate to `/clients/1/actions` → Should load actions page
- [ ] Test all other client detail routes

### 2. Route Parameters ✅
- [ ] Navigate to `/clients/123` → Should use clientId=123
- [ ] Navigate to `/clients/456/portfolio` → Should use clientId=456
- [ ] Verify client data loads correctly for each route
- [ ] Test with different client IDs

### 3. Navigation Between Client Pages ✅
- [ ] Click client card on `/clients` → Should navigate to `/clients/:id`
- [ ] Navigate between client tabs (personal → portfolio → transactions)
- [ ] Browser back/forward buttons work
- [ ] Direct URL access works

### 4. Data Loading ✅
- [ ] Client data loads correctly
- [ ] No duplicate API calls when navigating between client pages
- [ ] Loader prefetches data (check Network tab)
- [ ] Loading states work correctly

### 5. Query Parameters ✅
- [ ] Navigate to `/clients/1/personal?section=family` → Should work
- [ ] Query parameters preserved during navigation
- [ ] Hash fragments work (e.g., `#family-information-section`)

### 6. Error Handling ✅
- [ ] Navigate to `/clients/99999` (non-existent client) → Should handle gracefully
- [ ] Invalid client ID → Should show error or redirect
- [ ] Network errors → Should handle gracefully

### 7. Regression Testing ✅
- [ ] Unmigrated routes still work (`/calendar`, `/tasks`, etc.)
- [ ] No console errors
- [ ] No visual regressions
- [ ] Performance is acceptable

---

## Test Scenarios

### Scenario 1: Client Navigation Flow
1. Start at `/clients`
2. Click on a client card
3. Should navigate to `/clients/:id` → redirects to `/clients/:id/personal`
4. Click portfolio tab → Should navigate to `/clients/:id/portfolio`
5. Click transactions tab → Should navigate to `/clients/:id/transactions`
6. Click browser back → Should go back to portfolio
7. Click browser forward → Should go forward to transactions

### Scenario 2: Direct URL Access
1. Open new tab
2. Navigate directly to `#/clients/1/portfolio`
3. Should load portfolio page with correct client data
4. Navigate to `#/clients/1/personal?section=family`
5. Should load personal page and scroll to family section

### Scenario 3: Data Loading
1. Navigate to `/clients/1`
2. Check Network tab - should see client data request
3. Navigate to `/clients/1/portfolio`
4. Check Network tab - should NOT see duplicate client data request (cached)
5. Navigate to `/clients/2`
6. Check Network tab - should see new client data request

---

## Expected Behavior

### ✅ Should Work
- All client routes load correctly
- Navigation between client pages is smooth
- Client data is cached between page navigations
- Browser back/forward works
- Direct URL access works
- Query parameters work

### ⚠️ Known Limitations
- Hash URL compatibility maintained (wrapper components update `window.location.hash`)
- Pages still use their own `ClientPageLayout` (not using nested layout yet)
- This is intentional for gradual migration

---

## Performance Checks

- [ ] No duplicate API calls when navigating between client pages
- [ ] Page transitions are smooth
- [ ] No memory leaks (check with React DevTools)
- [ ] Loader prefetches data correctly

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (if applicable)

---

## Console Checks

- [ ] No React Router warnings
- [ ] No console errors
- [ ] No duplicate renders (check React DevTools)
- [ ] Route changes logged correctly

---

## Next Steps After Testing

1. **Fix any defects** found during testing
2. **Document issues** in test results
3. **Proceed to Phase 5** - Migrate remaining routes or cleanup

---

**Ready for Testing!** 🧪

