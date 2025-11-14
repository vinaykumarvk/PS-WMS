# Module Development Template

Use this template for each module to ensure consistency and enable parallel development.

---

## Module: [Module Name]

**Agent/Developer:** [Name]  
**Module ID:** [A/B/C/D/E]  
**Duration:** [X weeks]  
**Start Date:** [Date]  
**Target Completion:** [Date]

---

## Dependencies

### Required (Must be completed first)
- [ ] F1: Type Definitions & Interfaces
- [ ] F2: API Contracts & Schemas
- [ ] F3: Shared Utilities & Helpers
- [ ] F4: Design System Components

### Optional (Can be developed in parallel)
- [ ] Module [X]: [Module Name]
- [ ] Module [Y]: [Module Name]

---

## Module Overview

**Purpose:** [Brief description of what this module does]

**User Story:**
```
As a [user type]
I want to [action]
So that [benefit]
```

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## Technical Design

### Components
1. **[Component Name]**
   - **Purpose:** [What it does]
   - **Props:** [Interface]
   - **State:** [State management]
   - **Dependencies:** [Other components/utilities]

2. **[Component Name]**
   - ...

### API Endpoints
1. **`GET /api/[endpoint]`**
   - **Purpose:** [What it does]
   - **Request:** [Schema]
   - **Response:** [Schema]
   - **Errors:** [Error codes]

2. **`POST /api/[endpoint]`**
   - ...

### State Management
```typescript
// Module-specific state
interface ModuleState {
  // State properties
}

// Actions
interface ModuleActions {
  // Action methods
}
```

### Integration Points
- **Uses:** [Other modules/APIs this module uses]
- **Used By:** [Other modules that will use this module]
- **Shared State:** [What state is shared with other modules]

---

## File Structure

```
client/src/pages/order-management/
  ├── components/
  │   └── [module-name]/
  │       ├── [component-1].tsx
  │       ├── [component-2].tsx
  │       └── index.ts
  ├── hooks/
  │   └── use-[module-name].ts
  ├── types/
  │   └── [module-name].types.ts
  └── utils/
      └── [module-name].utils.ts

server/
  ├── routes/
  │   └── [module-name].ts
  └── services/
      └── [module-name]-service.ts
```

---

## Development Checklist

### Setup
- [ ] Create feature branch: `feature/module-[id]-[name]`
- [ ] Review foundation modules (F1-F4)
- [ ] Set up module structure
- [ ] Create initial component skeletons

### Development
- [ ] Implement components
- [ ] Implement API endpoints
- [ ] Add state management
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add empty states

### Integration
- [ ] Integrate with shared state
- [ ] Integrate with other modules (if needed)
- [ ] Update main order flow
- [ ] Update navigation

### Testing
- [ ] Unit tests (>90% coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing
- [ ] Cross-browser testing
- [ ] Mobile testing

### Documentation
- [ ] Component documentation
- [ ] API documentation
- [ ] Usage examples
- [ ] Integration guide

### Code Review
- [ ] Self-review completed
- [ ] Code review requested
- [ ] Review comments addressed
- [ ] Approved for merge

---

## Testing Strategy

### Unit Tests
```typescript
describe('[Component Name]', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('[Module Name] Integration', () => {
  it('should integrate with [other module]', () => {
    // Test implementation
  });
});
```

### E2E Tests
```typescript
test('complete [module] flow', async () => {
  // Test implementation
});
```

---

## API Mocking

### Development Mock
```typescript
// Mock API for development
export const mock[Module]API = {
  getData: async () => {
    return {
      // Mock response
    };
  },
};
```

### Testing Mock
```typescript
// Mock for testing
vi.mock('@/api/[module]', () => ({
  [module]API: {
    getData: vi.fn(),
  },
}));
```

---

## Performance Considerations

- [ ] Components lazy loaded
- [ ] API responses cached
- [ ] Images optimized
- [ ] Bundle size checked
- [ ] Performance benchmarks met

---

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] ARIA labels added
- [ ] Color contrast checked
- [ ] Focus management correct

---

## Known Issues & Limitations

1. **Issue:** [Description]
   - **Impact:** [What it affects]
   - **Workaround:** [If any]
   - **Fix Plan:** [When/how to fix]

---

## Dependencies on Other Modules

### Blocks Other Modules
- [ ] None
- [ ] Module [X] - [Reason]

### Blocked By Other Modules
- [ ] None
- [ ] Module [X] - [Reason]

---

## Integration Notes

### How to Integrate This Module

1. Import components:
```typescript
import { [Component] } from '@/pages/order-management/components/[module-name]';
```

2. Add to routing:
```typescript
// Add route if needed
```

3. Update state management:
```typescript
// Add module state if needed
```

### Breaking Changes
- [ ] None
- [ ] [Description of breaking changes]

---

## Progress Tracking

### Week 1
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Week 2
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

---

## Notes

[Any additional notes, decisions, or considerations]

---

**Last Updated:** [Date]  
**Status:** [In Progress / Completed / Blocked]

