import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, FileText, PenLine } from 'lucide-react';
import type { Case } from '../data/mockData';
import { StatusPill } from '../components/StatusPill';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { DeliverablesList } from '../components/DeliverablesList';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { getCaseById } from '../services/api';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isCurrent = true;
    getCaseById(id)
      .then((loadedCase) => {
        if (!isCurrent) return;
        setCaseData(loadedCase);
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Could not load this case');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [id]);

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading case…</p></PageWrapper>;
  }

  if (loadError || !caseData) {
    return (
      <PageWrapper>
        <div className="py-10" role={loadError ? 'alert' : undefined}>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {loadError ? 'Case could not be loaded' : 'Case not found'}
          </h1>
          {loadError && <p className="mt-2 text-sm text-[var(--text-secondary)]">{loadError}</p>}
          <Button variant="secondary" size="sm" onClick={() => navigate('/cases')} className="mt-5">Back to cases</Button>
        </div>
      </PageWrapper>
    );
  }

  const difficultyClass = caseData.difficulty === 'Chaos'
    ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
    : caseData.difficulty === 'High'
      ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
      : 'border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] text-[var(--text-secondary)]';

  return (
    <PageWrapper className="py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/cases')} className="mb-5 inline-flex gap-2">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to cases
      </Button>

      <header className="mb-8 border-b border-[var(--border-subtle)] pb-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ProblemTypeBadge type={caseData.type} linked />
          <span className={`rounded px-2.5 py-1 text-xs font-medium ${difficultyClass}`}>{caseData.difficulty}</span>
          <StatusPill status={caseData.status} />
          {caseData.is_chaos && <span className="text-xs text-[var(--text-secondary)]">Chaos case</span>}
        </div>
        <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">{caseData.title}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {caseData.sector}{caseData.companyType ? ` · ${caseData.companyType}` : ''}
        </p>
        <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[var(--text-primary)]">{caseData.description}</p>

        {caseData.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]" aria-label="Case tags">
            {caseData.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2"><FileText aria-hidden="true" className="h-4 w-4" />{caseData.submissionCount} submissions</span>
          {caseData.deadline && (
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden="true" className="h-4 w-4" /> Deadline: {new Date(caseData.deadline).toLocaleDateString()}
            </span>
          )}
          {caseData.pts > 0 && <span className="tabular-nums">{caseData.pts} points</span>}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
        <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Expected deliverables</h2>
          <DeliverablesList deliverables={caseData.deliverables} />
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Solve and compare</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Submit your own approach first. Then compare it with other learners’ solutions.
            </p>
            <div className="mt-5 space-y-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/cases/${caseData.id}/submit`)}
                className="w-full"
              >
                <PenLine aria-hidden="true" className="h-4 w-4" />
                Submit your solution
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/cases/${caseData.id}/solutions`)}
                className="w-full"
              >
                <Eye aria-hidden="true" className="h-4 w-4" />
                Compare solutions
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </PageWrapper>
  );
};

export default CaseDetailPage;
