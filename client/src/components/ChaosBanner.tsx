import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import type { Case } from '../data/mockData';

interface ChaosBannerProps {
  cases: Case[];
}

export const ChaosBanner: React.FC<ChaosBannerProps> = ({ cases }) => {
  const chaosCases = cases.filter(c => c.is_chaos && c.timer_deadline && c.status === 'Open');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (chaosCases.length === 0) return null;

  const nearest = chaosCases.reduce((a, b) =>
    new Date(a.timer_deadline!).getTime() < new Date(b.timer_deadline!).getTime() ? a : b
  );

  const remaining = Math.max(0, new Date(nearest.timer_deadline!).getTime() - now);
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="glass-card p-4 mb-8 border-rose-500/40 bg-rose-950/20 border-t-4 border-t-rose-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-rose-400 font-bold uppercase tracking-widest text-xs mb-1">Chaos Case Live</div>
            <div className="text-white font-bold">{nearest.title}</div>
            <div className="text-slate-400 text-sm mt-1">{chaosCases.length} active chaos {chaosCases.length === 1 ? 'case' : 'cases'} with live timers</div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-lg font-bold text-rose-400 bg-black/30 px-4 py-2 rounded-lg border border-rose-500/30">
          <Clock className="w-5 h-5" />
          {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};
