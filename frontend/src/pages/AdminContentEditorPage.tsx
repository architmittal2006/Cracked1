import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import {
  createAdminContent,
  getAdminContentEditorState,
  getAdminContentVersions,
  previewAdminContent,
  publishAdminContent,
  saveAdminContentDraft,
  unpublishAdminContent,
} from '../services/api';
import type {
  CaseContentInput,
  CaseContentType,
  ContentVersionSummary,
  ReferenceRange,
} from '../services/api';

const EMPTY_FORM: CaseContentInput = {
  title: '',
  type: 'Profitability',
  sector: '',
  difficulty: 'Standard',
  description: '',
  exhibits: '',
  deliverables: [''],
  referenceRange: null,
  referenceSolution: '',
  rubricCriteria: [{ name: '', description: '' }],
  contentOwner: '',
  authorCredit: '',
  sourceKind: 'original',
  sourceReference: '',
  rightsDeclaration: '',
  rightsConfirmed: true,
};

const CONTENT_TYPES: CaseContentType[] = [
  'Market Sizing', 'Profitability', 'Market Entry', 'Operational',
  'Pricing', 'M&A', 'Growth & Retention', 'Guesstimate',
];
const SOURCE_KINDS = [
  { value: 'original', label: 'Original' },
  { value: 'licensed', label: 'Licensed' },
  { value: 'public_domain', label: 'Public domain' },
  { value: 'permission_granted', label: 'Permission granted' },
] as const;

const inputClass =
  'w-full rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]';
const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]';

interface FormState {
  title: string;
  type: CaseContentType;
  sector: string;
  difficulty: 'Standard' | 'High' | 'Chaos';
  description: string;
  exhibits: string;
  deliverables: string[];
  useReferenceRange: boolean;
  referenceValue: string;
  referenceUnit: string;
  referenceLow: string;
  referenceHigh: string;
  referenceSolution: string;
  rubric: { name: string; description: string }[];
  contentOwner: string;
  authorCredit: string;
  sourceKind: CaseContentInput['sourceKind'];
  sourceReference: string;
  rightsDeclaration: string;
  rightsConfirmed: boolean;
}

const toForm = (input: CaseContentInput): FormState => ({
  title: input.title,
  type: input.type,
  sector: input.sector,
  difficulty: input.difficulty,
  description: input.description,
  exhibits: input.exhibits ?? '',
  deliverables: input.deliverables.length ? input.deliverables : [''],
  useReferenceRange: Boolean(input.referenceRange),
  referenceValue: input.referenceRange ? String(input.referenceRange.value) : '',
  referenceUnit: input.referenceRange?.unit ?? '',
  referenceLow: input.referenceRange ? String(input.referenceRange.low) : '',
  referenceHigh: input.referenceRange ? String(input.referenceRange.high) : '',
  referenceSolution: input.referenceSolution,
  rubric: input.rubricCriteria.length ? input.rubricCriteria : [{ name: '', description: '' }],
  contentOwner: input.contentOwner,
  authorCredit: input.authorCredit ?? '',
  sourceKind: input.sourceKind,
  sourceReference: input.sourceReference ?? '',
  rightsDeclaration: input.rightsDeclaration,
  rightsConfirmed: input.rightsConfirmed === true,
});

const toInput = (form: FormState): CaseContentInput => {
  let referenceRange: ReferenceRange | null = null;
  if (form.useReferenceRange && form.type === 'Guesstimate') {
    referenceRange = {
      value: Number(form.referenceValue),
      unit: form.referenceUnit,
      low: Number(form.referenceLow),
      high: Number(form.referenceHigh),
    };
  }
  return {
    title: form.title,
    type: form.type,
    sector: form.sector,
    difficulty: form.difficulty,
    description: form.description,
    exhibits: form.exhibits || undefined,
    deliverables: form.deliverables.map((item) => item.trim()).filter(Boolean),
    referenceRange,
    referenceSolution: form.referenceSolution,
    rubricCriteria: form.rubric
      .map((item) => ({ name: item.name.trim(), description: item.description.trim() }))
      .filter((item) => item.name || item.description),
    contentOwner: form.contentOwner,
    authorCredit: form.authorCredit || null,
    sourceKind: form.sourceKind,
    sourceReference: form.sourceReference || null,
    rightsDeclaration: form.rightsDeclaration,
    rightsConfirmed: form.rightsConfirmed ? true : (undefined as never),
  };
};

export const AdminContentEditorPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const isNew = caseId === 'new' || caseId === undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(() => toForm(EMPTY_FORM));
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const [contentStatus, setContentStatus] = useState<string>('Draft');
  const [hasPublished, setHasPublished] = useState(false);
  const [versions, setVersions] = useState<ContentVersionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (isNew || !caseId) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const { detail, initial } = await getAdminContentEditorState(caseId);
        if (cancelled) return;
        setForm(toForm(initial));
        setCaseStatus(String(detail.case.status));
        setHasPublished(Boolean(detail.published));
        setContentStatus(detail.published ? 'Published' : 'Draft');
        setVersions(await getAdminContentVersions(caseId));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load content');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, isNew]);

  const input = useMemo(() => toInput(form), [form]);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleSave = () => run('save', async () => {
    if (isNew) {
      const { caseId: createdId } = await createAdminContent(input);
      setNotice('Draft created.');
      navigate(`/admin/content/${createdId}`, { replace: true });
      return;
    }
    const result = await saveAdminContentDraft(caseId!, input);
    setNotice(`Draft saved (version ${result.versionNumber}).`);
    setVersions(await getAdminContentVersions(caseId!));
  });

  const handlePreview = () => run('preview', async () => {
    try {
      const valid = await previewAdminContent(input);
      setPreview({ ok: true, text: `Valid — ready to save. Type: ${valid.type}, deliverables: ${valid.deliverables.length}, rubric: ${valid.rubricCriteria.length}.` });
    } catch (previewError) {
      setPreview({ ok: false, text: previewError instanceof Error ? previewError.message : 'Validation failed' });
    }
  });

  const handlePublish = () => {
    if (!window.confirm('Publish this draft? The published version becomes visible to students (if the case status is Open) and cannot be edited in place.')) return;
    void run('publish', async () => {
      const result = await publishAdminContent(caseId!);
      setNotice(`Published version ${result.versionNumber}.`);
      setHasPublished(true);
      setContentStatus('Published');
      setVersions(await getAdminContentVersions(caseId!));
    });
  };

  const handleUnpublish = () => {
    if (!window.confirm('Unpublish this content? Students will no longer see it, but version history is preserved.')) return;
    void run('unpublish', async () => {
      await unpublishAdminContent(caseId!);
      setNotice('Content unpublished.');
      setContentStatus('Unpublished');
      setVersions(await getAdminContentVersions(caseId!));
    });
  };

  if (isLoading) {
    return <PageWrapper className="max-w-4xl"><p className="py-8 text-sm text-[var(--text-secondary)]">Loading editor…</p></PageWrapper>;
  }

  return (
    <PageWrapper className="max-w-4xl">
      <header className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <Link to="/admin/content" className="text-sm text-[var(--text-secondary)] hover:text-white">← Content studio</Link>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
          {isNew ? 'New content' : form.title || 'Edit content'}
        </h1>
        {!isNew && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded border border-[var(--border-medium)] px-2 py-0.5 text-[var(--text-secondary)]">
              {contentStatus}
            </span>
            {hasPublished && (
              <Button size="sm" variant="secondary" loading={busy === 'unpublish'} onClick={handleUnpublish}>
                Unpublish
              </Button>
            )}
            {!isNew && (
              <Button size="sm" variant="primary" loading={busy === 'publish'} onClick={handlePublish}>
                Publish draft
              </Button>
            )}
          </div>
        )}
        {!isNew && caseStatus && caseStatus !== 'Open' && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            This case has status “{caseStatus}”, not “Open”. Publishing will succeed but students still
            will not see it — the public catalogue requires both a published version and an Open case status.
          </p>
        )}
      </header>

      {error && <p className="mb-5 border-y border-red-500/30 py-3 text-sm text-red-300" role="alert">{error}</p>}
      {notice && <p className="mb-5 border-y border-emerald-500/30 py-3 text-sm text-emerald-300" role="status">{notice}</p>}

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="f-title">Title</label>
            <input id="f-title" className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-type">Type</label>
            <select id="f-type" className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value as CaseContentType)}>
              {CONTENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="f-difficulty">Difficulty</label>
            <select id="f-difficulty" className={inputClass} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as FormState['difficulty'])}>
              <option value="Standard">Standard</option>
              <option value="High">High</option>
              <option value="Chaos">Chaos</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="f-sector">Sector</label>
            <input id="f-sector" className={inputClass} value={form.sector} onChange={(e) => set('sector', e.target.value)} />
          </div>
        </section>

        <section>
          <label className={labelClass} htmlFor="f-description">Description / prompt</label>
          <textarea id="f-description" rows={6} className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </section>

        <section>
          <label className={labelClass} htmlFor="f-exhibits">Exhibits / materials (optional)</label>
          <textarea id="f-exhibits" rows={3} className={inputClass} value={form.exhibits} onChange={(e) => set('exhibits', e.target.value)} />
        </section>

        <section>
          <span className={labelClass}>Deliverables</span>
          <div className="space-y-2">
            {form.deliverables.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={inputClass}
                  value={item}
                  placeholder={`Deliverable ${index + 1}`}
                  onChange={(e) => set('deliverables', form.deliverables.map((d, i) => (i === index ? e.target.value : d)))}
                />
                {form.deliverables.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => set('deliverables', form.deliverables.filter((_, i) => i !== index))}>×</Button>
                )}
              </div>
            ))}
            {form.deliverables.length < 8 && (
              <Button size="sm" variant="secondary" onClick={() => set('deliverables', [...form.deliverables, ''])}>Add deliverable</Button>
            )}
          </div>
        </section>

        {form.type === 'Guesstimate' && (
          <section className="rounded-xl border border-[var(--border-subtle)] p-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={form.useReferenceRange} onChange={(e) => set('useReferenceRange', e.target.checked)} />
              Include a reference range
            </label>
            {form.useReferenceRange && (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <input className={inputClass} type="number" placeholder="Value" value={form.referenceValue} onChange={(e) => set('referenceValue', e.target.value)} aria-label="Reference value" />
                <input className={inputClass} placeholder="Unit" value={form.referenceUnit} onChange={(e) => set('referenceUnit', e.target.value)} aria-label="Reference unit" />
                <input className={inputClass} type="number" placeholder="Low" value={form.referenceLow} onChange={(e) => set('referenceLow', e.target.value)} aria-label="Range low" />
                <input className={inputClass} type="number" placeholder="High" value={form.referenceHigh} onChange={(e) => set('referenceHigh', e.target.value)} aria-label="Range high" />
              </div>
            )}
          </section>
        )}

        <section>
          <label className={labelClass} htmlFor="f-solution">Reference solution</label>
          <textarea id="f-solution" rows={6} className={inputClass} value={form.referenceSolution} onChange={(e) => set('referenceSolution', e.target.value)} />
        </section>

        <section>
          <span className={labelClass}>Rubric criteria</span>
          <div className="space-y-3">
            {form.rubric.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-[var(--border-subtle)] p-3 sm:grid-cols-3">
                <input className={inputClass} placeholder="Criterion name" value={item.name} onChange={(e) => set('rubric', form.rubric.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))} />
                <input className={`${inputClass} sm:col-span-2`} placeholder="What good looks like" value={item.description} onChange={(e) => set('rubric', form.rubric.map((r, i) => (i === index ? { ...r, description: e.target.value } : r)))} />
              </div>
            ))}
            {form.rubric.length < 8 && (
              <Button size="sm" variant="secondary" onClick={() => set('rubric', [...form.rubric, { name: '', description: '' }])}>Add criterion</Button>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="f-owner">Content owner</label>
            <input id="f-owner" className={inputClass} value={form.contentOwner} onChange={(e) => set('contentOwner', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="f-credit">Author credit</label>
            <input id="f-credit" className={inputClass} value={form.authorCredit} onChange={(e) => set('authorCredit', e.target.value)} />
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border-subtle)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Source &amp; rights</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="f-source">Source kind</label>
              <select id="f-source" className={inputClass} value={form.sourceKind} onChange={(e) => set('sourceKind', e.target.value as FormState['sourceKind'])}>
                {SOURCE_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="f-sourceref">Source reference{form.sourceKind !== 'original' ? ' (required)' : ' (optional)'}</label>
              <input id="f-sourceref" className={inputClass} value={form.sourceReference} onChange={(e) => set('sourceReference', e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass} htmlFor="f-rights">Rights declaration</label>
            <textarea id="f-rights" rows={3} className={inputClass} value={form.rightsDeclaration} onChange={(e) => set('rightsDeclaration', e.target.value)} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={form.rightsConfirmed} onChange={(e) => set('rightsConfirmed', e.target.checked)} />
            I confirm the rights declaration is accurate for this content.
          </label>
        </section>

        {preview && (
          <p className={`rounded-lg border px-4 py-3 text-sm ${preview.ok ? 'border-emerald-500/40 text-emerald-200' : 'border-red-500/40 text-red-200'}`} role="status">
            {preview.text}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-[var(--border-subtle)] pt-6">
          <Button variant="secondary" loading={busy === 'preview'} onClick={handlePreview}>Validate preview</Button>
          <Button variant="primary" loading={busy === 'save'} onClick={handleSave}>
            {isNew ? 'Create draft' : 'Save draft'}
          </Button>
        </div>

        {!isNew && versions.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">Version history</h2>
            <ol className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
              {versions.map((version) => (
                <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <span className="text-[var(--text-primary)]">
                    v{version.versionNumber} · {version.title}
                    <span className={`ml-2 rounded border px-1.5 py-0.5 text-xs ${version.status === 'Published' ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/40 text-amber-300'}`}>
                      {version.status}
                    </span>
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {version.publishedAt
                      ? `published ${new Date(version.publishedAt).toLocaleString()}`
                      : `created ${new Date(version.createdAt).toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </PageWrapper>
  );
};

export default AdminContentEditorPage;
