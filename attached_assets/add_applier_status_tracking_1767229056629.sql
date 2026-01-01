-- Migration: Add real-time status tracking to appliers table
-- Date: 2025-12-31

-- Add status column for real-time activity tracking
-- Separate from is_active which is for account enable/disable
ALTER TABLE appliers
ADD COLUMN status TEXT NOT NULL DEFAULT 'offline';

-- Add last_activity_at to track when applier was last active
-- This helps determine idle vs offline states
ALTER TABLE appliers
ADD COLUMN last_activity_at TIMESTAMPTZ NULL;

-- Create index for querying by status
CREATE INDEX idx_appliers_status ON appliers(status);

-- Add comment to clarify the difference between status and is_active
COMMENT ON COLUMN appliers.status IS 'Real-time activity state: active (activity <2min), idle (2+ min no activity), offline (logged out), inactive (admin disabled)';
COMMENT ON COLUMN appliers.is_active IS 'Account enabled/disabled flag - controlled by admin';

-- Status values:
-- 'active'   -> Logged in and active in last 2 minutes
-- 'idle'     -> Logged in but no activity for 2+ minutes  
-- 'offline'  -> Logged out or closed browser
-- 'inactive' -> Account disabled by admin (overrides other states)
