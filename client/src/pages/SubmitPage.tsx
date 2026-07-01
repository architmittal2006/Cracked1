import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';
import { MOCK_CASES, SUBMISSION_TEMPLATES } from '../data/mockData';
import { GateIndicator } from '../components/GateIndicator';
import { PageWrapper } from '../components/PageWrapper';
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
      return { ...section, words, valid: words > 0 && words <= section.wordLimit };
    });
  }, [sections, content]);

  const allSectionsValid = sectionStatus.every(s => s.valid);
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
          <Link to="/cases" className="btn-primary">Back to Cases</Link>
        </div>
      </PageWrapper>
    );
  }

  if (!gateCleared) {
    return (
      <PageWrapper>
        <div className="glass-card p-8 text-center max-w-lg mx-auto">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Gate Locked</h2>
          <p className="text-slate-400 mb-6">Complete 2 peer reviews for this case before submitting.</p>
          <GateIndicator reviewsCompleted={gateReviews} />
          <div className="flex gap-3 justify-center mt-6">
            <Link to={`/cases/${caseData.id}/review`} className="btn-secondary">Review Submissions</Link>
            <Link to={`/cases/${caseData.id}`} className="btn-ghost">Back to Case</Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Link to={`/cases/${caseData.id}`} className="btn-ghost mb-6 text-sm inline-flex">← Back to Case</Link>

      <div className="page-header pb-6">
        <div className="section-label mb-2">{caseData.type.toUpperCase()} TEMPLATE</div>
        <h1 className="section-title text-3xl mb-2">Submit Solution</h1>
        <p className="section-subtitle">{caseData.title}</p>
      </div>

      {submitted ? (
        <div className="glass-card p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-emerald-400">✓</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Submission Received</h3>
          <p className="text-slate-400 mb-6">Structural validation passed. Your solution enters the review queue.</p>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {sectionStatus.map(section => (
              <div key={section.key} className="glass-card p-6">
                <div className="flex justify-between items-start mb-3">
                  <label className="text-sm font-bold text-white">{section.label}</label>
                  <span className={`text-xs font-mono ${section.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {section.words}/{section.wordLimit}w
                  </span>
                </div>
                <textarea
                  className="input-field min-h-[120px]"
                  placeholder={section.placeholder}
                  value={content[section.key] ?? ''}
                  onChange={(e) => {
                    setContent(prev => ({ ...prev, [section.key]: e.target.value }));
                    setLastSaved(new Date());
                  }}
                />
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

              <h3 className="font-bold text-white mb-3">Section Checklist</h3>
              <ul className="space-y-2 mb-6">
                {sectionStatus.map(s => (
                  <li key={s.key} className={`text-xs flex justify-between ${s.valid ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{s.label}</span>
                    <span>{s.valid ? '✓' : '—'}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="btn-primary w-full mb-3"
                disabled={!allSectionsValid || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              {error && (
                <div className="text-rose-400 text-xs mb-3">{error}</div>
              )}
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => navigate(`/cases/${caseData.id}`)}
              >
                Save Draft & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
