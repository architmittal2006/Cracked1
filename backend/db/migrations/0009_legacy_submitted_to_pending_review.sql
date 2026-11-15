-- Phase 8.2B remediation (H2): converge legacy submissions onto the
-- peer-review lifecycle. Before Phase 8.2B, POST /submissions created rows
-- with status 'Submitted'; the review pipeline only accepts 'Pending_Review',
-- so legacy 'Submitted' rows would be permanently unreviewable.
--
-- This migration moves exactly the legacy 'Submitted' status to
-- 'Pending_Review'. Draft, Completed, In_Dispute and every other status are
-- preserved untouched. The statement is idempotent: re-running it is a no-op.
--
-- Production preflight (run BEFORE deploy to size the change):
--   SELECT status, COUNT(*) FROM submissions GROUP BY status ORDER BY status;
--
-- Optional post-check:
--   SELECT status, COUNT(*) FROM submissions GROUP BY status ORDER BY status;
UPDATE submissions
  SET status = 'Pending_Review'
  WHERE status = 'Submitted';
