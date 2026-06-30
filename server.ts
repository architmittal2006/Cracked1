import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { DatabaseService } from './dbService.js';
import { VerificationEngine } from './verificationEngine.js';

// Load environment variables
dotenv.config();

// Extend Session type to include user
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      name: string;
      email: string;
    };
  }
}

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session configuration with security
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents JavaScript access to cookies
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
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
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:5174/callback/github')}&scope=user:email`;
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

    const tokenData = await tokenResponse.json();

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

    const userData = await userResponse.json();

    // Store user in session
    req.session.user = {
      id: userData.id.toString(),
      username: userData.login,
      name: userData.name || userData.login,
      email: userData.email || `${userData.login}@github.com`,
    };

    res.json({ success: true, user: req.session.user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google OAuth endpoints
app.get('/api/auth/google', (req: Request, res: Response) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:5174/callback/google')}&response_type=code&scope=openid%20email%20profile`;
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

    const tokenData = await tokenResponse.json();

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

    const userData = await userResponse.json();

    // Store user in session
    req.session.user = {
      id: userData.id,
      username: userData.email.split('@')[0], // Use email prefix as username
      name: userData.name,
      email: userData.email,
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
    res.clearCookie('connect.sid');
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

app.listen(8080, () => console.log('Continuous Case Operations Server running on port 8080'));