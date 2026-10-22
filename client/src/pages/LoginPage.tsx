import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Zap, GitPullRequest } from 'lucide-react';
import { CrackedQuestionMark } from '../components/CrackedQuestionMark';
import { Button } from '../components/Button';
import { Section } from '../components/Section';
import { Container } from '../components/Container';
import { Card } from '../components/Card';

const steps = [
  {
    number: '01',
    title: 'Review 2 submissions',
    copy: 'Complete peer reviews on any case before you can submit your own solution to that case.',
  },
  {
    number: '02',
    title: 'Submit a typed solution',
    copy: 'Each problem type has mandatory sections — Market Sizing, Profitability, M&A, and more.',
  },
  {
    number: '03',
    title: 'Earn credibility',
    copy: 'Five-dimension rubric scoring. Merge bonuses when companies select your solution.',
  },
];

const tracks = [
  {
    title: 'Open Arena',
    desc: 'Jump straight into open case prompts. No review gate needed to submit.',
    icon: Trophy,
    color: '#10B981',
    slug: '/arena',
  },
  {
    title: 'Community Questions',
    desc: 'Crowdsourced consulting queries and brainteasers. The poster reviews and accepts the best answer.',
    icon: GitPullRequest,
    color: '#8B5CF6',
    slug: '/questions',
  },
  {
    title: 'Curated Cases',
    desc: 'Rigorous corporate briefs. Complete 2 peer reviews to unlock submissions and earn merge bonuses.',
    icon: Zap,
    color: '#F59E0B',
    slug: '/cases',
  },
];

const tiers = [
  {
    name: 'Analyst',
    description: 'Entry-level contributors',
    score: '0–1,000 pts',
    features: ['Solve up to 5 cases', 'Earn peer reviews', 'Basic profile visibility'],
    popular: false,
  },
  {
    name: 'Consultant',
    description: 'Proven case solvers',
    score: '1,000–5,000 pts',
    features: ['Unlimited submissions', 'Advanced rubric access', 'Priority review queue', 'Featured profiles'],
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
    <div className='min-h-screen flex flex-col bg-[#0B0B0F]'>
      <Section className='pt-20 pb-16 md:pb-24'>
        <Container>
          <div className='grid md:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-16 items-center'>
            <div className='max-w-[66ch]'>
              <div className='section-label mb-3'>The consulting arena</div>
              <h1 className='mb-6 text-[clamp(3.4rem,7vw,7rem)] leading-[0.9] tracking-[-0.06em]'>Peer-reviewed<br />consulting arena</h1>
              <p className='mb-8 max-w-xl text-base md:text-lg text-slate-300 leading-relaxed'>
                Solve real business cases, get scored by peers, and build proof-of-work credibility hiring managers trust.
              </p>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button variant='primary' size='lg' onClick={handleGetStarted} className='w-full sm:w-auto shadow-[0_14px_30px_rgba(255,76,37,0.28)]'>
                  Solve your first case free
                </Button>
                <a href='/how-it-works' className='inline-flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors'>
                  See how it works
                </a>
              </div>
            </div>

            <div className='flex justify-center md:justify-end'>
              <div className='relative'>
                <div className='absolute inset-6 rounded-full bg-[#FF4C25]/10 blur-[90px]' />
                <CrackedQuestionMark className='relative w-[260px] h-[260px] md:w-[320px] md:h-[320px] opacity-95' />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8'>
        <Container>
          <div className='flex flex-col md:flex-row gap-8 md:items-end'>
            <div className='flex-shrink-0 md:max-w-[28rem]'>
              <div className='section-label mb-3'>Who it’s for</div>
              <h2 className='mb-0'>Four paths to credibility</h2>
            </div>
            <div className='grid md:grid-cols-4 gap-4 flex-1'>
              {[
                { title: 'Aspiring consultants', copy: 'Build verified case scores before your first interview.' },
                { title: 'Career switchers', copy: 'Prove consulting thinking with peer-reviewed work.' },
                { title: 'MBA candidates', copy: 'Practice cases with real rubric feedback, not just peers.' },
                { title: 'Hiring managers', copy: 'See verifiable proof of work on every candidate profile.' },
              ].map((audience, i) => (
                <Card key={i} className='flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.01]'>
                  <h3 className='text-lg font-semibold text-white'>{audience.title}</h3>
                  <p className='text-sm leading-relaxed text-slate-400'>{audience.copy}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8'>
        <Container>
          <div className='section-label mb-3'>How it works</div>
          <h2 className='mb-10'>Three steps, one gate</h2>
          <div className='grid md:grid-cols-3 gap-6'>
            {steps.map((step, i) => (
              <Card key={i} className='flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.01] p-6'>
                <div className='flex items-center gap-3'>
                  <span className='w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-xs font-mono font-bold text-white'>
                    {step.number}
                  </span>
                  <h3 className='text-xl font-semibold text-white'>{step.title}</h3>
                </div>
                <p className='text-slate-400 leading-relaxed'>{step.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8'>
        <Container>
          <div className='section-label mb-3'>Tracks</div>
          <h2 className='mb-10'>Choose your track</h2>
          <div className='grid md:grid-cols-3 gap-6'>
            {tracks.map((track, i) => (
              <Card key={i} className='flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.01] p-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ backgroundColor: track.color + '20' }}>
                    <track.icon className='w-5 h-5' style={{ color: track.color, strokeWidth: 1.8 }} />
                  </div>
                  <h3 className='text-2xl font-semibold text-white'>{track.title}</h3>
                </div>
                <p className='text-slate-400 leading-relaxed'>{track.desc}</p>
                <a href={track.slug} className='mt-auto inline-flex items-center text-sm font-medium text-white hover:text-[#FF4C25] transition-colors'>
                  Explore {track.title}
                </a>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8'>
        <Container>
          <div className='section-label mb-3'>Credibility tiers</div>
          <h2 className='mb-10'>Progress from Analyst to Partner</h2>
          <div className='grid md:grid-cols-3 gap-6'>
            {tiers.map((tier, i) => (
              <Card key={i} className={`flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.01] p-6 relative ${tier.popular ? 'ring-1 ring-white/15' : ''}`}>
                {tier.popular && (
                  <span className='absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF4C25] bg-[#0B0B0F] px-3 py-1 rounded-full border border-[#FF4C25]/30'>
                    Most common
                  </span>
                )}
                <h3 className='text-2xl font-semibold text-white'>{tier.name}</h3>
                <p className='text-sm text-slate-400'>{tier.description}</p>
                <div className='text-sm font-mono font-bold text-[#FF4C25]'>{tier.score}</div>
                <ul className='space-y-2 mb-2 text-sm text-slate-400'>
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className='flex items-start gap-2'>
                      <span className='mt-1 text-[#FF4C25]'>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={tier.popular ? 'primary' : 'secondary'} size='md' className='mt-auto w-full'>
                  Start as {tier.name}
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8 py-20 md:py-28'>
        <Container>
          <h2 className='mb-6 text-center'>Ready to find out if you&apos;re Cracked?</h2>
          <div className='text-center'>
            <Button variant='primary' size='lg' onClick={handleGetStarted}>Solve your first case free</Button>
          </div>
        </Container>
      </Section>
    </div>
  );
};
