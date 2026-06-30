// ═══════════════════════════════════════════════════
// CRACKED? — API SERVICE LAYER
// Connects frontend to backend
// ═══════════════════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_URL || window.location.origin;

export interface ApiError {
  success: false;
  error: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for session-based auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.statusText}`);
  }

  return data;
}

// ─── Arena (Track 1) ───

export interface ArenaCase {
  id: string;
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  status: string;
  description: string;
  deliverables: string[];
  pts: number;
  submissionCount: number;
  upvotes: number;
  deadline: string;
  tags: string[];
}

export interface ArenaSubmission {
  id: string;
  caseId: string;
  userId: string;
  content: Record<string, string>;
  upvotes: number;
  downvotes: number;
  status: 'Draft' | 'Published';
  createdAt: string;
}

export async function getArenaCases(): Promise<ArenaCase[]> {
  // Mock data - in production this would call GET /api/arena
  const { MOCK_ARENA_CASES } = await import('../data/mockData');
  return MOCK_ARENA_CASES as ArenaCase[];
}

export async function getArenaCase(id: string): Promise<ArenaCase | null> {
  const cases = await getArenaCases();
  return cases.find(c => c.id === id) || null;
}

export async function submitArenaSolution(caseId: string, content: Record<string, string>): Promise<ArenaSubmission> {
  // Mock submission - in production this would call POST /api/arena/[id]/submit
  return {
    id: `arena_sub_${Date.now()}`,
    caseId,
    userId: 'current_user',
    content,
    upvotes: 0,
    downvotes: 0,
    status: 'Published',
    createdAt: new Date().toISOString(),
  };
}

export async function voteArenaSubmission(_submissionId: string, _direction: 'up' | 'down'): Promise<void> {
  // Mock vote - in production this would call POST /api/arena/submissions/[id]/vote
  // Rate limit: 1 vote per user per submission
}

export async function getArenaSolutions(_caseId: string): Promise<ArenaSubmission[]> {
  // Mock solutions - in production this would call GET /api/arena/[id]/solutions
  return [];
}

// ─── Cases ───

export interface Case {
  id: string;
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  status: string;
  description: string;
  deliverables: string[];
  pts: number;
  submissionCount: number;
  reviewCount: number;
  deadline: string;
  tags: string[];
  is_chaos?: boolean;
  timer_deadline?: string;
}

export async function getCases(): Promise<Case[]> {
  // For now, return mock data since backend doesn't have this endpoint yet
  // This will be replaced when backend implements case listing
  const { MOCK_CASES } = await import('../data/mockData');
  return MOCK_CASES;
}

export async function getCaseById(id: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find(c => c.id === id) || null;
}

// ─── Submissions ───

export interface SubmissionRequest {
  caseId: string;
  contentJson: Record<string, string>;
  citationsCount: number;
  wordCount: number;
}

export interface SubmissionResponse {
  success: true;
  submissionId: string;
  status: string;
}

export async function createSubmission(
  caseId: string,
  content: Record<string, string>,
  citationsCount: number,
  wordCount: number
): Promise<SubmissionResponse> {
  return request<SubmissionResponse>(`/api/cases/${caseId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({
      contentJson: content,
      citationsCount,
      wordCount,
    }),
  });
}

export async function updateSubmission(
  _submissionId: string,
  _content: Record<string, string>
): Promise<{ success: true }> {
  // Backend doesn't have this endpoint yet, mock for now
  return { success: true };
}

// ─── Reviews ───

export interface ReviewRequest {
  problem_framing: number;
  framework_fit: number;
  data_integrity: number;
  insight_depth: number;
  feasibility: number;
}

export interface ReviewResponse {
  success: true;
  engineAction: string;
}

export async function createReview(
  submissionId: string,
  scores: ReviewRequest
): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/api/submissions/${submissionId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(scores),
  });
}

export async function flagReview(_reviewId: string): Promise<{ success: true }> {
  // Backend doesn't have this endpoint yet, mock for now
  return { success: true };
}

// ─── Gate Check ───

export interface GateStatus {
  reviews_completed: number;
  can_submit: boolean;
}

export async function getGateStatus(caseId: string): Promise<GateStatus> {
  // Backend doesn't have this endpoint yet, use mock data
  const { GATE_STATE } = await import('../data/mockData');
  const reviewsCompleted = GATE_STATE[caseId] || 0;
  return {
    reviews_completed: reviewsCompleted,
    can_submit: reviewsCompleted >= 2,
  };
}

// ─── Review Queue ───

export interface ReviewQueueResponse {
  submissionId: string;
  caseId: string;
}

export async function getNextReviewSubmission(caseId: string): Promise<ReviewQueueResponse> {
  // Backend doesn't have this endpoint yet, return mock data
  // In production, this would call GET /api/review-queue/:caseId
  return {
    submissionId: 'sub001',
    caseId,
  };
}

// ─── User & Profile ───

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  solve_score: number;
  review_score: number;
  credibility_score: number;
  merge_bonus_count: number;
  casesSolved: number;
  bio: string;
  tier: string;
}

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  const { getUserByUsername } = await import('../data/mockData');
  const user = getUserByUsername(username);
  if (!user) return null;
  
  const { getCredibilityTier } = await import('../data/mockData');
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    solve_score: user.solve_score,
    review_score: user.review_score,
    credibility_score: user.credibility_score,
    merge_bonus_count: user.merge_bonus_count,
    casesSolved: user.casesSolved,
    bio: user.bio,
    tier: getCredibilityTier(user.credibility_score),
  };
}

// ─── Leaderboard ───

export interface LeaderboardEntry {
  rank: number;
  user: UserProfile;
  score: number;
  casesSolved: number;
  mergeBonuses: number;
  rankDelta: number | 'NEW';
}

export async function getLeaderboard(
  _period: 'all' | 'month' = 'all',
  _type?: string
): Promise<LeaderboardEntry[]> {
  // Backend doesn't have this endpoint yet, use mock data
  const { MOCK_USERS, getCredibilityTier } = await import('../data/mockData');
  return MOCK_USERS.map((user, index) => ({
    rank: index + 1,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      solve_score: user.solve_score,
      review_score: user.review_score,
      credibility_score: user.credibility_score,
      merge_bonus_count: user.merge_bonus_count,
      casesSolved: user.casesSolved,
      bio: user.bio,
      tier: getCredibilityTier(user.credibility_score),
    },
    score: user.credibility_score,
    casesSolved: user.casesSolved,
    mergeBonuses: user.merge_bonus_count,
    rankDelta: user.rankDelta,
  }));
}
