import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageWrapper } from '../components/PageWrapper';
import { SEO } from '../components/SEO';
import { getCasebookBySlug } from '../services/api';
import type { Casebook } from '../services/api';

const sourceLabels: Record<Casebook['sourceKind'], string> = {
  university: 'University',
  company: 'Company',
  club: 'Club',
  original: 'Original',
};

const licenseLabels: Record<Casebook['licenseKind'], string> = {
  original: 'Original authorship',
  permission: 'Permission recorded',
  open_license: 'Open license',
  link_only: 'Link to original source',
};

export const CasebookDetailPage: React.FC = () => {
  const { slug } = useParams();
  const [casebook, setCasebook] = useState<Casebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    getCasebookBySlug(slug)
      .then((result) => { if (isCurrent) setCasebook(result); })
      .catch((loadError: unknown) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load this casebook');
      })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [slug, retry]);

  if (isLoading) {
    return <PageWrapper><p className="py-8 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading casebook…</p></PageWrapper>;
  }
  if (error || !casebook) {
    return (
      <PageWrapper>
        <SEO title="Casebook" description="Read attributed casebooks and case summaries." ogUrl={`/casebooks/${slug ?? ''}`} />
        <div className="border-y border-[var(--border-subtle)] py-8" role={error ? 'alert' : undefined}>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{error ? 'Casebook could not be loaded' : 'Casebook not found'}</h1>
          {error && <p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {error && <Button type="button" size="sm" variant="secondary" onClick={() => setRetry((count) => count + 1)}>Try again</Button>}
            <Button size="sm" variant="ghost" as="a" href="/casebooks">Back to casebooks</Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <SEO
        title={casebook.title}
        description={casebook.description}
        ogUrl={`/casebooks/${casebook.slug}`}
      />
      <PageWrapper className="max-w-5xl">
        <Link to="/casebooks" className="text-sm text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]">
          All casebooks
        </Link>
        <header className="mb-7 mt-5 border-b border-[var(--border-subtle)] pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">{casebook.title}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {casebook.sourceOrg}{casebook.year ? ` · ${casebook.year}` : ''} · {sourceLabels[casebook.sourceKind]} · {casebook.caseCount} {casebook.caseCount === 1 ? 'case' : 'cases'}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-primary)]">{casebook.description}</p>
        </header>

        <Card padding="p-5" className="mb-7">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Attribution and rights</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--text-secondary)]">Source</dt>
              <dd className="mt-1 text-[var(--text-primary)]">{casebook.sourceOrg}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-secondary)]">Rights status</dt>
              <dd className="mt-1 text-[var(--text-primary)]">{licenseLabels[casebook.licenseKind]}</dd>
            </div>
            {casebook.permissionReference && (
              <div className="sm:col-span-2">
                <dt className="text-[var(--text-secondary)]">Attribution or permission note</dt>
                <dd className="mt-1 whitespace-pre-wrap text-[var(--text-primary)]">{casebook.permissionReference}</dd>
              </div>
            )}
            {casebook.externalUrl && (
              <div className="sm:col-span-2">
                <dt className="text-[var(--text-secondary)]">Original source</dt>
                <dd className="mt-1">
                  <a href={casebook.externalUrl} target="_blank" rel="noreferrer" className="break-all text-[var(--text-primary)] underline underline-offset-4">
                    Open the original source
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Cases in this casebook</h2>
          {casebook.cases?.length ? (
            <ol className="mt-3 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {casebook.cases.map((caseItem, index) => (
                <li key={caseItem.id} className="py-5">
                  <p className="text-xs text-[var(--text-secondary)]">Case {index + 1}{caseItem.firm ? ` · ${caseItem.firm}` : ''} · {caseItem.sector}</p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                    <Link to={`/casebooks/${encodeURIComponent(casebook.slug)}/${encodeURIComponent(caseItem.slug)}`} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                      {caseItem.title}
                    </Link>
                  </h3>
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{caseItem.summary}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 border-y border-[var(--border-subtle)] py-6 text-sm text-[var(--text-secondary)]">
              No cases are listed in this casebook.
            </p>
          )}
        </section>
      </PageWrapper>
    </>
  );
};
