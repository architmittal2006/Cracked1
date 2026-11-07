// ═══════════════════════════════════════════════════
// CRACKED? — API SERVICE LAYER
// Connects frontend to backend
// ═══════════════════════════════════════════════════

import type { Case as CaseRecord } from '../data/mockData';

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
    const error = new Error(data.error || `API error: ${response.statusText}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data;
}

export interface AccountProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
}

export type AdminAccount = AccountProfile & { accessRole: 'Student' | 'Admin' };

export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const result = await request<{ success: true; profile: AccountProfile }>('/api/account/profile');
  return result.profile;
}

export async function updateAccountProfile(input: {
  username: string;
  name: string;
  bio: string | null;
}): Promise<AccountProfile> {
  const result = await request<{ success: true; profile: AccountProfile }>('/api/account/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return result.profile;
}

export async function changeAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await request<{ success: true }>('/api/account/password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const result = await request<{ success: true; accounts: AdminAccount[] }>('/api/admin/accounts');
  return result.accounts;
}

export async function setAdminAccountStatus(id: string, status: 'active' | 'suspended'): Promise<AdminAccount> {
  const result = await request<{ success: true; account: AdminAccount }>(
    `/api/admin/accounts/${encodeURIComponent(id)}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  );
  return result.account;
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  const result = await request<{ success: true; logs: AdminAuditLog[] }>('/api/admin/audit-logs');
  return result.logs;
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

export type Case = CaseRecord;

export async function getCases(): Promise<Case[]> {
  return request<Case[]>('/api/cases');
}

export async function getCaseById(id: string): Promise<Case | null> {
  const cases = await getCases();
  return cases.find((caseData) => caseData.id === id) ?? null;
}

export type CaseProposalStatus = 'Pending' | 'Changes_Requested' | 'Approved' | 'Declined';

export interface CaseProposalInput {
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  sourceKind: 'original' | 'interview_recollection' | 'public_source';
  sourceReference: string;
  context: string;
  prompt: string;
  exhibits: string;
  deliverables: string[];
  reviewerGuide: string;
  solutionOutline: string;
  referenceRange?: { value: number; unit: string; low: number; high: number };
  originalityConfirmed: boolean;
  confidentialityConfirmed: boolean;
}

export type CaseProposal = Omit<CaseProposalInput, 'originalityConfirmed' | 'confidentialityConfirmed' | 'sourceReference' | 'exhibits'> & {
  id: string;
  contributorId: string;
  sourceReference: string | null;
  exhibits: string | null;
  status: CaseProposalStatus;
  moderatorNotes: string | null;
  publishedCaseId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  contributorName?: string;
};

export async function submitCaseProposal(input: CaseProposalInput): Promise<CaseProposal> {
  const result = await request<{ success: true; proposal: CaseProposal }>('/api/case-proposals', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.proposal;
}

export async function getMyCaseProposals(): Promise<CaseProposal[]> {
  const result = await request<{ success: true; proposals: CaseProposal[] }>('/api/case-proposals/mine');
  return result.proposals;
}

export async function getCaseProposal(id: string): Promise<CaseProposal> {
  const result = await request<{ success: true; proposal: CaseProposal }>(
    `/api/case-proposals/${encodeURIComponent(id)}`
  );
  return result.proposal;
}

export async function updateCaseProposal(id: string, input: CaseProposalInput): Promise<CaseProposal> {
  const result = await request<{ success: true; proposal: CaseProposal }>(
    `/api/case-proposals/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(input) }
  );
  return result.proposal;
}

export async function getCaseProposalQueue(): Promise<CaseProposal[]> {
  const result = await request<{ success: true; proposals: CaseProposal[] }>('/api/moderation/case-proposals');
  return result.proposals;
}

export async function reviewCaseProposal(
  id: string,
  action: 'approve' | 'request_changes' | 'decline',
  notes: string
): Promise<CaseProposal> {
  const result = await request<{ success: true; proposal: CaseProposal }>(
    `/api/moderation/case-proposals/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ action, notes }) }
  );
  return result.proposal;
}

export type CasebookStatus = 'Pending' | 'Changes_Requested' | 'Published' | 'Declined' | 'Taken_down';
export type CasebookSourceKind = 'university' | 'company' | 'club' | 'original';
export type CasebookLicenseKind = 'original' | 'permission' | 'open_license' | 'link_only';

export interface CasebookCaseInput {
  title: string;
  firm?: string | null;
  sector: string;
  caseType?: string | null;
  difficulty: string;
  summary: string;
  body?: string;
  position: number;
  practiceCaseId?: string | null;
}

export interface CasebookInput {
  title: string;
  sourceOrg: string;
  sourceKind: CasebookSourceKind;
  year?: number | null;
  description: string;
  licenseKind: CasebookLicenseKind;
  permissionReference?: string;
  externalUrl?: string;
  industries: string[];
  cases: CasebookCaseInput[];
  rightsConfirmed: boolean;
  attributionConfirmed: boolean;
}

export interface CasebookCase extends Omit<CasebookCaseInput, 'body'> {
  id: string;
  slug: string;
  body?: string | null;
}

export interface Casebook {
  id: string;
  slug: string;
  title: string;
  sourceOrg: string;
  sourceKind: CasebookSourceKind;
  year: number | null;
  description: string;
  licenseKind: CasebookLicenseKind;
  permissionReference: string | null;
  externalUrl: string | null;
  industries: string[];
  caseCount: number;
  status: CasebookStatus;
  moderatorNotes?: string | null;
  createdAt: string;
  publishedAt: string | null;
  cases?: CasebookCase[];
  uploaderName?: string;
}

export interface CasebookFilters {
  search?: string;
  sourceKind?: CasebookSourceKind;
  sector?: string;
  caseType?: string;
  year?: number;
  page?: number;
  pageSize?: number;
}

export interface CasebookSearchResult {
  casebooks: Casebook[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getCasebooks(filters: CasebookFilters = {}): Promise<CasebookSearchResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  const result = await request<{ success: true } & CasebookSearchResult>(
    `/api/casebooks${query ? `?${query}` : ''}`
  );
  return result;
}

export async function getCasebookBySlug(slug: string): Promise<Casebook> {
  const result = await request<{ success: true; casebook: Casebook }>(
    `/api/casebooks/${encodeURIComponent(slug)}`
  );
  return result.casebook;
}

export async function getCasebookCase(
  slug: string,
  caseSlug: string
): Promise<{ casebook: Casebook; caseItem: CasebookCase }> {
  return request<{ success: true; casebook: Casebook; caseItem: CasebookCase }>(
    `/api/casebooks/${encodeURIComponent(slug)}/cases/${encodeURIComponent(caseSlug)}`
  );
}

export async function submitTakedownRequest(input: {
  casebookId: string;
  requesterEmail: string;
  reason: string;
}): Promise<void> {
  await request<{ success: true; requestId: string }>('/api/takedown', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getMyCasebooks(): Promise<Casebook[]> {
  const result = await request<{ success: true; casebooks: Casebook[] }>('/api/casebooks/mine');
  return result.casebooks;
}

export async function getMyCasebook(id: string): Promise<Casebook> {
  const result = await request<{ success: true; casebook: Casebook }>(
    `/api/casebooks/mine/${encodeURIComponent(id)}`
  );
  return result.casebook;
}

export async function submitCasebook(input: CasebookInput): Promise<Casebook> {
  const result = await request<{ success: true; casebook: Casebook }>('/api/casebooks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.casebook;
}

export async function updateCasebook(id: string, input: CasebookInput): Promise<Casebook> {
  const result = await request<{ success: true; casebook: Casebook }>(
    `/api/casebooks/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(input) }
  );
  return result.casebook;
}

export async function getCasebookModerationQueue(status: 'Pending' | 'Published'): Promise<Casebook[]> {
  const result = await request<{ success: true; casebooks: Casebook[] }>(
    `/api/moderation/casebooks?status=${status}`
  );
  return result.casebooks;
}

export async function reviewCasebook(
  id: string,
  action: 'approve' | 'request_changes' | 'decline' | 'take_down',
  notes: string
): Promise<Casebook> {
  const result = await request<{ success: true; casebook: Casebook }>(
    `/api/moderation/casebooks/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ action, notes }) }
  );
  return result.casebook;
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
  referenceRange?: { value: number; unit: string; low: number; high: number } | null;
}

export interface CaseSolution {
  id: string;
  content: Record<string, string>;
  createdAt: string;
}

export async function getCaseSolutions(caseId: string): Promise<CaseSolution[]> {
  const result = await request<{ success: true; solutions: CaseSolution[] }>(
    `/api/cases/${encodeURIComponent(caseId)}/solutions`
  );
  return result.solutions;
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

export type ReviewRequest =
  | { problem_framing: number; framework_fit: number; data_integrity: number; insight_depth: number; feasibility: number }
  | { structure: number; assumption_quality: number; math_accuracy: number; sanity_check: number; clarity: number };

export interface ReviewResponse {
  success: true;
  engineAction: string;
}

export async function createReview(
  submissionId: string,
  scores: ReviewRequest,
  caseId: string,
  feedback: string
): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/api/submissions/${submissionId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ ...scores, caseId, feedback }),
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
  return request<GateStatus>(`/api/cases/${encodeURIComponent(caseId)}/gate-status`);
}

// ─── Review Queue ───

export interface ReviewQueueResponse {
  submissionId: string;
  caseId: string;
  content: Record<string, string>;
  referenceRangeHint?: boolean;
}

export async function getNextReviewSubmission(caseId: string): Promise<ReviewQueueResponse | null> {
  try {
    return await request<ReviewQueueResponse>(
      `/api/cases/${encodeURIComponent(caseId)}/review-queue`
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'No unreviewed submission is available for this case') {
      return null;
    }
    throw error;
  }
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


// --- Image Upload (Cloudinary) ---

export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const url = `${API_BASE}/api/upload/image`;
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to upload image");
  }

  return {
    url: data.url,
    publicId: data.publicId,
  };
}

// ─── Admin content CMS ───

export type CaseContentType =
  | 'Market Sizing' | 'Profitability' | 'Market Entry' | 'Operational'
  | 'Pricing' | 'M&A' | 'Growth & Retention' | 'Guesstimate';

export interface RubricCriterion { name: string; description: string }

export interface ReferenceRange { value: number; unit: string; low: number; high: number }

export interface CaseContentInput {
  title: string;
  type: CaseContentType;
  sector: string;
  difficulty: 'Standard' | 'High' | 'Chaos';
  description: string;
  exhibits?: string;
  deliverables: string[];
  referenceRange?: ReferenceRange | null;
  referenceSolution: string;
  rubricCriteria: RubricCriterion[];
  contentOwner: string;
  authorCredit?: string | null;
  sourceKind: 'original' | 'licensed' | 'public_domain' | 'permission_granted';
  sourceReference?: string | null;
  rightsDeclaration: string;
  rightsConfirmed: true;
}

export interface AdminContentItem {
  id: string;
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  caseStatus: string;
  contentStatus: 'Draft' | 'Published' | 'Unpublished';
  hasDraft: boolean;
  latestVersion: number | null;
  createdAt: string;
}

export interface CaseVersionSnapshot {
  id: string;
  case_id: string;
  version_number: number;
  status: 'Draft' | 'Published';
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  description: string;
  exhibits: string | null;
  deliverables: string[];
  reference_range: ReferenceRange | null;
  reference_solution: string;
  rubric_criteria: RubricCriterion[];
  content_owner: string;
  author_credit: string | null;
  source_kind: string;
  source_reference: string | null;
  rights_declaration: string;
  rights_verified: boolean;
  created_by: string | null;
  published_by: string | null;
  created_at: string;
  published_at: string | null;
}

export interface AdminContentDetail {
  case: Record<string, unknown> & { id: string; status: string; current_version_id: string | null };
  draft: CaseVersionSnapshot | null;
  published: CaseVersionSnapshot | null;
  versionCount: number;
}

export interface ContentVersionSummary {
  id: string;
  versionNumber: number;
  status: 'Draft' | 'Published';
  title: string;
  type: string;
  createdAt: string;
  publishedAt: string | null;
  createdBy: string | null;
  publishedBy: string | null;
}

const snapshotToInput = (snapshot: CaseVersionSnapshot): CaseContentInput => ({
  title: snapshot.title,
  type: snapshot.type as CaseContentType,
  sector: snapshot.sector,
  difficulty: snapshot.difficulty as CaseContentInput['difficulty'],
  description: snapshot.description,
  exhibits: snapshot.exhibits ?? undefined,
  deliverables: snapshot.deliverables ?? [],
  referenceRange: snapshot.reference_range ?? null,
  referenceSolution: snapshot.reference_solution,
  rubricCriteria: snapshot.rubric_criteria ?? [],
  contentOwner: snapshot.content_owner,
  authorCredit: snapshot.author_credit ?? null,
  sourceKind: snapshot.source_kind as CaseContentInput['sourceKind'],
  sourceReference: snapshot.source_reference ?? null,
  rightsDeclaration: snapshot.rights_declaration,
  rightsConfirmed: true,
});

export async function getAdminContent(filters: {
  type?: string; status?: string; q?: string;
} = {}): Promise<AdminContentItem[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const result = await request<{ success: true; content: AdminContentItem[] }>(
    `/api/admin/content${query ? `?${query}` : ''}`
  );
  return result.content;
}

export async function createAdminContent(input: CaseContentInput): Promise<{ caseId: string }> {
  const result = await request<{ success: true; caseId: string }>('/api/admin/content', {
    method: 'POST', body: JSON.stringify(input),
  });
  return { caseId: result.caseId };
}

export async function previewAdminContent(input: CaseContentInput): Promise<CaseContentInput> {
  const result = await request<{ success: true; content: CaseContentInput }>(
    '/api/admin/content/preview', { method: 'POST', body: JSON.stringify(input) }
  );
  return result.content;
}

export async function getAdminContentDetail(caseId: string): Promise<AdminContentDetail | null> {
  try {
    const result = await request<{ success: true } & AdminContentDetail>(
      `/api/admin/content/${encodeURIComponent(caseId)}`
    );
    return result;
  } catch {
    return null;
  }
}

export async function getAdminContentEditorState(caseId: string): Promise<{
  detail: AdminContentDetail;
  initial: CaseContentInput;
}> {
  const detail = await getAdminContentDetail(caseId);
  if (!detail) throw new Error('Content not found');
  const source = detail.draft ?? detail.published;
  if (!source) throw new Error('Content has no versions yet');
  return { detail, initial: snapshotToInput(source) };
}

export async function saveAdminContentDraft(caseId: string, input: CaseContentInput): Promise<{ versionId: string; versionNumber: number }> {
  const result = await request<{ success: true; versionId: string; versionNumber: number }>(
    `/api/admin/content/${encodeURIComponent(caseId)}`,
    { method: 'PUT', body: JSON.stringify(input) }
  );
  return { versionId: result.versionId, versionNumber: result.versionNumber };
}

export async function getAdminContentVersions(caseId: string): Promise<ContentVersionSummary[]> {
  const result = await request<{ success: true; versions: ContentVersionSummary[] }>(
    `/api/admin/content/${encodeURIComponent(caseId)}/versions`
  );
  return result.versions;
}

export async function publishAdminContent(caseId: string): Promise<{ versionId: string; versionNumber: number }> {
  const result = await request<{ success: true; versionId: string; versionNumber: number }>(
    `/api/admin/content/${encodeURIComponent(caseId)}/publish`, { method: 'POST' }
  );
  return { versionId: result.versionId, versionNumber: result.versionNumber };
}

export async function unpublishAdminContent(caseId: string): Promise<{ versionId: string }> {
  const result = await request<{ success: true; versionId: string }>(
    `/api/admin/content/${encodeURIComponent(caseId)}/unpublish`, { method: 'POST' }
  );
  return { versionId: result.versionId };
}

// ─── Published case detail (versioned content) ───

export interface PublishedCaseDetail {
  id: string;
  title: string;
  type: string;
  sector: string;
  difficulty: string;
  status: string;
  description: string;
  deliverables: string[];
  pts: number;
  submission_count: number;
  review_count: number;
  deadline: string | null;
  tags: string[];
  is_chaos: boolean | null;
  timer_deadline: string | null;
  created_at: string;
  version_number: number;
  exhibits: string | null;
  rubric_criteria: RubricCriterion[];
  content_owner: string;
  author_credit: string | null;
  source_kind: string;
  source_reference: string | null;
  rights_declaration: string;
  published_at: string | null;
}

export async function getPublishedCase(id: string): Promise<PublishedCaseDetail | null> {
  try {
    return await request<PublishedCaseDetail>(`/api/cases/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

// ─── Student solving workspace ───

export interface CaseDraft {
  id: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export async function getCaseDraft(caseId: string): Promise<CaseDraft | null> {
  const result = await request<{ success: true; draft: CaseDraft | null }>(
    `/api/cases/${encodeURIComponent(caseId)}/draft`
  );
  return result.draft;
}

export async function saveCaseDraft(caseId: string, contentJson: Record<string, unknown>): Promise<CaseDraft> {
  const result = await request<{ success: true; draft: CaseDraft }>(
    `/api/cases/${encodeURIComponent(caseId)}/draft`,
    { method: 'PUT', body: JSON.stringify({ contentJson }) }
  );
  return result.draft;
}

export async function getReferenceSolution(caseId: string): Promise<string | null> {
  const response = await fetch(
    `${API_BASE}/api/cases/${encodeURIComponent(caseId)}/reference-solution`,
    { credentials: 'include' }
  );
  if (response.status === 403) return null;
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Could not check submission status');
  }
  return data.referenceSolution;
}
