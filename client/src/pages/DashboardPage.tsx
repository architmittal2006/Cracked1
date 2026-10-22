import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { getTierProgress } from '../data/mockData';
import { ScoreRing } from '../components/ScoreRing';
import { TierBadge } from '../components/TierBadge';
import { PageWrapper } from '../components/PageWrapper';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [userScores, setUserScores] = useState({
    credibilityScore: 0,
    solveScore: 0,
    reviewScore: 0,
    casesSolved: 0,
    mergeBonusCount: 0,
  });

  useEffect(() => {
    if (user) {
      setUserScores({
        credibilityScore: user.credibilityScore ?? 0,
        solveScore: user.solveScore ?? 0,
        reviewScore: user.reviewScore ?? 0,
        casesSolved: user.casesSolved ?? 0,
        mergeBonusCount: user.mergeBonusCount ?? 0,
      });
    }
  }, [user]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const tierProgress = getTierProgress(userScores.credibilityScore);

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="section-label mb-2">YOUR ARENA</div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
        <p className="section-subtitle">Active submissions, review queue, and score snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="flex items-center gap-4">
          <ScoreRing score={userScores.credibilityScore / 1000} maxScore={10} size={72} />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Credibility</div>
            <div className="text-2xl font-semibold font-mono text-white">{userScores.credibilityScore.toLocaleString()}</div>
            <TierBadge score={userScores.credibilityScore} />
          </div>
        </Card>
        <Card>
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Tier Progress</div>
          <div className="text-lg font-semibold text-white mb-2">{tierProgress.current}</div>
          {tierProgress.next && (
            <>
              <div className="progress-bar mb-2">
                <div className="progress-bar-fill" style={{ width: `${tierProgress.percent}%` }} />
              </div>
              <div className="text-xs text-slate-500">Next: {tierProgress.next}</div>
            </>
          )}
        </Card>
        <Card>
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Quick Stats</div>
          <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
            <div className="hover:bg-white/5 p-2 rounded transition-colors"><span className="text-slate-500">Solve</span><div className="font-mono font-semibold">{userScores.solveScore.toLocaleString()}</div></div>
            <div className="hover:bg-white/5 p-2 rounded transition-colors"><span className="text-slate-500">Review</span><div className="font-mono font-semibold">{userScores.reviewScore.toLocaleString()}</div></div>
            <div className="hover:bg-white/5 p-2 rounded transition-colors"><span className="text-slate-500">Cases</span><div className="font-mono font-semibold">{userScores.casesSolved.toLocaleString()}</div></div>
            <div className="hover:bg-white/5 p-2 rounded transition-colors"><span className="text-slate-500">Merges</span><div className="font-mono font-semibold text-amber-400">{userScores.mergeBonusCount}</div></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Active Submissions</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>Browse cases</Button>
          </div>
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">No active submissions. <Link to="/cases" className="text-[#FF4C25] hover:text-[#FF6B4A] transition-colors">Pick a case</Link></p>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Review Queue</h2>
            <span className="text-xs text-slate-500">Unlock gates by reviewing</span>
          </div>
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">No reviews available yet.</p>
          </div>
        </Card>
      </div>

      <Card className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <div className="font-semibold text-white">Share your certificate</div>
            <div className="text-sm text-slate-400">Live credibility score with verification hash</div>
          </div>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate(`/certificate/${user.username}`)}>
          View Certificate <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </PageWrapper>
  );
};
