// Mock In-Memory Relational Engine representing high-index SQL tables
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

export class DatabaseService {
  private static readonly mockReviews: ReviewRecord[] = [];
  private static readonly mockSubmissions: any[] = [];

  public static async getCompletedReviewCountForCase(userId: string, caseId: string): Promise<number> {
    return this.mockReviews.filter(r => r.reviewerId === userId && r.caseId === caseId && !r.isVoided).length;
  }

  public static async createSubmission(payload: any): Promise<string> {
    const id = 'sub_' + Math.random().toString(36).slice(2, 11);
    this.mockSubmissions.push({ ...payload, id, status: 'Pending_Review' });
    return id;
  }

  public static async getActiveReviewsForSubmission(submissionId: string): Promise<ReviewRecord[]> {
    return this.mockReviews.filter(r => r.submissionId === submissionId && !r.isVoided);
  }

  public static async insertReview(payload: { submissionId: string; reviewerId: string; reviewerTier: string; scores: ReviewRubric }): Promise<void> {
    this.mockReviews.push({ ...payload, id: 'rev_' + Math.random().toString(36).slice(2, 11), isVoided: false });
  }

  public static async updateSubmissionStatus(submissionId: string, status: string): Promise<void> {
    const sub = this.mockSubmissions.find(s => s.id === submissionId);
    if (sub) sub.status = status;
  }

  public static async finalizeSubmission(submissionId: string, score: number, status: string): Promise<void> {
    const sub = this.mockSubmissions.find(s => s.id === submissionId);
    if (sub) {
      sub.final_weighted_score = score;
      sub.status = status;
    }
  }
}
