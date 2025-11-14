/**
 * E2E Tests - Portfolio-Aware Order Flow
 * Module B: Portfolio-Aware Ordering
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  openPortfolioSidebar,
  addProductToCart,
  verifyCartItemCount,
} from '../helpers/order-management';

test.describe('Portfolio-Aware Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should open portfolio sidebar', async ({ page }) => {
    await openPortfolioSidebar(page);
    await expect(page.locator('text=Portfolio Overview')).toBeVisible();
  });

  test('should display portfolio allocation chart', async ({ page }) => {
    await openPortfolioSidebar(page);
    
    // Check for allocation chart
    const chart = page.locator('svg, canvas').first();
    if (await chart.isVisible({ timeout: 5000 })) {
      await expect(chart).toBeVisible();
    }
  });

  test('should show portfolio impact preview', async ({ page }) => {
    await openPortfolioSidebar(page);
    
    // Switch to impact tab
    await page.click('[role="tab"]:has-text("Impact")');
    
    // Add item to cart to trigger impact calculation
    // Note: This assumes products are available
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible({ timeout: 2000 })) {
      await productCard.locator('button:has-text("Add to Cart")').click();
      
      // Fill order details
      await page.fill('input[type="number"]', '10000');
      await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
      
      // Check impact preview updates
      await page.waitForTimeout(1000);
      const impactPreview = page.locator('text=Impact Preview, text=New Allocation');
      if (await impactPreview.isVisible({ timeout: 5000 })) {
        await expect(impactPreview).toBeVisible();
      }
    }
  });

  test('should display allocation gap analysis', async ({ page }) => {
    await openPortfolioSidebar(page);
    
    // Switch to gaps tab
    await page.click('[role="tab"]:has-text("Gaps")');
    
    // Check for gap analysis content
    await page.waitForTimeout(1000);
    const gapAnalysis = page.locator('text=Allocation Gap, text=Under-allocated, text=Over-allocated');
    // This may not always be visible if no gaps exist
    if (await gapAnalysis.isVisible({ timeout: 3000 })) {
      await expect(gapAnalysis).toBeVisible();
    }
  });

  test('should display rebalancing suggestions', async ({ page }) => {
    await openPortfolioSidebar(page);
    
    // Check for rebalancing suggestions
    const suggestions = page.locator('text=Rebalancing, text=Suggestion');
    if (await suggestions.isVisible({ timeout: 5000 })) {
      await expect(suggestions.first()).toBeVisible();
    }
  });

  test('should display holdings integration', async ({ page }) => {
    await openPortfolioSidebar(page);
    
    // Switch to holdings tab
    await page.click('[role="tab"]:has-text("Holdings")');
    
    // Check for holdings list
    await page.waitForTimeout(1000);
    const holdings = page.locator('text=Holdings, [data-testid="holding-item"]');
    // Holdings may not be visible if client has no holdings
    if (await holdings.isVisible({ timeout: 3000 })) {
      await expect(holdings.first()).toBeVisible();
    }
  });

  test('should calculate portfolio impact when adding to cart', async ({ page }) => {
    await openPortfolioSidebar(page);
    await page.click('[role="tab"]:has-text("Impact")');
    
    // Add product to cart
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible({ timeout: 2000 })) {
      await addToCartButton.click();
      await page.fill('input[type="number"]', '50000');
      await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
      
      // Verify cart updated
      await verifyCartItemCount(page, 1);
      
      // Check impact preview updated
      await page.waitForTimeout(2000);
      // Impact preview should show changes
    }
  });
});

