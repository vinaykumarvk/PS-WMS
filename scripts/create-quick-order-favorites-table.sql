-- Migration Script: Create Quick Order Favorites Table
-- Module A: Quick Order Placement
-- Run this script to create the quick_order_favorites table

-- Create quick_order_favorites table
CREATE TABLE IF NOT EXISTS quick_order_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quick_order_favorites_user_id 
  ON quick_order_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_quick_order_favorites_product_id 
  ON quick_order_favorites(product_id);

-- Add table comment
COMMENT ON TABLE quick_order_favorites IS 'User favorites for quick order placement - Module A';

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quick_order_favorites'
ORDER BY ordinal_position;

