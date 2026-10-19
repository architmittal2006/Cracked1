import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Save, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { MOCK_CASES, SUBMISSION_TEMPLATES } from '../data/mockData';
import { GateIndicator } from '../components/GateIndicator';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { createSubmission, getGateStatus } from '../services/api';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export const SubmitPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseData = MOCK_CASES.find(c => c.id === id);

  // Mock authentication check - in production, use actual auth state
  const isAuthenticated = true;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }
  const [gateReviews, setGateReviews] = useState(0);
  const gateCleared = gateReviews >= 2;

  const sections = caseData ? SUBMISSION_TEMPLATES[caseData.type] : [];
  const [content, setContent] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseData) return;
    const initial: Record<string, string> = {};
    SUBMISSION_TEMPLATES[caseData.type].forEach(s => { initial[s.key] = ''; });
    setContent(initial);

    // Fetch gate status from API
    getGateStatus(caseData.id).then(status => {
      setGateReviews(status.reviews_completed);
    }).catch(() => {
      // Keep default gateReviews = 0 on error
    });
  }, [caseData]);

  useEffect(() => {
    if (!caseData || submitted) return;
    const interval = setInterval(() => setLastSaved(new Date()), 60000);
    return () => clearInterval(interval);
  }, [caseData, submitted]);

  const sectionStatus = useMemo(() => {
    return sections.map(section => {
      const words = countWords(content[section.key] ?? '');
      const wordLimit = section.wordLimit;
      const percentage = Math.min((words / wordLimit) * 100, 100);
      const valid = words > 0 && words <= wordLimit;
      const isEmpty = words === 0;
      const isOverLimit = words > wordLimit;
      return { ...section, words, valid, isEmpty, isOverLimit, percentage };
    });
  }, [sections, content]);

  const allSectionsValid = sectionStatus.every(s => s.valid);
  const completedSections = sectionStatus.filter(s => s.valid).length;
  const totalSections = sections.length;
  const overallProgress = (completedSections / totalSections) * 100;
  const minutesSinceSave = lastSaved ? Math.floor((Date.now() - lastSaved.getTime()) / 60000) : null;

  const handleSubmit = async () => {
    if (!caseData || !allSectionsValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const totalWords = Object.values(content).reduce((sum, text) => sum + countWords(text), 0);
      const citationsCount = 1; // Temporary fix - will be replaced with actual citations input

      await createSubmission(caseData.id, content, citationsCount, totalWords);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!gateCleared) {
    return (
      <PageWrapper>
        <div className="glass-card p-8 text-center max-w-lg mx-auto animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Gate Locked</h2>
          <p className="text-slate-400 mb-6">Complete 2 peer reviews for this case before submitting.</p>
          <GateIndicator reviewsCompleted={gateReviews} />
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="secondary" size="md" onClick={() => navigate(`/cases/${caseData.id}/review`)}>Review Submissions</Button>
            <Button variant="ghost" size="md" onClick={() => navigate(`/cases/${caseData.id}`)}>Back to Case</Button>
          </div>
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
          <p className="text-slate-400 mb-6">Structural validation passed. Your solution enters the review queue.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
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

                <textarea
                  className="input-field min-h-[120px] transition-all duration-300"
                  placeholder={section.placeholder}
                  value={content[section.key] ?? ''}
                  onChange={(e) => {
                    setContent(prev => ({ ...prev, [section.key]: e.target.value }));
                    setLastSaved(new Date());
                  }}
                />

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
                  'Submit for Review'
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
