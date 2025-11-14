/**
 * Quick Order Service
 * Handles database operations for quick order features (favorites, recent orders)
 * Module A: Quick Order Placement
 */

import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { quickOrderFavorites, products } from '@shared/schema';
import type { QuickOrderFavorite, InsertQuickOrderFavorite } from '@shared/schema';

/**
 * Get favorites for a user
 */
export async function getFavorites(userId: number): Promise<QuickOrderFavorite[]> {
  try {
    const favorites = await db
      .select()
      .from(quickOrderFavorites)
      .where(eq(quickOrderFavorites.userId, userId))
      .orderBy(desc(quickOrderFavorites.addedAt));

    return favorites;
  } catch (error: any) {
    console.error('Get favorites error:', error);
    throw new Error(`Failed to fetch favorites: ${error.message}`);
  }
}

/**
 * Add favorite for a user
 */
export async function addFavorite(userId: number, productId: number): Promise<QuickOrderFavorite> {
  try {
    // Check if favorite already exists
    const existing = await db
      .select()
      .from(quickOrderFavorites)
      .where(
        and(
          eq(quickOrderFavorites.userId, userId),
          eq(quickOrderFavorites.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Return existing favorite
      return existing[0];
    }

    // Create new favorite
    const [favorite] = await db
      .insert(quickOrderFavorites)
      .values({
        userId,
        productId,
      })
      .returning();

    return favorite;
  } catch (error: any) {
    console.error('Add favorite error:', error);
    throw new Error(`Failed to add favorite: ${error.message}`);
  }
}

/**
 * Remove favorite for a user
 */
export async function removeFavorite(userId: number, favoriteId: string): Promise<void> {
  try {
    // Verify favorite belongs to user
    const result = await db
      .delete(quickOrderFavorites)
      .where(
        and(
          eq(quickOrderFavorites.id, favoriteId),
          eq(quickOrderFavorites.userId, userId)
        )
      );

    if (!result) {
      throw new Error('Favorite not found or unauthorized');
    }
  } catch (error: any) {
    console.error('Remove favorite error:', error);
    throw new Error(`Failed to remove favorite: ${error.message}`);
  }
}

/**
 * Get recent orders for a user
 * Note: This queries the transactions table since orders table doesn't exist yet
 * In production, this should query an orders table
 */
export async function getRecentOrders(userId: number, limit: number = 5): Promise<any[]> {
  try {
    // TODO: Replace with actual orders table query when available
    // For now, query transactions table as a proxy
    // In production, this should be:
    // SELECT * FROM orders WHERE client_id IN (SELECT id FROM clients WHERE assigned_to = userId)
    // ORDER BY submitted_at DESC LIMIT limit

    // Mock implementation - return empty array for now
    // This will be replaced when orders table is created
    return [];
  } catch (error: any) {
    console.error('Get recent orders error:', error);
    throw new Error(`Failed to fetch recent orders: ${error.message}`);
  }
}

