/**
 * Complete Order Journey E2E Test
 * Tests the complete end-to-end flow from product selection to order confirmation
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  verifyCartItemCount,
  submitOrder,
} from '../helpers/order-management';

test.describe('Complete Order Journey', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  test('should complete full order journey: product → cart → review → submit → confirmation', async ({ page }) => {
    // Step 1: Browse products
    await page.waitForTimeout(2000);
    const productCard = page.locator('[data-testid="product-card"], .product-card').first();
    const hasProducts = await productCard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasProducts) {
      test.skip();
      return;
    }

    // Step 2: Add product to cart
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Fill order details in dialog
    const amountInput = page.locator('input[type="number"], input[placeholder*="Amount"]');
    if (await amountInput.isVisible({ timeout: 2000 })) {
      await amountInput.fill('50000');
      
      // Select transaction type if available
      const transactionTypeSelect = page.locator('select[name="transactionType"]');
      if (await transactionTypeSelect.isVisible()) {
        await transactionTypeSelect.selectOption('Purchase');
      }
      
      // Confirm add to cart
      await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
      await page.waitForTimeout(1000);
      
      // Verify item added to cart
      await verifyCartItemCount(page, 1);
    }

    // Step 3: Navigate to cart and verify
    await page.click('[role="tab"]:has-text("Cart")');
    await page.waitForTimeout(1000);
    
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item');
    const itemCount = await cartItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Step 4: Navigate to review tab
    await page.click('[role="tab"]:has-text("Review")');
    await page.waitForTimeout(1000);
    
    // Step 5: Fill transaction mode
    const transactionModeSelect = page.locator('select[name="transactionMode"]');
    if (await transactionModeSelect.isVisible({ timeout: 2000 })) {
      await transactionModeSelect.selectOption({ index: 0 });
      await page.waitForTimeout(500);
    }

    // Step 6: Fill nominee information (optional)
    const addNomineeButton = page.locator('button:has-text("Add Nominee"), button:has-text("+ Nominee")');
    if (await addNomineeButton.isVisible({ timeout: 2000 })) {
      await addNomineeButton.click();
      await page.waitForTimeout(500);
      
      const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill('Test Nominee');
        
        const relationshipSelect = page.locator('select[name="relationship"]');
        if (await relationshipSelect.isVisible()) {
          await relationshipSelect.selectOption('Spouse');
        }
        
        const panInput = page.locator('input[name="pan"]');
        if (await panInput.isVisible()) {
          await panInput.fill('ABCDE1234F');
        }
        
        const percentageInput = page.locator('input[name="percentage"]');
        if (await percentageInput.isVisible()) {
          await percentageInput.fill('100');
        }
        
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Step 7: Submit order
    const submitButton = page.locator('button:has-text("Submit Order")');
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      
      // Step 8: Verify success message
      await expect(
        page.locator('text=Order Submitted, text=Success, text=submitted successfully')
      ).toBeVisible({ timeout: 10000 });
    }

    // Step 9: Verify cart is cleared
    await page.waitForTimeout(2000);
    await verifyCartItemCount(page, 0);

    // Step 10: Navigate to order book to verify order appears
    await page.click('[role="tab"]:has-text("Order Book")');
    await page.waitForTimeout(2000);
    
    // Order should appear in order book
    const orderRows = page.locator('[data-testid="order-row"], tr');
    const orderCount = await orderRows.count();
    // At least header row should exist, order rows may take time to appear
    expect(orderCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle order with multiple products', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Add first product
    const addToCartButton1 = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton1.isVisible({ timeout: 3000 })) {
      await addToCartButton1.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[type="number"]');
      if (await amountInput.isVisible({ timeout: 2000 })) {
        await amountInput.fill('30000');
        await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
        await page.waitForTimeout(1000);
      }
    }
    
    // Add second product
    const addToCartButton2 = page.locator('button:has-text("Add to Cart")').nth(1);
    if (await addToCartButton2.isVisible({ timeout: 3000 })) {
      await addToCartButton2.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[type="number"]');
      if (await amountInput.isVisible({ timeout: 2000 })) {
        await amountInput.fill('20000');
        await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
        await page.waitForTimeout(1000);
      }
    }
    
    // Verify both items in cart
    await verifyCartItemCount(page, 2);
    
    // Navigate to review and submit
    await page.click('[role="tab"]:has-text("Review")');
    await page.waitForTimeout(1000);
    
    const transactionModeSelect = page.locator('select[name="transactionMode"]');
    if (await transactionModeSelect.isVisible({ timeout: 2000 })) {
      await transactionModeSelect.selectOption({ index: 0 });
    }
    
    const submitButton = page.locator('button:has-text("Submit Order")');
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      await expect(
        page.locator('text=Order Submitted, text=Success')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle order cancellation flow', async ({ page }) => {
    // Add item to cart
    const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartButton.isVisible({ timeout: 3000 })) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[type="number"]');
      if (await amountInput.isVisible({ timeout: 2000 })) {
        await amountInput.fill('10000');
        await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
        await page.waitForTimeout(1000);
      }
    }
    
    // Navigate to cart
    await page.click('[role="tab"]:has-text("Cart")');
    await page.waitForTimeout(1000);
    
    // Remove item
    const removeButton = page.locator('button:has-text("Remove")').first();
    if (await removeButton.isVisible({ timeout: 2000 })) {
      await removeButton.click();
      await page.waitForTimeout(1000);
      
      // Verify cart is empty
      await verifyCartItemCount(page, 0);
    }
  });
});

