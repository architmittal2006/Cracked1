import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app, ensureTables } from './server.js';
import { Pool } from 'pg';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL is required for tests');
}

let pool: Pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_DATABASE_URL });
  await ensureTables();
});

afterAll(async () => {
  await pool.query("DELETE FROM casebooks WHERE id LIKE 'casebook_test_%'");
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.cracked.local'");
  await pool.end();
});

beforeEach(async () => {
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
    const previousModerators = process.env.CASE_MODERATOR_EMAILS;
    const normalAgent = request.agent(app);
    const normal = await registerTestUser(normalAgent, 'casebook_normal');
    const moderatorAgent = request.agent(app);
    const moderator = await registerTestUser(moderatorAgent, 'casebook_moderator');
    process.env.CASE_MODERATOR_EMAILS = moderator.email;
    try {
      expect((await request(app).get('/api/moderation/casebooks')).status).toBe(401);
      expect((await normalAgent.get('/api/moderation/casebooks')).status).toBe(403);
      expect((await moderatorAgent.get('/api/moderation/casebooks')).status).toBe(200);
    } finally {
      if (previousModerators === undefined) delete process.env.CASE_MODERATOR_EMAILS;
      else process.env.CASE_MODERATOR_EMAILS = previousModerators;
      expect(normal.id).not.toBe(moderator.id);
    }
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
});
