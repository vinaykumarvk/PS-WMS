/**
 * Portfolio Analysis Service Tests
 * Module B: Portfolio-Aware Ordering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPortfolio,
  getImpactPreview,
  getAllocationGaps,
  getRebalancingSuggestions,
  getHoldings,
} from '../portfolio-analysis-service';
import { db } from '../../db';
import { supabaseServer } from '../../lib/supabase';
import { clients, transactions } from '@shared/schema';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('../../lib/supabase', () => ({
  supabaseServer: {
    from: vi.fn(),
  },
}));

describe('Portfolio Analysis Service', () => {
  const mockClientId = 1;
  const mockClient = {
    id: mockClientId,
    currentValue: 1000000,
    current_value: 1000000,
    riskProfile: 'moderate',
    risk_profile: 'moderate',
  };

  const mockTransactions = [
    {
      id: 1,
      clientId: mockClientId,
      client_id: mockClientId,
      transactionType: 'buy',
      transaction_type: 'buy',
      productType: 'mutual_fund',
      product_type: 'mutual_fund',
      productCategory: 'equity_large_cap',
      product_category: 'equity_large_cap',
      productId: 101,
      product_id: 101,
      productName: 'Equity Large Cap Fund',
      product_name: 'Equity Large Cap Fund',
      amount: 500000,
      totalAmount: 500000,
      total_amount: 500000,
      price: 50,
      nav: 50,
      quantity: 10000,
      transactionDate: new Date('2024-01-01'),
      transaction_date: new Date('2024-01-01'),
    },
    {
      id: 2,
      clientId: mockClientId,
      client_id: mockClientId,
      transactionType: 'buy',
      transaction_type: 'buy',
      productType: 'mutual_fund',
      product_type: 'mutual_fund',
      productCategory: 'debt_corporate_bond',
      product_category: 'debt_corporate_bond',
      productId: 102,
      product_id: 102,
      productName: 'Debt Corporate Bond Fund',
      product_name: 'Debt Corporate Bond Fund',
      amount: 300000,
      totalAmount: 300000,
      total_amount: 300000,
      price: 30,
      nav: 30,
      quantity: 10000,
      transactionDate: new Date('2024-01-02'),
      transaction_date: new Date('2024-01-02'),
    },
    {
      id: 3,
      clientId: mockClientId,
      client_id: mockClientId,
      transactionType: 'buy',
      transaction_type: 'buy',
      productType: 'mutual_fund',
      product_type: 'mutual_fund',
      productCategory: 'hybrid_balanced',
      product_category: 'hybrid_balanced',
      productId: 103,
      product_id: 103,
      productName: 'Hybrid Balanced Fund',
      product_name: 'Hybrid Balanced Fund',
      amount: 200000,
      totalAmount: 200000,
      total_amount: 200000,
      price: 20,
      nav: 20,
      quantity: 10000,
      transactionDate: new Date('2024-01-03'),
      transaction_date: new Date('2024-01-03'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio data with holdings', async () => {
      // Mock db.select for client
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      // Mock db.select for transactions
      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getPortfolio(mockClientId, true);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.totalValue).toBe(1000000);
      expect(result.data?.totalInvested).toBe(1000000);
      expect(result.data?.allocation).toBeDefined();
      expect(result.data?.holdings).toBeDefined();
      expect(result.data?.holdings.length).toBeGreaterThan(0);
    });

    it('should fetch portfolio data without holdings', async () => {
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getPortfolio(mockClientId, false);

      expect(result.success).toBe(true);
      expect(result.data?.holdings).toEqual([]);
    });

    it('should handle client not found', async () => {
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };

      (db.select as any).mockReturnValue(mockClientSelect);

      const result = await getPortfolio(mockClientId, false);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Client not found');
    });

    it('should handle sell/redemption transactions', async () => {
      const transactionsWithSell = [
        ...mockTransactions,
        {
          id: 4,
          clientId: mockClientId,
          client_id: mockClientId,
          transactionType: 'sell',
          transaction_type: 'sell',
          productType: 'mutual_fund',
          product_type: 'mutual_fund',
          productCategory: 'equity_large_cap',
          product_category: 'equity_large_cap',
          productId: 101,
          product_id: 101,
          productName: 'Equity Large Cap Fund',
          product_name: 'Equity Large Cap Fund',
          amount: 100000,
          totalAmount: 100000,
          total_amount: 100000,
          price: 50,
          nav: 50,
          quantity: 2000,
          transactionDate: new Date('2024-01-04'),
          transaction_date: new Date('2024-01-04'),
        },
      ];

      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(transactionsWithSell),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getPortfolio(mockClientId, false);

      expect(result.success).toBe(true);
      expect(result.data?.totalInvested).toBe(900000); // 1000000 - 100000
    });

    it('should handle database errors', async () => {
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      };

      (db.select as any).mockReturnValue(mockClientSelect);

      const result = await getPortfolio(mockClientId, false);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch portfolio');
    });
  });

  describe('getImpactPreview', () => {
    it('should calculate impact preview for purchase order', async () => {
      const mockOrder: any[] = [
        {
          id: '1',
          productId: 101,
          schemeName: 'Equity Large Cap Fund',
          transactionType: 'Purchase',
          amount: 100000,
          category: 'equity_large_cap',
          product: { category: 'equity_large_cap' },
        },
      ];

      // Mock getPortfolio calls - need to mock both client and transaction calls
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getImpactPreview(mockClientId, mockOrder);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.beforeAllocation).toBeDefined();
      expect(result.data?.afterAllocation).toBeDefined();
      expect(result.data?.changes).toBeDefined();
      expect(result.data?.totalValueChange).toBe(100000);
    });

    it('should calculate impact preview for redemption order', async () => {
      const mockOrder: any[] = [
        {
          id: '1',
          productId: 101,
          schemeName: 'Equity Large Cap Fund',
          transactionType: 'Redemption',
          amount: 50000,
          category: 'equity_large_cap',
          product: { category: 'equity_large_cap' },
        },
      ];

      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getImpactPreview(mockClientId, mockOrder);

      expect(result.success).toBe(true);
      expect(result.data?.totalValueChange).toBe(-50000);
    });

    it('should handle empty order array', async () => {
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getImpactPreview(mockClientId, []);

      expect(result.success).toBe(true);
      expect(result.data?.totalValueChange).toBe(0);
    });
  });

  describe('getAllocationGaps', () => {
    it('should calculate allocation gaps with default target', async () => {
      // getAllocationGaps without target calls getPortfolio (2 mocks) + fetches client for risk profile (1 mock)
      const mockClientSelect1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect1 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      const mockClientSelect2 = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect1)
        .mockReturnValueOnce(mockTransactionSelect1)
        .mockReturnValueOnce(mockClientSelect2);

      const result = await getAllocationGaps(mockClientId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(4); // equity, debt, hybrid, others
    });

    it('should calculate allocation gaps with custom target', async () => {
      const customTarget = {
        equity: 60,
        debt: 30,
        hybrid: 10,
        others: 0,
      };

      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      // getAllocationGaps calls getPortfolio once (needs client + transactions)
      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getAllocationGaps(mockClientId, customTarget);

      if (!result.success) {
        console.log('getAllocationGaps error:', result.message, result.errors);
      }
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      result.data?.forEach((gap) => {
        expect(gap.category).toBeDefined();
        expect(gap.current).toBeDefined();
        expect(gap.target).toBeDefined();
        expect(gap.gap).toBeDefined();
        expect(gap.recommendation).toBeDefined();
        expect(gap.priority).toBeDefined();
      });
    });
  });

  describe('getRebalancingSuggestions', () => {
    it('should generate rebalancing suggestions', async () => {
      // getRebalancingSuggestions calls getAllocationGaps (without target):
      //   - getAllocationGaps calls getPortfolio: 2 mocks (client + transactions)
      //   - getAllocationGaps fetches client for risk: 1 mock (client)
      // Then getRebalancingSuggestions calls getPortfolio with holdings: 2 mocks (client + transactions)
      // Total: 5 mocks
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getRebalancingSuggestions(mockClientId);

      if (!result.success) {
        console.log('getRebalancingSuggestions error:', result.message, result.errors);
      }
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should generate suggestions with custom target allocation', async () => {
      const customTarget = {
        equity: 70,
        debt: 20,
        hybrid: 10,
        others: 0,
      };

      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getRebalancingSuggestions(mockClientId, customTarget);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getHoldings', () => {
    it('should fetch all holdings for a client', async () => {
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getHoldings(mockClientId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter holdings by scheme ID', async () => {
      const mockClientSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockClient]),
        }),
      };

      const mockTransactionSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTransactions),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockClientSelect)
        .mockReturnValueOnce(mockTransactionSelect);

      const result = await getHoldings(mockClientId, 101);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data && result.data.length > 0) {
        expect(result.data.every((h) => h.productId === 101)).toBe(true);
      }
    });
  });
});

