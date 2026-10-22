import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, FileText, Users, Zap, PenLine, Eye, ArrowLeft } from 'lucide-react';
import { MOCK_CASES, GATE_STATE } from '../data/mockData';
import { StatusPill } from '../components/StatusPill';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { DeliverablesList } from '../components/DeliverablesList';
import { GateIndicator } from '../components/GateIndicator';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseData = MOCK_CASES.find((c) => c.id === id);

  if (!caseData) {
    return (
      <PageWrapper>
        <div className='py-20 text-center'>
          <h2 className='mb-4 text-2xl font-bold text-white'>Case Not Found</h2>
          <Button variant='primary' size='md' onClick={() => navigate('/cases')}>Back to Cases</Button>
        </div>
      </PageWrapper>
    );
  }

  const gateReviews = GATE_STATE[caseData.id] ?? 0;
  const gateCleared = gateReviews >= 2;

  const getDifficultyClass = () => {
    switch (caseData.difficulty) {
      case 'High': return 'bg-[#FF4C25]/10 text-[#FF8F72] border border-[#FF4C25]/20';
      case 'Chaos': return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
      default: return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
    }
  };

  return (
    <PageWrapper className='py-8'>
      <Button variant='ghost' size='sm' onClick={() => navigate('/cases')} className='mb-6 inline-flex gap-2'>
        <ArrowLeft className='h-4 w-4' /> Back to Cases
      </Button>

      <div className={`mb-8 rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)] ${caseData.is_chaos ? 'border-l-4 border-l-rose-500' : ''}`}>
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <ProblemTypeBadge type={caseData.type} linked />
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getDifficultyClass()}`}>
            {caseData.difficulty}
          </span>
          <StatusPill status={caseData.status} />
          {caseData.is_chaos && (
            <span className='inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300'>
              <Zap className='h-3 w-3' /> Live Timer
            </span>
          )}
        </div>

        <h1 className='mb-2 text-3xl font-bold tracking-[-0.04em] text-white md:text-5xl'>{caseData.title}</h1>
        <p className='mb-5 text-slate-400'>{caseData.sector} · {caseData.companyType}</p>
        <p className='mb-6 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg'>
          {caseData.description}
        </p>

        <div className='mb-6 flex flex-wrap gap-2'>
          {caseData.tags.map((tag) => (
            <span key={tag} className='rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-300'>
              {tag}
            </span>
          ))}
        </div>

        <div className='mb-6 flex flex-wrap gap-5 text-sm text-slate-400'>
          <div className='inline-flex items-center gap-2'><FileText className='h-4 w-4' /> {caseData.submissionCount} submissions</div>
          <div className='inline-flex items-center gap-2'><Users className='h-4 w-4' /> {caseData.reviewCount} reviews</div>
          <div className='inline-flex items-center gap-2'><Clock className='h-4 w-4 text-amber-300' /> Deadline: {caseData.deadline}</div>
          <div className='font-mono font-bold text-emerald-300'>{caseData.pts} points</div>
        </div>

        <GateIndicator reviewsCompleted={gateReviews} />
      </div>

      <div className='grid gap-8 lg:grid-cols-[1.7fr_0.9fr]'>
        <div className='space-y-8'>
          <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <h2 className='mb-4 text-xl font-bold text-white'>Required deliverables</h2>
            <DeliverablesList deliverables={caseData.deliverables} />
          </div>

          <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <h2 className='mb-2 text-xl font-bold text-white'>Proof-of-review gate</h2>
            <p className='mb-5 text-sm leading-relaxed text-slate-400'>
              Complete 2 peer reviews on submissions for this case before you can submit your own solution.
            </p>
            <GateIndicator reviewsCompleted={gateReviews} />
            {!gateCleared && (
              <Button variant='secondary' size='md' onClick={() => navigate(`/cases/${caseData.id}/review`)} className='mt-6 inline-flex gap-2'>
                <Eye className='h-4 w-4' /> Start Reviewing
              </Button>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <h3 className='mb-4 text-lg font-bold text-white'>Actions</h3>
            <div className='space-y-3'>
              <Button
                variant='secondary'
                size='md'
                onClick={() => navigate(`/cases/${caseData.id}/review`)}
                className='w-full justify-center gap-2'
              >
                <Eye className='h-4 w-4' /> Review a Submission
              </Button>

              {gateCleared ? (
                <Button
                  variant='primary'
                  size='md'
                  onClick={() => navigate(`/cases/${caseData.id}/submit`)}
                  className='w-full justify-center gap-2'
                >
                  <PenLine className='h-4 w-4' /> Submit Solution
                </Button>
              ) : (
                <Button
                  variant='primary'
                  size='md'
                  disabled
                  className='w-full justify-center gap-2 opacity-50 cursor-not-allowed'
                >
                  <PenLine className='h-4 w-4' /> Submit Solution
                </Button>
              )}

              {!gateCleared && (
                <p className='text-center text-xs text-slate-500'>Complete {2 - gateReviews} more review(s) to unlock</p>
              )}
            </div>
          </div>

          <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <h3 className='mb-4 text-lg font-bold text-white'>Case stats</h3>
            <div className='space-y-4 text-sm'>
              <div className='flex items-center justify-between'><span className='text-slate-400'>Submissions</span><span className='font-mono font-bold text-white'>{caseData.submissionCount}</span></div>
              <div className='flex items-center justify-between'><span className='text-slate-400'>Reviews</span><span className='font-mono font-bold text-white'>{caseData.reviewCount}</span></div>
              <div className='flex items-center justify-between'><span className='text-slate-400'>Avg Score</span><span className='font-mono font-bold text-emerald-300'>421 pts</span></div>
              <div className='flex items-center justify-between'><span className='text-slate-400'>Points</span><span className='font-mono font-bold text-emerald-300'>{caseData.pts}</span></div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CaseDetailPage;
