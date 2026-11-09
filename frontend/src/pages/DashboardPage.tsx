import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, FileText, RefreshCw } from 'lucide-react';
import { getTierProgress } from '../data/mockData';
import { ScoreRing } from '../components/ScoreRing';
import { TierBadge } from '../components/TierBadge';
import { PageWrapper } from '../components/PageWrapper';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { getDashboardActivity } from '../services/api';
import type { DashboardActivity } from '../services/api';

const formatActivityDate = (value: string | undefined): string => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

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
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

  useEffect(() => {
    if (!user?.id) return;
    let isCurrent = true;
    setActivityLoading(true);
    setActivityError(null);
    getDashboardActivity()
      .then((result) => {
        if (isCurrent) setActivity(result);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setActivityError(error instanceof Error ? error.message : 'Could not load your activity.');
        }
      })
      .finally(() => {
        if (isCurrent) setActivityLoading(false);
      });
    return () => { isCurrent = false; };
  }, [user?.id, reloadKey]);

  if (isLoading) return null;
  if (!isAuthenticated || !user) return null;

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

      {activityError && (
        <div className="mb-6 flex flex-col gap-3 border-y border-red-400/30 py-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p className="text-sm text-red-200">{activityError}</p>
          <Button variant="secondary" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Continue where you left off</h2>
              <p className="mt-1 text-xs text-slate-500">Your saved case drafts</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>Browse cases</Button>
          </div>
          {activityLoading ? (
            <p className="py-6 text-sm text-slate-400" aria-live="polite">Loading your drafts…</p>
          ) : activityError ? (
            <p className="py-6 text-sm text-slate-400">Drafts are unavailable until activity can be loaded.</p>
          ) : activity?.drafts.length ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {activity.drafts.map((draft) => (
                <article key={draft.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-medium text-white">{draft.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {draft.type || 'Case'} <span aria-hidden="true">·</span> Updated {formatActivityDate(draft.updatedAt)}
                    </p>
                  </div>
                  {draft.caseAvailable ? (
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/cases/${encodeURIComponent(draft.caseId)}/solve`)} className="shrink-0">
                      Resume <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-500">No longer available</span>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-7 text-center">
              <FileText className="mb-3 h-6 w-6 text-slate-500" aria-hidden="true" />
              <p className="text-sm text-slate-300">No drafts in progress</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Start a case and your saved work will be ready to pick up here.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/cases')} className="mt-4">Find a case</Button>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent submissions</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest submitted attempts</p>
            </div>
            <span className="text-xs text-slate-500">Latest 5</span>
          </div>
          {activityLoading ? (
            <p className="py-6 text-sm text-slate-400" aria-live="polite">Loading your submissions…</p>
          ) : activityError ? (
            <p className="py-6 text-sm text-slate-400">Submissions are unavailable until activity can be loaded.</p>
          ) : activity?.submissions.length ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {activity.submissions.map((submission) => (
                <article key={submission.id} className="py-4 first:pt-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-medium text-white">{submission.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {submission.type || 'Case'} <span aria-hidden="true">·</span> {formatActivityDate(submission.createdAt)}
                      </p>
                      <span className="mt-2 inline-flex rounded border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-slate-400">{submission.status}</span>
                    </div>
                    {submission.caseAvailable ? (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${encodeURIComponent(submission.caseId)}`)}>Review case</Button>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/cases/${encodeURIComponent(submission.caseId)}/solutions`)}>Compare <ArrowRight className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Case no longer available</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-7 text-center">
              <Clock className="mb-3 h-6 w-6 text-slate-500" aria-hidden="true" />
              <p className="text-sm text-slate-300">No submissions yet</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Once you submit a case, you can return here to review it and compare approaches.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/cases')} className="mt-4">Browse cases</Button>
            </div>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Scores and tiers reflect persisted account data and update as review scoring launches.
      </p>
    </PageWrapper>
  );
};
