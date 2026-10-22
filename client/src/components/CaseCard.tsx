import React from 'react';
import { Clock, FileText, Zap } from 'lucide-react';
import type { Case } from '../data/mockData';
import { GATE_STATE } from '../data/mockData';
import { ProblemTypeBadge } from './ProblemTypeBadge';
import { GateIndicator } from './GateIndicator';
import { Button } from './Button';

interface CaseCardProps {
  caseData: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData }) => {
  const getDifficultyClass = () => {
    switch (caseData.difficulty) {
      case 'High': return 'bg-[#FF4C25]/10 text-[#FF8F72] border border-[#FF4C25]/20';
      case 'Chaos': return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
      default: return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
    }
  };

  const gateReviews = GATE_STATE[caseData.id] ?? 0;
  const featuredClass = caseData.isFeatured ? 'md:col-span-2 lg:col-span-3' : '';
  const chaosAccent = caseData.is_chaos ? 'border-l-4 border-l-rose-500' : '';

  return (
    <div className={`group rounded-2xl border border-white/8 bg-[#0d0d12] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-200 hover:border-[#FF4C25]/30 hover:shadow-[0_18px_40px_rgba(255,76,37,0.12)] ${featuredClass} ${chaosAccent}`}>
      <div className='flex items-start justify-between gap-3'>
        <ProblemTypeBadge type={caseData.type} linked />
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getDifficultyClass()}`}>
          {caseData.difficulty}
        </span>
      </div>

      {caseData.is_chaos && (
        <div className='mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300'>
          <Zap className='h-3 w-3' /> Chaos case
        </div>
      )}

      <h3 className='mt-4 text-xl font-semibold tracking-[-0.03em] text-white'>{caseData.title}</h3>
      <p className='mt-1 text-sm text-slate-400'>{caseData.sector} · {caseData.companyType}</p>

      <p className='mt-3 text-sm leading-relaxed text-slate-300 line-clamp-3'>
        {caseData.description}
      </p>

      <div className='mt-4 flex flex-wrap gap-2'>
        {caseData.tags.slice(0, 3).map((tag) => (
          <span key={tag} className='rounded-full border border-white/8 bg-white/[0.02] px-2 py-1 text-[10px] font-medium text-slate-300'>
            {tag}
          </span>
        ))}
      </div>

      <div className='mt-5'>
        <GateIndicator reviewsCompleted={gateReviews} compact />
      </div>

      <div className='mt-5 flex items-center justify-between border-t border-white/8 pt-4'>
        <div className='flex items-center gap-4 text-xs text-slate-400'>
          <span className='inline-flex items-center gap-1.5'>
            <FileText className='h-3.5 w-3.5' />
            {caseData.submissionCount}
          </span>
          <span className='font-mono font-semibold text-[#FF4C25]'>{caseData.pts} pts</span>
        </div>
        <span className='inline-flex items-center gap-1.5 text-xs text-slate-400'>
          <Clock className='h-3.5 w-3.5' />
          {new Date(caseData.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <Button
        variant='primary'
        size='md'
        as='a'
        href={`/cases/${caseData.id}`}
        className='mt-5 w-full'
      >
        View Case
      </Button>
    </div>
  );
};
