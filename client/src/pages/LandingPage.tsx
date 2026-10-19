import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitPullRequest,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Reveal } from '../components/Reveal';
import { ScrollTextCycle } from '../components/ScrollTextCycle';
import { TestimonialsCarousel } from '../components/TestimonialsCarousel';
import { Button } from '../components/Button';
import { PLATFORM_STATS } from '../data/mockData';

const tracks = [
  { 
    title: 'Track 1 — Open Arena', 
    meta: 'No gate · submit immediately · community upvote ranking', 
    icon: Trophy,
    color: '#1D9E75',
    bgColor: '#E1F5EE',
    borderColor: '#0F6E56',
    weight: '0.5× credibility weight'
  },
  { 
    title: 'Track 2 — Community Questions', 
    meta: 'User-posted problems · poster accepts best answer · 2× acceptance bonus', 
    icon: GitPullRequest,
    color: '#D4537E',
    bgColor: '#FBEAF0',
    borderColor: '#993556',
    weight: '0.8× credibility weight'
  },
  { 
    title: 'Track 3 — Curated Cases', 
    meta: '2-review gate · 5-dimension rubric · merge bonus from companies', 
    icon: Zap,
    color: '#7F77DD',
    bgColor: '#EEEDFE',
    borderColor: '#534AB7',
    weight: '1.0× credibility weight'
  },
];

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
      <section className="poster-hero">
        <div className="poster-bg" aria-hidden="true">
          <span className="poly poly-1" />
          <span className="poly poly-2" />
          <span className="poly poly-3" />
          <span className="poly poly-4" />
          <span className="scanline scanline-1" />
          <span className="scanline scanline-2" />
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />
        </div>

        <div className="page-container poster-content">
          <Reveal variant="fade" delay={0}>
            <div className="presented-strip">
              <span>Open source</span>
              <span>Case competitions</span>
            </div>
          </Reveal>

          <Reveal variant="up" delay={100}>
            <div className="poster-mark" aria-hidden="true">
              <div className="mark-ring">
                <span className="text-3xl md:text-5xl font-black">?</span>
              </div>
              <div className="mark-copy">
                <span>are you</span>
                <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-24 w-auto" />
              </div>
            </div>
          </Reveal>

          <Reveal variant="up" delay={200}>
            <h1 className="poster-title">
              <span>Peer-Reviewed</span>
              <strong>Consulting Arena</strong>
            </h1>
          </Reveal>

          <Reveal variant="up" delay={300}>
            <p className="poster-kicker">
              Solve real business cases. Get scored by peers. Build proof-of-work credibility
              that hiring managers actually trust.
            </p>
          </Reveal>

          <Reveal variant="up" delay={400}>
            <div className="poster-statline" aria-label="Platform stats">
              <span>
                <AnimatedCounter target={PLATFORM_STATS.totalCasesSolved} suffix="+" /> cases solved
              </span>
              <span>
                <AnimatedCounter target={PLATFORM_STATS.activeConsultants} suffix="+" /> contributors
              </span>
              <span>
                <AnimatedCounter target={PLATFORM_STATS.mergeBonusesAwarded} suffix="" /> merge bonuses
              </span>
            </div>
          </Reveal>

          <Reveal variant="up" delay={450}>
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live cases updated daily</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Peer-reviewed submissions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Company merge bonuses</span>
              </div>
            </div>
          </Reveal>

          <Reveal variant="up" delay={500}>
            <div className="poster-actions">
              <Button variant="primary" size="lg" onClick={handleGetStarted} className="btn-magnetic group min-w-[260px]">
                Solve your first case free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button variant="secondary" size="lg" as="a" href="/how-it-works" className="min-w-[200px]">
                How It Works
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </Reveal>

          <Reveal variant="up" delay={600}>
            <div className="track-strip">
              {tracks.map(({ title, meta, icon: Icon, color, bgColor, borderColor, weight }) => (
                <div
                  key={title}
                  className="track-chip group"
                  style={{ background: bgColor, border: `0.5px solid ${borderColor}` }}
                >
                  <Icon style={{ color }} className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <strong style={{ color }}>{title}</strong>
                    <span>{meta}</span>
                    <span style={{ color, fontWeight: 500, marginTop: 2 }}>{weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <ScrollTextCycle />

      <section className="page-container intro-block">
        <Reveal variant="up">
          <div className="mega-heading">
            <span>What is</span>
            <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-24 w-auto" />
          </div>
          <p>
            An open-source platform for consultancy and case competitions. Instead of static profiles,
            contributors prove judgment by solving live business problems and reviewing each other
            against a transparent five-dimension rubric.
          </p>
        </Reveal>
        <div className="intro-grid">
          <Reveal delay={0} variant="up">
            <div>
              <ShieldCheck className="w-8 h-8" />
              <h3>Proof-of-Review Gate</h3>
              <p>Complete 2 peer reviews on a case before you can submit your own solution to it.</p>
            </div>
          </Reveal>
          <Reveal delay={100} variant="up">
            <div>
              <Users className="w-8 h-8" />
              <h3>Peer Consensus</h3>
              <p>Every submission scored across framing, framework, data, insight, and feasibility.</p>
            </div>
          </Reveal>
          <Reveal delay={200} variant="up">
            <div>
              <Scale className="w-8 h-8" />
              <h3>Live Credibility</h3>
              <p>Analyst to Partner tiers. Shareable certificates with verification hashes.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="page-container py-24">
        <Reveal variant="up">
          <div className="mega-heading mega-heading-center">
            <span>One path from</span>
            <strong>Cases to Offers</strong>
          </div>
          <p className="text-center max-w-2xl mx-auto text-slate-400 mb-16">
            Every stage of your consulting journey, practiced and scored.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Review Cases',
              description: 'Complete 2 peer reviews to unlock submission gates for any case.',
              icon: ShieldCheck,
            },
            {
              step: '02',
              title: 'Submit Solutions',
              description: 'Solve structured cases with typed templates across problem types.',
              icon: FileText,
            },
            {
              step: '03',
              title: 'Earn Credibility',
              description: 'Build your score through peer consensus and earn tier badges.',
              icon: Trophy,
            },
            {
              step: '04',
              title: 'Get Noticed',
              description: 'Shareable certificates and profiles that hiring managers trust.',
              icon: Sparkles,
            },
          ].map((item, index) => (
            <Reveal key={item.step} delay={index * 100} variant="up">
              <div className="glass-card p-6 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="text-6xl font-black text-slate-800 mb-4 group-hover:text-emerald-500/20 transition-colors">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="page-container py-24 bg-slate-900/30 -mx-6 px-6">
        <Reveal variant="up">
          <div className="text-center mb-12">
            <div className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Trusted by consultants at</div>
            <h2 className="text-2xl font-bold text-white">Top Firms & Schools</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {[
            { name: 'McKinsey', color: 'text-slate-400' },
            { name: 'BCG', color: 'text-slate-400' },
            { name: 'Bain', color: 'text-slate-400' },
            { name: 'Deloitte', color: 'text-slate-400' },
            { name: 'Accenture', color: 'text-slate-400' },
            { name: 'Kearney', color: 'text-slate-400' },
          ].map((firm, index) => (
            <Reveal key={firm.name} delay={index * 50} variant="up">
              <div className="text-center group">
                <div className={`text-lg font-bold ${firm.color} group-hover:text-emerald-400 transition-colors duration-300`}>
                  {firm.name}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" delay={300}>
          <div className="text-center mt-12">
            <div className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Contributors from</div>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                'Harvard',
                'Wharton',
                'INSEAD',
                'Columbia',
                'Chicago Booth',
                'Yale SOM',
              ].map((school, index) => (
                <span
                  key={school}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors duration-300 cursor-default"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {school}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="page-container intro-block">
        <Reveal variant="up">
          <div className="mega-heading">
            <span>What is</span>
            <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-24 w-auto" />
          </div>
          <p>
            An open-source platform for consultancy and case competitions. Instead of static profiles,
            contributors prove judgment by solving live business problems and reviewing each other
            against a transparent five-dimension rubric.
          </p>
        </Reveal>
        <div className="intro-grid">
          <Reveal delay={0} variant="up">
            <div>
              <ShieldCheck className="w-8 h-8" />
              <h3>Proof-of-Review Gate</h3>
              <p>Complete 2 peer reviews on a case before you can submit your own solution to it.</p>
            </div>
          </Reveal>
          <Reveal delay={100} variant="up">
            <div>
              <Users className="w-8 h-8" />
              <h3>Peer Consensus</h3>
              <p>Every submission scored across framing, framework, data, insight, and feasibility.</p>
            </div>
          </Reveal>
          <Reveal delay={200} variant="up">
            <div>
              <Scale className="w-8 h-8" />
              <h3>Live Credibility</h3>
              <p>Analyst to Partner tiers. Shareable certificates with verification hashes.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="page-container py-24">
        <Reveal variant="up">
          <div className="mega-heading mega-heading-center">
            <span>Credibility</span>
            <strong>Tiers</strong>
          </div>
          <p className="text-center max-w-2xl mx-auto text-slate-400 mb-16">
            Progress from Analyst to Partner as you solve cases and earn peer consensus.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Analyst',
              description: 'Entry-level contributors',
              features: [
                'Solve up to 5 cases',
                'Earn peer reviews',
                'Basic profile visibility',
                'Entry-level certificates',
              ],
              color: 'border-slate-700',
              bgColor: 'bg-slate-900/50',
            },
            {
              name: 'Consultant',
              description: 'Proven case solvers',
              features: [
                'Unlimited case submissions',
                'Advanced rubric access',
                'Priority review queue',
                'Featured profiles',
              ],
              color: 'border-emerald-500/30',
              bgColor: 'bg-emerald-500/5',
              popular: true,
            },
            {
              name: 'Partner',
              description: 'Top-tier experts',
              features: [
                'Curated case access',
                'Company merge bonuses',
                'Mentorship privileges',
                'Verified expert badge',
              ],
              color: 'border-amber-500/30',
              bgColor: 'bg-amber-500/5',
            },
          ].map((tier, index) => (
            <Reveal key={tier.name} delay={index * 100} variant="up">
              <div
                className={`glass-card p-8 ${tier.color} ${tier.bgColor} transition-all duration-300 hover:scale-105 ${
                  tier.popular ? 'shadow-[0_0_30px_rgba(16,185,129,0.2)]' : ''
                }`}
              >
                {tier.popular && (
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{tier.description}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="primary"
                  size="md"
                  as="a"
                  href="/register"
                  className={`w-full justify-center ${
                    tier.popular ? 'shadow-[0_0_20px_rgba(255,76,37,0.4)]' : ''
                  }`}
                >
                  Start as {tier.name}: free
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="process-band">
        <div className="page-container">
          <div className="mega-heading mega-heading-center">
            <span>How you</span>
            <strong>Compete</strong>
          </div>
          <div className="timeline-grid">
            {timeline.map((item, i) => (
              <Reveal key={item.phase} delay={i * 120} variant="up">
                <article className="timeline-panel">
                  <div className="timeline-num">{item.phase}</div>
                  <p className="timeline-date">{item.date}</p>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <CheckCircle2 className="timeline-icon" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-24">
        <Reveal variant="up">
          <div className="mega-heading mega-heading-center">
            <span>Success</span>
            <strong>Stories</strong>
          </div>
          <p className="text-center max-w-2xl mx-auto text-slate-400 mb-16">
            Hear from consultants who landed their dream offers through Cracked?
          </p>
        </Reveal>

        <Reveal variant="up" delay={100}>
          <TestimonialsCarousel />
        </Reveal>
      </section>

      <Reveal variant="scale">
        <section className="page-container final-poster">
          <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
          <div>
            <h2>Ready to find out if you&apos;re <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-20 w-auto inline" />?</h2>
            <p>Start with one case. Let the review system make your work visible.</p>
          </div>
          <Button variant="primary" size="lg" onClick={handleGetStarted} className="btn-magnetic group min-w-[260px]">
            Explore the Arena
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </section>
      </Reveal>
    </div>
  );
};
