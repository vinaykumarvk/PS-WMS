/**
 * Redemption Service
 * Module E: Instant Redemption Features
 * Handles redemption calculations and operations
 */

import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { IRedemptionService } from '@shared/contracts/redemption-service.contract';
import type { APIResponse } from '@shared/types/api.types';
import type {
  RedemptionCalculation,
  InstantRedemptionEligibility,
  RedemptionHistory,
} from '@shared/types/order-management.types';
import { products } from '@shared/schema';
import { calculateRedemptionRequestSchema, executeRedemptionRequestSchema, checkInstantRedemptionEligibilitySchema } from '../contracts/api-schemas';

const INSTANT_REDEMPTION_LIMIT = 50000; // ₹50K
const EXIT_LOAD_RATE = 0.01; // 1% exit load (can be made configurable per scheme)
const TDS_RATE = 0.10; // 10% TDS for equity funds (can be made configurable)

/**
 * Calculate redemption amount with exit load and TDS
 */
async function calculateRedemptionAmount(
  schemeId: number,
  units: number,
  nav: number,
  redemptionType: 'Standard' | 'Instant' | 'Full'
): Promise<RedemptionCalculation> {
  const grossAmount = units * nav;
  
  // Exit load calculation (typically applies to redemptions within 1 year)
  // For simplicity, we'll apply a 1% exit load for Standard redemptions
  // Instant redemptions may have different rules
  let exitLoad = 0;
  let exitLoadAmount = 0;
  
  if (redemptionType === 'Standard') {
    exitLoad = EXIT_LOAD_RATE; // 1%
    exitLoadAmount = grossAmount * exitLoad;
  }
  
  const netAmount = grossAmount - exitLoadAmount;
  
  // TDS calculation (for equity funds, typically 10% on gains)
  // For simplicity, we'll calculate TDS on the net amount
  // In production, this should consider the purchase price and calculate TDS only on gains
  let tds = 0;
  if (redemptionType === 'Instant' || redemptionType === 'Standard') {
    // Simplified TDS calculation - in production, should calculate based on actual gains
    tds = netAmount * TDS_RATE;
  }
  
  const finalAmount = netAmount - tds;
  
  // Settlement date calculation
  const settlementDate = new Date();
  if (redemptionType === 'Instant') {
    // Instant redemption settles same day
    settlementDate.setHours(settlementDate.getHours() + 1);
  } else {
    // Standard redemption settles in 3-5 business days
    settlementDate.setDate(settlementDate.getDate() + 4);
  }
  
  // Get scheme name
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, schemeId))
    .limit(1);
  
  return {
    schemeName: product?.schemeName || 'Unknown Scheme',
    units,
    nav,
    grossAmount,
    exitLoad: exitLoad > 0 ? exitLoad * 100 : undefined,
    exitLoadAmount: exitLoadAmount > 0 ? exitLoadAmount : undefined,
    netAmount,
    tds: tds > 0 ? tds : undefined,
    finalAmount,
    settlementDate: settlementDate.toISOString(),
  };
}

/**
 * Redemption Service Implementation
 */
export class RedemptionService implements IRedemptionService {
  /**
   * Calculate redemption amount
   */
  async calculateRedemption(params: {
    schemeId: number;
    units?: number;
    amount?: number;
    redemptionType?: string;
  }): Promise<APIResponse<RedemptionCalculation>> {
    try {
      const validated = calculateRedemptionRequestSchema.parse(params);
      
      // Get product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, validated.schemeId))
        .limit(1);
      
      if (!product) {
        return {
          success: false,
          message: 'Scheme not found',
        };
      }
      
      const nav = product.nav || 0;
      if (nav === 0) {
        return {
          success: false,
          message: 'NAV not available for this scheme',
        };
      }
      
      // Calculate units from amount or use provided units
      let units = validated.units;
      if (!units && validated.amount) {
        units = validated.amount / nav;
      }
      
      if (!units || units <= 0) {
        return {
          success: false,
          message: 'Invalid units or amount',
        };
      }
      
      const redemptionType = (validated.redemptionType || 'Standard') as 'Standard' | 'Instant' | 'Full';
      const calculation = await calculateRedemptionAmount(
        validated.schemeId,
        units,
        nav,
        redemptionType
      );
      
      return {
        success: true,
        message: 'Redemption calculated successfully',
        data: calculation,
      };
    } catch (error: any) {
      console.error('Calculate redemption error:', error);
      return {
        success: false,
        message: error.message || 'Failed to calculate redemption',
      };
    }
  }

  /**
   * Execute redemption
   */
  async executeRedemption(params: {
    schemeId: number;
    units?: number;
    amount?: number;
    redemptionType: string;
    isFullRedemption?: boolean;
  }): Promise<APIResponse<any>> {
    try {
      const validated = executeRedemptionRequestSchema.parse(params);
      
      // Get product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, validated.schemeId))
        .limit(1);
      
      if (!product) {
        return {
          success: false,
          message: 'Scheme not found',
        };
      }
      
      const nav = product.nav || 0;
      if (nav === 0) {
        return {
          success: false,
          message: 'NAV not available for this scheme',
        };
      }
      
      // Calculate units
      let units = validated.units;
      if (!units && validated.amount) {
        units = validated.amount / nav;
      }
      
      if (validated.isFullRedemption) {
        // For full redemption, units should be fetched from holdings
        // For now, we'll use the amount to calculate units
        // In production, this should fetch actual holdings
        if (!units && validated.amount) {
          units = validated.amount / nav;
        }
      }
      
      if (!units || units <= 0) {
        return {
          success: false,
          message: 'Invalid units or amount',
        };
      }
      
      // Calculate redemption
      const calculation = await calculateRedemptionAmount(
        validated.schemeId,
        units,
        nav,
        validated.redemptionType as 'Standard' | 'Instant' | 'Full'
      );
      
      // Create cart item for redemption
      const cartItem = {
        id: `redemption-${Date.now()}`,
        productId: validated.schemeId,
        schemeName: product.schemeName,
        transactionType: 'Redemption',
        amount: calculation.finalAmount,
        nav: nav,
        units: units,
      };
      
      return {
        success: true,
        message: 'Redemption added to cart',
        data: {
          cartItem,
        },
      };
    } catch (error: any) {
      console.error('Execute redemption error:', error);
      return {
        success: false,
        message: error.message || 'Failed to execute redemption',
      };
    }
  }

  /**
   * Execute instant redemption
   */
  async executeInstantRedemption(params: {
    schemeId: number;
    amount: number;
  }): Promise<APIResponse<any>> {
    try {
      // Validate amount
      if (params.amount > INSTANT_REDEMPTION_LIMIT) {
        return {
          success: false,
          message: `Instant redemption limit is ₹${INSTANT_REDEMPTION_LIMIT.toLocaleString('en-IN')}`,
        };
      }
      
      if (params.amount <= 0) {
        return {
          success: false,
          message: 'Invalid redemption amount',
        };
      }
      
      // Check eligibility first
      const eligibility = await this.checkInstantRedemptionEligibility(params);
      if (!eligibility.success || !eligibility.data?.eligible) {
        return {
          success: false,
          message: eligibility.data?.reason || 'Not eligible for instant redemption',
        };
      }
      
      // Execute redemption
      return await this.executeRedemption({
        schemeId: params.schemeId,
        amount: params.amount,
        redemptionType: 'Instant',
      });
    } catch (error: any) {
      console.error('Execute instant redemption error:', error);
      return {
        success: false,
        message: error.message || 'Failed to execute instant redemption',
      };
    }
  }

  /**
   * Check instant redemption eligibility
   */
  async checkInstantRedemptionEligibility(params: {
    schemeId: number;
    amount: number;
  }): Promise<APIResponse<InstantRedemptionEligibility>> {
    try {
      const validated = checkInstantRedemptionEligibilitySchema.parse(params);
      
      // Check amount limit
      if (validated.amount > INSTANT_REDEMPTION_LIMIT) {
        return {
          success: true,
          message: 'Eligibility checked',
          data: {
            eligible: false,
            maxAmount: INSTANT_REDEMPTION_LIMIT,
            availableAmount: INSTANT_REDEMPTION_LIMIT,
            reason: `Amount exceeds instant redemption limit of ₹${INSTANT_REDEMPTION_LIMIT.toLocaleString('en-IN')}`,
          },
        };
      }
      
      // Check minimum amount
      if (validated.amount < 1000) {
        return {
          success: true,
          message: 'Eligibility checked',
          data: {
            eligible: false,
            maxAmount: INSTANT_REDEMPTION_LIMIT,
            availableAmount: INSTANT_REDEMPTION_LIMIT,
            reason: 'Minimum redemption amount is ₹1,000',
          },
        };
      }
      
      // Get product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, validated.schemeId))
        .limit(1);
      
      if (!product) {
        return {
          success: false,
          message: 'Scheme not found',
        };
      }
      
      // In production, check actual holdings here
      // For now, we'll assume eligibility if amount is within limit
      
      return {
        success: true,
        message: 'Eligibility checked',
        data: {
          eligible: true,
          maxAmount: INSTANT_REDEMPTION_LIMIT,
          availableAmount: INSTANT_REDEMPTION_LIMIT,
        },
      };
    } catch (error: any) {
      console.error('Check instant redemption eligibility error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check eligibility',
      };
    }
  }

  /**
   * Get redemption history
   */
  async getRedemptionHistory(clientId: number, filters?: any): Promise<APIResponse<RedemptionHistory[]>> {
    try {
      // In production, this should query the orders/transactions table
      // For now, return mock data
      const mockHistory: RedemptionHistory[] = [
        {
          id: '1',
          orderId: 1001,
          schemeName: 'HDFC Equity Fund',
          units: 100.5,
          amount: 25000,
          redemptionType: 'Instant',
          status: 'Settled',
          redemptionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          settlementDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          orderId: 1002,
          schemeName: 'ICICI Prudential Balanced Fund',
          units: 200.25,
          amount: 50000,
          redemptionType: 'Standard',
          status: 'Executed',
          redemptionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      // Apply filters
      let filteredHistory = mockHistory;
      
      if (filters?.status) {
        filteredHistory = filteredHistory.filter((h) => h.status === filters.status);
      }
      
      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        filteredHistory = filteredHistory.filter(
          (h) => new Date(h.redemptionDate) >= startDate
        );
      }
      
      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        filteredHistory = filteredHistory.filter(
          (h) => new Date(h.redemptionDate) <= endDate
        );
      }
      
      return {
        success: true,
        message: 'Redemption history fetched successfully',
        data: filteredHistory,
      };
    } catch (error: any) {
      console.error('Get redemption history error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch redemption history',
      };
    }
  }
}

// Export singleton instance
export const redemptionService = new RedemptionService();

