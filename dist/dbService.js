// Persistent PostgreSQL data layer using Drizzle ORM
import argon2 from 'argon2';
import { eq, and, count } from 'drizzle-orm';
import { db } from './db/index.js';
import { users, submissions, reviews, } from './db/schema.js';
// ─── Password hashing (argon2) ───
export async function hashPassword(password) {
    return argon2.hash(password);
}
export async function comparePassword(password, hash) {
    return argon2.verify(hash, password);
}
// ─── User storage ───
export class DatabaseService {
    static async createUser(payload) {
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
    static async getUserByEmail(email) {
        const result = await db.select().from(users).where(eq(users.email, email));
        return result[0];
    }
    static async getUserById(id) {
        const result = await db.select().from(users).where(eq(users.id, id));
        return result[0];
    }
    static async getUserByUsername(username) {
        const result = await db.select().from(users).where(eq(users.username, username));
        return result[0];
    }
    // ─── Review storage ───
    static async getCompletedReviewCountForCase(userId, caseId) {
        const result = await db
            .select({ count: count() })
            .from(reviews)
            .where(and(eq(reviews.reviewerId, userId), eq(reviews.caseId, caseId), eq(reviews.isVoided, false)));
        return Number(result[0]?.count || 0);
    }
    static async createSubmission(payload) {
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
    static async getActiveReviewsForSubmission(submissionId) {
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
            scores: r.scores,
            isVoided: r.isVoided,
        }));
    }
    static async insertReview(payload) {
        const id = 'rev_' + crypto.randomUUID().slice(2, 11);
        await db.insert(reviews).values({
            id,
            submissionId: payload.submissionId,
            reviewerId: payload.reviewerId,
            reviewerTier: payload.reviewerTier,
            caseId: payload.caseId ?? null,
            scores: payload.scores,
            isVoided: false,
        });
    }
    static async updateSubmissionStatus(submissionId, status) {
        await db.update(submissions).set({ status }).where(eq(submissions.id, submissionId));
    }
    static async finalizeSubmission(submissionId, score, status) {
        await db.update(submissions)
            .set({ finalWeightedScore: score, status })
            .where(eq(submissions.id, submissionId));
    }
}
