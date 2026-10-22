import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, Sparkles, FolderOpen, CheckCircle2 } from 'lucide-react';
import { getTierProgress } from '../data/mockData';
import { ScoreRing } from '../components/ScoreRing';
import { TierBadge } from '../components/TierBadge';
import { PageWrapper } from '../components/PageWrapper';
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
  const stats = [
    { label: 'Solve', value: userScores.solveScore.toLocaleString(), tone: 'text-emerald-300' },
    { label: 'Review', value: userScores.reviewScore.toLocaleString(), tone: 'text-cyan-300' },
    { label: 'Cases', value: userScores.casesSolved.toLocaleString(), tone: 'text-violet-300' },
    { label: 'Merges', value: userScores.mergeBonusCount.toLocaleString(), tone: 'text-amber-300' },
  ];

  return (
    <PageWrapper>
      <div className='page-header'>
        <div className='section-label mb-2'>Your arena</div>
        <h1 className='section-title mb-2'>Dashboard</h1>
        <p className='section-subtitle'>Active submissions, review queue, and score snapshot.</p>
      </div>

      <div className='mb-12 grid gap-6 md:grid-cols-3'>
        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <div className='flex items-center gap-4'>
            <ScoreRing score={userScores.credibilityScore / 1000} maxScore={10} size={72} />
            <div>
              <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Credibility</div>
              <div className='text-2xl font-black font-mono text-white'>
                {userScores.credibilityScore.toLocaleString()}
              </div>
              <TierBadge score={userScores.credibilityScore} />
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <div className='mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Tier progress</div>
          <div className='mb-3 text-lg font-bold text-white'>{tierProgress.current}</div>
          {tierProgress.next && (
            <>
              <div className='relative h-2 overflow-hidden rounded-full bg-white/5'>
                <div className='absolute inset-y-0 left-0 rounded-full bg-[#FF4C25]' style={{ width: `${tierProgress.percent}%` }} />
              </div>
              <div className='mt-3 text-xs text-slate-400'>Next: {tierProgress.next}</div>
            </>
          )}
        </div>

        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <div className='mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Quick stats</div>
          <div className='grid grid-cols-2 gap-3'>
            {stats.map((stat) => (
              <div key={stat.label} className='rounded-xl border border-white/8 bg-white/[0.02] p-3'>
                <div className='text-[10px] uppercase tracking-[0.14em] text-slate-500'>{stat.label}</div>
                <div className={`mt-2 font-mono text-lg font-bold ${stat.tone}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='grid gap-8 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <div className='mb-5 flex items-center justify-between gap-3'>
            <h2 className='text-xl font-bold text-white'>Active submissions</h2>
            <Button variant='ghost' size='sm' onClick={() => navigate('/cases')} className='text-slate-300 hover:text-white'>Browse cases</Button>
          </div>
          <div className='rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5'>
            <div className='mb-3 flex items-center gap-2 text-[#FF4C25]'>
              <FolderOpen className='h-4 w-4' />
              <span className='text-sm font-medium'>No active submissions</span>
            </div>
            <p className='text-sm leading-relaxed text-slate-400'>
              Pick a case and start building your proof of work. The best submissions are scored by peers and tracked in your credibility profile.
            </p>
            <Link to='/cases' className='mt-4 inline-flex items-center text-sm font-medium text-white hover:text-[#FF4C25]'>
              Pick a case <ArrowRight className='ml-1 h-4 w-4' />
            </Link>
          </div>
        </div>

        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <div className='mb-5 flex items-center justify-between gap-3'>
            <h2 className='text-xl font-bold text-white'>Review queue</h2>
            <span className='text-[10px] uppercase tracking-[0.14em] text-slate-500'>Unlock gates</span>
          </div>
          <div className='rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5'>
            <div className='mb-3 flex items-center gap-2 text-emerald-300'>
              <CheckCircle2 className='h-4 w-4' />
              <span className='text-sm font-medium'>No reviews available yet</span>
            </div>
            <p className='text-sm leading-relaxed text-slate-400'>
              Complete two peer reviews on a case before you can submit your own solution to that same case.
            </p>
          </div>
        </div>
      </div>

      <div className='mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#0d0d12] to-[#0d0d12] p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300'>
              <Trophy className='h-5 w-5' />
            </div>
            <div>
              <div className='font-bold text-white'>Share your certificate</div>
              <div className='text-sm text-slate-400'>Live credibility score with verification hash</div>
            </div>
          </div>
          <Button variant='primary' size='md' onClick={() => navigate(`/certificate/${user.username}`)} className='sm:ml-auto'>
            View Certificate <ArrowRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};
