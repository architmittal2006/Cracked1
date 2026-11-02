import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Eye, FilePlus2 } from 'lucide-react';
import { PROBLEM_TYPES, PROBLEM_TYPE_SLUGS } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';

export const HowItWorksPage: React.FC = () => {
  return (
    <PageWrapper>
      <header className="max-w-3xl py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">How case practice works</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
          Work through a case in your own way, submit your reasoning, then compare it with other learners’ approaches.
        </p>
      </header>

      <section className="grid gap-8 border-y border-[var(--border-subtle)] py-8 md:grid-cols-3">
        {[
          {
            icon: ClipboardCheck,
            title: 'Choose a case',
            description: 'Browse structured business problems by type, sector, or difficulty.',
          },
          {
            icon: FilePlus2,
            title: 'Submit your approach',
            description: 'Write your own structured solution. Complete the required sections and submit whenever you are ready.',
          },
          {
            icon: Eye,
            title: 'Compare solutions',
            description: 'After submitting, read other learners’ approaches. Case contributors can view the solutions to their published cases.',
          },
        ].map(({ icon: Icon, title, description }, index) => (
          <article key={title} className="min-w-0">
            <div className="mb-4 flex items-center gap-3 text-[var(--text-secondary)]">
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span className="text-sm tabular-nums">0{index + 1}</span>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          </article>
        ))}
      </section>

      <section className="border-b border-[var(--border-subtle)] py-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Read, then practice</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Casebooks are reading material, separate from scored cases. Read an attributed summary, then use a similar practice case to work through your own approach.
        </p>
        <Link to="/casebooks" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] underline underline-offset-4">
          Browse casebooks <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      <section className="py-12">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Choose a problem type</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Each type has its own structured response template.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROBLEM_TYPES.map(type => (
            <Link key={type} to={`/cases/type/${PROBLEM_TYPE_SLUGS[type]}`} className="btn-ghost text-xs">
              {type}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border-subtle)] py-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Contribute a case</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Share an original case brief for the community. A moderator reviews proposals before they appear in the library.
        </p>
        <Link to="/contribute/cases" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] underline underline-offset-4">
          Propose a case <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </PageWrapper>
  );
};
