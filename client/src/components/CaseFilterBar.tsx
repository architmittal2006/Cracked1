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
  <div className="space-y-4 mb-8">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        placeholder="Search cases by title, sector, or tags..."
        className="input-field pl-10"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>

    <div className="flex flex-wrap gap-2">
      <span className="text-xs text-slate-500 uppercase font-bold self-center mr-1">Type</span>
      <button
        type="button"
        onClick={() => onTypeChange('All')}
        className={`px-3 py-1.5 text-xs rounded-md border transition-all duration-200 ${
          typeFilter === 'All'
            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
        }`}
      >
        All Types
      </button>
      {PROBLEM_TYPES.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onTypeChange(type)}
          className={`px-3 py-1.5 text-xs rounded-md border transition-all duration-200 ${
            typeFilter === type
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          {type}
        </button>
      ))}
    </div>

    <div className="flex flex-wrap gap-2">
      <span className="text-xs text-slate-500 uppercase font-bold self-center mr-1">Difficulty</span>
      {['All', 'Standard', 'High', 'Chaos'].map(diff => (
        <button
          key={diff}
          type="button"
          onClick={() => onDifficultyChange(diff)}
          className={`px-3 py-1.5 text-xs rounded-md border transition-all duration-200 ${
            difficultyFilter === diff
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          {diff === 'All' ? 'All' : diff}
        </button>
      ))}

      <div className="w-px h-6 bg-slate-800 mx-1 self-center hidden sm:block" />

      <span className="text-xs text-slate-500 uppercase font-bold self-center mr-1">Sector</span>
      <select
        className="input-field w-auto py-1.5 text-xs min-w-[140px]"
        value={sectorFilter}
        onChange={(e) => onSectorChange(e.target.value)}
      >
        <option value="All">All Sectors</option>
        {sectors.map(sector => (
          <option key={sector} value={sector}>{sector}</option>
        ))}
      </select>
    </div>
  </div>
);
