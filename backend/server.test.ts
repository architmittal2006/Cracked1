import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
