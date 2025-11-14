/**
 * Module 2.2: End-to-End Testing - Order Confirmation Flow
 * Tests the complete order confirmation flow including receipt generation and email
 */

import { test, expect } from '@playwright/test';

test.describe('Order Confirmation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to order management page
    await page.goto('/#/order-management');
    await page.waitForLoadState('networkidle');
  });

  test('should display order confirmation page after order submission', async ({ page }) => {
    // This test assumes an order has been submitted
    // In a real scenario, you would submit an order first
    
    // Navigate directly to confirmation page (for testing)
    const orderId = 12345; // Mock order ID
    await page.goto(`/#/order-management/orders/${orderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Check for order confirmation elements
    await expect(page.locator('h1:has-text("Order Confirmation")')).toBeVisible();
    await expect(page.locator('text=Order Submitted Successfully')).toBeVisible();
  });

  test('should display order summary with correct details', async ({ page }) => {
    const orderId = 12345;
    await page.goto(`/#/order-management/orders/${orderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Check for order summary section
    await expect(page.locator('text=Order Summary')).toBeVisible();
    await expect(page.locator('text=Order Items')).toBeVisible();
    await expect(page.locator('text=Total Amount')).toBeVisible();
  });

  test('should display order timeline', async ({ page }) => {
    const orderId = 12345;
    await page.goto(`/#/order-management/orders/${orderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Check for timeline section
    await expect(page.locator('text=Order Timeline')).toBeVisible();
  });

  test('should download PDF receipt', async ({ page }) => {
    const orderId = 12345;
    await page.goto(`/#/order-management/orders/${orderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download Receipt")'),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toContain('order-receipt');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should send email confirmation', async ({ page }) => {
    const orderId = 12345;
    await page.goto(`/#/order-management/orders/${orderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Click send email button
    await page.click('button:has-text("Send Email Confirmation")');

    // Wait for success toast
    await expect(page.locator('text=Email Sent')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back to order management', async ({ page }) => {
    const orderId = 12345;
    await page.goto(`/#/order-management/orders/${orderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Click back button
    await page.click('button:has-text("Back to Orders")');

    // Should navigate to order management page
    await expect(page).toHaveURL(/#\/order-management/);
  });

  test('should handle order not found error', async ({ page }) => {
    const invalidOrderId = 99999;
    await page.goto(`/#/order-management/orders/${invalidOrderId}/confirmation`);
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('text=Failed to load order confirmation')).toBeVisible();
  });
});

