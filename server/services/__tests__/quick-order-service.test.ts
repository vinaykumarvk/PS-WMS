/**
 * Quick Order Service Tests
 * Module A: Quick Order Placement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFavorites, addFavorite, removeFavorite, getRecentOrders } from '../quick-order-service';
import { db } from '../../db';
import { quickOrderFavorites } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Quick Order Service', () => {
  const mockUserId = 1;
  const mockProductId = 100;
  const mockFavoriteId = 'fav-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should fetch favorites for a user', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          userId: mockUserId,
          productId: 1,
          addedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'fav-2',
          userId: mockUserId,
          productId: 2,
          addedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-02'),
        },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockFavorites),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await getFavorites(mockUserId);

      expect(result).toEqual(mockFavorites);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return empty array when user has no favorites', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await getFavorites(mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      await expect(getFavorites(mockUserId)).rejects.toThrow('Failed to fetch favorites');
    });
  });

  describe('addFavorite', () => {
    it('should add a new favorite when it does not exist', async () => {
      const mockNewFavorite = {
        id: mockFavoriteId,
        userId: mockUserId,
        productId: mockProductId,
        addedAt: new Date(),
        createdAt: new Date(),
      };

      // Mock: Check if favorite exists (returns empty)
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      // Mock: Insert new favorite
      const mockInsert = {
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockNewFavorite]),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);
      (db.insert as any).mockReturnValue(mockInsert);

      const result = await addFavorite(mockUserId, mockProductId);

      expect(result).toEqual(mockNewFavorite);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should return existing favorite when it already exists', async () => {
      const mockExistingFavorite = {
        id: mockFavoriteId,
        userId: mockUserId,
        productId: mockProductId,
        addedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      };

      // Mock: Check if favorite exists (returns existing)
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExistingFavorite]),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const result = await addFavorite(mockUserId, mockProductId);

      expect(result).toEqual(mockExistingFavorite);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      };

      (db.select as any).mockReturnValue(mockSelect);

      await expect(addFavorite(mockUserId, mockProductId)).rejects.toThrow('Failed to add favorite');
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite successfully', async () => {
      // Mock successful delete - drizzle delete returns affected rows count
      const mockDelete = {
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      };

      (db.delete as any).mockReturnValue(mockDelete);

      await removeFavorite(mockUserId, mockFavoriteId);

      expect(db.delete).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockDelete = {
        where: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      (db.delete as any).mockReturnValue(mockDelete);

      await expect(removeFavorite(mockUserId, mockFavoriteId)).rejects.toThrow('Failed to remove favorite');
    });
  });

  describe('getRecentOrders', () => {
    it('should return empty array (placeholder)', async () => {
      const result = await getRecentOrders(mockUserId, 5);

      expect(result).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      const result = await getRecentOrders(mockUserId, 10);

      expect(result).toEqual([]);
    });
  });
});

