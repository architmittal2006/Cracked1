import { z } from 'zod';

const referenceRangeSchema = z.object({
  value: z.number().finite().nonnegative(),
  unit: z.string().trim().min(1).max(80),
  low: z.number().finite().nonnegative(),
  high: z.number().finite().nonnegative(),
}).refine((range) => range.low <= range.value && range.value <= range.high, {
  message: 'Reference range must satisfy low ≤ value ≤ high',
});

export const caseContentSchema = z.object({
  title: z.string().trim().min(8).max(120),
  type: z.enum([
    'Market Sizing',
    'Profitability',
    'Market Entry',
    'Operational',
    'Pricing',
    'M&A',
    'Growth & Retention',
    'Guesstimate',
  ]),
  sector: z.string().trim().min(2).max(80),
  difficulty: z.enum(['Standard', 'High', 'Chaos']),
  description: z.string().trim().min(50).max(10000),
  exhibits: z.string().trim().max(5000).nullish(),
  deliverables: z.array(z.string().trim().min(2).max(160)).min(1).max(8),
  referenceRange: referenceRangeSchema.nullish(),
  referenceSolution: z.string().trim().min(50).max(10000),
  rubricCriteria: z.array(z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().min(10).max(500),
  })).min(1).max(8),
  contentOwner: z.string().trim().min(2).max(255),
  authorCredit: z.string().trim().max(255).nullish(),
  sourceKind: z.enum(['original', 'licensed', 'public_domain', 'permission_granted']),
  sourceReference: z.string().trim().max(1000).nullish(),
  rightsDeclaration: z.string().trim().min(20).max(2000),
  rightsConfirmed: z.literal(true),
}).refine((content) => content.type === 'Guesstimate' || content.referenceRange == null, {
  message: 'Reference ranges are only supported for guesstimate content',
  path: ['referenceRange'],
}).refine((content) => content.sourceKind === 'original' || Boolean(content.sourceReference), {
  message: 'Add a source URL or citation for non-original content',
  path: ['sourceReference'],
});

export type CaseContentInput = z.infer<typeof caseContentSchema>;
