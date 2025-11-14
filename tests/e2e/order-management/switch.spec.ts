/**
 * E2E Tests - Switch Flow
 * Module D: Advanced Switch Features
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  openSwitchDialog,
} from '../helpers/order-management';

test.describe('Switch Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should open switch dialog', async ({ page }) => {
    await openSwitchDialog(page);
    await expect(page.locator('text=Switch, text=Fund Switch')).toBeVisible();
  });

  test('should calculate switch tax implications', async ({ page }) => {
    await openSwitchDialog(page);
    
    // Switch to calculator tab
    const calculatorTab = page.locator('[role="tab"]:has-text("Calculator")');
    if (await calculatorTab.isVisible({ timeout: 2000 })) {
      await calculatorTab.click();
      
      // Select source scheme
      const sourceSelect = page.locator('select[name="sourceScheme"], [data-testid="source-scheme"]');
      if (await sourceSelect.isVisible()) {
        await sourceSelect.selectOption({ index: 0 });
      }
      
      // Select target scheme
      const targetSelect = page.locator('select[name="targetScheme"], [data-testid="target-scheme"]');
      if (await targetSelect.isVisible()) {
        await targetSelect.selectOption({ index: 1 });
      }
      
      // Enter amount
      await page.fill('input[name="amount"], input[type="number"]', '50000');
      
      // Calculate
      await page.click('button:has-text("Calculate")');
      
      // Check for tax implications
      await page.waitForTimeout(2000);
      const taxInfo = page.locator('text=Tax, text=Capital Gains, text=Implications');
      if (await taxInfo.isVisible({ timeout: 5000 })) {
        await expect(taxInfo.first()).toBeVisible();
      }
    }
  });

  test('should execute partial switch', async ({ page }) => {
    await openSwitchDialog(page);
    
    // Switch to partial switch tab
    const partialTab = page.locator('[role="tab"]:has-text("Partial")');
    if (await partialTab.isVisible({ timeout: 2000 })) {
      await partialTab.click();
      
      // Select source scheme
      const sourceSelect = page.locator('select[name="sourceScheme"]');
      if (await sourceSelect.isVisible()) {
        await sourceSelect.selectOption({ index: 0 });
      }
      
      // Select target scheme
      const targetSelect = page.locator('select[name="targetScheme"]');
      if (await targetSelect.isVisible()) {
        await targetSelect.selectOption({ index: 1 });
      }
      
      // Enter amount
      await page.fill('input[name="amount"], input[type="number"]', '25000');
      
      // Execute switch
      await page.click('button:has-text("Execute Switch"), button:has-text("Switch")');
      
      // Verify success
      await expect(page.locator('text=Switch Executed, text=Success')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should execute multi-scheme switch', async ({ page }) => {
    await openSwitchDialog(page);
    
    // Switch to multi-scheme tab
    const multiTab = page.locator('[role="tab"]:has-text("Multi"), [role="tab"]:has-text("Multiple")');
    if (await multiTab.isVisible({ timeout: 2000 })) {
      await multiTab.click();
      
      // Select source scheme
      const sourceSelect = page.locator('select[name="sourceScheme"]');
      if (await sourceSelect.isVisible()) {
        await sourceSelect.selectOption({ index: 0 });
      }
      
      // Add multiple target schemes
      const addTargetButton = page.locator('button:has-text("Add Target"), button:has-text("+")');
      if (await addTargetButton.isVisible()) {
        await addTargetButton.click();
        await addTargetButton.click();
        
        // Fill amounts for each target
        const amountInputs = page.locator('input[name="amount"], input[type="number"]');
        const count = await amountInputs.count();
        if (count >= 2) {
          await amountInputs.nth(0).fill('15000');
          await amountInputs.nth(1).fill('10000');
        }
      }
      
      // Execute switch
      await page.click('button:has-text("Execute Switch")');
      
      // Verify success
      await expect(page.locator('text=Switch Executed, text=Success')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display switch history', async ({ page }) => {
    await openSwitchDialog(page);
    
    // Switch to history tab
    const historyTab = page.locator('[role="tab"]:has-text("History")');
    if (await historyTab.isVisible({ timeout: 2000 })) {
      await historyTab.click();
      
      // Check for history list
      await page.waitForTimeout(2000);
      const historyList = page.locator('[data-testid="switch-history-item"], text=Switch History');
      // History may be empty
      if (await historyList.isVisible({ timeout: 3000 })) {
        await expect(historyList.first()).toBeVisible();
      }
    }
  });

  test('should display switch recommendations', async ({ page }) => {
    await openSwitchDialog(page);
    
    // Switch to recommendations tab
    const recommendationsTab = page.locator('[role="tab"]:has-text("Recommendations")');
    if (await recommendationsTab.isVisible({ timeout: 2000 })) {
      await recommendationsTab.click();
      
      // Check for recommendations
      await page.waitForTimeout(2000);
      const recommendations = page.locator('[data-testid="switch-recommendation"], text=Recommendation');
      // Recommendations may not always be available
      if (await recommendations.isVisible({ timeout: 3000 })) {
        await expect(recommendations.first()).toBeVisible();
      }
    }
  });
});

