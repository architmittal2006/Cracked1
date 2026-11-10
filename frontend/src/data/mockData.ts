// ═══════════════════════════════════════════════════
// CRACKED? — MOCK DATA (CaseForge roadmap shapes)
// ═══════════════════════════════════════════════════

export type ProblemType =
  | 'Market Sizing'
  | 'Profitability'
  | 'Market Entry'
  | 'Operational'
  | 'Pricing'
  | 'M&A'
  | 'Growth & Retention'
  | 'Guesstimate';

export type CredibilityTier =
  | 'Analyst'
  | 'Associate'
  | 'Consultant'
  | 'Sr. Consultant'
  | 'Principal'
  | 'Partner';

export type ReviewerTier = 'General' | 'Verified' | 'Arbiter';
export type SubmissionStatus = 'Draft' | 'Submitted' | 'Pending_Review' | 'In_Dispute' | 'Completed' | 'Merged';
export type CaseDifficulty = 'Standard' | 'High' | 'Chaos';
export type CaseStatus = 'Open' | 'In_Review' | 'Completed' | 'Accepted' | 'Archived';
export type TrackType = 'open_arena' | 'community_question' | 'curated_case';

export const PROBLEM_TYPES: ProblemType[] = [
  'Market Sizing',
  'Profitability',
  'Market Entry',
  'Operational',
  'Pricing',
  'M&A',
  'Growth & Retention',
  'Guesstimate',
];

export const PROBLEM_TYPE_SLUGS: Record<ProblemType, string> = {
  'Market Sizing': 'market-sizing',
  Profitability: 'profitability',
  'Market Entry': 'market-entry',
  Operational: 'operational',
  Pricing: 'pricing',
  'M&A': 'ma',
  'Growth & Retention': 'growth-retention',
  Guesstimate: 'guesstimate',
};

export const SLUG_TO_PROBLEM_TYPE: Record<string, ProblemType> = Object.fromEntries(
  Object.entries(PROBLEM_TYPE_SLUGS).map(([type, slug]) => [slug, type as ProblemType])
) as Record<string, ProblemType>;

export interface Case {
  id: string;
  title: string;
  type: ProblemType;
  sector: string;
  companyType: string;
  industry: string;
  difficulty: CaseDifficulty;
  status: CaseStatus;
  track: TrackType;
  description: string;
  deliverables: string[];
  pts: number;
  submissionCount: number;
  reviewCount: number;
  deadline: string;
  tags: string[];
  is_chaos?: boolean;
  timer_deadline?: string;
  isFeatured?: boolean;
  upvotes?: number; // For Track 1
  posterId?: string; // For Track 2
  acceptedSolutionId?: string; // For Track 2
}

export const CREDIBILITY_TIER_THRESHOLDS: { tier: CredibilityTier; min: number; max: number }[] = [
  { tier: 'Analyst', min: 0, max: 999 },
  { tier: 'Associate', min: 1000, max: 2499 },
  { tier: 'Consultant', min: 2500, max: 4999 },
  { tier: 'Sr. Consultant', min: 5000, max: 7499 },
  { tier: 'Principal', min: 7500, max: 9999 },
  { tier: 'Partner', min: 10000, max: Infinity },
];

export function getCredibilityTier(score: number): CredibilityTier {
  for (const { tier, min, max } of CREDIBILITY_TIER_THRESHOLDS) {
    if (score >= min && score <= max) return tier;
  }
  return 'Analyst';
}

export function getTierProgress(score: number): { current: CredibilityTier; next: CredibilityTier | null; percent: number } {
  const current = getCredibilityTier(score);
  const idx = CREDIBILITY_TIER_THRESHOLDS.findIndex(t => t.tier === current);
  const currentThreshold = CREDIBILITY_TIER_THRESHOLDS[idx];
  const nextThreshold = CREDIBILITY_TIER_THRESHOLDS[idx + 1];

  if (!nextThreshold) {
    return { current, next: null, percent: 100 };
  }

  const range = nextThreshold.min - currentThreshold.min;
  const progress = score - currentThreshold.min;
  return { current, next: nextThreshold.tier, percent: Math.min(100, (progress / range) * 100) };
}


export function formatSubmissionSection(key: string, content: string): string {
  if (key === 'structure_segments') {
    try {
      const segments: unknown = JSON.parse(content);
      if (Array.isArray(segments)) return segments.map((segment) => `• ${segment}`).join('\n');
    } catch {
      return content;
    }
  }
  if (key === 'assumptions') {
    try {
      const assumptions: unknown = JSON.parse(content);
      if (Array.isArray(assumptions)) {
        return assumptions.map((item) =>
          `${item.name}: ${item.value} ${item.unit} — ${item.rationale}`
        ).join('\n');
      }
    } catch {
      return content;
    }
  }
  if (key === 'final_estimate') {
    try {
      const estimate: unknown = JSON.parse(content);
      if (estimate && typeof estimate === 'object') {
        const values = estimate as Record<string, string>;
        return `${values.value} ${values.unit} (range: ${values.low}–${values.high} ${values.unit})`;
      }
    } catch {
      return content;
    }
  }
  return content;
}

export function submissionSectionLabel(key: string, deliverables: string[] = []): string {
  const sectionMatch = /^section_(\d+)$/.exec(key);
  if (sectionMatch) {
    const index = Number(sectionMatch[1]);
    return deliverables[index] ?? `Section ${index + 1}`;
  }
  const label = key.replaceAll('_', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
