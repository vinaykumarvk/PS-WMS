// Export all API services for easy access
export * from './clientApi';
export * from './prospectApi';
export * from './portfolioApi';

// This file will grow as we add more API services

/**
 * API Configuration interface
 * This interface defines the methods for configuring API services
 */
export interface ApiConfiguration {
  baseUrl: string;
  apiVersion: string;
  headers: Record<string, string>;
  timeout: number;
}

// Default API configuration
const defaultApiConfig: ApiConfiguration = {
  baseUrl: '',
  apiVersion: 'v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
};

// Current API configuration
let apiConfig: ApiConfiguration = { ...defaultApiConfig };

/**
 * Set the API configuration
 * @param config The new API configuration
 */
export function setApiConfig(config: Partial<ApiConfiguration>): void {
  apiConfig = { ...apiConfig, ...config };
}

/**
 * Get the current API configuration
 * @returns The current API configuration
 */
export function getApiConfig(): ApiConfiguration {
  return { ...apiConfig };
}