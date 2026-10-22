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
    <div className='min-h-screen flex flex-col'>
      <Section className='pt-20 pb-32 md:pb-48'>
        <Container>
          <div className='grid md:grid-cols-2 gap-12 md:gap-16 items-center'>
            <div className='max-w-[65ch]'>
              <div className='section-label mb-3'>The consulting arena</div>
              <h1 className='mb-6'>Peer-reviewed consulting arena</h1>
              <p className='mb-8 text-lg leading-relaxed text-slate-300'>
                Solve real business cases, get scored by peers, and build proof-of-work credibility hiring managers trust.
              </p>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button variant='primary' size='lg' onClick={handleGetStarted} className='w-full sm:w-auto'>
                  Solve your first case free
                </Button>
                <a href='/how-it-works' className='accent-underline text-sm font-medium transition-colors hover:text-white'>
                  See how it works
                </a>
              </div>
            </div>
            <div className='flex justify-center'>
              <div className='relative'>
                <CrackedQuestionMark className='w-[280px] h-[280px] md:w-[320px] md:h-[320px] opacity-90' />
                <div className='absolute -inset-1 rounded-full bg-[#FF4C25]/10 blur-[80px]' />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8'>
        <Container>
          <div className='flex flex-col gap-8 md:flex-row md:items-center'>
            <div className='flex-shrink-0'>
              <div className='section-label mb-3'>Who it&apos;s for</div>
              <h2 className='mb-6'>Four paths to credibility</h2>
            </div>
            <div className='grid flex-grow gap-6 md:grid-cols-4'>
              {[
                { title: 'Aspiring consultants', copy: 'Build verified case scores before your first interview.' },
                { title: 'Career switchers', copy: 'Prove consulting thinking with peer-reviewed work.' },
                { title: 'MBA candidates', copy: 'Practice cases with real rubric feedback, not just peers.' },
                { title: 'Hiring managers', copy: 'See verifiable proof of work on every candidate profile.' },
              ].map((audience, i) => (
                <Card key={i} className='flex flex-col gap-3'>
                  <h3 className='mb-1 text-base font-semibold text-white'>{audience.title}</h3>
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
          <div className='grid gap-8 md:grid-cols-3'>
            {steps.map((step, i) => (
              <Card key={i} className='flex flex-col gap-4'>
                <div className='flex items-center gap-3'>
                  <span className='flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-sm font-mono font-bold text-white'>
                    {step.number}
                  </span>
                  <h3 className='text-lg font-semibold text-white'>{step.title}</h3>
                </div>
                <p className='leading-relaxed text-slate-400'>{step.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8'>
        <Container>
          <div className='section-label mb-3'>Tracks</div>
          <h2 className='mb-10'>Choose your track</h2>
          <div className='grid gap-8 md:grid-cols-3'>
            {tracks.map((track, i) => (
              <Card key={i} className='flex flex-col gap-4'>
                <div className='mb-2 flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg' style={{ backgroundColor: `${track.color}20` }}>
                    <track.icon className='h-5 w-5' style={{ color: track.color, strokeWidth: 1.75 }} />
                  </div>
                  <h3 className='text-lg font-semibold text-white'>{track.title}</h3>
                </div>
                <p className='mb-6 leading-relaxed text-slate-400'>{track.desc}</p>
                <a href={track.slug} className='text-sm font-medium accent-underline'>
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
          <div className='grid gap-8 md:grid-cols-3'>
            {tiers.map((tier, i) => (
              <Card key={i} className={`relative flex flex-col gap-4 ${tier.popular ? 'border-white/12' : ''}`}>
                {tier.popular && (
                  <span className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF4C25]'>
                    Most common
                  </span>
                )}
                <h3 className='text-lg font-semibold text-white'>{tier.name}</h3>
                <p className='mb-2 text-sm text-slate-400'>{tier.description}</p>
                <div className='mb-6 text-sm font-mono font-bold text-[#FF4C25]'>{tier.score}</div>
                <ul className='mb-6 flex-grow space-y-2'>
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className='flex items-start gap-2 text-sm text-slate-400'>
                      <span className='text-[#FF4C25]/60'>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={tier.popular ? 'primary' : 'secondary'} size='md' className='w-full'>
                  Start as {tier.name}
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className='border-t border-white/8 py-24 text-center md:py-32'>
        <Container>
          <h2 className='mb-6'>Ready to find out if you&apos;re Cracked?</h2>
          <Button variant='primary' size='lg' onClick={handleGetStarted} className='mx-auto'>
            Solve your first case free
          </Button>
        </Container>
      </Section>
    </div>
  );
};

export default LandingPage;
