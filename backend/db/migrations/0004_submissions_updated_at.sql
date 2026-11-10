-- Track last write time for submissions (drafts) so clients can order
-- local snapshots against the latest persisted server draft.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE submissions SET updated_at = created_at WHERE updated_at IS NULL;
