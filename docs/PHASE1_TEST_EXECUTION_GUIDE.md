# Phase 1: Module 1 & Module 2 - Test Execution Guide

**Document Version:** 1.0  
**Created:** December 2024  
**Status:** Ready for Execution

---

## Overview

This guide provides instructions for executing the comprehensive test suite for Phase 1 Modules 1 and 2:
- **Module 1:** Order Confirmation & Receipts (3 weeks)
- **Module 2:** Integration Testing & Bug Fixes (2 weeks)

---

## Test Files Created

### 1. Test Cases Document
**Location:** `docs/PHASE1_MODULE1_MODULE2_TEST_CASES.md`

Comprehensive test cases document with 100+ test cases covering:
- Module 1.1: Order Confirmation Page (11 test cases)
- Module 1.2: PDF Receipt Generation (8 test cases)
- Module 1.3: Email Notifications (8 test cases)
- Module 1.4: Order Timeline/Tracking (10 test cases)
- Module 2.1: Frontend-Backend Integration Testing (10 test cases)
- Module 2.2: End-to-End Testing (10 test cases)
- Module 2.3: Bug Fixes (10 test cases)
- Module 2.4: Performance Optimization (10 test cases)

### 2. Unit/Component Tests
**Location:** `client/src/pages/order-management/__tests__/module1-order-confirmation.test.tsx`

React component tests using Vitest and React Testing Library covering:
- Order Confirmation Page component
- Order Summary component
- Order Timeline component
- Receipt Actions component
- Error handling
- Loading states

### 3. Integration Tests
**Location:** `tests/integration/module1-module2-integration.test.ts`

API integration tests using Vitest covering:
- Order Confirmation API endpoints
- PDF Receipt Generation API
- Email Sending API
- Order Timeline API
- Authentication integration
- Error handling
- Performance testing

### 4. End-to-End Tests
**Location:** `tests/e2e/module1-module2-e2e.test.ts`

E2E tests using Playwright covering:
- Complete order flow
- Order confirmation page interactions
- PDF download
- Email sending
- Cross-browser testing
- Mobile device testing
- Performance testing

---

## Prerequisites

### 1. Environment Setup

```bash
# Install dependencies (if not already installed)
npm install

# Ensure all dependencies are up to date
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest playwright
```

### 2. Environment Variables

Ensure your `.env` file is configured:

```env
# API Configuration
API_URL=http://localhost:5000

# Database Configuration
DATABASE_URL=your_database_url

# Email Service (for Module 1.3 tests)
EMAIL_PROVIDER=MOCK
# or
EMAIL_PROVIDER=SendGrid
EMAIL_API_KEY=your_api_key
```

### 3. Test Data Setup

Before running tests, ensure test data is available:

```bash
# Run database migrations
npm run db:migrate

# Seed test data (if available)
npm run db:seed
```

### 4. Services Running

Ensure the following services are running:

```bash
# Terminal 1: Start backend server
npm run dev:server
# or
npm run server

# Terminal 2: Start frontend server
npm run dev:client
# or
npm run dev
```

---

## Running Tests

### Option 1: Run All Tests

```bash
# Run all unit/integration tests
npm run test

# Run all E2E tests
npm run test:e2e

# Run both (if configured)
npm run test:all
```

### Option 2: Run Specific Test Suites

#### Unit/Component Tests

```bash
# Run Module 1 component tests
npm run test client/src/pages/order-management/__tests__/module1-order-confirmation.test.tsx

# Run with coverage
npm run test:coverage client/src/pages/order-management/__tests__/module1-order-confirmation.test.tsx

# Run in watch mode (for development)
npm run test:watch client/src/pages/order-management/__tests__/module1-order-confirmation.test.tsx
```

#### Integration Tests

```bash
# Run Module 1 & 2 integration tests
npm run test tests/integration/module1-module2-integration.test.ts

# Run with verbose output
npm run test -- --reporter=verbose tests/integration/module1-module2-integration.test.ts
```

#### E2E Tests

```bash
# Run Module 1 & 2 E2E tests
npx playwright test tests/e2e/module1-module2-e2e.test.ts

# Run with UI mode (interactive)
npx playwright test tests/e2e/module1-module2-e2e.test.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/e2e/module1-module2-e2e.test.ts --headed

# Run specific browser
npx playwright test tests/e2e/module1-module2-e2e.test.ts --project=chromium
```

### Option 3: Run Tests by Module

#### Module 1 Tests Only

```bash
# Unit tests for Module 1
npm run test -- --grep "Module 1"

# Integration tests for Module 1
npm run test tests/integration/module1-module2-integration.test.ts -- --grep "Module 1"

# E2E tests for Module 1
npx playwright test tests/e2e/module1-module2-e2e.test.ts --grep "Module 1"
```

#### Module 2 Tests Only

```bash
# Integration tests for Module 2
npm run test tests/integration/module1-module2-integration.test.ts -- --grep "Module 2"

# E2E tests for Module 2
npx playwright test tests/e2e/module1-module2-e2e.test.ts --grep "Module 2"
```

### Option 4: Run Tests by Test Case ID

```bash
# Run specific test case (example)
npm run test -- --grep "TC-M1-1.1-001"

# Run all critical priority tests
npm run test -- --grep "Critical"
```

---

## Test Execution Workflow

### Recommended Execution Order

1. **Unit/Component Tests First**
   ```bash
   npm run test client/src/pages/order-management/__tests__/module1-order-confirmation.test.tsx
   ```
   - Fastest feedback
   - Tests individual components
   - No external dependencies

2. **Integration Tests Second**
   ```bash
   npm run test tests/integration/module1-module2-integration.test.ts
   ```
   - Requires backend server running
   - Tests API endpoints
   - Requires database access

3. **E2E Tests Last**
   ```bash
   npx playwright test tests/e2e/module1-module2-e2e.test.ts
   ```
   - Requires both frontend and backend running
   - Tests complete user flows
   - Slowest but most comprehensive

### Daily Test Execution

For daily development:

```bash
# Quick test run (unit tests only)
npm run test:watch

# Before committing
npm run test && npm run test:e2e
```

### CI/CD Pipeline

For CI/CD pipelines:

```bash
# Run all tests with coverage
npm run test:coverage
npm run test:e2e -- --reporter=html

# Generate test reports
npm run test:report
```

---

## Test Results and Reporting

### Unit/Integration Test Results

Test results are displayed in the terminal. For detailed reports:

```bash
# Generate coverage report
npm run test:coverage

# Coverage report will be in:
# - coverage/index.html (open in browser)
# - coverage/coverage-summary.json
```

### E2E Test Results

Playwright generates HTML reports:

```bash
# After running E2E tests
npx playwright show-report

# Report location: playwright-report/index.html
```

### Test Reports Location

- **Unit/Integration Coverage:** `coverage/`
- **E2E HTML Report:** `playwright-report/`
- **Test Results JSON:** `test-results/`

---

## Troubleshooting

### Common Issues

#### 1. Tests Fail Due to Missing Services

**Error:** Connection refused or timeout

**Solution:**
```bash
# Ensure backend is running
npm run dev:server

# Ensure frontend is running
npm run dev:client

# Check ports are correct
# Backend: http://localhost:5000
# Frontend: http://localhost:5173 (or configured port)
```

#### 2. Authentication Issues

**Error:** 401 Unauthorized

**Solution:**
- Check test user credentials in test files
- Ensure authentication is properly configured
- Verify session cookies are being set

#### 3. Database Connection Issues

**Error:** Database connection failed

**Solution:**
```bash
# Check database is running
# Verify DATABASE_URL in .env
# Run migrations
npm run db:migrate
```

#### 4. Playwright Browser Issues

**Error:** Browser not found

**Solution:**
```bash
# Install Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

#### 5. Test Timeouts

**Error:** Test timeout exceeded

**Solution:**
- Increase timeout in test files
- Check network connectivity
- Verify services are responding quickly

---

## Test Maintenance

### Updating Tests

When features change:

1. Update test cases in `PHASE1_MODULE1_MODULE2_TEST_CASES.md`
2. Update corresponding test files
3. Run tests to verify updates
4. Update documentation

### Adding New Tests

1. Add test case to test cases document
2. Implement test in appropriate test file
3. Run test to verify it works
4. Update test summary

### Test Data Management

```bash
# Clean test data (if needed)
npm run db:clean

# Reset test database
npm run db:reset

# Seed fresh test data
npm run db:seed
```

---

## Performance Benchmarks

### Expected Performance Metrics

- **Page Load Time:** < 2 seconds
- **API Response Time:** < 1 second (standard), < 5 seconds (PDF generation)
- **PDF Generation:** < 5 seconds
- **Email Sending:** < 3 seconds
- **Test Execution Time:**
  - Unit tests: < 30 seconds
  - Integration tests: < 2 minutes
  - E2E tests: < 5 minutes

### Monitoring Performance

```bash
# Run performance tests
npm run test:performance

# Generate performance report
npm run test:performance:report
```

---

## Success Criteria

### Module 1 Success Criteria
- ✅ All critical priority tests pass
- ✅ All high priority tests pass
- ✅ 95%+ test coverage
- ✅ No critical bugs
- ✅ Performance benchmarks met

### Module 2 Success Criteria
- ✅ All critical priority tests pass
- ✅ All high priority tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Performance benchmarks met
- ✅ No critical bugs
- ✅ Bug fixes verified

---

## Next Steps

After completing test execution:

1. **Review Test Results**
   - Identify failing tests
   - Document bugs found
   - Prioritize fixes

2. **Fix Issues**
   - Address failing tests
   - Fix bugs found
   - Update tests as needed

3. **Re-run Tests**
   - Verify fixes work
   - Ensure no regressions
   - Update documentation

4. **Prepare for Phase 2**
   - Document test results
   - Update test cases
   - Prepare test infrastructure

---

## Support

For issues or questions:

1. Check test documentation
2. Review test cases document
3. Check existing test examples
4. Consult development team

---

## Appendix

### Test File Structure

```
wealthrm-app/
├── docs/
│   ├── PHASE1_MODULE1_MODULE2_TEST_CASES.md (Test cases document)
│   └── PHASE1_TEST_EXECUTION_GUIDE.md (This file)
├── client/src/pages/order-management/__tests__/
│   └── module1-order-confirmation.test.tsx (Unit/component tests)
├── tests/
│   ├── integration/
│   │   └── module1-module2-integration.test.ts (Integration tests)
│   └── e2e/
│       └── module1-module2-e2e.test.ts (E2E tests)
└── coverage/ (Generated coverage reports)
└── playwright-report/ (Generated E2E reports)
```

### Useful Commands Reference

```bash
# Test Commands
npm run test                    # Run all unit/integration tests
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run tests with coverage
npm run test:e2e                # Run E2E tests
npm run test:all                # Run all tests

# Playwright Commands
npx playwright test             # Run all E2E tests
npx playwright test --ui        # Run with UI mode
npx playwright test --headed    # Run in headed mode
npx playwright show-report      # Show test report
npx playwright install          # Install browsers

# Database Commands
npm run db:migrate              # Run migrations
npm run db:seed                 # Seed test data
npm run db:reset                # Reset database
```

---

**Document Status:** Ready for Execution  
**Last Updated:** December 2024  
**Next Review:** After Test Execution

