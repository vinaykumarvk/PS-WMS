/**
 * Integration Configuration
 * Centralized configuration for all external integrations
 */

import { NAVProviderConfig } from './interfaces/nav-api.interface';
import { EmailProviderConfig } from './interfaces/email-service.interface';
import { SMSProviderConfig } from './interfaces/sms-service.interface';
import { OrderServiceConfig } from './interfaces/order-service.interface';
import { PaymentGatewayConfig } from './interfaces/payment-gateway.interface';
import { RTAServiceConfig } from './interfaces/rta-service.interface';

export interface IntegrationConfig {
  nav: NAVProviderConfig;
  email: EmailProviderConfig;
  sms: SMSProviderConfig;
  orderService: OrderServiceConfig;
  paymentGateway: PaymentGatewayConfig;
  rta: RTAServiceConfig;
}

/**
 * Get integration configuration from environment variables
 */
export function getIntegrationConfig(): IntegrationConfig {
  return {
    nav: {
      provider: (process.env.NAV_PROVIDER as any) || 'MOCK',
      apiKey: process.env.NAV_API_KEY,
      apiSecret: process.env.NAV_API_SECRET,
      baseUrl: process.env.NAV_BASE_URL,
      timeout: parseInt(process.env.NAV_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.NAV_RETRY_ATTEMPTS || '3'),
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as any) || 'MOCK',
      apiKey: process.env.EMAIL_API_KEY,
      apiSecret: process.env.EMAIL_API_SECRET,
      fromEmail: process.env.EMAIL_FROM || 'noreply@wealthrm.com',
      fromName: process.env.EMAIL_FROM_NAME || 'WealthRM',
      baseUrl: process.env.EMAIL_BASE_URL,
      region: process.env.EMAIL_REGION,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD,
    },
    sms: {
      provider: (process.env.SMS_PROVIDER as any) || 'MOCK',
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.SMS_FROM_NUMBER,
      region: process.env.SMS_REGION,
    },
    orderService: {
      baseUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
      apiKey: process.env.ORDER_SERVICE_API_KEY,
      timeout: parseInt(process.env.ORDER_SERVICE_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.ORDER_SERVICE_RETRY_ATTEMPTS || '3'),
    },
    paymentGateway: {
      provider: (process.env.PAYMENT_PROVIDER as any) || 'MOCK',
      apiKey: process.env.PAYMENT_API_KEY,
      apiSecret: process.env.PAYMENT_API_SECRET,
      webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
      merchantId: process.env.PAYMENT_MERCHANT_ID,
      mode: (process.env.PAYMENT_MODE as any) || 'sandbox',
    },
    rta: {
      provider: (process.env.RTA_PROVIDER as any) || 'MOCK',
      apiKey: process.env.RTA_API_KEY,
      apiSecret: process.env.RTA_API_SECRET,
      baseUrl: process.env.RTA_BASE_URL,
      timeout: parseInt(process.env.RTA_TIMEOUT || '60000'),
      retryAttempts: parseInt(process.env.RTA_RETRY_ATTEMPTS || '3'),
      arn: process.env.RTA_ARN,
    },
  };
}

/**
 * Factory function to create integration instances based on config
 */
export function createIntegrationInstances(config: IntegrationConfig) {
  // NAV Provider
  let navProvider;
  switch (config.nav.provider) {
    case 'CAMS':
      const { CAMSNAVProvider } = require('./stubs/nav-api.stub');
      navProvider = new CAMSNAVProvider(config.nav);
      break;
    case 'KFintech':
      const { KFintechNAVProvider } = require('./stubs/nav-api.stub');
      navProvider = new KFintechNAVProvider(config.nav);
      break;
    case 'AMFI':
      const { AMFINAVProvider } = require('./stubs/nav-api.stub');
      navProvider = new AMFINAVProvider(config.nav);
      break;
    default:
      const { NAVAPIStub } = require('./stubs/nav-api.stub');
      navProvider = new NAVAPIStub(config.nav);
  }

  // Email Provider
  let emailProvider;
  switch (config.email.provider) {
    case 'SendGrid':
      const { SendGridEmailProvider } = require('./stubs/email-service.stub');
      emailProvider = new SendGridEmailProvider(config.email);
      break;
    case 'AWSSES':
      const { AWSSESEmailProvider } = require('./stubs/email-service.stub');
      emailProvider = new AWSSESEmailProvider(config.email);
      break;
    case 'SMTP':
      const { SMTPEmailProvider } = require('./stubs/email-service.stub');
      emailProvider = new SMTPEmailProvider(config.email);
      break;
    default:
      const { EmailServiceStub } = require('./stubs/email-service.stub');
      emailProvider = new EmailServiceStub(config.email);
  }

  // SMS Provider
  let smsProvider;
  switch (config.sms.provider) {
    case 'Twilio':
      const { TwilioSMSProvider } = require('./stubs/sms-service.stub');
      smsProvider = new TwilioSMSProvider(config.sms);
      break;
    case 'AWSSNS':
      const { AWSSNSSMSProvider } = require('./stubs/sms-service.stub');
      smsProvider = new AWSSNSSMSProvider(config.sms);
      break;
    case 'MSG91':
      const { MSG91SMSProvider } = require('./stubs/sms-service.stub');
      smsProvider = new MSG91SMSProvider(config.sms);
      break;
    default:
      const { SMSServiceStub } = require('./stubs/sms-service.stub');
      smsProvider = new SMSServiceStub(config.sms);
  }

  // Order Service
  let orderService;
  if (config.orderService.baseUrl && config.orderService.baseUrl !== 'http://localhost:3001') {
    const { OrderServiceIntegration } = require('./stubs/order-service.stub');
    orderService = new OrderServiceIntegration(config.orderService);
  } else {
    const { OrderServiceStub } = require('./stubs/order-service.stub');
    orderService = new OrderServiceStub(config.orderService);
  }

  // Payment Gateway
  let paymentGateway;
  switch (config.paymentGateway.provider) {
    case 'Razorpay':
      const { RazorpayPaymentGateway } = require('./stubs/payment-gateway.stub');
      paymentGateway = new RazorpayPaymentGateway(config.paymentGateway);
      break;
    case 'Stripe':
      const { StripePaymentGateway } = require('./stubs/payment-gateway.stub');
      paymentGateway = new StripePaymentGateway(config.paymentGateway);
      break;
    default:
      const { PaymentGatewayStub } = require('./stubs/payment-gateway.stub');
      paymentGateway = new PaymentGatewayStub(config.paymentGateway);
  }

  // RTA Service
  let rtaService;
  switch (config.rta.provider) {
    case 'CAMS':
      const { CAMSRTAProvider } = require('./stubs/rta-service.stub');
      rtaService = new CAMSRTAProvider(config.rta);
      break;
    case 'KFintech':
      const { KFintechRTAProvider } = require('./stubs/rta-service.stub');
      rtaService = new KFintechRTAProvider(config.rta);
      break;
    default:
      const { RTAServiceStub } = require('./stubs/rta-service.stub');
      rtaService = new RTAServiceStub(config.rta);
  }

  return {
    navProvider,
    emailProvider,
    smsProvider,
    orderService,
    paymentGateway,
    rtaService,
  };
}

