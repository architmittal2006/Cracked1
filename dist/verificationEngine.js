import { DatabaseService } from './dbService.js';
class VerificationEngine {
    static async validateLayer1Gate(submission) {
        for (const field of submission.requiredFields) {
            if (!submission.contentJson[field] || submission.contentJson[field].toString().trim() === '') {
                return { compliant: false, error: `Layer 1 Failure: Template missing target segment "${field}"` };
            }
        }
        if (submission.citationsCount < 1) {
            return { compliant: false, error: "Layer 1 Failure: Minimum of 1 structured data source citation required." };
        }
        if (submission.wordCount < 500 || submission.wordCount > 4000) {
            return { compliant: false, error: `Layer 1 Failure: Payload word volume [${submission.wordCount}] out of allowable parameters.` };
        }
        return { compliant: true };
    }
    static calculateIndividualWeightedScore(rubric) {
        return (rubric.problem_framing * 0.25 +
            rubric.framework_fit * 0.2 +
            rubric.data_integrity * 0.2 +
            rubric.insight_depth * 0.25 +
            rubric.feasibility * 0.1);
    }
    static async processPeerReviewConsensus(submissionId) {
        const reviews = await DatabaseService.getActiveReviewsForSubmission(submissionId);
        // Check for explicit Layer 3 Arbiter Intervention overrides
        const arbiterReview = reviews.find((r) => r.reviewerTier === 'Arbiter');
        if (arbiterReview) {
            const arbiterScore = this.calculateIndividualWeightedScore(arbiterReview.scores);
            await DatabaseService.finalizeSubmission(submissionId, arbiterScore, 'Completed');
            return 'LAYER_3_ARBITER_OVERRIDE_RESOLVED';
        }
        if (reviews.length < 3) {
            return 'AWAITING_PEER_QUORUM';
        }
        const compiledScores = reviews.map((r) => ({
            score: this.calculateIndividualWeightedScore(r.scores),
            tier: r.reviewerTier
        }));
        // Detect Multi-Reviewer Score Discrepancies (> 1.5 points variance)
        let triggerEscalation = false;
        for (let i = 0; i < compiledScores.length; i++) {
            const left = compiledScores[i];
            for (let j = i + 1; j < compiledScores.length; j++) {
                const right = compiledScores[j];
                if (Math.abs(left.score - right.score) > 1.5) {
                    triggerEscalation = true;
                    break;
                }
            }
        }
        if (triggerEscalation) {
            await DatabaseService.updateSubmissionStatus(submissionId, 'In_Dispute');
            return 'LAYER_2_VARIANCE_ESCALATION_TRIGGERED';
        }
        // Apply Multiplicative Peer Weightings
        let totalWeightedScoreSum = 0;
        let totalWeightApplied = 0;
        for (const item of compiledScores) {
            let currentWeight = 1;
            if (item.tier === 'Verified')
                currentWeight = 1.5;
            if (item.tier === 'Arbiter')
                currentWeight = 4;
            totalWeightedScoreSum += item.score * currentWeight;
            totalWeightApplied += currentWeight;
        }
        const calculatedConsensus = totalWeightedScoreSum / totalWeightApplied;
        await DatabaseService.finalizeSubmission(submissionId, calculatedConsensus, 'Completed');
        return 'LAYER_2_CONSENSUS_STABILIZED';
    }
}
export { VerificationEngine };
