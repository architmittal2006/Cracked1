import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import pgStoreFactory from 'connect-pg-simple';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { Pool } from 'pg';
import { assertMigrationsCurrent } from './db/runMigrations.js';
import { logError } from './logging.js';
import { hasCapability, isAdminUser, isCaseModeratorUser, type Capability } from './authorization.js';
import { caseContentSchema } from './contentValidation.js';
import { contentService, ContentError } from './contentService.js';
import {
  DatabaseService,
  hashPassword,
  comparePassword,
  InvalidCaseReviewError,
  type CasebookReviewAction,
  type UserRecord,
} from './dbService.js';
import { VerificationEngine } from './verificationEngine.js';
import {
  casebookFiltersSchema,
  casebookInputSchema,
  casebookReviewSchema,
  takedownRequestSchema,
} from './casebookValidation.js';
import { imageUpload, uploadImageBuffer } from './cloudinary.js';

// Extend Session type to include user
declare module 'express-session' {
  interface SessionData {
    oauthState?: { provider: string; state: string; createdAt: number };
    user?: {
      id: string;
      username: string;
      name: string;
      email: string;
      credibilityScore?: number;
      solveScore?: number;
      reviewScore?: number;
      casesSolved?: number;
      mergeBonusCount?: number;
      role?: string;
      accessRole?: 'Student' | 'Admin';
      sessionVersion: number;
    };
  }
}

const app = express();

app.set('trust proxy', 1);

// Database connection pool (for session store)
if (!process.env.DATABASE_URL) {
  console.error(
    'FATAL: DATABASE_URL environment variable is not set. ' +
    'Provide a PostgreSQL connection string (Render Postgres, Neon, or Supabase).'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const accountSecurityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many account security attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const pgStore = pgStoreFactory(session);
const sessionStore = process.env.NODE_ENV === 'test' &&
  process.env.TEST_USE_POSTGRES_SESSION_STORE !== 'true'
  ? undefined
  : new pgStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: false,
    });

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'sha256-qGEUyB6Ds0lf5oSj60qBEjHS3V/KoV/VweT/XzX6cO4='", "'sha256-3/q7qK2gWF+ms1j+yvqKhvngnfLykmLW5oaI/2cfX9E='", "'sha256-DK4jGptP89FUdtN98kt9ok6Gdn6/0t080BU3hBOggf0='"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));

// CORS — allow configured client origin to call the API with credentials
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use((_req: Request, res: Response, next: NextFunction) => {
  const origin = _req.get('origin');
  if (origin === CLIENT_ORIGIN) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.vary('Origin');
  }
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 20,
  message: { success: false, error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zod validation schemas
const signupSchema = z.object({
  username: z.string().trim().min(3).max(100),
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(256),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});

const profileUpdateSchema = z.object({
  username: z.string().trim().min(3).max(100),
  name: z.string().trim().min(1).max(255),
  bio: z.string().trim().max(500).nullable(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256),
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: 'Choose a new password different from your current password',
  path: ['newPassword'],
});

const accountStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

const caseProposalReviewSchema = z.object({
  action: z.enum(['approve', 'request_changes', 'decline']),
  notes: z.string().trim().max(3000).optional().default(''),
}).refine(
  (review) => review.action === 'approve' || review.notes.length >= 10,
  { message: 'Add at least 10 characters of feedback for this decision', path: ['notes'] }
);

const caseReviewSchema = z.object({
  caseId: z.string().min(1),
  problem_framing: z.number().int().min(1).max(5),
  framework_fit: z.number().int().min(1).max(5),
  data_integrity: z.number().int().min(1).max(5),
  insight_depth: z.number().int().min(1).max(5),
  feasibility: z.number().int().min(1).max(5),
  feedback: z.string().trim().min(80).max(3000),
});
const guesstimateReviewSchema = z.object({
  caseId: z.string().min(1),
  structure: z.number().int().min(1).max(5),
  assumption_quality: z.number().int().min(1).max(5),
  math_accuracy: z.number().int().min(1).max(5),
  sanity_check: z.number().int().min(1).max(5),
  clarity: z.number().int().min(1).max(5),
  feedback: z.string().trim().min(80).max(3000),
});

const isValidOAuthState = (
  req: Request,
  provider: 'github' | 'google',
  state: unknown
): boolean => {
  const saved = req.session.oauthState;
  const now = Date.now();
  return typeof state === 'string' &&
    saved?.provider === provider &&
    saved.state === state &&
    saved.createdAt <= now &&
    now - saved.createdAt <= 10 * 60 * 1000;
};

const caseProposalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'You have reached the hourly proposal limit. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const casebookProposalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'You have reached the hourly casebook limit. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const takedownLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'You have reached the hourly report limit. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === 'production' &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('SESSION_SECRET must be set to at least 32 characters in production');
}

// Session configuration with PostgreSQL-backed store
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'development-only-session-secret',
  name: 'connect.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  },
}));

// Authentication middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const user = await DatabaseService.getUserById(req.session.user.id);
    if (!user || !user.isActive || user.sessionVersion !== req.session.user.sessionVersion) {
      req.session.destroy((error) => {
        if (error) logError('Could not invalidate inactive session', error);
      });
      res.clearCookie('connect.sid', { path: '/' });
      res.status(401).json({ success: false, error: 'Session is no longer valid' });
      return;
    }
    req.session.user.accessRole = isAdminUser(user.id) ? 'Admin' : 'Student';
    req.session.user.role = isCaseModeratorUser(user.id) ? 'Moderator' : (user.role || 'General');
    next();
  } catch (error) {
    logError('Authentication check failed', error);
    res.status(503).json({ success: false, error: 'Authentication service unavailable' });
  }
};

const requireCaseModerator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user || !hasCapability(req.session.user.id, 'case-proposals:moderate')) {
    res.status(403).json({ success: false, error: 'Moderator access is required' });
    return;
  }
  next();
};

async function recordRejectedAdminAction(
  actorId: string,
  action: string,
  reason: string
): Promise<void> {
  try {
    await DatabaseService.recordAdminAuditEvent(actorId, action, 'admin_operation', null, { reason });
  } catch (error) {
    logError('Could not record rejected admin action', error);
  }
}

const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.session.user || !hasCapability(req.session.user.id, 'admin:accounts:manage')) {
    if (req.session.user) {
      await recordRejectedAdminAction(req.session.user.id, 'admin.access_denied', 'insufficient_role');
    }
    res.status(403).json({ success: false, error: 'Admin access is required' });
    return;
  }
  next();
};

const requireCapability = (capability: Capability) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user || !hasCapability(req.session.user.id, capability)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };

function establishUserSession(req: Request, userRecord: UserRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.user = {
        id: userRecord.id,
        username: userRecord.username,
        name: userRecord.name,
        email: userRecord.email,
        credibilityScore: userRecord.credibilityScore ?? 0,
        solveScore: userRecord.solveScore ?? 0,
        reviewScore: userRecord.reviewScore ?? 0,
        casesSolved: userRecord.casesSolved ?? 0,
        mergeBonusCount: userRecord.mergeBonusCount ?? 0,
        role: isCaseModeratorUser(userRecord.id) ? 'Moderator' : (userRecord.role || 'General'),
        accessRole: isAdminUser(userRecord.id) ? 'Admin' : 'Student',
        sessionVersion: userRecord.sessionVersion,
      };
      req.session.save((saveError) => saveError ? reject(saveError) : resolve());
    });
  });
}

// GitHub OAuth endpoints
app.get('/api/auth/github', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const baseUrl = process.env.BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const state = crypto.randomUUID();
  req.session.oauthState = { provider: 'github', state, createdAt: Date.now() };
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });
  } catch (error) {
    logError('GitHub OAuth state persistence failed', error);
    res.status(503).json({ success: false, error: 'Could not start authentication' });
    return;
  }
  const githubAuthUrl = 'https://github.com/login/oauth/authorize?client_id=' +
    process.env.GITHUB_CLIENT_ID +
    '&redirect_uri=' + encodeURIComponent(baseUrl + '/callback/github') +
    '&scope=user:email&state=' + encodeURIComponent(state);
  res.json({ authUrl: githubAuthUrl, state });
});

app.post('/api/auth/github/callback', authLimiter, async (req: Request, res: Response) => {
  const { code, state } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Authorization code is required' });
    return;
  }

  if (!isValidOAuthState(req, 'github', state)) {
    res.status(403).json({ success: false, error: 'Invalid or expired OAuth state parameter' });
    return;
  }
  delete req.session.oauthState;

  try {
    const baseUrl = process.env.BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: baseUrl + '/callback/github',
      }),
    });

    const tokenData = await tokenResponse.json() as { error?: string; error_description?: string; access_token?: string };

    if (tokenData.error || !tokenData.access_token) {
      res.status(400).json({ success: false, error: tokenData.error_description || 'OAuth token exchange failed' });
      return;
    }

    // Get user info from GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    if (!userResponse.ok) {
      res.status(401).json({ success: false, error: 'GitHub authentication failed' });
      return;
    }

    const userData = await userResponse.json() as { id: number; login: string; name?: string };
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': 'Bearer ' + tokenData.access_token,
        'User-Agent': 'Cracked-Platform',
      },
    });
    if (!emailsResponse.ok) {
      res.status(401).json({ success: false, error: 'A verified GitHub email is required' });
      return;
    }
    const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
    const email = emails.find((item) => item.primary && item.verified)?.email
      || emails.find((item) => item.verified)?.email;
    if (!email) {
      res.status(401).json({ success: false, error: 'A verified GitHub email is required' });
      return;
    }
    const user = await DatabaseService.upsertOAuthUser({
      email,
      name: userData.name || userData.login,
      preferredUsername: userData.login,
    });
    if (!user.isActive) {
      res.status(401).json({ success: false, error: 'This account is unavailable' });
      return;
    }
    await establishUserSession(req, user);
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    logError('GitHub OAuth error', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// Google OAuth endpoints
app.get('/api/auth/google', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const baseUrl = process.env.BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const state = crypto.randomUUID();
  req.session.oauthState = { provider: 'google', state, createdAt: Date.now() };
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });
  } catch (error) {
    logError('Google OAuth state persistence failed', error);
    res.status(503).json({ success: false, error: 'Could not start authentication' });
    return;
  }
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' +
    process.env.GOOGLE_CLIENT_ID +
    '&redirect_uri=' + encodeURIComponent(baseUrl + '/callback/google') +
    '&response_type=code&scope=openid%20email%20profile&state=' + encodeURIComponent(state);
  res.json({ authUrl: googleAuthUrl, state });
});

app.post('/api/auth/google/callback', authLimiter, async (req: Request, res: Response) => {
  const { code, state } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Authorization code is required' });
    return;
  }

  if (!isValidOAuthState(req, 'google', state)) {
    res.status(403).json({ success: false, error: 'Invalid or expired OAuth state parameter' });
    return;
  }
  delete req.session.oauthState;

  try {
    const baseUrl = process.env.BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const redirectUri = baseUrl + '/callback/google';
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as { error?: string; error_description?: string; access_token?: string };

    if (tokenData.error || !tokenData.access_token) {
      res.status(400).json({ success: false, error: tokenData.error_description || 'OAuth token exchange failed' });
      return;
    }

    // Get user info from Google API
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    if (!userResponse.ok) {
      res.status(401).json({ success: false, error: 'Google authentication failed' });
      return;
    }

    const userData = await userResponse.json() as { id: string; name: string; email: string; verified_email?: boolean };
    if (!userData.email || userData.verified_email !== true) {
      res.status(401).json({ success: false, error: 'A verified Google email is required' });
      return;
    }
    const user = await DatabaseService.upsertOAuthUser({
      email: userData.email,
      name: userData.name,
      preferredUsername: userData.email.split('@')[0],
    });
    if (!user.isActive) {
      res.status(401).json({ success: false, error: 'This account is unavailable' });
      return;
    }
    await establishUserSession(req, user);
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    logError('Google OAuth error', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// Register (email/password)
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid input' });
    return;
  }
  const { username, name, email, password } = parse.data;

  try {
    const passwordHash = await hashPassword(password);
    const id = await DatabaseService.createUser({
      username,
      name,
      email,
      passwordHash,
    });

    const newUser = await DatabaseService.getUserById(id);
    if (!newUser) throw new Error('Registered user could not be loaded');
    await establishUserSession(req, newUser);
    res.status(201).json({ success: true, user: req.session.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Email already registered' || message === 'Username already taken' ||
      (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')) {
      res.status(400).json({ success: false, error: 'Email or username is already in use' });
      return;
    }
    logError('Registration failed', error);
    res.status(500).json({ success: false, error: 'Could not create account' });
  }
});

// Login (email/password)
app.post('/api/auth/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid input' });
    return;
  }
  const { email, password } = parse.data;

  try {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (!user.isActive || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    await establishUserSession(req, user);
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    logError('Login failed', error);
    res.status(500).json({ success: false, error: 'Could not complete login' });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, user: req.session.user });
});

app.get('/api/account/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await DatabaseService.getAccountProfile(req.session.user!.id);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }
    res.json({ success: true, profile });
  } catch (error) {
    logError('Account profile lookup failed', error);
    res.status(500).json({ success: false, error: 'Could not load account profile' });
  }
});

app.put('/api/account/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid profile' });
    return;
  }
  try {
    const profile = await DatabaseService.updateAccountProfile(req.session.user!.id, {
      ...parsed.data,
      bio: parsed.data.bio ?? null,
    });
    if (!profile) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }
    req.session.user!.username = profile.username;
    req.session.user!.name = profile.name;
    req.session.user!.email = profile.email;
    req.session.save((error) => {
      if (error) {
        logError('Could not update account session', error);
        res.status(500).json({ success: false, error: 'Profile was saved but the session could not be refreshed' });
        return;
      }
      res.json({ success: true, profile });
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      res.status(409).json({ success: false, error: 'That username is already in use' });
      return;
    }
    logError('Account profile update failed', error);
    res.status(500).json({ success: false, error: 'Could not update account profile' });
  }
});

app.post('/api/account/password', requireAuth, accountSecurityLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid password change' });
    return;
  }
  try {
    const changed = await DatabaseService.changePassword(
      req.session.user!.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    if (!changed) {
      res.status(400).json({ success: false, error: 'Current password is incorrect or password login is unavailable' });
      return;
    }
    const user = await DatabaseService.getUserById(req.session.user!.id);
    if (!user) {
      res.status(401).json({ success: false, error: 'Session is no longer valid' });
      return;
    }
    await establishUserSession(req, user);
    res.json({ success: true });
  } catch (error) {
    logError('Password change failed', error);
    res.status(500).json({ success: false, error: 'Could not change password' });
  }
});

app.get('/api/admin/accounts', requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await DatabaseService.listAdminAccounts();
    res.json({
      success: true,
      accounts: accounts.map((account) => ({
        ...account,
        accessRole: isAdminUser(account.id) ? 'Admin' : 'Student',
      })),
    });
  } catch (error) {
    logError('Admin account list failed', error);
    res.status(500).json({ success: false, error: 'Could not load accounts' });
  }
});

app.patch('/api/admin/accounts/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const accountId = req.params.id;
  const parsed = accountStatusSchema.safeParse(req.body);
  if (typeof accountId !== 'string' || !parsed.success) {
    await recordRejectedAdminAction(req.session.user!.id, 'account.status_change_rejected', 'invalid_request');
    res.status(400).json({ success: false, error: 'Invalid account status request' });
    return;
  }
  if (isAdminUser(accountId)) {
    await recordRejectedAdminAction(req.session.user!.id, 'account.status_change_rejected', 'protected_admin_account');
    res.status(409).json({ success: false, error: 'Admin accounts cannot be suspended through this endpoint' });
    return;
  }
  try {
    const account = await DatabaseService.setAccountActive(
      req.session.user!.id,
      accountId,
      parsed.data.status === 'active'
    );
    if (!account) {
      await recordRejectedAdminAction(req.session.user!.id, 'account.status_change_rejected', 'target_not_found_or_self');
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }
    res.json({ success: true, account: { ...account, accessRole: 'Student' } });
  } catch (error) {
    logError('Admin account status update failed', error);
    await recordRejectedAdminAction(req.session.user!.id, 'account.status_change_failed', 'operation_failed');
    res.status(500).json({ success: false, error: 'Could not update account status' });
  }
});

app.get('/api/admin/audit-logs', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = z.coerce.number().int().min(1).max(100).default(50).safeParse(req.query.limit);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Limit must be between 1 and 100' });
    return;
  }
  try {
    const logs = await DatabaseService.getAdminAuditLogs(parsed.data);
    res.json({ success: true, logs });
  } catch (error) {
    logError('Admin audit log lookup failed', error);
    res.status(500).json({ success: false, error: 'Could not load audit logs' });
  }
});

// Admin content CMS — draft management requires content:manage, publishing
// actions require content:publish. Both resolve through the centralized
// capability allowlist; users.role is never consulted.
app.get('/api/admin/content', requireAuth, requireCapability('content:manage'), async (req: Request, res: Response): Promise<void> => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 120) : undefined;
  const status = req.query.status;
  if (status !== undefined && status !== 'Draft' && status !== 'Published' && status !== 'Unpublished') {
    res.status(400).json({ success: false, error: 'Status must be Draft, Published or Unpublished' });
    return;
  }
  try {
    const items = await contentService.listAdminContent({
      type,
      q,
      status: status as 'Draft' | 'Published' | 'Unpublished' | undefined,
    });
    res.json({ success: true, content: items });
  } catch (error) {
    logError('Admin content list failed', error);
    res.status(500).json({ success: false, error: 'Could not load content' });
  }
});

app.post('/api/admin/content', requireAuth, requireCapability('content:manage'), async (req: Request, res: Response): Promise<void> => {
  const parse = caseContentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid content' });
    return;
  }
  try {
    const result = await contentService.createContent(req.session.user!.id, parse.data);
    res.status(201).json({ success: true, caseId: result.caseId });
  } catch (error) {
    logError('Admin content create failed', error);
    res.status(500).json({ success: false, error: 'Could not create content' });
  }
});

app.post('/api/admin/content/preview', requireAuth, requireCapability('content:manage'), async (req: Request, res: Response): Promise<void> => {
  const parse = caseContentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: parse.error.issues[0]?.message || 'Invalid content',
      issues: parse.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
    return;
  }
  res.json({ success: true, content: parse.data });
});

app.get('/api/admin/content/:caseId', requireAuth, requireCapability('content:manage'), async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  try {
    const detail = await contentService.getAdminContentDetail(caseId);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Content not found' });
      return;
    }
    res.json({ success: true, ...detail });
  } catch (error) {
    logError('Admin content detail failed', error);
    res.status(500).json({ success: false, error: 'Could not load content' });
  }
});

app.put('/api/admin/content/:caseId', requireAuth, requireCapability('content:manage'), async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  const parse = caseContentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid content' });
    return;
  }
  try {
    const result = await contentService.saveContentDraft(req.session.user!.id, caseId, parse.data);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ContentError) {
      res.status(error.status).json({ success: false, error: error.message });
      return;
    }
    logError('Admin content draft save failed', error);
    res.status(500).json({ success: false, error: 'Could not save draft' });
  }
});

app.get('/api/admin/content/:caseId/versions', requireAuth, requireCapability('content:manage'), async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  try {
    const versions = await contentService.listContentVersions(caseId);
    res.json({ success: true, versions });
  } catch (error) {
    logError('Admin content versions failed', error);
    res.status(500).json({ success: false, error: 'Could not load version history' });
  }
});

app.post('/api/admin/content/:caseId/publish', requireAuth, requireCapability('content:publish'), async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  try {
    const result = await contentService.publishContent(req.session.user!.id, caseId);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ContentError) {
      res.status(error.status).json({ success: false, error: error.message });
      return;
    }
    logError('Admin content publish failed', error);
    res.status(500).json({ success: false, error: 'Could not publish content' });
  }
});

app.post('/api/admin/content/:caseId/unpublish', requireAuth, requireCapability('content:publish'), async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  try {
    const result = await contentService.unpublishContent(req.session.user!.id, caseId);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ContentError) {
      res.status(error.status).json({ success: false, error: error.message });
      return;
    }
    logError('Admin content unpublish failed', error);
    res.status(500).json({ success: false, error: 'Could not unpublish content' });
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ success: true });
  });
});

// Health checks (no auth, no sensitive data)
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

app.get('/api/health/db', async (_req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.get('/api/cases', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cases = await DatabaseService.getPublishedCases();
    res.json(cases.map((caseData) => ({
      ...caseData,
      companyType: 'Community case',
      industry: caseData.sector,
      track: 'curated_case',
      isFeatured: false,
    })));
  } catch (error) {
    logError('Published cases error', error);
    res.status(500).json({ success: false, error: 'Could not load published cases' });
  }
});

app.get('/api/cases/:caseId', async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  try {
    const detail = await contentService.getPublishedCaseDetail(caseId);
    if (!detail) {
      res.status(404).json({ success: false, error: 'Case not found' });
      return;
    }
    res.json(detail);
  } catch (error) {
    logError('Published case detail error', error);
    res.status(500).json({ success: false, error: 'Could not load this case' });
  }
});

app.get('/api/cases/:caseId/gate-status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }
  try {
    const reviewsCompleted = await DatabaseService.getCompletedReviewCountForCase(
      req.session.user!.id,
      caseId
    );
    res.json({ reviews_completed: reviewsCompleted, can_submit: true });
  } catch (error) {
    logError('Case gate status error', error);
    res.status(500).json({ success: false, error: 'Could not load your review gate status' });
  }
});

// Legacy case proposals are disabled: historical records remain readable, but
// new submissions, resubmissions and approval-based publishing are closed.
// Admin-managed publishing happens exclusively through /api/admin/content.
app.post('/api/case-proposals', requireAuth, caseProposalLimiter, async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({ success: false, error: 'Case proposals are no longer accepted' });
});

app.get('/api/case-proposals/mine', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const proposals = await DatabaseService.getCaseProposalsForContributor(req.session.user!.id);
    res.json({ success: true, proposals });
  } catch (error) {
    logError('Contributor case proposals error', error);
    res.status(500).json({ success: false, error: 'Could not load your proposals' });
  }
});

app.get('/api/case-proposals/:proposalId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const proposalId = req.params.proposalId;
  if (typeof proposalId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid proposalId parameter' });
    return;
  }
  try {
    const proposal = await DatabaseService.getCaseProposalForContributor(
      proposalId,
      req.session.user!.id
    );
    if (!proposal) {
      res.status(404).json({ success: false, error: 'Proposal not found' });
      return;
    }
    res.json({ success: true, proposal });
  } catch (error) {
    logError('Case proposal lookup error', error);
    res.status(500).json({ success: false, error: 'Could not load this proposal' });
  }
});

app.put('/api/case-proposals/:proposalId', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({ success: false, error: 'Case proposals are no longer editable' });
});

app.get('/api/moderation/case-proposals', requireAuth, requireCaseModerator, async (_req: Request, res: Response): Promise<void> => {
  try {
    const proposals = await DatabaseService.getPendingCaseProposals();
    res.json({ success: true, proposals });
  } catch (error) {
    logError('Moderation queue error', error);
    res.status(500).json({ success: false, error: 'Could not load the moderation queue' });
  }
});

app.patch('/api/moderation/case-proposals/:proposalId', requireAuth, requireCaseModerator, async (req: Request, res: Response): Promise<void> => {
  const proposalId = req.params.proposalId;
  if (typeof proposalId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid proposalId parameter' });
    return;
  }
  const parse = caseProposalReviewSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid review decision' });
    return;
  }
  if (parse.data.action === 'approve') {
    res.status(410).json({
      success: false,
      error: 'Proposal approval no longer publishes cases; use the admin content CMS',
    });
    return;
  }

  const statusByAction = {
    approve: 'Approved',
    request_changes: 'Changes_Requested',
    decline: 'Declined',
  } as const;

  try {
    const proposal = await DatabaseService.reviewCaseProposal(
      proposalId,
      req.session.user!.id,
      statusByAction[parse.data.action],
      parse.data.notes
    );
    if (!proposal) {
      res.status(409).json({ success: false, error: 'This proposal has already been reviewed' });
      return;
    }
    res.json({ success: true, proposal });
  } catch (error) {
    logError('Case proposal review error', error);
    res.status(500).json({ success: false, error: 'Could not apply the review decision' });
  }
});

app.get('/api/casebooks', async (req: Request, res: Response): Promise<void> => {
  const parse = casebookFiltersSchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid casebook filters' });
    return;
  }
  try {
    const result = await DatabaseService.getPublishedCasebooks(parse.data);
    res.json({ success: true, ...result });
  } catch (error) {
    logError('Published casebooks error', error);
    res.status(500).json({ success: false, error: 'Could not load casebooks' });
  }
});

app.get('/api/casebooks/mine', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const casebooks = await DatabaseService.getMyCasebooks(req.session.user!.id);
    res.json({ success: true, casebooks });
  } catch (error) {
    logError('Contributor casebooks error', error);
    res.status(500).json({ success: false, error: 'Could not load your casebooks' });
  }
});

app.get('/api/casebooks/mine/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid casebook ID' });
    return;
  }
  try {
    const casebook = await DatabaseService.getCasebookForOwner(id, req.session.user!.id);
    if (!casebook) {
      res.status(404).json({ success: false, error: 'Casebook not found' });
      return;
    }
    res.json({ success: true, casebook });
  } catch (error) {
    logError('Contributor casebook lookup error', error);
    res.status(500).json({ success: false, error: 'Could not load this casebook' });
  }
});

app.post('/api/casebooks', requireAuth, casebookProposalLimiter, async (req: Request, res: Response): Promise<void> => {
  const parse = casebookInputSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid casebook' });
    return;
  }
  try {
    const casebook = await DatabaseService.createCasebook(req.session.user!.id, parse.data);
    res.status(201).json({ success: true, casebook });
  } catch (error) {
    logError('Casebook submission error', error);
    res.status(500).json({ success: false, error: 'Could not submit this casebook' });
  }
});

app.put('/api/casebooks/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid casebook ID' });
    return;
  }
  const parse = casebookInputSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid casebook' });
    return;
  }
  try {
    const casebook = await DatabaseService.updateCasebook(id, req.session.user!.id, parse.data);
    if (!casebook) {
      res.status(409).json({ success: false, error: 'Only your casebooks requesting changes can be edited and resubmitted' });
      return;
    }
    res.json({ success: true, casebook });
  } catch (error) {
    logError('Casebook update error', error);
    res.status(500).json({ success: false, error: 'Could not update this casebook' });
  }
});

app.get('/api/casebooks/:slug/cases/:caseSlug', async (req: Request, res: Response): Promise<void> => {
  const { slug, caseSlug } = req.params;
  if (typeof slug !== 'string' || typeof caseSlug !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid casebook or case slug' });
    return;
  }
  try {
    const result = await DatabaseService.getPublishedCasebookCase(slug, caseSlug);
    if (!result) {
      res.status(404).json({ success: false, error: 'Case not found' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (error) {
    logError('Published casebook case error', error);
    res.status(500).json({ success: false, error: 'Could not load this case' });
  }
});

app.get('/api/casebooks/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params.slug;
  if (typeof slug !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid casebook slug' });
    return;
  }
  try {
    const casebook = await DatabaseService.getPublishedCasebookBySlug(slug);
    if (!casebook) {
      res.status(404).json({ success: false, error: 'Casebook not found' });
      return;
    }
    res.json({ success: true, casebook });
  } catch (error) {
    logError('Published casebook error', error);
    res.status(500).json({ success: false, error: 'Could not load this casebook' });
  }
});

app.get('/api/moderation/casebooks', requireAuth, requireCaseModerator, async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status === undefined ? 'Pending' : req.query.status;
  if (status !== 'Pending' && status !== 'Published') {
    res.status(400).json({ success: false, error: 'Status must be Pending or Published' });
    return;
  }
  try {
    const casebooks = await DatabaseService.getCasebookModerationQueue(status);
    res.json({ success: true, casebooks });
  } catch (error) {
    logError('Casebook moderation queue error', error);
    res.status(500).json({ success: false, error: 'Could not load the casebook review queue' });
  }
});

app.patch('/api/moderation/casebooks/:id', requireAuth, requireCaseModerator, async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  if (typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid casebook ID' });
    return;
  }
  const parse = casebookReviewSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid review decision' });
    return;
  }
  try {
    const casebook = await DatabaseService.reviewCasebook(
      id, req.session.user!.id, parse.data.action as CasebookReviewAction, parse.data.notes
    );
    if (!casebook) {
      res.status(409).json({ success: false, error: 'This casebook is no longer in the selected review state' });
      return;
    }
    res.json({ success: true, casebook });
  } catch (error) {
    logError('Casebook moderation error', error);
    res.status(500).json({ success: false, error: 'Could not apply the casebook decision' });
  }
});

app.post('/api/takedown', takedownLimiter, async (req: Request, res: Response): Promise<void> => {
  const parse = takedownRequestSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid takedown request' });
    return;
  }
  try {
    const requestId = await DatabaseService.createTakedownRequest(parse.data);
    if (!requestId) {
      res.status(404).json({ success: false, error: 'Published casebook not found' });
      return;
    }
    res.status(201).json({ success: true, requestId });
  } catch (error) {
    logError('Casebook takedown request error', error);
    res.status(500).json({ success: false, error: 'Could not submit this report' });
  }
});

app.post('/api/cases/:caseId/submissions', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  const { contentJson, citationsCount = 0 } = req.body ?? {};
  const currentUser = req.session.user!;

  try {
    if (typeof caseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid caseId parameter.' });
      return;
    }

    if (!Number.isSafeInteger(citationsCount) || citationsCount < 0) {
      res.status(400).json({ success: false, error: 'Invalid citationsCount parameter.' });
      return;
    }

    // Validate solution structure before publishing it to the case's solution list.
    const caseType = await DatabaseService.getCaseType(caseId);
    if (!caseType) {
      res.status(404).json({ success: false, error: 'Case not found' });
      return;
    }
    const layer1Check = await VerificationEngine.validateLayer1Gate({
      contentJson,
      caseType,
    });

    if (layer1Check.compliant === false) {
      res.status(400).json({ success: false, error: layer1Check.error });
      return;
    }

    // 3. Commit Submission to Ledger
    const submissionId = await DatabaseService.createSubmission({
      caseId,
      userId: currentUser.id,
      contentJson: layer1Check.contentJson,
      citationsCount,
      wordCount: layer1Check.wordCount,
      structuralCompliant: true
    });

    const referenceRange = caseType === 'Guesstimate'
      ? await DatabaseService.getReferenceRangeAfterSubmission(caseId, currentUser.id)
      : undefined;
    res.status(201).json({ success: true, submissionId, status: 'Submitted', referenceRange });
  } catch (error) {
    logError('Case submission failed', error);
    res.status(500).json({ success: false, error: 'Could not submit case response' });
  }
});

app.put('/api/cases/:caseId/draft', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  const { contentJson } = req.body ?? {};
  const currentUser = req.session.user!;

  try {
    if (typeof caseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid caseId parameter.' });
      return;
    }
    if (!contentJson || typeof contentJson !== 'object' || Array.isArray(contentJson)) {
      res.status(400).json({ success: false, error: 'Draft content must be a JSON object of text sections.' });
      return;
    }

    const caseType = await DatabaseService.getCaseType(caseId);
    if (!caseType) {
      res.status(404).json({ success: false, error: 'Case not found' });
      return;
    }

    const draft = await DatabaseService.upsertCaseDraft(caseId, currentUser.id, contentJson);
    res.json({ success: true, draft });
  } catch (error) {
    logError('Case draft save failed', error);
    res.status(500).json({ success: false, error: 'Could not save draft' });
  }
});

app.get('/api/cases/:caseId/draft', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  try {
    if (typeof caseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
      return;
    }
    const draft = await DatabaseService.getCaseDraft(caseId, req.session.user!.id);
    res.json({ success: true, draft });
  } catch (error) {
    logError('Case draft load failed', error);
    res.status(500).json({ success: false, error: 'Could not load draft' });
  }
});

app.get('/api/cases/:caseId/reference-solution', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  const currentUser = req.session.user!;
  try {
    if (typeof caseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
      return;
    }
    const submitted = await DatabaseService.hasSubmittedAttempt(caseId, currentUser.id);
    if (!submitted) {
      res.status(403).json({ success: false, error: 'Submit a solution to view the reference solution' });
      return;
    }
    const row = await contentService.getPublishedReferenceSolution(caseId);
    if (!row) {
      res.status(404).json({ success: false, error: 'Case not found' });
      return;
    }
    res.json({ success: true, referenceSolution: row.reference_solution });
  } catch (error) {
    logError('Reference solution load failed', error);
    res.status(500).json({ success: false, error: 'Could not load reference solution' });
  }
});

app.get('/api/cases/:caseId/solutions', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }

  try {
    const solutions = await DatabaseService.getCaseSolutionsForUser(caseId, req.session.user!.id);
    if (!solutions) {
      res.status(403).json({ success: false, error: 'Submit a solution to compare other approaches' });
      return;
    }
    res.json({ success: true, solutions });
  } catch (error) {
    logError('Case solutions error', error);
    res.status(500).json({ success: false, error: 'Could not load case solutions' });
  }
});

app.get('/api/cases/:caseId/review-queue', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  if (typeof caseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid caseId parameter' });
    return;
  }

  try {
    const submission = await DatabaseService.getNextReviewSubmission(caseId, req.session.user!.id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'No unreviewed submission is available for this case' });
      return;
    }
    res.json(submission);
  } catch (error) {
    logError('Case review queue error', error);
    res.status(500).json({ success: false, error: 'Could not load a submission to review' });
  }
});

/**
 * CORE LOGIC GATEWAY: RUBRIC EVALUATION & LAYER 2/3 ROUTING
 */
app.post('/api/submissions/:submissionId/reviews', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const submissionId = req.params.submissionId;
  if (typeof submissionId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid submissionId parameter' });
    return;
  }
  const currentUser = req.session.user!;

  try {
    const caseId = typeof req.body?.caseId === 'string' ? req.body.caseId : '';
    const caseType = await DatabaseService.getCaseType(caseId);
    const parse = (caseType === 'Guesstimate' ? guesstimateReviewSchema : caseReviewSchema).safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid review' });
      return;
    }
    if (!caseType) {
      res.status(404).json({ success: false, error: 'Case not found' });
      return;
    }

    const scores = caseType === 'Guesstimate'
      ? {
          structure: 'structure' in parse.data ? parse.data.structure : 0,
          assumption_quality: 'assumption_quality' in parse.data ? parse.data.assumption_quality : 0,
          math_accuracy: 'math_accuracy' in parse.data ? parse.data.math_accuracy : 0,
          sanity_check: 'sanity_check' in parse.data ? parse.data.sanity_check : 0,
          clarity: 'clarity' in parse.data ? parse.data.clarity : 0,
        }
      : {
          problem_framing: 'problem_framing' in parse.data ? parse.data.problem_framing : 0,
          framework_fit: 'framework_fit' in parse.data ? parse.data.framework_fit : 0,
          data_integrity: 'data_integrity' in parse.data ? parse.data.data_integrity : 0,
          insight_depth: 'insight_depth' in parse.data ? parse.data.insight_depth : 0,
          feasibility: 'feasibility' in parse.data ? parse.data.feasibility : 0,
        };
    // Insert review score payload
    await DatabaseService.insertReview({
      submissionId,
      reviewerId: currentUser.id,
      reviewerTier: currentUser.role,
      caseId: parse.data.caseId,
      feedback: parse.data.feedback,
      scores,
    });

    // Execute Layer 2 Consensus Algorithm and check for Layer 3 escalation
    const actionTaken = await VerificationEngine.processPeerReviewConsensus(submissionId);

    res.status(200).json({ success: true, engineAction: actionTaken });
  } catch (error: any) {
    if (error instanceof InvalidCaseReviewError) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    logError('Case review submission error', error);
    res.status(500).json({ success: false, error: 'Could not submit review' });
  }
});

// Local root builds can serve the frontend; Render runs the API without that folder.
const frontendDistPath = path.resolve(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// In-memory stats cache (5 minutes)
let statsCache: { data: { solutionsScored: number; contributors: number; mergeBonuses: number }; expires: number } | null = null;

app.get('/api/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    if (statsCache && statsCache.expires > Date.now()) {
      res.json(statsCache.data);
      return;
    }
    const r1 = await pool.query("SELECT COUNT(*)::int AS c FROM submissions WHERE final_weighted_score IS NOT NULL");
    const r2 = await pool.query("SELECT COUNT(DISTINCT u)::int AS c FROM (SELECT user_id AS u FROM submissions UNION SELECT reviewer_id AS u FROM reviews) t");
    const r3 = await pool.query("SELECT COALESCE(SUM(merge_bonus_count),0)::int AS c FROM users");
    const data = {
      solutionsScored: r1.rows[0].c,
      contributors: r2.rows[0].c,
      mergeBonuses: r3.rows[0].c,
    };
    statsCache = { data, expires: Date.now() + 5 * 60 * 1000 };
    res.json(data);
  } catch (err) {
    logError('Stats error', err);
    res.status(500).json({ error: 'stats unavailable' });
  }
});

// Image upload endpoint (Cloudinary)
app.post('/api/upload/image', requireAuth, imageUpload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }
    const result = await uploadImageBuffer(req.file.buffer, 'caseforge');
    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: any) {
    logError('Image upload error', error);
    res.status(500).json({ success: false, error: 'Image upload failed' });
  }
});

// SPA fallback - serve index.html for all non-API routes
app.get('/*splat', (req: Request, res: Response) => {
  if (
    fs.existsSync(frontendDistPath) &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/callback')
  ) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
});

// Start server only when run directly (not when imported for tests)
if (process.env.NODE_ENV !== 'test') {
  assertMigrationsCurrent(pool).then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((error) => {
    logError('Database migration verification failed', error);
    console.error('Run npm run migrate before starting the API');
    process.exit(1);
  });
}

export { app };