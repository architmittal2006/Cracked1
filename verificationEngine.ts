import { DatabaseService } from './dbService.js';
import type { ReviewRubric } from './dbService.js';

interface ReviewRecord {
  submissionId: string;
  reviewerId: string;
  reviewerTier: string;
  scores: ReviewRubric;
  isVoided?: boolean;
}

class VerificationEngine {
  public static async validateLayer1Gate(submission: {
    contentJson: unknown;
    caseType?: string;
  }): Promise<
    | { compliant: true; contentJson: Record<string, string>; wordCount: number }
    | { compliant: false; error: string }
  > {
    if (!submission.contentJson || typeof submission.contentJson !== 'object' || Array.isArray(submission.contentJson)) {
      return { compliant: false, error: 'Solution must contain structured text sections.' };
    }

    const contentJson: Record<string, string> = Object.fromEntries([]);
    let wordCount = 0;
    for (const [field, value] of Object.entries(submission.contentJson)) {
      if (!field.trim() || typeof value !== 'string' || !value.trim()) {
        return { compliant: false, error: 'Every solution section must contain text.' };
      }
      contentJson[field] = value;
      wordCount += value.trim().split(/\s+/).filter(Boolean).length;
    }

    if (wordCount === 0) {
      return { compliant: false, error: 'Write your solution before submitting.' };
    }
    if (wordCount > 4000) {
      return { compliant: false, error: 'Solution must be 4,000 words or fewer.' };
    }

    if (submission.caseType === 'Guesstimate') {
      const requiredFields = [
        'clarify_scope', 'structure_segments', 'assumptions',
        'calculation_steps', 'sanity_check', 'final_estimate',
      ];
      if (requiredFields.some((field) => !contentJson[field])) {
        return { compliant: false, error: 'Complete every Guesstimate section.' };
      }

      let assumptions: unknown;
      let estimate: unknown;
      try {
        assumptions = JSON.parse(contentJson.assumptions!);
        estimate = JSON.parse(contentJson.final_estimate!);
      } catch {
        return { compliant: false, error: 'Enter assumptions and the final estimate in the provided fields.' };
      }

      let segments: unknown;
      try {
        segments = JSON.parse(contentJson.structure_segments!);
      } catch {
        return { compliant: false, error: 'Add at least one structured segment.' };
      }
      if (!Array.isArray(segments) || segments.length === 0 ||
        !segments.every((segment: unknown) => typeof segment === 'string' && segment.trim())) {
        return { compliant: false, error: 'Add at least one structured segment.' };
      }

      const validAssumptions = Array.isArray(assumptions) && assumptions.length >= 3 && assumptions.every((item: unknown) => {
        if (!item || typeof item !== 'object') return false;
        const assumption = item as Record<string, unknown>;
        return typeof assumption.name === 'string' && Boolean(assumption.name.trim()) &&
          typeof assumption.value === 'string' && Boolean(assumption.value.trim()) &&
          Number.isFinite(Number(assumption.value)) &&
          typeof assumption.unit === 'string' && Boolean(assumption.unit.trim()) &&
          typeof assumption.rationale === 'string' && Boolean(assumption.rationale.trim());
      });
      if (!validAssumptions) {
        return { compliant: false, error: 'Add at least three assumptions with a numeric value, unit, and rationale.' };
      }

      if (!estimate || typeof estimate !== 'object') {
        return { compliant: false, error: 'Enter a final estimate, unit, and low/high range.' };
      }
      const finalEstimate = estimate as Record<string, unknown>;
      const numericFields = ['value', 'low', 'high'];
      if (numericFields.some((field) =>
        typeof finalEstimate[field] !== 'string' ||
        !(finalEstimate[field] as string).trim() ||
        !Number.isFinite(Number(finalEstimate[field]))
      ) || typeof finalEstimate.unit !== 'string' || !finalEstimate.unit.trim()) {
        return { compliant: false, error: 'Enter numeric estimate and range values with a unit.' };
      }
      const value = Number(finalEstimate.value);
      const low = Number(finalEstimate.low);
      const high = Number(finalEstimate.high);
      if (low > value || value > high) {
        return { compliant: false, error: 'Final estimate must satisfy low ≤ value ≤ high.' };
      }
    }

    return { compliant: true, contentJson, wordCount };
  }

  public static calculateIndividualWeightedScore(rubric: ReviewRubric): number {
    if ('structure' in rubric) {
      return (
        rubric.structure * 0.2 +
        rubric.assumption_quality * 0.2 +
        rubric.math_accuracy * 0.2 +
        rubric.sanity_check * 0.2 +
        rubric.clarity * 0.2
      );
    }
    return (
      rubric.problem_framing * 0.25 +
      rubric.framework_fit * 0.2 +
      rubric.data_integrity * 0.2 +
      rubric.insight_depth * 0.25 +
      rubric.feasibility * 0.1
    );
  }

  public static async processPeerReviewConsensus(submissionId: string): Promise<string> {
    const reviews = await DatabaseService.getActiveReviewsForSubmission(submissionId);
    
    // Check for explicit Layer 3 Arbiter Intervention overrides
    const arbiterReview = reviews.find((r: ReviewRecord) => r.reviewerTier === 'Arbiter');
    if (arbiterReview) {
      const arbiterScore = this.calculateIndividualWeightedScore(arbiterReview.scores);
      await DatabaseService.finalizeSubmission(submissionId, arbiterScore, 'Completed');
      return 'LAYER_3_ARBITER_OVERRIDE_RESOLVED';
    }

    if (reviews.length < 3) {
      return 'AWAITING_PEER_QUORUM';
    }

    const compiledScores = reviews.map((r: ReviewRecord) => ({
      score: this.calculateIndividualWeightedScore(r.scores),
      tier: r.reviewerTier
    }));

    // Detect Multi-Reviewer Score Discrepancies (> 1.5 points variance)
    let triggerEscalation = false;
    for (let i = 0; i < compiledScores.length; i++) {
      const left = compiledScores[i]!;
      for (let j = i + 1; j < compiledScores.length; j++) {
        const right = compiledScores[j]!;
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
      if (item.tier === 'Verified') currentWeight = 1.5;
      if (item.tier === 'Arbiter') currentWeight = 4;

      totalWeightedScoreSum += item.score * currentWeight;
      totalWeightApplied += currentWeight;
    }

    const calculatedConsensus = totalWeightedScoreSum / totalWeightApplied;
    await DatabaseService.finalizeSubmission(submissionId, calculatedConsensus, 'Completed');
    return 'LAYER_2_CONSENSUS_STABILIZED';
  }
}

export { VerificationEngine };