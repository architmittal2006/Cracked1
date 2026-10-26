import React from 'react';
import { Button } from '../Button';

const tiers = [
  {
    name: 'Analyst',
    description: 'Entry-level contributors',
    score: '0-1,000 pts',
    features: ['Solve up to 5 cases', 'Compare other solutions', 'Basic profile visibility'],
    popular: false,
  },
  {
    name: 'Consultant',
    description: 'Proven case solvers',
    score: '1,000-5,000 pts',
    features: ['Unlimited submissions', 'Solution history', 'Featured profiles'],
    popular: true,
  },
  {
    name: 'Partner',
    description: 'Top-tier experts',
    score: '5,000+ pts',
    features: ['Curated case access', 'Company merge bonuses', 'Mentorship privileges', 'Verified expert badge'],
    popular: false,
  },
];

export const TiersSection: React.FC = () => (
  <section className="py-12 px-6">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-3 text-center">Credibility tiers</h2>
      <p className="text-slate-400 text-center mb-8 max-w-2xl mx-auto">Explore the platform’s current credibility tiers. They are not yet an independently validated hiring measure.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div key={t.name} className={`glass-card p-6 relative ${t.popular ? 'border-orange-500/50' : ''}`}>
            {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full">Most common</div>}
            <h3 className="text-xl font-semibold text-white mb-1">{t.name}</h3>
            <p className="text-sm text-slate-400 mb-2">{t.description}</p>
            <div className="text-lg font-mono text-orange-400 mb-4">{t.score}</div>
            <ul className="space-y-2 mb-6">
              {t.features.map((feature, idx) => (
                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant={t.popular ? 'primary' : 'secondary'} size="md" className="w-full">Start as {t.name}</Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);
