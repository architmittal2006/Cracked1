import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Trophy, Save, Send } from 'lucide-react';
import { MOCK_ARENA_CASES } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { DeliverablesList } from '../components/DeliverablesList';

export const ArenaSubmitPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const arenaCase = MOCK_ARENA_CASES.find(c => c.id === id);

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

  const [content, setContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!arenaCase) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Arena Case Not Found</h2>
          <Link to="/arena" className="btn-primary">Browse Arena</Link>
        </div>
      </PageWrapper>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    // Mock submission - in production this would call the API
    setTimeout(() => {
      setSubmitting(false);
      alert('Solution submitted! It will be published immediately and ranked by community upvotes.');
    }, 1000);
  };

  const handleSave = () => {
    setSaving(true);
    // Mock autosave
    setTimeout(() => {
      setSaving(false);
    }, 500);
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to={`/arena/${arenaCase.id}`} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Case
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <Trophy className="w-8 h-8 text-[#1D9E75]" />
            <h1 className="text-2xl font-bold text-white">Submit Solution</h1>
            <TrackBadge track="open_arena" />
          </div>
          <div className="glass-card p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">{arenaCase.title}</h3>
            <ProblemTypeBadge type={arenaCase.type} />
            <DeliverablesList deliverables={arenaCase.deliverables} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-4">
              <span className="text-[#1D9E75] font-medium">No gate required</span> — your solution will be published immediately and ranked by community upvotes.
              Base points: {arenaCase.pts} × 0.5× credibility weight = {Math.round(arenaCase.pts * 0.5)} pts.
            </p>
          </div>

          {arenaCase.deliverables.map((deliverable, index) => (
            <label key={index} className="block mb-4">
              <span className="text-sm font-medium text-white mb-2 block">{deliverable}</span>
              <textarea
                value={content[index] || ''}
                onChange={(e) => setContent({ ...content, [index]: e.target.value })}
                placeholder={`Your response for ${deliverable}...`}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[120px] focus:outline-none focus:border-[#1D9E75]"
                required
              />
            </label>
          ))}

          <div className="flex items-center gap-4 mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-secondary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 flex-1 justify-center"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Publishing...' : 'Publish Solution'}
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
