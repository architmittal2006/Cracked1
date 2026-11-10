import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TierBadge } from '../components/TierBadge';
import { ScoreRing } from '../components/ScoreRing';
import { Avatar } from '../components/Avatar';
import { TierProgressBar } from '../components/TierProgressBar';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join('') || '?';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) navigate('/login', { replace: true });
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading profile…</p></PageWrapper>;
  }

  if (!isAuthenticated || !user) return null;

  const ringScore = Math.min(10, ((user.credibilityScore ?? 0) / 10000) * 10);

  return (
    <PageWrapper>
      <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="flex items-center gap-6">
          <Avatar initials={initialsOf(user.name)} size="xl" />
          <div>
            <h1 className="mb-1 text-4xl font-bold tracking-[-0.05em] text-white">{user.name}</h1>
            <p className="mb-3 text-sm text-slate-500">@{user.username}</p>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <TierBadge score={user.credibilityScore ?? 0} />
              {user.accessRole === 'Admin' && (
                <span className="rounded border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">Admin</span>
              )}
              <span className="text-sm text-slate-400">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5 rounded-2xl border border-white/8 bg-[#0d0d12] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
            <ScoreRing score={ringScore} maxScore={10} size={96} />
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Credibility</div>
              <div className="mb-2 text-2xl font-black font-mono text-white">{(user.credibilityScore ?? 0).toLocaleString()}</div>
              <TierProgressBar score={user.credibilityScore ?? 0} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12 grid gap-4 md:grid-cols-4">
        {[
          { label: 'Solve Score', value: (user.solveScore ?? 0).toLocaleString(), color: 'text-cyan-300' },
          { label: 'Review Score', value: (user.reviewScore ?? 0).toLocaleString(), color: 'text-violet-300' },
          { label: 'Cases Solved', value: (user.casesSolved ?? 0).toString(), color: 'text-white' },
          { label: 'Merge Bonuses', value: (user.mergeBonusCount ?? 0).toString(), color: 'text-amber-300' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-[#0d0d12] p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
            <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
      <p className="-mt-8 mb-12 text-xs text-slate-500">
        Scores update as reviews and scoring are completed. They may show zero until then.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <h3 className="mb-6 text-xl font-bold text-white">Submission history</h3>
          <div className="flex flex-col items-center py-8 text-center">
            <p className="mb-3 text-sm text-slate-400">No submissions yet.</p>
            <p className="mb-4 text-xs text-slate-500">Solve a case to start building your history.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/cases')}>Browse cases</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <h3 className="mb-6 text-xl font-bold text-white">Review activity</h3>
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-slate-400">Peer review is not available yet.</p>
            <p className="mt-1 text-xs text-slate-500">Review stats will appear here once the review workflow launches.</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfilePage;
