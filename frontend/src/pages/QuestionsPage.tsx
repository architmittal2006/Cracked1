import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, CheckCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { MOCK_QUESTIONS, MOCK_USERS } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { Avatar } from '../components/Avatar';

export const QuestionsPage: React.FC = () => {
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-[#D4537E]" />
            <h1 className="text-3xl font-bold text-white">Community Questions</h1>
            <TrackBadge track="community_question" />
          </div>
          <p className="text-slate-400 max-w-2xl">
            User-posted problems · poster accepts best answer · 2× acceptance bonus. Track 2 has 0.8× credibility weight.
          </p>
        </div>

        <div className="grid gap-4">
          {MOCK_QUESTIONS.map((question) => {
            const poster = MOCK_USERS.find(u => u.id === question.posterId);
            return (
              <Link
                key={question.id}
                to={`/questions/${question.id}`}
                className="glass-card p-6 hover:border-[#D4537E]/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ProblemTypeBadge type={question.type} />
                      {question.status === 'Accepted' && (
                        <span className="flex items-center gap-1 text-xs text-[#D4537E] font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Accepted
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{question.sector}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#D4537E] transition-colors">
                      {question.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{question.description}</p>
                    <div className="flex items-center gap-3">
                      {poster && (
                        <div className="flex items-center gap-2">
                          <Avatar initials={poster.initials} size="sm" />
                          <span className="text-xs text-slate-400">{poster.username}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{question.submissionCount} answers</span>
                        <span>•</span>
                        <span>{question.pts} pts</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-slate-500">
                      <MessageCircle className="w-4 h-4" />
                      <span>{question.submissionCount}</span>
                    </div>
                    <span className="text-xs text-slate-500">answers</span>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-[#D4537E] transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
};
