import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { Avatar } from './Avatar';
import { TierBadge } from './TierBadge';

interface PodiumTop3Props {
  topUsers: Array<{
    rank: number;
    username: string;
    name: string;
    initials: string;
    credibility_score: number;
    casesSolved: number;
    merge_bonus_count: number;
  }>;
}

const rankColors = {
  1: { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500', text: 'text-amber-400', icon: 'text-amber-400' },
  2: { bg: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400', text: 'text-slate-300', icon: 'text-slate-300' },
  3: { bg: 'from-orange-700/20 to-orange-800/10', border: 'border-orange-700', text: 'text-orange-400', icon: 'text-orange-400' },
};

export const PodiumTop3: React.FC<PodiumTop3Props> = ({ topUsers }) => {
  if (topUsers.length === 0) return null;

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd for visual podium layout
  const validUsers = topUsers.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {podiumOrder.map((position) => {
        const user = validUsers[position];
        if (!user) return null;

        const rank = user.rank;
        const colors = rankColors[rank as keyof typeof rankColors] || rankColors[3];
        const heights = [160, 200, 120]; // 2nd, 1st, 3rd heights

        return (
          <div
            key={user.username}
            className="flex flex-col items-center"
            style={{ width: 'min(140px, 100%)' }}
          >
            {/* User Avatar & Info */}
            <div className="mb-4 text-center">
              <div className="relative inline-block mb-2">
                <Avatar initials={user.initials} size="lg" />
                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  {rank === 1 ? (
                    <Trophy className={`w-3 h-3 ${colors.icon}`} />
                  ) : (
                    <span className={`text-xs font-bold ${colors.text}`}>{rank}</span>
                  )}
                </div>
              </div>
              <div className="font-bold text-white text-sm mb-1">{user.name}</div>
              <div className="text-xs text-slate-400 mb-2">@{user.username}</div>
              <TierBadge score={user.credibility_score} />
            </div>

            {/* Podium Block */}
            <div
              className={`w-full rounded-t-lg bg-gradient-to-b ${colors.bg} border-t ${colors.border} flex flex-col items-center justify-end p-4 relative`}
              style={{ height: `${heights[position]}px` }}
            >
              <div className={`text-2xl font-black font-mono ${colors.text} mb-1`}>
                {user.credibility_score.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">credibility</div>
              
              {rank === 1 && (
                <div className="absolute top-2 right-2">
                  <Medal className="w-5 h-5 text-amber-400" />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-3 flex gap-4 text-xs text-slate-400">
              <div>
                <span className="font-mono font-bold text-white">{user.casesSolved}</span>
                <span className="ml-1">cases</span>
              </div>
              {user.merge_bonus_count > 0 && (
                <div>
                  <span className="font-mono font-bold text-amber-400">{user.merge_bonus_count}</span>
                  <span className="ml-1">merges</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
