import { z } from 'zod';

const caseTypes = [
  'Market Sizing',
  'Profitability',
  'Market Entry',
  'Operational',
  'Pricing',
  'M&A',
  'Growth & Retention',
  'Guesstimate',
] as const;

const casebookCaseSchema = z.object({
  title: z.string().trim().min(2).max(255),
  firm: z.string().trim().max(255).optional().nullable(),
  sector: z.string().trim().min(2).max(100),
  caseType: z.enum(caseTypes).optional().nullable(),
  difficulty: z.string().trim().min(1).max(50),
  summary: z.string().trim().min(20).max(1500),
  body: z.string().trim().max(50000).optional(),
  position: z.number().int().min(0).max(100),
  practiceCaseId: z.string().trim().min(1).max(255).optional().nullable(),
});

export const casebookInputSchema = z.object({
  title: z.string().trim().min(3).max(255),
  sourceOrg: z.string().trim().min(2).max(255),
  sourceKind: z.enum(['university', 'company', 'club', 'original']),
  year: z.number().int().min(1800).max(2200).optional().nullable(),
  description: z.string().trim().min(20).max(3000),
  licenseKind: z.enum(['original', 'permission', 'open_license', 'link_only']),
  permissionReference: z.string().trim().max(1000).optional(),
  externalUrl: z.string().trim().url().max(2000)
    .refine((value) => value.startsWith('https://') || value.startsWith('http://'), 'Use an HTTP or HTTPS source URL.')
    .optional().or(z.literal('')),
  industries: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
  cases: z.array(casebookCaseSchema).min(1).max(100),
  rightsConfirmed: z.literal(true),
  attributionConfirmed: z.literal(true),
}).superRefine((casebook, context) => {
  if (casebook.licenseKind === 'link_only') {
    if (!casebook.externalUrl) {
      context.addIssue({
        code: 'custom',
        path: ['externalUrl'],
        message: 'Add the original source URL for a link-only casebook.',
      });
    }
    if (casebook.cases.some((caseItem) => caseItem.body?.trim())) {
      context.addIssue({
        code: 'custom',
        path: ['cases'],
        message: 'Link-only casebooks cannot include hosted case text.',
      });
    }
  } else if (!casebook.permissionReference?.trim()) {
    context.addIssue({
      code: 'custom',
      path: ['permissionReference'],
      message: 'Record the permission, open license, or original authorship basis.',
    });
  }
});

export const casebookFiltersSchema = z.object({
  search: z.string().trim().max(120).default(''),
  sourceKind: z.enum(['university', 'company', 'club', 'original']).optional(),
  sector: z.string().trim().max(100).optional(),
  caseType: z.enum(caseTypes).optional(),
  year: z.coerce.number().int().min(1800).max(2200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const casebookReviewSchema = z.object({
  action: z.enum(['approve', 'request_changes', 'decline', 'take_down']),
  notes: z.string().trim().max(3000).optional().default(''),
}).refine(
  (review) => review.action === 'approve' || review.notes.length >= 10,
  { message: 'Add at least 10 characters of feedback for this decision', path: ['notes'] }
);

export const takedownRequestSchema = z.object({
  casebookId: z.string().trim().min(1).max(255),
  requesterEmail: z.string().trim().email().max(255),
  reason: z.string().trim().min(20).max(2000),
});

export type CasebookInput = z.infer<typeof casebookInputSchema>;
export type CasebookFilters = z.infer<typeof casebookFiltersSchema>;
