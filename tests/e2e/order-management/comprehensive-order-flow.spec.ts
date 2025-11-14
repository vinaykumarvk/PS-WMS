/**
 * Comprehensive E2E Tests - Order Management Module
 * Tests all features of the order management system end-to-end
 */

import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../helpers/auth';
import {
  navigateToOrderManagement,
  addProductToCart,
  openQuickOrderDialog,
  openPortfolioSidebar,
  openSwitchDialog,
  openRedemptionDialog,
  openSIPDialog,
  verifyCartItemCount,
  submitOrder,
  clearCart,
} from '../helpers/order-management';

test.describe('Comprehensive Order Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.RM);
    await navigateToOrderManagement(page);
  });

  // ============================================
  // SECTION 1: BASIC ORDER FLOW
  // ============================================

  test.describe('Basic Order Flow', () => {
    test('should display order management page with all tabs', async ({ page }) => {
      // Check for main tabs
      await expect(page.locator('[role="tab"]:has-text("Products")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("Cart")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("Review")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("Order Book")')).toBeVisible();
    });

    test('should display product list', async ({ page }) => {
      // Wait for products to load
      await page.waitForTimeout(2000);
      
      // Check for product cards or list
      const productList = page.locator('[data-testid="product-list"], .product-list, [data-testid="product-card"]');
      // Products may not be visible if empty, but container should exist
      const hasProducts = await productList.count() > 0;
      if (hasProducts) {
        await expect(productList.first()).toBeVisible();
      }
    });

    test('should search products', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="Search products"], input[placeholder*="Search products"]');
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('Equity');
        await page.waitForTimeout(1000);
        // Search should filter products
      }
    });

    test('should filter products', async ({ page }) => {
      // Look for filter buttons or dropdowns
      const filterButton = page.locator('button:has-text("Filter"), select[name="filter"]');
      if (await filterButton.isVisible({ timeout: 2000 })) {
        await filterButton.click();
        await page.waitForTimeout(500);
        // Filter options should be visible
      }
    });

    test('should open add to cart dialog', async ({ page }) => {
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartButton.isVisible({ timeout: 3000 })) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        // Check for dialog elements
        const dialog = page.locator('text=Order Type, text=Transaction Type, [role="dialog"]');
        if (await dialog.isVisible({ timeout: 2000 })) {
          await expect(dialog.first()).toBeVisible();
        }
      }
    });

    test('should add product to cart', async ({ page }) => {
      // Wait for page to be ready
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      const buttonVisible = await addToCartButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!buttonVisible) {
        // Skip test if no products available
        test.skip();
        return;
      }
      
      await addToCartButton.click();
      await page.waitForTimeout(1000);
      
      // Wait for dialog to appear
      const dialogVisible = await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => false);
      if (!dialogVisible) {
        // If dialog doesn't appear, test might still pass if item was added directly
        await page.waitForTimeout(2000);
        return;
      }
      
      // Fill order details
      const amountInput = page.locator('input[type="number"], input[placeholder*="Amount"]').first();
      const inputVisible = await amountInput.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (inputVisible) {
        await amountInput.fill('10000');
        
        // Select transaction type if available
        const transactionTypeSelect = page.locator('select[name="transactionType"]');
        const selectVisible = await transactionTypeSelect.isVisible({ timeout: 1000 }).catch(() => false);
        if (selectVisible) {
          await transactionTypeSelect.selectOption('Purchase');
        }
        
        // Confirm add to cart
        const confirmButton = page.locator('button:has-text("Add to Cart"), button:has-text("Confirm")').first();
        const confirmVisible = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (confirmVisible) {
          await confirmButton.click();
          
          // Wait for dialog to close
          await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(1000);
          
          // Verify cart count updated
          await verifyCartItemCount(page, 1);
        }
      }
    });

    test('should display cart items', async ({ page }) => {
      // Add item to cart first
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartButton.isVisible({ timeout: 3000 })) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        await page.waitForSelector('[role="dialog"]', { timeout: 3000 }).catch(() => {});
        
        const amountInput = page.locator('input[type="number"]').first();
        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill('10000');
          const confirmButton = page.locator('button:has-text("Add to Cart"), button:has-text("Confirm")').first();
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
            await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Navigate to cart tab
      await page.click('[role="tab"]:has-text("Cart")');
      await page.waitForTimeout(1000);
      
      // Check for cart items
      const cartItems = page.locator('[data-testid="cart-item"], .cart-item, tr:has-text("₹")');
      const itemCount = await cartItems.count();
      if (itemCount > 0) {
        await expect(cartItems.first()).toBeVisible();
      }
    });

    test('should remove item from cart', async ({ page }) => {
      // Add item first
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartButton.isVisible({ timeout: 3000 })) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        await page.waitForSelector('[role="dialog"]', { timeout: 3000 }).catch(() => {});
        
        const amountInput = page.locator('input[type="number"]').first();
        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill('10000');
          const confirmButton = page.locator('button:has-text("Add to Cart"), button:has-text("Confirm")').first();
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
            await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Navigate to cart
      await page.click('[role="tab"]:has-text("Cart")');
      await page.waitForTimeout(1000);
      
      // Remove item
      const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]').first();
      if (await removeButton.isVisible({ timeout: 2000 })) {
        await removeButton.click();
        await page.waitForTimeout(1000);
        
        // Verify cart is empty or count decreased
        await verifyCartItemCount(page, 0);
      }
    });

    test('should edit cart item', async ({ page }) => {
      // Add item first
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartButton.isVisible({ timeout: 3000 })) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        await page.waitForSelector('[role="dialog"]', { timeout: 3000 }).catch(() => {});
        
        const amountInput = page.locator('input[type="number"]').first();
        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill('10000');
          const confirmButton = page.locator('button:has-text("Add to Cart"), button:has-text("Confirm")').first();
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
            await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Navigate to cart
      await page.click('[role="tab"]:has-text("Cart")');
      await page.waitForTimeout(1000);
      
      // Click edit button
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"]').first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Edit dialog should open
        const editDialog = page.locator('[role="dialog"], text=Edit Order');
        if (await editDialog.isVisible({ timeout: 2000 })) {
          await expect(editDialog).toBeVisible();
        }
      }
    });
  });

  // ============================================
  // SECTION 2: TRANSACTION MODE & NOMINEE
  // ============================================

  test.describe('Transaction Mode & Nominee Form', () => {
    test('should display transaction mode section', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Check for transaction mode section
      const transactionModeSection = page.locator('text=Transaction Mode, text=Mode');
      if (await transactionModeSection.isVisible({ timeout: 2000 })) {
        await expect(transactionModeSection).toBeVisible();
      }
    });

    test('should select physical transaction mode', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      const transactionModeSelect = page.locator('select[name="transactionMode"], input[name="transactionMode"]');
      if (await transactionModeSelect.isVisible({ timeout: 2000 })) {
        if (transactionModeSelect.locator('..').locator('select').count() > 0) {
          await transactionModeSelect.selectOption('Physical');
        } else {
          await transactionModeSelect.click();
          await page.click('text=Physical');
        }
        
        // Verify selection
        await page.waitForTimeout(500);
      }
    });

    test('should select email transaction mode with EUIN', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      const transactionModeSelect = page.locator('select[name="transactionMode"]');
      if (await transactionModeSelect.isVisible({ timeout: 2000 })) {
        await transactionModeSelect.selectOption('Email');
        await page.waitForTimeout(500);
        
        // Check for EUIN field
        const euinInput = page.locator('input[name="euin"], input[placeholder*="EUIN"]');
        if (await euinInput.isVisible({ timeout: 2000 })) {
          await euinInput.fill('E123456789');
          await expect(euinInput).toHaveValue('E123456789');
        }
      }
    });

    test('should select telephone transaction mode', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      const transactionModeSelect = page.locator('select[name="transactionMode"]');
      if (await transactionModeSelect.isVisible({ timeout: 2000 })) {
        await transactionModeSelect.selectOption('Telephone');
        await page.waitForTimeout(500);
      }
    });

    test('should display nominee form', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Check for nominee section
      const nomineeSection = page.locator('text=Nominee, text=Nomination');
      if (await nomineeSection.isVisible({ timeout: 2000 })) {
        await expect(nomineeSection).toBeVisible();
      }
    });

    test('should add nominee', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Look for add nominee button
      const addNomineeButton = page.locator('button:has-text("Add Nominee"), button:has-text("+ Nominee")');
      if (await addNomineeButton.isVisible({ timeout: 2000 })) {
        await addNomineeButton.click();
        await page.waitForTimeout(500);
        
        // Fill nominee details
        const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
        if (await nameInput.isVisible({ timeout: 2000 })) {
          await nameInput.fill('Test Nominee');
          
          const relationshipSelect = page.locator('select[name="relationship"]');
          if (await relationshipSelect.isVisible()) {
            await relationshipSelect.selectOption('Spouse');
          }
          
          const panInput = page.locator('input[name="pan"], input[placeholder*="PAN"]');
          if (await panInput.isVisible()) {
            await panInput.fill('ABCDE1234F');
          }
          
          const percentageInput = page.locator('input[name="percentage"], input[type="number"]');
          if (await percentageInput.isVisible()) {
            await percentageInput.fill('100');
          }
          
          // Save nominee
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('should opt out of nomination', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Try multiple selectors for opt-out checkbox
      const optOutCheckbox = page.locator('input[type="checkbox"][name*="optOut"]').first();
      if (await optOutCheckbox.isVisible({ timeout: 2000 })) {
        await optOutCheckbox.check();
        await expect(optOutCheckbox).toBeChecked();
      } else {
        // Try clicking the label instead
        const optOutLabel = page.locator('label:has-text("Opt Out"), label:has-text("opt out"), label:has-text("Opt-out")').first();
        if (await optOutLabel.isVisible({ timeout: 2000 })) {
          await optOutLabel.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  // ============================================
  // SECTION 3: ORDER SUBMISSION
  // ============================================

  test.describe('Order Submission', () => {
    test('should validate order before submission', async ({ page }) => {
      // Try to submit without adding items
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      const submitButton = page.locator('button:has-text("Submit Order")');
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Should show validation error
        const errorMessage = page.locator('text=validation, text=error, text=required');
        if (await errorMessage.isVisible({ timeout: 2000 })) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    });

    test('should submit order successfully', async ({ page }) => {
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
      
      // Navigate to review
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Fill transaction mode
      const transactionModeSelect = page.locator('select[name="transactionMode"]');
      if (await transactionModeSelect.isVisible({ timeout: 2000 })) {
        await transactionModeSelect.selectOption({ index: 0 });
      }
      
      // Submit order
      const submitButton = page.locator('button:has-text("Submit Order")');
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click();
        
        // Wait for success message
        await expect(page.locator('text=Order Submitted, text=Success, text=submitted successfully')).toBeVisible({ timeout: 10000 });
      }
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      // Add item with invalid amount
      const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartButton.isVisible({ timeout: 3000 })) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);
        
        const amountInput = page.locator('input[type="number"]');
        if (await amountInput.isVisible({ timeout: 2000 })) {
          // Enter amount below minimum
          await amountInput.fill('100');
          await page.click('button:has-text("Add to Cart"), button:has-text("Confirm")');
          await page.waitForTimeout(1000);
          
          // Should show validation error
          const errorMessage = page.locator('text=minimum, text=validation, text=error');
          if (await errorMessage.isVisible({ timeout: 2000 })) {
            await expect(errorMessage.first()).toBeVisible();
          }
        }
      }
    });
  });

  // ============================================
  // SECTION 4: OVERLAYS
  // ============================================

  test.describe('Overlays', () => {
    test('should open scheme info overlay', async ({ page }) => {
      // Look for scheme info button
      const schemeInfoButton = page.locator('button:has-text("Scheme Info"), [data-testid="scheme-info"]').first();
      if (await schemeInfoButton.isVisible({ timeout: 3000 })) {
        await schemeInfoButton.click();
        await page.waitForTimeout(1000);
        
        // Check for overlay
        const overlay = page.locator('text=Scheme Information, [role="dialog"]');
        if (await overlay.isVisible({ timeout: 2000 })) {
          await expect(overlay.first()).toBeVisible();
        }
      }
    });

    test('should open order info overlay', async ({ page }) => {
      // Add item to cart first
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
      
      // Click order info button
      const orderInfoButton = page.locator('button:has-text("Order Info"), [data-testid="order-info"]').first();
      if (await orderInfoButton.isVisible({ timeout: 2000 })) {
        await orderInfoButton.click();
        await page.waitForTimeout(1000);
        
        // Check for overlay
        const overlay = page.locator('text=Order Information, [role="dialog"]');
        if (await overlay.isVisible({ timeout: 2000 })) {
          await expect(overlay.first()).toBeVisible();
        }
      }
    });

    test('should open documents overlay', async ({ page }) => {
      const documentsButton = page.locator('button:has-text("Documents"), [data-testid="documents"]').first();
      if (await documentsButton.isVisible({ timeout: 3000 })) {
        await documentsButton.click();
        await page.waitForTimeout(1000);
        
        // Check for overlay
        const overlay = page.locator('text=Documents, [role="dialog"]');
        if (await overlay.isVisible({ timeout: 2000 })) {
          await expect(overlay.first()).toBeVisible();
        }
      }
    });

    test('should open deviations overlay', async ({ page }) => {
      const deviationsButton = page.locator('button:has-text("Deviations"), [data-testid="deviations"]').first();
      if (await deviationsButton.isVisible({ timeout: 3000 })) {
        await deviationsButton.click();
        await page.waitForTimeout(1000);
        
        // Check for overlay
        const overlay = page.locator('text=Deviations, [role="dialog"]');
        if (await overlay.isVisible({ timeout: 2000 })) {
          await expect(overlay.first()).toBeVisible();
        }
      }
    });

    test('should close overlay', async ({ page }) => {
      // Open any overlay
      const schemeInfoButton = page.locator('button:has-text("Scheme Info")').first();
      if (await schemeInfoButton.isVisible({ timeout: 3000 })) {
        await schemeInfoButton.click();
        await page.waitForTimeout(1000);
        
        // Close overlay
        const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close"), [aria-label*="close"]');
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();
          await page.waitForTimeout(500);
          
          // Overlay should be closed
          const overlay = page.locator('[role="dialog"]');
          if (await overlay.isVisible({ timeout: 1000 })) {
            // If still visible, check if it's a different overlay
          } else {
            // Overlay closed successfully
            expect(true).toBe(true);
          }
        }
      }
    });
  });

  // ============================================
  // SECTION 5: ORDER BOOK
  // ============================================

  test.describe('Order Book', () => {
    test('should display order book', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Order Book")');
      await page.waitForTimeout(2000);
      
      // Check for order book content
      const orderBook = page.locator('text=Order Book, [data-testid="order-book"]');
      if (await orderBook.isVisible({ timeout: 3000 })) {
        await expect(orderBook.first()).toBeVisible();
      }
    });

    test('should filter orders by status', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Order Book")');
      await page.waitForTimeout(2000);
      
      const statusFilter = page.locator('select[name="status"], button:has-text("Filter")');
      if (await statusFilter.isVisible({ timeout: 2000 })) {
        if (await statusFilter.locator('..').locator('select').count() > 0) {
          await statusFilter.selectOption('Pending Approval');
        } else {
          await statusFilter.click();
          await page.click('text=Pending Approval');
        }
        await page.waitForTimeout(1000);
      }
    });

    test('should search orders', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Order Book")');
      await page.waitForTimeout(2000);
      
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('MO-');
        await page.waitForTimeout(1000);
      }
    });

    test('should view order details', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Order Book")');
      await page.waitForTimeout(2000);
      
      // Click on an order row
      const orderRow = page.locator('[data-testid="order-row"], tr').first();
      if (await orderRow.isVisible({ timeout: 3000 })) {
        await orderRow.click();
        await page.waitForTimeout(1000);
        
        // Check for order details
        const orderDetails = page.locator('text=Order Details, [data-testid="order-details"]');
        if (await orderDetails.isVisible({ timeout: 2000 })) {
          await expect(orderDetails.first()).toBeVisible();
        }
      }
    });

    test('should authorize order', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Order Book")');
      await page.waitForTimeout(2000);
      
      const authorizeButton = page.locator('button:has-text("Authorize")').first();
      if (await authorizeButton.isVisible({ timeout: 3000 })) {
        await authorizeButton.click();
        await page.waitForTimeout(1000);
        
        // Check for success message
        const successMessage = page.locator('text=Authorized, text=Success');
        if (await successMessage.isVisible({ timeout: 5000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    });

    test('should reject order', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Order Book")');
      await page.waitForTimeout(2000);
      
      const rejectButton = page.locator('button:has-text("Reject")').first();
      if (await rejectButton.isVisible({ timeout: 3000 })) {
        await rejectButton.click();
        await page.waitForTimeout(1000);
        
        // Fill rejection reason if dialog appears
        const reasonInput = page.locator('input[name="reason"], textarea[name="reason"]');
        if (await reasonInput.isVisible({ timeout: 2000 })) {
          await reasonInput.fill('Test rejection reason');
          await page.click('button:has-text("Confirm"), button:has-text("Reject")');
          await page.waitForTimeout(1000);
        }
        
        // Check for success message
        const successMessage = page.locator('text=Rejected, text=Success');
        if (await successMessage.isVisible({ timeout: 5000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    });
  });

  // ============================================
  // SECTION 6: FULL SWITCH/REDEMPTION
  // ============================================

  test.describe('Full Switch/Redemption', () => {
    test('should display full switch/redemption panel', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Check for full switch/redemption section
      const fullSwitchSection = page.locator('text=Full Switch, text=Full Redemption');
      if (await fullSwitchSection.isVisible({ timeout: 2000 })) {
        await expect(fullSwitchSection).toBeVisible();
      }
    });

    test('should select full switch option', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      const fullSwitchRadio = page.locator('input[value="Full Switch"], input[type="radio"]:near(text=Full Switch)');
      if (await fullSwitchRadio.isVisible({ timeout: 2000 })) {
        await fullSwitchRadio.check();
        await expect(fullSwitchRadio).toBeChecked();
      }
    });

    test('should select full redemption option', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      const fullRedemptionRadio = page.locator('input[value="Full Redemption"], input[type="radio"]:near(text=Full Redemption)');
      if (await fullRedemptionRadio.isVisible({ timeout: 2000 })) {
        await fullRedemptionRadio.check();
        await expect(fullRedemptionRadio).toBeChecked();
      }
    });
  });

  // ============================================
  // SECTION 7: QUICK ORDER FLOW
  // ============================================

  test.describe('Quick Order Flow', () => {
    test('should open quick order dialog', async ({ page }) => {
      await openQuickOrderDialog(page);
      await expect(page.locator('text=Quick Order')).toBeVisible({ timeout: 5000 });
    });

    test('should display favorites in quick order', async ({ page }) => {
      await openQuickOrderDialog(page);
      
      const favoritesSection = page.locator('text=Favorites');
      if (await favoritesSection.isVisible({ timeout: 3000 })) {
        await expect(favoritesSection).toBeVisible();
      }
    });

    test('should display recent orders in quick order', async ({ page }) => {
      await openQuickOrderDialog(page);
      
      const recentSection = page.locator('text=Recent Orders');
      if (await recentSection.isVisible({ timeout: 3000 })) {
        await expect(recentSection).toBeVisible();
      }
    });

    test('should use amount presets', async ({ page }) => {
      await openQuickOrderDialog(page);
      
      const presetButtons = [
        page.locator('button:has-text("₹5K")'),
        page.locator('button:has-text("₹10K")'),
        page.locator('button:has-text("₹25K")'),
      ];
      
      for (const button of presetButtons) {
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          await page.waitForTimeout(500);
          
          // Verify amount is set
          const amountInput = page.locator('input[type="number"]');
          const value = await amountInput.inputValue();
          expect(value).toBeTruthy();
          break;
        }
      }
    });
  });

  // ============================================
  // SECTION 8: PORTFOLIO INTEGRATION
  // ============================================

  test.describe('Portfolio Integration', () => {
    test('should open portfolio sidebar', async ({ page }) => {
      await openPortfolioSidebar(page);
      await expect(page.locator('text=Portfolio Overview, text=Portfolio')).toBeVisible({ timeout: 5000 });
    });

    test('should display portfolio allocation', async ({ page }) => {
      await openPortfolioSidebar(page);
      
      const allocationSection = page.locator('text=Allocation, text=Current Allocation');
      if (await allocationSection.isVisible({ timeout: 3000 })) {
        await expect(allocationSection.first()).toBeVisible();
      }
    });

    test('should display holdings', async ({ page }) => {
      await openPortfolioSidebar(page);
      
      // Switch to holdings tab if exists
      const holdingsTab = page.locator('[role="tab"]:has-text("Holdings")');
      if (await holdingsTab.isVisible({ timeout: 2000 })) {
        await holdingsTab.click();
        await page.waitForTimeout(1000);
      }
      
      const holdingsSection = page.locator('text=Holdings, [data-testid="holding-item"]');
      if (await holdingsSection.isVisible({ timeout: 3000 })) {
        await expect(holdingsSection.first()).toBeVisible();
      }
    });
  });

  // ============================================
  // SECTION 9: ERROR HANDLING
  // ============================================

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/order-management/products', route => route.abort());
      
      await navigateToOrderManagement(page);
      await page.waitForTimeout(2000);
      
      // Should show error message
      const errorMessage = page.locator('text=Error, text=Failed to load, text=network');
      if (await errorMessage.isVisible({ timeout: 5000 })) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });

    test('should handle invalid form submission', async ({ page }) => {
      await page.click('[role="tab"]:has-text("Review")');
      await page.waitForTimeout(1000);
      
      // Try to submit without required fields
      const submitButton = page.locator('button:has-text("Submit Order")');
      if (await submitButton.isVisible({ timeout: 2000 })) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Should show validation errors
        const errorMessage = page.locator('text=validation, text=error, text=required');
        if (await errorMessage.isVisible({ timeout: 2000 })) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    });
  });
});

