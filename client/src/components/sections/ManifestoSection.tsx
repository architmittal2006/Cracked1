import React from 'react';
import { Button } from '../Button';

export const ManifestoSection: React.FC = () => (
  <section className="py-12 px-6 bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="max-w-4xl mx-auto text-center">
      <p className="text-2xl md:text-4xl font-bold text-white leading-tight">
        We believe proof of work beats <span className="italic font-serif text-orange-400">promise</span>.
      </p>
      <p className="text-slate-400 mt-4 text-lg">Cracked? gives learners a place to solve real cases, explain their reasoning, and compare different approaches.</p>
    </div>
  </section>
);

export const FinalCTASection: React.FC = () => (
  <section className="py-16 px-6 text-center relative overflow-hidden">
    <div className="absolute inset-0 bg-orange-500/10 blur-3xl" aria-hidden="true" />
    <div className="relative z-10">
      <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">Ready to find out if you're Cracked?</h2>
      <Button variant="primary" size="lg">Solve your first case free</Button>
    </div>
  </section>
);
