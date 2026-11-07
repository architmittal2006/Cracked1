import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import { applyMigrations, assertMigrationsCurrent } from './db/runMigrations.js';

const { uploadImageBufferMock } = vi.hoisted(() => ({
  uploadImageBufferMock: vi.fn(),
}));

vi.mock('./cloudinary.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./cloudinary.js')>()),
  uploadImageBuffer: uploadImageBufferMock,
}));

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required; refusing to run integration tests against DATABASE_URL');
}

const parsedTestDatabaseUrl = new URL(TEST_DATABASE_URL);
const testDatabaseName = decodeURIComponent(parsedTestDatabaseUrl.pathname.slice(1));
if (!['localhost', '127.0.0.1', '[::1]'].includes(parsedTestDatabaseUrl.hostname.toLowerCase()) ||
  !/(^|[_-])(test|testing|ci|disposable)([_-]|$)/i.test(testDatabaseName)) {
  throw new Error('TEST_DATABASE_URL must point to a local disposable test database');
}
if (process.env.DATABASE_URL) {
  const parsedDatabaseUrl = new URL(process.env.DATABASE_URL);
  if (`${parsedDatabaseUrl.hostname.toLowerCase()}:${parsedDatabaseUrl.port || '5432'}${parsedDatabaseUrl.pathname}` ===
    `${parsedTestDatabaseUrl.hostname.toLowerCase()}:${parsedTestDatabaseUrl.port || '5432'}${parsedTestDatabaseUrl.pathname}`) {
    throw new Error('TEST_DATABASE_URL must not point to the DATABASE_URL database');
  }
}

let app: import('express').Express;
let pool: Pool;

const withIsolatedSchema = async (run: (pool: Pool) => Promise<void>): Promise<void> => {
  const adminPool = new Pool({ connectionString: TEST_DATABASE_URL });
  const schema = `phase1_test_${randomUUID().replace(/-/g, '')}`;
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  const isolatedPool = new Pool({
    connectionString: TEST_DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  try {
    await run(isolatedPool);
  } finally {
    await isolatedPool.end();
    await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await adminPool.end();
  }
};

const withMigrationDirectory = async (
  filename: string,
  sql: string,
  run: (directory: string) => Promise<void>
): Promise<void> => {
  const directory = await mkdtemp(path.join(tmpdir(), 'phase1-migration-test-'));
  try {
    await writeFile(path.join(directory, filename), sql, 'utf8');
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

const withLegacyMigrationDirectory = async (
  run: (directory: string) => Promise<void>
): Promise<void> => {
  const directory = await mkdtemp(path.join(tmpdir(), 'phase2-legacy-migrations-'));
  try {
    const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');
    for (const filename of ['0000_core_schema.sql', '0001_phase1_security.sql']) {
      await copyFile(path.join(migrationsDir, filename), path.join(directory, filename));
    }
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

const insertLegacyCase = async (pool: Pool, id: string) => {
  await pool.query(
    `INSERT INTO cases (id, title, type, sector, difficulty, status, description, deliverables, reference_range)
     VALUES ($1, 'Legacy profitability case', 'Profitability', 'Retail', 'Standard', 'Open',
       'A legacy case description with enough detail to be realistic published content.',
       ARRAY['Recommend'], NULL)`,
    [id]
  );
};

const insertCaseVersion = async (
  pool: Pool,
  values: {
    id: string;
    caseId: string;
    versionNumber: number;
    status: 'Draft' | 'Published';
    publishedAt?: string | null;
  }
) => {
  await pool.query(
    `INSERT INTO case_versions (
       id, case_id, version_number, status, title, type, sector, difficulty,
       description, reference_solution, content_owner, source_kind, rights_declaration, published_at
     ) VALUES ($1, $2, $3, $4, 'Versioned case title', 'Profitability', 'Retail', 'Standard',
       'A versioned case description with enough detail to satisfy content rules.',
       'Reference solution text long enough to be meaningful for reviewers.',
       'Cracked content team', 'original',
       'Original work created for Cracked; all rights reserved by the platform.',
       $5)`,
    [values.id, values.caseId, values.versionNumber, values.status, values.publishedAt ?? null]
  );
};

beforeAll(async () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.TEST_USE_POSTGRES_SESSION_STORE = 'true';
  pool = new Pool({ connectionString: TEST_DATABASE_URL });
  await applyMigrations(pool);
  await assertMigrationsCurrent(pool);
  const server = await import('./server.js');
  app = server.app;
});

afterAll(async () => {
  await pool.query(`DELETE FROM sessions WHERE sess #>> '{user,id}' IN (
    SELECT id FROM users WHERE email LIKE '%@test.cracked.local'
  )`);
  await pool.query(`DELETE FROM admin_audit_logs WHERE actor_id IN (
    SELECT id FROM users WHERE email LIKE '%@test.cracked.local'
  )`);
  await pool.query("DELETE FROM casebooks WHERE id LIKE 'casebook_test_%'");
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.cracked.local'");
  await pool.end();
});

beforeEach(async () => {
  uploadImageBufferMock.mockReset();
  await pool.query(`DELETE FROM sessions WHERE sess #>> '{user,id}' IN (
    SELECT id FROM users WHERE email LIKE '%@test.cracked.local'
  )`);
  await pool.query(`DELETE FROM admin_audit_logs WHERE actor_id IN (
    SELECT id FROM users WHERE email LIKE '%@test.cracked.local'
  )`);
  await pool.query("DELETE FROM casebooks WHERE id LIKE 'casebook_test_%'");
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.cracked.local'");
});

const registerTestUser = async (agent: ReturnType<typeof request.agent>, label: string) => {
  const suffix = randomUUID();
  const email = `${label}_${suffix}@test.cracked.local`;
  const response = await agent.post('/api/auth/register').send({
    username: `${label}_${suffix}`,
    name: `Casebook ${label}`,
    email,
    password: 'SecurePass123!',
  });
  expect(response.status).toBe(201);
  return { id: response.body.user.id as string, email };
};

const insertTestBook = async (id: string, uploaderId: string, slug: string, status: string) => {
  await pool.query(
    `INSERT INTO casebooks (
       id, slug, title, source_org, source_kind, year, description, license_kind,
       permission_reference, external_url, industries, case_count, status, uploader_id
     ) VALUES ($1, $2, $3, 'Test source', 'original', 2025, 'A test-only casebook description.',
       'original', 'Created for route tests', 'https://example.test/source', ARRAY['Retail'], 1, $4, $5)`,
    [id, slug, `Casebook test ${slug}`, status, uploaderId]
  );
  await pool.query(
    `INSERT INTO casebook_cases (
       id, casebook_id, slug, title, sector, case_type, difficulty, summary, body, position
     ) VALUES ($1, $2, 'test-case', 'Test case', 'Retail', 'Market Entry', 'Standard',
       'A test-only case summary.', 'Test body text.', 0)`,
    [`casebook_case_test_${randomUUID()}`, id]
  );
};

describe('Migration runner', () => {
  it('creates a fresh schema, reruns safely, and preserves existing records', async () => {
    await withIsolatedSchema(async (isolatedPool) => {
      await applyMigrations(isolatedPool);
      await assertMigrationsCurrent(isolatedPool);
      await isolatedPool.query(
        `INSERT INTO users (id, username, email, password_hash, name)
         VALUES ('migration_sentinel', 'migration_sentinel', 'migration_sentinel@test.local', 'hash', 'Sentinel')`
      );
      await applyMigrations(isolatedPool);
      const sentinel = await isolatedPool.query(
        `SELECT id, username FROM users WHERE id = 'migration_sentinel'`
      );
      expect(sentinel.rows).toEqual([{ id: 'migration_sentinel', username: 'migration_sentinel' }]);
      await assertMigrationsCurrent(isolatedPool);
    });
  });

  it('adopts a legacy schema additively without changing existing user data', async () => {
    await withIsolatedSchema(async (isolatedPool) => {
      await isolatedPool.query(`
        CREATE TABLE users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'General',
          credibility_score INTEGER NOT NULL DEFAULT 0,
          solve_score INTEGER NOT NULL DEFAULT 0,
          review_score INTEGER NOT NULL DEFAULT 0,
          cases_solved INTEGER NOT NULL DEFAULT 0,
          merge_bonus_count INTEGER NOT NULL DEFAULT 0,
          bio TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        INSERT INTO users (id, username, email, password_hash, name)
        VALUES ('legacy_sentinel', 'legacy_sentinel', 'legacy_sentinel@test.local', 'hash', 'Legacy');
      `);
      await applyMigrations(isolatedPool);
      const legacy = await isolatedPool.query(
        `SELECT id, username, is_active, session_version FROM users WHERE id = 'legacy_sentinel'`
      );
      expect(legacy.rows).toEqual([{
        id: 'legacy_sentinel',
        username: 'legacy_sentinel',
        is_active: true,
        session_version: 0,
      }]);
      await assertMigrationsCurrent(isolatedPool);
    });
  });

  it('rejects changed checksums and rolls back failed migrations', async () => {
    await withIsolatedSchema(async (isolatedPool) => {
      await withMigrationDirectory('9001_checksum.sql', 'CREATE TABLE checksum_target (id INTEGER);', async (directory) => {
        await applyMigrations(isolatedPool, directory);
        await writeFile(path.join(directory, '9001_checksum.sql'), 'CREATE TABLE checksum_target (id BIGINT);', 'utf8');
        await expect(applyMigrations(isolatedPool, directory)).rejects.toThrow('Applied migration was changed');
      });
    });
    await withIsolatedSchema(async (isolatedPool) => {
      await withMigrationDirectory(
        '9002_failure.sql',
        'CREATE TABLE rollback_target (id INTEGER); INSERT INTO missing_relation VALUES (1);',
        async (directory) => {
          await expect(applyMigrations(isolatedPool, directory)).rejects.toThrow();
          const result = await isolatedPool.query(
            `SELECT to_regclass('rollback_target') AS table_name,
                    (SELECT filename FROM schema_migrations WHERE filename = '9002_failure.sql') AS applied`
          );
          expect(result.rows[0]).toEqual({ table_name: null, applied: null });
        }
      );
    });
  });

  it('serializes concurrent migration attempts', async () => {
    await withIsolatedSchema(async (firstPool) => {
      const schema = await firstPool.query<{ schema_name: string }>('SELECT current_schema() AS schema_name');
      const secondPool = new Pool({
        connectionString: TEST_DATABASE_URL,
        options: `-c search_path=${schema.rows[0].schema_name}`,
      });
      try {
        await withMigrationDirectory(
          '9003_concurrent.sql',
          'SELECT pg_sleep(0.25); CREATE TABLE concurrent_target (id INTEGER);',
          async (directory) => {
            await Promise.all([
              applyMigrations(firstPool, directory),
              applyMigrations(secondPool, directory),
            ]);
            const result = await firstPool.query<{ count: string }>(
              `SELECT COUNT(*)::text AS count FROM schema_migrations
               WHERE filename = '9003_concurrent.sql'`
            );
            expect(result.rows[0].count).toBe('1');
          }
        );
      } finally {
        await secondPool.end();
      }
    });
  });
});

describe('Case versioning migration', () => {
  it('backfills legacy cases into published versions, sets the pointer, and preserves data', async () => {
    await withIsolatedSchema(async (isolatedPool) => {
      await withLegacyMigrationDirectory(async (directory) => {
        await applyMigrations(isolatedPool, directory);
        await insertLegacyCase(isolatedPool, 'legacy_case_1');
        await insertLegacyCase(isolatedPool, 'legacy_case_2');

        // Applying the full migration set upgrades the legacy schema in place.
        await applyMigrations(isolatedPool);
        await assertMigrationsCurrent(isolatedPool);

        const versions = await isolatedPool.query<{
          case_id: string;
          version_number: number;
          status: string;
          source_kind: string;
          rights_verified: boolean;
          reference_solution: string;
          published_at: Date | null;
        }>(
          `SELECT case_id, version_number, status, source_kind, rights_verified,
                  reference_solution, published_at
           FROM case_versions ORDER BY case_id`
        );
        expect(versions.rows).toHaveLength(2);
        for (const row of versions.rows) {
          expect(row.version_number).toBe(1);
          expect(row.status).toBe('Published');
          expect(row.source_kind).toBe('legacy_unverified');
          expect(row.rights_verified).toBe(false);
          expect(row.reference_solution).not.toBe('');
          expect(row.published_at).not.toBeNull();
        }

        const cases = await isolatedPool.query<{
          id: string;
          title: string;
          current_version_id: string | null;
        }>(
          `SELECT id, title, current_version_id FROM cases ORDER BY id`
        );
        expect(cases.rows.map((row) => row.title)).toEqual([
          'Legacy profitability case',
          'Legacy profitability case',
        ]);
        for (const row of cases.rows) {
          expect(row.current_version_id).toMatch(/^legacy_case_version_/);
        }
        const pointers = await isolatedPool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM cases c
           JOIN case_versions v ON v.id = c.current_version_id
           WHERE v.case_id = c.id AND v.status = 'Published'`
        );
        expect(pointers.rows[0].count).toBe('2');

        // Hiding a case (unpublish) keeps its version history and pointer data.
        await isolatedPool.query(`UPDATE cases SET status = 'Unpublished' WHERE id = 'legacy_case_1'`);
        const preserved = await isolatedPool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM case_versions WHERE case_id = 'legacy_case_1'`
        );
        expect(preserved.rows[0].count).toBe('1');

        // Rerunning migrations is a no-op and does not duplicate versions.
        await applyMigrations(isolatedPool);
        const recount = await isolatedPool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM case_versions`
        );
        expect(recount.rows[0].count).toBe('2');
        await assertMigrationsCurrent(isolatedPool);
      });
    });
  });

  it('enforces one draft per case, published immutability, and pointer integrity', async () => {
    await withIsolatedSchema(async (isolatedPool) => {
      await applyMigrations(isolatedPool);
      await insertLegacyCase(isolatedPool, 'versioned_case');

      // A case created after migration has no version until one is published.
      const fresh = await isolatedPool.query<{ current_version_id: string | null }>(
        `SELECT current_version_id FROM cases WHERE id = 'versioned_case'`
      );
      expect(fresh.rows[0].current_version_id).toBeNull();

      await insertCaseVersion(isolatedPool, {
        id: 'draft_v1', caseId: 'versioned_case', versionNumber: 1, status: 'Draft',
      });

      // Only one draft may exist per case.
      await expect(insertCaseVersion(isolatedPool, {
        id: 'draft_v2', caseId: 'versioned_case', versionNumber: 2, status: 'Draft',
      })).rejects.toThrow();

      // Drafts are editable.
      await isolatedPool.query(`UPDATE case_versions SET title = 'Edited draft title' WHERE id = 'draft_v1'`);

      // Publishing the draft requires published_at and then freezes the row.
      await expect(isolatedPool.query(
        `UPDATE case_versions SET status = 'Published' WHERE id = 'draft_v1'`
      )).rejects.toThrow();
      await isolatedPool.query(
        `UPDATE case_versions SET status = 'Published', published_at = NOW() WHERE id = 'draft_v1'`
      );
      await expect(isolatedPool.query(
        `UPDATE case_versions SET title = 'Mutated' WHERE id = 'draft_v1'`
      )).rejects.toThrow(/immutable/);
      await expect(isolatedPool.query(
        `DELETE FROM case_versions WHERE id = 'draft_v1'`
      )).rejects.toThrow(/immutable/);

      // The pointer accepts only a Published version of the same case.
      await expect(isolatedPool.query(
        `UPDATE cases SET current_version_id = 'missing_version' WHERE id = 'versioned_case'`
      )).rejects.toThrow();
      await insertLegacyCase(isolatedPool, 'other_case');
      await insertCaseVersion(isolatedPool, {
        id: 'other_draft', caseId: 'other_case', versionNumber: 1, status: 'Draft',
      });
      await expect(isolatedPool.query(
        `UPDATE cases SET current_version_id = 'other_draft' WHERE id = 'versioned_case'`
      )).rejects.toThrow(/Published version of the same case/);
      await isolatedPool.query(
        `UPDATE cases SET current_version_id = 'draft_v1' WHERE id = 'versioned_case'`
      );
      const pointed = await isolatedPool.query<{ current_version_id: string }>(
        `SELECT current_version_id FROM cases WHERE id = 'versioned_case'`
      );
      expect(pointed.rows[0].current_version_id).toBe('draft_v1');

      // Drafts remain deletable; published rows cannot be deleted even via FK paths.
      await isolatedPool.query(`DELETE FROM case_versions WHERE id = 'other_draft'`);
      await expect(isolatedPool.query(
        `DELETE FROM case_versions WHERE id = 'draft_v1'`
      )).rejects.toThrow(/immutable/);
      await expect(isolatedPool.query(
        `UPDATE cases SET current_version_id = NULL WHERE id = 'versioned_case'`
      )).resolves.toBeDefined();
    });
  });
});

describe('Admin content CMS', () => {
  const validContent = {
    title: 'Admin-managed profitability case',
    type: 'Profitability',
    sector: 'Retail',
    difficulty: 'Standard',
    description: 'An admin-authored case description with enough detail to satisfy the content contract rules.',
    exhibits: 'Chart 1: revenue bridge',
    deliverables: ['Issue tree', 'Recommendation'],
    referenceRange: null,
    referenceSolution: 'Margins fell because of shrink and mix; fix shrink first, then renegotiate supply terms.',
    rubricCriteria: [{ name: 'Structure', description: 'MECE issue tree covering revenue and cost drivers.' }],
    contentOwner: 'Cracked content team',
    authorCredit: 'Written by the Cracked team',
    sourceKind: 'original',
    sourceReference: null,
    rightsDeclaration: 'Original work created for Cracked; all rights reserved by the platform.',
    rightsConfirmed: true,
  };

  const setAdminEnv = (userId: string): (() => void) => {
    const previous = process.env.ADMIN_USER_IDS;
    process.env.ADMIN_USER_IDS = [previous, userId].filter(Boolean).join(',');
    return () => {
      if (previous === undefined) delete process.env.ADMIN_USER_IDS;
      else process.env.ADMIN_USER_IDS = previous;
    };
  };

  it('rejects students and anonymous users from every admin content endpoint', async () => {
    const studentAgent = request.agent(app);
    await registerTestUser(studentAgent, 'cms_student');
    const anonymous = request.agent(app);

    for (const [agent, expected] of [[studentAgent, 403], [anonymous, 401]] as const) {
      expect((await agent.get('/api/admin/content')).status).toBe(expected);
      expect((await agent.post('/api/admin/content').send(validContent)).status).toBe(expected);
      expect((await agent.put('/api/admin/content/case_x').send(validContent)).status).toBe(expected);
      expect((await agent.post('/api/admin/content/case_x/publish')).status).toBe(expected);
      expect((await agent.post('/api/admin/content/case_x/unpublish')).status).toBe(expected);
      expect((await agent.get('/api/admin/content/case_x/versions')).status).toBe(expected);
    }
  });

  it('creates drafts invisible to the public, publishes atomically, and isolates draft edits', async () => {
    const adminAgent = request.agent(app);
    const admin = await registerTestUser(adminAgent, 'cms_admin');
    const restoreAdmin = setAdminEnv(admin.id);
    try {
    const me = await adminAgent.get('/api/auth/me');
    expect(me.body.user.accessRole).toBe('Admin');

    // Create draft.
    const create = await adminAgent.post('/api/admin/content').send(validContent);
    expect(create.status).toBe(201);
    const caseId = create.body.caseId as string;

    // Draft is hidden from public reads.
    expect((await request(app).get('/api/cases')).body.map((c: { id: string }) => c.id)).not.toContain(caseId);
    expect((await request(app).get(`/api/cases/${caseId}`)).status).toBe(404);

    // Admin list shows it as Draft; detail returns the draft payload.
    const list = await adminAgent.get('/api/admin/content?status=Draft');
    expect(list.body.content.map((item: { id: string }) => item.id)).toContain(caseId);
    const detail = await adminAgent.get(`/api/admin/content/${caseId}`);
    expect(detail.body.draft.title).toBe(validContent.title);
    expect(detail.body.published).toBeNull();

    // Preview validates without persisting.
    const badPreview = await adminAgent.post('/api/admin/content/preview').send({ ...validContent, title: 'no' });
    expect(badPreview.status).toBe(400);
    const goodPreview = await adminAgent.post('/api/admin/content/preview').send(validContent);
    expect(goodPreview.status).toBe(200);
    expect(goodPreview.body.content.title).toBe(validContent.title);

    // Publish.
    const publish = await adminAgent.post(`/api/admin/content/${caseId}/publish`);
    expect(publish.status).toBe(200);
    expect(publish.body.versionNumber).toBe(1);

    // Public reads now expose the published projection + version fields.
    const publicList = await request(app).get('/api/cases');
    expect(publicList.body.map((c: { id: string }) => c.id)).toContain(caseId);
    const publicDetail = await request(app).get(`/api/cases/${caseId}`);
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.reference_solution).toContain('Margins fell');
    expect(publicDetail.body.content_owner).toBe('Cracked content team');
    expect(publicDetail.body.version_number).toBe(1);

    // Audit log recorded inside the publish transaction.
    const audit = await pool.query(
      `SELECT action, target_id FROM admin_audit_logs
       WHERE target_id = $1 AND action = 'content.published'`,
      [caseId]
    );
    expect(audit.rows).toHaveLength(1);

    // Editing a published case creates a new draft; public content is unchanged.
    const edit = await adminAgent.put(`/api/admin/content/${caseId}`).send({
      ...validContent,
      title: 'Admin-managed profitability case v2',
      referenceSolution: 'Updated solution text that is long enough to satisfy the minimum length rule.',
    });
    expect(edit.status).toBe(200);
    expect(edit.body.versionNumber).toBe(2);
    const stillV1 = await request(app).get(`/api/cases/${caseId}`);
    expect(stillV1.body.title).toBe(validContent.title);
    expect(stillV1.body.reference_solution).toContain('Margins fell');

    // Version history shows draft v2 + published v1.
    const versions = await adminAgent.get(`/api/admin/content/${caseId}/versions`);
    expect(versions.body.versions).toHaveLength(2);
    expect(versions.body.versions.map((v: { status: string }) => v.status).sort()).toEqual(['Draft', 'Published']);

    // Publish v2; pointer moves, v1 stays immutable history.
    const republish = await adminAgent.post(`/api/admin/content/${caseId}/publish`);
    expect(republish.status).toBe(200);
    expect(republish.body.versionNumber).toBe(2);
    const nowV2 = await request(app).get(`/api/cases/${caseId}`);
    expect(nowV2.body.title).toBe('Admin-managed profitability case v2');
    expect(nowV2.body.version_number).toBe(2);
    const history = await pool.query(
      `SELECT version_number, status FROM case_versions WHERE case_id = $1 ORDER BY version_number`,
      [caseId]
    );
    expect(history.rows).toEqual([
      { version_number: 1, status: 'Published' },
      { version_number: 2, status: 'Published' },
    ]);

    // Unpublish hides content but preserves history.
    const unpublish = await adminAgent.post(`/api/admin/content/${caseId}/unpublish`);
    expect(unpublish.status).toBe(200);
    expect((await request(app).get(`/api/cases/${caseId}`)).status).toBe(404);
    expect((await request(app).get('/api/cases')).body.map((c: { id: string }) => c.id)).not.toContain(caseId);
    const afterUnpublish = await pool.query(
      `SELECT COUNT(*)::text AS count FROM case_versions WHERE case_id = $1`,
      [caseId]
    );
    expect(afterUnpublish.rows[0].count).toBe('2');
    const unpublishAudit = await pool.query(
      `SELECT action FROM admin_audit_logs WHERE target_id = $1 AND action = 'content.unpublished'`,
      [caseId]
    );
    expect(unpublishAudit.rows).toHaveLength(1);
    // Second unpublish is rejected.
    expect((await adminAgent.post(`/api/admin/content/${caseId}/unpublish`)).status).toBe(409);
    } finally {
      restoreAdmin();
    }
  });

  it('rejects publishing an invalid stored draft without changing state', async () => {
    const adminAgent = request.agent(app);
    const admin = await registerTestUser(adminAgent, 'cms_admin_invalid');
    const restoreAdmin = setAdminEnv(admin.id);
    try {
    const create = await adminAgent.post('/api/admin/content').send(validContent);
    const caseId = create.body.caseId as string;
    // Corrupt the draft directly, bypassing API validation.
    await pool.query(`UPDATE case_versions SET title = 'x' WHERE case_id = $1 AND status = 'Draft'`, [caseId]);

    const publish = await adminAgent.post(`/api/admin/content/${caseId}/publish`);
    expect(publish.status).toBe(422);
    const state = await pool.query(
      `SELECT v.status AS version_status, c.current_version_id
       FROM case_versions v, cases c WHERE v.case_id = c.id AND c.id = $1`,
      [caseId]
    );
    expect(state.rows[0]).toEqual({ version_status: 'Draft', current_version_id: null });
    } finally {
      restoreAdmin();
    }
  });

  it('rolls back publish when the audit write fails', async () => {
    const adminAgent = request.agent(app);
    const admin = await registerTestUser(adminAgent, 'cms_admin_rollback');
    const restoreAdmin = setAdminEnv(admin.id);
    try {
    const create = await adminAgent.post('/api/admin/content').send(validContent);
    const caseId = create.body.caseId as string;
    await adminAgent.post(`/api/admin/content/${caseId}/publish`);

    // Create a second draft, then force a mid-transaction failure by using a
    // nonexistent actor id (audit actor FK violation) at the service layer.
    await adminAgent.put(`/api/admin/content/${caseId}`).send({
      ...validContent,
      title: 'Rollback test content title',
    });
    const { contentService } = await import('./contentService.js');
    await expect(contentService.publishContent('ghost_user', caseId)).rejects.toThrow();

    const state = await pool.query(
      `SELECT v.version_number, v.status, c.current_version_id
       FROM case_versions v JOIN cases c ON c.id = v.case_id
       WHERE v.case_id = $1 ORDER BY v.version_number`,
      [caseId]
    );
    // v1 still published pointer; v2 draft untouched; no partial publish.
    expect(state.rows).toEqual([
      { version_number: 1, status: 'Published', current_version_id: expect.any(String) },
      { version_number: 2, status: 'Draft', current_version_id: expect.any(String) },
    ]);
    } finally {
      restoreAdmin();
    }
  });

  it('keeps legacy proposal records readable while blocking new proposals and approval publishing', async () => {
    const agent = request.agent(app);
    await registerTestUser(agent, 'legacy_proposer');

    const submit = await agent.post('/api/case-proposals').send({ title: 'x' });
    expect(submit.status).toBe(410);

    // Historical proposals remain listable for their owner.
    const mine = await agent.get('/api/case-proposals/mine');
    expect(mine.status).toBe(200);
    expect(mine.body.proposals).toEqual([]);

    // Moderation approve no longer publishes; non-admins are still blocked.
    const moderatorAgent = request.agent(app);
    const moderator = await registerTestUser(moderatorAgent, 'legacy_mod');
    const previousMods = process.env.CASE_MODERATOR_USER_IDS;
    process.env.CASE_MODERATOR_USER_IDS = [previousMods, moderator.id].filter(Boolean).join(',');
    try {
      const approve = await moderatorAgent
        .patch('/api/moderation/case-proposals/proposal_x')
        .send({ action: 'approve', notes: '' });
      expect(approve.status).toBe(410);
      const decline = await moderatorAgent
        .patch('/api/moderation/case-proposals/proposal_x')
        .send({ action: 'decline', notes: 'Historical record cleanup only.' });
      expect([404, 409]).toContain(decline.status);
    } finally {
      if (previousMods === undefined) delete process.env.CASE_MODERATOR_USER_IDS;
      else process.env.CASE_MODERATOR_USER_IDS = previousMods;
    }
  });
});

describe('Casebook routes', () => {
  it('returns only published casebooks and hides unpublished details and private metadata', async () => {
    const { id: uploaderId } = await registerTestUser(request.agent(app), 'catalog_owner');
    const token = randomUUID();
    const publishedId = `casebook_test_${randomUUID()}`;
    const pendingSlug = `private-${token}`;
    const publishedSlug = `public-${token}`;
    await insertTestBook(`casebook_test_${randomUUID()}`, uploaderId, pendingSlug, 'Pending');
    await insertTestBook(publishedId, uploaderId, publishedSlug, 'Published');

    const list = await request(app).get(`/api/casebooks?search=${token}`);
    expect(list.status).toBe(200);
    expect(list.body.casebooks.map((book: { slug: string }) => book.slug)).toEqual([publishedSlug]);
    expect(list.body.casebooks[0]).not.toHaveProperty('uploaderId');
    expect(list.body.casebooks[0]).not.toHaveProperty('moderatorNotes');
    expect((await request(app).get(`/api/casebooks/${pendingSlug}`)).status).toBe(404);
    expect((await request(app).get(`/api/casebooks/${pendingSlug}/cases/test-case`)).status).toBe(404);

    const detail = await request(app).get(`/api/casebooks/${publishedSlug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.casebook.cases[0]).not.toHaveProperty('body');
    const caseDetail = await request(app).get(`/api/casebooks/${publishedSlug}/cases/test-case`);
    expect(caseDetail.status).toBe(200);
    expect(caseDetail.body.caseItem.body).toBe('Test body text.');
  });

  it('restricts casebook reads and changes-requested updates to the owner', async () => {
    const ownerAgent = request.agent(app);
    const owner = await registerTestUser(ownerAgent, 'casebook_owner');
    const other = await registerTestUser(request.agent(app), 'casebook_other');
    const id = `casebook_test_${randomUUID()}`;
    const ownerBookId = `casebook_test_${randomUUID()}`;
    await insertTestBook(id, other.id, `owner-check-${randomUUID()}`, 'Changes_Requested');
    await insertTestBook(ownerBookId, owner.id, `owner-edit-${randomUUID()}`, 'Changes_Requested');

    expect((await ownerAgent.get(`/api/casebooks/mine/${id}`)).status).toBe(404);
    const input = {
      title: 'Valid revised casebook',
      sourceOrg: 'Contributor',
      sourceKind: 'original',
      year: 2025,
      description: 'A valid test casebook description for update authorization.',
      licenseKind: 'original',
      permissionReference: 'Written by the contributor.',
      externalUrl: '',
      industries: ['Retail'],
      cases: [{
        title: 'A valid case',
        sector: 'Retail',
        caseType: 'Market Entry',
        difficulty: 'Standard',
        summary: 'A valid summary for the casebook update.',
        position: 0,
      }],
      rightsConfirmed: true,
      attributionConfirmed: true,
    };
    const update = await ownerAgent.put(`/api/casebooks/${id}`).send(input);
    expect(update.status).toBe(409);
    const ownerUpdate = await ownerAgent.put(`/api/casebooks/${ownerBookId}`).send(input);
    expect(ownerUpdate.status).toBe(200);
    expect(ownerUpdate.body.casebook.status).toBe('Pending');
    expect(owner.id).not.toBe(other.id);
  });

  it('requires moderator allowlisting for the moderation queue', async () => {
    const previousModeratorEmails = process.env.CASE_MODERATOR_EMAILS;
    const previousModeratorIds = process.env.CASE_MODERATOR_USER_IDS;
    const normalAgent = request.agent(app);
    const normal = await registerTestUser(normalAgent, 'casebook_normal');
    const moderatorAgent = request.agent(app);
    const moderator = await registerTestUser(moderatorAgent, 'casebook_moderator');
    process.env.CASE_MODERATOR_EMAILS = moderator.email;
    delete process.env.CASE_MODERATOR_USER_IDS;
    try {
      expect((await request(app).get('/api/moderation/casebooks')).status).toBe(401);
      expect((await normalAgent.get('/api/moderation/casebooks')).status).toBe(403);
      expect((await moderatorAgent.get('/api/moderation/casebooks')).status).toBe(403);
      process.env.CASE_MODERATOR_USER_IDS = moderator.id;
      expect((await moderatorAgent.get('/api/moderation/casebooks')).status).toBe(200);
    } finally {
      if (previousModeratorEmails === undefined) delete process.env.CASE_MODERATOR_EMAILS;
      else process.env.CASE_MODERATOR_EMAILS = previousModeratorEmails;
      if (previousModeratorIds === undefined) delete process.env.CASE_MODERATOR_USER_IDS;
      else process.env.CASE_MODERATOR_USER_IDS = previousModeratorIds;
      expect(normal.id).not.toBe(moderator.id);
    }
  });
});

describe('Image upload route', () => {
  it('requires a signed-in user and returns the Cloudinary image URL', async () => {
    const image = Buffer.from('test image');
    const anonymousResponse = await request(app)
      .post('/api/upload/image')
      .attach('image', image, { filename: 'case.png', contentType: 'image/png' });
    expect(anonymousResponse.status).toBe(401);

    const agent = request.agent(app);
    await registerTestUser(agent, 'image_upload');
    uploadImageBufferMock.mockResolvedValue({
      url: 'https://images.example.test/case.png',
      publicId: 'caseforge/case',
    });
    const response = await agent
      .post('/api/upload/image')
      .attach('image', image, { filename: 'case.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      url: 'https://images.example.test/case.png',
      publicId: 'caseforge/case',
    });
    expect(uploadImageBufferMock).toHaveBeenCalledWith(image, 'caseforge');
  });
});

describe('Auth endpoints', () => {
  it('signup creates a user and sets a session cookie', async () => {
    const agent = request.agent(app);
    const res = await agent
      .post('/api/auth/register')
      .send({
        username: 'testuser_' + Date.now(),
        name: 'Test User',
        email: `testuser_${Date.now()}@test.cracked.local`,
        password: 'SecurePass123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  });

  it('signup rejects duplicate email', async () => {
    const email = `dupe_${Date.now()}@test.cracked.local`;
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      username: `dupeuser_${Date.now()}`,
      name: 'Dup User',
      email,
      password: 'SecurePass123!',
    });

    const res = await agent.post('/api/auth/register').send({
      username: `dupeuser2_${Date.now()}`,
      name: 'Dup User 2',
      email,
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('signup rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `shortuser_${Date.now()}`,
        name: 'Short',
        email: `short_${Date.now()}@test.cracked.local`,
        password: 'short',
      });

    expect(res.status).toBe(400);
  });

  it('login succeeds with correct credentials', async () => {
    const email = `loginuser_${Date.now()}@test.cracked.local`;
    const username = `loginuser_${Date.now()}`;
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      username, name: 'Login User', email, password: 'SecurePass123!',
    });

    const res = await agent.post('/api/auth/login').send({ email, password: 'SecurePass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('login rejects wrong password', async () => {
    const email = `wrongpw_${Date.now()}@test.cracked.local`;
    const username = `wrongpw_${Date.now()}`;
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      username, name: 'Wrong PW', email, password: 'SecurePass123!',
    });

    const res = await agent.post('/api/auth/login').send({ email, password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
  });

  it('/me returns user when authenticated', async () => {
    const email = `meuser_${Date.now()}@test.cracked.local`;
    const username = `meuser_${Date.now()}`;
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      username, name: 'Me User', email, password: 'SecurePass123!',
    });
    await agent.post('/api/auth/login').send({ email, password: 'SecurePass123!' });

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe(email);
  });

  it('/me returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logout destroys session', async () => {
    const email = `logoutuser_${Date.now()}@test.cracked.local`;
    const username = `logoutuser_${Date.now()}`;
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      username, name: 'Logout User', email, password: 'SecurePass123!',
    });
    await agent.post('/api/auth/login').send({ email, password: 'SecurePass123!' });

    const meBefore = await agent.get('/api/auth/me');
    expect(meBefore.status).toBe(200);

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const meAfter = await agent.get('/api/auth/me');
    expect(meAfter.status).toBe(401);
  });

  it('does not allow public registration to assign Admin privileges', async () => {
    const agent = request.agent(app);
    const suffix = randomUUID();
    const response = await agent.post('/api/auth/register').send({
      username: `role_${suffix}`,
      name: 'Role escalation test',
      email: `role_${suffix}@test.cracked.local`,
      password: 'SecurePass123!',
      role: 'Admin',
      accessRole: 'Admin',
    });
    expect(response.status).toBe(201);
    expect(response.body.user.accessRole).toBe('Student');
    expect((await agent.get('/api/admin/accounts')).status).toBe(403);
  });

  it('updates only the authenticated user profile and validates account input', async () => {
    const agent = request.agent(app);
    const { email } = await registerTestUser(agent, 'profile_owner');
    const updated = await agent.put('/api/account/profile').send({
      username: `updated_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
      name: 'Updated Name',
      bio: 'A short profile bio.',
      email: 'attacker@example.test',
      accessRole: 'Admin',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.profile.name).toBe('Updated Name');
    expect(updated.body.profile.email).toBe(email);
    expect(updated.body.profile).not.toHaveProperty('passwordHash');
    expect((await request(app).get('/api/account/profile')).status).toBe(401);
    expect((await agent.put('/api/account/profile').send({ username: 'x', name: '', bio: null })).status).toBe(400);
  });

  it('changes the password only after verification and invalidates other sessions', async () => {
    const primaryAgent = request.agent(app);
    const { email } = await registerTestUser(primaryAgent, 'password_change');
    const secondAgent = request.agent(app);
    expect((await secondAgent.post('/api/auth/login').send({
      email, password: 'SecurePass123!',
    })).status).toBe(200);

    expect((await primaryAgent.post('/api/account/password').send({
      currentPassword: 'wrong-password', newPassword: 'AnotherSecurePass123!',
    })).status).toBe(400);
    expect((await primaryAgent.get('/api/auth/me')).status).toBe(200);
    expect((await primaryAgent.post('/api/account/password').send({
      currentPassword: 'SecurePass123!', newPassword: 'AnotherSecurePass123!',
    })).status).toBe(200);
    expect((await primaryAgent.get('/api/auth/me')).status).toBe(200);
    expect((await secondAgent.get('/api/auth/me')).status).toBe(401);
    expect((await request.agent(app).post('/api/auth/login').send({
      email, password: 'AnotherSecurePass123!',
    })).status).toBe(200);
  });

  it('restricts admin APIs and audits account suspension while invalidating sessions', async () => {
    const previousAdminIds = process.env.ADMIN_USER_IDS;
    const adminAgent = request.agent(app);
    const admin = await registerTestUser(adminAgent, 'admin_operator');
    const studentAgent = request.agent(app);
    const student = await registerTestUser(studentAgent, 'suspend_target');
    const secondSession = request.agent(app);
    expect((await secondSession.post('/api/auth/login').send({
      email: student.email, password: 'SecurePass123!',
    })).status).toBe(200);
    process.env.ADMIN_USER_IDS = [previousAdminIds, admin.id].filter(Boolean).join(',');
    try {
      expect((await request(app).get('/api/admin/accounts')).status).toBe(401);
      expect((await studentAgent.get('/api/admin/accounts')).status).toBe(403);
      expect((await adminAgent.get('/api/admin/accounts')).status).toBe(200);
      expect((await adminAgent.patch(`/api/admin/accounts/${admin.id}/status`)
        .send({ status: 'suspended' })).status).toBe(409);

      expect((await adminAgent.patch(`/api/admin/accounts/${student.id}/status`)
        .send({ status: 'suspended' })).status).toBe(200);
      expect((await studentAgent.get('/api/auth/me')).status).toBe(401);
      expect((await secondSession.get('/api/auth/me')).status).toBe(401);
      expect((await studentAgent.post('/api/auth/login').send({
        email: student.email, password: 'SecurePass123!',
      })).status).toBe(401);
      expect((await adminAgent.patch(`/api/admin/accounts/${student.id}/status`)
        .send({ status: 'active' })).status).toBe(200);
      const logs = await adminAgent.get('/api/admin/audit-logs');
      expect(logs.body.logs.some((entry: { action: string; targetId: string }) =>
        entry.action === 'account.suspended' && entry.targetId === student.id
      )).toBe(true);
      expect(logs.body.logs.some((entry: { action: string; actorId: string }) =>
        entry.action === 'account.status_change_rejected' && entry.actorId === admin.id
      )).toBe(true);
    } finally {
      if (previousAdminIds === undefined) delete process.env.ADMIN_USER_IDS;
      else process.env.ADMIN_USER_IDS = previousAdminIds;
    }
  });

  it('rejects invalid and expired OAuth state before exchanging credentials', async () => {
    const agent = request.agent(app);
    const start = await agent.get('/api/auth/github');
    expect(start.status).toBe(200);
    const { state } = start.body as { state: string };
    expect((await agent.post('/api/auth/github/callback').send({ code: 'code', state: 'wrong' })).status).toBe(403);
    await pool.query(
      `UPDATE sessions SET sess = jsonb_set(sess, '{oauthState,createdAt}', to_jsonb($1::bigint))
       WHERE sess #>> '{oauthState,state}' = $2`,
      [Date.now() - 11 * 60 * 1000, state]
    );
    expect((await agent.post('/api/auth/github/callback').send({ code: 'code', state })).status).toBe(403);
  });

  it('rolls back account suspension if its audit record cannot be written', async () => {
    const previousAdminIds = process.env.ADMIN_USER_IDS;
    const admin = await registerTestUser(request.agent(app), 'audit_rollback_admin');
    const target = await registerTestUser(request.agent(app), 'audit_rollback_target');
    process.env.ADMIN_USER_IDS = [previousAdminIds, admin.id].filter(Boolean).join(',');
    const constraint = `audit_failure_${randomUUID().replace(/-/g, '')}`;
    await pool.query(
      `ALTER TABLE admin_audit_logs ADD CONSTRAINT "${constraint}"
       CHECK (action <> 'account.suspended')`
    );
    try {
      const adminAgent = request.agent(app);
      expect((await adminAgent.post('/api/auth/login').send({
        email: admin.email, password: 'SecurePass123!',
      })).status).toBe(200);
      expect((await adminAgent.patch(`/api/admin/accounts/${target.id}/status`)
        .send({ status: 'suspended' })).status).toBe(500);
      const account = await pool.query<{ is_active: boolean }>(
        'SELECT is_active FROM users WHERE id = $1',
        [target.id]
      );
      expect(account.rows[0].is_active).toBe(true);
      const failedAttempt = await pool.query(
        `SELECT action FROM admin_audit_logs
         WHERE actor_id = $1 AND action = 'account.status_change_failed'`,
        [admin.id]
      );
      expect(failedAttempt.rows).toHaveLength(1);
    } finally {
      await pool.query(`ALTER TABLE admin_audit_logs DROP CONSTRAINT "${constraint}"`);
      if (previousAdminIds === undefined) delete process.env.ADMIN_USER_IDS;
      else process.env.ADMIN_USER_IDS = previousAdminIds;
    }
  });
});
