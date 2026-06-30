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
  | 'Growth & Retention';

export type CredibilityTier =
  | 'Analyst'
  | 'Associate'
  | 'Consultant'
  | 'Sr. Consultant'
  | 'Principal'
  | 'Partner';

export type ReviewerTier = 'General' | 'Verified' | 'Arbiter';
export type UserStatus = 'Active' | 'Dormant';
export type SubmissionStatus = 'Draft' | 'Pending_Review' | 'In_Dispute' | 'Completed' | 'Merged';
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
];

export const PROBLEM_TYPE_SLUGS: Record<ProblemType, string> = {
  'Market Sizing': 'market-sizing',
  Profitability: 'profitability',
  'Market Entry': 'market-entry',
  Operational: 'operational',
  Pricing: 'pricing',
  'M&A': 'ma',
  'Growth & Retention': 'growth-retention',
};

export const SLUG_TO_PROBLEM_TYPE: Record<string, ProblemType> = Object.fromEntries(
  Object.entries(PROBLEM_TYPE_SLUGS).map(([type, slug]) => [slug, type as ProblemType])
) as Record<string, ProblemType>;

export const SECONDARY_TAGS = [
  'B2C', 'B2B', 'SaaS', 'D2C', 'India-specific', 'Regulated', 'Crisis', 'Greenfield', 'Data-heavy',
] as const;

export interface User {
  id: string;
  username: string;
  name: string;
  initials: string;
  reviewerTier: ReviewerTier;
  solve_score: number;
  review_score: number;
  credibility_score: number;
  merge_bonus_count: number;
  status: UserStatus;
  joinDate: string;
  reviewsCompleted: number;
  avgAuthorRating: number;
  bio: string;
  casesSolved: number;
  rankDelta: number | 'NEW';
  specializations: ProblemType[];
  // Track-specific contributions
  arena_submissions?: number;
  arena_upvotes_received?: number;
  questions_answered?: number;
  questions_accepted?: number;
}

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

export interface Submission {
  id: string;
  caseId: string;
  caseName: string;
  userId: string;
  status: SubmissionStatus;
  finalScore: number | null;
  createdAt: string;
}

export interface ReviewRubric {
  problem_framing: number;
  framework_fit: number;
  data_integrity: number;
  insight_depth: number;
  feasibility: number;
}

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerTier: ReviewerTier;
  scores: ReviewRubric;
  feedback: string;
  isVoided: boolean;
  createdAt: string;
}

export const RUBRIC_DIMENSIONS = [
  { key: 'problem_framing' as const, label: 'Problem Framing', description: 'Did they correctly identify the real issue?', weight: 0.25, weightLabel: '25%' },
  { key: 'framework_fit' as const, label: 'Framework Fit', description: 'Is the chosen structure appropriate to this type of problem?', weight: 0.20, weightLabel: '20%' },
  { key: 'data_integrity' as const, label: 'Data Integrity', description: 'Did they use available data correctly, not cherry-pick?', weight: 0.20, weightLabel: '20%' },
  { key: 'insight_depth' as const, label: 'Insight Depth', description: 'Are recommendations non-obvious? Would a smart operator dismiss this?', weight: 0.25, weightLabel: '25%' },
  { key: 'feasibility' as const, label: 'Feasibility', description: 'Can this realistically be implemented given constraints?', weight: 0.10, weightLabel: '10%' },
] as const;

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

export function getUserByUsername(username: string): User | undefined {
  return MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
}

// ─── Users ───

export const MOCK_USERS: User[] = [
  {
    id: 'u001', username: 'marcusvance', name: 'Marcus Vance', initials: 'MV',
    reviewerTier: 'Arbiter', solve_score: 4820, review_score: 4900, credibility_score: 4840,
    merge_bonus_count: 5, status: 'Active', joinDate: '2024-09-15', reviewsCompleted: 87,
    avgAuthorRating: 4.7, bio: 'Ex-McKinsey engagement manager. 12 years in strategic operations across FMCG and healthcare.',
    casesSolved: 34, rankDelta: 2, specializations: ['Operational', 'M&A', 'Profitability'],
  },
  {
    id: 'u002', username: 'elenarostova', name: 'Elena Rostova', initials: 'ER',
    reviewerTier: 'Verified', solve_score: 4910, review_score: 4200, credibility_score: 5197,
    merge_bonus_count: 3, status: 'Active', joinDate: '2024-10-02', reviewsCompleted: 52,
    avgAuthorRating: 4.5, bio: 'Strategy lead at a Series C fintech. Specializes in pricing models and market-entry frameworks.',
    casesSolved: 28, rankDelta: 1, specializations: ['Pricing', 'Market Entry', 'Profitability'],
  },
  {
    id: 'u003', username: 'devonkincaid', name: 'Devon Kincaid', initials: 'DK',
    reviewerTier: 'Verified', solve_score: 4350, review_score: 4550, credibility_score: 4410,
    merge_bonus_count: 1, status: 'Active', joinDate: '2024-11-20', reviewsCompleted: 44,
    avgAuthorRating: 4.3, bio: 'Operations consultant turned startup operator. Focus on supply-chain optimization and unit economics.',
    casesSolved: 19, rankDelta: -1, specializations: ['Operational', 'Profitability'],
  },
  {
    id: 'u004', username: 'priyamehta', name: 'Priya Mehta', initials: 'PM',
    reviewerTier: 'Verified', solve_score: 4280, review_score: 4600, credibility_score: 4376,
    merge_bonus_count: 2, status: 'Active', joinDate: '2024-12-01', reviewsCompleted: 38,
    avgAuthorRating: 4.6, bio: 'Product strategy at a B2B SaaS unicorn. Deep expertise in competitive analysis and GTM frameworks.',
    casesSolved: 22, rankDelta: 3, specializations: ['Market Entry', 'Growth & Retention', 'Market Sizing'],
  },
  {
    id: 'u005', username: 'hassanaljamil', name: 'Hassan Al-Jamil', initials: 'HA',
    reviewerTier: 'General', solve_score: 3800, review_score: 3900, credibility_score: 3830,
    merge_bonus_count: 0, status: 'Dormant', joinDate: '2025-01-10', reviewsCompleted: 16,
    avgAuthorRating: 3.9, bio: 'MBA candidate with experience in PE deal screening. Interested in restructuring and turnaround cases.',
    casesSolved: 8, rankDelta: 0, specializations: ['M&A', 'Profitability'],
  },
  {
    id: 'u006', username: 'sarahjenkins', name: 'Sarah Jenkins', initials: 'SJ',
    reviewerTier: 'Verified', solve_score: 4500, review_score: 4450, credibility_score: 4485,
    merge_bonus_count: 2, status: 'Active', joinDate: '2024-10-18', reviewsCompleted: 61,
    avgAuthorRating: 4.4, bio: 'Independent strategy consultant. Previously BCG (4 years). Specializes in digital transformation.',
    casesSolved: 24, rankDelta: 'NEW', specializations: ['Operational', 'Growth & Retention'],
  },
  {
    id: 'u007', username: 'jamesthornton', name: 'James Thornton', initials: 'JT',
    reviewerTier: 'General', solve_score: 3650, review_score: 4100, credibility_score: 3785,
    merge_bonus_count: 0, status: 'Active', joinDate: '2025-02-05', reviewsCompleted: 22,
    avgAuthorRating: 4.0, bio: 'Final year business student. Case competition veteran — 3x national finalist.',
    casesSolved: 11, rankDelta: 4, specializations: ['Market Sizing', 'Market Entry'],
  },
  {
    id: 'u008', username: 'anikapatel', name: 'Anika Patel', initials: 'AP',
    reviewerTier: 'General', solve_score: 4100, review_score: 3750, credibility_score: 3995,
    merge_bonus_count: 0, status: 'Active', joinDate: '2025-03-12', reviewsCompleted: 14,
    avgAuthorRating: 3.8, bio: 'Early-career analyst at a boutique consulting firm. Building expertise in market sizing and competitive strategy.',
    casesSolved: 9, rankDelta: -2, specializations: ['Market Sizing', 'Pricing'],
  },
  {
    id: 'u009', username: 'liamosullivan', name: 'Liam O\'Sullivan', initials: 'LO',
    reviewerTier: 'Arbiter', solve_score: 4750, review_score: 4850, credibility_score: 4780,
    merge_bonus_count: 4, status: 'Active', joinDate: '2024-09-20', reviewsCompleted: 95,
    avgAuthorRating: 4.8, bio: 'Ex-Bain partner. 18 years in management consulting. Currently advising PE portfolio companies.',
    casesSolved: 41, rankDelta: 0, specializations: ['M&A', 'Operational', 'Profitability'],
  },
  {
    id: 'u010', username: 'meilinchen', name: 'Mei Lin Chen', initials: 'MC',
    reviewerTier: 'General', solve_score: 3400, review_score: 3600, credibility_score: 3460,
    merge_bonus_count: 0, status: 'Dormant', joinDate: '2025-04-01', reviewsCompleted: 8,
    avgAuthorRating: 3.5, bio: 'Product manager exploring consulting frameworks. Background in data analytics and ML applications.',
    casesSolved: 5, rankDelta: -3, specializations: ['Growth & Retention', 'Market Sizing'],
  },
];

// ─── Cases ───

export const MOCK_CASES: Case[] = [
  {
    id: 'case001',
    title: 'D2C Brand Margin Erosion: Reverse the Bleed',
    type: 'Profitability',
    sector: 'E-Commerce',
    companyType: 'Series B E-commerce Startup',
    industry: 'E-Commerce',
    difficulty: 'Chaos',
    status: 'Open',
    track: 'curated_case',
    description: 'A D2C beauty brand has seen gross margins decline from 68% to 41% over 18 months despite 3x revenue growth. CAC has tripled. ROAS on Meta ads has collapsed. The founder is considering wholesale distribution but fears brand dilution. Design a strategic intervention that stops margin erosion without sacrificing growth trajectory.',
    deliverables: ['Problem framing memo (300w)', 'Revenue & cost branch analysis', 'Root cause summary (200w)', '3 structured recommendations', 'First 90-day action step (150w)'],
    pts: 500,
    submissionCount: 12,
    reviewCount: 28,
    deadline: '2025-07-15',
    tags: ['D2C', 'B2C', 'Crisis', 'Unit Economics'],
    is_chaos: true,
    timer_deadline: '2025-06-28T18:00:00Z',
    isFeatured: true,
  },
  {
    id: 'case002',
    title: 'Hospital Network Merger: Integration Playbook',
    type: 'M&A',
    sector: 'Healthcare',
    companyType: 'Regional Healthcare System',
    industry: 'Healthcare',
    difficulty: 'High',
    status: 'Open',
    track: 'curated_case',
    description: 'Two regional hospital networks (combined 14 facilities) are merging. Cultural differences are significant — one is physician-led, the other is administrator-led. Design the 18-month integration roadmap covering governance, clinical standardization, and workforce strategy.',
    deliverables: ['Integration thesis (250w)', 'Governance structure', 'Clinical standardization plan', 'Workforce transition roadmap', 'Risk mitigation checklist'],
    pts: 400,
    submissionCount: 8,
    reviewCount: 18,
    deadline: '2025-07-30',
    tags: ['Regulated', 'B2B', 'Data-heavy'],
  },
  {
    id: 'case003',
    title: 'Fintech Pricing Model Overhaul',
    type: 'Pricing',
    sector: 'Financial Services',
    companyType: 'Series C B2B Fintech',
    industry: 'Financial Services',
    difficulty: 'Standard',
    status: 'In_Review',
    track: 'curated_case',
    description: 'A B2B payments company has been using flat-rate pricing since launch. With 2,400 merchants onboard, they need to migrate to tiered or usage-based pricing without churning their base. Design the pricing architecture and migration strategy.',
    deliverables: ['Current pricing diagnosis', 'Tier architecture proposal', 'Migration phasing plan', 'Churn risk assessment', 'Revenue impact model'],
    pts: 350,
    submissionCount: 15,
    reviewCount: 42,
    deadline: '2025-06-28',
    tags: ['SaaS', 'B2B', 'Data-heavy'],
  },
  {
    id: 'case004',
    title: 'QSR Chain: New Market Entry Decision',
    type: 'Market Entry',
    sector: 'Food & Beverage',
    companyType: 'National Quick-Service Restaurant',
    industry: 'Food & Beverage',
    difficulty: 'Standard',
    status: 'Completed',
    track: 'curated_case',
    description: 'A 200-location QSR chain dominating the Midwest is evaluating expansion into the Southeast. Analyze market attractiveness, competitive density, supply chain feasibility, and recommend a phased entry plan.',
    deliverables: ['Market attractiveness scorecard', 'Competitive density map', 'Supply chain feasibility', 'Phased entry plan', 'Investment thesis (200w)'],
    pts: 300,
    submissionCount: 22,
    reviewCount: 61,
    deadline: '2025-05-30',
    tags: ['B2C', 'Greenfield', 'India-specific'],
  },
  {
    id: 'case005',
    title: 'SaaS Churn Crisis: Retention Architecture',
    type: 'Growth & Retention',
    sector: 'Technology',
    companyType: 'Series A Vertical SaaS',
    industry: 'Technology',
    difficulty: 'High',
    status: 'Open',
    track: 'curated_case',
    description: 'A vertical SaaS platform for property managers has hit 8.5% monthly churn after rapid scaling. NPS has dropped from 52 to 18 in two quarters. Product usage data shows a clear engagement cliff at day 14. Design a retention system that addresses root causes, not symptoms.',
    deliverables: ['Churn root-cause tree', 'Day-14 engagement intervention', 'Retention metric dashboard', 'CS playbook outline', '90-day retention target model'],
    pts: 400,
    submissionCount: 6,
    reviewCount: 10,
    deadline: '2025-08-10',
    tags: ['SaaS', 'B2B', 'Data-heavy'],
  },
  {
    id: 'case006',
    title: 'Manufacturing Supply Chain Resilience Audit',
    type: 'Operational',
    sector: 'Manufacturing',
    companyType: 'Mid-Market Industrial Manufacturer',
    industry: 'Manufacturing',
    difficulty: 'High',
    status: 'Open',
    track: 'curated_case',
    description: 'A precision parts manufacturer with $180M revenue sources 60% of raw materials from two suppliers in the same geographic region. After a recent disruption caused $4M in losses, the board wants a resilience overhaul. Build the risk assessment and diversification framework.',
    deliverables: ['Supplier risk matrix', 'Single-source exposure map', 'Diversification roadmap', 'Cost impact analysis', 'Board-ready summary (250w)'],
    pts: 375,
    submissionCount: 4,
    reviewCount: 6,
    deadline: '2025-08-20',
    tags: ['B2B', 'Regulated', 'Data-heavy'],
  },
  {
    id: 'case007',
    title: 'Indian EV Charging TAM: 2030 Sizing',
    type: 'Market Sizing',
    sector: 'Mobility',
    companyType: 'Growth-stage EV Infrastructure Co.',
    industry: 'Mobility',
    difficulty: 'Standard',
    status: 'Open',
    track: 'curated_case',
    description: 'An EV charging startup needs a credible TAM estimate for India by 2030 to pitch Series B investors. Build a bottom-up market sizing with explicit assumptions, sanity checks, and a sensitivity range.',
    deliverables: ['Approach selection & rationale', 'Key assumptions (250w)', 'Calculation steps', 'Final estimate + range', 'Sanity check (150w)'],
    pts: 275,
    submissionCount: 9,
    reviewCount: 14,
    deadline: '2025-07-20',
    tags: ['India-specific', 'Greenfield', 'Data-heavy'],
  },
  {
    id: 'case008',
    title: 'Legacy Bank Digital Transformation ROI',
    type: 'Operational',
    sector: 'Financial Services',
    companyType: 'Tier-2 Regional Bank',
    industry: 'Financial Services',
    difficulty: 'Standard',
    status: 'Open',
    track: 'curated_case',
    description: 'A regional bank is spending $120M over 3 years on core banking modernization. The board wants a consulting-grade ROI framework and prioritization matrix for which workstreams deliver the highest customer and cost impact first.',
    deliverables: ['Workstream inventory', 'ROI scoring matrix', 'Prioritization recommendation', 'Implementation sequencing', 'KPI dashboard spec'],
    pts: 325,
    submissionCount: 7,
    reviewCount: 12,
    deadline: '2025-08-05',
    tags: ['Regulated', 'B2B', 'Data-heavy'],
  },
];

// ─── Track 1: Open Arena Cases ───
export const MOCK_ARENA_CASES: Case[] = [
  {
    id: 'arena001',
    title: 'Startup CAC Optimization Strategy',
    type: 'Profitability',
    sector: 'Technology',
    companyType: 'Series B SaaS',
    industry: 'Technology',
    difficulty: 'Standard',
    status: 'Open',
    track: 'open_arena',
    description: 'A B2B SaaS startup has seen CAC rise from $450 to $1,200 over 6 months while LTV remained flat. Design a CAC optimization framework.',
    deliverables: ['CAC analysis (200w)', 'Channel optimization plan', 'Budget allocation model'],
    pts: 150,
    submissionCount: 24,
    reviewCount: 0,
    deadline: '2025-07-25',
    tags: ['SaaS', 'B2B'],
    upvotes: 45,
  },
  {
    id: 'arena002',
    title: 'Retail Store Location Optimization',
    type: 'Market Entry',
    sector: 'Retail',
    companyType: 'D2C Brand',
    industry: 'Retail',
    difficulty: 'Standard',
    status: 'Open',
    track: 'open_arena',
    description: 'A D2C brand wants to optimize their 50 store locations. Which locations to keep, expand, or close?',
    deliverables: ['Location scoring model', 'Recommendation matrix', 'ROI analysis'],
    pts: 125,
    submissionCount: 18,
    reviewCount: 0,
    deadline: '2025-07-28',
    tags: ['B2C', 'D2C'],
    upvotes: 32,
  },
];

// ─── Track 2: Community Questions ───
export const MOCK_QUESTIONS: Case[] = [
  {
    id: 'question001',
    title: 'How to structure a pricing model for a B2B marketplace?',
    type: 'Pricing',
    sector: 'Technology',
    companyType: 'Early-stage Startup',
    industry: 'Technology',
    difficulty: 'Standard',
    status: 'Open',
    track: 'community_question',
    description: 'Building a B2B marketplace connecting suppliers with buyers. Need guidance on pricing structure - commission vs subscription vs hybrid.',
    deliverables: ['Pricing model recommendation', 'Competitive analysis', 'Revenue projection'],
    pts: 100,
    submissionCount: 8,
    reviewCount: 0,
    deadline: '2025-07-22',
    tags: ['SaaS', 'B2B'],
    posterId: 'user001',
  },
  {
    id: 'question002',
    title: 'Market sizing approach for EV charging in Tier 2 cities',
    type: 'Market Sizing',
    sector: 'Mobility',
    companyType: 'Growth-stage Startup',
    industry: 'Mobility',
    difficulty: 'Standard',
    status: 'Accepted',
    track: 'community_question',
    description: 'Need to estimate market size for EV charging stations in Tier 2 Indian cities. What approach should I use?',
    deliverables: ['Market sizing framework', 'Key assumptions', 'Sanity checks'],
    pts: 100,
    submissionCount: 5,
    reviewCount: 0,
    deadline: '2025-07-15',
    tags: ['India-specific', 'Greenfield'],
    posterId: 'user002',
    acceptedSolutionId: 'sol001',
  },
];

// ─── Submissions ───

export const MOCK_SUBMISSIONS: Submission[] = [
  { id: 'sub001', caseId: 'case001', caseName: 'D2C Brand Margin Erosion', userId: 'u006', status: 'Completed', finalScore: 435, createdAt: '2025-06-10' },
  { id: 'sub002', caseId: 'case003', caseName: 'Fintech Pricing Model Overhaul', userId: 'u006', status: 'Pending_Review', finalScore: null, createdAt: '2025-06-18' },
  { id: 'sub003', caseId: 'case004', caseName: 'QSR Chain: Market Entry', userId: 'u006', status: 'Merged', finalScore: 472, createdAt: '2025-05-22' },
  { id: 'sub004', caseId: 'case002', caseName: 'Hospital Network Merger', userId: 'u006', status: 'Draft', finalScore: null, createdAt: '2025-06-22' },
  { id: 'sub005', caseId: 'case005', caseName: 'SaaS Churn Crisis', userId: 'u006', status: 'In_Dispute', finalScore: null, createdAt: '2025-06-20' },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev001', submissionId: 'sub001', reviewerId: 'u004', reviewerTier: 'Verified',
    scores: { problem_framing: 4, framework_fit: 5, data_integrity: 4, insight_depth: 4, feasibility: 3 },
    feedback: 'Strong profitability framing with clear revenue/cost branches. Recommendations are actionable but the 90-day step could be more specific on ownership.',
    isVoided: false, createdAt: '2025-06-12',
  },
  {
    id: 'rev002', submissionId: 'sub001', reviewerId: 'u003', reviewerTier: 'Verified',
    scores: { problem_framing: 4, framework_fit: 4, data_integrity: 4, insight_depth: 5, feasibility: 4 },
    feedback: 'Excellent insight depth on channel mix trade-offs. Data integrity is solid — assumptions are stated and sourced. Minor gap in feasibility constraints for wholesale pivot.',
    isVoided: false, createdAt: '2025-06-13',
  },
];

export const CURRENT_USER: User = MOCK_USERS.find(u => u.id === 'u006')!;

export const GATE_STATE: Record<string, number> = {
  case001: 1,
  case002: 2,
  case003: 0,
  case004: 2,
  case005: 0,
  case006: 1,
  case007: 0,
  case008: 0,
};

export const PLATFORM_STATS = {
  totalCasesSolved: 147,
  activeConsultants: 312,
  companiesServed: 28,
  mergeBonusesAwarded: 43,
};

export const SUBMISSION_TEMPLATES: Record<ProblemType, { key: string; label: string; wordLimit: number; placeholder: string }[]> = {
  'Market Sizing': [
    { key: 'approach', label: 'Approach Selection', wordLimit: 100, placeholder: 'Top-down, bottom-up, or hybrid — and why...' },
    { key: 'assumptions', label: 'Key Assumptions', wordLimit: 250, placeholder: 'State every assumption explicitly with sources...' },
    { key: 'calculation', label: 'Calculation Steps', wordLimit: 400, placeholder: 'Show your math step by step...' },
    { key: 'estimate', label: 'Final Estimate + Range', wordLimit: 150, placeholder: 'Point estimate and low/high range...' },
    { key: 'sanity', label: 'Sanity Check', wordLimit: 150, placeholder: 'Cross-check against comparable markets or benchmarks...' },
  ],
  Profitability: [
    { key: 'framing', label: 'Problem Framing', wordLimit: 300, placeholder: 'Identify and articulate the core profitability issue...' },
    { key: 'framework', label: 'Framework Rationale', wordLimit: 200, placeholder: 'Why this framework fits the problem type...' },
    { key: 'revenue', label: 'Revenue Branch', wordLimit: 300, placeholder: 'Revenue drivers, trends, and levers...' },
    { key: 'cost', label: 'Cost Branch', wordLimit: 300, placeholder: 'Cost structure analysis and key drivers...' },
    { key: 'root_cause', label: 'Root Cause', wordLimit: 200, placeholder: 'Primary root cause with supporting evidence...' },
    { key: 'recommendations', label: '3 Structured Recommendations', wordLimit: 400, placeholder: 'Three distinct, prioritized recommendations...' },
    { key: 'first_step', label: 'First 90-Day Step', wordLimit: 150, placeholder: 'The single most impactful first action...' },
  ],
  'Market Entry': [
    { key: 'framing', label: 'Entry Decision Framing', wordLimit: 250, placeholder: 'Define the entry question and success criteria...' },
    { key: 'attractiveness', label: 'Market Attractiveness', wordLimit: 350, placeholder: 'Size, growth, profitability, and competitive intensity...' },
    { key: 'feasibility', label: 'Entry Feasibility', wordLimit: 300, placeholder: 'Capabilities, resources, and regulatory constraints...' },
    { key: 'strategy', label: 'Recommended Entry Strategy', wordLimit: 350, placeholder: 'Mode, sequencing, and investment thesis...' },
    { key: 'risks', label: 'Key Risks & Mitigations', wordLimit: 200, placeholder: 'Top 3 risks with mitigation plans...' },
  ],
  Operational: [
    { key: 'framing', label: 'Operational Problem Framing', wordLimit: 250, placeholder: 'Define the operational bottleneck or inefficiency...' },
    { key: 'current_state', label: 'Current State Analysis', wordLimit: 350, placeholder: 'Process map, metrics, and pain points...' },
    { key: 'root_cause', label: 'Root Cause Analysis', wordLimit: 250, placeholder: 'Why the current state persists...' },
    { key: 'solution', label: 'Proposed Solution', wordLimit: 400, placeholder: 'Operational improvements with expected impact...' },
    { key: 'implementation', label: 'Implementation Plan', wordLimit: 250, placeholder: 'Timeline, owners, and quick wins...' },
  ],
  Pricing: [
    { key: 'framing', label: 'Pricing Problem Framing', wordLimit: 250, placeholder: 'Current pricing model and the core issue...' },
    { key: 'analysis', label: 'Pricing Analysis', wordLimit: 350, placeholder: 'Willingness-to-pay, competitive benchmarks, unit economics...' },
    { key: 'architecture', label: 'Proposed Pricing Architecture', wordLimit: 350, placeholder: 'Tier structure, metrics, and rationale...' },
    { key: 'migration', label: 'Migration Strategy', wordLimit: 250, placeholder: 'How to transition existing customers...' },
    { key: 'impact', label: 'Revenue Impact Model', wordLimit: 200, placeholder: 'Expected revenue and churn impact...' },
  ],
  'M&A': [
    { key: 'framing', label: 'Deal Framing', wordLimit: 250, placeholder: 'Strategic rationale for the transaction...' },
    { key: 'synergies', label: 'Synergy Analysis', wordLimit: 350, placeholder: 'Revenue and cost synergies with quantification...' },
    { key: 'integration', label: 'Integration Plan', wordLimit: 400, placeholder: 'Day 1, 100-day, and 18-month milestones...' },
    { key: 'risks', label: 'Deal Risks', wordLimit: 200, placeholder: 'Integration, cultural, and regulatory risks...' },
    { key: 'recommendation', label: 'Go/No-Go Recommendation', wordLimit: 200, placeholder: 'Final recommendation with conditions...' },
  ],
  'Growth & Retention': [
    { key: 'framing', label: 'Growth Problem Framing', wordLimit: 250, placeholder: 'Define the growth or retention challenge...' },
    { key: 'diagnosis', label: 'Root Cause Diagnosis', wordLimit: 350, placeholder: 'Funnel analysis, cohort data, and key drivers...' },
    { key: 'levers', label: 'Growth Levers', wordLimit: 350, placeholder: 'Acquisition, activation, retention, and expansion levers...' },
    { key: 'experiments', label: 'Recommended Experiments', wordLimit: 300, placeholder: 'Prioritized tests with expected impact...' },
    { key: 'metrics', label: 'Success Metrics', wordLimit: 150, placeholder: 'KPIs and targets for the next 90 days...' },
  ],
};
