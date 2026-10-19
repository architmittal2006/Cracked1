import React from 'react';

export const SubmitScreen: React.FC = () => (
  <div className="p-4 space-y-3 text-sm">
    <div className="font-semibold text-white">Submission Editor</div>
    <div className="glass-card p-3 space-y-2">
      {['Problem framing', 'Approach', 'Recommendation', 'Risks & mitigation'].map((s) => (
        <div key={s} className="border border-white/10 rounded p-2">
          <div className="text-xs text-slate-400">{s}</div>
          <div className="text-slate-300 text-xs mt-1">Lorem ipsum dolor sit amet…</div>
        </div>
      ))}
    </div>
    <div className="text-xs text-slate-500">Citations: 3 · Words: 420</div>
  </div>
);
