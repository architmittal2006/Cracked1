import React from 'react';

export const ScoreScreen: React.FC = () => (
  <div className="p-4 space-y-3 text-sm">
    <div className="font-semibold text-white">Your Score</div>
    <div className="glass-card p-4 text-center">
      <div className="text-5xl font-bold text-orange-400">84</div>
      <div className="text-xs text-slate-400 mt-1">Weighted score</div>
      <div className="mt-3">
        <div className="text-xs text-slate-400 mb-1">Consultant tier</div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500" style={{ width: '68%' }} />
        </div>
        <div className="text-xs text-slate-500 mt-1">68% to Partner</div>
      </div>
      <div className="mt-3 inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">Consultant badge</div>
    </div>
  </div>
);

export const ProfileScreen: React.FC = () => (
  <div className="p-4 space-y-3 text-sm">
    <div className="font-semibold text-white">Public Profile · Recruiter view</div>
    <div className="glass-card p-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center text-orange-400 font-bold">AC</div>
        <div>
          <div className="text-white font-semibold">Alex Chen</div>
          <div className="text-xs text-slate-400">Consultant · Credibility 84</div>
        </div>
      </div>
      <div className="text-xs text-slate-400 mb-2">Certificates</div>
      <div className="grid grid-cols-2 gap-2">
        {['Case Solver', 'Peer Reviewer'].map((c) => (
          <div key={c} className="border border-white/10 rounded p-2 text-xs text-slate-300">{c}</div>
        ))}
      </div>
    </div>
  </div>
);
