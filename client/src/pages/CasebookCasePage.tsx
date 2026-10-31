import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import {
  getCasebookBySlug,
  getCasebookCase,
  submitTakedownRequest,
} from '../services/api';
import type { Casebook, CasebookCase } from '../services/api';

export const CasebookCasePage: React.FC = () => {
  const { slug, caseSlug } = useParams();
  const [casebook, setCasebook] = useState<Casebook | null>(null);
  const [caseItem, setCaseItem] = useState<CasebookCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (!slug || !caseSlug) return;
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    Promise.all([getCasebookBySlug(slug), getCasebookCase(slug, caseSlug)])
      .then(([book, result]) => {
        if (!isCurrent) return;
        setCasebook(book);
        setCaseItem(result.caseItem);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load this case');
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [slug, caseSlug, retry]);

  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!casebook) return;
    setReportError(null);
    setIsSubmittingReport(true);
    try {
      await submitTakedownRequest({ casebookId: casebook.id, requesterEmail: email, reason });
      setReportSubmitted(true);
      setEmail('');
      setReason('');
    } catch (submitError: unknown) {
      setReportError(submitError instanceof Error ? submitError.message : 'Could not submit this report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return <PageWrapper><p className="py-8 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading case…</p></PageWrapper>;
  }
  if (error || !casebook || !caseItem) {
    return (
      <PageWrapper className="max-w-3xl">
        <SEO title="Casebook case" description="Read an attributed casebook case." ogUrl={`/casebooks/${slug ?? ''}/${caseSlug ?? ''}`} />
        <div className="border-y border-[var(--border-subtle)] py-8" role={error ? 'alert' : undefined}>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{error ? 'Case could not be loaded' : 'Case not found'}</h1>
          {error && <p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {error && <Button type="button" size="sm" variant="secondary" onClick={() => setRetry((count) => count + 1)}>Try again</Button>}
            <Button size="sm" variant="ghost" as="a" href="/casebooks">Back to casebooks</Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const index = casebook.cases?.findIndex((item) => item.slug === caseItem.slug) ?? -1;
  const previous = index > 0 ? casebook.cases?.[index - 1] : undefined;
  const next = index >= 0 ? casebook.cases?.[index + 1] : undefined;
  const practiceUrl = caseItem.practiceCaseId
    ? `/cases/${encodeURIComponent(caseItem.practiceCaseId)}`
    : `/cases?${new URLSearchParams({
      ...(caseItem.caseType ? { type: caseItem.caseType } : {}),
      sector: caseItem.sector,
    }).toString()}`;
  const content = caseItem.body?.trim() || caseItem.summary;
  const paragraphs = content.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <SEO title={caseItem.title} description={caseItem.summary} ogUrl={`/casebooks/${casebook.slug}/${caseItem.slug}`} />
      <PageWrapper className="max-w-3xl">
        <Link to={`/casebooks/${encodeURIComponent(casebook.slug)}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {casebook.title}
        </Link>
        <header className="mb-7 mt-5 border-b border-[var(--border-subtle)] pb-6">
          <p className="text-sm text-[var(--text-secondary)]">
            {casebook.sourceOrg}{casebook.year ? ` · ${casebook.year}` : ''} · {caseItem.sector}{caseItem.caseType ? ` · ${caseItem.caseType}` : ''}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">{caseItem.title}</h1>
          {caseItem.firm && <p className="mt-2 text-sm text-[var(--text-secondary)]">{caseItem.firm}</p>}
        </header>

        <Card padding="p-5" className="mb-7">
          <p className="text-xs font-semibold text-[var(--text-primary)]">Attribution</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {casebook.sourceOrg} · {casebook.licenseKind === 'link_only' ? 'Link to original source; no source text is hosted.' : casebook.permissionReference}
          </p>
          {casebook.licenseKind === 'link_only' && casebook.externalUrl && (
            <a href={casebook.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-[var(--text-primary)] underline underline-offset-4">
              Open original source
            </a>
          )}
        </Card>

        <article className="max-w-[65ch]">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Case summary</h2>
          <div className="space-y-4 text-base leading-7 text-[var(--text-primary)]">
            {paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-wrap">{paragraph}</p>)}
          </div>
        </article>

        <div className="mt-8 border-y border-[var(--border-subtle)] py-4">
          <Button size="sm" variant="primary" as="a" href={practiceUrl}>Try a similar case</Button>
        </div>

        <nav className="mt-5 flex items-center justify-between gap-4" aria-label="Cases in this casebook">
          {previous ? (
            <Link to={`/casebooks/${encodeURIComponent(casebook.slug)}/${encodeURIComponent(previous.slug)}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Previous case
            </Link>
          ) : <span />}
          {next && (
            <Link to={`/casebooks/${encodeURIComponent(casebook.slug)}/${encodeURIComponent(next.slug)}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]">
              Next case <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          )}
        </nav>

        <details id="takedown-form" className="mt-9 border-t border-[var(--border-subtle)] pt-5">
          <summary className="w-fit cursor-pointer text-sm text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]">
            Report a problem
          </summary>
          <div className="mt-4 max-w-xl">
            {reportSubmitted ? (
              <p className="text-sm text-[var(--text-primary)]" role="status">Your report was submitted for review.</p>
            ) : (
              <form className="space-y-4" onSubmit={(event) => void submitReport(event)}>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">Use this form to report a rights, attribution, or accuracy concern.</p>
                {reportError && <p className="text-sm text-[var(--text-primary)]" role="alert">{reportError}</p>}
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Email
                  <input className="input-field mt-1.5 w-full" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  What should we review?
                  <textarea className="input-field mt-1.5 w-full" required minLength={20} maxLength={2000} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} />
                </label>
                <Button type="submit" size="sm" loading={isSubmittingReport}>Submit report</Button>
              </form>
            )}
          </div>
        </details>
      </PageWrapper>
    </>
  );
};
