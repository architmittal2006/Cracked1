/**
 * One-time migration + seed script for existing mock data.
 *
 * Reads mock data from client/src/data/mockData.ts and persists it to
 * PostgreSQL via Drizzle. Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING
 * for users/cases, and skips existing submissions/reviews).
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx db/migrate.ts
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import * as schema from './schema.js';
import {
  MOCK_USERS,
  MOCK_CASES,
  MOCK_SUBMISSIONS,
  MOCK_REVIEWS,
  GATE_STATE,
} from '../client/src/data/mockData.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

const DEFAULT_PASSWORD = 'ChangeMe123!';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('Connected to database. Starting migration + seed...');

  // ── 1. Ensure tables exist (idempotent) ──
  await db.execute(`
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

  console.log('Tables ensured.');

  // ── 2. Seed users ──
  for (const u of MOCK_USERS) {
    const passwordHash = await argon2.hash(DEFAULT_PASSWORD);
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        username: u.username,
        name: u.name,
        email: `${u.username}@cracked.local`,
        passwordHash,
        role: u.reviewerTier,
        credibilityScore: u.credibility_score,
        solveScore: u.solve_score,
        reviewScore: u.review_score,
        casesSolved: u.casesSolved,
        mergeBonusCount: u.merge_bonus_count,
        bio: u.bio,
      })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${MOCK_USERS.length} users.`);

  // ── 3. Seed cases ──
  for (const c of MOCK_CASES) {
    await db
      .insert(schema.cases)
      .values({
        id: c.id,
        title: c.title,
        type: c.type,
        sector: c.sector,
        difficulty: c.difficulty,
        status: c.status,
        description: c.description,
        deliverables: c.deliverables,
        pts: c.pts,
        submissionCount: c.submissionCount,
        reviewCount: c.reviewCount,
        deadline: c.deadline ? new Date(c.deadline) : null,
        tags: c.tags,
        isChaos: c.is_chaos ?? false,
        timerDeadline: c.timer_deadline ? new Date(c.timer_deadline) : null,
      })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${MOCK_CASES.length} cases.`);

  // ── 4. Seed submissions ──
  for (const s of MOCK_SUBMISSIONS) {
    // Check if submission already exists
    const existing = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, s.id));
    if (existing.length > 0) continue;

    await db.insert(schema.submissions).values({
      id: s.id,
      caseId: s.caseId,
      userId: s.userId,
      contentJson: {},
      citationsCount: 0,
      wordCount: 0,
      status: s.status,
      structuralCompliant: false,
      finalWeightedScore: s.finalScore ?? null,
    });
  }
  console.log(`Seeded ${MOCK_SUBMISSIONS.length} submissions.`);

  // ── 5. Seed reviews ──
  for (const r of MOCK_REVIEWS) {
    const existing = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.id, r.id));
    if (existing.length > 0) continue;

    await db.insert(schema.reviews).values({
      id: r.id,
      submissionId: r.submissionId,
      reviewerId: r.reviewerId,
      reviewerTier: r.reviewerTier,
      caseId: null,
      scores: r.scores,
      isVoided: r.isVoided ?? false,
    });
  }
  console.log(`Seeded ${MOCK_REVIEWS.length} reviews.`);

  console.log('Migration + seed complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
