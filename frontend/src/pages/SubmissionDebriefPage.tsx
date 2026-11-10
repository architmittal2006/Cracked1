import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Lightbulb, Target } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Case } from '../data/mockData';
import { formatSubmissionSection, submissionSectionLabel } from '../data/mockData';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getCaseById, getSubmissionDebrief } from '../services/api';
import type { SubmissionDebrief } from '../services/api';

const REFLECTION_PROMPTS = [
  'Which section of your answer are you least confident about, and why?',
  'What is the single biggest difference between your approach and the reference solution?',
  'What assumption did you make that the reference approach handles differently?',
  'What would you do differently with another five minutes?',
];

interface ParsedEstimate {
  value: number;
  unit: string;
  low: number;
  high: number;
}

const parseEstimate = (raw: string | undefined): ParsedEstimate | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const e = parsed as Record<string, unknown>;
    const value = Number(e.value);
    const low = Number(e.low);
    const high = Number(e.high);
    if (!Number.isFinite(value) || !Number.isFinite(low) || !Number.isFinite(high)) return null;
    if (typeof e.unit !== 'string' || !e.unit.trim()) return null;
    return { value, unit: e.unit.trim(), low, high };
  } catch {
    return null;
  }
};

export const SubmissionDebriefPage: React.FC = () => {
  const { id, submissionId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [debrief, setDebrief] = useState<SubmissionDebrief | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !submissionId) {
      setLoadError('Submission not found');
      setIsLoading(false);
      return;
    }
    let isCurrent = true;

    const load = async () => {
      try {
        const result = await getSubmissionDebrief(id, submissionId);
        if (!isCurrent) return;
        setDebrief(result);
        // Case metadata is best-effort: the debrief remains useful even if the
        // case was unpublished after the attempt.
        try {
          const loadedCase = await getCaseById(id);
          if (isCurrent && loadedCase) setCaseData(loadedCase);
        } catch {
          // ignore — debrief does not depend on the case still being listed
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : 'Could not load this debrief');
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void load();
    return () => { isCurrent = false; };
  }, [id, submissionId]);

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading debrief…</p></PageWrapper>;
  }

  if (loadError || !debrief) {
    return (
      <PageWrapper>
        <div className="py-10" role="alert">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Debrief unavailable</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{loadError ?? 'This submission could not be found.'}</p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')} className="mt-5">Back to dashboard</Button>
        </div>
      </PageWrapper>
    );
  }

  const deliverables = caseData?.deliverables ?? [];
  const estimate = parseEstimate(debrief.content.final_estimate);
  const range = debrief.referenceRange;
  const unitsMatch = estimate && range && estimate.unit.toLowerCase() === range.unit.toLowerCase();
  const estimateOutsideRange = unitsMatch
    ? estimate.value < range.low || estimate.value > range.high
    : false;

  return (
    <PageWrapper className="py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(caseData ? `/cases/${debrief.caseId}` : '/dashboard')}
        className="mb-5 inline-flex gap-2"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to case
      </Button>

      <header className="mb-8 border-b border-[var(--border-subtle)] pb-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-emerald-400/40 px-2 py-0.5 text-xs text-emerald-300">
            <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> Attempt submitted
          </span>
          {debrief.versionNumber != null && (
            <span className="inline-flex items-center rounded border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
              Case version {debrief.versionNumber}
            </span>
          )}
          {!debrief.caseAvailable && (
            <span className="inline-flex items-center rounded border border-amber-500/40 px-2 py-0.5 text-xs text-amber-300">
              Case no longer available
            </span>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Submission debrief{caseData ? ` — ${caseData.title}` : ''}
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Submitted {new Date(debrief.createdAt).toLocaleString()} · {debrief.wordCount.toLocaleString()} words
        </p>
      </header>

      {range && (
        <section className="mb-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5" aria-label="Reference range">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Target aria-hidden="true" className="h-4 w-4" /> Reference range
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {range.value.toLocaleString()} {range.unit} (acceptable range: {range.low.toLocaleString()}–{range.high.toLocaleString()} {range.unit})
          </p>
          {estimate && (
            <p className={`mt-2 text-sm ${estimateOutsideRange ? 'text-amber-300' : 'text-emerald-300'}`}>
              Your estimate: {estimate.value.toLocaleString()} {estimate.unit}
              {unitsMatch
                ? estimateOutsideRange ? ' — outside the reference range' : ' — within the reference range'
                : ' — units differ from the reference range, compare carefully'}
            </p>
          )}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Your submitted solution">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Your solution</h2>
          <div className="space-y-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
            {Object.entries(debrief.content).map(([section, content]) => (
              <div key={section}>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  {submissionSectionLabel(section, deliverables)}
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                  {formatSubmissionSection(section, content)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Reference solution">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <BookOpen aria-hidden="true" className="h-4 w-4" /> Reference solution
          </h2>
          {debrief.referenceSolution ? (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                {debrief.referenceSolution}
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-secondary)]">
              No reference solution is available for this attempt.
            </p>
          )}
        </section>
      </div>

      <section className="mt-10" aria-label="Reflection">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Lightbulb aria-hidden="true" className="h-4 w-4" /> Reflect on this attempt
        </h2>
        <ul className="space-y-3">
          {REFLECTION_PROMPTS.map((prompt) => (
            <li key={prompt} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              {prompt}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {debrief.caseAvailable && (
          <Button variant="primary" size="sm" onClick={() => navigate(`/cases/${debrief.caseId}/solve`)}>
            Attempt this case again
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => navigate(`/cases/${debrief.caseId}/solutions`)}>
          Compare solutions
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    </PageWrapper>
  );
};
