import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { SUBMISSION_TEMPLATES } from '../data/mockData';
import type { Case, SubmissionTemplateSection } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { createSubmission, getCaseById } from '../services/api';
import type { SubmissionResponse } from '../services/api';

interface GuesstimateAssumption {
  name: string;
  value: string;
  unit: string;
  rationale: string;
}

interface GuesstimateEstimate {
  value: string;
  unit: string;
  low: string;
  high: string;
}

function parseSegments(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((segment): segment is string => typeof segment === 'string') : [];
  } catch {
    return [];
  }
}

const blankAssumption = (): GuesstimateAssumption => ({ name: '', value: '', unit: '', rationale: '' });

function parseAssumptions(value: string): GuesstimateAssumption[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as GuesstimateAssumption[] : [];
  } catch {
    return [];
  }
}

function parseEstimate(value: string): GuesstimateEstimate {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object') return parsed as GuesstimateEstimate;
  } catch {
    // Incomplete form data is shown as blank inputs and rejected before submission.
  }
  return { value: '', unit: '', low: '', high: '' };
}

function isNumeric(value: string): boolean {
  return value.trim() !== '' && Number.isFinite(Number(value));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countSectionWords(section: SubmissionTemplateSection, value: string): number {
  if (section.inputKind === 'segments') {
    return countWords(parseSegments(value).join(' '));
  }
  if (section.inputKind === 'assumptions') {
    return countWords(parseAssumptions(value)
      .map(({ name, value: assumptionValue, unit, rationale }) =>
        `${name} ${assumptionValue} ${unit} ${rationale}`)
      .join(' '));
  }
  if (section.inputKind === 'estimate') {
    return countWords(Object.values(parseEstimate(value)).join(' '));
  }
  return countWords(value);
}

export const SubmitPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sections = useMemo(() => (caseData ? SUBMISSION_TEMPLATES[caseData.type] : []), [caseData]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [referenceRange, setReferenceRange] = useState<SubmissionResponse['referenceRange']>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isCurrent = true;
    getCaseById(id)
      .then((loadedCase) => {
        if (isCurrent) setCaseData(loadedCase);
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Could not load this case');
      })
      .finally(() => {
        if (isCurrent) setIsLoadingCase(false);
      });
    return () => { isCurrent = false; };
  }, [id]);

  useEffect(() => {
    if (!caseData) return;
    const initial: Record<string, string> = {};
    SUBMISSION_TEMPLATES[caseData.type].forEach((section) => {
      initial[section.key] = section.inputKind === 'assumptions'
        ? JSON.stringify([blankAssumption(), blankAssumption(), blankAssumption()])
        : section.inputKind === 'segments'
          ? JSON.stringify(['', ''])
        : section.inputKind === 'estimate'
          ? JSON.stringify({ value: '', unit: '', low: '', high: '' })
          : '';
    });
    setContent(initial);
  }, [caseData]);

  useEffect(() => {
    if (!caseData || submitted) return;
    const interval = setInterval(() => setLastSaved(new Date()), 60000);
    return () => clearInterval(interval);
  }, [caseData, submitted]);

  const sectionStatus = useMemo(() => {
    return sections.map(section => {
      const words = countSectionWords(section, content[section.key] ?? '');
      const wordLimit = section.wordLimit;
      const percentage = Math.min((words / wordLimit) * 100, 100);
      let structuredValid = true;
      if (section.inputKind === 'segments') {
        structuredValid = parseSegments(content[section.key] ?? '').some((segment) => segment.trim() !== '');
      } else if (section.inputKind === 'assumptions') {
        const assumptions = parseAssumptions(content[section.key] ?? '');
        structuredValid = assumptions.length >= 3 && assumptions.every((assumption) =>
          assumption.name.trim() && isNumeric(assumption.value) && assumption.unit.trim() && assumption.rationale.trim()
        );
      } else if (section.inputKind === 'estimate') {
        const estimate = parseEstimate(content[section.key] ?? '');
        const value = Number(estimate.value);
        const low = Number(estimate.low);
        const high = Number(estimate.high);
        structuredValid = Boolean(
          estimate.unit.trim() && isNumeric(estimate.value) && isNumeric(estimate.low) && isNumeric(estimate.high) &&
          low <= value && value <= high
        );
      }
      const valid = words > 0 && words <= wordLimit && structuredValid;
      const isEmpty = words === 0;
      const isOverLimit = words > wordLimit;
      return { ...section, words, valid, isEmpty, isOverLimit, percentage };
    });
  }, [sections, content]);

  const allSectionsValid = sectionStatus.every(s => s.valid);
  const completedSections = sectionStatus.filter(s => s.valid).length;
  const totalSections = sections.length;
  const overallProgress = totalSections ? (completedSections / totalSections) * 100 : 0;
  const minutesSinceSave = lastSaved ? Math.floor((Date.now() - lastSaved.getTime()) / 60000) : null;

  const handleSubmit = async () => {
    if (!caseData || !allSectionsValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const totalWords = sections.reduce((sum, section) =>
        sum + countSectionWords(section, content[section.key] ?? ''), 0);
      const citationsCount = 0;

      const response = await createSubmission(caseData.id, content, citationsCount, totalWords);
      setReferenceRange(response.referenceRange);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoadingCase) {
    return <PageWrapper><p className="py-10 text-sm text-slate-400" aria-live="polite">Loading case…</p></PageWrapper>;
  }

  if (loadError) {
    return <PageWrapper><p className="py-10 text-sm text-rose-400" role="alert">Case could not be loaded: {loadError}</p></PageWrapper>;
  }

  if (!caseData) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Case Not Found</h2>
          <Button variant="primary" size="md" onClick={() => navigate('/cases')}>Back to Cases</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${caseData.id}`)} className="mb-6 inline-flex">← Back to Case</Button>

      <div className="page-header pb-6">
        <div className="section-label mb-2">{caseData.type.toUpperCase()} TEMPLATE</div>
        <h1 className="section-title text-3xl mb-2">Submit Solution</h1>
        <p className="section-subtitle">{caseData.title}</p>
      </div>

      {submitted ? (
        <div className="glass-card p-12 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Submission Received</h3>
          <p className="text-slate-400 mb-6">Your solution is submitted. Compare it with other approaches whenever you’re ready.</p>
          {caseData.type === 'Guesstimate' && referenceRange && (
            <p className="mb-6 text-sm text-[var(--text-secondary)]">
              Author reference range: {referenceRange.low}–{referenceRange.high} {referenceRange.unit} (reference estimate {referenceRange.value} {referenceRange.unit})
            </p>
          )}
          <Button variant="primary" size="md" onClick={() => navigate(`/cases/${caseData.id}/solutions`)}>Compare solutions</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {sectionStatus.map((section, index) => (
              <div
                key={section.key}
                className={`glass-card p-6 transition-all duration-300 ${
                  section.valid
                    ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : section.isOverLimit
                    ? 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : 'border-slate-700/50'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${section.valid ? 'text-emerald-400' : section.isOverLimit ? 'text-rose-400' : 'text-slate-400'}`} />
                    <label className="text-sm font-bold text-white">{section.label}</label>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.valid && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 animate-scale-in" />
                    )}
                    {section.isOverLimit && (
                      <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                    )}
                    <span className={`text-xs font-mono ${section.valid ? 'text-emerald-400' : section.isOverLimit ? 'text-rose-400' : 'text-amber-400'}`}>
                      {section.words}/{section.wordLimit}w
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      section.valid
                        ? 'bg-emerald-500'
                        : section.isOverLimit
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${section.percentage}%` }}
                  />
                </div>

                {section.inputKind === 'segments' ? (
                  <div className="space-y-3">
                    {parseSegments(content[section.key] ?? '').map((segment, segmentIndex) => (
                      <label key={segmentIndex} className="block text-xs text-[var(--text-secondary)]">
                        Segment {segmentIndex + 1}
                        <input
                          className="input-field mt-1 w-full"
                          value={segment}
                          onChange={(event) => {
                            const segments = parseSegments(content[section.key] ?? '');
                            segments[segmentIndex] = event.target.value;
                            setContent((previous) => ({ ...previous, [section.key]: JSON.stringify(segments) }));
                            setLastSaved(new Date());
                          }}
                        />
                      </label>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const segments = parseSegments(content[section.key] ?? '');
                          setContent((previous) => ({ ...previous, [section.key]: JSON.stringify([...segments, '']) }));
                        }}
                      >
                        Add segment
                      </Button>
                      {parseSegments(content[section.key] ?? '').length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const segments = parseSegments(content[section.key] ?? '');
                            setContent((previous) => ({ ...previous, [section.key]: JSON.stringify(segments.slice(0, -1)) }));
                          }}
                        >
                          Remove last segment
                        </Button>
                      )}
                    </div>
                  </div>
                ) : section.inputKind === 'assumptions' ? (
                  <div className="space-y-4">
                    {parseAssumptions(content[section.key] ?? '').map((assumption, assumptionIndex) => (
                      <fieldset key={assumptionIndex} className="grid gap-3 rounded-md border border-[var(--border-subtle)] p-4 sm:grid-cols-2">
                        <legend className="px-1 text-xs font-medium text-[var(--text-secondary)]">Assumption {assumptionIndex + 1}</legend>
                        {(['name', 'value', 'unit', 'rationale'] as const).map((field) => (
                          <label key={field} className="text-xs text-[var(--text-secondary)]">
                            {field === 'name' ? 'Name' : field === 'value' ? 'Numeric value' : field === 'unit' ? 'Unit' : 'Rationale'}
                            <input
                              className="input-field mt-1 w-full"
                              type={field === 'value' ? 'number' : 'text'}
                              step={field === 'value' ? 'any' : undefined}
                              value={assumption[field]}
                              onChange={(event) => {
                                const rows = parseAssumptions(content[section.key] ?? '');
                                rows[assumptionIndex] = { ...rows[assumptionIndex]!, [field]: event.target.value };
                                setContent((previous) => ({ ...previous, [section.key]: JSON.stringify(rows) }));
                                setLastSaved(new Date());
                              }}
                            />
                          </label>
                        ))}
                        {parseAssumptions(content[section.key] ?? '').length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const rows = parseAssumptions(content[section.key] ?? '').filter((_, index) => index !== assumptionIndex);
                              setContent((previous) => ({ ...previous, [section.key]: JSON.stringify(rows) }));
                            }}
                          >
                            Remove assumption
                          </Button>
                        )}
                      </fieldset>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const rows = parseAssumptions(content[section.key] ?? '');
                        setContent((previous) => ({ ...previous, [section.key]: JSON.stringify([...rows, blankAssumption()]) }));
                      }}
                    >
                      Add assumption
                    </Button>
                  </div>
                ) : section.inputKind === 'estimate' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['value', 'unit', 'low', 'high'] as const).map((field) => {
                      const estimate = parseEstimate(content[section.key] ?? '');
                      const label = field === 'value' ? 'Estimate' : field === 'unit' ? 'Unit' : `Range ${field}`;
                      return (
                        <label key={field} className="text-xs text-[var(--text-secondary)]">
                          {label}
                          <input
                            className="input-field mt-1 w-full"
                            type={field === 'unit' ? 'text' : 'number'}
                            step={field === 'unit' ? undefined : 'any'}
                            value={estimate[field]}
                            onChange={(event) => {
                              setContent((previous) => ({
                                ...previous,
                                [section.key]: JSON.stringify({ ...estimate, [field]: event.target.value }),
                              }));
                              setLastSaved(new Date());
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    className="input-field min-h-[120px] transition-all duration-300"
                    placeholder={section.placeholder}
                    value={content[section.key] ?? ''}
                    onChange={(e) => {
                      setContent(prev => ({ ...prev, [section.key]: e.target.value }));
                      setLastSaved(new Date());
                    }}
                  />
                )}

                {/* Status message */}
                {section.isEmpty && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Start typing to begin this section
                  </div>
                )}
                {section.isOverLimit && (
                  <div className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Exceeds word limit by {section.words - section.wordLimit} words
                  </div>
                )}
                {section.valid && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Section complete
                  </div>
                )}
              </div>
            ))}

          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 sticky top-24">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Save className="w-4 h-4" />
                {lastSaved
                  ? minutesSinceSave === 0 ? 'Saved just now' : `Last saved ${minutesSinceSave}m ago`
                  : 'Autosaves every 60s'}
              </div>

              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white">Overall Progress</h3>
                  <span className="text-sm font-mono text-emerald-400">{completedSections}/{totalSections}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              <h3 className="font-bold text-white mb-3">Section Checklist</h3>
              <ul className="space-y-2 mb-6">
                {sectionStatus.map((s, index) => (
                  <li
                    key={s.key}
                    className={`text-xs flex justify-between items-center gap-2 transition-all duration-300 ${
                      s.valid ? 'text-emerald-400' : s.isOverLimit ? 'text-rose-400' : 'text-slate-500'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="flex-1">{s.label}</span>
                    {s.valid ? (
                      <CheckCircle className="w-4 h-4 animate-scale-in" />
                    ) : s.isOverLimit ? (
                      <AlertCircle className="w-4 h-4 animate-pulse" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </li>
                ))}
              </ul>

              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={!allSectionsValid || submitting}
                loading={submitting}
                className={`w-full mb-3 ${allSectionsValid ? 'shadow-[0_0_20px_rgba(255,76,37,0.4)]' : 'opacity-50 cursor-not-allowed'}`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit solution'
                )}
              </Button>
              {error && (
                <div className="text-rose-400 text-xs mb-3 p-2 bg-rose-500/10 rounded border border-rose-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate(`/cases/${caseData.id}`)}
                className="w-full"
              >
                Save Draft & Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
