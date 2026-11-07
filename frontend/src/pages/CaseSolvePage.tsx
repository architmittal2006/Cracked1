import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, PenLine } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import {
  createSubmission,
  getCaseDraft,
  getPublishedCase,
  getReferenceSolution,
  saveCaseDraft,
} from '../services/api';
import type { PublishedCaseDetail } from '../services/api';
import type { ProblemType } from '../data/mockData';
import type { StatusType } from '../components/StatusPill';
import { StatusPill } from '../components/StatusPill';

const inputClass =
  'w-full rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]';
const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]';

const sectionKey = (index: number) => `section_${index}`;
const NOTES_KEY = '_notes';

interface GuesstimateAssumption { name: string; value: string; unit: string; rationale: string }
interface GuesstimateState {
  clarify_scope: string;
  segments: string[];
  assumptions: GuesstimateAssumption[];
  calculation_steps: string;
  sanity_check: string;
  estimate: { value: string; unit: string; low: string; high: string };
}

const EMPTY_GUESSTIMATE: GuesstimateState = {
  clarify_scope: '',
  segments: [''],
  assumptions: [{ name: '', value: '', unit: '', rationale: '' }],
  calculation_steps: '',
  sanity_check: '',
  estimate: { value: '', unit: '', low: '', high: '' },
};

const parseJson = <T,>(raw: unknown, fallback: T): T => {
  if (typeof raw !== 'string' || !raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const guesstimateToContentJson = (state: GuesstimateState): Record<string, string> => ({
  clarify_scope: state.clarify_scope.trim(),
  structure_segments: JSON.stringify(state.segments.map((s) => s.trim()).filter(Boolean)),
  assumptions: JSON.stringify(
    state.assumptions
      .map((a) => ({ name: a.name.trim(), value: a.value.trim(), unit: a.unit.trim(), rationale: a.rationale.trim() }))
      .filter((a) => a.name || a.value || a.unit || a.rationale)
  ),
  calculation_steps: state.calculation_steps.trim(),
  sanity_check: state.sanity_check.trim(),
  final_estimate: JSON.stringify({
    value: state.estimate.value.trim(),
    unit: state.estimate.unit.trim(),
    low: state.estimate.low.trim(),
    high: state.estimate.high.trim(),
  }),
});

const guesstimateFromContent = (content: Record<string, unknown>): GuesstimateState => ({
  clarify_scope: typeof content.clarify_scope === 'string' ? content.clarify_scope : '',
  segments: parseJson<string[]>(content.structure_segments, []).length
    ? parseJson<string[]>(content.structure_segments, [])
    : [''],
  assumptions: parseJson<GuesstimateAssumption[]>(content.assumptions, []).length
    ? parseJson<GuesstimateAssumption[]>(content.assumptions, [])
    : [{ name: '', value: '', unit: '', rationale: '' }],
  calculation_steps: typeof content.calculation_steps === 'string' ? content.calculation_steps : '',
  sanity_check: typeof content.sanity_check === 'string' ? content.sanity_check : '',
  estimate: (() => {
    const parsed = parseJson<Partial<GuesstimateState['estimate']>>(content.final_estimate, {});
    return {
      value: parsed.value ?? '',
      unit: parsed.unit ?? '',
      low: parsed.low ?? '',
      high: parsed.high ?? '',
    };
  })(),
});

export const CaseSolvePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<PublishedCaseDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [guesstimate, setGuesstimate] = useState<GuesstimateState>(EMPTY_GUESSTIMATE);
  const [hasDraft, setHasDraft] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [referenceSolution, setReferenceSolution] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [loadedCase, draft, solution] = await Promise.all([
          getPublishedCase(id),
          getCaseDraft(id).catch(() => null),
          getReferenceSolution(id),
        ]);
        if (cancelled) return;
        if (!loadedCase) {
          setLoadError('This case is not published or does not exist.');
          return;
        }
        setCaseData(loadedCase);
        if (draft) {
          setHasDraft(true);
          if (loadedCase.type === 'Guesstimate') {
            setGuesstimate(guesstimateFromContent(draft.content));
          } else {
            const nextAnswers: Record<number, string> = {};
            loadedCase.deliverables.forEach((_, index) => {
              const value = draft.content[sectionKey(index)];
              if (typeof value === 'string') nextAnswers[index] = value;
            });
            setAnswers(nextAnswers);
            const draftNotes = draft.content[NOTES_KEY];
            if (typeof draftNotes === 'string') setNotes(draftNotes);
          }
        }
        if (solution) {
          setSubmitted(true);
          setReferenceSolution(solution);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not load the workspace');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const buildContentJson = (): Record<string, string> => {
    if (!caseData) return {};
    if (caseData.type === 'Guesstimate') {
      const content = guesstimateToContentJson(guesstimate);
      const notesValue = notes.trim();
      if (notesValue) content[NOTES_KEY] = notesValue;
      return content;
    }
    const content: Record<string, string> = {};
    caseData.deliverables.forEach((_, index) => {
      const value = (answers[index] ?? '').trim();
      if (value) content[sectionKey(index)] = value;
    });
    if (notes.trim()) content[NOTES_KEY] = notes.trim();
    return content;
  };

  const hasContent = useMemo(() => {
    if (notes.trim()) return true;
    if (!caseData) return false;
    if (caseData.type === 'Guesstimate') {
      return Boolean(
        guesstimate.clarify_scope.trim() ||
        guesstimate.calculation_steps.trim() ||
        guesstimate.sanity_check.trim() ||
        guesstimate.segments.some((s) => s.trim()) ||
        guesstimate.assumptions.some((a) => a.name.trim() || a.value.trim() || a.unit.trim() || a.rationale.trim()) ||
        guesstimate.estimate.value.trim() || guesstimate.estimate.unit.trim() ||
        guesstimate.estimate.low.trim() || guesstimate.estimate.high.trim()
      );
    }
    return Object.values(answers).some((value) => value.trim());
  }, [answers, notes, guesstimate, caseData]);

  const handleSaveDraft = async () => {
    if (!id || !caseData) return;
    setSaveState('saving');
    setSaveError(null);
    try {
      await saveCaseDraft(id, buildContentJson());
      setHasDraft(true);
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Could not save draft');
    }
  };

  const handleSubmit = async () => {
    if (!id || !caseData || submitted) return;
    const contentJson = buildContentJson();
    if (Object.keys(contentJson).length === 0) {
      setSubmitState('error');
      setSubmitError('Write your solution before submitting.');
      return;
    }
    if (caseData.type === 'Guesstimate') {
      const { value, unit, low, high } = guesstimate.estimate;
      const numeric = [value, low, high].every((field) => field.trim() !== '' && Number.isFinite(Number(field)));
      if (!numeric || !unit.trim()) {
        setSubmitState('error');
        setSubmitError('Enter a numeric final estimate with a unit and low/high range.');
        return;
      }
      const numValue = Number(value);
      const numLow = Number(low);
      const numHigh = Number(high);
      if (numLow > numValue || numValue > numHigh) {
        setSubmitState('error');
        setSubmitError('Final estimate must satisfy low ≤ value ≤ high.');
        return;
      }
    }
    setSubmitState('submitting');
    setSubmitError(null);
    setSubmitNotice(null);
    try {
      const response = await createSubmission(id, contentJson, 0, 0);
      setSubmitted(true);
      setSubmitState('idle');
      setSubmitNotice(`Attempt submitted (${response.submissionId}).`);
      const solution = await getReferenceSolution(id);
      setReferenceSolution(solution);
    } catch (error) {
      setSubmitState('error');
      setSubmitError(error instanceof Error ? error.message : 'Could not submit your solution');
    }
  };

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading workspace…</p></PageWrapper>;
  }

  if (loadError || !caseData) {
    return (
      <PageWrapper>
        <div className="py-10" role={loadError ? 'alert' : undefined}>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Workspace unavailable</h1>
          {loadError && <p className="mt-2 text-sm text-[var(--text-secondary)]">{loadError}</p>}
          <Button variant="secondary" size="sm" onClick={() => navigate('/cases')} className="mt-5">Back to cases</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${caseData.id}`)} className="mb-5 inline-flex gap-2">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to case
      </Button>

      <header className="mb-8 border-b border-[var(--border-subtle)] pb-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ProblemTypeBadge type={caseData.type as ProblemType} linked />
          <StatusPill status={caseData.status as StatusType} />
          {submitted && (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-400/40 px-2 py-0.5 text-xs text-emerald-300">
              <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> Attempt submitted
            </span>
          )}
        </div>
        <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">{caseData.title}</h1>
        <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[var(--text-primary)]">{caseData.description}</p>
        {caseData.exhibits && (
          <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Exhibits &amp; materials</h2>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{caseData.exhibits}</p>
          </div>
        )}
      </header>

      {submitted ? (
        <section className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6" aria-label="Submitted attempt">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Attempt submitted</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {submitNotice ?? 'Your solution has been recorded. The reference solution is now available below.'}
          </p>
          {referenceSolution && (
            <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <Eye aria-hidden="true" className="h-4 w-4" /> Reference solution
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{referenceSolution}</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/cases/${caseData.id}/solutions`)}>
              Compare solutions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setSubmitNotice(null); }}>
              Start another attempt
            </Button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          {hasDraft && (
            <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200" role="status">
              Draft restored — your saved work is loaded below. It is not submitted until you submit it.
            </p>
          )}

          <section aria-label="Structured answer">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Your solution</h2>
            {caseData.type === 'Guesstimate' ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor="g-clarify">1. Clarify the question</label>
                  <textarea id="g-clarify" rows={3} className={inputClass} value={guesstimate.clarify_scope}
                    onChange={(e) => setGuesstimate((c) => ({ ...c, clarify_scope: e.target.value }))}
                    placeholder="What exactly is being asked? Define scope and unit." />
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <span className={labelClass}>2. Structure — break it into segments</span>
                  <div className="space-y-2">
                    {guesstimate.segments.map((segment, index) => (
                      <div key={index} className="flex gap-2">
                        <input className={inputClass} value={segment} placeholder={`Segment ${index + 1}`}
                          onChange={(e) => setGuesstimate((c) => ({ ...c, segments: c.segments.map((s, i) => (i === index ? e.target.value : s)) }))} />
                        {guesstimate.segments.length > 1 && (
                          <Button size="sm" variant="ghost" onClick={() => setGuesstimate((c) => ({ ...c, segments: c.segments.filter((_, i) => i !== index) }))}>×</Button>
                        )}
                      </div>
                    ))}
                    {guesstimate.segments.length < 8 && (
                      <Button size="sm" variant="secondary" onClick={() => setGuesstimate((c) => ({ ...c, segments: [...c.segments, ''] }))}>Add segment</Button>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <span className={labelClass}>3. Assumptions (at least three with value, unit and rationale)</span>
                  <div className="space-y-3">
                    {guesstimate.assumptions.map((assumption, index) => (
                      <div key={index} className="grid gap-2 rounded-lg border border-[var(--border-subtle)] p-3 sm:grid-cols-2">
                        <input className={inputClass} placeholder="Assumption name" value={assumption.name}
                          onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, name: e.target.value } : a)) }))} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputClass} placeholder="Value" value={assumption.value}
                            onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, value: e.target.value } : a)) }))} />
                          <input className={inputClass} placeholder="Unit" value={assumption.unit}
                            onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, unit: e.target.value } : a)) }))} />
                        </div>
                        <input className={`${inputClass} sm:col-span-2`} placeholder="Rationale" value={assumption.rationale}
                          onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, rationale: e.target.value } : a)) }))} />
                      </div>
                    ))}
                    {guesstimate.assumptions.length < 8 && (
                      <Button size="sm" variant="secondary" onClick={() => setGuesstimate((c) => ({ ...c, assumptions: [...c.assumptions, { name: '', value: '', unit: '', rationale: '' }] }))}>Add assumption</Button>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor="g-calc">4. Calculation steps</label>
                  <textarea id="g-calc" rows={4} className={inputClass} value={guesstimate.calculation_steps}
                    onChange={(e) => setGuesstimate((c) => ({ ...c, calculation_steps: e.target.value }))}
                    placeholder="Show your math step by step." />
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor="g-sanity">5. Sanity check</label>
                  <textarea id="g-sanity" rows={3} className={inputClass} value={guesstimate.sanity_check}
                    onChange={(e) => setGuesstimate((c) => ({ ...c, sanity_check: e.target.value }))}
                    placeholder="Does the answer pass a reality check? Compare to benchmarks." />
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <span className={labelClass}>6. Final estimate (value must sit inside low–high)</span>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <input className={inputClass} type="number" placeholder="Value" value={guesstimate.estimate.value}
                      onChange={(e) => setGuesstimate((c) => ({ ...c, estimate: { ...c.estimate, value: e.target.value } }))} aria-label="Estimate value" />
                    <input className={inputClass} placeholder="Unit" value={guesstimate.estimate.unit}
                      onChange={(e) => setGuesstimate((c) => ({ ...c, estimate: { ...c.estimate, unit: e.target.value } }))} aria-label="Estimate unit" />
                    <input className={inputClass} type="number" placeholder="Low" value={guesstimate.estimate.low}
                      onChange={(e) => setGuesstimate((c) => ({ ...c, estimate: { ...c.estimate, low: e.target.value } }))} aria-label="Estimate low" />
                    <input className={inputClass} type="number" placeholder="High" value={guesstimate.estimate.high}
                      onChange={(e) => setGuesstimate((c) => ({ ...c, estimate: { ...c.estimate, high: e.target.value } }))} aria-label="Estimate high" />
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor="workspace-notes">Notes (optional)</label>
                  <textarea id="workspace-notes" rows={3} className={inputClass} value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Scratch notes, assumptions, reminders…" />
                </div>
              </div>
            ) : (
            <div className="space-y-5">
              {caseData.deliverables.map((deliverable, index) => (
                <div key={`${deliverable}-${index}`} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor={`answer-${index}`}>
                    {index + 1}. {deliverable}
                  </label>
                  <textarea
                    id={`answer-${index}`}
                    rows={5}
                    className={inputClass}
                    value={answers[index] ?? ''}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [index]: event.target.value }))
                    }
                    placeholder={`Write your ${deliverable.toLowerCase()}…`}
                  />
                </div>
              ))}
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                <label className={labelClass} htmlFor="workspace-notes">Notes (optional)</label>
                <textarea
                  id="workspace-notes"
                  rows={3}
                  className={inputClass}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Scratch notes, assumptions, reminders…"
                />
              </div>
            </div>
            )}
          </section>

          {submitError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
              {submitError}
            </p>
          )}
          {saveError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-6">
            <Button
              variant="secondary"
              size="md"
              loading={saveState === 'saving'}
              disabled={!hasContent && saveState !== 'saving'}
              onClick={() => void handleSaveDraft()}
            >
              {saveState === 'saved' ? 'Draft saved' : saveState === 'saving' ? 'Saving…' : 'Save draft'}
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submitState === 'submitting'}
              disabled={!hasContent || submitState === 'submitting'}
              onClick={() => void handleSubmit()}
            >
              <PenLine aria-hidden="true" className="h-4 w-4" />
              {submitState === 'submitting' ? 'Submitting…' : 'Submit attempt'}
            </Button>
            {!hasContent && (
              <span className="text-xs text-[var(--text-secondary)]">Write at least one section to save or submit.</span>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default CaseSolvePage;
