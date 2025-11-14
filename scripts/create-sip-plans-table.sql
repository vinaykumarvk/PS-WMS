-- Create SIP Plans table
-- Run this script to create the sip_plans table in your database

CREATE TABLE IF NOT EXISTS sip_plans (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  scheme_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  scheme_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly')),
  start_date DATE NOT NULL,
  end_date DATE,
  installments INTEGER NOT NULL,
  completed_installments INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled', 'Completed', 'Failed')),
  next_installment_date DATE,
  total_invested INTEGER DEFAULT 0,
  current_value INTEGER DEFAULT 0,
  gain_loss INTEGER DEFAULT 0,
  gain_loss_percent DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  paused_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  last_execution_date TIMESTAMP,
  last_execution_status TEXT CHECK (last_execution_status IN ('Success', 'Failed')),
  failure_count INTEGER DEFAULT 0,
  day_of_month INTEGER,
  day_of_week INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sip_plans_client_id ON sip_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_sip_plans_status ON sip_plans(status);
CREATE INDEX IF NOT EXISTS idx_sip_plans_scheme_id ON sip_plans(scheme_id);
CREATE INDEX IF NOT EXISTS idx_sip_plans_next_installment_date ON sip_plans(next_installment_date);

-- Add comments for documentation
COMMENT ON TABLE sip_plans IS 'Stores Systematic Investment Plan (SIP) details for clients';
COMMENT ON COLUMN sip_plans.id IS 'Unique SIP plan identifier (format: SIP-YYYYMMDD-XXXXX)';
COMMENT ON COLUMN sip_plans.frequency IS 'Investment frequency: Daily, Weekly, Monthly, or Quarterly';
COMMENT ON COLUMN sip_plans.status IS 'Current status of the SIP plan';
COMMENT ON COLUMN sip_plans.day_of_month IS 'Specific day of month for monthly SIPs (1-31)';
COMMENT ON COLUMN sip_plans.day_of_week IS 'Specific day of week for weekly SIPs (0-6, Sunday=0)';

