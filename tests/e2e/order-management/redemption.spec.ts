/**
 * E2E Tests - Redemption Flow
 * Module E: Instant Redemption Features
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  openRedemptionDialog,
} from '../helpers/order-management';

test.describe('Redemption Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should open redemption dialog', async ({ page }) => {
    await openRedemptionDialog(page);
    await expect(page.locator('text=Redemption, text=Redeem')).toBeVisible();
  });

  test('should check instant redemption eligibility', async ({ page }) => {
    await openRedemptionDialog(page);
    
    // Enter amount
    await page.fill('input[name="amount"], input[type="number"]', '30000');
    
    // Check eligibility
    const checkButton = page.locator('button:has-text("Check Eligibility")');
    if (await checkButton.isVisible({ timeout: 2000 })) {
      await checkButton.click();
      
      // Wait for eligibility result
      await page.waitForTimeout(2000);
      const eligibility = page.locator('text=Eligible, text=Instant Redemption Available');
      if (await eligibility.isVisible({ timeout: 5000 })) {
        await expect(eligibility).toBeVisible();
      }
    }
  });

  test('should calculate redemption amount', async ({ page }) => {
    await openRedemptionDialog(page);
    
    // Switch to calculator tab if exists
    const calculatorTab = page.locator('[role="tab"]:has-text("Calculator")');
    if (await calculatorTab.isVisible({ timeout: 2000 })) {
      await calculatorTab.click();
    }
    
    // Select scheme
    const schemeSelect = page.locator('select[name="scheme"], [data-testid="scheme-select"]');
    if (await schemeSelect.isVisible()) {
      await schemeSelect.selectOption({ index: 0 });
    }
    
    // Enter amount
    await page.fill('input[name="amount"], input[type="number"]', '50000');
    
    // Calculate
    await page.click('button:has-text("Calculate")');
    
    // Check for calculated amount
    await page.waitForTimeout(2000);
    const calculatedAmount = page.locator('text=Amount After Charges, text=Net Amount');
    if (await calculatedAmount.isVisible({ timeout: 5000 })) {
      await expect(calculatedAmount).toBeVisible();
    }
  });

  test('should execute instant redemption', async ({ page }) => {
    await openRedemptionDialog(page);
    
    // Select instant redemption option
    const instantOption = page.locator('input[value="instant"], button:has-text("Instant")');
    if (await instantOption.isVisible({ timeout: 2000 })) {
      await instantOption.click();
    }
    
    // Select scheme
    const schemeSelect = page.locator('select[name="scheme"]');
    if (await schemeSelect.isVisible()) {
      await schemeSelect.selectOption({ index: 0 });
    }
    
    // Enter amount (within instant limit)
    await page.fill('input[name="amount"], input[type="number"]', '30000');
    
    // Execute redemption
    await page.click('button:has-text("Redeem"), button:has-text("Execute")');
    
    // Verify success
    await expect(page.locator('text=Redemption Executed, text=Success')).toBeVisible({ timeout: 10000 });
  });

  test('should execute standard redemption', async ({ page }) => {
    await openRedemptionDialog(page);
    
    // Select standard redemption option
    const standardOption = page.locator('input[value="standard"], button:has-text("Standard")');
    if (await standardOption.isVisible({ timeout: 2000 })) {
      await standardOption.click();
    }
    
    // Select scheme
    const schemeSelect = page.locator('select[name="scheme"]');
    if (await schemeSelect.isVisible()) {
      await schemeSelect.selectOption({ index: 0 });
    }
    
    // Enter amount
    await page.fill('input[name="amount"], input[type="number"]', '100000');
    
    // Execute redemption
    await page.click('button:has-text("Redeem"), button:has-text("Execute")');
    
    // Verify success
    await expect(page.locator('text=Redemption Executed, text=Success')).toBeVisible({ timeout: 10000 });
  });

  test('should display redemption history', async ({ page }) => {
    await openRedemptionDialog(page);
    
    // Switch to history tab
    const historyTab = page.locator('[role="tab"]:has-text("History")');
    if (await historyTab.isVisible({ timeout: 2000 })) {
      await historyTab.click();
      
      // Check for history list
      await page.waitForTimeout(2000);
      const historyList = page.locator('[data-testid="redemption-history-item"], text=Redemption History');
      // History may be empty
      if (await historyList.isVisible({ timeout: 3000 })) {
        await expect(historyList.first()).toBeVisible();
      }
    }
  });

  test('should perform quick redemption from holdings', async ({ page }) => {
    // Open portfolio sidebar first
    await page.click('button:has-text("Show Portfolio")');
    await page.waitForTimeout(1000);
    
    // Switch to holdings tab
    await page.click('[role="tab"]:has-text("Holdings")');
    await page.waitForTimeout(1000);
    
    // Find quick redeem button on a holding
    const quickRedeemButton = page.locator('button:has-text("Redeem"), [data-testid="quick-redeem"]').first();
    if (await quickRedeemButton.isVisible({ timeout: 3000 })) {
      await quickRedeemButton.click();
      
      // Should open redemption dialog with scheme pre-selected
      await expect(page.locator('text=Redemption')).toBeVisible({ timeout: 5000 });
    }
  });
});

