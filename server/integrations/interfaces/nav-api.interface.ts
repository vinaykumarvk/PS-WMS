/**
 * NAV API Integration Interface
 * Defines the contract for NAV data providers (CAMS, KFintech, AMFI, etc.)
 */

export interface NAVProvider {
  /**
   * Get NAV for a specific scheme on a given date
   */
  getNAV(schemeId: number, date?: string): Promise<NAVResponse>;

  /**
   * Get NAV for multiple schemes (bulk)
   */
  getBulkNAV(schemeIds: number[], date?: string): Promise<Map<number, NAVResponse>>;

  /**
   * Get historical NAV data
   */
  getHistoricalNAV(schemeId: number, startDate: string, endDate: string): Promise<NAVResponse[]>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

export interface NAVResponse {
  schemeId: number;
  schemeCode?: string;
  schemeName: string;
  nav: number;
  date: string;
  change?: number;
  changePercent?: number;
  repurchasePrice?: number;
  salePrice?: number;
  timestamp?: string;
}

export interface NAVProviderConfig {
  provider: 'CAMS' | 'KFintech' | 'AMFI' | 'MOCK';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

