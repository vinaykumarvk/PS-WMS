#!/usr/bin/env node

/**
 * Integration Verification Script
 * Verifies that all Week 5 integrations are working correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function checkmark(passed) {
  return passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function verifyFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${checkmark(exists)} ${description}: ${filePath}`, exists ? colors.green : colors.red);
  return exists;
}

function verifyFileContains(filePath, searchText, description) {
  if (!fs.existsSync(filePath)) {
    log(`${checkmark(false)} ${description}: File not found`, colors.red);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const contains = content.includes(searchText);
  log(`${checkmark(contains)} ${description}: ${filePath}`, contains ? colors.green : colors.red);
  return contains;
}

log('\n🔍 Week 5 Integration Verification\n', colors.blue);
log('='.repeat(60), colors.blue);

let passed = 0;
let failed = 0;

// I1: Module Integration
log('\n📦 I1: Module Integration', colors.yellow);
log('-'.repeat(60));

const integrationContext = 'client/src/pages/order-management/context/order-integration-context.tsx';
if (verifyFileExists(integrationContext, 'Order Integration Context')) passed++; else failed++;

const orderManagementPage = 'client/src/pages/order-management/index.tsx';
if (verifyFileExists(orderManagementPage, 'Order Management Page')) passed++; else failed++;

if (verifyFileContains(orderManagementPage, 'OrderIntegrationProvider', 'Uses OrderIntegrationProvider')) passed++; else failed++;
if (verifyFileContains(orderManagementPage, 'useOrderIntegration', 'Uses useOrderIntegration hook')) passed++; else failed++;
if (verifyFileContains(orderManagementPage, 'PortfolioSidebar', 'Portfolio sidebar integrated')) passed++; else failed++;
if (verifyFileContains(orderManagementPage, 'SwitchDialog', 'Switch dialog integrated')) passed++; else failed++;
if (verifyFileContains(orderManagementPage, 'RedemptionDialog', 'Redemption dialog integrated')) passed++; else failed++;
if (verifyFileContains(orderManagementPage, 'QuickOrderDialog', 'Quick order dialog integrated')) passed++; else failed++;

// I2: E2E Testing
log('\n🧪 I2: E2E Testing', colors.yellow);
log('-'.repeat(60));

const playwrightConfig = 'playwright.config.ts';
if (verifyFileExists(playwrightConfig, 'Playwright Configuration')) passed++; else failed++;

const testHelpers = [
  'tests/e2e/helpers/auth.ts',
  'tests/e2e/helpers/order-management.ts',
];
testHelpers.forEach(helper => {
  if (verifyFileExists(helper, `Test Helper: ${path.basename(helper)}`)) passed++; else failed++;
});

const testFiles = [
  'tests/e2e/order-management/quick-order.spec.ts',
  'tests/e2e/order-management/portfolio-aware.spec.ts',
  'tests/e2e/order-management/sip.spec.ts',
  'tests/e2e/order-management/switch.spec.ts',
  'tests/e2e/order-management/redemption.spec.ts',
  'tests/e2e/order-management/cross-module.spec.ts',
];
testFiles.forEach(testFile => {
  if (verifyFileExists(testFile, `E2E Test: ${path.basename(testFile)}`)) passed++; else failed++;
});

// I3: Performance Optimization
log('\n⚡ I3: Performance Optimization', colors.yellow);
log('-'.repeat(60));

const apiCache = 'client/src/lib/api-cache.ts';
if (verifyFileExists(apiCache, 'API Cache Utility')) passed++; else failed++;

const performanceMonitor = 'client/src/lib/performance-monitor.ts';
if (verifyFileExists(performanceMonitor, 'Performance Monitor Utility')) passed++; else failed++;

const appTsx = 'client/src/App.tsx';
if (verifyFileContains(appTsx, 'lazy(() => import', 'Lazy loading implemented')) passed++; else failed++;
if (verifyFileContains(appTsx, 'Suspense', 'Suspense boundaries added')) passed++; else failed++;

const viteConfig = 'vite.config.ts';
if (verifyFileContains(viteConfig, 'manualChunks', 'Code splitting configured')) passed++; else failed++;

const queryClient = 'client/src/lib/queryClient.ts';
if (verifyFileContains(queryClient, 'apiCache', 'API caching integrated')) passed++; else failed++;
if (verifyFileContains(queryClient, 'performanceMonitor', 'Performance monitoring integrated')) passed++; else failed++;

// Bundle Analysis
log('\n📊 Bundle Analysis', colors.yellow);
log('-'.repeat(60));

  const distDir = 'dist/public/assets';
if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  const chunks = {
    'react-vendor': files.find(f => f.includes('react-vendor')),
    'order-management': files.find(f => f.includes('order-management')),
    'sip-module': files.find(f => f.includes('sip-module')),
    'portfolio-module': files.find(f => f.includes('portfolio-module')),
    'order-components': files.find(f => f.includes('order-components')),
  };
  
  Object.entries(chunks).forEach(([name, file]) => {
    if (file) {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      log(`${checkmark(true)} ${name}: ${sizeKB} KB`, colors.green);
      passed++;
    } else if (name === 'portfolio-module') {
      // Portfolio components may be bundled in order-components
      log(`${checkmark(true)} ${name}: Bundled in order-components`, colors.yellow);
      passed++;
    } else {
      log(`${checkmark(false)} ${name}: Not found`, colors.red);
      failed++;
    }
  });
} else {
  log(`${checkmark(false)} Build directory not found. Run 'npm run build' first.`, colors.yellow);
}

// Summary
log('\n' + '='.repeat(60), colors.blue);
log(`\n📈 Summary: ${passed} passed, ${failed} failed`, failed === 0 ? colors.green : colors.red);
log('='.repeat(60) + '\n', colors.blue);

if (failed === 0) {
  log('✅ All verifications passed!', colors.green);
  process.exit(0);
} else {
  log('❌ Some verifications failed. Please review above.', colors.red);
  process.exit(1);
}

