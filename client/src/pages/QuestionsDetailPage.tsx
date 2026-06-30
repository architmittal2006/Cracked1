import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { HelpCircle, CheckCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { MOCK_QUESTIONS, MOCK_USERS } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { Avatar } from '../components/Avatar';

export const QuestionsDetailPage: React.FC = () => {
  const { id } = useParams();
  const question = MOCK_QUESTIONS.find(q => q.id === id);
  const poster = question ? MOCK_USERS.find(u => u.id === question.posterId) : null;

  if (!question) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Question Not Found</h2>
          <Link to="/questions" className="btn-primary">Browse Questions</Link>
        </div>
      </PageWrapper>
    );
  }

  // Mock answers
  const mockAnswers = question.status === 'Accepted' ? [
    { id: 'ans001', author: 'strategy_expert', isAccepted: true, upvotes: 12, excerpt: 'Use a hybrid model: base commission for small transactions, tiered subscription for volume discounts, and value-based pricing for enterprise...' },
    { id: 'ans002', author: 'pricing_guru', isAccepted: false, upvotes: 8, excerpt: 'Pure subscription model with tiered plans based on transaction volume. This provides predictable revenue...' },
  ] : [
    { id: 'ans001', author: 'consultant_jane', isAccepted: false, upvotes: 5, excerpt: 'Consider a commission-based model with volume discounts for high-volume merchants...' },
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/questions" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Questions
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <HelpCircle className="w-8 h-8 text-[#D4537E]" />
            <h1 className="text-2xl font-bold text-white">{question.title}</h1>
            <TrackBadge track="community_question" />
            {question.status === 'Accepted' && (
              <span className="flex items-center gap-1 text-xs text-[#D4537E] font-medium bg-[#FBEAF0] px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />
                Accepted
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <ProblemTypeBadge type={question.type} />
            <span className="text-sm text-slate-500">{question.sector}</span>
          </div>
          {poster && (
            <div className="flex items-center gap-2 mb-4">
              <Avatar initials={poster.initials} size="sm" />
              <div>
                <span className="text-sm text-white">@{poster.username}</span>
                <span className="text-xs text-slate-500 ml-2">asked this question</span>
              </div>
            </div>
          )}
          <p className="text-slate-300 mb-6">{question.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {question.status === 'Accepted' ? 'Accepted Answer' : 'Answers'}
            </h2>
            <span className="text-sm text-slate-500">{question.submissionCount} answers</span>
          </div>
          <div className="grid gap-4">
            {mockAnswers.map((answer) => (
              <div key={answer.id} className={`glass-card p-6 ${answer.isAccepted ? 'border-[#D4537E]/50' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">@{answer.author}</span>
                      {answer.isAccepted && (
                        <span className="flex items-center gap-1 text-xs text-[#D4537E] font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Accepted by poster
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageCircle className="w-3 h-3" />
                        {answer.upvotes} upvotes
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{answer.excerpt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to={`/questions/${question.id}/answer`} className="btn-primary">
            Submit Your Answer <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-500 mt-2">No gate required · submit immediately after login</p>
        </div>
      </div>
    </PageWrapper>
  );
};
