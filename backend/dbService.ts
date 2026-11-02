// Persistent PostgreSQL data layer using Drizzle ORM
import argon2 from 'argon2';
import type { PoolClient } from 'pg';
import { eq, and, count, sql } from 'drizzle-orm';
import { db, pool } from './db/index.js';
import { isEstimateFarOutsideReferenceRange, parseGuesstimateEstimateValue } from './guesstimate.js';
import type { GuesstimateReferenceRange } from './guesstimate.js';
import {
  users,
  sessions,
  cases,
  submissions,
  reviews,
  votes,
  credibilityScores,
} from './db/schema.js';
import type { CasebookFilters, CasebookInput } from './casebookValidation.js';

export type ReviewRubric =
  | {
      problem_framing: number;
      framework_fit: number;
      data_integrity: number;
      insight_depth: number;
      feasibility: number;
    }
  | {
      structure: number;
      assumption_quality: number;
      math_accuracy: number;
      sanity_check: number;
      clarity: number;
    };

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
  referenceRange?: GuesstimateReferenceRange;
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

export type CasebookStatus = 'Pending' | 'Changes_Requested' | 'Published' | 'Declined' | 'Taken_down';
export type CasebookReviewAction = 'approve' | 'request_changes' | 'decline' | 'take_down';

export interface CasebookCaseRecord {
  id: string;
  slug: string;
  title: string;
  firm: string | null;
  sector: string;
  caseType: string | null;
  difficulty: string;
  summary: string;
  body: string | null;
  position: number;
  practiceCaseId: string | null;
}

export interface CasebookRecord {
  id: string;
  slug: string;
  title: string;
  sourceOrg: string;
  sourceKind: string;
  year: number | null;
  description: string;
  licenseKind: string;
  permissionReference: string | null;
  externalUrl: string | null;
  industries: string[];
  caseCount: number;
  status: CasebookStatus;
  uploaderId: string;
  moderatorNotes: string | null;
  reviewedBy: string | null;
  createdAt: string;
  publishedAt: string | null;
  cases?: CasebookCaseRecord[];
  uploaderName?: string;
}

export type PublicCasebookRecord = Omit<
  CasebookRecord,
  'uploaderId' | 'moderatorNotes' | 'reviewedBy' | 'uploaderName' | 'cases'
> & { cases?: Omit<CasebookCaseRecord, 'body'>[] };

interface CasebookDbRow {
  id: string;
  slug: string;
  title: string;
  sourceOrg: string;
  sourceKind: string;
  year: number | null;
  description: string;
  licenseKind: string;
  permissionReference: string | null;
  externalUrl: string | null;
  industries: string[] | null;
  caseCount: number;
  status: CasebookStatus;
  uploaderId: string;
  moderatorNotes: string | null;
  reviewedBy: string | null;
  createdAt: Date | string;
  publishedAt: Date | string | null;
  uploaderName?: string;
}

interface CasebookCaseDbRow extends CasebookCaseRecord {}

export interface CasebookSearchResult {
  casebooks: PublicCasebookRecord[];
  total: number;
  page: number;
  pageSize: number;
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

export interface CaseReferenceRangeAccess {
  referenceRange: GuesstimateReferenceRange | null;
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
  private static slugify(value: string): string {
    return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'casebook';
  }

  private static async insertCasebookCases(
    client: PoolClient,
    casebookId: string,
    input: CasebookInput
  ): Promise<void> {
    for (const [index, caseItem] of input.cases.entries()) {
      const id = `casebook_case_${crypto.randomUUID()}`;
      const suffix = crypto.randomUUID().slice(0, 8);
      const slug = `${this.slugify(caseItem.title)}-${suffix}`;
      await client.query(
        `INSERT INTO casebook_cases (
           id, casebook_id, slug, title, firm, sector, case_type, difficulty,
           summary, body, position, practice_case_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id, casebookId, slug, caseItem.title, caseItem.firm || null, caseItem.sector,
          caseItem.caseType || null, caseItem.difficulty, caseItem.summary,
          input.licenseKind === 'link_only' ? null : caseItem.body || null,
          caseItem.position ?? index, caseItem.practiceCaseId || null,
        ]
      );
    }
  }

  private static casebookFromRow(row: CasebookDbRow): CasebookRecord {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      sourceOrg: row.sourceOrg,
      sourceKind: row.sourceKind,
      year: row.year,
      description: row.description,
      licenseKind: row.licenseKind,
      permissionReference: row.permissionReference,
      externalUrl: row.externalUrl,
      industries: row.industries ?? [],
      caseCount: Number(row.caseCount),
      status: row.status,
      uploaderId: row.uploaderId,
      moderatorNotes: row.moderatorNotes,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : row.publishedAt,
      uploaderName: row.uploaderName,
    };
  }

  private static caseFromRow(row: CasebookCaseDbRow): CasebookCaseRecord {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      firm: row.firm,
      sector: row.sector,
      caseType: row.caseType,
      difficulty: row.difficulty,
      summary: row.summary,
      body: row.body,
      position: row.position,
      practiceCaseId: row.practiceCaseId,
    };
  }

  private static publicCasebook(record: CasebookRecord): PublicCasebookRecord {
    const { uploaderId: _uploaderId, moderatorNotes: _moderatorNotes, reviewedBy: _reviewedBy, uploaderName: _uploaderName, cases, ...publicRecord } = record;
    return {
      ...publicRecord,
      ...(cases ? { cases: cases.map(({ body: _body, ...caseSummary }) => caseSummary) } : {}),
    };
  }

  private static readonly casebookSelect = `
    id, slug, title, source_org AS "sourceOrg", source_kind AS "sourceKind",
    year, description, license_kind AS "licenseKind",
    permission_reference AS "permissionReference", external_url AS "externalUrl",
    industries, case_count AS "caseCount", status, uploader_id AS "uploaderId",
    moderator_notes AS "moderatorNotes", reviewed_by AS "reviewedBy",
    created_at AS "createdAt", published_at AS "publishedAt"`;

  private static readonly casebookCaseSelect = `
    id, slug, title, firm, sector, case_type AS "caseType", difficulty,
    summary, body, position, practice_case_id AS "practiceCaseId"`;

  public static async createCasebook(uploaderId: string, input: CasebookInput): Promise<CasebookRecord> {
    const id = `casebook_${crypto.randomUUID()}`;
    const slug = `${this.slugify(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<CasebookDbRow>(
        `INSERT INTO casebooks (
           id, slug, title, source_org, source_kind, year, description, license_kind,
           permission_reference, external_url, industries, case_count, uploader_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING ${this.casebookSelect}`,
        [
          id, slug, input.title, input.sourceOrg, input.sourceKind, input.year ?? null,
          input.description, input.licenseKind, input.permissionReference || null,
          input.externalUrl || null, input.industries, input.cases.length, uploaderId,
        ]
      );
      await this.insertCasebookCases(client, id, input);
      await client.query('COMMIT');
      return this.casebookFromRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public static async getMyCasebooks(uploaderId: string): Promise<CasebookRecord[]> {
    const result = await pool.query<CasebookDbRow>(
      `SELECT ${this.casebookSelect}
       FROM casebooks
       WHERE uploader_id = $1
       ORDER BY created_at DESC`,
      [uploaderId]
    );
    return result.rows.map((row) => this.casebookFromRow(row));
  }

  public static async getCasebookForOwner(id: string, uploaderId: string): Promise<CasebookRecord | undefined> {
    const result = await pool.query<CasebookDbRow>(
      `SELECT ${this.casebookSelect}
       FROM casebooks
       WHERE id = $1 AND uploader_id = $2`,
      [id, uploaderId]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    const cases = await pool.query<CasebookCaseDbRow>(
      `SELECT ${this.casebookCaseSelect}
       FROM casebook_cases
       WHERE casebook_id = $1
       ORDER BY position, id`,
      [id]
    );
    return { ...this.casebookFromRow(row), cases: cases.rows.map((item) => this.caseFromRow(item)) };
  }

  public static async updateCasebook(
    id: string,
    uploaderId: string,
    input: CasebookInput
  ): Promise<CasebookRecord | undefined> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `UPDATE casebooks SET
           title = $3, source_org = $4, source_kind = $5, year = $6, description = $7,
           license_kind = $8, permission_reference = $9, external_url = $10,
           industries = $11, case_count = $12, status = 'Pending',
           moderator_notes = NULL, reviewed_by = NULL, published_at = NULL
         WHERE id = $1 AND uploader_id = $2 AND status = 'Changes_Requested'
         RETURNING id`,
        [
          id, uploaderId, input.title, input.sourceOrg, input.sourceKind, input.year ?? null,
          input.description, input.licenseKind, input.permissionReference || null,
          input.externalUrl || null, input.industries, input.cases.length,
        ]
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return undefined;
      }
      await client.query('DELETE FROM casebook_cases WHERE casebook_id = $1', [id]);
      await this.insertCasebookCases(client, id, input);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.getCasebookForOwner(id, uploaderId);
  }

  public static async getPublishedCasebooks(filters: CasebookFilters): Promise<CasebookSearchResult> {
    const queryValues = [
      filters.search,
      filters.sourceKind ?? null,
      filters.sector ?? null,
      filters.caseType ?? null,
      filters.year ?? null,
    ];
    const filterSql = `
      status = 'Published'
      AND ($1 = '' OR title ILIKE '%' || $1 || '%' OR source_org ILIKE '%' || $1 || '%'
        OR description ILIKE '%' || $1 || '%' OR array_to_string(industries, ' ') ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR source_kind = $2)
      AND ($5::integer IS NULL OR year = $5)
      AND (($3::text IS NULL AND $4::text IS NULL) OR EXISTS (
        SELECT 1 FROM casebook_cases c WHERE c.casebook_id = casebooks.id
          AND ($3::text IS NULL OR LOWER(c.sector) = LOWER($3))
          AND ($4::text IS NULL OR c.case_type = $4)
      ))`;
    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM casebooks WHERE ${filterSql}`,
      queryValues
    );
    const offset = (filters.page - 1) * filters.pageSize;
    const result = await pool.query<CasebookDbRow>(
      `SELECT ${this.casebookSelect}
       FROM casebooks
       WHERE ${filterSql}
       ORDER BY published_at DESC, title ASC
       LIMIT $6 OFFSET $7`,
      [...queryValues, filters.pageSize, offset]
    );
    return {
      casebooks: result.rows.map((row) => this.publicCasebook(this.casebookFromRow(row))),
      total: Number(countResult.rows[0]?.total ?? 0),
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  public static async getPublishedCasebookBySlug(slug: string): Promise<PublicCasebookRecord | undefined> {
    const result = await pool.query<CasebookDbRow>(
      `SELECT ${this.casebookSelect}
       FROM casebooks
       WHERE slug = $1 AND status = 'Published'`,
      [slug]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    const cases = await pool.query<CasebookCaseDbRow>(
      `SELECT ${this.casebookCaseSelect.replace(', body,', ', NULL::text AS body,')}
       FROM casebook_cases
       WHERE casebook_id = $1
       ORDER BY position, id`,
      [row.id]
    );
    return this.publicCasebook({
      ...this.casebookFromRow(row),
      cases: cases.rows.map((item) => this.caseFromRow(item)),
    });
  }

  public static async getPublishedCasebookCase(
    slug: string,
    caseSlug: string
  ): Promise<{ casebook: PublicCasebookRecord; caseItem: CasebookCaseRecord } | undefined> {
    const result = await pool.query<CasebookDbRow & CasebookCaseDbRow & {
      bookId: string;
      bookSlug: string;
      bookTitle: string;
      sourceOrg: string;
      sourceKind: string;
      licenseKind: string;
      permissionReference: string | null;
      externalUrl: string | null;
      caseCount: number;
      uploaderId: string;
      moderatorNotes: string | null;
      reviewedBy: string | null;
      publishedAt: Date | string | null;
    }>(
      `SELECT b.id AS "bookId", b.slug AS "bookSlug", b.title AS "bookTitle",
          b.source_org AS "sourceOrg", b.source_kind AS "sourceKind", b.year,
          b.description, b.license_kind AS "licenseKind",
          b.permission_reference AS "permissionReference", b.external_url AS "externalUrl",
          b.industries, b.case_count AS "caseCount", b.status,
          b.uploader_id AS "uploaderId", b.moderator_notes AS "moderatorNotes",
          b.reviewed_by AS "reviewedBy", b.created_at AS "createdAt",
          b.published_at AS "publishedAt",
          c.${this.casebookCaseSelect.trim().replaceAll(', ', ', c.')}
       FROM casebooks b
       JOIN casebook_cases c ON c.casebook_id = b.id
       WHERE b.slug = $1 AND b.status = 'Published' AND c.slug = $2`,
      [slug, caseSlug]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      casebook: this.publicCasebook(this.casebookFromRow({
        id: row.bookId,
        slug: row.bookSlug,
        title: row.bookTitle,
        sourceOrg: row.sourceOrg,
        sourceKind: row.sourceKind,
        year: row.year,
        description: row.description,
        licenseKind: row.licenseKind,
        permissionReference: row.permissionReference,
        externalUrl: row.externalUrl,
        industries: row.industries,
        caseCount: row.caseCount,
        status: row.status,
        uploaderId: row.uploaderId,
        moderatorNotes: row.moderatorNotes,
        reviewedBy: row.reviewedBy,
        createdAt: row.createdAt,
        publishedAt: row.publishedAt,
      })),
      caseItem: this.caseFromRow(row),
    };
  }

  public static async getCasebookModerationQueue(status: 'Pending' | 'Published'): Promise<CasebookRecord[]> {
    const result = await pool.query<CasebookDbRow>(
      `SELECT b.${this.casebookSelect.trim().replaceAll(', ', ', b.')},
          COALESCE(u.name, b.uploader_id) AS "uploaderName"
       FROM casebooks b
       LEFT JOIN users u ON u.id = b.uploader_id
       WHERE b.status = $1
       ORDER BY b.created_at ASC`,
      [status]
    );
    const books = result.rows.map((row) => this.casebookFromRow(row));
    if (books.length === 0) return books;
    const cases = await pool.query<CasebookCaseDbRow & { casebookId: string }>(
      `SELECT ${this.casebookCaseSelect}, casebook_id AS "casebookId"
       FROM casebook_cases
       WHERE casebook_id = ANY($1::varchar[])
       ORDER BY position, id`,
      [books.map((book) => book.id)]
    );
    const grouped = new Map<string, CasebookCaseRecord[]>();
    for (const row of cases.rows) {
      const group = grouped.get(row.casebookId) ?? [];
      group.push(this.caseFromRow(row));
      grouped.set(row.casebookId, group);
    }
    return books.map((book) => ({ ...book, cases: grouped.get(book.id) ?? [] }));
  }

  public static async getCasebookForModeration(id: string): Promise<CasebookRecord | undefined> {
    const result = await pool.query<CasebookDbRow>(
      `SELECT ${this.casebookSelect}
       FROM casebooks
       WHERE id = $1 AND status IN ('Pending', 'Published')`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    const cases = await pool.query<CasebookCaseDbRow>(
      `SELECT ${this.casebookCaseSelect}
       FROM casebook_cases
       WHERE casebook_id = $1
       ORDER BY position, id`,
      [id]
    );
    return { ...this.casebookFromRow(row), cases: cases.rows.map((item) => this.caseFromRow(item)) };
  }

  public static async reviewCasebook(
    id: string,
    moderatorId: string,
    action: CasebookReviewAction,
    notes: string
  ): Promise<CasebookRecord | undefined> {
    const statusByAction: Record<CasebookReviewAction, CasebookStatus> = {
      approve: 'Published',
      request_changes: 'Changes_Requested',
      decline: 'Declined',
      take_down: 'Taken_down',
    };
    const allowedCurrentStatus = action === 'take_down' ? 'Published' : 'Pending';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query<CasebookDbRow>(
        `UPDATE casebooks SET status = $2, moderator_notes = $3, reviewed_by = $4,
           published_at = CASE WHEN $2 = 'Published' THEN NOW() ELSE published_at END
         WHERE id = $1 AND status = $5
         RETURNING ${this.casebookSelect}`,
        [id, statusByAction[action], notes || null, moderatorId, allowedCurrentStatus]
      );
      const row = updated.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return undefined;
      }
      await client.query('COMMIT');
      return this.casebookFromRow(row);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public static async createTakedownRequest(input: {
    casebookId: string;
    requesterEmail: string;
    reason: string;
  }): Promise<string | undefined> {
    const id = `takedown_${crypto.randomUUID()}`;
    const result = await pool.query(
      `INSERT INTO takedown_requests (id, casebook_id, requester_email, reason)
       SELECT $1, id, $3, $4 FROM casebooks
       WHERE id = $2 AND status = 'Published'
       RETURNING id`,
      [id, input.casebookId, input.requesterEmail, input.reason]
    );
    return result.rows[0]?.id;
  }

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
  ): Promise<{ submissionId: string; caseId: string; content: Record<string, string>; referenceRangeHint: boolean } | undefined> {
    const result = await pool.query<{
      id: string;
      case_id: string;
      content_json: Record<string, string>;
      type: string;
      reference_range: GuesstimateReferenceRange | null;
    }>(
      `SELECT s.id, s.case_id, s.content_json, c.type, c.reference_range
       FROM submissions s
       JOIN cases c ON c.id = s.case_id
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
    const estimate = submission?.content_json.final_estimate;
    let referenceRangeHint = false;
    if (submission?.type === 'Guesstimate' && submission.reference_range && estimate) {
      try {
        const value = parseGuesstimateEstimateValue(estimate);
        const range = submission.reference_range;
        referenceRangeHint = value !== undefined && isEstimateFarOutsideReferenceRange(value, range);
      } catch (error) {
        console.error('Could not parse stored Guesstimate estimate for reviewer hint:', error);
      }
    }
    return submission
      ? { submissionId: submission.id, caseId: submission.case_id, content: submission.content_json, referenceRangeHint }
      : undefined;
  }

  public static async getCaseType(caseId: string): Promise<string | undefined> {
    const result = await pool.query<{ type: string }>('SELECT type FROM cases WHERE id = $1', [caseId]);
    return result.rows[0]?.type;
  }

  public static async getReferenceRangeAfterSubmission(
    caseId: string,
    userId: string
  ): Promise<GuesstimateReferenceRange | null> {
    const result = await pool.query<{ reference_range: GuesstimateReferenceRange | null }>(
      `SELECT c.reference_range
       FROM cases c
       WHERE c.id = $1 AND EXISTS (
         SELECT 1 FROM submissions s WHERE s.case_id = c.id AND s.user_id = $2
       )`,
      [caseId, userId]
    );
    if (!result.rows[0]) throw new Error('Reference range is only available after submitting a solution');
    return result.rows[0].reference_range;
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
         , reference_range
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", reference_range AS "referenceRange",
         status, moderator_notes AS "moderatorNotes",
         published_case_id AS "publishedCaseId", created_at AS "createdAt",
         reviewed_at AS "reviewedAt"`,
      [
        id, contributorId, input.title, input.type, input.sector, input.difficulty, input.sourceKind,
        input.sourceReference || null, input.context, input.prompt, input.exhibits || null,
        input.deliverables, input.reviewerGuide, input.solutionOutline, input.referenceRange ?? null,
      ]
    );
    return result.rows[0];
  }

  public static async getCaseProposalsForContributor(contributorId: string): Promise<CaseProposalRecord[]> {
    const result = await pool.query<CaseProposalRecord>(
      `SELECT id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", reference_range AS "referenceRange",
         status, moderator_notes AS "moderatorNotes",
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
         solution_outline AS "solutionOutline", reference_range AS "referenceRange",
         status, moderator_notes AS "moderatorNotes",
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
         deliverables = $12, reviewer_guide = $13, solution_outline = $14, reference_range = $15,
         status = 'Pending', moderator_notes = NULL, reviewed_by = NULL, reviewed_at = NULL
       WHERE id = $1 AND contributor_id = $2 AND status = 'Changes_Requested'
       RETURNING id, contributor_id AS "contributorId", title, type, sector, difficulty,
         source_kind AS "sourceKind", source_reference AS "sourceReference", context, prompt,
         exhibits, deliverables, reviewer_guide AS "reviewerGuide",
         solution_outline AS "solutionOutline", reference_range AS "referenceRange",
         status, moderator_notes AS "moderatorNotes",
         published_case_id AS "publishedCaseId", created_at AS "createdAt",
         reviewed_at AS "reviewedAt"`,
      [
        proposalId, contributorId, input.title, input.type, input.sector, input.difficulty,
        input.sourceKind, input.sourceReference || null, input.context, input.prompt,
        input.exhibits || null, input.deliverables, input.reviewerGuide, input.solutionOutline,
        input.referenceRange ?? null,
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
         p.reference_range AS "referenceRange",
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
           solution_outline AS "solutionOutline", reference_range AS "referenceRange",
           status, moderator_notes AS "moderatorNotes",
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
             tags, is_chaos, reference_range
           )
           VALUES ($1, $2, $3, $4, $5, 'Open', $6, $7, 0, $8, $9, $10)`,
          [
            caseId, proposal.title, proposal.type, proposal.sector, proposal.difficulty,
            description, proposal.deliverables, [proposal.sector],
            proposal.difficulty === 'Chaos', proposal.referenceRange ?? null,
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
