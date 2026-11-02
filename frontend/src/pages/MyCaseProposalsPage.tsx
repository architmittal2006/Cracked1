import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getMyCaseProposals } from '../services/api';
import type { CaseProposal } from '../services/api';

const statusLabels: Record<CaseProposal['status'], string> = {
  Pending: 'In review',
  Changes_Requested: 'Changes requested',
  Approved: 'Published',
  Declined: 'Not approved',
};

export const MyCaseProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<CaseProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const submitted = (location.state as { submitted?: boolean } | null)?.submitted;

  useEffect(() => {
    let isCurrent = true;
    getMyCaseProposals()
      .then((items) => {
        if (isCurrent) setProposals(items);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load your proposals');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, []);

  return (
    <PageWrapper className="max-w-5xl">
      <header className="mb-7 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">My case proposals</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Check review feedback and the publication status of your submissions.</p>
        </div>
        <Button variant="primary" size="sm" as="a" href="/contribute/cases">Propose a case</Button>
      </header>

      {submitted && (
        <p className="mb-6 border border-emerald-700/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800" role="status">
          Your proposal was submitted for moderator review.
        </p>
      )}
      {error && <p className="border-y border-rose-500/30 py-5 text-sm text-rose-700" role="alert">{error}</p>}
      {isLoading && <p className="py-6 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading proposals…</p>}

      {!isLoading && !error && proposals.length === 0 && (
        <div className="border-y border-[var(--border-subtle)] py-8">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">No proposals yet</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">A clear scenario, a focused question, and a useful evaluation guide help make a case worth solving.</p>
          <Link to="/contribute/cases" className="mt-4 inline-flex text-sm font-medium text-[var(--text-primary)] underline underline-offset-4">Start a proposal</Link>
        </div>
      )}

      <div>
        {proposals.map((proposal) => (
          <article key={proposal.id} className="grid gap-3 border-b border-[var(--border-subtle)] py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{proposal.title}</h2>
                <span className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                  {statusLabels[proposal.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {proposal.type} · {proposal.sector} · Submitted {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
              {proposal.moderatorNotes && (
                <div className="mt-3 max-w-3xl">
                  <p className="text-xs font-medium text-[var(--text-primary)]">Moderator feedback</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{proposal.moderatorNotes}</p>
                </div>
              )}
            </div>
            {proposal.status === 'Changes_Requested' && (
              <Link to={`/contribute/cases/${encodeURIComponent(proposal.id)}/edit`} className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-medium)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">
                Revise proposal
              </Link>
            )}
            {proposal.status === 'Approved' && proposal.publishedCaseId && (
              <div className="flex flex-wrap gap-2">
                <Link to={`/cases/${encodeURIComponent(proposal.publishedCaseId)}`} className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-medium)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">
                  View case
                </Link>
                <Link to={`/cases/${encodeURIComponent(proposal.publishedCaseId)}/solutions`} className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-medium)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">
                  View learner solutions
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
    </PageWrapper>
  );
};
