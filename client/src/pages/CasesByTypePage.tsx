import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CASES, SLUG_TO_PROBLEM_TYPE } from '../data/mockData';
import { CaseCard } from '../components/CaseCard';
import { CaseFilterBar } from '../components/CaseFilterBar';
import { ChaosBanner } from '../components/ChaosBanner';
import { PageWrapper } from '../components/PageWrapper';

export const CasesByTypePage: React.FC = () => {
  const { type } = useParams();
  const problemType = type ? SLUG_TO_PROBLEM_TYPE[type] : undefined;

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');

  const sectors = useMemo(() => [...new Set(MOCK_CASES.map(c => c.sector))].sort(), []);

  const filteredCases = MOCK_CASES.filter(c => {
    if (problemType && c.type !== problemType) return false;
    const searchLower = search.toLowerCase();
    const searchMatch = !search || c.title.toLowerCase().includes(searchLower) ||
      c.sector.toLowerCase().includes(searchLower) ||
      c.tags.some(t => t.toLowerCase().includes(searchLower));
    const diffMatch = difficultyFilter === 'All' || c.difficulty === difficultyFilter;
    const sectorMatch = sectorFilter === 'All' || c.sector === sectorFilter;
    return searchMatch && diffMatch && sectorMatch;
  });

  if (!problemType) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Problem type not found</h2>
          <Link to="/cases" className="btn-primary">Browse all cases</Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="section-label mb-2">{problemType.toUpperCase()}</div>
        <h1 className="section-title mb-4">{problemType} Cases</h1>
        <p className="section-subtitle">
          Specialized briefs for {problemType.toLowerCase()} problems. Complete 2 peer reviews to unlock submission.
        </p>
      </div>

      <ChaosBanner cases={filteredCases} />

      <CaseFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={problemType}
        onTypeChange={() => {}}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        sectorFilter={sectorFilter}
        onSectorChange={setSectorFilter}
        sectors={sectors}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {filteredCases.length > 0 ? (
          filteredCases.map(caseData => <CaseCard key={caseData.id} caseData={caseData} />)
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400">No cases match your filters.</div>
        )}
      </div>
    </PageWrapper>
  );
};
