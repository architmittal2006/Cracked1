# Peer Review — Deferred Feature Notice

Peer review is **intentionally deferred to Phase 8**. It is not broken and not complete.

## Current state

The following endpoints remain mounted and authenticated, but return an explicit
disabled response (`501`, `code: "peer_review_disabled"`) instead of implying the
unfinished pipeline is operational:

- `POST /api/submissions/:submissionId/reviews`
- `GET /api/cases/:caseId/review-queue`
- `GET /api/cases/:caseId/gate-status`

Nothing ever sets `submissions.status = 'Pending_Review'`, so the review queue,
consensus engine (`verificationEngine.ts`), and scoring columns were unreachable
in practice. The endpoints are disabled rather than removed so historical
`reviews` rows, `verificationEngine.ts`, and the schema remain intact for Phase 8.

## What was removed

- `frontend/src/components/FlagButton.tsx` — unused component that called a
  fake-success stub.
- `frontend/src/services/api.ts` review client methods: `updateSubmission`,
  `createReview`, `flagReview`, `getGateStatus`, `getNextReviewSubmission` and
  their types. Two of these (`flagReview`, `updateSubmission`) previously
  returned `{ success: true }` without any backend call.

## Phase 8 prerequisites (not started)

- A `Pending_Review` status transition when a submission is created.
- Review UI and rubric capture flow.
- `final_weighted_score` column type review (currently `integer`; engine
  produces 0–5 floats).
- Consensus/scoring activation in `verificationEngine.ts`.
