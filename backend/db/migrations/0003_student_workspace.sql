-- Phase 3: student solving workspace.
-- Enforce at most one in-progress draft submission per user per case.
-- Drafts live in the existing submissions table with status = 'Draft'
-- and never count toward cases.submission_count.

CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_draft_per_user_case
  ON submissions (case_id, user_id)
  WHERE status = 'Draft';
