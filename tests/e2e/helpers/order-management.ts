/**
 * E2E Test Helpers - Order Management
 * Provides utilities for testing order management features
 */

import { Page, expect } from '@playwright/test';

/**
 * Navigate to order management page
 */
export async function navigateToOrderManagement(page: Page): Promise<void> {
  await page.goto('/#/order-management');
  await page.waitForSelector('h1:has-text("Order Management")', { timeout: 10000 });
}

/**
 * Add product to cart
 */
export async function addProductToCart(
  page: Page,
  productName: string,
  amount: number
): Promise<void> {
  // Find product by name and click "Add to Cart"
  const productCard = page.locator(`text=${productName}`).locator('..').locator('..');
  await productCard.locator('button:has-text("Add to Cart")').click();
  
  // Wait for add to cart dialog
  await page.waitForSelector('text=Order Type', { timeout: 5000 });
  
  // Fill in order details
  await page.fill('input[placeholder*="Amount"], input[type="number"]', amount.toString());
  
  // Submit dialog
  await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
  
  // Wait for dialog to close
  await page.waitForSelector('text=Order Type', { state: 'hidden', timeout: 5000 });
}

/**
 * Open quick order dialog
 */
export async function openQuickOrderDialog(page: Page): Promise<void> {
  // Click quick invest button (floating action button)
  await page.click('button[aria-label*="Quick Invest"], button:has-text("Quick Invest")');
  await page.waitForSelector('text=Quick Order', { timeout: 5000 });
}

/**
 * Place quick order
 */
export async function placeQuickOrder(
  page: Page,
  productName: string,
  amount: number
): Promise<void> {
  await openQuickOrderDialog(page);
  
  // Select product from favorites or recent orders
  await page.click(`text=${productName}`);
  
  // Enter amount
  await page.fill('input[placeholder*="Amount"], input[type="number"]', amount.toString());
  
  // Click place order
  await page.click('button:has-text("Place Order"), button:has-text("Confirm")');
  
  // Wait for success message or dialog to close
  await page.waitForSelector('text=Quick Order', { state: 'hidden', timeout: 5000 });
}

/**
 * Open portfolio sidebar
 */
export async function openPortfolioSidebar(page: Page): Promise<void> {
  await page.click('button:has-text("Show Portfolio"), button:has-text("Portfolio")');
  await page.waitForSelector('text=Portfolio Overview', { timeout: 5000 });
}

/**
 * Open switch dialog
 */
export async function openSwitchDialog(page: Page): Promise<void> {
  await page.click('button:has-text("Switch Funds")');
  await page.waitForSelector('text=Switch', { timeout: 5000 });
}

/**
 * Open redemption dialog
 */
export async function openRedemptionDialog(page: Page): Promise<void> {
  await page.click('button:has-text("Redeem")');
  await page.waitForSelector('text=Redemption', { timeout: 5000 });
}

/**
 * Open SIP dialog
 */
export async function openSIPDialog(page: Page): Promise<void> {
  await page.click('button:has-text("Create SIP")');
  await page.waitForSelector('text=SIP', { timeout: 5000 });
}

/**
 * Submit order
 */
export async function submitOrder(page: Page): Promise<void> {
  // Navigate to review tab
  await page.click('button:has-text("Review"), [role="tab"]:has-text("Review")');
  
  // Fill required fields if not already filled
  // Transaction mode
  const transactionMode = page.locator('input[name="transactionMode"], select[name="transactionMode"]');
  if (await transactionMode.count() > 0) {
    await transactionMode.first().selectOption({ index: 0 });
  }
  
  // Click submit
  await page.click('button:has-text("Submit Order")');
  
  // Wait for success message
  await page.waitForSelector('text=Order Submitted, text=Success', { timeout: 10000 });
}

/**
 * Verify cart item count
 */
export async function verifyCartItemCount(page: Page, expectedCount: number): Promise<void> {
  const cartTab = page.locator('[role="tab"]:has-text("Cart")');
  const countText = await cartTab.textContent();
  const match = countText?.match(/\((\d+)\)/);
  const actualCount = match ? parseInt(match[1], 10) : 0;
  expect(actualCount).toBe(expectedCount);
}

/**
 * Clear cart
 */
export async function clearCart(page: Page): Promise<void> {
  await page.click('[role="tab"]:has-text("Cart")');
  
  // Remove all items
  const removeButtons = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]');
  const count = await removeButtons.count();
  
  for (let i = 0; i < count; i++) {
    await removeButtons.first().click();
    await page.waitForTimeout(500); // Wait for removal animation
  }
}

