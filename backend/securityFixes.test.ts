import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock DB and external calls
vi.mock('./dbService.js', () => ({
  DatabaseService: {
    upsertOAuthUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    getAccountProfile: vi.fn(),
    updateAccountProfile: vi.fn(),
    changePassword: vi.fn(),
    listAdminAccounts: vi.fn(),
    setAccountActive: vi.fn(),
    getAdminAuditLogs: vi.fn(),
    recordAdminAuditEvent: vi.fn().mockResolvedValue(undefined),
  },
  hashPassword: vi.fn().mockResolvedValue('hashed_pwd'),
  comparePassword: vi.fn().mockResolvedValue(true),
  InvalidCaseReviewError: class extends Error {},
}));

vi.mock('./db/index.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
  },
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [{ exists: 1 }] }),
  },
}));

describe('Security Regression Suite: OAuth & Session Fixation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    const { DatabaseService } = await import('./dbService.js');
    vi.mocked(DatabaseService.upsertOAuthUser).mockResolvedValue({
      id: 'oauth-user',
      username: 'oauthuser',
      name: 'Verified User',
      email: 'verified@example.test',
      passwordHash: '',
      credibilityScore: 0,
      solveScore: 0,
      reviewScore: 0,
      casesSolved: 0,
      mergeBonusCount: 0,
      isActive: true,
      sessionVersion: 0,
      role: 'General',
    });
    vi.mocked(DatabaseService.createUser).mockResolvedValue('password-user');
    vi.mocked(DatabaseService.getUserById).mockResolvedValue({
      id: 'password-user',
      username: 'passworduser',
      name: 'Password User',
      email: 'password@example.test',
      passwordHash: 'hashed_pwd',
      credibilityScore: 0,
      solveScore: 0,
      reviewScore: 0,
      casesSolved: 0,
      mergeBonusCount: 0,
      isActive: true,
      sessionVersion: 0,
      role: 'General',
    });
    vi.mocked(DatabaseService.getUserByEmail).mockResolvedValue({
      id: 'password-user',
      username: 'passworduser',
      name: 'Password User',
      email: 'password@example.test',
      passwordHash: 'hashed_pwd',
      credibilityScore: 0,
      solveScore: 0,
      reviewScore: 0,
      casesSolved: 0,
      mergeBonusCount: 0,
      isActive: true,
      sessionVersion: 0,
      role: 'General',
    });
    vi.mocked(DatabaseService.getAccountProfile).mockResolvedValue({
      id: 'password-user',
      username: 'passworduser',
      name: 'Password User',
      email: 'password@example.test',
      bio: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    vi.mocked(DatabaseService.listAdminAccounts).mockResolvedValue([]);
    vi.mocked(DatabaseService.getAdminAuditLogs).mockResolvedValue([]);
    vi.mocked(DatabaseService.setAccountActive).mockResolvedValue({
      id: 'target-user',
      username: 'targetuser',
      name: 'Target User',
      email: 'target@example.test',
      bio: null,
      isActive: false,
      createdAt: new Date().toISOString(),
    });
    process.env.SESSION_SECRET = 'test-secret-at-least-32-characters-long';
    process.env.DATABASE_URL = 'postgres://dummy:dummy@localhost:5432/test';
    process.env.GITHUB_CLIENT_ID = 'test_gh_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_gh_secret';
    process.env.GOOGLE_CLIENT_ID = 'test_google_id';
    process.env.GOOGLE_CLIENT_SECRET = 'test_google_secret';
    process.env.BASE_URL = 'https://cracked.test';
  });

  it('SEC-002: generates state parameter on /api/auth/github and /api/auth/google', async () => {
    const { app } = await import('./server.js');
    const ghRes = await request(app).get('/api/auth/github');
    expect(ghRes.status).toBe(200);
    expect(ghRes.body.state).toBeDefined();
    expect(ghRes.body.authUrl).toContain(`state=${ghRes.body.state}`);

    const googleRes = await request(app).get('/api/auth/google');
    expect(googleRes.status).toBe(200);
    expect(googleRes.body.state).toBeDefined();
    expect(googleRes.body.authUrl).toContain(`state=${googleRes.body.state}`);
  });

  it('requires authentication for account data and requires Admin access for admin APIs', async () => {
    const { app } = await import('./server.js');
    expect((await request(app).get('/api/account/profile')).status).toBe(401);
    expect((await request(app).get('/api/admin/accounts')).status).toBe(401);

    const student = request.agent(app);
    expect((await student.post('/api/auth/register').send({
      username: `student_${Date.now()}`,
      name: 'Student',
      email: `student_${Date.now()}@example.test`,
      password: 'SecurePass123!',
    })).status).toBe(201);
    expect((await student.get('/api/account/profile')).status).toBe(200);
    expect((await student.get('/api/admin/accounts')).status).toBe(403);

    const previousAdminIds = process.env.ADMIN_USER_IDS;
    process.env.ADMIN_USER_IDS = 'password-user';
    try {
      expect((await student.get('/api/auth/me')).body.user.accessRole).toBe('Admin');
      expect((await student.get('/api/admin/accounts')).status).toBe(200);
    } finally {
      if (previousAdminIds === undefined) delete process.env.ADMIN_USER_IDS;
      else process.env.ADMIN_USER_IDS = previousAdminIds;
    }
  });

  it('records rejected Admin requests without exposing submitted values', async () => {
    const { DatabaseService } = await import('./dbService.js');
    const { app } = await import('./server.js');
    const student = request.agent(app);
    await student.post('/api/auth/register').send({
      username: `audit_student_${Date.now()}`,
      name: 'Audit Student',
      email: `audit_student_${Date.now()}@example.test`,
      password: 'SecurePass123!',
    });

    expect((await student.get('/api/admin/accounts')).status).toBe(403);
    expect(DatabaseService.recordAdminAuditEvent).toHaveBeenCalledWith(
      expect.any(String),
      'admin.access_denied',
      'admin_operation',
      null,
      { reason: 'insufficient_role' }
    );
  });

  it('routes Admin suspension through the audited persistence operation and prevents self-suspension', async () => {
    const previousAdminIds = process.env.ADMIN_USER_IDS;
    process.env.ADMIN_USER_IDS = 'password-user';
    try {
      const { app } = await import('./server.js');
      const admin = request.agent(app);
      expect((await admin.post('/api/auth/register').send({
        username: `admin_${Date.now()}`,
        name: 'Admin',
        email: `admin_${Date.now()}@example.test`,
        password: 'SecurePass123!',
      })).status).toBe(201);
      const { DatabaseService } = await import('./dbService.js');

      expect((await admin.patch('/api/admin/accounts/password-user/status').send({ status: 'suspended' })).status).toBe(409);
      const result = await admin.patch('/api/admin/accounts/target-user/status').send({ status: 'suspended' });
      expect(result.status).toBe(200);
      expect(result.body.account.isActive).toBe(false);
      expect(DatabaseService.setAccountActive).toHaveBeenCalledWith('password-user', 'target-user', false);
    } finally {
      if (previousAdminIds === undefined) delete process.env.ADMIN_USER_IDS;
      else process.env.ADMIN_USER_IDS = previousAdminIds;
    }
  });

  it('fails authenticated API requests closed when account status cannot be checked', async () => {
    const { DatabaseService } = await import('./dbService.js');
    const { app } = await import('./server.js');
    const agent = request.agent(app);
    expect((await agent.post('/api/auth/register').send({
      username: `dbcheck_${Date.now()}`,
      name: 'DB Check',
      email: `dbcheck_${Date.now()}@example.test`,
      password: 'SecurePass123!',
    })).status).toBe(201);
    vi.mocked(DatabaseService.getUserById).mockRejectedValueOnce(new Error('database unavailable'));
    const response = await agent.get('/api/auth/me');
    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Authentication service unavailable');
  });

  it('SEC-002: rejects OAuth callbacks with mismatched state parameter', async () => {
    const { app } = await import('./server.js');
    const agent = request.agent(app);

    // Initialize flow to establish session with state
    const initRes = await agent.get('/api/auth/github');
    expect(initRes.status).toBe(200);
    expect(initRes.body.state).toBeDefined();

    // Send mismatched state
    const forgedRes = await agent
      .post('/api/auth/github/callback')
      .send({ code: 'valid_code', state: 'forged_csrf_state' });

    console.log('Forged response body:', forgedRes.body);
    expect(forgedRes.status).toBe(403);
    expect(forgedRes.body.error).toContain('OAuth state');
  });

  it('rejects missing and expired OAuth state, including in test mode', async () => {
    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const missing = await agent.post('/api/auth/github/callback').send({ code: 'code' });
    expect(missing.status).toBe(403);

    const now = Date.now();
    const init = await agent.get('/api/auth/google');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 11 * 60 * 1000);
    try {
      const expired = await agent.post('/api/auth/google/callback').send({
        code: 'code',
        state: init.body.state,
      });
      expect(expired.status).toBe(403);
    } finally {
      clock.mockRestore();
    }
  });

  it('SEC-003: Google OAuth URL uses BASE_URL rather than hardcoded localhost', async () => {
    const { app } = await import('./server.js');
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(200);
    expect(res.body.authUrl).toContain(encodeURIComponent('https://cracked.test/callback/google'));
  });

  it('SEC-02: rejects Google accounts without a verified email', async () => {
    const { DatabaseService } = await import('./dbService.js');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'google-token' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'google-user',
          email: 'moderator@example.test',
          verified_email: false,
          name: 'Unverified User',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const init = await agent.get('/api/auth/google');
    const response = await agent.post('/api/auth/google/callback').send({
      code: 'google-code',
      state: init.body.state,
    });

    expect(response.status).toBe(401);
    expect(DatabaseService.upsertOAuthUser).not.toHaveBeenCalled();
  });

  it('SEC-02: rejects GitHub identities without any verified email', async () => {
    const { DatabaseService } = await import('./dbService.js');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'github-token' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 7, login: 'unverified-user', email: 'moderator@example.test' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ email: 'moderator@example.test', primary: true, verified: false }]),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const init = await agent.get('/api/auth/github');
    const response = await agent.post('/api/auth/github/callback').send({
      code: 'github-code',
      state: init.body.state,
    });
    expect(response.status).toBe(401);
    expect(response.status).toBe(401);
    expect(DatabaseService.upsertOAuthUser).not.toHaveBeenCalled();
  });

  it('SEC-02: continues Google login with its verified email', async () => {
    const { DatabaseService } = await import('./dbService.js');
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'google-token' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'google-user',
          email: 'verified@example.test',
          verified_email: true,
          name: 'Verified User',
        }),
      }));

    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const init = await agent.get('/api/auth/google');
    const response = await agent.post('/api/auth/google/callback').send({
      code: 'google-code',
      state: init.body.state,
    });

    expect(response.status).toBe(200);
    expect(DatabaseService.upsertOAuthUser).toHaveBeenCalledWith({
      email: 'verified@example.test',
      name: 'Verified User',
      preferredUsername: 'verified',
    });
  });

  it('SEC-02: continues GitHub login using a verified account email', async () => {
    const { DatabaseService } = await import('./dbService.js');
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'github-token' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 7, login: 'verified-user', name: 'Verified User' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { email: 'unverified@example.test', primary: true, verified: false },
          { email: 'verified@example.test', primary: false, verified: true },
        ]),
      }));

    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const init = await agent.get('/api/auth/github');
    const response = await agent.post('/api/auth/github/callback').send({
      code: 'github-code',
      state: init.body.state,
    });

    expect(response.status).toBe(200);
    expect(DatabaseService.upsertOAuthUser).toHaveBeenCalledWith({
      email: 'verified@example.test',
      name: 'Verified User',
      preferredUsername: 'verified-user',
    });
  });

  it('SEC-004: regenerates the session on password registration', async () => {
    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const initialSession = await agent.get('/api/auth/github');
    const initialCookie = initialSession.headers['set-cookie'][0];
    const registration = await agent.post('/api/auth/register').send({
      username: 'passworduser',
      name: 'Password User',
      email: 'password@example.test',
      password: 'SecurePass123!',
    });

    expect(registration.status).toBe(201);
    expect(registration.headers['set-cookie'][0]).not.toBe(initialCookie);
  });

  it('SEC-004: regenerates the session on password login', async () => {
    const { app } = await import('./server.js');
    const agent = request.agent(app);
    const initialSession = await agent.get('/api/auth/github');
    const initialCookie = initialSession.headers['set-cookie'][0];
    const login = await agent.post('/api/auth/login').send({
      email: 'password@example.test',
      password: 'SecurePass123!',
    });

    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'][0]).not.toBe(initialCookie);
  });
});
