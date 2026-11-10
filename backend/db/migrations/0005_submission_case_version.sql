-- Phase 7B: pin each submission to the published case version it was
-- created against, so post-submission debriefs show the reference
-- solution/range that existed at submit time. Nullable: legacy rows and
-- drafts fall back to the case's current published version.
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS case_version_id VARCHAR(255)
    REFERENCES case_versions(id);
