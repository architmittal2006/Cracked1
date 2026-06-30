import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CURRENT_USER, MOCK_SUBMISSIONS, MOCK_REVIEWS, getUserByUsername } from '../data/mockData';
import { TierBadge } from '../components/TierBadge';
import { ReviewerBadge } from '../components/ReviewerBadge';
import { ScoreRing } from '../components/ScoreRing';
import { StatusPill } from '../components/StatusPill';
import { Avatar } from '../components/Avatar';
import { TierProgressBar } from '../components/TierProgressBar';
import { Diamond, Trophy, Star, Share2 } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';

export const ProfilePage: React.FC = () => {
  const { username } = useParams();
  const user = username ? getUserByUsername(username) : CURRENT_USER;
  const isOwnProfile = !username || user?.id === CURRENT_USER.id;

  if (!user) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <Link to="/leaderboard" className="btn-primary">View Leaderboard</Link>
        </div>
      </PageWrapper>
    );
  }

  const mergedSubmissions = MOCK_SUBMISSIONS.filter(s => s.status === 'Merged' && s.userId === user.id);
  const userSubmissions = MOCK_SUBMISSIONS.filter(s => s.userId === user.id);
  const ringScore = Math.min(10, (user.credibility_score / 10000) * 10);

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex gap-6 items-center">
          <div className="relative">
            <Avatar initials={user.initials} size="xl" />
            {user.status === 'Active' && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-4 border-[#0a0e1a] rounded-full" />
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold text-white mb-1">{user.name}</h1>
            <p className="text-slate-500 text-sm mb-3">@{user.username}</p>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <TierBadge score={user.credibility_score} />
              <ReviewerBadge tier={user.reviewerTier} />
              <span className="text-sm text-slate-400">
                Member since {new Date(user.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              {user.status === 'Dormant' && (
                <span className="text-xs font-bold text-slate-500 uppercase">Dormant</span>
              )}
            </div>
            <p className="text-slate-300 max-w-md text-sm">{user.bio}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-6">
            <ScoreRing score={ringScore} maxScore={10} size={96} />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Credibility</div>
              <div className="text-2xl font-black font-mono text-white mb-2">{user.credibility_score.toLocaleString()}</div>
              <TierProgressBar score={user.credibility_score} compact />
            </div>
          </div>
          <Link to={`/certificate/${user.username}`} className="btn-secondary self-center">
            <Share2 className="w-4 h-4" /> Certificate
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Solve Score', value: user.solve_score.toLocaleString(), color: 'text-cyan-400' },
          { label: 'Review Score', value: user.review_score.toLocaleString(), color: 'text-violet-400' },
          { label: 'Cases Solved', value: user.casesSolved.toString(), color: 'text-white' },
          { label: 'Merge Bonuses', value: user.merge_bonus_count.toString(), color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className="text-xs text-slate-500 uppercase mb-1">{stat.label}</div>
            <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Track-specific contributions */}
      <div className="glass-card p-6 mb-12">
        <h3 className="text-xl font-bold text-white mb-6">Track Contributions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-[#1D9E75]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#1D9E75]" />
              <span className="text-sm font-bold text-white">Open Arena</span>
              <span className="text-xs text-slate-500">0.5× weight</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#1D9E75] mb-1">3</div>
            <div className="text-xs text-slate-400">submissions</div>
          </div>
          <div className="bg-slate-900 border border-[#D4537E]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#D4537E]" />
              <span className="text-sm font-bold text-white">Community Questions</span>
              <span className="text-xs text-slate-500">0.8× weight</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#D4537E] mb-1">2</div>
            <div className="text-xs text-slate-400">answers accepted</div>
          </div>
          <div className="bg-slate-900 border border-[#7F77DD]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#7F77DD]" />
              <span className="text-sm font-bold text-white">Curated Cases</span>
              <span className="text-xs text-slate-500">1.0× weight</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#7F77DD] mb-1">{user.casesSolved}</div>
            <div className="text-xs text-slate-400">cases solved</div>
          </div>
        </div>
      </div>

      {mergedSubmissions.length > 0 && (
        <div className="glass-card p-8 mb-12 border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Merge Bonuses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mergedSubmissions.map(sub => (
              <div key={sub.id} className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex gap-4 items-start">
                <Diamond className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{sub.caseName}</h4>
                  <p className="text-amber-400 text-xs font-mono">{new Date(sub.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-8">Submission History</h3>
          <div className="relative pl-6 space-y-8">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-800" />
            {(isOwnProfile ? userSubmissions : userSubmissions.slice(0, 3)).map(sub => (
              <div key={sub.id} className="relative">
                <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-[#0f1629]" />
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-white text-sm">{sub.caseName}</h4>
                  <StatusPill status={sub.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{new Date(sub.createdAt).toLocaleDateString()}</span>
                  {sub.finalScore && (
                    <span className="font-mono font-bold text-emerald-400">{sub.finalScore} pts</span>
                  )}
                </div>
              </div>
            ))}
            {userSubmissions.length === 0 && (
              <p className="text-slate-400 text-sm">No submissions yet.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-8">Review Performance</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 uppercase mb-1">Reviews Completed</div>
              <div className="text-2xl font-black text-white">{user.reviewsCompleted}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 uppercase mb-1">Avg Author Rating</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-amber-400">{user.avgAuthorRating.toFixed(1)}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 uppercase mb-1">Reviews Voided</div>
              <div className="text-2xl font-black text-slate-300">
                {MOCK_REVIEWS.filter(r => r.reviewerId === user.id && r.isVoided).length}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-slate-400 uppercase mb-1">Reviewer Weight</div>
              <div className="text-2xl font-black text-emerald-400">
                {user.reviewerTier === 'Arbiter' ? '4.0x' : user.reviewerTier === 'Verified' ? '1.5x' : '1.0x'}
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <Link to="/dashboard" className="btn-primary w-full justify-center">Go to Dashboard</Link>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
