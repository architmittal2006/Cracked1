import React from 'react';
import { Avatar } from './Avatar';
import { TierBadge } from './TierBadge';

interface LeaderboardTableProps {
  entries: Array<{
    rank: number;
    user: {
      username: string;
      name: string;
      initials: string;
      credibility_score: number;
      casesSolved: number;
      merge_bonus_count: number;
    };
    score: number;
    casesSolved: number;
    mergeBonuses: number;
    rankDelta: number | 'NEW';
  }>;
  currentUserRank?: number;
}

const RankDeltaBadge: React.FC<{ delta: number | 'NEW' }> = ({ delta }) => {
  if (delta === 'NEW') {
    return (
      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
        NEW
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
        +{delta}
      </span>
    );
  }

  if (delta < 0) {
    return (
      <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">
        {delta}
      </span>
    );
  }

  return (
    <span className="text-xs font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">
      —
    </span>
  );
};

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  currentUserRank,
}) => {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-amber-400 font-bold">🥇</span>;
    if (rank === 2) return <span className="text-slate-300 font-bold">🥈</span>;
    if (rank === 3) return <span className="text-orange-400 font-bold">🥉</span>;
    return <span className="font-mono font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
              Rank
            </th>
            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contributor
            </th>
            <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
              Credibility
            </th>
            <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
              Cases
            </th>
            <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
              Merges
            </th>
            <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.user.username}
              className={`border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors ${
                entry.rank === currentUserRank ? 'bg-blue-500/5' : ''
              }`}
            >
              <td className="p-4">
                {getRankDisplay(entry.rank)}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={entry.user.initials} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {entry.user.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      @{entry.user.username}
                    </div>
                  </div>
                  <TierBadge score={entry.user.credibility_score} />
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="font-mono font-bold text-emerald-400">
                  {entry.score.toLocaleString()}
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="font-mono text-sm text-slate-300">
                  {entry.casesSolved}
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="font-mono text-sm text-amber-400">
                  {entry.mergeBonuses}
                </div>
              </td>
              <td className="p-4 text-center">
                <RankDeltaBadge delta={entry.rankDelta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
