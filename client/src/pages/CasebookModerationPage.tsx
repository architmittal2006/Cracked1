import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getCasebookModerationQueue, reviewCasebook } from '../services/api';
import type { Casebook } from '../services/api';

type QueueStatus = 'Pending' | 'Published';
type ReviewAction = 'approve' | 'request_changes' | 'decline' | 'take_down';

export const CasebookModerationPage: React.FC = () => {
  const [status, setStatus] = useState<QueueStatus>('Pending');
  const [casebooks, setCasebooks] = useState<Casebook[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    getCasebookModerationQueue(status)
      .then((items) => { if (isCurrent) setCasebooks(items); })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load the casebook review queue');
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [status, retry]);

  const decide = async (id: string, action: ReviewAction) => {
    const feedback = notes[id]?.trim() ?? '';
    if (action !== 'approve' && feedback.length < 10) {
      setError('Add at least 10 characters of feedback before requesting changes, declining, or taking down a casebook.');
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      await reviewCasebook(id, action, feedback);
      setCasebooks((current) => current.filter((casebook) => casebook.id !== id));
      setNotes((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (reviewError: unknown) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not apply the casebook decision');
    } finally {
      setBusyId(null);
    }
  };

  const isModeratorError = error?.includes('Moderator access is required');

  return (
    <PageWrapper className="max-w-6xl">
      <header className="mb-7 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Casebook review</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Check attribution and rights details before approval. Only approved casebooks appear in the public reading library.
        </p>
      </header>

      <label className="mb-5 block max-w-xs text-sm font-medium text-[var(--text-primary)]">
        Queue
        <select className="input-field mt-2 w-full" value={status} onChange={(event) => setStatus(event.target.value as QueueStatus)}>
          <option value="Pending">Pending review</option>
          <option value="Published">Published casebooks</option>
        </select>
      </label>

      {error && (
        <div className="mb-5 border-y border-[var(--border-subtle)] py-4" role="alert">
          <p className="text-sm text-[var(--text-primary)]">{isModeratorError ? error : 'The casebook review queue could not be loaded.'}</p>
          {!isModeratorError && <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>}
          <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => setRetry((count) => count + 1)}>Try again</Button>
          {isModeratorError && <p className="mt-3 text-sm text-[var(--text-secondary)]">Moderators are configured by a server administrator.</p>}
        </div>
      )}
      {isLoading && <p className="py-6 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading casebooks…</p>}
      {!isLoading && !error && casebooks.length === 0 && (
        <p className="border-y border-[var(--border-subtle)] py-7 text-sm text-[var(--text-secondary)]">
          {status === 'Pending' ? 'The casebook review queue is clear.' : 'No published casebooks are available to review.'}
        </p>
      )}

      <div className="space-y-8">
        {casebooks.map((casebook) => (
          <article key={casebook.id} className="border-b border-[var(--border-subtle)] pb-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{casebook.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {casebook.sourceOrg}{casebook.year ? ` · ${casebook.year}` : ''} · {casebook.sourceKind} · {casebook.caseCount} {casebook.caseCount === 1 ? 'case' : 'cases'} · by {casebook.uploaderName}
                </p>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{casebook.status}</span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Description and rights</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{casebook.description}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[var(--text-secondary)]">Rights status</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">{casebook.licenseKind}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-secondary)]">Industries</dt>
                    <dd className="mt-1 text-[var(--text-primary)]">{casebook.industries.join(', ')}</dd>
                  </div>
                  {casebook.permissionReference && (
                    <div className="sm:col-span-2">
                      <dt className="text-[var(--text-secondary)]">Attribution or permission reference</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">{casebook.permissionReference}</dd>
                    </div>
                  )}
                  {casebook.externalUrl && (
                    <div className="sm:col-span-2">
                      <dt className="text-[var(--text-secondary)]">External source</dt>
                      <dd className="mt-1 break-all text-[var(--text-primary)]">{casebook.externalUrl}</dd>
                    </div>
                  )}
                </dl>
              </section>
              <section className="border-t border-[var(--border-subtle)] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Case summaries</h3>
                <div className="mt-3 space-y-4">
                  {casebook.cases?.map((caseItem) => (
                    <div key={caseItem.id} className="border-b border-[var(--border-subtle)] pb-4 last:border-0">
                      <h4 className="text-sm font-medium text-[var(--text-primary)]">{caseItem.title}</h4>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{caseItem.sector}{caseItem.caseType ? ` · ${caseItem.caseType}` : ''} · {caseItem.difficulty}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{caseItem.summary}</p>
                      {caseItem.body && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-[var(--text-primary)] underline underline-offset-4">View proposed hosted text</summary>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{caseItem.body}</p>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-5 max-w-3xl">
              <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor={`casebook-notes-${casebook.id}`}>
                Feedback <span className="font-normal text-[var(--text-secondary)]">(required for all actions except approval)</span>
              </label>
              <textarea
                id={`casebook-notes-${casebook.id}`}
                className="input-field mt-2 w-full"
                rows={3}
                maxLength={3000}
                value={notes[casebook.id] ?? ''}
                onChange={(event) => setNotes((current) => ({ ...current, [casebook.id]: event.target.value }))}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {status === 'Pending' ? (
                <>
                  <Button size="sm" variant="primary" loading={busyId === casebook.id} disabled={Boolean(busyId)} onClick={() => void decide(casebook.id, 'approve')}>
                    Approve and publish
                  </Button>
                  <Button size="sm" variant="secondary" loading={busyId === casebook.id} disabled={Boolean(busyId)} onClick={() => void decide(casebook.id, 'request_changes')}>
                    Request changes
                  </Button>
                  <Button size="sm" variant="ghost" loading={busyId === casebook.id} disabled={Boolean(busyId)} onClick={() => void decide(casebook.id, 'decline')}>
                    Decline
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="secondary" loading={busyId === casebook.id} disabled={Boolean(busyId)} onClick={() => void decide(casebook.id, 'take_down')}>
                  Take down
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </PageWrapper>
  );
};
