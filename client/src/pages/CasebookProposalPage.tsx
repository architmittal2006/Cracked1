import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getMyCasebook, submitCasebook, updateCasebook } from '../services/api';
import type { CasebookInput, CasebookSourceKind, CasebookLicenseKind } from '../services/api';
import { PROBLEM_TYPES } from '../data/mockData';

type CasebookCaseInput = CasebookInput['cases'][number];

const newCase = (position: number): CasebookCaseInput => ({
  title: '',
  firm: '',
  sector: '',
  caseType: null,
  difficulty: 'Standard',
  summary: '',
  body: '',
  position,
  practiceCaseId: '',
});

const emptyCasebook: CasebookInput = {
  title: '',
  sourceOrg: '',
  sourceKind: 'original',
  year: null,
  description: '',
  licenseKind: 'original',
  permissionReference: '',
  externalUrl: '',
  industries: [],
  cases: [newCase(0)],
  rightsConfirmed: false,
  attributionConfirmed: false,
};

const fieldClass = 'input-field mt-2 w-full';
const labelClass = 'block text-sm font-medium text-[var(--text-primary)]';
const helpClass = 'mt-1.5 text-xs leading-5 text-[var(--text-secondary)]';

export const CasebookProposalPage: React.FC = () => {
  const { casebookId } = useParams();
  const navigate = useNavigate();
  const [casebook, setCasebook] = useState<CasebookInput>(emptyCasebook);
  const [isLoading, setIsLoading] = useState(Boolean(casebookId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState<string | null>(null);

  useEffect(() => {
    if (!casebookId) return;
    let isCurrent = true;
    getMyCasebook(casebookId)
      .then((savedCasebook) => {
        if (!isCurrent) return;
        if (savedCasebook.status !== 'Changes_Requested') {
          setError('This casebook is not awaiting changes.');
          return;
        }
        setModeratorNotes(savedCasebook.moderatorNotes ?? null);
        setCasebook({
          title: savedCasebook.title,
          sourceOrg: savedCasebook.sourceOrg,
          sourceKind: savedCasebook.sourceKind,
          year: savedCasebook.year,
          description: savedCasebook.description,
          licenseKind: savedCasebook.licenseKind,
          permissionReference: savedCasebook.permissionReference ?? '',
          externalUrl: savedCasebook.externalUrl ?? '',
          industries: savedCasebook.industries,
          cases: (savedCasebook.cases ?? []).map((caseItem, position) => ({
            title: caseItem.title,
            firm: caseItem.firm ?? '',
            sector: caseItem.sector,
            caseType: caseItem.caseType,
            difficulty: caseItem.difficulty,
            summary: caseItem.summary,
            body: caseItem.body ?? '',
            position,
            practiceCaseId: caseItem.practiceCaseId ?? '',
          })),
          rightsConfirmed: true,
          attributionConfirmed: true,
        });
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load this casebook');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [casebookId]);

  const setField = <K extends keyof CasebookInput>(key: K, value: CasebookInput[K]) => {
    setCasebook((current) => ({ ...current, [key]: value }));
  };

  const setCaseField = <K extends keyof CasebookCaseInput>(
    index: number,
    key: K,
    value: CasebookCaseInput[K]
  ) => {
    setCasebook((current) => ({
      ...current,
      cases: current.cases.map((caseItem, caseIndex) =>
        caseIndex === index ? { ...caseItem, [key]: value } : caseItem
      ),
    }));
  };

  const changeLicense = (licenseKind: CasebookLicenseKind) => {
    setCasebook((current) => ({
      ...current,
      licenseKind,
      ...(licenseKind === 'link_only'
        ? { cases: current.cases.map((caseItem) => ({ ...caseItem, body: '' })) }
        : {}),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    const cleanedCasebook: CasebookInput = {
      ...casebook,
      title: casebook.title.trim(),
      sourceOrg: casebook.sourceOrg.trim(),
      description: casebook.description.trim(),
      permissionReference: casebook.permissionReference?.trim() ?? '',
      externalUrl: casebook.externalUrl?.trim() ?? '',
      industries: casebook.industries.map((industry) => industry.trim()).filter(Boolean),
      rightsConfirmed: true,
      attributionConfirmed: true,
      cases: casebook.cases.map((caseItem, position) => ({
        ...caseItem,
        title: caseItem.title.trim(),
        firm: caseItem.firm?.trim() || null,
        sector: caseItem.sector.trim(),
        caseType: caseItem.caseType || null,
        summary: caseItem.summary.trim(),
        body: casebook.licenseKind === 'link_only' ? '' : caseItem.body?.trim() ?? '',
        position,
        practiceCaseId: caseItem.practiceCaseId?.trim() || null,
      })),
    };

    try {
      if (casebookId) {
        await updateCasebook(casebookId, cleanedCasebook);
      } else {
        await submitCasebook(cleanedCasebook);
      }
      navigate('/contribute/casebooks/mine', { state: { submitted: true } });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit this casebook');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading casebook…</p></PageWrapper>;
  }

  if (casebookId && error) {
    return (
      <PageWrapper>
        <p className="max-w-xl border-y border-[var(--border-subtle)] py-5 text-sm text-[var(--text-primary)]" role="alert">{error}</p>
        <Link to="/contribute/casebooks/mine" className="mt-4 inline-flex text-sm text-[var(--text-primary)] underline underline-offset-4">
          Back to my casebooks
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-5xl">
      <Link to="/casebooks" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Casebooks
      </Link>
      <header className="mb-8 mt-6 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {casebookId ? 'Revise your casebook' : 'Contribute a casebook'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Share source details and your own case summaries. A moderator reviews each entry before it becomes public. Casebooks are reading material, not scored practice.
        </p>
        <Link to="/contribute/casebooks/mine" className="mt-3 inline-flex text-sm text-[var(--text-primary)] underline underline-offset-4">
          View my casebooks
        </Link>
      </header>

      {moderatorNotes && (
        <div className="mb-7 border-y border-[var(--border-subtle)] py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Moderator feedback</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{moderatorNotes}</p>
        </div>
      )}

      {error && <p className="mb-6 border-y border-[var(--border-subtle)] py-4 text-sm text-[var(--text-primary)]" role="alert">{error}</p>}

      <form className="space-y-9" onSubmit={handleSubmit}>
        <section className="grid gap-5 border-b border-[var(--border-subtle)] pb-8 md:grid-cols-[minmax(180px,0.75fr)_minmax(0,1.5fr)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Source and rights</h2>
            <p className={helpClass}>Only submit material you have permission to host. Otherwise, add metadata and link to the original source.</p>
          </div>
          <div className="space-y-5">
            <label className={labelClass}>
              Casebook title
              <input className={fieldClass} required minLength={3} maxLength={255} value={casebook.title} onChange={(event) => setField('title', event.target.value)} />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Source organization
                <input className={fieldClass} required minLength={2} maxLength={255} value={casebook.sourceOrg} onChange={(event) => setField('sourceOrg', event.target.value)} />
              </label>
              <label className={labelClass}>
                Source type
                <select className={fieldClass} value={casebook.sourceKind} onChange={(event) => setField('sourceKind', event.target.value as CasebookSourceKind)}>
                  <option value="university">University</option>
                  <option value="company">Company</option>
                  <option value="club">Club</option>
                  <option value="original">Original</option>
                </select>
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Year
                <input className={fieldClass} type="number" min={1800} max={2200} value={casebook.year ?? ''} onChange={(event) => setField('year', event.target.value ? Number(event.target.value) : null)} />
              </label>
              <label className={labelClass}>
                Industries, separated by commas
                <input className={fieldClass} required value={casebook.industries.join(', ')} onChange={(event) => setField('industries', event.target.value.split(',').map((industry) => industry.trim()).filter(Boolean))} />
              </label>
            </div>
            <label className={labelClass}>
              Short description in your own words
              <textarea className={fieldClass} required minLength={20} maxLength={3000} rows={3} value={casebook.description} onChange={(event) => setField('description', event.target.value)} />
            </label>
            <label className={labelClass}>
              Rights status
              <select className={fieldClass} value={casebook.licenseKind} onChange={(event) => changeLicense(event.target.value as CasebookLicenseKind)}>
                <option value="original">Original authorship</option>
                <option value="permission">Permission recorded</option>
                <option value="open_license">Open license</option>
                <option value="link_only">Link to original; do not host source text</option>
              </select>
            </label>
            {casebook.licenseKind === 'link_only' ? (
              <label className={labelClass}>
                Original source URL
                <input className={fieldClass} type="url" required maxLength={2000} value={casebook.externalUrl ?? ''} onChange={(event) => setField('externalUrl', event.target.value)} />
              </label>
            ) : (
              <label className={labelClass}>
                Permission, license, or authorship reference
                <textarea className={fieldClass} required minLength={1} maxLength={1000} rows={3} value={casebook.permissionReference ?? ''} onChange={(event) => setField('permissionReference', event.target.value)} />
              </label>
            )}
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] pb-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Case entries</h2>
              <p className={helpClass}>Add metadata and summaries in your own words. PDFs are not accepted.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={casebook.cases.length >= 100}
              onClick={() => setCasebook((current) => ({ ...current, cases: [...current.cases, newCase(current.cases.length)] }))}
            >
              Add a case
            </Button>
          </div>
          <div className="space-y-8">
            {casebook.cases.map((caseItem, index) => (
              <fieldset key={index} className="grid gap-5 border-t border-[var(--border-subtle)] pt-5 md:grid-cols-2">
                <legend className="sr-only">Case {index + 1}</legend>
                <label className={labelClass}>
                  Case title
                  <input className={fieldClass} required minLength={2} maxLength={255} value={caseItem.title} onChange={(event) => setCaseField(index, 'title', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Firm (optional)
                  <input className={fieldClass} maxLength={255} value={caseItem.firm ?? ''} onChange={(event) => setCaseField(index, 'firm', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Sector
                  <input className={fieldClass} required minLength={2} maxLength={100} value={caseItem.sector} onChange={(event) => setCaseField(index, 'sector', event.target.value)} />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    Case type (optional)
                    <select className={fieldClass} value={caseItem.caseType ?? ''} onChange={(event) => setCaseField(index, 'caseType', event.target.value || null)}>
                      <option value="">Not specified</option>
                      {PROBLEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Difficulty
                    <select className={fieldClass} value={caseItem.difficulty} onChange={(event) => setCaseField(index, 'difficulty', event.target.value)}>
                      <option value="Standard">Standard</option>
                      <option value="High">High</option>
                      <option value="Chaos">Chaos</option>
                    </select>
                  </label>
                </div>
                <label className={`${labelClass} md:col-span-2`}>
                  Case summary in your own words
                  <textarea className={fieldClass} required minLength={20} maxLength={1500} rows={4} value={caseItem.summary} onChange={(event) => setCaseField(index, 'summary', event.target.value)} />
                </label>
                {casebook.licenseKind !== 'link_only' && (
                  <label className={`${labelClass} md:col-span-2`}>
                    Hosted case text (optional)
                    <textarea className={fieldClass} maxLength={50000} rows={8} value={caseItem.body ?? ''} onChange={(event) => setCaseField(index, 'body', event.target.value)} />
                  </label>
                )}
                <label className={labelClass}>
                  Similar practice case ID (optional)
                  <input className={fieldClass} maxLength={255} value={caseItem.practiceCaseId ?? ''} onChange={(event) => setCaseField(index, 'practiceCaseId', event.target.value)} />
                </label>
                {casebook.cases.length > 1 && (
                  <div className="flex items-end">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setCasebook((current) => ({
                      ...current,
                      cases: current.cases.filter((_, caseIndex) => caseIndex !== index).map((item, position) => ({ ...item, position })),
                    }))}>
                      Remove case
                    </Button>
                  </div>
                )}
              </fieldset>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-primary)]">
            <input className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" type="checkbox" required checked={casebook.rightsConfirmed} onChange={(event) => setField('rightsConfirmed', event.target.checked)} />
            <span>I confirm I have the rights to host the submitted text, or I have selected link-only and included no source text.</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-primary)]">
            <input className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" type="checkbox" required checked={casebook.attributionConfirmed} onChange={(event) => setField('attributionConfirmed', event.target.checked)} />
            <span>I confirm the source and attribution details are accurate and each summary is written in my own words.</span>
          </label>
          <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-5">
            <Button type="submit" size="sm" loading={isSaving}>
              {casebookId ? 'Resubmit casebook' : 'Submit for review'}
            </Button>
            <Button size="sm" variant="secondary" as="a" href="/contribute/casebooks/mine">
              Cancel
            </Button>
          </div>
        </section>
      </form>
    </PageWrapper>
  );
};
