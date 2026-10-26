// Persistent PostgreSQL data layer using Drizzle ORM
import argon2 from 'argon2';
import { eq, and, count, sql } from 'drizzle-orm';
import { db, pool } from './db/index.js';
import {
  users,
  sessions,
  cases,
  submissions,
  reviews,
  votes,
  credibilityScores,
} from './db/schema.js';

export interface ReviewRubric {
  problem_framing: number;
  framework_fit: number;
  data_integrity: number;
  insight_depth: number;
  feasibility: number;
}

export interface ReviewRecord {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerTier: string;
  caseId?: string;
  scores: ReviewRubric;
  feedback?: string;
  isVoided?: boolean;
}

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  credibilityScore: number;
  solveScore: number;
  reviewScore: number;
  casesSolved: number;
  mergeBonusCount: number;
  role: string;
}

export type CaseProposalStatus = 'Pending' | 'Changes_Requested' | 'Approved' | 'Declined';

export interface CaseProposalInput {
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  sourceKind: string;
  sourceReference?: string;
  context: string;
  prompt: string;
  exhibits?: string;
  deliverables: string[];
  reviewerGuide: string;
  solutionOutline: string;
}

export interface CaseProposalRecord extends CaseProposalInput {
  id: string;
  contributorId: string;
  status: CaseProposalStatus;
  moderatorNotes: string | null;
  publishedCaseId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  contributorName?: string;
}

export interface PublishedCaseRecord {
  id: string;
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  status: string;
  description: string;
  deliverables: string[];
  pts: number;
  submissionCount: number;
  reviewCount: number;
  deadline: string;
  tags: string[];
  is_chaos: boolean;
  timer_deadline: string;
}

export class InvalidCaseReviewError extends Error {}

// ─── Password hashing (argon2) ───

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ─── User storage ───

export class DatabaseService {
  public static async getPublishedCases(): Promise<PublishedCaseRecord[]> {
    const result = await pool.query<{
      id: string;
      title: string;
      type: string;
      sector: string;
      difficulty: string;
      status: string;
      description: string;
      deliverables: string[];
      pts: number;
      submission_count: number;
      review_count: number;
      deadline: Date | null;
      tags: string[];
      is_chaos: boolean | null;
      timer_deadline: Date | null;
    }>(
      `SELECT id, title, type, sector, difficulty, status, description, deliverables, pts,
              submission_count, review_count, deadline, tags, is_chaos, timer_deadline
       FROM cases
       WHERE status = 'Open'
       ORDER BY created_at DESC, id ASC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      sector: row.sector,
      difficulty: row.difficulty,
      status: row.status,
      description: row.description,
      deliverables: row.deliverables ?? [],
      pts: row.pts,
      submissionCount: row.submission_count,
      reviewCount: row.review_count,
      deadline: row.deadline?.toISOString() ?? '',
      tags: row.tags ?? [],
      is_chaos: row.is_chaos ?? false,
      timer_deadline: row.timer_deadline?.toISOString() ?? '',
    }));
  }

  public static async getNextReviewSubmission(
    caseId: string,
    reviewerId: string
  ): Promise<{ submissionId: string; caseId: string; content: Record<string, string> } | undefined> {
    const result = await pool.query<{
      id: string;
      case_id: string;
      content_json: Record<string, string>;
    }>(
      `SELECT s.id, s.case_id, s.content_json
       FROM submissions s
       WHERE s.case_id = $1
         AND s.user_id <> $2
         AND s.status = 'Pending_Review'
         AND NOT EXISTS (
           SELECT 1 FROM reviews r
           WHERE r.submission_id = s.id
             AND r.reviewer_id = $2
             AND r.is_voided = FALSE
         )
       ORDER BY s.created_at ASC
       LIMIT 1`,
      [caseId, reviewerId]
    );
    const submission = result.rows[0];
    return submission
      ? { submissionId: submission.id, caseId: submission.case_id, content: submission.content_json }
      : undefined;
  }

  public static async createCaseProposal(
    contributorId: string,
    input: CaseProposalInput
  ): Promise<CaseProposalRecord> {
    const id = `proposal_${crypto.randomUUID()}`;
    const result = await pool.query<CaseProposalRecord>(
      `INSERT INTO case_proposals (
         id, contributor_id, title, type, sector, difficulty, source_kind, source_reference,
         context, prompt, exhibits, deliverables, reviewer_guide, solution_outline
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", status, moderator_notes AS "moderatorNotes",
         published_case_id AS "publishedCaseId", created_at AS "createdAt",
         reviewed_at AS "reviewedAt"`,
      [
        id, contributorId, input.title, input.type, input.sector, input.difficulty, input.sourceKind,
        input.sourceReference || null, input.context, input.prompt, input.exhibits || null,
        input.deliverables, input.reviewerGuide, input.solutionOutline,
      ]
    );
    return result.rows[0];
  }

  public static async getCaseProposalsForContributor(contributorId: string): Promise<CaseProposalRecord[]> {
    const result = await pool.query<CaseProposalRecord>(
      `SELECT id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", status, moderator_notes AS "moderatorNotes",
         published_case_id AS "publishedCaseId", created_at AS "createdAt",
         reviewed_at AS "reviewedAt"
       FROM case_proposals
       WHERE contributor_id = $1
       ORDER BY created_at DESC`,
      [contributorId]
    );
    return result.rows;
  }

  public static async getCaseProposalForContributor(
    proposalId: string,
    contributorId: string
  ): Promise<CaseProposalRecord | undefined> {
    const result = await pool.query<CaseProposalRecord>(
      `SELECT id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", status, moderator_notes AS "moderatorNotes",
         published_case_id AS "publishedCaseId", created_at AS "createdAt",
         reviewed_at AS "reviewedAt"
       FROM case_proposals
       WHERE id = $1 AND contributor_id = $2`,
      [proposalId, contributorId]
    );
    return result.rows[0];
  }

  public static async updateCaseProposal(
    proposalId: string,
    contributorId: string,
    input: CaseProposalInput
  ): Promise<CaseProposalRecord | undefined> {
    const result = await pool.query<CaseProposalRecord>(
      `UPDATE case_proposals SET
         title = $3, type = $4, sector = $5, difficulty = $6, source_kind = $7,
         source_reference = $8, context = $9, prompt = $10, exhibits = $11,
         deliverables = $12, reviewer_guide = $13, solution_outline = $14,
         status = 'Pending', moderator_notes = NULL, reviewed_by = NULL, reviewed_at = NULL
       WHERE id = $1 AND contributor_id = $2 AND status = 'Changes_Requested'
       RETURNING id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", status, moderator_notes AS "moderatorNotes",
         published_case_id AS "publishedCaseId", created_at AS "createdAt",
         reviewed_at AS "reviewedAt"`,
      [
        proposalId, contributorId, input.title, input.type, input.sector, input.difficulty,
        input.sourceKind, input.sourceReference || null, input.context, input.prompt,
        input.exhibits || null, input.deliverables, input.reviewerGuide, input.solutionOutline,
      ]
    );
    return result.rows[0];
  }

  public static async getPendingCaseProposals(): Promise<CaseProposalRecord[]> {
    const result = await pool.query<CaseProposalRecord>(
      `SELECT p.id, p.contributor_id AS "contributorId", p.title, p.type, p.sector,
         p.difficulty, p.source_kind AS "sourceKind", p.source_reference AS "sourceReference",
         p.context, p.prompt, p.exhibits, p.deliverables,
         p.reviewer_guide AS "reviewerGuide", p.solution_outline AS "solutionOutline",
         p.status, p.moderator_notes AS "moderatorNotes",
         p.published_case_id AS "publishedCaseId", p.created_at AS "createdAt",
         p.reviewed_at AS "reviewedAt", COALESCE(u.name, p.contributor_id) AS "contributorName"
       FROM case_proposals p
       LEFT JOIN users u ON u.id = p.contributor_id
       WHERE p.status = 'Pending'
       ORDER BY p.created_at ASC`
    );
    return result.rows;
  }

  public static async reviewCaseProposal(
    proposalId: string,
    moderatorId: string,
    status: Exclude<CaseProposalStatus, 'Pending'>,
    moderatorNotes: string
  ): Promise<CaseProposalRecord | undefined> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<CaseProposalRecord>(
        `UPDATE case_proposals SET status = $2, moderator_notes = $3,
           reviewed_by = $4, reviewed_at = NOW()
         WHERE id = $1 AND status = 'Pending'
         RETURNING id, contributor_id AS "contributorId", title, type, sector, difficulty,
           source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
           exhibits, deliverables, reviewer_guide AS "reviewerGuide",
           solution_outline AS "solutionOutline", status, moderator_notes AS "moderatorNotes",
           published_case_id AS "publishedCaseId", created_at AS "createdAt",
           reviewed_at AS "reviewedAt"`,
        [proposalId, status, moderatorNotes || null, moderatorId]
      );
      const proposal = result.rows[0];
      if (!proposal) {
        await client.query('ROLLBACK');
        return undefined;
      }

      if (status === 'Approved') {
        const caseId = `case_${crypto.randomUUID()}`;
        const description = [
          proposal.context,
          `## Case prompt\n\n${proposal.prompt}`,
          proposal.exhibits ? `## Available information\n\n${proposal.exhibits}` : '',
        ].filter(Boolean).join('\n\n');
        await client.query(
          `INSERT INTO cases (
             id, title, type, sector, difficulty, status, description, deliverables, pts,
             tags, is_chaos
           )
           VALUES ($1, $2, $3, $4, $5, 'Open', $6, $7, 0, $8, $9)`,
          [
            caseId, proposal.title, proposal.type, proposal.sector, proposal.difficulty,
            description, proposal.deliverables, [proposal.sector],
            proposal.difficulty === 'Chaos',
          ]
        );
        await client.query(
          'UPDATE case_proposals SET published_case_id = $2 WHERE id = $1',
          [proposalId, caseId]
        );
        proposal.publishedCaseId = caseId;
      }

      await client.query('COMMIT');
      return proposal;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public static async createUser(payload: {
    username: string;
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<string> {
    const existingEmail = await db.select().from(users).where(eq(users.email, payload.email));
    if (existingEmail.length > 0) {
      throw new Error('Email already registered');
    }
    const existingUser = await db.select().from(users).where(eq(users.username, payload.username));
    if (existingUser.length > 0) {
      throw new Error('Username already taken');
    }

    const id = 'u_' + crypto.randomUUID().slice(2, 11);
    await db.insert(users).values({
      id,
      username: payload.username,
      name: payload.name,
      email: payload.email,
      passwordHash: payload.passwordHash,
    });
    return id;
  }

  public static async getUserByEmail(email: string): Promise<UserRecord | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  public static async getUserById(id: string): Promise<UserRecord | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  public static async getUserByUsername(username: string): Promise<UserRecord | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  // ─── Review storage ───

  public static async getCompletedReviewCountForCase(userId: string, caseId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, userId),
          eq(reviews.caseId, caseId),
          eq(reviews.isVoided, false)
        )
      );
    return Number(result[0]?.count || 0);
  }

  public static async createSubmission(payload: any): Promise<string> {
    const id = 'sub_' + crypto.randomUUID().slice(2, 11);
    await db.transaction(async (tx) => {
      await tx.insert(submissions).values({
        id,
        caseId: payload.caseId,
        userId: payload.userId,
        contentJson: payload.contentJson,
        citationsCount: payload.citationsCount,
        wordCount: payload.wordCount,
        status: payload.status || 'Submitted',
        structuralCompliant: payload.structuralCompliant || false,
        finalWeightedScore: payload.finalWeightedScore ?? null,
      });
      await tx.update(cases)
        .set({ submissionCount: sql`${cases.submissionCount} + 1` })
        .where(eq(cases.id, payload.caseId));
    });
    return id;
  }

  public static async getCaseSolutionsForUser(
    caseId: string,
    userId: string
  ): Promise<{ id: string; content: Record<string, string>; createdAt: string }[] | undefined> {
    const access = await pool.query<{ can_view: boolean }>(
      `SELECT
         EXISTS (
           SELECT 1 FROM submissions
           WHERE case_id = $1 AND user_id = $2
         ) OR EXISTS (
           SELECT 1 FROM case_proposals
           WHERE published_case_id = $1 AND contributor_id = $2
         ) AS can_view`,
      [caseId, userId]
    );
    if (!access.rows[0]?.can_view) return undefined;

    const result = await pool.query<{
      id: string;
      content_json: Record<string, string>;
      created_at: Date;
    }>(
      `SELECT id, content_json, created_at
       FROM submissions
       WHERE case_id = $1 AND user_id <> $2 AND structural_compliant = TRUE
       ORDER BY created_at DESC, id ASC`,
      [caseId, userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      content: row.content_json,
      createdAt: row.created_at.toISOString(),
    }));
  }

  public static async getActiveReviewsForSubmission(submissionId: string): Promise<ReviewRecord[]> {
    const result = await db
      .select({
        id: reviews.id,
        submissionId: reviews.submissionId,
        reviewerId: reviews.reviewerId,
        reviewerTier: reviews.reviewerTier,
        caseId: reviews.caseId,
        scores: reviews.scores,
        isVoided: reviews.isVoided,
      })
      .from(reviews)
      .where(and(eq(reviews.submissionId, submissionId), eq(reviews.isVoided, false)));
    return result.map((r) => ({
      id: r.id,
      submissionId: r.submissionId,
      reviewerId: r.reviewerId,
      reviewerTier: r.reviewerTier,
      caseId: r.caseId ?? undefined,
      scores: r.scores as ReviewRubric,
      isVoided: r.isVoided,
    }));
  }

  public static async insertReview(payload: {
    submissionId: string;
    reviewerId: string;
    reviewerTier: string;
    scores: ReviewRubric;
    caseId: string;
    feedback: string;
  }): Promise<void> {
    const id = 'rev_' + crypto.randomUUID().slice(2, 11);
    await db.transaction(async (tx) => {
      const [submission] = await tx
        .select({ caseId: submissions.caseId, userId: submissions.userId })
        .from(submissions)
        .where(eq(submissions.id, payload.submissionId))
        .limit(1);
      if (!submission || submission.caseId !== payload.caseId || submission.userId === payload.reviewerId) {
        throw new InvalidCaseReviewError('This submission is unavailable for your review');
      }

      const [existingReview] = await tx
        .select({ id: reviews.id })
        .from(reviews)
        .where(and(
          eq(reviews.submissionId, payload.submissionId),
          eq(reviews.reviewerId, payload.reviewerId),
          eq(reviews.isVoided, false)
        ))
        .limit(1);
      if (existingReview) {
        throw new InvalidCaseReviewError('You have already reviewed this submission');
      }

      await tx.insert(reviews).values({
        id,
        submissionId: payload.submissionId,
        reviewerId: payload.reviewerId,
        reviewerTier: payload.reviewerTier,
        caseId: payload.caseId,
        scores: payload.scores as any,
        feedback: payload.feedback,
        isVoided: false,
      });
      await tx.update(cases)
        .set({ reviewCount: sql`${cases.reviewCount} + 1` })
        .where(eq(cases.id, payload.caseId));
    });
  }

  public static async updateSubmissionStatus(submissionId: string, status: string): Promise<void> {
    await db.update(submissions).set({ status }).where(eq(submissions.id, submissionId));
  }

  public static async finalizeSubmission(submissionId: string, score: number, status: string): Promise<void> {
    await db.update(submissions)
      .set({ finalWeightedScore: score, status })
      .where(eq(submissions.id, submissionId));
  }
}
