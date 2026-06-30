export class DatabaseService {
    static async getCompletedReviewCountForCase(userId, caseId) {
        return this.mockReviews.filter(r => r.reviewerId === userId && r.caseId === caseId && !r.isVoided).length;
    }
    static async createSubmission(payload) {
        const id = 'sub_' + Math.random().toString(36).slice(2, 11);
        this.mockSubmissions.push({ ...payload, id, status: 'Pending_Review' });
        return id;
    }
    static async getActiveReviewsForSubmission(submissionId) {
        return this.mockReviews.filter(r => r.submissionId === submissionId && !r.isVoided);
    }
    static async insertReview(payload) {
        this.mockReviews.push({ ...payload, id: 'rev_' + Math.random().toString(36).slice(2, 11), isVoided: false });
    }
    static async updateSubmissionStatus(submissionId, status) {
        const sub = this.mockSubmissions.find(s => s.id === submissionId);
        if (sub)
            sub.status = status;
    }
    static async finalizeSubmission(submissionId, score, status) {
        const sub = this.mockSubmissions.find(s => s.id === submissionId);
        if (sub) {
            sub.final_weighted_score = score;
            sub.status = status;
        }
    }
}
DatabaseService.mockReviews = [];
DatabaseService.mockSubmissions = [];
