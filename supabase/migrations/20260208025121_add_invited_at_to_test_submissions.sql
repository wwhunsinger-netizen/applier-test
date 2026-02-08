-- Track when a candidate was invited to onboarding
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NULL;
