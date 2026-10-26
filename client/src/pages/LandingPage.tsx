import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CircleHelp,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Section } from '../components/Section';
import { Container } from '../components/Container';
import { Card } from '../components/Card';

const reviewDimensions = [
  'Problem framing',
  'Framework fit',
  'Data integrity',
  'Insight depth',
  'Feasibility',
];

const steps = [
  {
    number: '01',
    title: 'Choose a challenge',
    copy: 'Explore curated cases, community questions, or open practice.',
  },
  {
    number: '02',
    title: 'Show your reasoning',
    copy: 'Build a structured response that makes your approach clear.',
  },
  {
    number: '03',
    title: 'Compare different approaches',
    copy: 'After you submit, read other learners’ solutions and see how their reasoning differs.',
  },
];

const tracks = [
  {
    title: 'Curated cases',
    description: 'Work through structured business cases and compare different ways to solve them.',
    detail: 'Submit first, then explore other solutions',
    icon: ShieldCheck,
    color: 'text-amber-400',
    iconBackground: 'bg-amber-400/10',
    href: '/cases',
  },
  {
    title: 'Community questions',
    description: 'Ask a focused question, share an answer, and learn from other approaches.',
    detail: 'Learn with the community',
    icon: CircleHelp,
    color: 'text-violet-400',
    iconBackground: 'bg-violet-400/10',
    href: '/questions',
  },
  {
    title: 'Open arena',
    description: 'Practice solving without a review gate and build confidence through repetition.',
    detail: 'Practice at your own pace',
    icon: Trophy,
    color: 'text-emerald-400',
    iconBackground: 'bg-emerald-400/10',
    href: '/arena',
  },
];

const futureDirections = [
  {
    title: 'AI as a thinking partner',
    copy: 'Explore answer checks and follow-up questions that probe the reasoning behind a solution.',
    icon: BrainCircuit,
  },
  {
    title: 'Practice in the curriculum',
    copy: 'Make structured case work a useful part of how students learn and demonstrate their thinking.',
    icon: GraduationCap,
  },
  {
    title: 'Learn from practitioners',
    copy: 'Create room for expert-led lessons and cases across more fields and industries.',
    icon: BookOpen,
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(isAuthenticated ? '/cases' : '/login');
  };

  return (
    <div className="landing-editorial min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <Section noContainer className="pt-16 pb-16 md:pt-24 md:pb-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-20">
            <div className="max-w-2xl">
              <h1 className="max-w-[13ch] font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
                Make your problem-solving visible.
              </h1>
              <p className="mt-6 max-w-[58ch] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Practice real-world cases, explain how you think, and compare your approach with other learners.
                Build a record of work that grows with you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button variant="primary" size="lg" onClick={handleGetStarted}>
                  Explore case practice <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  How it works
                </a>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Practice, contribute, and make your reasoning easier to see.
              </p>
            </div>

            <Card className="relative mx-auto w-full max-w-xl p-6 sm:p-8" padding="p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-medium text-slate-300">A shared review framework</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Good thinking, made visible
                  </h2>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
                  <BriefcaseBusiness className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Case reviews use five dimensions to focus feedback on the work—not just the final answer.
              </p>
              <ul className="mt-5 divide-y divide-white/[0.07]">
                {reviewDimensions.map((dimension) => (
                  <li key={dimension} className="flex items-center gap-3 py-3 text-sm text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" aria-hidden="true" />
                    {dimension}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </Section>

      <Section noContainer id="how-it-works" className="border-t border-white/[0.08]">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-4xl">
              Practice is stronger when it is structured.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Work through a clear process, see how others approach a problem, and improve with specific feedback.
            </p>
          </div>
          <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="border-t border-white/15 pt-5">
                <span className="text-xs font-semibold tracking-[0.12em] text-orange-300">{step.number}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.copy}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section noContainer className="border-t border-white/[0.08]">
        <Container>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-4xl">
                Choose how you want to practice.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Three ways to work on problems, contribute your perspective, and learn.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <Card key={track.title} className="flex min-h-[250px] flex-col p-6" padding="p-6">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${track.iconBackground} ${track.color}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-300">{track.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="text-xs leading-5 text-slate-400">{track.detail}</span>
                    <a
                      href={track.href}
                      aria-label={`Explore ${track.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section noContainer className="border-t border-white/[0.08]">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <h2 className="font-serif text-3xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-4xl">
                A bigger idea, built one step at a time.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
                The long-term ambition is to make problem-solving practice more useful to learners, educators, and
                organizations—without confusing future plans for what is available today.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                <Sparkles className="h-4 w-4 text-orange-300" strokeWidth={1.75} aria-hidden="true" />
                Future directions, not current features
              </p>
            </div>
            <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {futureDirections.map((direction) => {
                const Icon = direction.icon;
                return (
                  <li key={direction.title} className="flex gap-4 py-5 sm:gap-5">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{direction.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-400">{direction.copy}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Container>
      </Section>

      <Section noContainer className="border-t border-white/[0.08] pb-20 text-center md:pb-24">
        <Container>
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-4xl">
            Start with a problem worth solving.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            Choose a case, put your reasoning into words, and learn through the review process.
          </p>
          <Button variant="primary" size="lg" onClick={handleGetStarted} className="mt-8">
            Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Container>
      </Section>
    </div>
  );
};

export default LandingPage;
