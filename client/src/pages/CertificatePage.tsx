import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { QrCode, Share2, ShieldCheck } from 'lucide-react';
import { getUserByUsername, getCredibilityTier, CREDIBILITY_TIER_THRESHOLDS } from '../data/mockData';
import { TierBadge } from '../components/TierBadge';
import { ScoreRing } from '../components/ScoreRing';
import { PageWrapper } from '../components/PageWrapper';

function generateVerificationHash(username: string, score: number): string {
  let hash = 0;
  const str = `${username}:${score}:cracked-platform-salt-2024`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
}

export const CertificatePage: React.FC = () => {
  const { username } = useParams();
  const user = username ? getUserByUsername(username) : undefined;

  if (!user) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Certificate Not Found</h2>
          <Link to="/leaderboard" className="btn-primary">View Leaderboard</Link>
        </div>
      </PageWrapper>
    );
  }

  const tier = getCredibilityTier(user.credibility_score);
  const hash = generateVerificationHash(user.username, user.credibility_score);
  const tierThreshold = CREDIBILITY_TIER_THRESHOLDS.find(t => t.tier === tier);
  const tierMax = tierThreshold?.max ?? 9999;
  const ringScore = Math.min(10, (user.credibility_score / tierMax) * 10);

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 md:p-12 border-amber-500/30 bg-gradient-to-br from-slate-900 to-amber-950/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400" />

          <div className="section-label mb-4 flex items-center justify-center gap-2">
            <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-10 w-auto" />
            <span>CERTIFICATE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{user.name}</h1>
          <p className="text-slate-400 mb-6">@{user.username}</p>

          <div className="flex justify-center mb-6">
            <ScoreRing score={ringScore} maxScore={10} size={120} strokeWidth={8} />
          </div>

          <div className="text-4xl font-black font-mono text-emerald-400 mb-2">
            {user.credibility_score.toLocaleString()}
          </div>
          <div className="text-sm text-slate-400 mb-4">Credibility Score</div>
          <TierBadge tier={tier} />

          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800">
            <div>
              <div className="text-2xl font-bold text-white">{user.casesSolved}</div>
              <div className="text-xs text-slate-500 uppercase">Cases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{user.merge_bonus_count}</div>
              <div className="text-xs text-slate-500 uppercase">Merges</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{user.reviewsCompleted}</div>
              <div className="text-xs text-slate-500 uppercase">Reviews</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-900" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                <ShieldCheck className="w-4 h-4" /> Verified
              </div>
              <div className="text-xs text-slate-500 font-mono">Hash: {hash}</div>
              <div className="text-xs text-slate-500 mt-1">Live score · updates in real-time</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Link to={`/profile/${user.username}`} className="btn-secondary">View Profile</Link>
          <button type="button" className="btn-primary flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share on LinkedIn
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
