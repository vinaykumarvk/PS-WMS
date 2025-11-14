# Phase 1: Module 1 & Module 2 - Comprehensive Test Cases

**Development Structure:** Phase 1: Critical Features (Sequential) — 5 weeks

**Module 1:** Order Confirmation & Receipts (3 weeks)  
**Module 2:** Integration Testing & Bug Fixes (2 weeks)

**Document Version:** 1.0  
**Created:** December 2024  
**Status:** Ready for Execution

---

## Table of Contents

1. [Module 1: Order Confirmation & Receipts Test Cases](#module-1-order-confirmation--receipts-test-cases)
   - [1.1 Order Confirmation Page](#11-order-confirmation-page)
   - [1.2 PDF Receipt Generation](#12-pdf-receipt-generation)
   - [1.3 Email Notifications](#13-email-notifications)
   - [1.4 Order Timeline/Tracking](#14-order-timelinetracking)
2. [Module 2: Integration Testing & Bug Fixes Test Cases](#module-2-integration-testing--bug-fixes-test-cases)
   - [2.1 Frontend-Backend Integration Testing](#21-frontend-backend-integration-testing)
   - [2.2 End-to-End Testing](#22-end-to-end-testing)
   - [2.3 Bug Fixes](#23-bug-fixes)
   - [2.4 Performance Optimization](#24-performance-optimization)
3. [Test Execution Guide](#test-execution-guide)
4. [Test Data Requirements](#test-data-requirements)

---

## Module 1: Order Confirmation & Receipts Test Cases

### 1.1 Order Confirmation Page

#### TC-M1-1.1-001: Order Confirmation Page Display After Submission
**Test ID:** TC-M1-1.1-001  
**Priority:** 🔴 Critical  
**Type:** UI/Functional  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- User is logged in as RM
- Order has been successfully submitted
- Order ID is available

**Test Steps:**
1. Submit an order through the order management flow
2. Verify redirect to order confirmation page
3. Check URL contains `/order-management/orders/{orderId}/confirmation`
4. Verify page loads without errors

**Expected Results:**
- Page redirects automatically after successful order submission
- Confirmation page displays with correct order ID in URL
- Page loads within 2 seconds
- No console errors
- Success banner displays "Order Submitted Successfully"

**Test Data:**
- Valid order with single product
- Valid order with multiple products
- Order with different transaction types (Purchase, Redemption, Switch)

---

#### TC-M1-1.1-002: Order Confirmation Page Header and Navigation
**Test ID:** TC-M1-1.1-002  
**Priority:** 🔴 Critical  
**Type:** UI/Functional  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- User is on order confirmation page
- Order data is loaded

**Test Steps:**
1. Verify page header displays "Order Confirmation"
2. Check subtitle displays "Your order has been submitted successfully"
3. Verify "Back to Orders" button is visible
4. Click "Back to Orders" button
5. Verify navigation to order management page

**Expected Results:**
- Header displays correct title and subtitle
- "Back to Orders" button is visible and functional
- Navigation works correctly
- Browser back button also works

---

#### TC-M1-1.1-003: Order Summary Display
**Test ID:** TC-M1-1.1-003  
**Priority:** 🔴 Critical  
**Type:** UI/Functional  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- Order confirmation page is loaded
- Order has multiple cart items

**Test Steps:**
1. Verify "Order Summary" section is displayed
2. Check all order items are listed
3. Verify each item shows: Scheme Name, Transaction Type, Amount, Units (if applicable)
4. Verify total amount calculation is correct
5. Check transaction mode information is displayed
6. Verify nominee information (if applicable)

**Expected Results:**
- All order items are displayed correctly
- Amounts are formatted with currency symbol (₹)
- Transaction type badges are displayed
- Total amount matches sum of all items
- Transaction mode details are accurate
- Nominee information displays correctly or shows opt-out status

**Test Data:**
- Order with 1 item
- Order with 5+ items
- Order with mixed transaction types
- Order with nominee information
- Order with opt-out of nomination

---

#### TC-M1-1.1-004: Order Status Card Display
**Test ID:** TC-M1-1.1-004  
**Priority:** 🔴 Critical  
**Type:** UI/Functional  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Verify "Order Status" card is displayed in sidebar
2. Check order status badge displays current status
3. Verify Order ID (modelOrderId) is displayed
4. Check submission timestamp is displayed
5. Verify authorization timestamp (if authorized)
6. Check status badge color matches status (Pending = yellow, Authorized = green, etc.)

**Expected Results:**
- Status card displays in sidebar
- Status badge shows correct status
- Order ID is displayed in monospace font
- Timestamps are formatted correctly (e.g., "Dec 15, 2024 at 10:30 AM")
- Status badge colors are appropriate
- All timestamps are in user's timezone

**Test Data:**
- Order with status "Pending"
- Order with status "Authorized"
- Order with status "Rejected"
- Order with authorization timestamp
- Order without authorization timestamp

---

#### TC-M1-1.1-005: Loading State Display
**Test ID:** TC-M1-1.1-005  
**Priority:** 🟡 High  
**Type:** UI/UX  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- User navigates to confirmation page
- API call is in progress

**Test Steps:**
1. Navigate to confirmation page with valid order ID
2. Observe loading state
3. Verify skeleton loaders are displayed
4. Wait for data to load
5. Verify smooth transition from loading to content

**Expected Results:**
- Skeleton loaders display immediately
- Loading state shows appropriate placeholders
- No blank screen during loading
- Smooth transition to content
- Loading completes within 2 seconds

---

#### TC-M1-1.1-006: Error Handling - Order Not Found
**Test ID:** TC-M1-1.1-006  
**Priority:** 🔴 Critical  
**Type:** Error Handling  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- User is logged in
- Invalid or non-existent order ID

**Test Steps:**
1. Navigate to confirmation page with invalid order ID (e.g., 99999)
2. Verify error message is displayed
3. Check "Back to Orders" button is available
4. Verify error message is user-friendly
5. Check console for appropriate error logging

**Expected Results:**
- Error message displays: "Failed to load order confirmation"
- "Back to Orders" button is functional
- Error message is clear and actionable
- No application crash
- Error is logged appropriately

**Test Data:**
- Non-existent order ID: 99999
- Invalid order ID format: "abc"
- Order ID belonging to different user (if applicable)

---

#### TC-M1-1.1-007: Error Handling - Network Failure
**Test ID:** TC-M1-1.1-007  
**Priority:** 🟡 High  
**Type:** Error Handling  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- User is on confirmation page
- Network connection is unstable

**Test Steps:**
1. Navigate to confirmation page
2. Simulate network failure (disable network in DevTools)
3. Verify error handling
4. Re-enable network
5. Verify retry mechanism (if implemented)

**Expected Results:**
- Error message displays appropriately
- User can retry loading
- No application crash
- Error state is recoverable

---

#### TC-M1-1.1-008: Responsive Design - Mobile View
**Test ID:** TC-M1-1.1-008  
**Priority:** 🟡 High  
**Type:** UI/UX  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Open page on mobile device (375x667)
2. Verify layout adapts correctly
3. Check sidebar stacks below main content
4. Verify all buttons are accessible
5. Check text is readable
6. Verify touch interactions work

**Expected Results:**
- Layout is responsive on mobile
- Sidebar stacks below main content
- All elements are accessible
- Text is readable without zooming
- Touch targets are appropriately sized
- No horizontal scrolling

---

#### TC-M1-1.1-009: Responsive Design - Tablet View
**Test ID:** TC-M1-1.1-009  
**Priority:** 🟡 Medium  
**Type:** UI/UX  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Open page on tablet device (768x1024)
2. Verify layout adapts correctly
3. Check grid layout adjusts appropriately
4. Verify all content is visible

**Expected Results:**
- Layout adapts to tablet size
- Grid layout adjusts appropriately
- All content is visible and accessible
- No layout issues

---

#### TC-M1-1.1-010: Accessibility - Keyboard Navigation
**Test ID:** TC-M1-1.1-010  
**Priority:** 🟡 Medium  
**Type:** Accessibility  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Navigate page using only keyboard (Tab, Enter, Arrow keys)
2. Verify all interactive elements are focusable
3. Check focus indicators are visible
4. Verify logical tab order
5. Test keyboard shortcuts (if any)

**Expected Results:**
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- Tab order is logical
- Keyboard navigation works smoothly
- No keyboard traps

---

#### TC-M1-1.1-011: Accessibility - Screen Reader Compatibility
**Test ID:** TC-M1-1.1-011  
**Priority:** 🟡 Medium  
**Type:** Accessibility  
**Sub-module:** 1.1 Order Confirmation Page

**Preconditions:**
- Order confirmation page is loaded
- Screen reader is enabled

**Test Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through page
3. Verify all content is announced
4. Check ARIA labels are present
5. Verify heading hierarchy is correct

**Expected Results:**
- All content is announced correctly
- ARIA labels are present for interactive elements
- Heading hierarchy is logical (h1 → h2 → h3)
- Status information is announced
- Form elements have proper labels

---

### 1.2 PDF Receipt Generation

#### TC-M1-1.2-001: PDF Receipt Download - Successful Generation
**Test ID:** TC-M1-1.2-001  
**Priority:** 🔴 Critical  
**Type:** Functional/Integration  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- Order confirmation page is loaded
- Order data is available
- User is authenticated

**Test Steps:**
1. Click "Download Receipt (PDF)" button
2. Verify loading state shows "Generating..."
3. Wait for PDF generation
4. Verify PDF file downloads
5. Open PDF and verify content
6. Check PDF filename format

**Expected Results:**
- Button shows loading state during generation
- PDF downloads successfully
- Filename format: `order-receipt-{modelOrderId}.pdf`
- PDF contains all order details
- PDF is properly formatted
- Download completes within 5 seconds

**Test Data:**
- Order with single item
- Order with multiple items
- Order with nominee information
- Order with different transaction types

---

#### TC-M1-1.2-002: PDF Receipt Content Verification
**Test ID:** TC-M1-1.2-002  
**Priority:** 🔴 Critical  
**Type:** Functional  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- PDF receipt has been generated and downloaded

**Test Steps:**
1. Open downloaded PDF
2. Verify header contains company logo/branding
3. Check order ID is displayed
4. Verify order date and time
5. Check all order items are listed with details
6. Verify transaction mode information
7. Check nominee information (if applicable)
8. Verify total amount calculation
9. Check footer contains terms and conditions (if applicable)

**Expected Results:**
- PDF header contains branding
- Order ID is prominently displayed
- Order date/time is accurate
- All order items are listed with:
  - Scheme name
  - Transaction type
  - Amount
  - Units (if applicable)
- Transaction mode details are included
- Nominee information is accurate (or opt-out status)
- Total amount is correct
- PDF is properly formatted and readable

**Test Data:**
- Order with complete information
- Order with missing optional fields
- Order with special characters in scheme names

---

#### TC-M1-1.2-003: PDF Receipt Formatting and Layout
**Test ID:** TC-M1-1.2-003  
**Priority:** 🟡 High  
**Type:** UI/Functional  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- PDF receipt has been generated

**Test Steps:**
1. Open PDF in PDF viewer
2. Verify layout is professional
3. Check fonts are readable
4. Verify spacing and alignment
5. Check colors are appropriate (if colored)
6. Verify page breaks (if multiple pages)
7. Check print preview

**Expected Results:**
- Layout is professional and clean
- Fonts are readable (minimum 10pt)
- Proper spacing and alignment
- Colors are print-friendly (if applicable)
- Page breaks are logical
- Print preview looks good

---

#### TC-M1-1.2-004: PDF Receipt Error Handling - API Failure
**Test ID:** TC-M1-1.2-004  
**Priority:** 🔴 Critical  
**Type:** Error Handling  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- Order confirmation page is loaded
- API endpoint is unavailable or returns error

**Test Steps:**
1. Click "Download Receipt (PDF)" button
2. Simulate API failure (500 error)
3. Verify error message is displayed
4. Check error toast notification
5. Verify button returns to normal state

**Expected Results:**
- Error message displays: "Failed to download receipt"
- Toast notification shows error
- Button returns to normal state
- User can retry download
- Error is logged appropriately

---

#### TC-M1-1.2-005: PDF Receipt Error Handling - Order Not Found
**Test ID:** TC-M1-1.2-005  
**Priority:** 🟡 High  
**Type:** Error Handling  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- Order ID is invalid or order doesn't exist

**Test Steps:**
1. Navigate to confirmation page with invalid order ID
2. Click "Download Receipt (PDF)" button
3. Verify error handling
4. Check error message

**Expected Results:**
- Error message displays appropriately
- 404 error is handled gracefully
- User-friendly error message
- No application crash

---

#### TC-M1-1.2-006: PDF Receipt Generation Performance
**Test ID:** TC-M1-1.2-006  
**Priority:** 🟡 Medium  
**Type:** Performance  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- Order confirmation page is loaded
- Order with multiple items (10+)

**Test Steps:**
1. Click "Download Receipt (PDF)" button
2. Measure time from click to download start
3. Verify performance is acceptable
4. Test with orders of different sizes

**Expected Results:**
- PDF generation completes within 5 seconds for standard orders
- PDF generation completes within 10 seconds for large orders (10+ items)
- No UI freezing during generation
- Loading indicator is shown

**Test Data:**
- Order with 1 item
- Order with 5 items
- Order with 10+ items
- Order with long scheme names

---

#### TC-M1-1.2-007: PDF Receipt - Multiple Downloads
**Test ID:** TC-M1-1.2-007  
**Priority:** 🟡 Medium  
**Type:** Functional  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Click "Download Receipt (PDF)" button
2. Wait for download to complete
3. Click "Download Receipt (PDF)" button again
4. Verify second download works
5. Check both PDFs are identical

**Expected Results:**
- Multiple downloads work correctly
- Each download generates fresh PDF
- PDFs are identical
- No errors on repeated downloads

---

#### TC-M1-1.2-008: PDF Receipt - Browser Compatibility
**Test ID:** TC-M1-1.2-008  
**Priority:** 🟡 Medium  
**Type:** Compatibility  
**Sub-module:** 1.2 PDF Receipt Generation

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Test PDF download in Chrome
2. Test PDF download in Firefox
3. Test PDF download in Safari
4. Test PDF download in Edge
5. Verify PDF opens correctly in all browsers

**Expected Results:**
- PDF download works in all major browsers
- PDF opens correctly in browser PDF viewer
- PDF can be saved to disk
- No browser-specific errors

---

### 1.3 Email Notifications

#### TC-M1-1.3-001: Email Confirmation - Manual Send
**Test ID:** TC-M1-1.3-001  
**Priority:** 🔴 Critical  
**Type:** Functional/Integration  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Order confirmation page is loaded
- Order has email address in transaction mode
- Email service is configured

**Test Steps:**
1. Click "Send Email Confirmation" button
2. Verify loading state shows "Sending..."
3. Wait for email to be sent
4. Verify success toast notification
5. Check email is received (in test environment)
6. Verify email content

**Expected Results:**
- Button shows loading state during sending
- Success toast displays: "Order confirmation email has been sent successfully"
- Email is sent to correct address
- Email contains order details
- Email sending completes within 3 seconds

**Test Data:**
- Order with Email transaction mode
- Order with valid email address
- Order with multiple recipients (if applicable)

---

#### TC-M1-1.3-002: Email Content Verification
**Test ID:** TC-M1-1.3-002  
**Priority:** 🔴 Critical  
**Type:** Functional  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Email has been sent successfully

**Test Steps:**
1. Open received email
2. Verify email subject line
3. Check email sender information
4. Verify email body contains:
   - Order ID
   - Order date
   - Order items list
   - Total amount
   - Transaction mode
   - Nominee information (if applicable)
5. Check email formatting (HTML/text)
6. Verify links (if any) work correctly

**Expected Results:**
- Email subject: "Order Confirmation - Order {modelOrderId}"
- Sender email is correct (e.g., noreply@wealthrm.com)
- Email body contains all order details
- Email is properly formatted (HTML or plain text)
- Links work correctly (if present)
- Email is readable on mobile devices

**Test Data:**
- Order with complete information
- Order with nominee information
- Order with opt-out of nomination

---

#### TC-M1-1.3-003: Email Confirmation - Automatic Send After Order
**Test ID:** TC-M1-1.3-003  
**Priority:** 🔴 Critical  
**Type:** Functional/Integration  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- User submits order with Email transaction mode
- Email address is available

**Test Steps:**
1. Submit order through order management flow
2. Verify order is submitted successfully
3. Check email is sent automatically
4. Verify email is received
5. Check email content matches order

**Expected Results:**
- Email is sent automatically after order submission
- Email is sent within 5 seconds of order submission
- Email contains correct order details
- No manual intervention required
- Email sending doesn't block order submission

---

#### TC-M1-1.3-004: Email Confirmation - Error Handling - No Email Address
**Test ID:** TC-M1-1.3-004  
**Priority:** 🔴 Critical  
**Type:** Error Handling  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Order confirmation page is loaded
- Order has Physical or Telephone transaction mode (no email)

**Test Steps:**
1. Navigate to order confirmation page for order without email
2. Verify "Send Email Confirmation" button is visible
3. Click "Send Email Confirmation" button
4. Verify error handling
5. Check error message

**Expected Results:**
- Error message displays: "Email address not found for this order"
- Error toast notification shows
- User-friendly error message
- No application crash

---

#### TC-M1-1.3-005: Email Confirmation - Error Handling - Email Service Failure
**Test ID:** TC-M1-1.3-005  
**Priority:** 🟡 High  
**Type:** Error Handling  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Order confirmation page is loaded
- Email service is unavailable or returns error

**Test Steps:**
1. Click "Send Email Confirmation" button
2. Simulate email service failure (500 error)
3. Verify error handling
4. Check error message
5. Verify user can retry

**Expected Results:**
- Error message displays: "Failed to send email"
- Error toast notification shows
- User can retry sending
- Error is logged appropriately
- No application crash

---

#### TC-M1-1.3-006: Email Confirmation - Invalid Email Address
**Test ID:** TC-M1-1.3-006  
**Priority:** 🟡 High  
**Type:** Validation  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Order has invalid email address format

**Test Steps:**
1. Attempt to send email with invalid email address
2. Verify validation error
3. Check error message

**Expected Results:**
- Validation error is caught
- Error message is clear
- Email is not sent
- User is informed of the issue

---

#### TC-M1-1.3-007: Email Confirmation - Multiple Sends
**Test ID:** TC-M1-1.3-007  
**Priority:** 🟡 Medium  
**Type:** Functional  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Order confirmation page is loaded

**Test Steps:**
1. Click "Send Email Confirmation" button
2. Wait for success notification
3. Click "Send Email Confirmation" button again
4. Verify second email is sent
5. Check both emails are received

**Expected Results:**
- Multiple sends work correctly
- Each send generates a new email
- Success notification shows for each send
- No errors on repeated sends

---

#### TC-M1-1.3-008: Email Confirmation - Email Address Display
**Test ID:** TC-M1-1.3-008  
**Priority:** 🟡 Medium  
**Type:** UI/UX  
**Sub-module:** 1.3 Email Notifications

**Preconditions:**
- Order confirmation page is loaded
- Order has email address

**Test Steps:**
1. Verify email address is displayed below "Send Email Confirmation" button
2. Check email address format is correct
3. Verify email address matches order transaction mode

**Expected Results:**
- Email address displays: "Email will be sent to: {email}"
- Email address is formatted correctly
- Email address matches order data
- Text is readable and appropriately styled

---

### 1.4 Order Timeline/Tracking

#### TC-M1-1.4-001: Order Timeline Display
**Test ID:** TC-M1-1.4-001  
**Priority:** 🔴 Critical  
**Type:** UI/Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order confirmation page is loaded
- Order has timeline events

**Test Steps:**
1. Verify "Order Timeline" section is displayed
2. Check timeline events are listed chronologically
3. Verify each event shows:
   - Status
   - Timestamp
   - Description
4. Check timeline visual representation (if applicable)
5. Verify current status is highlighted

**Expected Results:**
- Timeline section displays correctly
- Events are ordered chronologically (oldest to newest)
- Each event shows status, timestamp, and description
- Timeline visual is clear and readable
- Current status is visually distinct

**Test Data:**
- Order with single event (Submitted)
- Order with multiple events (Submitted, Authorized)
- Order with rejected status
- Order with status updates

---

#### TC-M1-1.4-002: Order Timeline Events - Submitted
**Test ID:** TC-M1-1.4-002  
**Priority:** 🔴 Critical  
**Type:** Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order has been submitted

**Test Steps:**
1. Check timeline contains "Submitted" event
2. Verify timestamp matches order submission time
3. Check description: "Order was submitted successfully"
4. Verify event is marked as completed

**Expected Results:**
- "Submitted" event is present
- Timestamp is accurate
- Description is clear
- Event status is correct

---

#### TC-M1-1.4-003: Order Timeline Events - Authorized
**Test ID:** TC-M1-1.4-003  
**Priority:** 🔴 Critical  
**Type:** Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order has been authorized

**Test Steps:**
1. Check timeline contains "Authorized" event
2. Verify timestamp matches authorization time
3. Check description includes authorization details
4. Verify event shows authorized by user (if available)
5. Check event is marked as completed

**Expected Results:**
- "Authorized" event is present
- Timestamp is accurate
- Description includes authorization details
- Authorized by user is shown (if available)
- Event status is correct

---

#### TC-M1-1.4-004: Order Timeline Events - Rejected
**Test ID:** TC-M1-1.4-004  
**Priority:** 🔴 Critical  
**Type:** Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order has been rejected

**Test Steps:**
1. Check timeline contains "Rejected" event
2. Verify timestamp matches rejection time
3. Check description includes rejection reason
4. Verify rejection reason is displayed (if available)
5. Check event is marked appropriately

**Expected Results:**
- "Rejected" event is present
- Timestamp is accurate
- Description includes rejection reason
- Rejection reason is clearly displayed
- Event status is correct

---

#### TC-M1-1.4-005: Order Timeline - Real-time Updates
**Test ID:** TC-M1-1.4-005  
**Priority:** 🟡 High  
**Type:** Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order confirmation page is open
- Order status changes (e.g., authorized)

**Test Steps:**
1. Keep confirmation page open
2. Authorize order from another session/device
3. Verify timeline updates automatically (if real-time)
4. Or verify refresh shows updated timeline

**Expected Results:**
- Timeline updates automatically (if real-time implemented)
- Or page refresh shows updated timeline
- New events appear correctly
- No errors during update

---

#### TC-M1-1.4-006: Order Timeline - Empty State
**Test ID:** TC-M1-1.4-006  
**Priority:** 🟡 Medium  
**Type:** UI/UX  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order exists but has no timeline events (edge case)

**Test Steps:**
1. Navigate to order confirmation page
2. Check timeline section
3. Verify empty state handling

**Expected Results:**
- Timeline section displays appropriately
- Empty state message is shown (if applicable)
- No errors displayed
- User experience is smooth

---

#### TC-M1-1.4-007: Order Timeline - Loading State
**Test ID:** TC-M1-1.4-007  
**Priority:** 🟡 Medium  
**Type:** UI/UX  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order confirmation page is loading
- Timeline data is being fetched

**Test Steps:**
1. Navigate to confirmation page
2. Observe timeline loading state
3. Verify loading indicator
4. Wait for timeline to load

**Expected Results:**
- Loading indicator is shown
- No blank space during loading
- Smooth transition to content
- Loading completes within 2 seconds

---

#### TC-M1-1.4-008: Order Timeline - Error Handling
**Test ID:** TC-M1-1.4-008  
**Priority:** 🟡 High  
**Type:** Error Handling  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order confirmation page is loaded
- Timeline API fails

**Test Steps:**
1. Navigate to confirmation page
2. Simulate timeline API failure
3. Verify error handling
4. Check error message

**Expected Results:**
- Error is handled gracefully
- Error message is user-friendly
- Timeline section shows error state
- No application crash
- User can retry (if applicable)

---

#### TC-M1-1.4-009: Order Status Tracker Component
**Test ID:** TC-M1-1.4-009  
**Priority:** 🟡 High  
**Type:** UI/Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order status tracker component exists
- Order has status information

**Test Steps:**
1. Verify order status tracker displays current status
2. Check status progression is shown visually
3. Verify status badges/indicators
4. Check status descriptions are clear

**Expected Results:**
- Status tracker displays current status
- Status progression is visually clear
- Status badges are color-coded appropriately
- Status descriptions are user-friendly

---

#### TC-M1-1.4-010: Order Timeline - Date/Time Formatting
**Test ID:** TC-M1-1.4-010  
**Priority:** 🟡 Medium  
**Type:** UI/Functional  
**Sub-module:** 1.4 Order Timeline/Tracking

**Preconditions:**
- Order timeline is displayed

**Test Steps:**
1. Verify timestamps are formatted correctly
2. Check date format is user-friendly
3. Verify time format includes timezone (if applicable)
4. Check relative time display (e.g., "2 hours ago") if implemented

**Expected Results:**
- Timestamps are formatted consistently
- Date format is readable (e.g., "Dec 15, 2024 at 10:30 AM")
- Timezone is handled correctly
- Relative time is accurate (if implemented)

---

## Module 2: Integration Testing & Bug Fixes Test Cases

### 2.1 Frontend-Backend Integration Testing

#### TC-M2-2.1-001: Order Submission API Integration
**Test ID:** TC-M2-2.1-001  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- User is logged in
- Frontend and backend are running
- API endpoints are accessible

**Test Steps:**
1. Submit order through frontend
2. Verify API call is made to `/api/order-management/orders/submit`
3. Check request payload is correct
4. Verify response is handled correctly
5. Check order is created in database
6. Verify frontend receives correct response

**Expected Results:**
- API call is made with correct endpoint
- Request payload matches order data
- Response is parsed correctly
- Order is created in database
- Frontend receives success response
- Order ID is returned correctly

**Test Data:**
- Valid order with all required fields
- Order with optional fields
- Order with multiple items

---

#### TC-M2-2.1-002: Order Confirmation API Integration
**Test ID:** TC-M2-2.1-002  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Order exists in database
- User is authenticated

**Test Steps:**
1. Navigate to order confirmation page
2. Verify API call to `/api/order-management/orders/{id}/confirmation`
3. Check request includes authentication
4. Verify response contains order data
5. Check client information is included
6. Verify frontend displays data correctly

**Expected Results:**
- API call is made correctly
- Authentication is included
- Response contains complete order data
- Client information is included
- Frontend displays all data correctly

---

#### TC-M2-2.1-003: PDF Receipt Generation API Integration
**Test ID:** TC-M2-2.1-003  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Order exists
- User is authenticated

**Test Steps:**
1. Click "Download Receipt (PDF)" button
2. Verify API call to `/api/order-management/orders/{id}/generate-receipt`
3. Check request method is POST
4. Verify response is PDF blob
5. Check PDF content is correct
6. Verify download works correctly

**Expected Results:**
- API call is made correctly
- Request method is POST
- Response is PDF blob (application/pdf)
- PDF contains correct order data
- Download works correctly

---

#### TC-M2-2.1-004: Email Sending API Integration
**Test ID:** TC-M2-2.1-004  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Order exists with email address
- Email service is configured

**Test Steps:**
1. Click "Send Email Confirmation" button
2. Verify API call to `/api/order-management/orders/{id}/send-email`
3. Check request method is POST
4. Verify email service is called
5. Check response indicates success
6. Verify email is sent (in test environment)

**Expected Results:**
- API call is made correctly
- Request method is POST
- Email service is invoked
- Response indicates success
- Email is sent to correct address

---

#### TC-M2-2.1-005: Order Timeline API Integration
**Test ID:** TC-M2-2.1-005  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Order exists
- Order has timeline events

**Test Steps:**
1. Navigate to order confirmation page
2. Verify API call to `/api/order-management/orders/{id}/timeline`
3. Check response contains timeline events
4. Verify events are ordered correctly
5. Check frontend displays timeline correctly

**Expected Results:**
- API call is made correctly
- Response contains timeline events array
- Events are ordered chronologically
- Frontend displays timeline correctly

---

#### TC-M2-2.1-006: Authentication Integration
**Test ID:** TC-M2-2.1-006  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- User is logged in
- Session is active

**Test Steps:**
1. Verify authentication token is sent with API requests
2. Check token is valid
3. Verify unauthorized requests are rejected
4. Check session expiration is handled
5. Verify re-authentication works

**Expected Results:**
- Authentication token is included in requests
- Token is valid and accepted
- Unauthorized requests return 401
- Session expiration is handled gracefully
- Re-authentication redirects work

---

#### TC-M2-2.1-007: Error Handling Integration
**Test ID:** TC-M2-2.1-007  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Frontend and backend are connected

**Test Steps:**
1. Test API error responses (400, 404, 500)
2. Verify frontend handles errors correctly
3. Check error messages are displayed
4. Verify error logging works
5. Test network failures

**Expected Results:**
- Error responses are handled correctly
- Error messages are user-friendly
- Errors are logged appropriately
- Network failures are handled gracefully
- User can recover from errors

---

#### TC-M2-2.1-008: Data Validation Integration
**Test ID:** TC-M2-2.1-008  
**Priority:** 🔴 Critical  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Frontend and backend are connected

**Test Steps:**
1. Submit order with invalid data
2. Verify backend validation errors
3. Check frontend receives validation errors
4. Verify error messages are displayed
5. Test all validation rules

**Expected Results:**
- Backend validates data correctly
- Validation errors are returned
- Frontend displays validation errors
- Error messages are clear
- All validation rules work

---

#### TC-M2-2.1-009: Request/Response Data Mapping
**Test ID:** TC-M2-2.1-009  
**Priority:** 🟡 High  
**Type:** Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Frontend and backend are connected

**Test Steps:**
1. Submit order and verify data mapping
2. Check request payload structure matches backend expectations
3. Verify response structure matches frontend expectations
4. Test data type conversions
5. Check date/time formatting

**Expected Results:**
- Request payload matches backend schema
- Response structure matches frontend types
- Data type conversions work correctly
- Date/time formatting is consistent
- No data loss during mapping

---

#### TC-M2-2.1-010: API Response Time Performance
**Test ID:** TC-M2-2.1-010  
**Priority:** 🟡 High  
**Type:** Performance/Integration  
**Sub-module:** 2.1 Frontend-Backend Integration Testing

**Preconditions:**
- Frontend and backend are connected

**Test Steps:**
1. Measure API response times for all endpoints
2. Verify response times meet benchmarks
3. Test under load
4. Check timeout handling

**Expected Results:**
- Order submission: < 2 seconds
- Order confirmation: < 1 second
- PDF generation: < 5 seconds
- Email sending: < 3 seconds
- Timeline: < 1 second
- Timeouts are handled correctly

---

### 2.2 End-to-End Testing

#### TC-M2-2.2-001: Complete Order Flow - Happy Path
**Test ID:** TC-M2-2.2-001  
**Priority:** 🔴 Critical  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in
- Products are available
- All services are running

**Test Steps:**
1. Navigate to Order Management → New Order
2. Search and add product to cart
3. Add multiple products to cart
4. Fill transaction mode (Email)
5. Select investment account
6. Select branch code
7. Add nominee information
8. Review order summary
9. Submit order
10. Verify redirect to confirmation page
11. Verify order details on confirmation page
12. Download PDF receipt
13. Send email confirmation
14. Verify email is received
15. Check order appears in Order Book

**Expected Results:**
- All steps complete successfully
- Order is created correctly
- Confirmation page displays correctly
- PDF receipt downloads successfully
- Email is sent and received
- Order appears in Order Book with correct status

---

#### TC-M2-2.2-002: Order Flow with Full Redemption
**Test ID:** TC-M2-2.2-002  
**Priority:** 🔴 Critical  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in
- Client has holdings
- Full redemption option available

**Test Steps:**
1. Navigate to New Order
2. Select Full Redemption transaction type
3. Select scheme with holdings
4. Verify read-only panel displays
5. Verify close AC = Y flag
6. Fill other required fields
7. Submit order
8. Verify confirmation page
9. Check order details are correct

**Expected Results:**
- Full redemption flow works correctly
- Read-only panel displays correctly
- Close AC = Y flag is set
- Min/max validations are bypassed
- Order submits successfully
- Confirmation page shows correct details

---

#### TC-M2-2.2-003: Order Flow with Validation Errors
**Test ID:** TC-M2-2.2-003  
**Priority:** 🔴 Critical  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in
- Order form is open

**Test Steps:**
1. Attempt to submit empty cart
2. Add product with amount below minimum
3. Add nominee with percentage totaling 90%
4. Submit without transaction mode
5. Verify all validation errors display
6. Fix errors one by one
7. Verify errors clear on correction
8. Submit successfully

**Expected Results:**
- All validation errors display correctly
- Submission is blocked until valid
- Errors clear on correction
- User guidance is provided
- Order submits after corrections

---

#### TC-M2-2.2-004: Order Flow - Multiple Orders
**Test ID:** TC-M2-2.2-004  
**Priority:** 🟡 High  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in

**Test Steps:**
1. Submit first order
2. Navigate back to New Order
3. Submit second order
4. Submit third order
5. Verify all orders are created
6. Check Order Book shows all orders
7. Verify each order has unique ID

**Expected Results:**
- Multiple orders can be submitted
- Each order has unique ID
- All orders appear in Order Book
- No conflicts between orders
- Order history is maintained

---

#### TC-M2-2.2-005: Order Flow - Session Persistence
**Test ID:** TC-M2-2.2-005  
**Priority:** 🟡 High  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in
- Order form is partially filled

**Test Steps:**
1. Fill order form partially
2. Navigate away from page
3. Return to order form
4. Verify form data persists
5. Complete and submit order
6. Verify order is created correctly

**Expected Results:**
- Form data persists during navigation
- Data is restored correctly
- Order submission works after restore
- No data loss

---

#### TC-M2-2.2-006: Order Flow - Network Interruption
**Test ID:** TC-M2-2.2-006  
**Priority:** 🟡 High  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in
- Order form is filled

**Test Steps:**
1. Fill order form completely
2. Disable network connection
3. Attempt to submit order
4. Verify error handling
5. Re-enable network connection
6. Retry submission
7. Verify order submits successfully

**Expected Results:**
- Network interruption is detected
- Error message is displayed
- User can retry after reconnection
- Order submits successfully on retry
- No data loss

---

#### TC-M2-2.2-007: Order Flow - Browser Refresh
**Test ID:** TC-M2-2.2-007  
**Priority:** 🟡 Medium  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is on confirmation page

**Test Steps:**
1. Submit order successfully
2. Verify confirmation page displays
3. Refresh browser page
4. Verify confirmation page reloads correctly
5. Check order data is still displayed
6. Verify all functionality still works

**Expected Results:**
- Page refreshes correctly
- Order data is reloaded
- All functionality works after refresh
- No errors on refresh

---

#### TC-M2-2.2-008: Order Flow - Cross-Browser Testing
**Test ID:** TC-M2-2.2-008  
**Priority:** 🟡 Medium  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in

**Test Steps:**
1. Test complete order flow in Chrome
2. Test complete order flow in Firefox
3. Test complete order flow in Safari
4. Test complete order flow in Edge
5. Verify consistent behavior across browsers

**Expected Results:**
- Order flow works in all browsers
- Consistent behavior across browsers
- No browser-specific errors
- UI renders correctly in all browsers

---

#### TC-M2-2.2-009: Order Flow - Mobile Device Testing
**Test ID:** TC-M2-2.2-009  
**Priority:** 🟡 Medium  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- User is logged in on mobile device

**Test Steps:**
1. Test complete order flow on mobile device
2. Verify touch interactions work
3. Check form inputs are accessible
4. Verify PDF download works
5. Check email sending works
6. Verify responsive layout

**Expected Results:**
- Order flow works on mobile
- Touch interactions work correctly
- Form inputs are accessible
- PDF download works
- Email sending works
- Layout is responsive

---

#### TC-M2-2.2-010: Order Flow - Concurrent Users
**Test ID:** TC-M2-2.2-010  
**Priority:** 🟡 Medium  
**Type:** E2E  
**Sub-module:** 2.2 End-to-End Testing

**Preconditions:**
- Multiple users are logged in

**Test Steps:**
1. Have multiple users submit orders simultaneously
2. Verify all orders are created
3. Check no conflicts occur
4. Verify each user sees their own orders
5. Check Order Book displays correctly for each user

**Expected Results:**
- All orders are created successfully
- No conflicts between users
- Each user sees only their orders
- Order Book displays correctly
- No performance degradation

---

### 2.3 Bug Fixes

#### TC-M2-2.3-001: Bug Fix Verification - Order Submission
**Test ID:** TC-M2-2.3-001  
**Priority:** 🔴 Critical  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported bugs related to order submission
2. Test each bug scenario
3. Verify bugs are fixed
4. Test regression scenarios
5. Verify no new bugs introduced

**Expected Results:**
- All identified bugs are fixed
- Bug scenarios no longer occur
- No regressions introduced
- Related functionality still works

---

#### TC-M2-2.3-002: Bug Fix Verification - Order Confirmation
**Test ID:** TC-M2-2.3-002  
**Priority:** 🔴 Critical  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported bugs related to order confirmation
2. Test each bug scenario
3. Verify bugs are fixed
4. Test edge cases
5. Verify no new bugs introduced

**Expected Results:**
- All identified bugs are fixed
- Bug scenarios no longer occur
- Edge cases are handled
- No regressions introduced

---

#### TC-M2-2.3-003: Bug Fix Verification - PDF Generation
**Test ID:** TC-M2-2.3-003  
**Priority:** 🔴 Critical  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported bugs related to PDF generation
2. Test each bug scenario
3. Verify bugs are fixed
4. Test with various order types
5. Verify no new bugs introduced

**Expected Results:**
- All identified bugs are fixed
- PDF generation works for all order types
- No regressions introduced
- PDF content is correct

---

#### TC-M2-2.3-004: Bug Fix Verification - Email Sending
**Test ID:** TC-M2-2.3-004  
**Priority:** 🔴 Critical  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported bugs related to email sending
2. Test each bug scenario
3. Verify bugs are fixed
4. Test with various email addresses
5. Verify no new bugs introduced

**Expected Results:**
- All identified bugs are fixed
- Email sending works correctly
- No regressions introduced
- Email content is correct

---

#### TC-M2-2.3-005: Bug Fix Verification - Order Timeline
**Test ID:** TC-M2-2.3-005  
**Priority:** 🟡 High  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported bugs related to order timeline
2. Test each bug scenario
3. Verify bugs are fixed
4. Test with various order statuses
5. Verify no new bugs introduced

**Expected Results:**
- All identified bugs are fixed
- Timeline displays correctly for all statuses
- No regressions introduced
- Timeline updates correctly

---

#### TC-M2-2.3-006: Bug Fix Verification - UI/UX Issues
**Test ID:** TC-M2-2.3-006  
**Priority:** 🟡 High  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known UI/UX bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported UI/UX bugs
2. Test each bug scenario
3. Verify bugs are fixed
4. Test responsive design
5. Verify no new bugs introduced

**Expected Results:**
- All identified UI/UX bugs are fixed
- Layout issues are resolved
- Responsive design works correctly
- No regressions introduced

---

#### TC-M2-2.3-007: Bug Fix Verification - Data Validation
**Test ID:** TC-M2-2.3-007  
**Priority:** 🔴 Critical  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known validation bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported validation bugs
2. Test each bug scenario
3. Verify bugs are fixed
4. Test all validation rules
5. Verify no new bugs introduced

**Expected Results:**
- All identified validation bugs are fixed
- Validation rules work correctly
- Error messages are clear
- No regressions introduced

---

#### TC-M2-2.3-008: Bug Fix Verification - Error Handling
**Test ID:** TC-M2-2.3-008  
**Priority:** 🔴 Critical  
**Type:** Bug Fix  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Known error handling bugs have been identified
- Fixes have been implemented

**Test Steps:**
1. Identify all reported error handling bugs
2. Test each bug scenario
3. Verify bugs are fixed
4. Test various error scenarios
5. Verify no new bugs introduced

**Expected Results:**
- All identified error handling bugs are fixed
- Errors are handled gracefully
- Error messages are user-friendly
- No regressions introduced

---

#### TC-M2-2.3-009: Bug Fix Regression Testing
**Test ID:** TC-M2-2.3-009  
**Priority:** 🔴 Critical  
**Type:** Regression  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Bugs have been fixed
- Previous test cases exist

**Test Steps:**
1. Run all previous test cases
2. Verify all previously passing tests still pass
3. Check for any regressions
4. Document any new issues found

**Expected Results:**
- All previous tests still pass
- No regressions found
- New issues are documented
- Test coverage is maintained

---

#### TC-M2-2.3-010: Bug Fix Documentation
**Test ID:** TC-M2-2.3-010  
**Priority:** 🟡 Medium  
**Type:** Documentation  
**Sub-module:** 2.3 Bug Fixes

**Preconditions:**
- Bugs have been fixed

**Test Steps:**
1. Document all bugs that were fixed
2. Document the fixes applied
3. Document test cases used to verify fixes
4. Update bug tracking system

**Expected Results:**
- All bugs are documented
- Fixes are documented
- Test cases are documented
- Bug tracking system is updated

---

### 2.4 Performance Optimization

#### TC-M2-2.4-001: Page Load Performance
**Test ID:** TC-M2-2.4-001  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Application is deployed
- Performance benchmarks are defined

**Test Steps:**
1. Measure order confirmation page load time
2. Measure order management page load time
3. Verify load times meet benchmarks
4. Test with slow network connection
5. Check resource loading optimization

**Expected Results:**
- Order confirmation page loads within 2 seconds
- Order management page loads within 3 seconds
- Performance meets benchmarks
- Works acceptably on slow connections
- Resources are optimized

---

#### TC-M2-2.4-002: API Response Time Optimization
**Test ID:** TC-M2-2.4-002  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- APIs are deployed
- Performance benchmarks are defined

**Test Steps:**
1. Measure API response times
2. Identify slow endpoints
3. Optimize slow endpoints
4. Verify improvements
5. Test under load

**Expected Results:**
- All APIs meet performance benchmarks
- Slow endpoints are optimized
- Response times are improved
- Performance is maintained under load

---

#### TC-M2-2.4-003: Database Query Optimization
**Test ID:** TC-M2-2.4-003  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Database is set up
- Queries are identified

**Test Steps:**
1. Identify slow database queries
2. Analyze query execution plans
3. Optimize queries (indexes, joins, etc.)
4. Verify query performance improvements
5. Test with large datasets

**Expected Results:**
- Slow queries are identified
- Queries are optimized
- Query performance is improved
- Performance is maintained with large datasets

---

#### TC-M2-2.4-004: Frontend Bundle Size Optimization
**Test ID:** TC-M2-2.4-004  
**Priority:** 🟡 Medium  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Frontend is built
- Bundle analyzer is available

**Test Steps:**
1. Analyze frontend bundle size
2. Identify large dependencies
3. Optimize bundle (code splitting, tree shaking)
4. Verify bundle size reduction
5. Test application still works correctly

**Expected Results:**
- Bundle size is optimized
- Large dependencies are addressed
- Code splitting is implemented
- Application works correctly
- Load time is improved

---

#### TC-M2-2.4-005: Image and Asset Optimization
**Test ID:** TC-M2-2.4-005  
**Priority:** 🟡 Medium  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Application has images and assets

**Test Steps:**
1. Identify large images and assets
2. Optimize images (compression, formats)
3. Implement lazy loading
4. Verify asset loading performance
5. Test visual quality

**Expected Results:**
- Images are optimized
- Asset loading is optimized
- Lazy loading is implemented
- Visual quality is maintained
- Load time is improved

---

#### TC-M2-2.4-006: Caching Strategy Implementation
**Test ID:** TC-M2-2.4-006  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Caching strategy is defined

**Test Steps:**
1. Implement API response caching
2. Implement frontend caching
3. Verify cache invalidation works
4. Test cache performance improvements
5. Verify data consistency

**Expected Results:**
- Caching is implemented correctly
- Cache invalidation works
- Performance is improved
- Data consistency is maintained

---

#### TC-M2-2.4-007: Memory Leak Detection and Fix
**Test ID:** TC-M2-2.4-007  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Application is running
- Memory profiling tools are available

**Test Steps:**
1. Run memory profiling
2. Identify memory leaks
3. Fix memory leaks
4. Verify memory usage is stable
5. Test over extended period

**Expected Results:**
- Memory leaks are identified
- Memory leaks are fixed
- Memory usage is stable
- No memory leaks over time

---

#### TC-M2-2.4-008: Concurrent Request Handling
**Test ID:** TC-M2-2.4-008  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Application supports concurrent requests

**Test Steps:**
1. Test concurrent API requests
2. Verify all requests are handled
3. Check response times under load
4. Verify no errors occur
5. Test with increasing load

**Expected Results:**
- Concurrent requests are handled correctly
- Response times are acceptable under load
- No errors occur
- System scales appropriately

---

#### TC-M2-2.4-009: Performance Monitoring Setup
**Test ID:** TC-M2-2.4-009  
**Priority:** 🟡 Medium  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Performance monitoring tools are available

**Test Steps:**
1. Set up performance monitoring
2. Configure alerts for performance issues
3. Verify monitoring is working
4. Test alert notifications
5. Document monitoring setup

**Expected Results:**
- Performance monitoring is set up
- Alerts are configured
- Monitoring is working correctly
- Alerts are received appropriately
- Setup is documented

---

#### TC-M2-2.4-010: Performance Benchmark Verification
**Test ID:** TC-M2-2.4-010  
**Priority:** 🟡 High  
**Type:** Performance  
**Sub-module:** 2.4 Performance Optimization

**Preconditions:**
- Performance benchmarks are defined
- Optimizations are implemented

**Test Steps:**
1. Run performance benchmarks
2. Verify all benchmarks are met
3. Document performance metrics
4. Compare with previous metrics
5. Verify improvements

**Expected Results:**
- All benchmarks are met
- Performance metrics are documented
- Improvements are verified
- Performance is acceptable

---

## Test Execution Guide

### Prerequisites

1. **Environment Setup:**
   - Frontend development server running (port 5000)
   - Backend API server running
   - Database configured and accessible
   - Email service configured (mock or real)
   - Test data seeded

2. **Test Tools:**
   - Vitest for unit/integration tests
   - Playwright for E2E tests
   - Browser DevTools for manual testing
   - API testing tools (Postman/curl)

3. **Test Data:**
   - Test user accounts
   - Test products/schemes
   - Test orders
   - Test client data

### Test Execution Order

1. **Module 1 Tests (Order Confirmation & Receipts):**
   - Run 1.1 tests (Order Confirmation Page)
   - Run 1.2 tests (PDF Receipt Generation)
   - Run 1.3 tests (Email Notifications)
   - Run 1.4 tests (Order Timeline/Tracking)

2. **Module 2 Tests (Integration Testing & Bug Fixes):**
   - Run 2.1 tests (Frontend-Backend Integration)
   - Run 2.2 tests (End-to-End Testing)
   - Run 2.3 tests (Bug Fixes)
   - Run 2.4 tests (Performance Optimization)

### Running Tests

#### Unit/Integration Tests (Vitest):
```bash
# Run all tests
npm run test

# Run specific test file
npm run test tests/integration/order-confirmation-api.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

#### E2E Tests (Playwright):
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/order-management/order-confirmation.test.ts

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Test Reporting

1. **Test Results:**
   - Vitest: Console output + coverage reports
   - Playwright: HTML report in `playwright-report/`

2. **Test Documentation:**
   - Document test results
   - Track bugs found
   - Update test cases as needed

### Test Maintenance

1. **Update Test Cases:**
   - Update tests when features change
   - Add tests for new bugs found
   - Remove obsolete tests

2. **Test Data Management:**
   - Maintain test data sets
   - Clean up test data after runs
   - Use fixtures for consistent data

---

## Test Data Requirements

### Test Users
- RM user with full permissions
- RM user with limited permissions
- Admin user
- Test client accounts

### Test Products/Schemes
- Products with different categories
- Products with different risk levels
- Products with various investment limits
- Products with documents
- Products without documents

### Test Orders
- Orders with single item
- Orders with multiple items
- Orders with different transaction types
- Orders with nominee information
- Orders with opt-out of nomination
- Orders with full redemption
- Orders with full switch
- Orders in different statuses

### Test Email Addresses
- Valid email addresses
- Invalid email addresses
- Email addresses for testing (test@example.com)

### Test Scenarios
- Happy path scenarios
- Error scenarios
- Edge cases
- Boundary conditions
- Performance test scenarios

---

## Test Coverage Summary

### Module 1: Order Confirmation & Receipts
- **Total Test Cases:** 50
- **Critical Priority:** 25
- **High Priority:** 15
- **Medium Priority:** 10

### Module 2: Integration Testing & Bug Fixes
- **Total Test Cases:** 50
- **Critical Priority:** 25
- **High Priority:** 15
- **Medium Priority:** 10

### Overall
- **Total Test Cases:** 100
- **Critical Priority:** 50
- **High Priority:** 30
- **Medium Priority:** 20

---

## Success Criteria

### Module 1 Success Criteria
- ✅ All critical priority tests pass
- ✅ All high priority tests pass
- ✅ 95%+ test coverage
- ✅ No critical bugs
- ✅ Performance benchmarks met

### Module 2 Success Criteria
- ✅ All critical priority tests pass
- ✅ All high priority tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Performance benchmarks met
- ✅ No critical bugs
- ✅ Bug fixes verified

### Overall Success Criteria
- ✅ All critical and high priority tests pass
- ✅ 95%+ test coverage
- ✅ Performance benchmarks met
- ✅ No critical bugs
- ✅ Ready for Phase 2

---

## Notes

- Tests should be automated where possible
- Manual testing required for complex UI interactions
- Mock services should mirror production behavior
- Test data should cover edge cases
- Continuous validation during development
- Update test cases as features evolve
- Document all bugs found during testing
- Track test execution metrics

---

**Document Status:** Ready for Execution  
**Last Updated:** December 2024  
**Next Review:** After Module 1 & Module 2 Completion

