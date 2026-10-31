import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

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

export const caseProposals = pgTable('case_proposals', {
  id: varchar('id', { length: 255 }).primaryKey(),
  contributorId: varchar('contributor_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  sector: varchar('sector', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(),
  sourceKind: varchar('source_kind', { length: 50 }).notNull(),
  sourceReference: text('source_reference'),
  context: text('context').notNull(),
  prompt: text('prompt').notNull(),
  exhibits: text('exhibits'),
  deliverables: text('deliverables').array().notNull().default([]),
  reviewerGuide: text('reviewer_guide').notNull(),
  solutionOutline: text('solution_outline').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  moderatorNotes: text('moderator_notes'),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  publishedCaseId: varchar('published_case_id', { length: 255 }).references(() => cases.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const casebooks = pgTable('casebooks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  sourceOrg: varchar('source_org', { length: 255 }).notNull(),
  sourceKind: varchar('source_kind', { length: 50 }).notNull(),
  year: integer('year'),
  description: text('description').notNull(),
  licenseKind: varchar('license_kind', { length: 50 }).notNull(),
  permissionReference: text('permission_reference'),
  externalUrl: text('external_url'),
  industries: text('industries').array().notNull().default([]),
  caseCount: integer('case_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  uploaderId: varchar('uploader_id', { length: 255 }).notNull().references(() => users.id),
  moderatorNotes: text('moderator_notes'),
  reviewedBy: varchar('reviewed_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('casebooks_slug_unique').on(table.slug),
  index('casebooks_status_created_idx').on(table.status, table.createdAt),
  index('casebooks_uploader_created_idx').on(table.uploaderId, table.createdAt),
]);

export const casebookCases = pgTable('casebook_cases', {
  id: varchar('id', { length: 255 }).primaryKey(),
  casebookId: varchar('casebook_id', { length: 255 }).notNull().references(() => casebooks.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  firm: varchar('firm', { length: 255 }),
  sector: varchar('sector', { length: 100 }).notNull(),
  caseType: varchar('case_type', { length: 100 }),
  difficulty: varchar('difficulty', { length: 50 }).notNull(),
  summary: text('summary').notNull(),
  body: text('body'),
  position: integer('position').notNull().default(0),
  practiceCaseId: varchar('practice_case_id', { length: 255 }).references(() => cases.id, { onDelete: 'set null' }),
}, (table) => [
  uniqueIndex('casebook_cases_book_slug_unique').on(table.casebookId, table.slug),
  index('casebook_cases_book_position_idx').on(table.casebookId, table.position),
]);

export const takedownRequests = pgTable('takedown_requests', {
  id: varchar('id', { length: 255 }).primaryKey(),
  casebookId: varchar('casebook_id', { length: 255 }).notNull().references(() => casebooks.id, { onDelete: 'cascade' }),
  requesterEmail: varchar('requester_email', { length: 255 }).notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  caseId: varchar('case_id', { length: 255 }).notNull().references(() => cases.id),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  contentJson: jsonb('content_json').notNull(),
  citationsCount: integer('citations_count').notNull().default(0),
  wordCount: integer('word_count').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('Submitted'),
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
  feedback: text('feedback').notNull().default(''),
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
