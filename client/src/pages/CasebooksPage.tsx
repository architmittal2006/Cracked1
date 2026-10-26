import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { PROBLEM_TYPES } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { getCasebooks } from '../services/api';
import type { Casebook, CasebookFilters, CasebookSourceKind } from '../services/api';

const sourceLabels: Record<CasebookSourceKind, string> = {
  university: 'University',
  company: 'Company',
  club: 'Club',
  original: 'Original',
};

const inputClass = 'input-field mt-1.5 w-full';
const labelClass = 'block text-sm font-medium text-[var(--text-primary)]';

export const CasebooksPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [casebooks, setCasebooks] = useState<Casebook[]>([]);
  const [filters, setFilters] = useState<CasebookFilters>({});
  const [draft, setDraft] = useState<CasebookFilters>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    getCasebooks({ ...filters, page, pageSize: 20 })
      .then((result) => {
        if (!isCurrent) return;
        setCasebooks(result.casebooks);
        setTotal(result.total);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load casebooks');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [filters, page, retry]);

  const changeDraft = <K extends keyof CasebookFilters>(key: K, value: CasebookFilters[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = Object.fromEntries(
      Object.entries(draft).filter(([, value]) => value !== undefined && value !== '')
    ) as CasebookFilters;
    setPage(1);
    setFilters(next);
  };

  const clearFilters = () => {
    setDraft({});
    setFilters({});
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <SEO
        title="Casebooks"
        description="Read attributed casebooks and case summaries, then continue with separate practice cases."
        ogUrl="/casebooks"
      />
      <PageWrapper className="max-w-5xl">
        <header className="mb-7 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Casebooks</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Read case summaries and source information. Casebooks are for reading, not scored practice.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAuthenticated && (
                <Button size="sm" variant="secondary" as="a" href="/contribute/casebooks/mine">
                  My casebooks
                </Button>
              )}
              {user?.role === 'Moderator' && (
                <Button size="sm" variant="secondary" as="a" href="/moderation/casebooks">
                  Review casebooks
                </Button>
              )}
              <Button size="sm" variant="primary" as="a" href="/contribute/casebooks">
                Contribute a casebook
              </Button>
            </div>
          </div>
        </header>

        <form onSubmit={applyFilters} className="mb-6 grid gap-4 border-b border-[var(--border-subtle)] pb-6 sm:grid-cols-2 lg:grid-cols-4">
          <label className={`${labelClass} sm:col-span-2`}>
            Search
            <input
              className={inputClass}
              type="search"
              value={draft.search ?? ''}
              onChange={(event) => changeDraft('search', event.target.value)}
              placeholder="Search titles, sources, or industries"
            />
          </label>
          <label className={labelClass}>
            Source type
            <select className={inputClass} value={draft.sourceKind ?? ''} onChange={(event) => changeDraft('sourceKind', (event.target.value || undefined) as CasebookSourceKind | undefined)}>
              <option value="">All source types</option>
              {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Year
            <input
              className={inputClass}
              type="number"
              min={1800}
              max={2200}
              value={draft.year ?? ''}
              onChange={(event) => changeDraft('year', event.target.value ? Number(event.target.value) : undefined)}
            />
          </label>
          <label className={labelClass}>
            Sector
            <input
              className={inputClass}
              value={draft.sector ?? ''}
              onChange={(event) => changeDraft('sector', event.target.value || undefined)}
              placeholder="Filter by sector"
            />
          </label>
          <label className={labelClass}>
            Case type
            <select className={inputClass} value={draft.caseType ?? ''} onChange={(event) => changeDraft('caseType', event.target.value || undefined)}>
              <option value="">All case types</option>
              {PROBLEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm" loading={isLoading}>Search casebooks</Button>
            <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
          </div>
        </form>

        <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-secondary)]" aria-live="polite">
          <p>{total} {total === 1 ? 'casebook' : 'casebooks'}</p>
          {totalPages > 1 && <p>Page {page} of {totalPages}</p>}
        </div>

        {error ? (
          <div className="border-y border-[var(--border-subtle)] py-7" role="alert">
            <p className="font-medium text-[var(--text-primary)]">Casebooks could not be loaded.</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
            <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => setRetry((count) => count + 1)}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <p className="border-y border-[var(--border-subtle)] py-7 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading casebooks…</p>
        ) : casebooks.length === 0 ? (
          <div className="border-y border-[var(--border-subtle)] py-8">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">No casebooks found</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Try changing your filters. Casebooks appear here only after a moderator approves them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {casebooks.map((casebook) => (
              <article key={casebook.id} className="py-5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    <Link to={`/casebooks/${encodeURIComponent(casebook.slug)}`} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                      {casebook.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {casebook.sourceOrg}{casebook.year ? ` · ${casebook.year}` : ''} · {casebook.caseCount} {casebook.caseCount === 1 ? 'case' : 'cases'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{casebook.description}</p>
                </div>
                <span className="mt-3 inline-flex text-xs text-[var(--text-secondary)] sm:mt-0">
                  {casebook.licenseKind === 'link_only' ? 'Opens original site' : 'Hosted'}
                </span>
              </article>
            ))}
          </div>
        )}

        {!error && totalPages > 1 && (
          <nav className="mt-5 flex items-center justify-between" aria-label="Casebook pages">
            <Button type="button" variant="secondary" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>
              Previous page
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>
              Next page
            </Button>
          </nav>
        )}
      </PageWrapper>
    </>
  );
};
