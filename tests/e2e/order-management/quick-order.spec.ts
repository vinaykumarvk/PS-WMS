/**
 * E2E Tests - Quick Order Flow
 * Module A: Quick Order Placement
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  openQuickOrderDialog,
  placeQuickOrder,
  verifyCartItemCount,
  submitOrder,
} from '../helpers/order-management';

test.describe('Quick Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should open quick order dialog', async ({ page }) => {
    await openQuickOrderDialog(page);
    await expect(page.locator('text=Quick Order')).toBeVisible();
  });

  test('should place quick order from favorites', async ({ page }) => {
    // This test assumes favorites are pre-populated
    await openQuickOrderDialog(page);
    
    // Check if favorites are visible
    const favoritesSection = page.locator('text=Favorites');
    if (await favoritesSection.isVisible()) {
      // Click first favorite
      const firstFavorite = page.locator('[data-testid="favorite-item"]').first();
      if (await firstFavorite.isVisible()) {
        await firstFavorite.click();
        
        // Enter amount
        await page.fill('input[type="number"]', '5000');
        
        // Place order
        await page.click('button:has-text("Place Order")');
        
        // Verify item added to cart
        await verifyCartItemCount(page, 1);
      }
    }
  });

  test('should place quick order from recent orders', async ({ page }) => {
    await openQuickOrderDialog(page);
    
    // Check if recent orders are visible
    const recentSection = page.locator('text=Recent Orders');
    if (await recentSection.isVisible()) {
      // Click first recent order
      const firstRecent = page.locator('[data-testid="recent-order-item"]').first();
      if (await firstRecent.isVisible()) {
        await firstRecent.click();
        
        // Verify dialog closes and item added
        await page.waitForTimeout(1000);
        await verifyCartItemCount(page, 1);
      }
    }
  });

  test('should use amount presets', async ({ page }) => {
    await openQuickOrderDialog(page);
    
    // Check for amount preset buttons
    const presetButtons = [
      page.locator('button:has-text("₹5K")'),
      page.locator('button:has-text("₹10K")'),
      page.locator('button:has-text("₹25K")'),
    ];
    
    for (const button of presetButtons) {
      if (await button.isVisible()) {
        await button.click();
        // Verify amount is set
        const amountInput = page.locator('input[type="number"]');
        const value = await amountInput.inputValue();
        expect(value).toBeTruthy();
        break;
      }
    }
  });

  test('should complete quick order flow end-to-end', async ({ page }) => {
    // Open quick order dialog
    await openQuickOrderDialog(page);
    
    // Select a product (if available)
    const productButton = page.locator('button:has-text("Select"), [data-testid="product-item"]').first();
    if (await productButton.isVisible({ timeout: 2000 })) {
      await productButton.click();
      
      // Enter amount
      await page.fill('input[type="number"]', '10000');
      
      // Place order
      await page.click('button:has-text("Place Order"), button:has-text("Add to Cart")');
      
      // Verify added to cart
      await verifyCartItemCount(page, 1);
      
      // Navigate to review and submit
      await page.click('[role="tab"]:has-text("Review")');
      
      // Fill transaction mode if required
      const transactionMode = page.locator('input[name="transactionMode"], select[name="transactionMode"]');
      if (await transactionMode.count() > 0) {
        await transactionMode.first().selectOption({ index: 0 });
      }
      
      // Submit order
      await submitOrder(page);
      
      // Verify success
      await expect(page.locator('text=Order Submitted, text=Success')).toBeVisible({ timeout: 10000 });
    }
  });
});

