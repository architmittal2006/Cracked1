import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { MOCK_REVIEWS, RUBRIC_DIMENSIONS } from '../data/mockData';
import { RadarChart } from '../components/RadarChart';
import { PageWrapper } from '../components/PageWrapper';

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams();
  const review = MOCK_REVIEWS.find(r => r.id === id);

  if (!review) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Review Not Found</h2>
          <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </PageWrapper>
    );
  }

  const weightedScore = (
    review.scores.problem_framing * 0.25 +
    review.scores.framework_fit * 0.20 +
    review.scores.data_integrity * 0.20 +
    review.scores.insight_depth * 0.25 +
    review.scores.feasibility * 0.10
  ).toFixed(2);

  return (
    <PageWrapper>
      <Link to="/dashboard" className="btn-ghost mb-6 text-sm inline-flex">← Back to Dashboard</Link>

      <div className="page-header pb-6">
        <div className="section-label mb-2">REVIEW BREAKDOWN</div>
        <h1 className="section-title text-3xl mb-2">Your Review Score</h1>
        <p className="section-subtitle">Per-dimension breakdown from peer reviewers on your submission</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Rubric Dimensions</h2>
          <div className="space-y-4">
            {RUBRIC_DIMENSIONS.map(dim => (
              <div key={dim.key} className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="font-bold text-white text-sm">{dim.label}</div>
                  <div className="text-xs text-slate-500">{dim.weightLabel} weight</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${(review.scores[dim.key] / 5) * 100}%` }} />
                  </div>
                  <span className="font-mono font-bold text-emerald-400 w-8 text-right">{review.scores[dim.key]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Reviewer Feedback</div>
            <p className="text-slate-300 text-sm leading-relaxed">{review.feedback}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Weighted Score</div>
            <div className="text-4xl font-black text-emerald-400 font-mono mb-4">{weightedScore}</div>
            <RadarChart scores={review.scores} size={180} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
