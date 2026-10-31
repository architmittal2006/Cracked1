import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import {
  getCaseProposal,
  submitCaseProposal,
  updateCaseProposal,
} from '../services/api';
import type { CaseProposalInput } from '../services/api';
import { PROBLEM_TYPES } from '../data/mockData';

const emptyProposal: CaseProposalInput = {
  title: '',
  type: 'Profitability',
  sector: '',
  difficulty: 'Standard',
  sourceKind: 'original',
  sourceReference: '',
  context: '',
  prompt: '',
  exhibits: '',
  deliverables: [''],
  reviewerGuide: '',
  solutionOutline: '',
  referenceRange: undefined,
  originalityConfirmed: false,
  confidentialityConfirmed: false,
};

const fieldClass = 'input-field mt-2 w-full';
const labelClass = 'block text-sm font-medium text-[var(--text-primary)]';
const helpClass = 'mt-1.5 text-xs leading-5 text-[var(--text-secondary)]';

export const CaseProposalPage: React.FC = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<CaseProposalInput>(emptyProposal);
  const [rangeDraft, setRangeDraft] = useState({ value: '', unit: '', low: '', high: '' });
  const [isLoading, setIsLoading] = useState(Boolean(proposalId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) return;
    let isCurrent = true;
    getCaseProposal(proposalId)
      .then((savedProposal) => {
        if (!isCurrent) return;
        if (savedProposal.status !== 'Changes_Requested') {
          setError('This proposal is not awaiting changes.');
          return;
        }
        setProposal({
          title: savedProposal.title,
          type: savedProposal.type,
          sector: savedProposal.sector,
          difficulty: savedProposal.difficulty,
          sourceKind: savedProposal.sourceKind,
          sourceReference: savedProposal.sourceReference ?? '',
          context: savedProposal.context,
          prompt: savedProposal.prompt,
          exhibits: savedProposal.exhibits ?? '',
          deliverables: savedProposal.deliverables,
          reviewerGuide: savedProposal.reviewerGuide,
          solutionOutline: savedProposal.solutionOutline,
          referenceRange: savedProposal.referenceRange ?? undefined,
          originalityConfirmed: true,
          confidentialityConfirmed: true,
        });
        if (savedProposal.referenceRange) {
          setRangeDraft({
            value: String(savedProposal.referenceRange.value),
            unit: savedProposal.referenceRange.unit,
            low: String(savedProposal.referenceRange.low),
            high: String(savedProposal.referenceRange.high),
          });
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load this proposal');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [proposalId]);

  const setField = <K extends keyof CaseProposalInput>(key: K, value: CaseProposalInput[K]) => {
    setProposal((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const rangeValues = Object.values(rangeDraft);
      const hasRange = rangeValues.some((value) => value.trim() !== '');
      if (proposal.type === 'Guesstimate' && hasRange) {
        if (rangeValues.some((value) => value.trim() === '') ||
          ![rangeDraft.value, rangeDraft.low, rangeDraft.high].every((value) => Number.isFinite(Number(value))) ||
          Number(rangeDraft.low) > Number(rangeDraft.value) ||
          Number(rangeDraft.value) > Number(rangeDraft.high)) {
          setError('Complete the optional reference range and ensure low ≤ value ≤ high.');
          setIsSaving(false);
          return;
        }
      }
      const cleanedProposal = {
        ...proposal,
        referenceRange: proposal.type === 'Guesstimate' && hasRange
          ? { value: Number(rangeDraft.value), unit: rangeDraft.unit.trim(), low: Number(rangeDraft.low), high: Number(rangeDraft.high) }
          : undefined,
        deliverables: proposal.deliverables.map((item) => item.trim()).filter(Boolean),
      };
      if (proposalId) {
        await updateCaseProposal(proposalId, cleanedProposal);
      } else {
        await submitCaseProposal(cleanedProposal);
      }
      navigate('/contribute/cases/mine', { state: { submitted: true } });
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your proposal');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]">Loading proposal…</p></PageWrapper>;
  }

  if (proposalId && error) {
    return (
      <PageWrapper>
        <p className="max-w-xl border-y border-rose-500/30 py-5 text-sm text-[var(--text-primary)]" role="alert">{error}</p>
        <Link to="/contribute/cases/mine" className="mt-4 inline-flex text-sm text-[var(--text-primary)] underline underline-offset-4">
          Back to my proposals
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-5xl">
      <Link to="/cases" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Case library
      </Link>
      <header className="mb-8 mt-6 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {proposalId ? 'Revise your case proposal' : 'Propose a case'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Share an original, solvable case. A moderator reviews the public brief and private evaluation guide before anything is published.
        </p>
      </header>

      {error && (
        <p className="mb-6 border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <form className="space-y-9" onSubmit={handleSubmit}>
        <section className="grid gap-5 border-b border-[var(--border-subtle)] pb-8 md:grid-cols-[minmax(180px,0.75fr)_minmax(0,1.5fr)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Case details</h2>
            <p className={helpClass}>Give solvers enough context to understand the situation and its scope.</p>
          </div>
          <div className="space-y-5">
            <label className={labelClass}>
              Case title
              <input className={fieldClass} required minLength={8} maxLength={120} value={proposal.title} onChange={(event) => setField('title', event.target.value)} />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Problem type
                <select className={fieldClass} value={proposal.type} onChange={(event) => setField('type', event.target.value)}>
                  {PROBLEM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Sector
                <input className={fieldClass} required minLength={2} maxLength={80} value={proposal.sector} onChange={(event) => setField('sector', event.target.value)} placeholder="For example, healthcare" />
              </label>
            </div>
            <label className={labelClass}>
              Difficulty
              <select className={fieldClass} value={proposal.difficulty} onChange={(event) => setField('difficulty', event.target.value)}>
                <option value="Standard">Standard</option>
                <option value="High">High</option>
                <option value="Chaos">Chaos</option>
              </select>
            </label>
            {proposal.type === 'Guesstimate' && (
              <fieldset className="space-y-3 rounded-md border border-[var(--border-subtle)] p-4">
                <legend className="px-1 text-sm font-medium text-[var(--text-primary)]">Optional reference range</legend>
                <p className={helpClass}>This remains hidden from learners until they submit. Reviewers only receive an out-of-range hint.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['value', 'unit', 'low', 'high'] as const).map((field) => (
                    <label key={field} className={labelClass}>
                      {field === 'value' ? 'Reference estimate' : field === 'unit' ? 'Unit' : `Reference ${field}`}
                      <input
                        className={fieldClass}
                        type={field === 'unit' ? 'text' : 'number'}
                        min={field === 'unit' ? undefined : 0}
                        step={field === 'unit' ? undefined : 'any'}
                        value={rangeDraft[field]}
                        onChange={(event) => setRangeDraft((current) => ({ ...current, [field]: event.target.value }))}
                      />
                    </label>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRangeDraft({ value: '', unit: '', low: '', high: '' })}>
                  Clear reference range
                </Button>
              </fieldset>
            )}
          </div>
        </section>

        <section className="grid gap-5 border-b border-[var(--border-subtle)] pb-8 md:grid-cols-[minmax(180px,0.75fr)_minmax(0,1.5fr)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Public case brief</h2>
            <p className={helpClass}>This is the information solvers will see. Keep the task concrete and answerable.</p>
          </div>
          <div className="space-y-5">
            <label className={labelClass}>
              Situation and context
              <textarea className={fieldClass} required minLength={50} maxLength={5000} rows={6} value={proposal.context} onChange={(event) => setField('context', event.target.value)} />
              <span className={helpClass}>At least 50 characters. Include relevant facts, timing, and constraints.</span>
            </label>
            <label className={labelClass}>
              The question to solve
              <textarea className={fieldClass} required minLength={40} maxLength={5000} rows={5} value={proposal.prompt} onChange={(event) => setField('prompt', event.target.value)} placeholder="What decision should the solver make, and what should their answer address?" />
            </label>
            <label className={labelClass}>
              Available data or exhibits <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
              <textarea className={fieldClass} maxLength={5000} rows={4} value={proposal.exhibits} onChange={(event) => setField('exhibits', event.target.value)} placeholder="Provide data in readable text or describe the exhibits needed to solve the case." />
            </label>
            <label className={labelClass}>
              Expected deliverables
              <textarea
                className={fieldClass}
                required
                rows={3}
                value={proposal.deliverables.join('\n')}
                onChange={(event) => setField('deliverables', event.target.value.split('\n'))}
                placeholder={'Problem framing memo\nRecommendation with supporting analysis'}
              />
              <span className={helpClass}>One deliverable per line, up to 8.</span>
            </label>
          </div>
        </section>

        <section className="grid gap-5 border-b border-[var(--border-subtle)] pb-8 md:grid-cols-[minmax(180px,0.75fr)_minmax(0,1.5fr)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Source and evaluation</h2>
            <p className={helpClass}>The source and private guidance help moderators assess originality and review quality.</p>
          </div>
          <div className="space-y-5">
            <label className={labelClass}>
              Case source
              <select className={fieldClass} value={proposal.sourceKind} onChange={(event) => setField('sourceKind', event.target.value as CaseProposalInput['sourceKind'])}>
                <option value="original">Original case I created</option>
                <option value="interview_recollection">Interview recollection, paraphrased from memory</option>
                <option value="public_source">Public source</option>
              </select>
            </label>
            {proposal.sourceKind !== 'original' && (
              <label className={labelClass}>
                Source note or public citation
                <input className={fieldClass} required={proposal.sourceKind === 'public_source'} maxLength={500} value={proposal.sourceReference} onChange={(event) => setField('sourceReference', event.target.value)} placeholder={proposal.sourceKind === 'public_source' ? 'URL or citation' : 'Optional context; do not name confidential clients or interviewers'} />
              </label>
            )}
            <label className={labelClass}>
              Reviewer guide
              <textarea className={fieldClass} required minLength={50} maxLength={3000} rows={5} value={proposal.reviewerGuide} onChange={(event) => setField('reviewerGuide', event.target.value)} placeholder="What should a strong response demonstrate? Which assumptions or common errors should reviewers watch for?" />
            </label>
            <label className={labelClass}>
              Private solution outline
              <textarea className={fieldClass} required minLength={50} maxLength={5000} rows={6} value={proposal.solutionOutline} onChange={(event) => setField('solutionOutline', event.target.value)} placeholder="Outline a defensible approach and key reasoning. This will only be visible to moderators." />
              <span className={helpClass}>This guide is stored separately and is never included in the published case.</span>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-secondary)]">
            <input className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" type="checkbox" required checked={proposal.originalityConfirmed} onChange={(event) => setField('originalityConfirmed', event.target.checked)} />
            <span>I created this case or have the right to share it, and it does not reproduce another source’s protected content.</span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--text-secondary)]">
            <input className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" type="checkbox" required checked={proposal.confidentialityConfirmed} onChange={(event) => setField('confidentialityConfirmed', event.target.checked)} />
            <span>I have removed confidential, personal, and proprietary information. Interview recollections are paraphrased from memory and do not imply company endorsement.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" variant="primary" size="md" loading={isSaving}>
              {proposalId ? 'Resubmit for review' : 'Submit proposal'}
            </Button>
            <Link to="/contribute/cases/mine" className="inline-flex h-11 items-center px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              View my proposals
            </Link>
            <p className="w-full text-xs text-[var(--text-secondary)]">Proposals are private until a moderator approves them.</p>
          </div>
        </section>
      </form>
    </PageWrapper>
  );
};
