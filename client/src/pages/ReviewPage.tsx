import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Shield, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { formatSubmissionSection, RUBRIC_DIMENSIONS, RUBRIC_DIMENSIONS_BY_TYPE } from '../data/mockData';
import type { Case } from '../data/mockData';
import { RubricSlider } from '../components/RubricSlider';
import { RadarChart } from '../components/RadarChart';
import { PageWrapper } from '../components/PageWrapper';
import { createReview, getCaseById, getNextReviewSubmission } from '../services/api';
import type { ReviewQueueResponse } from '../services/api';

export const ReviewPage: React.FC = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [reviewSubmission, setReviewSubmission] = useState<ReviewQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    problem_framing: 3,
    framework_fit: 3,
    data_integrity: 3,
    insight_depth: 3,
    feasibility: 3,
    structure: 3,
    assumption_quality: 3,
    math_accuracy: 3,
    sanity_check: 3,
    clarity: 3,
  });
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isCurrent = true;
    Promise.all([getCaseById(id), getNextReviewSubmission(id)])
      .then(([loadedCase, queuedSubmission]) => {
        if (!isCurrent) return;
        setCaseData(loadedCase);
        setReviewSubmission(queuedSubmission);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load a submission to review');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [id]);

  const feedbackValid = feedback.trim().length >= 80;
  const feedbackLength = feedback.trim().length;
  const feedbackProgress = Math.min((feedbackLength / 80) * 100, 100);

  const rubricDimensions = caseData ? RUBRIC_DIMENSIONS_BY_TYPE[caseData.type] : RUBRIC_DIMENSIONS;
  const weightedScore = rubricDimensions
    .reduce((total, dimension) => total + (rubricScores[dimension.key] ?? 3) * dimension.weight, 0)
    .toFixed(2);

  const scoreLevel = parseFloat(weightedScore) >= 4 ? 'excellent' : parseFloat(weightedScore) >= 3 ? 'good' : 'needs-improvement';

  const handleSubmit = async () => {
    if (!caseData || !feedbackValid || !reviewSubmission) return;

    setSubmitting(true);
    setError(null);

    try {
      const scores = caseData.type === 'Guesstimate'
        ? {
            structure: rubricScores.structure ?? 3,
            assumption_quality: rubricScores.assumption_quality ?? 3,
            math_accuracy: rubricScores.math_accuracy ?? 3,
            sanity_check: rubricScores.sanity_check ?? 3,
            clarity: rubricScores.clarity ?? 3,
          }
        : {
            problem_framing: rubricScores.problem_framing ?? 3,
            framework_fit: rubricScores.framework_fit ?? 3,
            data_integrity: rubricScores.data_integrity ?? 3,
            insight_depth: rubricScores.insight_depth ?? 3,
            feasibility: rubricScores.feasibility ?? 3,
          };
      await createReview(reviewSubmission.submissionId, scores, caseData.id, feedback.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-slate-400" aria-live="polite">Loading submission…</p></PageWrapper>;
  }

  if (!caseData || error && !reviewSubmission && !submitted) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-white mb-3">{caseData ? 'Could not load a submission' : 'Case not found'}</h2>
          {error && <p className="mb-5 text-sm text-slate-400" role="alert">{error}</p>}
          <Link to={caseData ? `/cases/${caseData.id}` : '/cases'} className="btn-primary">Back to case</Link>
        </div>
      </PageWrapper>
    );
  }

  if (!reviewSubmission && !submitted) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-2xl border-y border-[var(--border-subtle)] py-8">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">No submission ready for review</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            There are no other pending solutions for this case right now. Check back when someone has submitted a solution.
          </p>
          <Link to={`/cases/${caseData.id}`} className="mt-5 inline-flex text-sm text-[var(--text-primary)] underline underline-offset-4">Back to case</Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Link to={`/cases/${caseData.id}`} className="btn-ghost mb-6 text-sm inline-flex">← Back to Case</Link>

      <div className="page-header pb-6">
        <h1 className="section-title text-3xl mb-2">Review submission</h1>
        <p className="section-subtitle">{caseData.title} — submission is anonymized</p>
      </div>

      {submitted ? (
        <div className="glass-card p-12 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Review Submitted</h3>
          <div className="mb-4">
            <p className="text-slate-400 mb-1">Weighted score: <span className="text-emerald-400 tabular-nums text-xl font-semibold">{weightedScore}</span></p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold uppercase">
                {scoreLevel === 'excellent' ? 'Excellent' : scoreLevel === 'good' ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          <p className="text-slate-400 mb-6">This counts toward your proof-of-review gate for this case.</p>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Anonymous Submission
                </span>
              </div>
              <div className="space-y-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] p-4">
                {Object.entries(reviewSubmission?.content ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">{key.replaceAll('_', ' ')}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{formatSubmissionSection(key, value)}</p>
                  </div>
                ))}
              </div>
              {reviewSubmission?.referenceRangeHint && (
                <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-[var(--text-primary)]">
                  Reviewer hint: the estimate is more than 2× outside the author’s reference range. Use this as a prompt to inspect the reasoning, not as an automatic score.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Rubric Scoring
              </h2>
              <div className="space-y-2">
                {rubricDimensions.map((dim, index) => (
                  <div
                    key={dim.key}
                    className="transition-colors duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <RubricSlider
                      dimension={dim}
                      value={rubricScores[dim.key] ?? 3}
                      onChange={(val) => setRubricScores(prev => ({ ...prev, [dim.key]: val }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
              <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
                <span>Written Feedback</span>
                <span className="text-slate-500 font-normal text-xs">(min 80 characters)</span>
              </label>
              <textarea
                className="input-field min-h-[140px] transition-colors duration-200"
                placeholder="Provide specific, actionable feedback on framing, data use, and recommendations..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${feedbackValid ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {feedbackLength}/80 characters
                  </span>
                  {feedbackValid && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready to submit
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-300 ease-out ${
                      feedbackValid ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${feedbackProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6 lg:sticky lg:top-24">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Score Preview
              </h3>
              {caseData.type !== 'Guesstimate' && (
                <div className="flex justify-center mb-4 relative">
                  <RadarChart scores={{
                    problem_framing: rubricScores.problem_framing ?? 3,
                    framework_fit: rubricScores.framework_fit ?? 3,
                    data_integrity: rubricScores.data_integrity ?? 3,
                    insight_depth: rubricScores.insight_depth ?? 3,
                    feasibility: rubricScores.feasibility ?? 3,
                  }} size={200} />
                </div>
              )}
              <div className="text-center mb-6">
                <div className="text-xs text-slate-400 mb-1">Weighted score</div>
                <div className="text-3xl font-semibold tabular-nums text-[var(--text-primary)] mb-2">
                  {weightedScore}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                  <span className={`text-xs font-bold uppercase ${
                    scoreLevel === 'excellent' ? 'text-emerald-400' :
                    scoreLevel === 'good' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {scoreLevel === 'excellent' ? 'Excellent' : scoreLevel === 'good' ? 'Good' : 'Needs Work'}
                  </span>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="space-y-2 mb-6">
                {rubricDimensions.map((dim, index) => (
                  <div
                    key={dim.key}
                    className="flex items-center justify-between text-xs"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-slate-400">{dim.label}</span>
                    <span className="tabular-nums text-[var(--text-primary)]">{rubricScores[dim.key] ?? 3}/5</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`btn-primary w-full mb-3 transition-colors duration-200 ${
                  feedbackValid ? '' : 'opacity-50 cursor-not-allowed'
                }`}
                disabled={!feedbackValid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Review'
                )}
              </button>
              {error && (
                <div className="text-rose-400 text-xs mb-3 p-2 bg-rose-500/10 rounded border border-rose-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
