import React from 'react';

export const ReviewScreen: React.FC = () => (
  <div className="p-4 space-y-3 text-sm">
    <div className="font-semibold text-white">Peer Review · Case #42</div>
    <div className="glass-card p-3">
      <div className="text-xs text-slate-400 mb-2">Rubric (5 dimensions)</div>
      {['Structure', 'Analysis', 'Creativity', 'Feasibility', 'Communication'].map((d, i) => (
        <div key={d} className="flex items-center justify-between py-1">
          <span className="text-slate-300">{d}</span>
          <span className="text-orange-400 font-mono">{[4, 5, 3, 4, 5][i]}/5</span>
        </div>
      ))}
    </div>
    <div className="text-xs text-slate-500">2 reviews required before scoring</div>
  </div>
);
