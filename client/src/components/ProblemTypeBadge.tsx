import React from 'react';
import { Link } from 'react-router-dom';
import type { ProblemType } from '../data/mockData';
import { PROBLEM_TYPE_SLUGS } from '../data/mockData';

interface ProblemTypeBadgeProps {
  type: ProblemType;
  linked?: boolean;
}

const TYPE_COLORS: Record<ProblemType, string> = {
  'Market Sizing': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  Profitability: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Market Entry': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Operational: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Pricing: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  'M&A': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'Growth & Retention': 'bg-teal-500/10 text-teal-400 border-teal-500/30',
};

export const ProblemTypeBadge: React.FC<ProblemTypeBadgeProps> = ({ type, linked = false }) => {
  const className = `text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border ${TYPE_COLORS[type]}`;

  if (linked) {
    return (
      <Link to={`/cases/type/${PROBLEM_TYPE_SLUGS[type]}`} className={`${className} hover:opacity-80 transition-opacity`}>
        {type}
      </Link>
    );
  }

  return <span className={className}>{type}</span>;
};
