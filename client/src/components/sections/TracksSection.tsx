import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, GitPullRequest, Trophy, ArrowRight } from 'lucide-react';

const tracks = [
  {
    title: 'Open Arena',
    slug: '/arena',
    desc: 'Jump straight into open case prompts. No review gate needed to submit. Solutions are voted and discussed by the community.',
    icon: Trophy,
    color: '#10B981',
    bgBadge: 'rgba(16, 185, 129, 0.15)',
    borderBadge: 'rgba(16, 185, 129, 0.3)',
    weight: '0.5× weight',
    gate: 'Instant access',
    cta: 'Explore Arena',
  },
  {
    title: 'Community Questions',
    slug: '/questions',
    desc: 'Crowdsourced consulting queries and brainteasers. The original poster reviews solutions and accepts the best answer.',
    icon: GitPullRequest,
    color: '#8B5CF6',
    bgBadge: 'rgba(139, 92, 246, 0.15)',
    borderBadge: 'rgba(139, 92, 246, 0.3)',
    weight: '0.8× weight',
    gate: 'Poster accepted',
    cta: 'Browse Questions',
  },
  {
    title: 'Curated Cases',
    slug: '/cases',
    desc: 'Rigorous corporate briefs. Complete 2 peer reviews to unlock submissions, get scored across 5 rubric dimensions, and earn merge bonuses.',
    icon: Zap,
    color: '#F59E0B',
    bgBadge: 'rgba(245, 158, 11, 0.15)',
    borderBadge: 'rgba(245, 158, 11, 0.3)',
    weight: '1.0× full weight',
    gate: '2-review gate',
    cta: 'Solve Cases',
  },
];

export const TracksSection: React.FC = () => (
  <section className="py-12 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="text-xs font-bold text-brand uppercase tracking-widest mb-2">Three Tracks</div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">One Unified Credibility System</h2>
        <p className="text-slate-400 text-sm">Choose the track that fits your schedule and skill level.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {tracks.map((t) => (
          <div
            key={t.title}
            className="glass-card p-6 flex flex-col justify-between h-full hover:border-white/20 transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: t.bgBadge }}
                >
                  <t.icon className="w-5 h-5" style={{ color: t.color, strokeWidth: 2 }} />
                </div>
                <span
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    color: t.color,
                    backgroundColor: t.bgBadge,
                    borderColor: t.borderBadge,
                  }}
                >
                  {t.weight}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
              <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.gate}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">{t.desc}</p>
            </div>

            <Link
              to={t.slug}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:gap-2 duration-200"
              style={{ color: t.color }}
            >
              <span>{t.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);
