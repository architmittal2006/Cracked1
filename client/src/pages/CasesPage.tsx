import React, { useMemo, useState } from 'react';
import { MOCK_CASES } from '../data/mockData';
import type { ProblemType } from '../data/mockData';
import { CaseCard } from '../components/CaseCard';
import { CaseFilterBar } from '../components/CaseFilterBar';
import { ChaosBanner } from '../components/ChaosBanner';
import { PageWrapper } from '../components/PageWrapper';

export const CasesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProblemType | 'All'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');

  const sectors = useMemo(() => [...new Set(MOCK_CASES.map(c => c.sector))].sort(), []);

  const filteredCases = MOCK_CASES.filter(c => {
    const searchLower = search.toLowerCase();
    const searchMatch = !search || c.title.toLowerCase().includes(searchLower) ||
      c.sector.toLowerCase().includes(searchLower) ||
      c.tags.some(t => t.toLowerCase().includes(searchLower));
    const typeMatch = typeFilter === 'All' || c.type === typeFilter;
    const diffMatch = difficultyFilter === 'All' || c.difficulty === difficultyFilter;
    const sectorMatch = sectorFilter === 'All' || c.sector === sectorFilter;
    return searchMatch && typeMatch && diffMatch && sectorMatch;
  });

  const featuredCase = filteredCases.find(c => c.isFeatured);

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="section-label mb-2">CASE LIBRARY</div>
        <h1 className="section-title mb-4">Active Cases</h1>
        <p className="section-subtitle">
          Browse, filter, and read case briefs across 7 problem types. Review peers to unlock submissions.
        </p>
      </div>

      <ChaosBanner cases={MOCK_CASES} />

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {featuredCase && typeFilter === 'All' && difficultyFilter === 'All' && sectorFilter === 'All' && !search && (
          <CaseCard key={`featured-${featuredCase.id}`} caseData={featuredCase} />
        )}

        {filteredCases
          .filter(c => !c.isFeatured || typeFilter !== 'All' || difficultyFilter !== 'All' || sectorFilter !== 'All' || search)
          .map(caseData => (
            <CaseCard key={caseData.id} caseData={caseData} />
          ))}

        {filteredCases.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">No cases match your filters.</div>
        )}
      </div>
    </PageWrapper>
  );
};
