import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './server.js';
import { Pool } from 'pg';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL is required for tests');
}

let pool: Pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: TEST_DATABASE_URL });
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.cracked.local'");
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
