import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { MOCK_CASES, RUBRIC_DIMENSIONS } from '../data/mockData';
import { RubricSlider } from '../components/RubricSlider';
import { RadarChart } from '../components/RadarChart';
import { PageWrapper } from '../components/PageWrapper';
import { FlagButton } from '../components/FlagButton';
import { createReview, getNextReviewSubmission } from '../services/api';

const ANONYMOUS_SUBMISSION = `The D2C brand's margin erosion stems from three compounding factors: CAC inflation on paid social (+180% YoY), discount-driven revenue mix shift (promo sales now 42% of GMV vs 18%), and fulfillment cost deleverage at current order volumes.

Revenue branch: Growth is real but low-quality — repeat purchase rate dropped from 34% to 19%. The brand is buying new customers at unsustainable CAC while failing to retain them.

Cost branch: COGS is stable at 32%, but variable marketing spend per order exceeds contribution margin on first purchase. Wholesale would improve unit economics but at 15-20% brand dilution risk based on comparable D2C pivots.

Root cause: The growth strategy optimized for top-line at the expense of unit economics. Meta algorithm changes exposed this structural weakness.

Recommendations: (1) Pause broad Meta prospecting, shift to retention-led CRM campaigns. (2) Introduce a subscription tier to improve LTV/CAC. (3) Pilot selective wholesale with premium retail partners only.`;

export const ReviewPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseData = MOCK_CASES.find(c => c.id === id);

  // Mock authentication check - in production, use actual auth state
  const isAuthenticated = true; // Change to false to test redirect

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const [rubricScores, setRubricScores] = useState({
    problem_framing: 3,
    framework_fit: 3,
    data_integrity: 3,
    insight_depth: 3,
    feasibility: 3,
  });
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    if (!caseData) return;
    getNextReviewSubmission(caseData.id)
      .then(response => setSubmissionId(response.submissionId))
      .catch(() => {
        // Fallback to mock ID if API fails
        setSubmissionId('sub001');
      });
  }, [caseData]);

  const feedbackValid = feedback.trim().length >= 80;

  const weightedScore = (
    rubricScores.problem_framing * 0.25 +
    rubricScores.framework_fit * 0.20 +
    rubricScores.data_integrity * 0.20 +
    rubricScores.insight_depth * 0.25 +
    rubricScores.feasibility * 0.10
  ).toFixed(2);

  const handleSubmit = async () => {
    if (!caseData || !feedbackValid || !submissionId) return;

    setSubmitting(true);
    setError(null);

    try {
      await createReview(submissionId, rubricScores);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!caseData) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Case Not Found</h2>
          <Link to="/cases" className="btn-primary">Back to Cases</Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Link to={`/cases/${caseData.id}`} className="btn-ghost mb-6 text-sm inline-flex">← Back to Case</Link>

      <div className="page-header pb-6">
        <div className="section-label mb-2">PEER REVIEW</div>
        <h1 className="section-title text-3xl mb-2">Review Submission</h1>
        <p className="section-subtitle">{caseData.title} — submission is anonymized</p>
      </div>

      {submitted ? (
        <div className="glass-card p-12 text-center animate-scale-in">
          <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Review Submitted</h3>
          <p className="text-slate-400 mb-2">Weighted score: {weightedScore}</p>
          <p className="text-slate-400 mb-6">This counts toward your proof-of-review gate for this case.</p>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Anonymous Submission</span>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {ANONYMOUS_SUBMISSION}
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6">Rubric Scoring</h2>
              <div className="space-y-2">
                {RUBRIC_DIMENSIONS.map(dim => (
                  <RubricSlider
                    key={dim.key}
                    dimension={dim}
                    value={rubricScores[dim.key]}
                    onChange={(val) => setRubricScores(prev => ({ ...prev, [dim.key]: val }))}
                  />
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <label className="block text-sm font-bold text-white mb-2">
                Written Feedback <span className="text-slate-500 font-normal">(min 80 characters)</span>
              </label>
              <textarea
                className="input-field min-h-[140px]"
                placeholder="Provide specific, actionable feedback on framing, data use, and recommendations..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className={`text-xs mt-2 ${feedbackValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {feedback.trim().length}/80 characters minimum
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="font-bold text-white mb-4">Score Preview</h3>
              <div className="flex justify-center mb-4">
                <RadarChart scores={rubricScores} size={200} />
              </div>
              <div className="text-center mb-6">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Weighted Score</div>
                <div className="text-3xl font-black text-emerald-400 font-mono">{weightedScore}</div>
              </div>
              <button
                type="button"
                className="btn-primary w-full mb-3"
                disabled={!feedbackValid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              {error && (
                <div className="text-rose-400 text-xs mb-3">{error}</div>
              )}
              <FlagButton reviewId="rev001" />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
