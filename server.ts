import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pgStoreFactory from 'connect-pg-simple';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Pool } from 'pg';
import {
  DatabaseService,
  hashPassword,
  comparePassword,
  InvalidCaseReviewError,
  type CaseProposalInput,
} from './dbService.js';
import { VerificationEngine } from './verificationEngine.js';

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend Session type to include user
declare module 'express-session' {
  interface SessionData {
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

const pgStore = pgStoreFactory(session);

// Ensure all database tables exist on startup (idempotent)
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
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

    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR(255) PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cases (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      sector VARCHAR(100) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Open',
      description TEXT NOT NULL,
      deliverables TEXT[] NOT NULL DEFAULT '{}',
      pts INTEGER NOT NULL DEFAULT 0,
      submission_count INTEGER NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      deadline TIMESTAMPTZ,
      tags TEXT[] NOT NULL DEFAULT '{}',
      is_chaos BOOLEAN DEFAULT FALSE,
      timer_deadline TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS case_proposals (
      id VARCHAR(255) PRIMARY KEY,
      contributor_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      sector VARCHAR(100) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      source_kind VARCHAR(50) NOT NULL,
      source_reference TEXT,
      context TEXT NOT NULL,
      prompt TEXT NOT NULL,
      exhibits TEXT,
      deliverables TEXT[] NOT NULL DEFAULT '{}',
      reviewer_guide TEXT NOT NULL,
      solution_outline TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      moderator_notes TEXT,
      reviewed_by VARCHAR(255),
      published_case_id VARCHAR(255) REFERENCES cases(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS case_proposals_contributor_created_idx
      ON case_proposals (contributor_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS case_proposals_status_created_idx
      ON case_proposals (status, created_at ASC);

    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(255) PRIMARY KEY,
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      content_json JSONB NOT NULL,
      citations_count INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
      structural_compliant BOOLEAN DEFAULT FALSE,
      final_weighted_score INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(255) PRIMARY KEY,
      submission_id VARCHAR(255) NOT NULL REFERENCES submissions(id),
      reviewer_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) REFERENCES cases(id),
      reviewer_tier VARCHAR(50) NOT NULL,
      scores JSONB NOT NULL,
      feedback TEXT NOT NULL DEFAULT '',
      is_voided BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS feedback TEXT NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS votes (
      id VARCHAR(255) PRIMARY KEY,
      submission_id VARCHAR(255) NOT NULL REFERENCES submissions(id),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      direction VARCHAR(10) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS credibility_scores (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS — allow configured client origin to call the API with credentials
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
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
  max: 20,
  message: { success: false, error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Zod validation schemas
const signupSchema = z.object({
  username: z.string().min(3).max(100),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const caseProposalSchema = z.object({
  title: z.string().trim().min(8).max(120),
  type: z.enum([
    'Market Sizing',
    'Profitability',
    'Market Entry',
    'Operational',
    'Pricing',
    'M&A',
    'Growth & Retention',
  ]),
  sector: z.string().trim().min(2).max(80),
  difficulty: z.enum(['Standard', 'High', 'Chaos']),
  sourceKind: z.enum(['original', 'interview_recollection', 'public_source']),
  sourceReference: z.string().trim().max(500).optional(),
  context: z.string().trim().min(50).max(5000),
  prompt: z.string().trim().min(40).max(5000),
  exhibits: z.string().trim().max(5000).optional(),
  deliverables: z.array(z.string().trim().min(2).max(160)).min(1).max(8),
  reviewerGuide: z.string().trim().min(50).max(3000),
  solutionOutline: z.string().trim().min(50).max(5000),
  originalityConfirmed: z.literal(true),
  confidentialityConfirmed: z.literal(true),
}).refine(
  (proposal) => proposal.sourceKind !== 'public_source' || Boolean(proposal.sourceReference),
  { message: 'Add a link or citation for a public source', path: ['sourceReference'] }
);

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

const isCaseModeratorEmail = (email: string): boolean => {
  const moderatorEmails = (process.env.CASE_MODERATOR_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return moderatorEmails.includes(email.trim().toLowerCase());
};

const caseProposalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'You have reached the hourly proposal limit. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}

// Session configuration with PostgreSQL-backed store
app.use(session({
  store: new pgStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'development-only-session-secret',
  name: 'connect.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  next();
};

const requireCaseModerator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user || !isCaseModeratorEmail(req.session.user.email)) {
    res.status(403).json({ success: false, error: 'Moderator access is required' });
    return;
  }
  next();
};

// GitHub OAuth endpoints
app.get('/api/auth/github', (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5174';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${baseUrl}/callback/github`)}&scope=user:email`;
  res.json({ authUrl: githubAuthUrl });
});

app.post('/api/auth/github/callback', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Authorization code is required' });
    return;
  }

  try {
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
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json() as { error?: string; error_description?: string; access_token?: string };

    if (tokenData.error) {
      res.status(400).json({ success: false, error: tokenData.error_description || 'OAuth failed' });
      return;
    }

    // Get user info from GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json() as { id: number; login: string; name?: string; email?: string };

    // Store user in session
    req.session.user = {
      id: userData.id.toString(),
      username: userData.login,
      name: userData.name || userData.login,
      email: userData.email || `${userData.login}@github.com`,
      credibilityScore: 0,
      solveScore: 0,
      reviewScore: 0,
      casesSolved: 0,
      mergeBonusCount: 0,
      role: isCaseModeratorEmail(userData.email || `${userData.login}@github.com`) ? 'Moderator' : 'General',
    };

    res.json({ success: true, user: req.session.user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google OAuth endpoints
app.get('/api/auth/google', (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5174';
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${baseUrl}/callback/google`)}&response_type=code&scope=openid%20email%20profile`;
  res.json({ authUrl: googleAuthUrl });
});

app.post('/api/auth/google/callback', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Authorization code is required' });
    return;
  }

  try {
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
        redirect_uri: 'http://localhost:5174/callback/google',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as { error?: string; error_description?: string; access_token?: string };

    if (tokenData.error) {
      res.status(400).json({ success: false, error: tokenData.error_description || 'OAuth failed' });
      return;
    }

    // Get user info from Google API
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json() as { id: string; name: string; email: string };

    // Store user in session
    req.session.user = {
      id: userData.id,
      username: userData.email.split('@')[0], // Use email prefix as username
      name: userData.name,
      email: userData.email,
      credibilityScore: 0,
      solveScore: 0,
      reviewScore: 0,
      casesSolved: 0,
      mergeBonusCount: 0,
      role: isCaseModeratorEmail(userData.email) ? 'Moderator' : 'General',
    };

    res.json({ success: true, user: req.session.user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      credibilityScore: newUser.credibilityScore,
      solveScore: newUser.solveScore,
      reviewScore: newUser.reviewScore,
      casesSolved: newUser.casesSolved,
      mergeBonusCount: newUser.mergeBonusCount,
      role: isCaseModeratorEmail(newUser.email) ? 'Moderator' : newUser.role,
    };
    res.status(201).json({ success: true, user: req.session.user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
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

    if (!(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      credibilityScore: user.credibilityScore,
      solveScore: user.solveScore,
      reviewScore: user.reviewScore,
      casesSolved: user.casesSolved,
      mergeBonusCount: user.mergeBonusCount,
      role: isCaseModeratorEmail(user.email) ? 'Moderator' : user.role,
    };
    res.json({ success: true, user: req.session.user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, user: req.session.user });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.json({ success: true });
  });
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
    console.error('Published cases error:', error);
    res.status(500).json({ success: false, error: 'Could not load published cases' });
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
    console.error('Case gate status error:', error);
    res.status(500).json({ success: false, error: 'Could not load your review gate status' });
  }
});

app.post('/api/case-proposals', requireAuth, caseProposalLimiter, async (req: Request, res: Response): Promise<void> => {
  const parse = caseProposalSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid case proposal' });
    return;
  }

  const input: CaseProposalInput = parse.data;
  try {
    const proposal = await DatabaseService.createCaseProposal(
      req.session.user!.id,
      input
    );
    res.status(201).json({ success: true, proposal });
  } catch (error) {
    console.error('Case proposal submission error:', error);
    res.status(500).json({ success: false, error: 'Could not submit your case proposal' });
  }
});

app.get('/api/case-proposals/mine', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const proposals = await DatabaseService.getCaseProposalsForContributor(req.session.user!.id);
    res.json({ success: true, proposals });
  } catch (error) {
    console.error('Contributor case proposals error:', error);
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
    console.error('Case proposal lookup error:', error);
    res.status(500).json({ success: false, error: 'Could not load this proposal' });
  }
});

app.put('/api/case-proposals/:proposalId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const proposalId = req.params.proposalId;
  if (typeof proposalId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid proposalId parameter' });
    return;
  }
  const parse = caseProposalSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid case proposal' });
    return;
  }

  const input: CaseProposalInput = parse.data;
  try {
    const proposal = await DatabaseService.updateCaseProposal(
      proposalId,
      req.session.user!.id,
      input
    );
    if (!proposal) {
      res.status(409).json({ success: false, error: 'Only proposals requesting changes can be edited and resubmitted' });
      return;
    }
    res.json({ success: true, proposal });
  } catch (error) {
    console.error('Case proposal update error:', error);
    res.status(500).json({ success: false, error: 'Could not update your case proposal' });
  }
});

app.get('/api/moderation/case-proposals', requireAuth, requireCaseModerator, async (_req: Request, res: Response): Promise<void> => {
  try {
    const proposals = await DatabaseService.getPendingCaseProposals();
    res.json({ success: true, proposals });
  } catch (error) {
    console.error('Moderation queue error:', error);
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
    console.error('Case proposal review error:', error);
    res.status(500).json({ success: false, error: 'Could not apply the review decision' });
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
    const layer1Check = await VerificationEngine.validateLayer1Gate({
      contentJson,
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

    res.status(201).json({ success: true, submissionId, status: 'Submitted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    console.error('Case solutions error:', error);
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
    console.error('Case review queue error:', error);
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
  const parse = caseReviewSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Invalid review' });
    return;
  }
  const currentUser = req.session.user!;

  try {
    // Insert review score payload
    await DatabaseService.insertReview({
      submissionId,
      reviewerId: currentUser.id,
      reviewerTier: currentUser.role,
      caseId: parse.data.caseId,
      feedback: parse.data.feedback,
      scores: {
        problem_framing: parse.data.problem_framing,
        framework_fit: parse.data.framework_fit,
        data_integrity: parse.data.data_integrity,
        insight_depth: parse.data.insight_depth,
        feasibility: parse.data.feasibility,
      },
    });

    // Execute Layer 2 Consensus Algorithm and check for Layer 3 escalation
    const actionTaken = await VerificationEngine.processPeerReviewConsensus(submissionId);

    res.status(200).json({ success: true, engineAction: actionTaken });
  } catch (error: any) {
    if (error instanceof InvalidCaseReviewError) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    console.error('Case review submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static files from client/dist
// Try multiple possible paths for different deployment environments
const possiblePaths = [
  path.join(__dirname, '..', 'client', 'dist'),           // Local development
  path.join(__dirname, 'client', 'dist'),                // Alternative local
  path.join(process.cwd(), 'client', 'dist'),             // Render/common
  path.join(process.cwd(), 'dist', 'client', 'dist'),     // Alternative Render
];

let clientDistPath = possiblePaths[0];
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    clientDistPath = testPath;
    break;
  }
}

console.log('Serving static files from:', clientDistPath);
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
console.log('File exists:', fs.existsSync(clientDistPath));
app.use(express.static(clientDistPath));

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
    console.error('Stats error:', err);
    res.status(500).json({ error: 'stats unavailable' });
  }
});

// SPA fallback - serve index.html for all non-API routes
app.get('/*splat', (req: Request, res: Response) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/callback')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

// Start server only when run directly (not when imported for tests)
if (process.env.NODE_ENV !== 'test') {
  ensureTables().then(() => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
  });
}

export { app };