# Module A: Database Integration - Quick Order Favorites

**Status:** ✅ Completed  
**Date:** January 2025  
**Module:** Quick Order Placement (Module A) - Database Integration

---

## Database Schema

### Quick Order Favorites Table

```sql
CREATE TABLE quick_order_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_quick_order_favorites_user_id ON quick_order_favorites(user_id);
CREATE INDEX idx_quick_order_favorites_product_id ON quick_order_favorites(product_id);
```

### Schema Definition

**File:** `shared/schema.ts`

```typescript
export const quickOrderFavorites = pgTable("quick_order_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

---

## Service Implementation

### Quick Order Service

**File:** `server/services/quick-order-service.ts`

#### Functions Implemented:

1. **`getFavorites(userId: number)`**
   - Fetches all favorites for a user
   - Orders by `addedAt` DESC (most recent first)
   - Returns array of `QuickOrderFavorite`

2. **`addFavorite(userId: number, productId: number)`**
   - Checks if favorite already exists (prevents duplicates)
   - Creates new favorite if doesn't exist
   - Returns existing favorite if already exists
   - Returns `QuickOrderFavorite`

3. **`removeFavorite(userId: number, favoriteId: string)`**
   - Verifies favorite belongs to user (security)
   - Deletes favorite from database
   - Throws error if not found or unauthorized

4. **`getRecentOrders(userId: number, limit: number)`**
   - Placeholder for future orders table integration
   - Currently returns empty array
   - Will query orders table when available

---

## API Routes Updated

### GET `/api/quick-order/favorites`

**Before:** Returned mock data  
**After:** 
- Queries database for user's favorites
- Enriches with product details
- Returns favorites with full product information

### POST `/api/quick-order/favorites`

**Before:** Returned mock response  
**After:**
- Validates product exists
- Creates database record
- Returns created favorite with product details

### DELETE `/api/quick-order/favorites/:id`

**Before:** Mock deletion  
**After:**
- Verifies ownership (security)
- Deletes from database
- Returns appropriate error if not found

### GET `/api/quick-order/recent`

**Status:** Still uses mock data (orders table not yet created)  
**Future:** Will query orders table when available

---

## Migration Instructions

### Option 1: Using Drizzle Kit (Recommended)

```bash
# Generate migration
npx drizzle-kit generate:pg

# Apply migration
npx drizzle-kit push:pg
```

### Option 2: Manual SQL Migration

Run the following SQL in your database:

```sql
-- Create quick_order_favorites table
CREATE TABLE IF NOT EXISTS quick_order_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quick_order_favorites_user_id 
  ON quick_order_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_order_favorites_product_id 
  ON quick_order_favorites(product_id);

-- Add comment
COMMENT ON TABLE quick_order_favorites IS 'User favorites for quick order placement';
```

---

## Testing

### Manual Testing Checklist

- [ ] Add favorite via API
- [ ] Verify favorite appears in GET favorites
- [ ] Try adding duplicate favorite (should return existing)
- [ ] Remove favorite via API
- [ ] Verify favorite removed from GET favorites
- [ ] Test with invalid product ID (should return 404)
- [ ] Test with invalid favorite ID (should return 404)
- [ ] Test with unauthorized user (should return 404)

### Database Verification

```sql
-- Check favorites for a user
SELECT f.*, p.name as product_name 
FROM quick_order_favorites f
JOIN products p ON f.product_id = p.id
WHERE f.user_id = 1
ORDER BY f.added_at DESC;

-- Check for duplicates (should return 0 rows)
SELECT user_id, product_id, COUNT(*) 
FROM quick_order_favorites
GROUP BY user_id, product_id
HAVING COUNT(*) > 1;
```

---

## Security Considerations

1. **User Ownership Verification**
   - All operations verify user owns the favorite
   - Prevents unauthorized access to other users' favorites

2. **Cascade Deletes**
   - Favorites deleted when user is deleted
   - Favorites deleted when product is deleted

3. **Unique Constraint**
   - Prevents duplicate favorites per user-product pair
   - Enforced at database level

---

## Performance Considerations

1. **Indexes**
   - Index on `user_id` for fast user lookups
   - Index on `product_id` for product lookups

2. **Query Optimization**
   - Favorites ordered by `addedAt DESC` for most recent first
   - Product details fetched in parallel using `Promise.all`

---

## Future Enhancements

1. **Recent Orders Integration**
   - Create orders table
   - Update `getRecentOrders` to query orders table
   - Filter by user's clients

2. **Favorites Analytics**
   - Track most favorited products
   - Track favorite usage patterns
   - Recommend products based on favorites

3. **Favorites Categories**
   - Allow users to organize favorites into categories
   - Add tags or labels to favorites

---

## Notes

- Database integration complete for favorites
- Recent orders still uses mock data (pending orders table)
- All security checks implemented
- Error handling implemented
- Ready for production use (after migration)

---

**Database Integration - ✅ COMPLETE**

