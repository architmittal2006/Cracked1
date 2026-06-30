import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Trophy, ArrowRight } from 'lucide-react';
import { CURRENT_USER, MOCK_CASES, MOCK_SUBMISSIONS, GATE_STATE } from '../data/mockData';
import { ScoreRing } from '../components/ScoreRing';
import { StatusPill } from '../components/StatusPill';
import { GateIndicator } from '../components/GateIndicator';
import { TierBadge } from '../components/TierBadge';
import { getTierProgress } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // In production, check actual authentication state
  // For now, we'll assume user is authenticated if CURRENT_USER exists
  const isAuthenticated = !!CURRENT_USER;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const tierProgress = getTierProgress(CURRENT_USER.credibility_score);
  const pendingReviews = MOCK_CASES.filter(c => (GATE_STATE[c.id] ?? 0) < 2 && c.status === 'Open').slice(0, 3);
  const activeSubmissions = MOCK_SUBMISSIONS.filter(s => s.status !== 'Completed' && s.status !== 'Merged');

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="section-label mb-2">YOUR ARENA</div>
        <h1 className="section-title mb-2">Dashboard</h1>
        <p className="section-subtitle">Active submissions, review queue, and score snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-6 flex items-center gap-4">
          <ScoreRing score={CURRENT_USER.credibility_score / 1000} maxScore={10} size={72} />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Credibility</div>
            <div className="text-2xl font-black font-mono text-white">{CURRENT_USER.credibility_score.toLocaleString()}</div>
            <TierBadge score={CURRENT_USER.credibility_score} />
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Tier Progress</div>
          <div className="text-lg font-bold text-white mb-2">{tierProgress.current}</div>
          {tierProgress.next && (
            <>
              <div className="progress-bar mb-2">
                <div className="progress-bar-fill" style={{ width: `${tierProgress.percent}%` }} />
              </div>
              <div className="text-xs text-slate-500">Next: {tierProgress.next}</div>
            </>
          )}
        </div>
        <div className="glass-card p-6">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Quick Stats</div>
          <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
            <div><span className="text-slate-500">Solve</span><div className="font-mono font-bold">{CURRENT_USER.solve_score.toLocaleString()}</div></div>
            <div><span className="text-slate-500">Review</span><div className="font-mono font-bold">{CURRENT_USER.review_score.toLocaleString()}</div></div>
            <div><span className="text-slate-500">Cases</span><div className="font-mono font-bold">{CURRENT_USER.casesSolved}</div></div>
            <div><span className="text-slate-500">Merges</span><div className="font-mono font-bold text-amber-400">{CURRENT_USER.merge_bonus_count}</div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Active Submissions</h2>
            <Link to="/cases" className="btn-ghost text-xs">Browse cases</Link>
          </div>
          <div className="space-y-4">
            {activeSubmissions.length > 0 ? activeSubmissions.map(sub => (
              <div key={sub.id} className="flex justify-between items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div>
                  <div className="font-bold text-white text-sm mb-1">{sub.caseName}</div>
                  <div className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusPill status={sub.status} />
              </div>
            )) : (
              <p className="text-slate-400 text-sm">No active submissions. <Link to="/cases" className="text-emerald-400">Pick a case</Link></p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Review Queue</h2>
            <span className="text-xs text-slate-500">Unlock gates by reviewing</span>
          </div>
          <div className="space-y-4">
            {pendingReviews.map(c => (
              <div key={c.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="font-bold text-white text-sm mb-2">{c.title}</div>
                <GateIndicator reviewsCompleted={GATE_STATE[c.id] ?? 0} compact />
                <Link to={`/cases/${c.id}/review`} className="btn-secondary text-xs mt-3 inline-flex">
                  <Eye className="w-3 h-3" /> Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <div className="font-bold text-white">Share your certificate</div>
            <div className="text-sm text-slate-400">Live credibility score with verification hash</div>
          </div>
        </div>
        <Link to={`/certificate/${CURRENT_USER.username}`} className="btn-primary">
          View Certificate <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </PageWrapper>
  );
};
