import React from 'react';
import { Button } from '../Button';

const tiers = [
  { name: 'Analyst', price: 'Free during beta', popular: false },
  { name: 'Consultant', price: 'Free during beta', popular: true },
  { name: 'Partner', price: 'Free during beta', popular: false },
];

export const TiersSection: React.FC = () => (
  <section className="py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Credibility tiers</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div key={t.name} className={`glass-card p-6 relative ${t.popular ? 'border-orange-500' : ''}`}>
            {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full">Most popular</div>}
            <h3 className="text-xl font-semibold text-white">{t.name}</h3>
            <div className="text-2xl font-bold text-orange-400 my-3">{t.price}</div>
            <Button variant={t.popular ? 'primary' : 'secondary'} size="md" className="w-full">Start as {t.name}</Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);
