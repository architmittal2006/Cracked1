import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getMyCasebooks } from '../services/api';
import type { Casebook, CasebookStatus } from '../services/api';

const statusLabels: Record<CasebookStatus, string> = {
  Pending: 'In review',
  Changes_Requested: 'Changes requested',
  Published: 'Published',
  Declined: 'Not approved',
  Taken_down: 'Taken down',
};

export const MyCasebooksPage: React.FC = () => {
  const [casebooks, setCasebooks] = useState<Casebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const location = useLocation();
  const submitted = (location.state as { submitted?: boolean } | null)?.submitted;

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    getMyCasebooks()
      .then((items) => { if (isCurrent) setCasebooks(items); })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load your casebooks');
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [retry]);

  return (
    <PageWrapper className="max-w-5xl">
      <header className="mb-7 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">My casebooks</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Track review status and respond to moderator feedback.</p>
        </div>
        <Button variant="primary" size="sm" as="a" href="/contribute/casebooks">Contribute a casebook</Button>
      </header>

      {submitted && (
        <p className="mb-6 border-y border-[var(--border-subtle)] py-4 text-sm text-[var(--text-primary)]" role="status">
          Your casebook was submitted for moderator review.
        </p>
      )}
      {error && (
        <div className="border-y border-[var(--border-subtle)] py-5" role="alert">
          <p className="text-sm text-[var(--text-primary)]">Your casebooks could not be loaded.</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
          <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => setRetry((count) => count + 1)}>Try again</Button>
        </div>
      )}
      {isLoading && <p className="py-6 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading casebooks…</p>}
      {!isLoading && !error && casebooks.length === 0 && (
        <div className="border-y border-[var(--border-subtle)] py-8">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">No casebooks submitted yet</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Add source details and original summaries to start a casebook contribution.</p>
          <Link to="/contribute/casebooks" className="mt-4 inline-flex text-sm font-medium text-[var(--text-primary)] underline underline-offset-4">Start a casebook</Link>
        </div>
      )}

      <div>
        {casebooks.map((casebook) => (
          <article key={casebook.id} className="grid gap-3 border-b border-[var(--border-subtle)] py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{casebook.title}</h2>
                <span className="rounded border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">{statusLabels[casebook.status]}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {casebook.sourceOrg}{casebook.year ? ` · ${casebook.year}` : ''} · {casebook.caseCount} {casebook.caseCount === 1 ? 'case' : 'cases'}
              </p>
              {casebook.moderatorNotes && (
                <div className="mt-3 max-w-3xl">
                  <p className="text-xs font-medium text-[var(--text-primary)]">Moderator feedback</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{casebook.moderatorNotes}</p>
                </div>
              )}
            </div>
            {casebook.status === 'Changes_Requested' && (
              <Link to={`/contribute/casebooks/${encodeURIComponent(casebook.id)}/edit`} className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-medium)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                Revise casebook
              </Link>
            )}
            {casebook.status === 'Published' && (
              <Link to={`/casebooks/${encodeURIComponent(casebook.slug)}`} className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-medium)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                View casebook
              </Link>
            )}
          </article>
        ))}
      </div>
    </PageWrapper>
  );
};
