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
    number: '1',
    title: 'Review 2 answers before you can submit your own',
    copy: 'This ensures quality through peer evaluation.',
  },
  {
    number: '2',
    title: 'Submit your answer using our structured template',
    copy: 'Reviewers score it on 5 dimensions.',
  },
  {
    number: '3',
    title: 'Earn credibility points with every case you solve',
    copy: 'Higher levels unlock more features.',
  },
];

const tracks = [
  {
    title: 'Practice',
    desc: 'Rigorous business cases. Complete 2 reviews to unlock your answer. Earn merge bonuses when companies select your solution.',
    icon: Zap,
    color: '#C75B39',
    slug: '/cases',
  },
  {
    title: 'Questions',
    desc: 'Crowdsourced consulting questions. Post a question, get answers from the community, and accept the best one.',
    icon: GitPullRequest,
    color: '#3B82F6',
    slug: '/questions',
  },
  {
    title: 'Open Arena',
    desc: 'Jump straight into solving. No review gate. Practice freely and build your skills.',
    icon: Trophy,
    color: '#10B981',
    slug: '/arena',
  },
];

const tiers = [
  {
    name: 'Analyst',
    description: 'New to the platform',
    score: '0–1,000 points',
    features: ['Solve up to 5 cases', 'Earn reviews', 'Build your profile'],
    popular: false,
  },
  {
    name: 'Consultant',
    description: 'Proven solver',
    score: '1,000–5,000 points',
    features: ['Unlimited submissions', 'Priority review queue', 'Featured profile visibility'],
    popular: true,
  },
  {
    name: 'Partner',
    description: 'Top contributor',
    score: '5,000+ points',
    features: ['Access exclusive cases', 'Earn company merge bonuses', 'Get verified expert badge'],
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
    <div className='min-h-screen flex flex-col bg-[#0A0A0A]'>
      <section aria-label="Hero">
      <Section className='pt-24 pb-20 md:pb-32'>
        <Container>
          <div className='grid md:grid-cols-2 gap-12 md:gap-16 items-center'>
            <div className='max-w-[65ch]'>
              <h1 className='mb-6 text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight text-white'>
                Everything you need to earn your consulting offer
              </h1>
              <p className='mb-8 text-lg md:text-xl leading-relaxed text-slate-300'>
                Practice with real business problems, get peer-reviewed on standardized rubrics, and build a verifiable credibility score.
              </p>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button variant='primary' size='lg' onClick={handleGetStarted} className='w-full sm:w-auto'>
                  Practice a case
                </Button>
                <a href='/how-it-works' className='text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 py-3 px-6'>
                  How it works
                </a>
              </div>
            </div>
            <div className='flex justify-center'>
              <div className='relative'>
                <CrackedQuestionMark className='w-[280px] h-[280px] md:w-[360px] md:h-[360px] opacity-90' />
              </div>
            </div>
          </div>
        </Container>
      </Section>
      </section>

      <section aria-label="Target audience">
      <Section className='border-t border-white/8'>
        <Container>
          <div className='text-center mb-10'>
            <div className='section-label mb-3'>Who it&apos;s for</div>
            <h2 className='text-2xl md:text-3xl font-semibold text-white mb-3'>Four paths to credibility</h2>
          </div>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {[
              { title: 'Aspiring consultants', copy: 'Build verified case scores before your first interview.' },
              { title: 'Career switchers', copy: 'Prove consulting thinking with peer-reviewed work.' },
              { title: 'MBA candidates', copy: 'Practice cases with real rubric feedback, not just peers.' },
              { title: 'Hiring managers', copy: 'See verifiable proof of work on every candidate profile.' },
            ].map((audience, i) => (
              <Card key={i} className='flex flex-col gap-3 min-w-0'>
                <h3 className='mb-1 text-base font-semibold text-white break-words'>{audience.title}</h3>
                <p className='text-sm leading-relaxed text-slate-300 break-words'>{audience.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
      </section>

      <section aria-label="How it works">
      <Section className='border-t border-white/8'>
        <Container>
          <div className='text-center mb-10'>
            <h2 className='text-2xl md:text-3xl font-semibold text-white mb-3'>How it works</h2>
            <p className='text-slate-300 max-w-2xl mx-auto'>Review 2 peer answers before submitting your own. Build credibility with every case you solve.</p>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {steps.map((step, i) => (
              <Card key={i} className='flex flex-col gap-4'>
                <div className='flex items-center gap-3'>
                  <span className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-sm font-mono font-bold text-orange-400 border border-orange-500/20'>
                    {step.number}
                  </span>
                  <h3 className='text-lg font-semibold text-white'>{step.title}</h3>
                </div>
                <p className='leading-relaxed text-slate-300'>{step.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
      </section>

      <section aria-label="Tracks">
      <Section className='border-t border-white/8'>
        <Container>
          <div className='text-center mb-10'>
            <h2 className='text-2xl md:text-3xl font-semibold text-white mb-3'>Choose your track</h2>
            <p className='text-slate-300 max-w-2xl mx-auto'>Three ways to practice and build credibility</p>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {tracks.map((track, i) => (
              <Card key={i} className='flex flex-col gap-4 relative overflow-hidden'>
                <div className='absolute top-0 left-0 right-0 h-1' style={{ backgroundColor: track.color }} />
                <div className='mb-2 flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg' style={{ backgroundColor: `${track.color}20` }}>
                    <track.icon className='h-5 w-5' style={{ color: track.color, strokeWidth: 1.75 }} />
                  </div>
                  <h3 className='text-lg font-semibold text-white'>{track.title}</h3>
                </div>
                <p className='mb-6 leading-relaxed text-slate-300'>{track.desc}</p>
                <a href={track.slug} className='text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors'>
                  Explore {track.title} →
                </a>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
      </section>

      <section aria-label="Credibility tiers">
      <Section className='border-t border-white/8'>
        <Container>
          <div className='text-center mb-10'>
            <h2 className='text-2xl md:text-3xl font-semibold text-white mb-3'>Credibility levels</h2>
            <p className='text-slate-300 max-w-2xl mx-auto'>Earn points with every case you solve</p>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {tiers.map((tier, i) => (
              <Card key={i} className={`relative flex flex-col gap-4 ${tier.popular ? 'border-orange-500/30' : ''}`}>
                {tier.popular && (
                  <span className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-400'>
                    Most common
                  </span>
                )}
                <h3 className='text-lg font-semibold text-white'>{tier.name}</h3>
                <p className='mb-2 text-sm text-slate-300'>{tier.description}</p>
                <div className='mb-6 text-sm font-mono font-bold text-orange-400'>{tier.score}</div>
                <ul className='mb-6 flex-grow space-y-2'>
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className='flex items-start gap-2 text-sm text-slate-300'>
                      <span className='text-orange-400/60'>•</span>
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
      </section>

      <section aria-label="Call to action">
      <Section className='border-t border-white/8 py-20 md:py-24 text-center'>
        <Container>
          <h2 className='mb-6 text-2xl md:text-3xl font-semibold text-white'>Ready to start practicing?</h2>
          <p className='mb-8 text-slate-300 max-w-xl mx-auto'>Join thousands of consultants building verifiable credibility</p>
          <Button variant='primary' size='lg' onClick={handleGetStarted} className='mx-auto'>
            Practice a case
          </Button>
        </Container>
      </Section>
      </section>
    </div>
  );
};

export default LandingPage;
