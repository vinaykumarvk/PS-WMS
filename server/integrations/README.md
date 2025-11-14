# Integration Stubs Documentation

This directory contains integration stubs for all external services. These stubs provide mock implementations for development and testing, and can be easily replaced with actual integrations when ready.

## Structure

```
integrations/
├── interfaces/          # TypeScript interfaces defining contracts
│   ├── nav-api.interface.ts
│   ├── email-service.interface.ts
│   ├── sms-service.interface.ts
│   ├── order-service.interface.ts
│   ├── payment-gateway.interface.ts
│   └── rta-service.interface.ts
├── stubs/              # Mock implementations
│   ├── nav-api.stub.ts
│   ├── email-service.stub.ts
│   ├── sms-service.stub.ts
│   ├── order-service.stub.ts
│   ├── payment-gateway.stub.ts
│   └── rta-service.stub.ts
├── config.ts           # Configuration and factory
└── README.md           # This file
```

## Available Integrations

### 1. NAV API Integration
**Interface:** `NAVProvider`  
**Stubs:** `NAVAPIStub`, `CAMSNAVProvider`, `KFintechNAVProvider`, `AMFINAVProvider`

**Usage:**
```typescript
import { getIntegrationConfig, createIntegrationInstances } from './integrations/config';
const { navProvider } = createIntegrationInstances(getIntegrationConfig());
const nav = await navProvider.getNAV(schemeId, date);
```

**Environment Variables:**
- `NAV_PROVIDER` - Provider name (MOCK, CAMS, KFintech, AMFI)
- `NAV_API_KEY` - API key for provider
- `NAV_API_SECRET` - API secret for provider
- `NAV_BASE_URL` - Base URL for provider API

### 2. Email Service Integration
**Interface:** `EmailProvider`  
**Stubs:** `EmailServiceStub`, `SendGridEmailProvider`, `AWSSESEmailProvider`, `SMTPEmailProvider`

**Usage:**
```typescript
const { emailProvider } = createIntegrationInstances(getIntegrationConfig());
await emailProvider.sendEmail({
  to: 'client@example.com',
  subject: 'SIP Execution Successful',
  html: '<p>Your SIP has been executed...</p>'
});
```

**Environment Variables:**
- `EMAIL_PROVIDER` - Provider name (MOCK, SendGrid, AWSSES, SMTP)
- `EMAIL_API_KEY` - API key for provider
- `EMAIL_FROM` - Default from email address
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - For SMTP provider

### 3. SMS Service Integration
**Interface:** `SMSProvider`  
**Stubs:** `SMSServiceStub`, `TwilioSMSProvider`, `AWSSNSSMSProvider`, `MSG91SMSProvider`

**Usage:**
```typescript
const { smsProvider } = createIntegrationInstances(getIntegrationConfig());
await smsProvider.sendSMS({
  to: '+919876543210',
  message: 'Your SIP has been executed successfully'
});
```

**Environment Variables:**
- `SMS_PROVIDER` - Provider name (MOCK, Twilio, AWSSNS, MSG91)
- `SMS_API_KEY` - API key for provider
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - For Twilio
- `SMS_FROM_NUMBER` - Default sender number

### 4. Order Service Integration
**Interface:** `OrderService`  
**Stubs:** `OrderServiceStub`, `OrderServiceIntegration`

**Usage:**
```typescript
const { orderService } = createIntegrationInstances(getIntegrationConfig());
const response = await orderService.createOrder({
  clientId: 1,
  schemeId: 100,
  amount: 5000,
  transactionType: 'Purchase'
});
```

**Environment Variables:**
- `ORDER_SERVICE_URL` - Order service API URL
- `ORDER_SERVICE_API_KEY` - API key for order service

### 5. Payment Gateway Integration
**Interface:** `PaymentGateway`  
**Stubs:** `PaymentGatewayStub`, `RazorpayPaymentGateway`, `StripePaymentGateway`

**Usage:**
```typescript
const { paymentGateway } = createIntegrationInstances(getIntegrationConfig());
const payment = await paymentGateway.createPayment({
  amount: 500000, // in paise
  currency: 'INR',
  orderId: 'ORD-123',
  description: 'SIP Payment'
});
```

**Environment Variables:**
- `PAYMENT_PROVIDER` - Provider name (MOCK, Razorpay, Stripe)
- `PAYMENT_API_KEY` - API key for provider
- `PAYMENT_API_SECRET` - API secret for provider
- `PAYMENT_MODE` - Mode (sandbox, live)

### 6. RTA Service Integration
**Interface:** `RTAService`  
**Stubs:** `RTAServiceStub`, `CAMSRTAProvider`, `KFintechRTAProvider`

**Usage:**
```typescript
const { rtaService } = createIntegrationInstances(getIntegrationConfig());
const response = await rtaService.submitTransaction({
  transactionType: 'Purchase',
  schemeId: 100,
  amount: 5000,
  clientId: 1,
  clientPAN: 'ABCDE1234F',
  bankAccount: { ... },
  transactionMode: 'Email'
});
```

**Environment Variables:**
- `RTA_PROVIDER` - Provider name (MOCK, CAMS, KFintech)
- `RTA_API_KEY` - API key for provider
- `RTA_API_SECRET` - API secret for provider
- `RTA_BASE_URL` - Base URL for RTA API
- `RTA_ARN` - ARN code

## Implementation Guide

### Step 1: Choose Provider
Update environment variables to select the provider:
```bash
NAV_PROVIDER=CAMS
EMAIL_PROVIDER=SendGrid
SMS_PROVIDER=Twilio
```

### Step 2: Add Credentials
Add API keys and secrets to environment variables:
```bash
NAV_API_KEY=your_api_key
NAV_API_SECRET=your_api_secret
EMAIL_API_KEY=your_email_api_key
```

### Step 3: Implement Provider
1. Open the stub file for your provider (e.g., `stubs/nav-api.stub.ts`)
2. Find the provider class (e.g., `CAMSNAVProvider`)
3. Replace the `throw new Error(...)` with actual API calls
4. Use the examples in comments as a starting point

### Step 4: Test
Test the integration:
```typescript
const { navProvider } = createIntegrationInstances(getIntegrationConfig());
const isAvailable = await navProvider.isAvailable();
if (isAvailable) {
  const nav = await navProvider.getNAV(100);
  console.log('NAV:', nav);
}
```

## Example: Implementing CAMS NAV Provider

```typescript
// In stubs/nav-api.stub.ts
async getNAV(schemeId: number, date?: string): Promise<NAVResponse> {
  const axios = require('axios');
  
  try {
    const response = await axios.get(
      `${this.config.baseUrl}/api/v1/schemes/${schemeId}/nav`,
      {
        params: { date: date || new Date().toISOString().split('T')[0] },
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Secret': this.config.apiSecret
        },
        timeout: this.config.timeout || 30000
      }
    );
    
    return {
      schemeId,
      schemeName: response.data.schemeName,
      nav: response.data.nav,
      date: response.data.date,
      change: response.data.change,
      changePercent: response.data.changePercent,
      repurchasePrice: response.data.repurchasePrice,
      salePrice: response.data.salePrice,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    throw new Error(`CAMS API error: ${error.message}`);
  }
}
```

## Notes

- All stubs are currently using mock implementations
- Stubs log to console for debugging
- Replace stubs with actual implementations when ready
- All interfaces are well-documented with TypeScript types
- Configuration is centralized in `config.ts`
- Factory pattern makes it easy to switch providers

## Testing

Stubs can be tested independently:
```typescript
import { NAVAPIStub } from './stubs/nav-api.stub';

const stub = new NAVAPIStub({ provider: 'MOCK' });
const nav = await stub.getNAV(100);
console.log('Mock NAV:', nav);
```

