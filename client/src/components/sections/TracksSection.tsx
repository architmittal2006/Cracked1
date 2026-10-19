import React from 'react';
import { Zap, GitPullRequest, Trophy } from 'lucide-react';

const tracks = [
  { title: 'Open Arena', desc: 'No gate · submit immediately · community upvote ranking', icon: Trophy, color: '#1D9E75', weight: '0.5× credibility weight' },
  { title: 'Community Questions', desc: 'User-posted problems · poster accepts best answer', icon: GitPullRequest, color: '#D4537E', weight: '0.8× credibility weight' },
  { title: 'Curated Cases', desc: '2-review gate · 5-dimension rubric · merge bonus', icon: Zap, color: '#7F77DD', weight: '1.0× credibility weight' },
];

export const TracksSection: React.FC = () => (
  <section className="bg-slate-50 text-slate-900 py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Three tracks, one credibility system</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {tracks.map((t) => (
          <div key={t.title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <t.icon className="w-6 h-6 mb-3" style={{ color: t.color, strokeWidth: 1.75 }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: t.color }}>{t.title}</h3>
            <p className="text-base text-slate-600 mb-3">{t.desc}</p>
            <div className="text-sm font-mono text-slate-500">{t.weight}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
