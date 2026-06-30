import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Send, Building2, MessageSquare } from 'lucide-react';
import { MOCK_CASES } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { FollowUpCard } from '../components/FollowUpCard';

export const FollowUpPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseData = MOCK_CASES.find(c => c.id === id);
  const [newAnswer, setNewAnswer] = useState('');

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

  // Mock follow-up data
  const followUps = [
    {
      round: 1,
      question: 'Can you provide more detail on the proposed subscription tier structure?',
      answer: 'Yes - we propose a 3-tier subscription: Basic ($29/mo for 100 orders), Pro ($99/mo for 500 orders), and Enterprise ($299/mo for unlimited). Each tier includes progressively more analytics and CRM features.',
      isCompany: true,
      status: 'answered' as const,
    },
    {
      round: 2,
      question: 'What are the expected churn rates for each tier based on comparable SaaS metrics?',
      answer: undefined,
      isCompany: true,
      status: 'pending' as const,
    },
  ];

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

  const handleSubmit = () => {
    if (!newAnswer.trim()) return;
    alert('Follow-up answer submitted!');
    setNewAnswer('');
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to={`/cases/${caseData.id}`} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Case
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <MessageSquare className="w-8 h-8 text-[#7F77DD]" />
            <h1 className="text-2xl font-bold text-white">Follow-up Round 2</h1>
          </div>
          <p className="text-slate-400">
            Company follow-ups allow deeper exploration of your solution. 3-round depth system.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {followUps.map((followUp) => (
            <FollowUpCard key={followUp.round} {...followUp} />
          ))}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">Answer Company Follow-up</h3>
          </div>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Provide a detailed answer to the company's follow-up question..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[150px] focus:outline-none focus:border-[#7F77DD]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newAnswer.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            <Send className="w-4 h-4" />
            Submit Answer
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
