import React from 'react';
import { getTierProgress } from '../data/mockData';

interface TierProgressBarProps {
  score: number;
  compact?: boolean;
}

export const TierProgressBar: React.FC<TierProgressBarProps> = ({ score, compact = false }) => {
  const progress = getTierProgress(score);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="progress-bar h-2">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {progress.percent.toFixed(0)}% to {progress.next || 'Max'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-white">{progress.current}</span>
        {progress.next && (
          <span className="text-xs text-slate-400">Next: {progress.next}</span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="text-xs text-slate-500 text-right">
        {progress.percent.toFixed(0)}% complete
      </div>
    </div>
  );
};
