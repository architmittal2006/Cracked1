import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
const snapshotKeyFor = (caseId: string) => `cracked:workspace-snapshot:${caseId}`;

const readWorkspaceSnapshot = (caseId: string): { savedAt: number; content: Record<string, unknown> } | null => {
  try {
    const raw = sessionStorage.getItem(snapshotKeyFor(caseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; content?: Record<string, unknown> };
    if (typeof parsed.savedAt !== 'number' || !parsed.content || typeof parsed.content !== 'object') return null;
    return { savedAt: parsed.savedAt, content: parsed.content };
  } catch {
    return null;
  }
};

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
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [validationShown, setValidationShown] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [auxLoaded, setAuxLoaded] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [solutionError, setSolutionError] = useState<string | null>(null);
  const [externalSubmitNotice, setExternalSubmitNotice] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const location = useLocation();
  const savedSignature = useRef<string | null>(null);
  const signatureRef = useRef('');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlight = useRef(false);
  const pendingSave = useRef(false);
  const statusCheckInFlight = useRef(false);
  const lastStatusCheck = useRef(0);
  const mountedRef = useRef(true);
  const submittedRef = useRef(false);
  const dirtyRef = useRef(false);

  const restoreDraft = (loadedCase: PublishedCaseDetail, draft: { content: Record<string, unknown> } | null) => {
    if (!draft) return;
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
    }
    const draftNotes = draft.content[NOTES_KEY];
    if (typeof draftNotes === 'string') setNotes(draftNotes);
  };

  const loadAuxData = async (loadedCase: PublishedCaseDetail) => {
    setDraftError(null);
    setSolutionError(null);
    const [draftResult, solutionResult] = await Promise.allSettled([
      getCaseDraft(id!),
      getReferenceSolution(id!),
    ]);
    let draftToRestore = draftResult.status === 'fulfilled' ? draftResult.value : null;
    if (draftResult.status === 'rejected') {
      setDraftError('Could not load your saved draft.');
    }
    // A local snapshot holds content newer than the last confirmed server save
    // (e.g. edits made after the session expired). Prefer it when newer.
    const snapshot = id ? readWorkspaceSnapshot(id) : null;
    if (snapshot) {
      const draftSavedAt = draftToRestore?.updatedAt ?? draftToRestore?.createdAt;
      const draftSavedAtMs = draftSavedAt ? Date.parse(draftSavedAt) : 0;
      if (!draftToRestore || snapshot.savedAt > draftSavedAtMs) {
        draftToRestore = { id: '', content: snapshot.content, createdAt: '' };
      }
      if (id) sessionStorage.removeItem(snapshotKeyFor(id));
    }
    if (draftToRestore) restoreDraft(loadedCase, draftToRestore);
    if (solutionResult.status === 'fulfilled') {
      if (solutionResult.value) {
        setSubmitted(true);
        setReferenceSolution(solutionResult.value);
      }
    } else {
      setSolutionError('Could not check your submission status.');
    }
    setAuxLoaded(true);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      const loadedCase = await getPublishedCase(id);
      if (cancelled) return;
      if (!loadedCase) {
        setLoadError('This case is not published or does not exist.');
        setIsLoading(false);
        return;
      }
      setCaseData(loadedCase);
      setIsLoading(false);
      try {
        await loadAuxData(loadedCase);
      } catch {
        if (!cancelled) setAuxLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Dirty tracking + debounced autosave: signature of current content vs last saved/loaded content.
  useEffect(() => {
    if (!auxLoaded || !caseData) return;
    signatureRef.current = JSON.stringify(buildContentJson());
    if (savedSignature.current === null) savedSignature.current = signatureRef.current;
    const dirtyNow = signatureRef.current !== savedSignature.current;
    setIsDirty(dirtyNow);
    // Persist a local snapshot of unsaved work so it survives unmounts
    // (e.g. the session-expired re-login flow) and accidental tab closure.
    if (id) {
      if (dirtyNow) {
        try {
          sessionStorage.setItem(snapshotKeyFor(id), JSON.stringify({ savedAt: Date.now(), content: JSON.parse(signatureRef.current) }));
        } catch { /* storage full/blocked — ignore */ }
      } else {
        sessionStorage.removeItem(snapshotKeyFor(id));
      }
    }
    if (dirtyNow && !submitted && !draftError) scheduleAutosave(1500);
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, notes, guesstimate, auxLoaded, caseData, submitted, draftError]);

  // Clear any pending autosave timer on unmount.
  useEffect(() => () => {
    mountedRef.current = false;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
  }, []);

  useEffect(() => { submittedRef.current = submitted; }, [submitted]);
  useEffect(() => { dirtyRef.current = isDirty; }, [isDirty]);

  // Refresh submission status when the tab regains attention, so a submission
  // made in another tab/device is detected without a manual reload.
  const refreshSubmissionStatus = async () => {
    if (!id || submittedRef.current || statusCheckInFlight.current) return;
    if (Date.now() - lastStatusCheck.current < 2000) return;
    lastStatusCheck.current = Date.now();
    statusCheckInFlight.current = true;
    try {
      const solution = await getReferenceSolution(id);
      if (!mountedRef.current || !solution) return;
      if (dirtyRef.current && !window.confirm('A submission was found for this case. Discard your unsaved changes and view it?')) {
        setExternalSubmitNotice('This case was already submitted — possibly in another tab or device. Your unsaved changes are preserved and autosave continues.');
        return;
      }
      setExternalSubmitNotice(null);
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      savedSignature.current = signatureRef.current;
      setIsDirty(false);
      setSubmitted(true);
      setReferenceSolution(solution);
      setSubmitNotice('A submission was detected — it may have been made in another tab or device.');
    } catch {
      // Status unknown (network/500): do not treat as proof of non-submission.
      if (mountedRef.current) setSolutionError('Could not check your submission status.');
    } finally {
      statusCheckInFlight.current = false;
    }
  };

  useEffect(() => {
    if (!id) return;
    const onAttention = () => {
      if (document.visibilityState === 'visible') void refreshSubmissionStatus();
    };
    window.addEventListener('focus', onAttention);
    document.addEventListener('visibilitychange', onAttention);
    return () => {
      window.removeEventListener('focus', onAttention);
      document.removeEventListener('visibilitychange', onAttention);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Unsaved-work protection: tab close/refresh.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Unsaved-work protection: internal link clicks (React Router <Link>/<a>).
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute('href') ?? '';
      if (!href.startsWith('/') || anchor.target === '_blank') return;
      if (!window.confirm('You have unsaved changes. Leave without saving?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isDirty]);

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
  }, [answers, guesstimate, caseData]);

  // Mirrors backend validateLayer1Gate guesstimate rules; backend remains authoritative.
  const guesstimateErrors = useMemo<Record<string, string>>(() => {
    const errors: Record<string, string> = {};
    if (caseData?.type !== 'Guesstimate') return errors;
    const g = guesstimate;
    if (!g.clarify_scope.trim()) errors.clarify_scope = 'Clarify the question scope and unit.';
    if (!g.segments.some((s) => s.trim())) errors.segments = 'Add at least one structure segment.';
    const filledAssumptions = g.assumptions.filter((a) => a.name.trim() || a.value.trim() || a.unit.trim() || a.rationale.trim());
    const completeAssumptions = filledAssumptions.filter((a) =>
      a.name.trim() && a.unit.trim() && a.rationale.trim() && a.value.trim() && Number.isFinite(Number(a.value))
    );
    if (filledAssumptions.length > 0 && completeAssumptions.length < filledAssumptions.length) {
      errors.assumptions = 'Each assumption needs a name, numeric value, unit and rationale.';
    } else if (completeAssumptions.length < 3) {
      errors.assumptions = `Add at least three complete assumptions (${completeAssumptions.length}/3).`;
    }
    if (!g.calculation_steps.trim()) errors.calculation_steps = 'Show your calculation steps.';
    if (!g.sanity_check.trim()) errors.sanity_check = 'Add a sanity check.';
    const { value, unit, low, high } = g.estimate;
    const numeric = [value, low, high].every((f) => f.trim() !== '' && Number.isFinite(Number(f)));
    if (!numeric || !unit.trim()) {
      errors.estimate = 'Enter numeric value, low and high with a unit.';
    } else {
      const numValue = Number(value);
      const numLow = Number(low);
      const numHigh = Number(high);
      if (numLow > numValue || numValue > numHigh) {
        errors.estimate = 'Value must satisfy low ≤ value ≤ high.';
      }
    }
    return errors;
  }, [guesstimate, caseData]);

  const scheduleAutosave = (delay: number) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null;
      void persistDraft();
    }, delay);
  };

  // Single-flight draft persistence shared by autosave and the manual button.
  // Older responses can never mark newer edits as saved: cleanliness is decided
  // by comparing the live signatureRef against the signature actually sent.
  const persistDraft = async () => {
    if (!id || !caseData || submitted) return;
    if (saveInFlight.current) {
      pendingSave.current = true;
      return;
    }
    const contentJson = buildContentJson();
    const sentSignature = JSON.stringify(contentJson);
    if (sentSignature === savedSignature.current) {
      setIsDirty(false);
      return;
    }
    saveInFlight.current = true;
    setSaveState('saving');
    setSaveError(null);
    let succeeded = false;
    try {
      await saveCaseDraft(id, contentJson);
      succeeded = true;
      savedSignature.current = sentSignature;
      setHasDraft(true);
      setIsDirty(signatureRef.current !== sentSignature);
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        setSessionExpired(true);
      } else {
        setSaveError(error instanceof Error ? error.message : 'Could not save draft');
      }
    } finally {
      saveInFlight.current = false;
      setSaveState(succeeded ? 'saved' : 'error');
      if (succeeded && (pendingSave.current || signatureRef.current !== savedSignature.current)) {
        pendingSave.current = false;
        scheduleAutosave(300);
      } else {
        pendingSave.current = false;
      }
    }
  };

  const handleSaveDraft = () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    void persistDraft();
  };

  const handleSubmit = async () => {
    if (!id || !caseData || submitted) return;
    const contentJson = buildContentJson();
    if (Object.keys(contentJson).length === 0) {
      setSubmitState('error');
      setSubmitError('Write your solution before submitting.');
      return;
    }
    if (caseData.type === 'Guesstimate' && Object.keys(guesstimateErrors).length > 0) {
      setValidationShown(true);
      setSubmitState('error');
      setSubmitError('Complete the highlighted fields before submitting.');
      return;
    }
    setValidationShown(false);
    setSubmitState('submitting');
    setSubmitError(null);
    setSubmitNotice(null);
    try {
      const response = await createSubmission(id, contentJson, 0, 0);
      setSubmitted(true);
      savedSignature.current = signatureRef.current;
      setIsDirty(false);
      setSubmitState('idle');
      setSubmitNotice(`Attempt submitted (${response.submissionId}).`);
      setLastSubmissionId(response.submissionId);
      const solution = await getReferenceSolution(id);
      setReferenceSolution(solution);
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        setSessionExpired(true);
      } else {
        setSubmitState('error');
        setSubmitError(error instanceof Error ? error.message : 'Could not submit your solution');
      }
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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
          navigate(`/cases/${caseData.id}`);
        }}
        className="mb-5 inline-flex gap-2"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to case
      </Button>

      {(draftError || solutionError) && (
        <div className="mb-6 space-y-2">
          {draftError && (
            <p className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="alert">
              {draftError}
              <button type="button" className="font-medium underline" onClick={() => caseData && void loadAuxData(caseData)}>Retry</button>
            </p>
          )}
          {solutionError && (
            <p className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="alert">
              {solutionError} The workspace is still usable.
              <button type="button" className="font-medium underline" onClick={() => caseData && void loadAuxData(caseData)}>Retry</button>
            </p>
          )}
        </div>
      )}

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
            {lastSubmissionId && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/cases/${caseData.id}/submissions/${lastSubmissionId}/debrief`)}>
                View debrief
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => navigate(`/cases/${caseData.id}/solutions`)}>
              Compare solutions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setSubmitNotice(null); setLastSubmissionId(null); }}>
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
          {externalSubmitNotice && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="status">
              {externalSubmitNotice}
            </p>
          )}
          {sessionExpired && (
            <p className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
              Your session expired. Your unsaved work is still here — sign in again to keep saving.
              <Link
                to="/login"
                state={{ from: { pathname: location.pathname } }}
                className="font-medium underline"
              >
                Sign in again
              </Link>
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
                  {validationShown && guesstimateErrors.clarify_scope && (
                    <p className="mt-2 text-sm text-red-300" role="alert">{guesstimateErrors.clarify_scope}</p>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <span className={labelClass}>2. Structure — break it into segments</span>
                  <div className="space-y-2">
                    {guesstimate.segments.map((segment, index) => (
                      <div key={index} className="flex gap-2">
                        <input className={inputClass} value={segment} placeholder={`Segment ${index + 1}`}
                          aria-label={`Structure segment ${index + 1}`}
                          onChange={(e) => setGuesstimate((c) => ({ ...c, segments: c.segments.map((s, i) => (i === index ? e.target.value : s)) }))} />
                        {guesstimate.segments.length > 1 && (
                          <Button size="sm" variant="ghost" aria-label={`Remove segment ${index + 1}`} onClick={() => setGuesstimate((c) => ({ ...c, segments: c.segments.filter((_, i) => i !== index) }))}>×</Button>
                        )}
                      </div>
                    ))}
                    {guesstimate.segments.length < 8 && (
                      <Button size="sm" variant="secondary" onClick={() => setGuesstimate((c) => ({ ...c, segments: [...c.segments, ''] }))}>Add segment</Button>
                    )}
                  </div>
                  {validationShown && guesstimateErrors.segments && (
                    <p className="mt-2 text-sm text-red-300" role="alert">{guesstimateErrors.segments}</p>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <span className={labelClass}>3. Assumptions (at least three with value, unit and rationale)</span>
                  <div className="space-y-3">
                    {guesstimate.assumptions.map((assumption, index) => (
                      <div key={index} className="grid gap-2 rounded-lg border border-[var(--border-subtle)] p-3 sm:grid-cols-2">
                        <input className={inputClass} placeholder="Assumption name" value={assumption.name}
                          aria-label={`Assumption ${index + 1} name`}
                          onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, name: e.target.value } : a)) }))} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputClass} placeholder="Value" value={assumption.value}
                            aria-label={`Assumption ${index + 1} value`}
                            onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, value: e.target.value } : a)) }))} />
                          <input className={inputClass} placeholder="Unit" value={assumption.unit}
                            aria-label={`Assumption ${index + 1} unit`}
                            onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, unit: e.target.value } : a)) }))} />
                        </div>
                        <input className={`${inputClass} sm:col-span-2`} placeholder="Rationale" value={assumption.rationale}
                          aria-label={`Assumption ${index + 1} rationale`}
                          onChange={(e) => setGuesstimate((c) => ({ ...c, assumptions: c.assumptions.map((a, i) => (i === index ? { ...a, rationale: e.target.value } : a)) }))} />
                      </div>
                    ))}
                    {guesstimate.assumptions.length < 8 && (
                      <Button size="sm" variant="secondary" onClick={() => setGuesstimate((c) => ({ ...c, assumptions: [...c.assumptions, { name: '', value: '', unit: '', rationale: '' }] }))}>Add assumption</Button>
                    )}
                  </div>
                  {validationShown && guesstimateErrors.assumptions && (
                    <p className="mt-2 text-sm text-red-300" role="alert">{guesstimateErrors.assumptions}</p>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor="g-calc">4. Calculation steps</label>
                  <textarea id="g-calc" rows={4} className={inputClass} value={guesstimate.calculation_steps}
                    onChange={(e) => setGuesstimate((c) => ({ ...c, calculation_steps: e.target.value }))}
                    placeholder="Show your math step by step." />
                  {validationShown && guesstimateErrors.calculation_steps && (
                    <p className="mt-2 text-sm text-red-300" role="alert">{guesstimateErrors.calculation_steps}</p>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <label className={labelClass} htmlFor="g-sanity">5. Sanity check</label>
                  <textarea id="g-sanity" rows={3} className={inputClass} value={guesstimate.sanity_check}
                    onChange={(e) => setGuesstimate((c) => ({ ...c, sanity_check: e.target.value }))}
                    placeholder="Does the answer pass a reality check? Compare to benchmarks." />
                  {validationShown && guesstimateErrors.sanity_check && (
                    <p className="mt-2 text-sm text-red-300" role="alert">{guesstimateErrors.sanity_check}</p>
                  )}
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
                  {validationShown && guesstimateErrors.estimate && (
                    <p className="mt-2 text-sm text-red-300" role="alert">{guesstimateErrors.estimate}</p>
                  )}
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
            {isDirty && (
              <span className="text-xs font-medium text-amber-300">Unsaved changes</span>
            )}
            {!isDirty && saveState === 'saving' && (
              <span className="text-xs text-[var(--text-secondary)]">Saving…</span>
            )}
            {!isDirty && saveState === 'saved' && hasDraft && (
              <span className="text-xs text-emerald-300">Draft saved</span>
            )}
            {saveState === 'error' && (
              <span className="text-xs font-medium text-red-300">Save failed</span>
            )}
            {!hasContent && !isDirty && saveState === 'idle' && (
              <span className="text-xs text-[var(--text-secondary)]">Write at least one section to save or submit.</span>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default CaseSolvePage;
