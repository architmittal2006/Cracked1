import React from 'react';

export const SolutionsScreen: React.FC = () => (
  <div className="space-y-3 p-4 text-sm">
    <div className="font-semibold text-white">Other approaches · Case</div>
    <div className="glass-card p-3">
      <div className="mb-2 text-xs text-slate-400">Approach</div>
      <p className="leading-6 text-slate-300">
        Start by identifying the constraint, then compare options by their likely impact and implementation effort.
      </p>
    </div>
    <div className="glass-card p-3">
      <div className="mb-2 text-xs text-slate-400">Another perspective</div>
      <p className="leading-6 text-slate-300">
        Segment the problem first; different customer groups may need different solutions.
      </p>
    </div>
    <div className="text-xs text-slate-500">Submit your own solution before comparing.</div>
  </div>
);
