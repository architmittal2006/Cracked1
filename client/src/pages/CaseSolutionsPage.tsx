import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Case } from '../data/mockData';
import { Button } from '../components/Button';
import { PageWrapper } from '../components/PageWrapper';
import { getCaseById, getCaseSolutions } from '../services/api';
import type { CaseSolution } from '../services/api';

export const CaseSolutionsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [solutions, setSolutions] = useState<CaseSolution[]>([]);
  const [accessRequired, setAccessRequired] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoadError('Case not found');
      setIsLoading(false);
      return;
    }
    let isCurrent = true;

    const load = async () => {
      try {
        const loadedCase = await getCaseById(id);
        if (!loadedCase) {
          if (isCurrent) setLoadError('Case not found');
          return;
        }
        if (isCurrent) setCaseData(loadedCase);

        try {
          const caseSolutions = await getCaseSolutions(id);
          if (isCurrent) setSolutions(caseSolutions);
        } catch (error) {
          if (!isCurrent) return;
          if (error instanceof Error && error.message === 'Submit a solution to compare other approaches') {
            setAccessRequired(true);
          } else {
            setLoadError(error instanceof Error ? error.message : 'Could not load case solutions');
          }
        }
      } catch (error) {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Could not load this case');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void load();
    return () => { isCurrent = false; };
  }, [id]);

  if (isLoading) {
    return <PageWrapper><p className="py-10 text-sm text-[var(--text-secondary)]" aria-live="polite">Loading solutions…</p></PageWrapper>;
  }

  if (loadError || !caseData) {
    return (
      <PageWrapper>
        <div className="py-10" role="alert">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Solutions could not be loaded</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{loadError ?? 'Case not found'}</p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/cases')} className="mt-5">Back to cases</Button>
        </div>
      </PageWrapper>
    );
  }

  if (accessRequired) {
    return (
      <PageWrapper>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${caseData.id}`)} className="mb-5 inline-flex gap-2">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to case
        </Button>
        <div className="max-w-2xl border-y border-[var(--border-subtle)] py-8">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Solve it before comparing</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Submit your own approach first. Then you can read other learners’ solutions and compare perspectives.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate(`/cases/${caseData.id}/submit`)} className="mt-5">
            Write your solution
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${caseData.id}`)} className="mb-5 inline-flex gap-2">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to case
      </Button>
      <header className="mb-8 border-b border-[var(--border-subtle)] pb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Compare solutions</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{caseData.title}</p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Explore other learners’ approaches. Solutions are shown without author names so you can focus on the reasoning.
        </p>
      </header>

      {solutions.length === 0 ? (
        <div className="border-y border-[var(--border-subtle)] py-8">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <FileText aria-hidden="true" className="h-5 w-5 text-[var(--text-secondary)]" />
            <h2 className="font-medium">No other solutions yet</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            No one else has submitted a solution for this case yet. Other perspectives will appear here as learners participate.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {solutions.map((solution, index) => (
            <article key={solution.id} className="py-6 first:pt-0">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Approach {index + 1}</h2>
                <time className="text-xs text-[var(--text-secondary)]" dateTime={solution.createdAt}>
                  {new Date(solution.createdAt).toLocaleDateString()}
                </time>
              </div>
              <div className="space-y-5">
                {Object.entries(solution.content).map(([section, content]) => (
                  <section key={section}>
                    <h3 className="text-sm font-medium capitalize text-[var(--text-primary)]">{section.replaceAll('_', ' ')}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{content}</p>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};
