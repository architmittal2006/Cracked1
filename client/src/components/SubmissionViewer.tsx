import React from 'react';
import { User, Calendar, Eye } from 'lucide-react';
import { ProblemTypeBadge } from './ProblemTypeBadge';
import { StatusPill } from './StatusPill';
import { TierBadge } from './TierBadge';

interface SubmissionViewerProps {
  submission: {
    id: string;
    caseId: string;
    caseName: string;
    caseType: string;
    userId: string;
    userName: string;
    userTier: string;
    status: string;
    finalScore: number | null;
    createdAt: string;
    content: Record<string, string>;
    imageUrl?: string;
  };
  showAuthor?: boolean;
  showScore?: boolean;
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submission,
  showAuthor = true,
  showScore = true,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ProblemTypeBadge type={submission.caseType as any} />
            <StatusPill status={submission.status as any} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{submission.caseName}</h3>
          {showAuthor && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span>{submission.userName}</span>
              <TierBadge score={0} /> {/* Would need actual score */}
            </div>
          )}
        </div>
        {showScore && submission.finalScore !== null && (
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Score</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {submission.finalScore}
            </div>
          </div>
        )}
      </div>

      {/* Submission Content */}
      <div className="space-y-4">
        {Object.entries(submission.content).map(([key, value]) => {
          if (!value || value.trim().length === 0) return null;
          
          const labelMap: Record<string, string> = {
            approach: 'Approach Selection',
            assumptions: 'Key Assumptions',
            calculation: 'Calculation Steps',
            estimate: 'Final Estimate',
            sanity: 'Sanity Check',
            framing: 'Problem Framing',
            framework: 'Framework Rationale',
            revenue: 'Revenue Branch',
            cost: 'Cost Branch',
            root_cause: 'Root Cause',
            recommendations: 'Recommendations',
            first_step: 'First 90-Day Step',
            attractiveness: 'Market Attractiveness',
            feasibility: 'Entry Feasibility',
            strategy: 'Entry Strategy',
            risks: 'Key Risks',
            current_state: 'Current State',
            solution: 'Proposed Solution',
            implementation: 'Implementation Plan',
            analysis: 'Pricing Analysis',
            architecture: 'Pricing Architecture',
            migration: 'Migration Strategy',
            impact: 'Revenue Impact',
            synergies: 'Synergy Analysis',
            integration: 'Integration Plan',
            recommendation: 'Go/No-Go Recommendation',
            diagnosis: 'Root Cause Diagnosis',
            levers: 'Growth Levers',
            experiments: 'Recommended Experiments',
            metrics: 'Success Metrics',
          };

          return (
            <div key={key} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-2">
                {labelMap[key] || key}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Supporting Image */}
      {submission.imageUrl && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-2">Supporting Image</h4>
          <img
            src={submission.imageUrl}
            alt="Supporting material"
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>Submitted {formatDate(submission.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Eye className="w-3 h-3" />
          <span>Public View</span>
        </div>
      </div>
    </div>
  );
};
