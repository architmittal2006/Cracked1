// Persistent PostgreSQL data layer using Drizzle ORM
import argon2 from 'argon2';
import { eq, and, count } from 'drizzle-orm';
import { db } from './db/index.js';
import {
  users,
  sessions,
  cases,
  submissions,
  reviews,
  votes,
  credibilityScores,
} from './db/schema.js';

export interface ReviewRubric {
  problem_framing: number;
  framework_fit: number;
  data_integrity: number;
  insight_depth: number;
  feasibility: number;
}

export interface ReviewRecord {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerTier: string;
  caseId?: string;
  scores: ReviewRubric;
  isVoided?: boolean;
}

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  credibilityScore: number;
  solveScore: number;
  reviewScore: number;
  casesSolved: number;
  mergeBonusCount: number;
  role: string;
}

// ─── Password hashing (argon2) ───

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ─── User storage ───

export class DatabaseService {
  public static async createUser(payload: {
    username: string;
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<string> {
    const existingEmail = await db.select().from(users).where(eq(users.email, payload.email));
    if (existingEmail.length > 0) {
      throw new Error('Email already registered');
    }
    const existingUser = await db.select().from(users).where(eq(users.username, payload.username));
    if (existingUser.length > 0) {
      throw new Error('Username already taken');
    }

    const id = 'u_' + crypto.randomUUID().slice(2, 11);
    await db.insert(users).values({
      id,
      username: payload.username,
      name: payload.name,
      email: payload.email,
      passwordHash: payload.passwordHash,
    });
    return id;
  }

  public static async getUserByEmail(email: string): Promise<UserRecord | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  public static async getUserById(id: string): Promise<UserRecord | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  public static async getUserByUsername(username: string): Promise<UserRecord | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  // ─── Review storage ───

  public static async getCompletedReviewCountForCase(userId: string, caseId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, userId),
          eq(reviews.caseId, caseId),
          eq(reviews.isVoided, false)
        )
      );
    return Number(result[0]?.count || 0);
  }

  public static async createSubmission(payload: any): Promise<string> {
    const id = 'sub_' + crypto.randomUUID().slice(2, 11);
    await db.insert(submissions).values({
      id,
      caseId: payload.caseId,
      userId: payload.userId,
      contentJson: payload.contentJson,
      citationsCount: payload.citationsCount,
      wordCount: payload.wordCount,
      status: payload.status || 'Pending_Review',
      structuralCompliant: payload.structuralCompliant || false,
      finalWeightedScore: payload.finalWeightedScore ?? null,
    });
    return id;
  }

  public static async getActiveReviewsForSubmission(submissionId: string): Promise<ReviewRecord[]> {
    const result = await db
      .select({
        id: reviews.id,
        submissionId: reviews.submissionId,
        reviewerId: reviews.reviewerId,
        reviewerTier: reviews.reviewerTier,
        caseId: reviews.caseId,
        scores: reviews.scores,
        isVoided: reviews.isVoided,
      })
      .from(reviews)
      .where(and(eq(reviews.submissionId, submissionId), eq(reviews.isVoided, false)));
    return result.map((r) => ({
      id: r.id,
      submissionId: r.submissionId,
      reviewerId: r.reviewerId,
      reviewerTier: r.reviewerTier,
      caseId: r.caseId ?? undefined,
      scores: r.scores as ReviewRubric,
      isVoided: r.isVoided,
    }));
  }

  public static async insertReview(payload: {
    submissionId: string;
    reviewerId: string;
    reviewerTier: string;
    scores: ReviewRubric;
    caseId?: string;
  }): Promise<void> {
    const id = 'rev_' + crypto.randomUUID().slice(2, 11);
    await db.insert(reviews).values({
      id,
      submissionId: payload.submissionId,
      reviewerId: payload.reviewerId,
      reviewerTier: payload.reviewerTier,
      caseId: payload.caseId ?? null,
      scores: payload.scores as any,
      isVoided: false,
    });
  }

  public static async updateSubmissionStatus(submissionId: string, status: string): Promise<void> {
    await db.update(submissions).set({ status }).where(eq(submissions.id, submissionId));
  }

  public static async finalizeSubmission(submissionId: string, score: number, status: string): Promise<void> {
    await db.update(submissions)
      .set({ finalWeightedScore: score, status })
      .where(eq(submissions.id, submissionId));
  }
}
