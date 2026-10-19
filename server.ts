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
import { DatabaseService, hashPassword, comparePassword } from './dbService.js';
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

    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(255) PRIMARY KEY,
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      content_json JSONB NOT NULL,
      citations_count INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending_Review',
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
      is_voided BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
  res.header('Access-Control-Allow-Origin', CLIENT_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

// Session configuration with PostgreSQL-backed store
app.use(session({
  store: new pgStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
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

// Contextual Middleware simulating authenticated session user
const mockAuthUser = (req: Request, res: Response, next: NextFunction) => {
  req.body.currentUser = {
    id: "u1111111-1111-1111-1111-111111111111",
    role: "Verified",
    name: "Alex Operator"
  };
  next();
};

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
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
      role: 'General',
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
      role: 'General',
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
      role: newUser.role,
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
      role: user.role,
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

/**
 * CORE LOGIC GATEWAY: SUBMISSION PAYWALL & LAYER 1 CHECK
 */
app.post('/api/cases/:caseId/submissions', mockAuthUser, async (req: Request, res: Response): Promise<void> => {
  const caseId = req.params.caseId;
  const { contentJson, citationsCount, wordCount, currentUser } = req.body;

  try {
    if (typeof caseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid caseId parameter.' });
      return;
    }

    // 1. Enforce Hard Submission Paywall
    const reviewCount = await DatabaseService.getCompletedReviewCountForCase(currentUser.id, caseId);
    if (reviewCount < 2) {
       res.status(403).json({
        success: false,
        error: `Submission Blocked: You must complete at least 2 peer reviews for this case first. Completed: [${reviewCount}/2]`
      });
       return;
    }

    // 2. Layer 1 Automated Syntax & Integrity Gate
    const layer1Check = await VerificationEngine.validateLayer1Gate({
      contentJson,
      citationsCount,
      wordCount,
      requiredFields: ['problem_framing_statement', 'framework_selection', 'implementation_roadmap']
    });

    if (!layer1Check.compliant) {
       res.status(400).json({ success: false, error: layer1Check.error });
       return;
    }

    // 3. Commit Submission to Ledger
    const submissionId = await DatabaseService.createSubmission({
      caseId,
      userId: currentUser.id,
      contentJson,
      citationsCount,
      wordCount,
      structuralCompliant: true
    });

    res.status(201).json({ success: true, submissionId, status: 'Pending_Review' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * CORE LOGIC GATEWAY: RUBRIC EVALUATION & LAYER 2/3 ROUTING
 */
app.post('/api/submissions/:submissionId/reviews', mockAuthUser, async (req: Request, res: Response): Promise<void> => {
  const submissionId = req.params.submissionId;
  const { problem_framing, framework_fit, data_integrity, insight_depth, feasibility, currentUser } = req.body;

  try {
    if (typeof submissionId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid submissionId parameter.' });
      return;
    }

    // Insert review score payload
    await DatabaseService.insertReview({
      submissionId,
      reviewerId: currentUser.id,
      reviewerTier: currentUser.role,
      scores: { problem_framing, framework_fit, data_integrity, insight_depth, feasibility }
    });

    // Execute Layer 2 Consensus Algorithm and check for Layer 3 escalation
    const actionTaken = await VerificationEngine.processPeerReviewConsensus(submissionId);

    res.status(200).json({ success: true, engineAction: actionTaken });
  } catch (error: any) {
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