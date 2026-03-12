-- Migration 007: Add tags column to period_logs for override tagging
-- Tags allow Moon to mark cycles affected by external factors (stress, illness, etc.)
-- so the prediction algorithm can weight them appropriately.

ALTER TABLE period_logs
  ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];

-- Validate that all tags are from the allowed set
ALTER TABLE period_logs
  ADD CONSTRAINT chk_period_log_tags
  CHECK (tags <@ ARRAY['stress', 'illness', 'travel', 'medication', 'other']::TEXT[]);

-- GIN index for efficient tag-based queries
CREATE INDEX idx_period_logs_tags ON period_logs USING GIN (tags);
