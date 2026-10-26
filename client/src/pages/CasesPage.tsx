import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Case, ProblemType } from '../data/mockData';
import { CaseCard } from '../components/CaseCard';
import { CaseFilterBar } from '../components/CaseFilterBar';
import { ChaosBanner } from '../components/ChaosBanner';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { getCases } from '../services/api';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProblemType | 'All'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getCases()
      .then((loadedCases) => {
        if (isCurrent) setCases(loadedCases);
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Could not load cases');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, []);

  const sectors = useMemo(() => [...new Set(cases.map((caseData) => caseData.sector))].sort(), [cases]);
  const filteredCases = cases.filter((caseData) => {
    const searchLower = search.trim().toLowerCase();
    const searchMatch = !searchLower ||
      caseData.title.toLowerCase().includes(searchLower) ||
      caseData.sector.toLowerCase().includes(searchLower) ||
      caseData.tags.some((tag) => tag.toLowerCase().includes(searchLower));
    return searchMatch &&
      (typeFilter === 'All' || caseData.type === typeFilter) &&
      (difficultyFilter === 'All' || caseData.difficulty === difficultyFilter) &&
      (sectorFilter === 'All' || caseData.sector === sectorFilter);
  });

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setDifficultyFilter('All');
    setSectorFilter('All');
  };

  return (
    <>
      <SEO
        title="Case Library"
        description="Explore community-submitted case studies. Every proposal is reviewed before it appears in the library."
        ogUrl="/cases"
      />
      <PageWrapper>
        <header className="mb-8 flex flex-col gap-5 border-b border-[var(--border-subtle)] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Case library</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Work through structured case studies. Community proposals are reviewed before publication.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" as="a" href="/contribute/cases/mine">My proposals</Button>
            <Button variant="primary" size="sm" as="a" href="/contribute/cases">Propose a case</Button>
          </div>
        </header>

        <ChaosBanner cases={cases} />

        <CaseFilterBar
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          difficultyFilter={difficultyFilter}
          onDifficultyChange={setDifficultyFilter}
          sectorFilter={sectorFilter}
          onSectorChange={setSectorFilter}
          sectors={sectors}
        />

        <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-secondary)]" aria-live="polite">
          <p>{filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}</p>
          {(search || typeFilter !== 'All' || difficultyFilter !== 'All' || sectorFilter !== 'All') && (
            <button type="button" onClick={clearFilters} className="rounded-sm text-[var(--text-primary)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
              Clear filters
            </button>
          )}
        </div>

        {loadError ? (
          <div className="border-y border-[var(--border-subtle)] py-8" role="alert">
            <p className="font-medium text-[var(--text-primary)]">Cases could not be loaded.</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{loadError}</p>
            <button type="button" className="mt-3 text-sm font-medium text-[var(--text-primary)] underline underline-offset-4" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="border-y border-[var(--border-subtle)] py-8 text-sm text-[var(--text-secondary)]" aria-live="polite">
            Loading cases…
          </div>
        ) : filteredCases.length > 0 ? (
          <div>
            {filteredCases.map((caseData) => <CaseCard key={caseData.id} caseData={caseData} />)}
          </div>
        ) : (
          <div className="border-y border-[var(--border-subtle)] py-9">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {cases.length ? 'No cases match those filters' : 'No published cases yet'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              {cases.length
                ? 'Try a different search or clear your filters.'
                : 'Help build the library by proposing an original, well-structured case. A moderator reviews every proposal before it is published.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {cases.length ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
              ) : (
                <Button variant="primary" size="sm" as="a" href="/contribute/cases">Propose the first case</Button>
              )}
              <Link className="inline-flex h-9 items-center px-3 text-sm text-[var(--text-secondary)] underline underline-offset-4" to="/how-it-works">
                How case review works
              </Link>
            </div>
          </div>
        )}
      </PageWrapper>
    </>
  );
};
