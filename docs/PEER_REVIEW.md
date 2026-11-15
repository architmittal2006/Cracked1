# Peer Review — Implementation Status

Peer review backend foundations are **implemented (Phase 8.2B)**. Consensus
scoring, the arbiter/dispute workflow, and the frontend review UI remain
deferred.

## Current state

The following endpoints are live behind `requireAuth` (which enforces session
validity, account status, and terms consent):

- `POST /api/submissions/:submissionId/reviews` — records a rubric review.
  Returns `{ success: true, status: 'review_recorded' }`.
- `GET /api/cases/:caseId/review-queue` — next `Pending_Review` submission for
  the caller (excludes own submissions and already-reviewed ones); 404 when
  the queue is empty.
- `GET /api/cases/:caseId/gate-status` — `{ reviewsCompleted,
  pendingReviewCount }` for the caller/case.

## Lifecycle

- `POST /api/cases/:caseId/submissions` creates submissions with
  `status = 'Pending_Review'`.
- `insertReview` only accepts submissions in `Pending_Review`; it rejects
  self-reviews, wrong-case submissions, duplicate active reviews, and reviews
  of drafts/completed/disputed submissions.
- Reviewer identity comes from the session; `reviewerTier` is derived
  server-side via `resolveReviewerTier` (`backend/authorization.ts`):
  `Arbiter` requires `PEER_REVIEW_ARBITER_USER_IDS`, `Verified` requires
  `CASE_MODERATOR_USER_IDS`, otherwise `General`. Platform admins do **not**
  implicitly receive arbitration authority.
- Migration `0009` converts legacy `'Submitted'` rows to `'Pending_Review'`;
  all other statuses are preserved.

## Deferred (not started)

- `VerificationEngine.processPeerReviewConsensus` is intentionally **not**
  invoked after review insertion — consensus activation, `In_Dispute`
  handling, and arbiter override are Phase 8.2C+.
- Frontend review UI, arbiter dashboard, AI evaluation.

## Production preflight (required before deploy)

Run against the production database **before** deploying migrations `0008`/`0009`:

```sql
-- H1: duplicate active reviews would abort migration 0008's unique index.
-- Must return zero rows. If rows exist, deduplicate explicitly (keep the
-- earliest review per pair) — do NOT let the migration discard data silently.
SELECT submission_id, reviewer_id, COUNT(*)
FROM reviews
WHERE is_voided = FALSE
GROUP BY submission_id, reviewer_id
HAVING COUNT(*) > 1;

-- H2: size the legacy status conversion performed by migration 0009.
SELECT status, COUNT(*) FROM submissions GROUP BY status ORDER BY status;
```

## Data model notes

- `submissions.final_weighted_score` is `double precision` (migration 0007) —
  the consensus engine produces fractional 0–5 scores.
- `reviews` has a partial unique index `reviews_submission_reviewer_active_unique`
  on `(submission_id, reviewer_id) WHERE is_voided = FALSE` (migration 0008),
  mirrored in `backend/db/schema.ts`.
