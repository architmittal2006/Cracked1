import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
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
import { useMagnetic } from '../hooks/useMagnetic';
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
  const magneticFinal = useMagnetic<HTMLAnchorElement>(0.3);
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
        </div>

        <div className="page-container poster-content">
          <div className="presented-strip">
            <span>Open source</span>
            <span>Case competitions</span>
          </div>

          <div className="poster-mark" aria-hidden="true">
            <div className="mark-ring">
              <span className="text-3xl md:text-5xl font-black">?</span>
            </div>
            <div className="mark-copy">
              <span>are you</span>
              <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-24 w-auto" />
            </div>
          </div>

          <h1 className="poster-title">
            <span>Peer-Reviewed</span>
            <strong>Consulting Arena</strong>
          </h1>

          <p className="poster-kicker">
            Solve real business cases. Get scored by peers. Build proof-of-work credibility
            that hiring managers actually trust.
          </p>

          <ScrollTextCycle />

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


          <div className="track-strip">
            {tracks.map(({ title, meta, icon: Icon, color, bgColor, borderColor, weight }, i) => (
              <Reveal key={title} delay={i * 100} variant="up">
                <div className="track-chip" style={{ background: bgColor, border: `0.5px solid ${borderColor}` }}>
                  <Icon style={{ color }} className="w-5 h-5" />
                  <div>
                    <strong style={{ color }}>{title}</strong>
                    <span>{meta}</span>
                    <span style={{ color, fontWeight: 500, marginTop: 2 }}>{weight}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
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

      <Reveal variant="scale">
        <section className="page-container final-poster">
          <Sparkles className="w-10 h-10" />
          <div>
            <h2>Ready to find out if you&apos;re <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-20 w-auto inline" />?</h2>
            <p>Start with one case. Let the review system make your work visible.</p>
          </div>
          <Link to="/register" className="poster-btn poster-btn-primary btn-magnetic" {...magneticFinal}>
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </Reveal>
    </div>
  );
};
