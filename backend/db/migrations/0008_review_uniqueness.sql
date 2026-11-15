-- Phase 8.2B: prevent duplicate active reviews per submission+reviewer.
-- insertReview checks for an existing row inside its transaction, but without
-- a unique constraint two concurrent requests can both pass the check and
-- persist duplicate reviews. This partial unique index closes that race;
-- voided reviews are excluded so a voided review does not block re-review.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_submission_reviewer_active_unique
  ON reviews (submission_id, reviewer_id)
  WHERE is_voided = FALSE;
