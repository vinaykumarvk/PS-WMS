-- Create Goals table
-- Run this script to create the goals table in your database

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Retirement', 'Child Education', 'House Purchase', 'Vacation', 'Emergency Fund', 'Other')),
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  target_date DATE NOT NULL,
  current_amount INTEGER DEFAULT 0 CHECK (current_amount >= 0),
  monthly_contribution INTEGER,
  schemes JSONB DEFAULT '[]'::jsonb,
  progress DOUBLE PRECISION DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused', 'Cancelled')),
  description TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create table for goal allocations (linking transactions to goals)
CREATE TABLE IF NOT EXISTS goal_allocations (
  id SERIAL PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  allocated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_client_id ON goals(client_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_goal_id ON goal_allocations(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_transaction_id ON goal_allocations(transaction_id);

-- Add comments for documentation
COMMENT ON TABLE goals IS 'Stores financial goals for clients';
COMMENT ON COLUMN goals.id IS 'Unique goal identifier (format: GOAL-YYYYMMDD-XXXXX)';
COMMENT ON COLUMN goals.schemes IS 'JSON array of scheme allocations: [{"schemeId": 1, "allocation": 50}, ...]';
COMMENT ON COLUMN goals.progress IS 'Progress percentage (0-100)';
COMMENT ON TABLE goal_allocations IS 'Links orders to specific goals for tracking';

