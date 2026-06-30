import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, Send } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';

export const QuestionsAskPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    context: '',
    whatTried: '',
    deliverableWanted: '',
    type: 'Market Sizing' as const,
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert('Question posted!');
    }, 1000);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/questions" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Questions
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <HelpCircle className="w-8 h-8 text-[#D4537E]" />
            <h1 className="text-2xl font-bold text-white">Post a Question</h1>
            <TrackBadge track="community_question" />
          </div>
        </div>

        <div className="glass-card p-6">
          <label className="block mb-4">
            <span className="text-sm font-medium text-white mb-2 block">Question Title</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., How to structure pricing for a B2B marketplace?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4537E]"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-white mb-2 block">Context</span>
            <textarea
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              placeholder="Describe your situation..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[120px] focus:outline-none focus:border-[#D4537E]"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-white mb-2 block">What You've Tried</span>
            <textarea
              value={formData.whatTried}
              onChange={(e) => setFormData({ ...formData, whatTried: e.target.value })}
              placeholder="What solutions have you considered?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[100px] focus:outline-none focus:border-[#D4537E]"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-white mb-2 block">Deliverable Wanted</span>
            <textarea
              value={formData.deliverableWanted}
              onChange={(e) => setFormData({ ...formData, deliverableWanted: e.target.value })}
              placeholder="What specific output do you need?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[80px] focus:outline-none focus:border-[#D4537E]"
              required
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Post Question
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
