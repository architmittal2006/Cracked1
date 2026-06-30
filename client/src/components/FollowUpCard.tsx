import React from 'react';
import { MessageSquare, ChevronRight, Building2 } from 'lucide-react';

interface FollowUpCardProps {
  round: number;
  question: string;
  answer?: string;
  isCompany?: boolean;
  status?: 'pending' | 'answered';
}

export const FollowUpCard: React.FC<FollowUpCardProps> = ({
  round,
  question,
  answer,
  isCompany = false,
  status = 'pending',
}) => {
  return (
    <div className={`glass-card p-4 border-l-4 ${isCompany ? 'border-amber-500' : 'border-[#7F77DD]'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isCompany ? 'bg-amber-500/20 text-amber-400' : 'bg-[#7F77DD]/20 text-[#7F77DD]'
        }`}>
          {isCompany ? <Building2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Round {round}</span>
            {isCompany && <span className="text-xs text-amber-400">Company Follow-up</span>}
            {status === 'answered' && <span className="text-xs text-emerald-400">Answered</span>}
          </div>
          <p className="text-sm text-white mb-2">{question}</p>
          {answer && (
            <div className="bg-slate-900 rounded-lg p-3 mt-2">
              <p className="text-sm text-slate-300">{answer}</p>
            </div>
          )}
        </div>
        {status === 'pending' && !isCompany && (
          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
        )}
      </div>
    </div>
  );
};
