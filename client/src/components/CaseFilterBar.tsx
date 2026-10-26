import React from 'react';
import { Search } from 'lucide-react';
import { PROBLEM_TYPES } from '../data/mockData';
import type { ProblemType } from '../data/mockData';

interface CaseFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ProblemType | 'All';
  onTypeChange: (value: ProblemType | 'All') => void;
  difficultyFilter: string;
  onDifficultyChange: (value: string) => void;
  sectorFilter: string;
  onSectorChange: (value: string) => void;
  sectors: string[];
}

const selectClassName =
  'input-field h-10 min-w-0 px-3 text-sm sm:w-auto sm:min-w-[150px]';

export const CaseFilterBar: React.FC<CaseFilterBarProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  difficultyFilter,
  onDifficultyChange,
  sectorFilter,
  onSectorChange,
  sectors,
}) => (
  <div className="mb-6 grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,190px))]">
    <label className="relative block min-w-0">
      <span className="sr-only">Search cases</span>
      <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        placeholder="Search cases"
        className="input-field h-10 pl-10"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </label>

    <label className="min-w-0">
      <span className="sr-only">Filter by problem type</span>
      <select className={selectClassName} value={typeFilter} onChange={(event) => onTypeChange(event.target.value as ProblemType | 'All')}>
        <option value="All">All problem types</option>
        {PROBLEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
    </label>

    <label className="min-w-0">
      <span className="sr-only">Filter by difficulty</span>
      <select className={selectClassName} value={difficultyFilter} onChange={(event) => onDifficultyChange(event.target.value)}>
        {['All', 'Standard', 'High', 'Chaos'].map((difficulty) => (
          <option key={difficulty} value={difficulty}>
            {difficulty === 'All' ? 'All difficulties' : difficulty}
          </option>
        ))}
      </select>
    </label>

    <label className="min-w-0">
      <span className="sr-only">Filter by sector</span>
      <select className={selectClassName} value={sectorFilter} onChange={(event) => onSectorChange(event.target.value)}>
        <option value="All">All sectors</option>
        {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
      </select>
    </label>
  </div>
);
