-- Test Submissions table for Applier Assessment V2
-- Stores all test results from the /test/ assessment flow
-- This table is separate from the main reviewer hub tables

CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  overall_score INTEGER NOT NULL DEFAULT 0,
  -- Typing test
  typing_wpm INTEGER NOT NULL DEFAULT 0,
  typing_accuracy INTEGER NOT NULL DEFAULT 0,
  typing_score INTEGER NOT NULL DEFAULT 0,
  -- Application reviews (spot the error)
  review_score INTEGER NOT NULL DEFAULT 0,
  review_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Application fill-out
  app_correct_count INTEGER NOT NULL DEFAULT 0,
  app_total_scored INTEGER NOT NULL DEFAULT 0,
  app_score INTEGER NOT NULL DEFAULT 0,
  -- Screening questions
  screening_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Timing
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on email for lookups (prevent duplicate submissions from same person)
CREATE INDEX IF NOT EXISTS idx_test_submissions_email ON test_submissions (candidate_email);

-- Index on passed for quick filtering
CREATE INDEX IF NOT EXISTS idx_test_submissions_passed ON test_submissions (passed);

-- Index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_test_submissions_created_at ON test_submissions (created_at DESC);
