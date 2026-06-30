import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface GateIndicatorProps {
  reviewsCompleted: number;
  required?: number;
  compact?: boolean;
}

export const GateIndicator: React.FC<GateIndicatorProps> = ({
  reviewsCompleted,
  required = 2,
  compact = false,
}) => {
  const cleared = reviewsCompleted >= required;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={cleared ? 'Gate cleared' : `${reviewsCompleted}/${required} reviews`}>
        {Array.from({ length: required }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i < reviewsCompleted ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${cleared ? 'text-emerald-400' : 'text-slate-400'}`}>
      {cleared ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      <div className="flex gap-1.5">
        {Array.from({ length: required }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i < reviewsCompleted ? 'bg-emerald-400 shadow-[0_0_10px_#10B981]' : 'bg-slate-700'}`}
          />
        ))}
      </div>
      <span className="font-mono font-bold">{cleared ? 'Gate cleared' : `${reviewsCompleted}/${required} reviews`}</span>
    </div>
  );
};
