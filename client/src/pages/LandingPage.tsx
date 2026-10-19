import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { Button } from '../components/Button';
import { CrackedQuestionMark } from '../components/CrackedQuestionMark';
import { ProofStrip } from '../components/ProofStrip';
import { WordSwapSection } from '../components/WordSwapSection';
import { ProductStorySection } from '../components/ProductStorySection';
import { TracksSection } from '../components/sections/TracksSection';
import { TiersSection } from '../components/sections/TiersSection';
import { ManifestoSection } from '../components/sections/ManifestoSection';

const timeline = [
  {
    phase: '01',
    title: 'Review 2 submissions',
    date: 'Unlock gate',
    copy: 'Complete peer reviews on any case before you can submit your own solution to that case.',
  },
  {
    phase: '02',
    title: 'Submit typed solution',
    date: 'Structured templates',
    copy: 'Each problem type has mandatory sections — Market Sizing, Profitability, M&A, and more.',
  },
  {
    phase: '03',
    title: 'Earn credibility',
    date: 'Peer consensus',
    copy: 'Five-dimension rubric scoring. Merge bonuses when companies select your solution.',
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/cases');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-stage">
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-orange-500/20 blur-3xl" />
        </div>
        <div className="page-container grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <h1 className="text-white font-bold" style={{ fontSize: 'clamp(32px,4vw,48px)', lineHeight: 1.1 }}>
              Peer-reviewed consulting arena
            </h1>
            <p className="text-slate-300 mt-4 text-lg max-w-xl">
              Solve real business cases, get scored by peers, and build proof-of-work credibility hiring managers trust.
            </p>
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Proof-of-Review Gate
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono font-semibold">1. Review 2 solutions</span>
                <span className="text-slate-500">→</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold">2. Unlock Case</span>
                <span className="text-slate-500">→</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-semibold">3. Submit & Score</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button variant="primary" size="lg" onClick={handleGetStarted}>Solve your first case free</Button>
              <Button variant="secondary" size="lg" as="a" href="/how-it-works">See how it works</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <CrackedQuestionMark />
          </div>
        </div>
      </section>
      <ProofStrip />
      <TracksSection />
      <WordSwapSection />
      <ProductStorySection />
      <TiersSection />
      <ManifestoSection />

      <section className="page-container py-12 intro-block">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="section-title text-3xl md:text-4xl font-bold text-white mb-4">
              What is <span className="text-brand">Cracked?</span>
            </h2>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              An open-source platform for case prep and consulting competitions. Instead of static resumes,
              contributors prove judgment by solving live business problems and reviewing each other
              against a transparent five-dimension rubric.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal delay={0} variant="up">
            <div className="glass-card p-6 h-full flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-8 h-8 text-brand mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Proof-of-Review Gate</h3>
                <p className="text-sm text-slate-300">Complete 2 peer reviews on a case before you can submit your own solution to it.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} variant="up">
            <div className="glass-card p-6 h-full flex flex-col justify-between">
              <div>
                <Users className="w-8 h-8 text-brand mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Peer Consensus</h3>
                <p className="text-sm text-slate-300">Every submission scored across framing, framework, data, insight, and feasibility.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={200} variant="up">
            <div className="glass-card p-6 h-full flex flex-col justify-between">
              <div>
                <Scale className="w-8 h-8 text-brand mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Live Credibility</h3>
                <p className="text-sm text-slate-300">Analyst to Partner tiers. Shareable certificates with cryptographic verification hashes.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12 border-t border-b border-white/10 bg-slate-900/30">
        <div className="page-container">
          <Reveal variant="up">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">How You Compete</h2>
              <p className="text-slate-400 text-sm">Three simple steps to build verified proof of work.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {timeline.map((item, i) => (
              <Reveal key={item.phase} delay={i * 120} variant="up">
                <article className="glass-card p-6 relative h-full">
                  <div className="text-4xl font-mono font-black text-white/15 mb-4">{item.phase}</div>
                  <div className="text-brand text-xs font-bold uppercase tracking-wider mb-1">{item.date}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-300">{item.copy}</p>
                  <CheckCircle2 className="w-5 h-5 text-brand/40 absolute top-6 right-6" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal variant="scale">
        <section className="page-container py-12 my-6">
          <div className="glass-card p-8 md:p-12 border border-brand/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-brand text-xs uppercase font-bold tracking-widest mb-2">
                <Sparkles className="w-4 h-4" /> Ready to Prove Your Thinking?
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Find out if you&apos;re Cracked</h2>
              <p className="text-slate-300 text-sm md:text-base">Start with one case. Let the peer review system make your consulting judgment visible.</p>
            </div>
            <Button variant="primary" size="lg" onClick={handleGetStarted} className="min-w-[220px]">
              Explore the Arena
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </Reveal>
    </div>
  );
};
