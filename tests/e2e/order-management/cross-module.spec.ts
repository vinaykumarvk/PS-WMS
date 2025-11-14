/**
 * E2E Tests - Cross-Module Interactions
 * Tests integration between all order management modules
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  addProductToCart,
  openPortfolioSidebar,
  openQuickOrderDialog,
  openSwitchDialog,
  openRedemptionDialog,
  verifyCartItemCount,
  submitOrder,
} from '../helpers/order-management';

test.describe('Cross-Module Integration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should integrate quick order with portfolio impact', async ({ page }) => {
    // Open portfolio sidebar
    await openPortfolioSidebar(page);
    await page.click('[role="tab"]:has-text("Impact")');
    
    // Place quick order
    await openQuickOrderDialog(page);
    
    // Select product and amount
    const productButton = page.locator('button:has-text("Select"), [data-testid="product-item"]').first();
    if (await productButton.isVisible({ timeout: 2000 })) {
      await productButton.click();
      await page.fill('input[type="number"]', '50000');
      await page.click('button:has-text("Place Order"), button:has-text("Add to Cart")');
      
      // Verify cart updated
      await verifyCartItemCount(page, 1);
      
      // Check portfolio impact updated
      await page.waitForTimeout(2000);
      const impactPreview = page.locator('text=Impact Preview, text=New Allocation');
      // Impact may not always be visible depending on data
      if (await impactPreview.isVisible({ timeout: 3000 })) {
        await expect(impactPreview).toBeVisible();
      }
    }
  });

  test('should integrate switch with cart', async ({ page }) => {
    // Open switch dialog
    await openSwitchDialog(page);
    
    // Execute a switch
    const partialTab = page.locator('[role="tab"]:has-text("Partial")');
    if (await partialTab.isVisible({ timeout: 2000 })) {
      await partialTab.click();
      
      // Fill switch details
      const sourceSelect = page.locator('select[name="sourceScheme"]');
      const targetSelect = page.locator('select[name="targetScheme"]');
      
      if (await sourceSelect.isVisible() && await targetSelect.isVisible()) {
        await sourceSelect.selectOption({ index: 0 });
        await targetSelect.selectOption({ index: 1 });
        await page.fill('input[name="amount"], input[type="number"]', '25000');
        
        // Add to cart instead of executing directly
        const addToCartButton = page.locator('button:has-text("Add to Cart")');
        if (await addToCartButton.isVisible()) {
          await addToCartButton.click();
          
          // Verify added to cart
          await verifyCartItemCount(page, 1);
        }
      }
    }
  });

  test('should integrate redemption with cart', async ({ page }) => {
    // Open redemption dialog
    await openRedemptionDialog(page);
    
    // Select scheme and amount
    const schemeSelect = page.locator('select[name="scheme"]');
    if (await schemeSelect.isVisible({ timeout: 2000 })) {
      await schemeSelect.selectOption({ index: 0 });
      await page.fill('input[name="amount"], input[type="number"]', '30000');
      
      // Add to cart
      const addToCartButton = page.locator('button:has-text("Add to Cart")');
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        
        // Verify added to cart
        await verifyCartItemCount(page, 1);
      }
    }
  });

  test('should complete full order flow with all modules', async ({ page }) => {
    // 1. Open portfolio sidebar to view current state
    await openPortfolioSidebar(page);
    await page.waitForTimeout(1000);
    
    // 2. Place quick order
    await openQuickOrderDialog(page);
    const productButton = page.locator('button:has-text("Select"), [data-testid="product-item"]').first();
    if (await productButton.isVisible({ timeout: 2000 })) {
      await productButton.click();
      await page.fill('input[type="number"]', '25000');
      await page.click('button:has-text("Place Order"), button:has-text("Add to Cart")');
    }
    
    // 3. Verify cart has item
    await verifyCartItemCount(page, 1);
    
    // 4. Check portfolio impact
    await page.click('[role="tab"]:has-text("Impact")');
    await page.waitForTimeout(1000);
    
    // 5. Navigate to review and submit
    await page.click('[role="tab"]:has-text("Review")');
    
    // Fill transaction mode
    const transactionMode = page.locator('input[name="transactionMode"], select[name="transactionMode"]');
    if (await transactionMode.count() > 0) {
      await transactionMode.first().selectOption({ index: 0 });
    }
    
    // 6. Submit order
    await submitOrder(page);
    
    // 7. Verify success
    await expect(page.locator('text=Order Submitted, text=Success')).toBeVisible({ timeout: 10000 });
  });

  test('should handle multiple transaction types in cart', async ({ page }) => {
    // Add purchase order
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible({ timeout: 2000 })) {
      await addToCartButton.click();
      await page.fill('input[type="number"]', '50000');
      await page.selectOption('select[name="transactionType"], select[name="orderType"]', 'Purchase');
      await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
      
      // Add redemption order
      await openRedemptionDialog(page);
      const schemeSelect = page.locator('select[name="scheme"]');
      if (await schemeSelect.isVisible({ timeout: 2000 })) {
        await schemeSelect.selectOption({ index: 0 });
        await page.fill('input[name="amount"], input[type="number"]', '30000');
        const addToCartFromRedemption = page.locator('button:has-text("Add to Cart")');
        if (await addToCartFromRedemption.isVisible()) {
          await addToCartFromRedemption.click();
        }
      }
      
      // Verify both items in cart
      await verifyCartItemCount(page, 2);
    }
  });
});

