import React from 'react';
import { ArrowUpRight, FileText } from 'lucide-react';
import type { Case } from '../data/mockData';

interface CaseCardProps {
  caseData: Case;
  track?: 'open_arena' | 'community_question' | 'curated_case';
}

const difficultyClasses: Record<string, string> = {
  Standard: 'border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] text-[var(--text-secondary)]',
  High: 'border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] text-[var(--text-secondary)]',
  Chaos: 'border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] text-[var(--text-secondary)]',
};

export const CaseCard: React.FC<CaseCardProps> = ({ caseData }) => {
  const difficultyClass = difficultyClasses[caseData.difficulty] ?? difficultyClasses.Standard;

  return (
    <article className="border-b border-[var(--border-subtle)] py-5 first:border-t">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--accent-primary)]">{caseData.type}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${difficultyClass}`}>
              {caseData.difficulty}
            </span>
          </div>
          <h2 className="text-base font-semibold leading-6 text-[var(--text-primary)]">
            <a className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]" href={`/cases/${caseData.id}`}>
              {caseData.title}
            </a>
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {caseData.sector}{caseData.companyType ? ` · ${caseData.companyType}` : ''}
          </p>
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            {caseData.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              {caseData.submissionCount} {caseData.submissionCount === 1 ? 'submission' : 'submissions'}
            </span>
            <span>Submit a solution and compare approaches</span>
            {caseData.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>

        <a
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border-medium)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:min-w-[120px]"
          href={`/cases/${caseData.id}`}
          aria-label={`Open case: ${caseData.title}`}
        >
          Open case
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
};
