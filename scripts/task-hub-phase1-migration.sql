-- Phase 1: Task & Alert Hub - Database Schema Migration
-- Adds fields to support unified task and alert hub

-- Add urgency field to tasks (optional, computed field)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS urgency TEXT;

-- Add category field to tasks (defaults to 'task')
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'task';

-- Add scheduled_for field to portfolio_alerts (optional, for scheduling alerts)
ALTER TABLE portfolio_alerts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP;

-- Add follow_up_date field to appointments (optional, for follow-up tracking)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_urgency ON tasks(urgency, due_date) WHERE urgency IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_alerts_scheduled ON portfolio_alerts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_followup ON appointments(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Update existing tasks to have default category
UPDATE tasks SET category = 'task' WHERE category IS NULL;

-- Comments for documentation
COMMENT ON COLUMN tasks.urgency IS 'Computed urgency level: now, next, scheduled';
COMMENT ON COLUMN tasks.category IS 'Item category: task, alert, follow_up, appointment';
COMMENT ON COLUMN portfolio_alerts.scheduled_for IS 'Scheduled date/time for alert follow-up';
COMMENT ON COLUMN appointments.follow_up_date IS 'Follow-up date for appointment';

