import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PROBLEM_TYPE_SLUGS, SLUG_TO_PROBLEM_TYPE } from '../data/mockData';
import type { Case } from '../data/mockData';
import { CaseCard } from '../components/CaseCard';
import { CaseFilterBar } from '../components/CaseFilterBar';
import { ChaosBanner } from '../components/ChaosBanner';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { getCases } from '../services/api';

export const CasesByTypePage: React.FC = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const problemType = type ? SLUG_TO_PROBLEM_TYPE[type] : undefined;

  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
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
    if (problemType && caseData.type !== problemType) return false;
    const searchLower = search.toLowerCase();
    const searchMatch = !search || caseData.title.toLowerCase().includes(searchLower) ||
      caseData.sector.toLowerCase().includes(searchLower) ||
      caseData.tags.some((tag) => tag.toLowerCase().includes(searchLower));
    const diffMatch = difficultyFilter === 'All' || caseData.difficulty === difficultyFilter;
    const sectorMatch = sectorFilter === 'All' || caseData.sector === sectorFilter;
    return searchMatch && diffMatch && sectorMatch;
  });

  if (!problemType) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Problem type not found</h2>
          <Button variant="primary" size="md" onClick={() => navigate('/cases')}>Browse all cases</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="page-header">
          <h1 className="section-title mb-4">{problemType} cases</h1>
        <p className="section-subtitle">
          Specialized briefs for {problemType.toLowerCase()} problems. Submit your solution, then compare different approaches.
        </p>
      </div>

      <ChaosBanner cases={filteredCases} />

      <CaseFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={problemType}
        onTypeChange={(selectedType) => navigate(selectedType === 'All' ? '/cases' : `/cases/type/${PROBLEM_TYPE_SLUGS[selectedType]}`)}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        sectorFilter={sectorFilter}
        onSectorChange={setSectorFilter}
        sectors={sectors}
      />

      {loadError ? (
        <p className="border-y border-[var(--border-subtle)] py-8 text-sm text-[var(--text-secondary)]" role="alert">
          Cases could not be loaded: {loadError}
        </p>
      ) : isLoading ? (
        <p className="border-y border-[var(--border-subtle)] py-8 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading cases…</p>
      ) : filteredCases.length ? (
        <div>{filteredCases.map((caseData) => <CaseCard key={caseData.id} caseData={caseData} />)}</div>
      ) : (
        <p className="border-y border-[var(--border-subtle)] py-8 text-sm text-[var(--text-secondary)]">
          No {problemType.toLowerCase()} cases match your filters yet. <a href="/contribute/cases" className="underline underline-offset-4">Propose a case</a>.
        </p>
      )}
    </PageWrapper>
  );
};
