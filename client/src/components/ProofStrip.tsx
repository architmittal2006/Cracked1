import React, { useEffect, useState } from 'react';

interface Stats { solutionsScored: number; contributors: number; mergeBonuses: number }

const CACHE_KEY = 'cracked_stats';
const CACHE_TTL = 5 * 60 * 1000;

export const ProofStrip: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const reduce = false;

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, expires } = JSON.parse(cached);
        if (expires > Date.now()) { setStats(data); setLoading(false); return; }
      } catch {}
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);
    fetch('/api/stats', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Stats) => {
        setStats(d);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: d, expires: Date.now() + CACHE_TTL }));
      })
      .catch(() => setFailed(true))
      .finally(() => { clearTimeout(t); setLoading(false); });
    return () => { clearTimeout(t); controller.abort(); };
  }, []);

  const allZero = stats && stats.solutionsScored === 0 && stats.contributors === 0 && stats.mergeBonuses === 0;
  const showStats = !failed && !allZero && stats;

  return (
    <section className="py-12 border-y border-white/10">
      {showStats ? (
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Solutions scored', value: stats!.solutionsScored },
            { label: 'Contributors', value: stats!.contributors },
            { label: 'Merge bonuses', value: stats!.mergeBonuses },
          ].map((s) => (
            <div key={s.label} className="min-h-[80px]">
              <div className="text-4xl font-bold text-white tabular-nums">
                {loading ? (
                  <span className="inline-block w-16 h-10 bg-white/10 rounded animate-pulse" />
                ) : (
                  <CountUp value={s.value} reduce={!!reduce} />
                )}
              </div>
              <div className="text-sm text-slate-400 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">How case practice works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: 'Solve first', d: 'Work through the case and write your own approach.' },
              { t: 'Submit your solution', d: 'Complete the structured response before sending it.' },
              { t: 'Compare approaches', d: 'Read other solutions after you have submitted yours.' },
            ].map((c) => (
              <div key={c.t} className="glass-card p-5">
                <div className="font-semibold text-white mb-1">{c.t}</div>
                <div className="text-sm text-slate-400">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const CountUp: React.FC<{ value: number; reduce: boolean }> = ({ value, reduce }) => {
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setN(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <>{n.toLocaleString()}</>;
};
