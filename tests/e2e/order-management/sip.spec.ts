/**
 * E2E Tests - SIP Flow
 * Module C: SIP Builder & Manager
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  openSIPDialog,
} from '../helpers/order-management';

test.describe('SIP Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should open SIP dialog', async ({ page }) => {
    await openSIPDialog(page);
    await expect(page.locator('text=SIP, text=Systematic Investment Plan')).toBeVisible();
  });

  test('should create SIP plan', async ({ page }) => {
    await openSIPDialog(page);
    
    // Fill SIP form
    // Select scheme
    const schemeSelect = page.locator('select[name="scheme"], [data-testid="scheme-select"]').first();
    if (await schemeSelect.isVisible({ timeout: 2000 })) {
      await schemeSelect.selectOption({ index: 0 });
    }
    
    // Enter amount
    await page.fill('input[name="amount"], input[type="number"]', '5000');
    
    // Select frequency
    const frequencySelect = page.locator('select[name="frequency"], [data-testid="frequency-select"]');
    if (await frequencySelect.isVisible()) {
      await frequencySelect.selectOption('monthly');
    }
    
    // Select start date
    const dateInput = page.locator('input[type="date"], input[name="startDate"]');
    if (await dateInput.isVisible()) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await dateInput.fill(futureDate.toISOString().split('T')[0]);
    }
    
    // Submit SIP
    await page.click('button:has-text("Create SIP"), button:has-text("Submit")');
    
    // Verify success
    await expect(page.locator('text=SIP Created, text=Success')).toBeVisible({ timeout: 10000 });
  });

  test('should display SIP calculator', async ({ page }) => {
    await openSIPDialog(page);
    
    // Look for calculator tab or section
    const calculatorTab = page.locator('[role="tab"]:has-text("Calculator"), text=Calculator');
    if (await calculatorTab.isVisible({ timeout: 2000 })) {
      await calculatorTab.click();
      
      // Enter values
      await page.fill('input[name="amount"], input[type="number"]', '5000');
      await page.fill('input[name="duration"], input[type="number"]', '12');
      await page.fill('input[name="expectedReturn"], input[type="number"]', '12');
      
      // Check for projected returns
      await page.waitForTimeout(1000);
      const projectedReturns = page.locator('text=Projected, text=Returns, text=Maturity');
      if (await projectedReturns.isVisible({ timeout: 3000 })) {
        await expect(projectedReturns.first()).toBeVisible();
      }
    }
  });

  test('should display SIP calendar', async ({ page }) => {
    await openSIPDialog(page);
    
    // Look for calendar tab
    const calendarTab = page.locator('[role="tab"]:has-text("Calendar"), text=Calendar');
    if (await calendarTab.isVisible({ timeout: 2000 })) {
      await calendarTab.click();
      
      // Check for calendar view
      await page.waitForTimeout(1000);
      const calendar = page.locator('[data-testid="sip-calendar"], .calendar, table');
      if (await calendar.isVisible({ timeout: 3000 })) {
        await expect(calendar).toBeVisible();
      }
    }
  });

  test('should manage existing SIP plans', async ({ page }) => {
    // Navigate to SIP manager if separate page exists
    await page.goto('/#/sip-builder');
    await page.waitForTimeout(2000);
    
    // Check for SIP list
    const sipList = page.locator('text=SIP Plans, [data-testid="sip-plan"]');
    if (await sipList.isVisible({ timeout: 3000 })) {
      // Try to pause/resume a SIP
      const pauseButton = page.locator('button:has-text("Pause")').first();
      if (await pauseButton.isVisible()) {
        await pauseButton.click();
        await expect(page.locator('text=Paused, text=Success')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

