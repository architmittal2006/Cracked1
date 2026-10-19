import { pgTable, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('General'),
  credibilityScore: integer('credibility_score').notNull().default(0),
  solveScore: integer('solve_score').notNull().default(0),
  reviewScore: integer('review_score').notNull().default(0),
  casesSolved: integer('cases_solved').notNull().default(0),
  mergeBonusCount: integer('merge_bonus_count').notNull().default(0),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire', { withTimezone: true }).notNull(),
});

export const cases = pgTable('cases', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  sector: varchar('sector', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Open'),
  description: text('description').notNull(),
  deliverables: text('deliverables').array().notNull().default([]),
  pts: integer('pts').notNull().default(0),
  submissionCount: integer('submission_count').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  deadline: timestamp('deadline', { withTimezone: true }),
  tags: text('tags').array().notNull().default([]),
  isChaos: boolean('is_chaos').default(false),
  timerDeadline: timestamp('timer_deadline', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  caseId: varchar('case_id', { length: 255 }).notNull().references(() => cases.id),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  contentJson: jsonb('content_json').notNull(),
  citationsCount: integer('citations_count').notNull().default(0),
  wordCount: integer('word_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('Pending_Review'),
  structuralCompliant: boolean('structural_compliant').default(false),
  finalWeightedScore: integer('final_weighted_score'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: varchar('id', { length: 255 }).primaryKey(),
  submissionId: varchar('submission_id', { length: 255 }).notNull().references(() => submissions.id),
  reviewerId: varchar('reviewer_id', { length: 255 }).notNull().references(() => users.id),
  caseId: varchar('case_id', { length: 255 }).references(() => cases.id),
  reviewerTier: varchar('reviewer_tier', { length: 50 }).notNull(),
  scores: jsonb('scores').notNull(),
  isVoided: boolean('is_voided').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const votes = pgTable('votes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  submissionId: varchar('submission_id', { length: 255 }).notNull().references(() => submissions.id),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  direction: varchar('direction', { length: 10 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const credibilityScores = pgTable('credibility_scores', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
