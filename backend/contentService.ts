import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { pool } from './db/index.js';
import { caseContentSchema, type CaseContentInput } from './contentValidation.js';
import type { GuesstimateReferenceRange } from './guesstimate.js';

export class ContentError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ContentError';
  }
}

interface CaseVersionRow {
  id: string;
  case_id: string;
  version_number: number;
  status: 'Draft' | 'Published';
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  description: string;
  exhibits: string | null;
  deliverables: string[];
  reference_range: GuesstimateReferenceRange | null;
  reference_solution: string;
  rubric_criteria: unknown;
  content_owner: string;
  author_credit: string | null;
  source_kind: string;
  source_reference: string | null;
  rights_declaration: string;
  rights_verified: boolean;
  created_by: string | null;
  published_by: string | null;
  created_at: Date;
  published_at: Date | null;
}

export interface AdminContentListItem {
  id: string;
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  caseStatus: string;
  contentStatus: 'Draft' | 'Published' | 'Unpublished';
  hasDraft: boolean;
  latestVersion: number | null;
  createdAt: string;
}

export interface ContentVersionSummary {
  id: string;
  versionNumber: number;
  status: 'Draft' | 'Published';
  title: string;
  type: string;
  createdAt: string;
  publishedAt: string | null;
  createdBy: string | null;
  publishedBy: string | null;
}

const VERSION_SELECT = `
  id, case_id, version_number, status, title, type, sector, difficulty,
  description, exhibits, deliverables, reference_range, reference_solution,
  rubric_criteria, content_owner, author_credit, source_kind, source_reference,
  rights_declaration, rights_verified, created_by, published_by,
  created_at, published_at
`;

const versionToInput = (row: CaseVersionRow): unknown => ({
  title: row.title,
  type: row.type,
  sector: row.sector,
  difficulty: row.difficulty,
  description: row.description,
  exhibits: row.exhibits ?? undefined,
  deliverables: row.deliverables,
  referenceRange: row.reference_range ?? undefined,
  referenceSolution: row.reference_solution,
  rubricCriteria: row.rubric_criteria,
  contentOwner: row.content_owner,
  authorCredit: row.author_credit ?? undefined,
  sourceKind: row.source_kind,
  sourceReference: row.source_reference ?? undefined,
  rightsDeclaration: row.rights_declaration,
  rightsConfirmed: row.rights_verified === true ? true : false,
});

const insertAuditLog = async (
  client: PoolClient,
  actorId: string,
  action: string,
  targetId: string,
  details: Record<string, unknown>
): Promise<void> => {
  await client.query(
    `INSERT INTO admin_audit_logs (id, actor_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, 'case', $4, $5::jsonb)`,
    [`audit_${randomUUID()}`, actorId, action, targetId, JSON.stringify(details)]
  );
};

const writeVersionFields = async (
  client: PoolClient,
  versionId: string,
  input: CaseContentInput
): Promise<void> => {
  await client.query(
    `UPDATE case_versions SET
       title = $2, type = $3, sector = $4, difficulty = $5, description = $6,
       exhibits = $7, deliverables = $8, reference_range = $9,
       reference_solution = $10, rubric_criteria = $11::jsonb,
       content_owner = $12, author_credit = $13, source_kind = $14,
       source_reference = $15, rights_declaration = $16, rights_verified = $17
     WHERE id = $1`,
    [
      versionId, input.title, input.type, input.sector, input.difficulty,
      input.description, input.exhibits ?? null, input.deliverables,
      input.referenceRange ?? null, input.referenceSolution,
      JSON.stringify(input.rubricCriteria), input.contentOwner,
      input.authorCredit ?? null, input.sourceKind, input.sourceReference ?? null,
      input.rightsDeclaration, input.rightsConfirmed === true,
    ]
  );
};

export const contentService = {
  async listAdminContent(filters: {
    type?: string;
    status?: 'Draft' | 'Published' | 'Unpublished';
    q?: string;
  }): Promise<AdminContentListItem[]> {
    const result = await pool.query<{
      id: string;
      title: string;
      type: string;
      sector: string;
      difficulty: string;
      case_status: string;
      content_status: 'Draft' | 'Published' | 'Unpublished';
      has_draft: boolean;
      latest_version: number | null;
      created_at: Date;
    }>(
      `SELECT c.id, c.title, c.type, c.sector, c.difficulty, c.status AS case_status,
         CASE
           WHEN c.current_version_id IS NOT NULL THEN 'Published'
           WHEN EXISTS (
             SELECT 1 FROM case_versions pv
             WHERE pv.case_id = c.id AND pv.status = 'Published'
           ) THEN 'Unpublished'
           ELSE 'Draft'
         END AS content_status,
         EXISTS (
           SELECT 1 FROM case_versions dv
           WHERE dv.case_id = c.id AND dv.status = 'Draft'
         ) AS has_draft,
         (SELECT MAX(v.version_number) FROM case_versions v WHERE v.case_id = c.id) AS latest_version,
         c.created_at
       FROM cases c
       WHERE ($1::text IS NULL OR c.type = $1)
         AND ($2::text IS NULL OR c.title ILIKE '%' || $2 || '%')
       ORDER BY c.created_at DESC, c.id ASC`,
      [filters.type ?? null, filters.q ?? null]
    );
    const statusFilter = filters.status;
    return result.rows
      .filter((row) => !statusFilter || row.content_status === statusFilter)
      .map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        sector: row.sector,
        difficulty: row.difficulty,
        caseStatus: row.case_status,
        contentStatus: row.content_status,
        hasDraft: row.has_draft,
        latestVersion: row.latest_version,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      }));
  },

  async getAdminContentDetail(caseId: string) {
    const caseResult = await pool.query(
      `SELECT id, title, type, sector, difficulty, status, description, deliverables,
         reference_range, pts, submission_count, review_count, deadline, tags,
         is_chaos, timer_deadline, current_version_id, created_at
       FROM cases WHERE id = $1`,
      [caseId]
    );
    const caseRow = caseResult.rows[0];
    if (!caseRow) return undefined;

    const draftResult = await pool.query<CaseVersionRow>(
      `SELECT ${VERSION_SELECT} FROM case_versions
       WHERE case_id = $1 AND status = 'Draft'`,
      [caseId]
    );
    const publishedResult = caseRow.current_version_id
      ? await pool.query<CaseVersionRow>(
          `SELECT ${VERSION_SELECT} FROM case_versions WHERE id = $1`,
          [caseRow.current_version_id]
        )
      : { rows: [] as CaseVersionRow[] };
    const historyResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM case_versions WHERE case_id = $1`,
      [caseId]
    );

    return {
      case: caseRow,
      draft: draftResult.rows[0] ?? null,
      published: publishedResult.rows[0] ?? null,
      versionCount: Number(historyResult.rows[0]?.count ?? 0),
    };
  },

  async listContentVersions(caseId: string): Promise<ContentVersionSummary[]> {
    const result = await pool.query<{
      id: string;
      version_number: number;
      status: 'Draft' | 'Published';
      title: string;
      type: string;
      created_at: Date;
      published_at: Date | null;
      created_by: string | null;
      published_by: string | null;
    }>(
      `SELECT id, version_number, status, title, type, created_at, published_at,
         created_by, published_by
       FROM case_versions WHERE case_id = $1
       ORDER BY version_number DESC`,
      [caseId]
    );
    const iso = (value: Date | string | null) =>
      value instanceof Date ? value.toISOString() : value ? String(value) : null;
    return result.rows.map((row) => ({
      id: row.id,
      versionNumber: row.version_number,
      status: row.status,
      title: row.title,
      type: row.type,
      createdAt: iso(row.created_at)!,
      publishedAt: iso(row.published_at),
      createdBy: row.created_by,
      publishedBy: row.published_by,
    }));
  },

  async createContent(actorId: string, input: CaseContentInput): Promise<{ caseId: string }> {
    const caseId = `case_${randomUUID()}`;
    const versionId = `case_version_${randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO cases (id, title, type, sector, difficulty, status, description,
           deliverables, reference_range)
         VALUES ($1, $2, $3, $4, $5, 'Open', $6, $7, $8)`,
        [
          caseId, input.title, input.type, input.sector, input.difficulty,
          input.description, input.deliverables, input.referenceRange ?? null,
        ]
      );
      await client.query(
        `INSERT INTO case_versions (
           id, case_id, version_number, status, title, type, sector, difficulty,
           description, exhibits, deliverables, reference_range, reference_solution,
           rubric_criteria, content_owner, author_credit, source_kind, source_reference,
           rights_declaration, rights_verified, created_by
         ) VALUES ($1, $2, 1, 'Draft', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb,
           $13, $14, $15, $16, $17, $18, $19)`,
        [
          versionId, caseId, input.title, input.type, input.sector, input.difficulty,
          input.description, input.exhibits ?? null, input.deliverables,
          input.referenceRange ?? null, input.referenceSolution,
          JSON.stringify(input.rubricCriteria), input.contentOwner,
          input.authorCredit ?? null, input.sourceKind, input.sourceReference ?? null,
          input.rightsDeclaration, input.rightsConfirmed === true, actorId,
        ]
      );
      await insertAuditLog(client, actorId, 'content.draft_created', caseId, {
        versionId,
        versionNumber: 1,
      });
      await client.query('COMMIT');
      return { caseId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async saveContentDraft(
    actorId: string,
    caseId: string,
    input: CaseContentInput
  ): Promise<{ versionId: string; versionNumber: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const caseCheck = await client.query(`SELECT id FROM cases WHERE id = $1 FOR UPDATE`, [caseId]);
      if (!caseCheck.rows[0]) {
        await client.query('ROLLBACK');
        throw new ContentError(404, 'Content not found');
      }
      const draftResult = await client.query<CaseVersionRow>(
        `SELECT ${VERSION_SELECT} FROM case_versions
         WHERE case_id = $1 AND status = 'Draft' FOR UPDATE`,
        [caseId]
      );
      const existing = draftResult.rows[0];
      let versionId: string;
      let versionNumber: number;
      if (existing) {
        versionId = existing.id;
        versionNumber = existing.version_number;
        await writeVersionFields(client, versionId, input);
      } else {
        const maxResult = await client.query<{ next: number }>(
          `SELECT COALESCE(MAX(version_number), 0) + 1 AS next
           FROM case_versions WHERE case_id = $1`,
          [caseId]
        );
        versionNumber = maxResult.rows[0].next;
        versionId = `case_version_${randomUUID()}`;
        await client.query(
          `INSERT INTO case_versions (
             id, case_id, version_number, status, title, type, sector, difficulty,
             description, exhibits, deliverables, reference_range, reference_solution,
             rubric_criteria, content_owner, author_credit, source_kind, source_reference,
             rights_declaration, rights_verified, created_by
           ) VALUES ($1, $2, $3, 'Draft', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb,
             $14, $15, $16, $17, $18, $19, $20)`,
          [
            versionId, caseId, versionNumber, input.title, input.type, input.sector,
            input.difficulty, input.description, input.exhibits ?? null,
            input.deliverables, input.referenceRange ?? null, input.referenceSolution,
            JSON.stringify(input.rubricCriteria), input.contentOwner,
            input.authorCredit ?? null, input.sourceKind, input.sourceReference ?? null,
            input.rightsDeclaration, input.rightsConfirmed === true, actorId,
          ]
        );
      }
      await insertAuditLog(client, actorId, 'content.draft_saved', caseId, {
        versionId,
        versionNumber,
        created: !existing,
      });
      await client.query('COMMIT');
      return { versionId, versionNumber };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async publishContent(
    actorId: string,
    caseId: string
  ): Promise<{ versionId: string; versionNumber: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const draftResult = await client.query<CaseVersionRow>(
        `SELECT ${VERSION_SELECT} FROM case_versions
         WHERE case_id = $1 AND status = 'Draft'
         ORDER BY version_number DESC LIMIT 1 FOR UPDATE`,
        [caseId]
      );
      const draft = draftResult.rows[0];
      if (!draft) {
        await client.query('ROLLBACK');
        throw new ContentError(409, 'No draft version exists to publish');
      }
      const parsed = caseContentSchema.safeParse(versionToInput(draft));
      if (!parsed.success) {
        await client.query('ROLLBACK');
        throw new ContentError(
          422,
          parsed.error.issues[0]?.message || 'Draft content failed validation'
        );
      }
      const input = parsed.data;
      await client.query(
        `UPDATE case_versions
         SET status = 'Published', published_at = NOW(), published_by = $2
         WHERE id = $1`,
        [draft.id, actorId]
      );
      await client.query(
        `UPDATE cases SET
           title = $2, type = $3, sector = $4, difficulty = $5, description = $6,
           deliverables = $7, reference_range = $8, current_version_id = $1
         WHERE id = $9`,
        [
          draft.id, input.title, input.type, input.sector, input.difficulty,
          input.description, input.deliverables, input.referenceRange ?? null, caseId,
        ]
      );
      await insertAuditLog(client, actorId, 'content.published', caseId, {
        versionId: draft.id,
        versionNumber: draft.version_number,
      });
      await client.query('COMMIT');
      return { versionId: draft.id, versionNumber: draft.version_number };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async unpublishContent(
    actorId: string,
    caseId: string
  ): Promise<{ versionId: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ current_version_id: string | null }>(
        `SELECT current_version_id FROM cases WHERE id = $1 FOR UPDATE`,
        [caseId]
      );
      const versionId = current.rows[0]?.current_version_id;
      if (!versionId) {
        await client.query('ROLLBACK');
        throw new ContentError(409, 'Content is not currently published');
      }
      await client.query(
        `UPDATE cases SET current_version_id = NULL WHERE id = $1`,
        [caseId]
      );
      await insertAuditLog(client, actorId, 'content.unpublished', caseId, { versionId });
      await client.query('COMMIT');
      return { versionId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getPublishedCaseDetail(caseId: string) {
    const result = await pool.query(
      `SELECT c.id, c.title, c.type, c.sector, c.difficulty, c.status, c.description,
         c.deliverables, c.pts, c.submission_count, c.review_count, c.deadline,
         c.tags, c.is_chaos, c.timer_deadline, c.created_at,
         v.version_number, v.exhibits, v.reference_solution, v.rubric_criteria,
         v.content_owner, v.author_credit, v.source_kind, v.source_reference,
         v.rights_declaration, v.published_at
       FROM cases c
       JOIN case_versions v ON v.id = c.current_version_id
       WHERE c.id = $1 AND c.status = 'Open' AND c.current_version_id IS NOT NULL`,
      [caseId]
    );
    return result.rows[0];
  },
};
