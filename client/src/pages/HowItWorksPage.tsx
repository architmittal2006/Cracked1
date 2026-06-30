import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Gavel, Diamond, Lock } from 'lucide-react';
import { RUBRIC_DIMENSIONS, PROBLEM_TYPES, CREDIBILITY_TIER_THRESHOLDS, PROBLEM_TYPE_SLUGS } from '../data/mockData';
import { ReviewerBadge } from '../components/ReviewerBadge';
import { TierBadge } from '../components/TierBadge';
import { PageWrapper } from '../components/PageWrapper';

export const HowItWorksPage: React.FC = () => {
  return (
    <PageWrapper>
      <div className="text-center py-12 animate-slide-up">
        <div className="section-label mb-4">PLATFORM MODEL</div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">How Cracked? Works</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto text-balance">
          Proof-of-review gates, typed submission templates, and a live credibility system.
          No self-reported scores. No rubber stamps.
        </p>
      </div>

      <section className="py-12">
        <div className="mb-12">
          <div className="section-label mb-2">PROOF-OF-REVIEW</div>
          <h2 className="section-title">The Gate System</h2>
        </div>

        <div className="glass-card p-8 flex flex-col md:flex-row gap-8 items-start mb-8">
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Lock className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">2 Reviews → 1 Submission</h3>
            <p className="text-slate-300 leading-relaxed">
              Before you can submit a solution to case X, you must complete 2 peer reviews on submissions
              for case X. Gate indicators on every case card show your progress. Server-side enforcement
              via Row Level Security — the client never controls access.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <div className="section-label mb-2">PROBLEM TYPES</div>
          <h2 className="section-title">7 Typed Templates</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-12">
          {PROBLEM_TYPES.map(type => (
            <Link key={type} to={`/cases/type/${PROBLEM_TYPE_SLUGS[type]}`} className="btn-ghost text-xs">
              {type}
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="mb-12">
          <div className="section-label mb-2">VERIFICATION ENGINE</div>
          <h2 className="section-title">Three Layers of Quality Control</h2>
        </div>

        <div className="space-y-6 relative stagger-children">
          <div className="hidden md:block absolute left-[40px] top-12 bottom-12 w-0.5 bg-slate-800 z-0" />

          {[
            { layer: '01', icon: Shield, title: 'Structural Validation', text: 'Completeness checks, word counts per section, and numeric sanity before entering the review queue.', iconClass: 'text-emerald-400', boxClass: 'bg-emerald-500/10 border-emerald-500/30', labelClass: 'text-emerald-400' },
            { layer: '02', icon: Users, title: 'Peer Consensus', text: 'Three reviewers score against a fixed 5-dimension rubric. Verified reviewers carry 1.5x weight.', iconClass: 'text-cyan-400', boxClass: 'bg-cyan-500/10 border-cyan-500/30', labelClass: 'text-cyan-400' },
            { layer: '03', icon: Gavel, title: 'Arbiter Override', text: 'Expert intervention when scores diverge. Arbiter reviews carry 4x weight and are final.', iconClass: 'text-violet-400', boxClass: 'bg-violet-500/10 border-violet-500/30', labelClass: 'text-violet-400' },
          ].map(({ layer, icon: Icon, title, text, iconClass, boxClass, labelClass }) => (
            <div key={layer} className="glass-card p-8 flex flex-col md:flex-row gap-8 items-start relative z-10">
              <div className={`flex-shrink-0 w-20 h-20 rounded-2xl border flex items-center justify-center ${boxClass}`}>
                <Icon className={`w-10 h-10 ${iconClass}`} />
              </div>
              <div>
                <div className={`text-xs font-mono font-bold mb-2 tracking-widest ${labelClass}`}>LAYER {layer}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <p className="text-slate-300 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="mb-12">
          <div className="section-label mb-2">SCORING FRAMEWORK</div>
          <h2 className="section-title">Five Dimensions of Quality</h2>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-1/4">Dimension</th>
                <th className="w-1/6 text-center">Weight</th>
                <th className="w-7/12">What It Measures</th>
              </tr>
            </thead>
            <tbody>
              {RUBRIC_DIMENSIONS.map((dim) => (
                <tr key={dim.key}>
                  <td className="font-bold text-white">{dim.label}</td>
                  <td className="text-center">
                    <span className="inline-block px-2 py-1 bg-slate-800 text-emerald-400 font-mono text-xs font-bold rounded">
                      {dim.weightLabel}
                    </span>
                  </td>
                  <td className="text-slate-300 text-sm">{dim.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="py-12">
        <div className="mb-12">
          <div className="section-label mb-2">CREDIBILITY TIERS</div>
          <h2 className="section-title">Analyst → Partner</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {CREDIBILITY_TIER_THRESHOLDS.map(({ tier, min, max }) => (
            <div key={tier} className="glass-card p-4 text-center">
              <TierBadge tier={tier} />
              <div className="text-xs text-slate-500 font-mono mt-2">
                {min.toLocaleString()}{max === Infinity ? '+' : `–${max.toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <div className="section-label mb-2">REVIEWER ARCHITECTURE</div>
          <h2 className="section-title">Three Tiers of Authority</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { tier: 'General' as const, title: 'General Reviewer', req: 'Sign up', weight: '1.0x', desc: 'Every user starts here. Complete 2 reviews per case to unlock submission.' },
            { tier: 'Verified' as const, title: 'Verified Reviewer', req: '30+ reviews, 3.8+ rating', weight: '1.5x', desc: 'Earned through demonstrated track record. Quality backbone of the platform.', highlight: true },
            { tier: 'Arbiter' as const, title: 'Arbiter', req: 'Invitation only', weight: '4.0x', desc: 'Recruited experts. Resolve disputes with final authority.', violet: true },
          ].map(({ tier, title, req, weight, desc, highlight, violet }) => (
            <div key={tier} className={`glass-card p-6 flex flex-col h-full relative overflow-hidden ${highlight ? 'border-emerald-500/30' : ''}`}>
              {highlight && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
              {violet && <div className="absolute top-0 left-0 w-full h-1 bg-violet-500" />}
              <div className="mb-6"><ReviewerBadge tier={tier} /></div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 mb-6 flex-grow">{desc}</p>
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Requirements</span>
                  <span className="text-xs text-slate-300">{req}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Score Weight</span>
                  <span className={`text-sm font-mono font-bold ${violet ? 'text-violet-400' : highlight ? 'text-emerald-400' : 'text-white'}`}>{weight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="glass-card p-8 mb-8 text-center bg-slate-900/80">
          <h3 className="text-xl font-bold text-white mb-4">Credibility Score Formula</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-2xl md:text-3xl font-black font-mono">
            <span className="text-emerald-400">70% × SOLVE</span>
            <span className="text-slate-600">+</span>
            <span className="text-cyan-400">30% × REVIEW</span>
          </div>
        </div>

        <div className="glass-card p-8 glass-card-glow-gold border-amber-500/30 bg-amber-950/10">
          <div className="flex items-start md:items-center gap-6 flex-col md:flex-row">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Diamond className="w-8 h-8 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">The Merge Bonus</h3>
              <p className="text-slate-300 text-sm">
                When a company formally selects your solution, you receive a Merge Bonus — displayed
                separately on your profile and certificate. The strongest credibility signal on the platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};
