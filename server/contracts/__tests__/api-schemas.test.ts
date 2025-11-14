/**
 * Foundation Layer - F2: API Contracts & Schemas Tests
 * Comprehensive test suite for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  paginationSchema,
  transactionTypeSchema,
  orderTypeSchema,
  transactionModeSchema,
  orderStatusSchema,
  cartItemSchema,
  nomineeSchema,
  transactionModeDataSchema,
  submitOrderRequestSchema,
  quickOrderRequestSchema,
  createSIPRequestSchema,
  calculateSwitchRequestSchema,
  executeSwitchRequestSchema,
  calculateRedemptionRequestSchema,
  executeRedemptionRequestSchema,
} from '../api-schemas';

describe('Foundation Layer - F2: API Contracts & Schemas', () => {
  describe('paginationSchema', () => {
    it('should validate valid pagination', () => {
      const result = paginationSchema.parse({ page: 1, pageSize: 20 });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should use default values', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.sortOrder).toBe('asc');
    });

    it('should reject invalid page', () => {
      expect(() => {
        paginationSchema.parse({ page: 0 });
      }).toThrow();
    });

    it('should reject pageSize over 100', () => {
      expect(() => {
        paginationSchema.parse({ pageSize: 101 });
      }).toThrow();
    });
  });

  describe('transactionTypeSchema', () => {
    it('should validate valid transaction types', () => {
      expect(transactionTypeSchema.parse('Purchase')).toBe('Purchase');
      expect(transactionTypeSchema.parse('Redemption')).toBe('Redemption');
      expect(transactionTypeSchema.parse('Switch')).toBe('Switch');
      expect(transactionTypeSchema.parse('Full Redemption')).toBe('Full Redemption');
      expect(transactionTypeSchema.parse('Full Switch')).toBe('Full Switch');
    });

    it('should reject invalid transaction type', () => {
      expect(() => {
        transactionTypeSchema.parse('Invalid');
      }).toThrow();
    });
  });

  describe('orderTypeSchema', () => {
    it('should validate valid order types', () => {
      expect(orderTypeSchema.parse('Initial Purchase')).toBe('Initial Purchase');
      expect(orderTypeSchema.parse('Additional Purchase')).toBe('Additional Purchase');
    });

    it('should reject invalid order type', () => {
      expect(() => {
        orderTypeSchema.parse('Invalid');
      }).toThrow();
    });
  });

  describe('cartItemSchema', () => {
    it('should validate valid cart item', () => {
      const item = {
        id: 'item-1',
        productId: 1,
        schemeName: 'Test Scheme',
        transactionType: 'Purchase',
        amount: 10000,
      };
      const result = cartItemSchema.parse(item);
      expect(result.id).toBe('item-1');
      expect(result.productId).toBe(1);
    });

    it('should validate cart item with optional fields', () => {
      const item = {
        id: 'item-1',
        productId: 1,
        schemeName: 'Test Scheme',
        transactionType: 'Purchase',
        amount: 10000,
        units: 200,
        nav: 50,
        orderType: 'Initial Purchase',
      };
      const result = cartItemSchema.parse(item);
      expect(result.units).toBe(200);
      expect(result.nav).toBe(50);
    });

    it('should reject cart item with negative amount', () => {
      const item = {
        id: 'item-1',
        productId: 1,
        schemeName: 'Test Scheme',
        transactionType: 'Purchase',
        amount: -1000,
      };
      expect(() => {
        cartItemSchema.parse(item);
      }).toThrow();
    });

    it('should reject cart item with missing required fields', () => {
      expect(() => {
        cartItemSchema.parse({ id: 'item-1' });
      }).toThrow();
    });
  });

  describe('nomineeSchema', () => {
    it('should validate valid nominee', () => {
      const nominee = {
        id: 'nom-1',
        name: 'John Doe',
        relationship: 'Son',
        dateOfBirth: '2000-01-15',
        pan: 'ABCDE1234F',
        percentage: 100,
      };
      const result = nomineeSchema.parse(nominee);
      expect(result.name).toBe('John Doe');
      expect(result.percentage).toBe(100);
    });

    it('should validate nominee with guardian', () => {
      const nominee = {
        id: 'nom-1',
        name: 'Minor Child',
        relationship: 'Son',
        dateOfBirth: '2015-01-15',
        pan: 'ABCDE1234F',
        percentage: 100,
        isMinor: true,
        guardianName: 'Parent Name',
        guardianPan: 'FGHIJ5678K',
        guardianRelationship: 'Father',
      };
      const result = nomineeSchema.parse(nominee);
      expect(result.isMinor).toBe(true);
      expect(result.guardianName).toBe('Parent Name');
    });

    it('should reject invalid PAN format', () => {
      const nominee = {
        id: 'nom-1',
        name: 'John Doe',
        relationship: 'Son',
        dateOfBirth: '2000-01-15',
        pan: 'INVALID',
        percentage: 100,
      };
      expect(() => {
        nomineeSchema.parse(nominee);
      }).toThrow();
    });

    it('should reject percentage over 100', () => {
      const nominee = {
        id: 'nom-1',
        name: 'John Doe',
        relationship: 'Son',
        dateOfBirth: '2000-01-15',
        pan: 'ABCDE1234F',
        percentage: 150,
      };
      expect(() => {
        nomineeSchema.parse(nominee);
      }).toThrow();
    });
  });

  describe('transactionModeDataSchema', () => {
    it('should validate Physical mode', () => {
      const mode = {
        mode: 'Physical',
        physicalAddress: '123 Main St',
      };
      const result = transactionModeDataSchema.parse(mode);
      expect(result.mode).toBe('Physical');
    });

    it('should validate Email mode', () => {
      const mode = {
        mode: 'Email',
        email: 'test@example.com',
      };
      const result = transactionModeDataSchema.parse(mode);
      expect(result.mode).toBe('Email');
      expect(result.email).toBe('test@example.com');
    });

    it('should validate Telephone mode', () => {
      const mode = {
        mode: 'Telephone',
        phoneNumber: '+919876543210',
      };
      const result = transactionModeDataSchema.parse(mode);
      expect(result.mode).toBe('Telephone');
    });

    it('should reject invalid email format', () => {
      const mode = {
        mode: 'Email',
        email: 'invalid-email',
      };
      expect(() => {
        transactionModeDataSchema.parse(mode);
      }).toThrow();
    });
  });

  describe('submitOrderRequestSchema', () => {
    it('should validate valid order request', () => {
      const request = {
        cartItems: [{
          id: 'item-1',
          productId: 1,
          schemeName: 'Test Scheme',
          transactionType: 'Purchase',
          amount: 10000,
        }],
        transactionMode: {
          mode: 'Physical',
        },
        optOutOfNomination: false,
        nominees: [{
          id: 'nom-1',
          name: 'John Doe',
          relationship: 'Son',
          dateOfBirth: '2000-01-15',
          pan: 'ABCDE1234F',
          percentage: 100,
        }],
      };
      const result = submitOrderRequestSchema.parse(request);
      expect(result.cartItems).toHaveLength(1);
      expect(result.optOutOfNomination).toBe(false);
    });

    it('should validate order request with opt-out', () => {
      const request = {
        cartItems: [{
          id: 'item-1',
          productId: 1,
          schemeName: 'Test Scheme',
          transactionType: 'Purchase',
          amount: 10000,
        }],
        transactionMode: {
          mode: 'Email',
          email: 'test@example.com',
        },
        optOutOfNomination: true,
      };
      const result = submitOrderRequestSchema.parse(request);
      expect(result.optOutOfNomination).toBe(true);
    });

    it('should reject empty cart items', () => {
      const request = {
        cartItems: [],
        transactionMode: {
          mode: 'Physical',
        },
        optOutOfNomination: false,
      };
      expect(() => {
        submitOrderRequestSchema.parse(request);
      }).toThrow();
    });
  });

  describe('quickOrderRequestSchema', () => {
    it('should validate valid quick order request', () => {
      const request = {
        productId: 1,
        amount: 10000,
        transactionType: 'Purchase',
      };
      const result = quickOrderRequestSchema.parse(request);
      expect(result.productId).toBe(1);
      expect(result.amount).toBe(10000);
    });

    it('should reject negative amount', () => {
      const request = {
        productId: 1,
        amount: -1000,
        transactionType: 'Purchase',
      };
      expect(() => {
        quickOrderRequestSchema.parse(request);
      }).toThrow();
    });
  });

  describe('createSIPRequestSchema', () => {
    it('should validate valid SIP request', () => {
      const request = {
        clientId: 1,
        schemeId: 1,
        amount: 10000,
        frequency: 'Monthly',
        startDate: '2024-02-01T00:00:00Z',
        installments: 12,
      };
      const result = createSIPRequestSchema.parse(request);
      expect(result.clientId).toBe(1);
      expect(result.amount).toBe(10000);
    });

    it('should reject amount below minimum', () => {
      const request = {
        clientId: 1,
        schemeId: 1,
        amount: 500,
        frequency: 'Monthly',
        startDate: '2024-02-01T00:00:00Z',
        installments: 12,
      };
      expect(() => {
        createSIPRequestSchema.parse(request);
      }).toThrow();
    });
  });

  describe('calculateSwitchRequestSchema', () => {
    it('should validate switch request with amount', () => {
      const request = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 10000,
      };
      const result = calculateSwitchRequestSchema.parse(request);
      expect(result.amount).toBe(10000);
    });

    it('should validate switch request with units', () => {
      const request = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        units: 200,
      };
      const result = calculateSwitchRequestSchema.parse(request);
      expect(result.units).toBe(200);
    });

    it('should reject switch request without amount or units', () => {
      const request = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
      };
      expect(() => {
        calculateSwitchRequestSchema.parse(request);
      }).toThrow();
    });
  });

  describe('executeSwitchRequestSchema', () => {
    it('should validate execute switch request', () => {
      const request = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        amount: 10000,
        isFullSwitch: false,
      };
      const result = executeSwitchRequestSchema.parse(request);
      expect(result.isFullSwitch).toBe(false);
    });

    it('should validate full switch request', () => {
      const request = {
        sourceSchemeId: 1,
        targetSchemeId: 2,
        isFullSwitch: true,
      };
      const result = executeSwitchRequestSchema.parse(request);
      expect(result.isFullSwitch).toBe(true);
    });
  });

  describe('calculateRedemptionRequestSchema', () => {
    it('should validate redemption request with units', () => {
      const request = {
        schemeId: 1,
        units: 200,
        redemptionType: 'Standard',
      };
      const result = calculateRedemptionRequestSchema.parse(request);
      expect(result.units).toBe(200);
    });

    it('should validate redemption request with amount', () => {
      const request = {
        schemeId: 1,
        amount: 10000,
      };
      const result = calculateRedemptionRequestSchema.parse(request);
      expect(result.amount).toBe(10000);
    });
  });

  describe('executeRedemptionRequestSchema', () => {
    it('should validate execute redemption request', () => {
      const request = {
        schemeId: 1,
        units: 200,
        redemptionType: 'Standard',
        isFullRedemption: false,
      };
      const result = executeRedemptionRequestSchema.parse(request);
      expect(result.redemptionType).toBe('Standard');
    });

    it('should validate full redemption request', () => {
      const request = {
        schemeId: 1,
        redemptionType: 'Full',
        isFullRedemption: true,
      };
      const result = executeRedemptionRequestSchema.parse(request);
      expect(result.isFullRedemption).toBe(true);
    });
  });
});

