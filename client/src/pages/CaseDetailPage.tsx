import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, FileText, Users, Zap, PenLine, Eye } from 'lucide-react';
import { MOCK_CASES, GATE_STATE } from '../data/mockData';
import { StatusPill } from '../components/StatusPill';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { DeliverablesList } from '../components/DeliverablesList';
import { GateIndicator } from '../components/GateIndicator';
import { PageWrapper } from '../components/PageWrapper';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams();
  const caseData = MOCK_CASES.find(c => c.id === id);

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

  const gateReviews = GATE_STATE[caseData.id] ?? 0;
  const gateCleared = gateReviews >= 2;

  const getDifficultyClass = () => {
    switch (caseData.difficulty) {
      case 'High': return 'difficulty-high';
      case 'Chaos': return 'difficulty-chaos';
      default: return 'difficulty-standard';
    }
  };

  return (
    <PageWrapper className="py-8">
      <Link to="/cases" className="btn-ghost mb-6 text-sm inline-flex">← Back to Cases</Link>

      <div className={`glass-card p-8 mb-8 ${caseData.is_chaos ? 'border-t-4 border-t-rose-500' : ''}`}>
        <div className="flex flex-wrap gap-3 mb-4">
          <ProblemTypeBadge type={caseData.type} linked />
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${getDifficultyClass()}`}>
            {caseData.difficulty}
          </span>
          <StatusPill status={caseData.status} />
          {caseData.is_chaos && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full difficulty-chaos flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live Timer
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{caseData.title}</h1>
        <p className="text-slate-400 mb-6">{caseData.sector} · {caseData.companyType}</p>
        <p className="text-slate-300 max-w-3xl mb-6 text-lg leading-relaxed">{caseData.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {caseData.tags.map(tag => (
            <span key={tag} className="text-[10px] px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-slate-400 mb-6">
          <div className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {caseData.submissionCount} submissions</div>
          <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {caseData.reviewCount} reviews</div>
          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" /> Deadline: {caseData.deadline}</div>
          <div className="font-mono font-bold text-emerald-400">{caseData.pts} points</div>
        </div>

        <GateIndicator reviewsCompleted={gateReviews} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Required Deliverables</h2>
            <DeliverablesList deliverables={caseData.deliverables} />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-2">Proof-of-Review Gate</h2>
            <p className="text-sm text-slate-400 mb-6">
              Complete 2 peer reviews on submissions for this case before you can submit your own solution.
            </p>
            <GateIndicator reviewsCompleted={gateReviews} />
            {!gateCleared && (
              <Link to={`/cases/${caseData.id}/review`} className="btn-secondary mt-6 inline-flex">
                <Eye className="w-4 h-4" /> Start Reviewing
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <Link
                to={`/cases/${caseData.id}/review`}
                className="btn-secondary w-full justify-center"
              >
                <Eye className="w-4 h-4" /> Review a Submission
              </Link>
              {gateCleared ? (
                <Link
                  to={`/cases/${caseData.id}/submit`}
                  className="btn-primary w-full justify-center"
                >
                  <PenLine className="w-4 h-4" /> Submit Solution
                </Link>
              ) : (
                <span className="btn-primary w-full justify-center opacity-50 cursor-not-allowed flex items-center gap-2">
                  <PenLine className="w-4 h-4" /> Submit Solution
                </span>
              )}
              {!gateCleared && (
                <p className="text-xs text-slate-500 text-center">Complete {2 - gateReviews} more review(s) to unlock</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Case Stats</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Submissions</span><span className="font-mono font-bold">{caseData.submissionCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Reviews</span><span className="font-mono font-bold">{caseData.reviewCount}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Avg Score</span><span className="font-mono font-bold text-emerald-400">421 pts</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Points</span><span className="font-mono font-bold text-emerald-400">{caseData.pts}</span></div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
