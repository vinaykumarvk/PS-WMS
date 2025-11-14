/**
 * Integration Stubs Index
 * Central export point for all integration interfaces and stubs
 */

// Interfaces
export * from './interfaces/nav-api.interface';
export * from './interfaces/email-service.interface';
export * from './interfaces/sms-service.interface';
export * from './interfaces/order-service.interface';
export * from './interfaces/payment-gateway.interface';
export * from './interfaces/rta-service.interface';

// Configuration
export { getIntegrationConfig, createIntegrationInstances } from './config';
export type { IntegrationConfig } from './config';

// Stubs (for direct access if needed)
export * from './stubs/nav-api.stub';
export * from './stubs/email-service.stub';
export * from './stubs/sms-service.stub';
export * from './stubs/order-service.stub';
export * from './stubs/payment-gateway.stub';
export * from './stubs/rta-service.stub';

