# WealthRM Order Management API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.wealthrm.com/api`  
**Last Updated:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Orders](#orders)
   - [Bulk Orders](#bulk-orders)
   - [Webhooks](#webhooks)
   - [Integrations](#integrations)
6. [Webhooks](#webhooks-details)
7. [Examples](#examples)

---

## Overview

The WealthRM Order Management API provides comprehensive endpoints for managing mutual fund orders, portfolios, goals, and client relationships. This RESTful API uses JSON for request and response payloads.

### Key Features

- **Order Management**: Create, view, and manage investment orders
- **Bulk Processing**: Submit multiple orders in a single request
- **Webhooks**: Real-time notifications for order events
- **Partner Integrations**: Manage API access for partners
- **Comprehensive Validation**: Built-in validation for all order types

---

## Authentication

All API endpoints require session-based authentication. Users must be logged in via `/api/auth/login` before making API requests.

### Session Cookie

After successful login, a session cookie (`connect.sid`) is set. Include this cookie in all subsequent requests.

**Example:**
```bash
curl -X GET https://api.wealthrm.com/api/order-management/orders \
  -H "Cookie: connect.sid=your-session-cookie"
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **100 requests per minute** per user
- **1000 requests per hour** per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for processing
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Endpoints

### Orders

#### Submit Order

**POST** `/api/order-management/orders/submit`

Submit a new order for processing.

**Request Body:**
```json
{
  "cartItems": [
    {
      "id": "1",
      "productId": 123,
      "schemeName": "HDFC Equity Fund",
      "transactionType": "Purchase",
      "amount": 10000,
      "nav": 25.50
    }
  ],
  "transactionMode": {
    "mode": "Email",
    "email": "client@example.com"
  },
  "nominees": [
    {
      "id": "1",
      "name": "John Doe",
      "relationship": "Spouse",
      "dateOfBirth": "1990-01-01",
      "pan": "ABCDE1234F",
      "percentage": 100
    }
  ],
  "optOutOfNomination": false,
  "branchCode": "BR001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order submitted successfully",
  "data": {
    "id": 1,
    "modelOrderId": "MO-20241215-ABC12",
    "clientId": 1,
    "status": "Pending Approval",
    "submittedAt": "2024-12-15T10:30:00Z"
  }
}
```

#### Get Orders

**GET** `/api/order-management/orders`

Retrieve orders with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by order status
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)

**Response:**
```json
[
  {
    "id": 1,
    "modelOrderId": "MO-20241215-ABC12",
    "clientId": 1,
    "status": "Pending Approval",
    "submittedAt": "2024-12-15T10:30:00Z"
  }
]
```

#### Get Order by ID

**GET** `/api/order-management/orders/:id`

Retrieve a specific order by its ID.

**Response:**
```json
{
  "id": 1,
  "modelOrderId": "MO-20241215-ABC12",
  "clientId": 1,
  "orderFormData": { ... },
  "status": "Pending Approval",
  "submittedAt": "2024-12-15T10:30:00Z"
}
```

#### Authorize Order

**POST** `/api/order-management/orders/:id/authorize`

Authorize an order for processing.

**Response:**
```json
{
  "success": true,
  "message": "Order authorized successfully",
  "data": {
    "id": 1,
    "status": "In Progress",
    "authorizedAt": "2024-12-15T11:00:00Z"
  }
}
```

#### Reject Order

**POST** `/api/order-management/orders/:id/reject`

Reject an order with a reason.

**Request Body:**
```json
{
  "reason": "Insufficient documentation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order rejected successfully",
  "data": {
    "id": 1,
    "status": "Failed",
    "rejectedAt": "2024-12-15T11:00:00Z",
    "rejectedReason": "Insufficient documentation"
  }
}
```

---

### Bulk Orders

#### Submit Bulk Orders

**POST** `/api/bulk-orders`

Submit multiple orders in a single request.

**Request Body:**
```json
{
  "orders": [
    {
      "cartItems": [...],
      "transactionMode": {...},
      "nominees": [...]
    },
    {
      "cartItems": [...],
      "transactionMode": {...},
      "nominees": [...]
    }
  ],
  "options": {
    "stopOnError": false,
    "validateOnly": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "BATCH-20241215-ABC12345",
  "message": "Bulk order submitted for processing",
  "summary": {
    "total": 2,
    "submitted": 2,
    "failed": 0,
    "errors": []
  }
}
```

#### Get Bulk Order Status

**GET** `/api/bulk-orders/:batchId`

Get the status of a bulk order batch.

**Response:**
```json
{
  "batchId": "BATCH-20241215-ABC12345",
  "status": "completed",
  "total": 2,
  "processed": 2,
  "succeeded": 2,
  "failed": 0,
  "orders": [...],
  "errors": [],
  "createdAt": "2024-12-15T10:30:00Z",
  "completedAt": "2024-12-15T10:31:00Z"
}
```

---

### Webhooks

#### Create Webhook

**POST** `/api/webhooks`

Register a new webhook endpoint.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["order.created", "order.updated", "order.completed"]
}
```

**Response:**
```json
{
  "id": "wh_1234567890_abc123",
  "url": "https://your-app.com/webhooks",
  "events": ["order.created", "order.updated", "order.completed"],
  "secret": "webhook-secret-key",
  "active": true,
  "createdAt": "2024-12-15T10:30:00Z"
}
```

#### List Webhooks

**GET** `/api/webhooks`

Get all registered webhooks for the current user.

**Response:**
```json
[
  {
    "id": "wh_1234567890_abc123",
    "url": "https://your-app.com/webhooks",
    "events": ["order.created", "order.updated"],
    "active": true,
    "createdAt": "2024-12-15T10:30:00Z"
  }
]
```

#### Update Webhook

**PUT** `/api/webhooks/:id`

Update webhook configuration.

**Request Body:**
```json
{
  "url": "https://new-url.com/webhooks",
  "events": ["order.created"],
  "active": true
}
```

#### Delete Webhook

**DELETE** `/api/webhooks/:id`

Delete a webhook endpoint.

**Response:** `204 No Content`

#### Test Webhook

**POST** `/api/webhooks/:id/test`

Send a test event to a webhook endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Test event sent successfully",
  "delivery": {
    "id": "del_1234567890_xyz789",
    "status": "delivered",
    "responseCode": 200
  }
}
```

---

### Integrations

#### Create Integration

**POST** `/api/integrations`

Create a new partner integration.

**Request Body:**
```json
{
  "name": "Payment Gateway Integration",
  "type": "payment_gateway",
  "config": {
    "merchantId": "MERCHANT123"
  },
  "webhookUrl": "https://partner.com/webhooks"
}
```

**Response:**
```json
{
  "id": "int_1234567890_def456",
  "name": "Payment Gateway Integration",
  "type": "payment_gateway",
  "status": "pending",
  "apiKey": "ak_1234567890_ghi789",
  "apiSecret": "secret-key-only-shown-once",
  "webhookUrl": "https://partner.com/webhooks",
  "webhookSecret": "webhook-secret",
  "createdAt": "2024-12-15T10:30:00Z"
}
```

#### List Integrations

**GET** `/api/integrations`

Get all integrations for the current user.

**Query Parameters:**
- `type` (optional): Filter by integration type

**Response:**
```json
[
  {
    "id": "int_1234567890_def456",
    "name": "Payment Gateway Integration",
    "type": "payment_gateway",
    "status": "active",
    "createdAt": "2024-12-15T10:30:00Z",
    "usageCount": 150
  }
]
```

#### Regenerate API Credentials

**POST** `/api/integrations/:id/regenerate-credentials`

Regenerate API key and secret for an integration.

**Response:**
```json
{
  "success": true,
  "message": "API credentials regenerated successfully",
  "apiKey": "ak_new_key_123",
  "apiSecret": "new-secret-only-shown-once"
}
```

---

## Webhooks Details

### Webhook Events

- `order.created`: Triggered when a new order is created
- `order.updated`: Triggered when an order status is updated
- `order.completed`: Triggered when an order is completed
- `order.failed`: Triggered when an order fails
- `payment.received`: Triggered when payment is received
- `payment.failed`: Triggered when payment fails

### Webhook Payload

Webhooks are sent as POST requests to your registered URL with the following headers:

- `X-Webhook-Event`: The event type
- `X-Webhook-Signature`: HMAC SHA256 signature
- `X-Webhook-Id`: Webhook ID
- `X-Webhook-Timestamp`: Unix timestamp

**Example Payload:**
```json
{
  "event": "order.created",
  "data": {
    "orderId": 1,
    "modelOrderId": "MO-20241215-ABC12",
    "clientId": 1,
    "status": "Pending Approval",
    "submittedAt": "2024-12-15T10:30:00Z"
  },
  "timestamp": "2024-12-15T10:30:00Z"
}
```

### Verifying Webhook Signatures

To verify webhook authenticity, compute the HMAC SHA256 signature:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Examples

### Complete Order Flow

```bash
# 1. Submit order
curl -X POST https://api.wealthrm.com/api/order-management/orders/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "cartItems": [{
      "id": "1",
      "productId": 123,
      "schemeName": "HDFC Equity Fund",
      "transactionType": "Purchase",
      "amount": 10000
    }],
    "transactionMode": {
      "mode": "Email",
      "email": "client@example.com"
    },
    "optOutOfNomination": true,
    "branchCode": "BR001"
  }'

# 2. Get order status
curl -X GET https://api.wealthrm.com/api/order-management/orders/1 \
  -H "Cookie: connect.sid=your-session-cookie"

# 3. Authorize order
curl -X POST https://api.wealthrm.com/api/order-management/orders/1/authorize \
  -H "Cookie: connect.sid=your-session-cookie"
```

### Bulk Order Example

```bash
curl -X POST https://api.wealthrm.com/api/bulk-orders \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "orders": [
      {
        "cartItems": [{
          "id": "1",
          "productId": 123,
          "schemeName": "Scheme A",
          "transactionType": "Purchase",
          "amount": 5000
        }],
        "transactionMode": {"mode": "Email", "email": "client1@example.com"},
        "optOutOfNomination": true
      },
      {
        "cartItems": [{
          "id": "2",
          "productId": 456,
          "schemeName": "Scheme B",
          "transactionType": "Purchase",
          "amount": 10000
        }],
        "transactionMode": {"mode": "Email", "email": "client2@example.com"},
        "optOutOfNomination": true
      }
    ],
    "options": {
      "stopOnError": false
    }
  }'
```

### Webhook Setup Example

```bash
# 1. Create webhook
curl -X POST https://api.wealthrm.com/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "url": "https://your-app.com/webhooks",
    "events": ["order.created", "order.completed"]
  }'

# 2. Test webhook
curl -X POST https://api.wealthrm.com/api/webhooks/wh_1234567890_abc123/test \
  -H "Cookie: connect.sid=your-session-cookie"
```

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:

- **YAML:** `/api/openapi.yaml`
- **JSON:** `/api/openapi.json` (if implemented)

You can use tools like Swagger UI or Postman to import and explore the API.

---

## Support

For API support, please contact:
- **Email:** api-support@wealthrm.com
- **Documentation:** https://docs.wealthrm.com/api

---

**Last Updated:** January 2025

