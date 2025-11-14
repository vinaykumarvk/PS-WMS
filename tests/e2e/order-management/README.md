# Order Management E2E Test Suite

## Overview

This directory contains comprehensive end-to-end tests for the Order Management module.

## Test Files

### 1. `comprehensive-order-flow.spec.ts`
**Purpose:** Comprehensive test coverage for all order management features

**Test Sections:**
- Basic Order Flow (product browsing, cart management)
- Transaction Mode & Nominee Form
- Order Submission
- Overlays (Scheme Info, Order Info, Documents, Deviations)
- Order Book (viewing, filtering, authorization)
- Full Switch/Redemption
- Quick Order Flow
- Portfolio Integration
- Error Handling

**Total Tests:** ~50+ test cases

### 2. `complete-order-journey.spec.ts`
**Purpose:** End-to-end journey tests covering complete user flows

**Test Cases:**
- Complete order journey: product → cart → review → submit → confirmation
- Order with multiple products
- Order cancellation flow

### 3. `quick-order.spec.ts`
**Purpose:** Quick order placement features

**Test Cases:**
- Quick order dialog
- Favorites and recent orders
- Amount presets

### 4. `sip.spec.ts`
**Purpose:** SIP (Systematic Investment Plan) features

**Test Cases:**
- SIP creation
- SIP calculator
- SIP calendar
- SIP management

### 5. `switch.spec.ts`
**Purpose:** Fund switch features

**Test Cases:**
- Switch calculation
- Partial switch
- Multi-scheme switch
- Switch history and recommendations

### 6. `redemption.spec.ts`
**Purpose:** Redemption features

**Test Cases:**
- Instant redemption eligibility
- Redemption calculator
- Instant vs standard redemption
- Redemption history
- Quick redemption from holdings

### 7. `portfolio-aware.spec.ts`
**Purpose:** Portfolio-aware ordering features

**Test Cases:**
- Portfolio sidebar
- Allocation charts
- Impact preview
- Allocation gap analysis
- Rebalancing suggestions
- Holdings integration

### 8. `order-confirmation.test.ts`
**Purpose:** Order confirmation and receipt features

**Test Cases:**
- Order confirmation page
- Order summary
- Order timeline
- PDF receipt download
- Email confirmation

### 9. `cross-module.spec.ts`
**Purpose:** Cross-module integration tests

**Test Cases:**
- Quick order with portfolio impact
- Switch with cart integration
- Redemption with cart integration
- Multiple transaction types in cart

## Running Tests

### Run all order management tests:
```bash
npm run test:e2e -- tests/e2e/order-management/
```

### Run specific test file:
```bash
npm run test:e2e -- tests/e2e/order-management/comprehensive-order-flow.spec.ts
```

### Run with specific browser:
```bash
npm run test:e2e -- tests/e2e/order-management/comprehensive-order-flow.spec.ts --project=chromium
```

### Run specific test:
```bash
npm run test:e2e -- tests/e2e/order-management/comprehensive-order-flow.spec.ts --grep "should add product to cart"
```

### Run in headed mode (see browser):
```bash
npm run test:e2e -- tests/e2e/order-management/comprehensive-order-flow.spec.ts --headed
```

### Run with debug:
```bash
npm run test:e2e -- tests/e2e/order-management/comprehensive-order-flow.spec.ts --debug
```

## Test Helpers

Test helpers are located in `tests/e2e/helpers/`:

- `auth.ts` - Authentication utilities (login, logout)
- `order-management.ts` - Order management specific helpers

## Test Coverage

The test suite covers:

✅ Product browsing and search
✅ Cart management (add, remove, edit)
✅ Transaction mode selection
✅ Nominee form
✅ Order submission
✅ Order validation
✅ Order book viewing and filtering
✅ Order authorization (claim, release, authorize, reject)
✅ Quick order placement
✅ SIP creation and management
✅ Switch operations
✅ Redemption operations
✅ Portfolio integration
✅ Order confirmation
✅ Error handling
✅ Overlays (scheme info, order info, documents, deviations)

## Known Issues

When running tests, ensure:
1. Server is configured properly (database connection may be optional for some tests)
2. Test users exist in the system
3. Mock data is available for products and orders

## Debugging Failed Tests

1. Run tests in headed mode to see what's happening
2. Use `--debug` flag for step-by-step debugging
3. Check screenshots in `test-results/` directory
4. Review video recordings (if enabled) in `test-results/`

## Continuous Integration

Tests are designed to run in CI/CD pipelines. Ensure:
- `AUTOMATION_SCHEDULER_ENABLED=false` is set for test runs
- Database is properly configured or mocked
- Test users are available

