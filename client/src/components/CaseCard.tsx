import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Zap } from 'lucide-react';
import type { Case } from '../data/mockData';
import { GATE_STATE } from '../data/mockData';
import { ProblemTypeBadge } from './ProblemTypeBadge';
import { GateIndicator } from './GateIndicator';

interface CaseCardProps {
  caseData: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData }) => {
  const getDifficultyClass = () => {
    switch (caseData.difficulty) {
      case 'High': return 'difficulty-high';
      case 'Chaos': return 'difficulty-chaos';
      default: return 'difficulty-standard';
    }
  };

  const gateReviews = GATE_STATE[caseData.id] ?? 0;
  const featuredClass = caseData.isFeatured ? 'gradient-border-animated glass-card-glow-violet md:col-span-2 lg:col-span-3 mb-6' : '';
  const chaosBorder = caseData.is_chaos ? 'border-t-4 border-t-rose-500' : '';
  const gridLayout = caseData.isFeatured ? 'md:grid md:grid-cols-3 md:gap-8' : 'flex flex-col';

  return (
    <div className={`glass-card glass-card-hover p-6 ${featuredClass} ${chaosBorder} ${gridLayout} h-full`}>
      <div className={caseData.isFeatured ? 'md:col-span-2 flex flex-col justify-between' : 'flex flex-col justify-between h-full'}>
        <div>
          <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
            <ProblemTypeBadge type={caseData.type} linked />
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${getDifficultyClass()}`}>
              {caseData.difficulty}
            </span>
          </div>

          {caseData.is_chaos && (
            <div className="text-rose-400 font-bold text-xs uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Chaos Case
            </div>
          )}

          <h3 className={`${caseData.isFeatured ? 'text-2xl md:text-3xl' : 'text-lg'} font-bold text-white mb-1 line-clamp-2`}>
            {caseData.title}
          </h3>
          <p className="text-sm text-slate-400 mb-1">{caseData.sector} · {caseData.companyType}</p>

          <p className={`text-slate-400 ${caseData.isFeatured ? 'line-clamp-4 text-base' : 'line-clamp-2 text-sm'} mb-4`}>
            {caseData.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {caseData.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-1 bg-slate-900/50 border border-slate-800 text-slate-400 rounded">
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-4">
            <GateIndicator reviewsCompleted={gateReviews} compact />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          <div className="flex gap-4">
            <div className="flex items-center text-xs text-slate-400 gap-1">
              <FileText className="w-3 h-3" />
              <span>{caseData.submissionCount}</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{caseData.pts} pts</span>
          </div>
          <div className="flex items-center text-xs text-slate-400 gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(caseData.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className={`${caseData.isFeatured ? 'md:col-span-1 flex items-center justify-center mt-6 md:mt-0' : 'mt-4'}`}>
        <Link
          to={`/cases/${caseData.id}`}
          className={`w-full text-center ${caseData.isFeatured ? 'btn-primary py-4' : 'btn-secondary py-2'}`}
        >
          View Case
        </Link>
      </div>
    </div>
  );
};
