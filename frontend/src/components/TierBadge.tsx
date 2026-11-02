import React from 'react';
import { getCredibilityTier } from '../data/mockData';
import type { CredibilityTier } from '../data/mockData';

interface TierBadgeProps {
  score?: number;
  tier?: CredibilityTier;
}

const TIER_STYLES: Record<CredibilityTier, string> = {
  Analyst: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  Associate: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Consultant: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Sr. Consultant': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Principal: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Partner: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export const TierBadge: React.FC<TierBadgeProps> = ({ score, tier }) => {
  const resolved = tier ?? (score !== undefined ? getCredibilityTier(score) : 'Analyst');

  return (
    <span className={`tier-badge border ${TIER_STYLES[resolved]}`}>
      {resolved}
    </span>
  );
};
