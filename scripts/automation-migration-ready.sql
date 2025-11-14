-- Module 11: Automation Features - Database Migration Script
-- Date: January 2025
-- Purpose: Create all tables required for automation features

-- ============================================================================
-- Auto-Invest Rules Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS auto_invest_rules (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scheme_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  scheme_name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('Date', 'Goal Progress', 'Portfolio Drift', 'Market Condition')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  goal_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  next_execution_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled', 'Completed')),
  is_enabled BOOLEAN DEFAULT true,
  max_total_amount INTEGER CHECK (max_total_amount > 0),
  max_per_execution INTEGER CHECK (max_per_execution > 0),
  min_balance_required INTEGER CHECK (min_balance_required >= 0),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  execution_count INTEGER DEFAULT 0 CHECK (execution_count >= 0),
  last_execution_date TIMESTAMP,
  last_execution_status TEXT CHECK (last_execution_status IN ('Success', 'Failed')),
  last_execution_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indexes for auto_invest_rules
CREATE INDEX IF NOT EXISTS idx_auto_invest_rules_client_id ON auto_invest_rules(client_id);
CREATE INDEX IF NOT EXISTS idx_auto_invest_rules_status ON auto_invest_rules(status);
CREATE INDEX IF NOT EXISTS idx_auto_invest_rules_next_execution ON auto_invest_rules(next_execution_date);
CREATE INDEX IF NOT EXISTS idx_auto_invest_rules_goal_id ON auto_invest_rules(goal_id);

-- ============================================================================
-- Rebalancing Rules Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS rebalancing_rules (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  strategy TEXT NOT NULL CHECK (strategy IN ('Threshold-Based', 'Time-Based', 'Drift-Based', 'Hybrid')),
  target_allocation JSONB NOT NULL,
  threshold_percent DOUBLE PRECISION NOT NULL CHECK (threshold_percent > 0),
  rebalance_amount INTEGER CHECK (rebalance_amount > 0),
  frequency TEXT CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  trigger_on_drift BOOLEAN DEFAULT true,
  trigger_on_schedule BOOLEAN DEFAULT false,
  min_drift_percent DOUBLE PRECISION CHECK (min_drift_percent > 0),
  execute_automatically BOOLEAN DEFAULT false,
  require_confirmation BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Completed')),
  is_enabled BOOLEAN DEFAULT true,
  last_rebalanced_date DATE,
  next_rebalancing_date DATE,
  execution_count INTEGER DEFAULT 0 CHECK (execution_count >= 0),
  last_execution_status TEXT CHECK (last_execution_status IN ('Success', 'Failed', 'Skipped')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indexes for rebalancing_rules
CREATE INDEX IF NOT EXISTS idx_rebalancing_rules_client_id ON rebalancing_rules(client_id);
CREATE INDEX IF NOT EXISTS idx_rebalancing_rules_status ON rebalancing_rules(status);
CREATE INDEX IF NOT EXISTS idx_rebalancing_rules_next_rebalancing ON rebalancing_rules(next_rebalancing_date);

-- ============================================================================
-- Rebalancing Executions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS rebalancing_executions (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES rebalancing_rules(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  execution_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Executed', 'Failed', 'Cancelled')),
  current_allocation JSONB NOT NULL,
  target_allocation JSONB NOT NULL,
  drift_percent DOUBLE PRECISION NOT NULL,
  actions JSONB DEFAULT '[]'::jsonb,
  executed_at TIMESTAMP,
  executed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_ids JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for rebalancing_executions
CREATE INDEX IF NOT EXISTS idx_rebalancing_executions_rule_id ON rebalancing_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rebalancing_executions_client_id ON rebalancing_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_rebalancing_executions_status ON rebalancing_executions(status);
CREATE INDEX IF NOT EXISTS idx_rebalancing_executions_date ON rebalancing_executions(execution_date);

-- ============================================================================
-- Trigger Orders Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS trigger_orders (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('Price', 'NAV', 'Portfolio Value', 'Goal Progress', 'Date', 'Custom')),
  trigger_condition TEXT NOT NULL CHECK (trigger_condition IN ('Greater Than', 'Less Than', 'Equals', 'Crosses Above', 'Crosses Below')),
  trigger_value DOUBLE PRECISION NOT NULL,
  trigger_field TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('Purchase', 'Redemption', 'Switch')),
  scheme_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  scheme_name TEXT NOT NULL,
  amount INTEGER CHECK (amount > 0),
  units DOUBLE PRECISION CHECK (units > 0),
  target_scheme_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  target_scheme_name TEXT,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  goal_name TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Triggered', 'Executed', 'Cancelled', 'Expired')),
  is_enabled BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP,
  executed_at TIMESTAMP,
  executed_order_id TEXT,
  execution_status TEXT CHECK (execution_status IN ('Success', 'Failed')),
  execution_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for trigger_orders
CREATE INDEX IF NOT EXISTS idx_trigger_orders_client_id ON trigger_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_trigger_orders_status ON trigger_orders(status);
CREATE INDEX IF NOT EXISTS idx_trigger_orders_valid_dates ON trigger_orders(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_trigger_orders_goal_id ON trigger_orders(goal_id);

-- ============================================================================
-- Notification Preferences Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  quiet_hours JSONB,
  min_amount INTEGER CHECK (min_amount > 0),
  schemes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_client_id ON notification_preferences(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_event ON notification_preferences(event);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_enabled ON notification_preferences(enabled);

-- ============================================================================
-- Notification Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('Email', 'SMS', 'Push', 'In-App')),
  status TEXT NOT NULL CHECK (status IN ('Sent', 'Failed', 'Pending')),
  sent_at TIMESTAMP,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_client_id ON notification_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event ON notification_logs(event);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- ============================================================================
-- In-App Notifications Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for in_app_notifications
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_client_id ON in_app_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON in_app_notifications(read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at);

-- ============================================================================
-- Automation Execution Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_execution_logs (
  id TEXT PRIMARY KEY,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('AutoInvest', 'Rebalancing', 'TriggerOrder')),
  automation_id TEXT NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  execution_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Success', 'Failed', 'Skipped')),
  order_id TEXT,
  error TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for automation_execution_logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_client_id ON automation_execution_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_type ON automation_execution_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON automation_execution_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_execution_date ON automation_execution_logs(execution_date);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_execution_logs(status);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================
COMMENT ON TABLE auto_invest_rules IS 'Stores auto-invest rules for automated investment execution';
COMMENT ON TABLE rebalancing_rules IS 'Stores portfolio rebalancing rules';
COMMENT ON TABLE rebalancing_executions IS 'Stores execution history for rebalancing operations';
COMMENT ON TABLE trigger_orders IS 'Stores trigger-based orders that execute when conditions are met';
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences';
COMMENT ON TABLE notification_logs IS 'Logs all notification delivery attempts';
COMMENT ON TABLE in_app_notifications IS 'Stores in-app notifications for clients';
COMMENT ON TABLE automation_execution_logs IS 'Logs all automation rule executions';

