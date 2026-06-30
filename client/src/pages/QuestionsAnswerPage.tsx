import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { HelpCircle, Send } from 'lucide-react';
import { MOCK_QUESTIONS } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';

export const QuestionsAnswerPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const question = MOCK_QUESTIONS.find(q => q.id === id);
  const [content, setContent] = useState('');
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

  const handleSubmit = async () => {
    setSubmitting(true);
    // Mock submission - in production this would call the API
    setTimeout(() => {
      setSubmitting(false);
      alert('Answer submitted! The poster can accept it for a 2× bonus.');
    }, 1000);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to={`/questions/${question.id}`} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Question
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <HelpCircle className="w-8 h-8 text-[#D4537E]" />
            <h1 className="text-2xl font-bold text-white">Submit Answer</h1>
            <TrackBadge track="community_question" />
          </div>
          <div className="glass-card p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">{question.title}</h3>
            <ProblemTypeBadge type={question.type} />
            <p className="text-sm text-slate-400 mt-2">{question.description}</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-4">
              <span className="text-[#D4537E] font-medium">No gate required</span> — your answer will be visible immediately.
              If the poster accepts your answer, you get a <span className="text-[#D4537E] font-medium">2× bonus</span>.
              Base points: {question.pts} × 0.8× credibility weight = {Math.round(question.pts * 0.8)} pts.
            </p>
          </div>

          <label className="block mb-4">
            <span className="text-sm font-medium text-white mb-2 block">Your Answer</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide a detailed answer to the question..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white min-h-[200px] focus:outline-none focus:border-[#D4537E]"
              required
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !content}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
