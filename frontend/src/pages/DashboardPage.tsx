import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Clock } from 'lucide-react';
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

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const tierProgress = getTierProgress(userScores.credibilityScore);

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="section-subtitle">
          {userScores.casesSolved} case{userScores.casesSolved !== 1 ? 's' : ''} done • {userScores.credibilityScore.toLocaleString()} credibility score
        </p>
      </div>

      <div className="mb-8">
        <Button variant="primary" size="lg" onClick={() => navigate('/cases')} className="w-full sm:w-auto">
          Start a case <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ScoreRing score={userScores.credibilityScore / 1000} maxScore={10} size={48} />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Credibility</div>
              <div className="text-xl font-semibold font-mono text-white">{userScores.credibilityScore.toLocaleString()}</div>
            </div>
          </div>
          <TierBadge score={userScores.credibilityScore} />
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
            <h2 className="text-xl font-semibold text-white">Your progress</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>Browse cases</Button>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 mb-3">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm mb-1">No case attempts yet.</p>
              <p className="text-slate-500 text-xs mb-3">Your submissions and drafts will appear here once you start solving.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/cases')}>
                Browse Cases
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Compare solutions</h2>
            <span className="text-xs text-slate-500">After you submit</span>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col items-center py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 mb-3">
                <Clock className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm mb-1">Nothing to compare yet.</p>
              <p className="text-slate-500 text-xs">Submit a solution to a case to see how other students approached it.</p>
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Scores and tiers reflect persisted account data and update as review scoring launches.
      </p>
    </PageWrapper>
  );
};
