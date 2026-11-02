import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DiffBadgeProps {
  value: number;
  className?: string;
}

export const DiffBadge: React.FC<DiffBadgeProps> = ({ value, className = '' }) => {
  if (value === 0) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-medium text-slate-400 ${className}`}>
        <Minus className="w-3 h-3" />
        <span>0</span>
      </div>
    );
  }

  const isPositive = value > 0;
  const colorClass = isPositive ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass} ${className}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{isPositive ? '+' : ''}{value}</span>
    </div>
  );
};
