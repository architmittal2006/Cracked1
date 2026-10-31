import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getCaseProposalQueue, reviewCaseProposal } from '../services/api';
import type { CaseProposal } from '../services/api';

export const CaseModerationPage: React.FC = () => {
  const [proposals, setProposals] = useState<CaseProposal[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    setError(null);
    setIsLoading(true);
    try {
      setProposals(await getCaseProposalQueue());
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const decide = async (
    proposalId: string,
    action: 'approve' | 'request_changes' | 'decline'
  ) => {
    const feedback = notes[proposalId]?.trim() ?? '';
    if (action !== 'approve' && feedback.length < 10) {
      setError('Add at least 10 characters of feedback before requesting changes or declining.');
      return;
    }
    setError(null);
    setBusyId(proposalId);
    try {
      await reviewCaseProposal(proposalId, action, feedback);
      setProposals((current) => current.filter((proposal) => proposal.id !== proposalId));
      setNotes((current) => {
        const next = { ...current };
        delete next[proposalId];
        return next;
      });
    } catch (reviewError: unknown) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not apply the decision');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageWrapper className="max-w-6xl">
      <header className="mb-7 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Case proposal review</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review the public brief and private evaluation notes. Approval publishes only the case brief, data, and deliverables.
        </p>
      </header>

      {error && <p className="mb-5 border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-[var(--text-primary)]" role="alert">{error}</p>}
      {isLoading && <p className="py-6 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading proposals…</p>}
      {!isLoading && proposals.length === 0 && !error && (
        <p className="border-y border-[var(--border-subtle)] py-7 text-sm text-[var(--text-secondary)]">The review queue is clear.</p>
      )}

      <div className="space-y-7">
        {proposals.map((proposal) => (
          <article key={proposal.id} className="border-b border-[var(--border-subtle)] pb-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{proposal.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {proposal.type} · {proposal.sector} · {proposal.difficulty} · by {proposal.contributorName}
                </p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Submitted {new Date(proposal.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Public brief</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{proposal.context}</p>
                <h4 className="mt-4 text-sm font-medium text-[var(--text-primary)]">Question</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{proposal.prompt}</p>
                {proposal.exhibits && (
                  <>
                    <h4 className="mt-4 text-sm font-medium text-[var(--text-primary)]">Available information</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{proposal.exhibits}</p>
                  </>
                )}
                <h4 className="mt-4 text-sm font-medium text-[var(--text-primary)]">Expected deliverables</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
                  {proposal.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}
                </ul>
              </section>
              <section className="border-t border-[var(--border-subtle)] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Source and private reviewer guide</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {proposal.sourceKind === 'original' ? 'Original case' : proposal.sourceKind === 'interview_recollection' ? 'Interview recollection' : 'Public source'}
                  {proposal.sourceReference ? ` · ${proposal.sourceReference}` : ''}
                </p>
                {proposal.referenceRange && (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Private reference range: {proposal.referenceRange.low}–{proposal.referenceRange.high} {proposal.referenceRange.unit} (reference estimate {proposal.referenceRange.value})
                  </p>
                )}
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{proposal.reviewerGuide}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)] underline underline-offset-4">
                    Private solution outline
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{proposal.solutionOutline}</p>
                </details>
              </section>
            </div>

            <div className="mt-5 max-w-3xl">
              <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor={`moderator-notes-${proposal.id}`}>
                Feedback to contributor <span className="font-normal text-[var(--text-secondary)]">(required for changes or decline)</span>
              </label>
              <textarea
                id={`moderator-notes-${proposal.id}`}
                className="input-field mt-2 w-full"
                rows={3}
                maxLength={3000}
                value={notes[proposal.id] ?? ''}
                onChange={(event) => setNotes((current) => ({ ...current, [proposal.id]: event.target.value }))}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" loading={busyId === proposal.id} disabled={Boolean(busyId)} onClick={() => void decide(proposal.id, 'approve')}>
                Approve and publish
              </Button>
              <Button size="sm" variant="secondary" loading={busyId === proposal.id} disabled={Boolean(busyId)} onClick={() => void decide(proposal.id, 'request_changes')}>
                Request changes
              </Button>
              <Button size="sm" variant="ghost" loading={busyId === proposal.id} disabled={Boolean(busyId)} onClick={() => void decide(proposal.id, 'decline')}>
                Decline
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!isLoading && error?.includes('Moderator access') && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Moderators are configured by a server administrator.
        </p>
      )}
    </PageWrapper>
  );
};
