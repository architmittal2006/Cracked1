import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
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
  const feedbackLength = feedback.trim().length;
  const feedbackProgress = Math.min((feedbackLength / 80) * 100, 100);

  const weightedScore = (
    rubricScores.problem_framing * 0.25 +
    rubricScores.framework_fit * 0.20 +
    rubricScores.data_integrity * 0.20 +
    rubricScores.insight_depth * 0.25 +
    rubricScores.feasibility * 0.10
  ).toFixed(2);

  const scoreLevel = parseFloat(weightedScore) >= 4 ? 'excellent' : parseFloat(weightedScore) >= 3 ? 'good' : 'needs-improvement';

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
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Review Submitted</h3>
          <div className="mb-4">
            <p className="text-slate-400 mb-1">Weighted score: <span className="text-emerald-400 font-mono text-xl font-bold">{weightedScore}</span></p>
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
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Anonymous Submission
                </span>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                {ANONYMOUS_SUBMISSION}
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Rubric Scoring
              </h2>
              <div className="space-y-2">
                {RUBRIC_DIMENSIONS.map((dim, index) => (
                  <div
                    key={dim.key}
                    className="transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <RubricSlider
                      dimension={dim}
                      value={rubricScores[dim.key]}
                      onChange={(val) => setRubricScores(prev => ({ ...prev, [dim.key]: val }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
                <span>Written Feedback</span>
                <span className="text-slate-500 font-normal text-xs">(min 80 characters)</span>
              </label>
              <textarea
                className="input-field min-h-[140px] transition-all duration-300"
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
                    className={`h-full transition-all duration-300 ease-out ${
                      feedbackValid ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${feedbackProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Score Preview
              </h3>
              <div className="flex justify-center mb-4 relative">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-3xl" />
                <RadarChart scores={rubricScores} size={200} />
              </div>
              <div className="text-center mb-6">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Weighted Score</div>
                <div className="text-4xl font-black text-emerald-400 font-mono mb-2 transition-all duration-300">
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
                {RUBRIC_DIMENSIONS.map((dim, index) => (
                  <div
                    key={dim.key}
                    className="flex items-center justify-between text-xs"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-slate-400">{dim.label}</span>
                    <span className="font-mono text-emerald-400 font-bold">{rubricScores[dim.key]}/5</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`btn-primary w-full mb-3 transition-all duration-300 ${
                  feedbackValid
                    ? 'shadow-[0_0_20px_rgba(255,76,37,0.4)]'
                    : 'opacity-50 cursor-not-allowed'
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
              <FlagButton reviewId="rev001" />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
