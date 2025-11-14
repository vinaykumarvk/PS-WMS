/**
 * NAV (Net Asset Value) Service
 * Fetches and caches NAV data for mutual fund schemes
 * Uses integration stubs - replace with actual provider when ready
 */

import { db } from '../db';
import { products } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { getIntegrationConfig, createIntegrationInstances } from '../integrations/config';

export interface NAVData {
  schemeId: number;
  schemeName: string;
  nav: number;
  date: string;
  change: number;
  changePercent: number;
}

// In-memory NAV cache (replace with Redis or database table in production)
const navCache: Map<number, { nav: number; date: string }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Initialize NAV provider from integration config
let navProvider: any = null;
function getNAVProvider() {
  if (!navProvider) {
    const config = getIntegrationConfig();
    const instances = createIntegrationInstances(config);
    navProvider = instances.navProvider;
  }
  return navProvider;
}

/**
 * Get NAV for a scheme
 * Uses integration stub - replace with actual provider when ready
 */
export async function getNAV(schemeId: number, date?: string): Promise<number> {
  const cacheKey = schemeId;
  const cached = navCache.get(cacheKey);
  const now = Date.now();

  // Return cached NAV if still valid
  if (cached && (now - new Date(cached.date).getTime()) < CACHE_TTL) {
    return cached.nav;
  }

  // Fetch scheme details
  const [product] = await db.select().from(products).where(eq(products.id, schemeId)).limit(1);
  if (!product) {
    throw new Error(`Scheme ${schemeId} not found`);
  }

  // Use NAV provider from integration stubs
  const provider = getNAVProvider();
  const navResponse = await provider.getNAV(schemeId, date);

  // Cache the NAV
  navCache.set(cacheKey, {
    nav: navResponse.nav,
    date: navResponse.date,
  });

  return navResponse.nav;
}

/**
 * Get NAV data with change information
 */
export async function getNAVData(schemeId: number, date?: string): Promise<NAVData> {
  const [product] = await db.select().from(products).where(eq(products.id, schemeId)).limit(1);
  if (!product) {
    throw new Error(`Scheme ${schemeId} not found`);
  }

  // Use NAV provider from integration stubs
  const provider = getNAVProvider();
  const navResponse = await provider.getNAV(schemeId, date);

  return {
    schemeId,
    schemeName: navResponse.schemeName || product.name,
    nav: navResponse.nav,
    date: navResponse.date,
    change: navResponse.change || 0,
    changePercent: navResponse.changePercent || 0,
  };
}

/**
 * Get NAV for multiple schemes
 */
export async function getBulkNAV(schemeIds: number[], date?: string): Promise<Map<number, number>> {
  // Use NAV provider bulk method from integration stubs
  const provider = getNAVProvider();
  const navMap = await provider.getBulkNAV(schemeIds, date);
  
  // Convert to Map<number, number> format
  const result = new Map<number, number>();
  navMap.forEach((response: any, schemeId: number) => {
    result.set(schemeId, response.nav);
  });

  return result;
}

/**
 * Clear NAV cache (useful for testing or forced refresh)
 */
export function clearNAVCache(): void {
  navCache.clear();
}

/**
 * Refresh NAV for a scheme (force update)
 */
export async function refreshNAV(schemeId: number): Promise<number> {
  navCache.delete(schemeId);
  return await getNAV(schemeId);
}

