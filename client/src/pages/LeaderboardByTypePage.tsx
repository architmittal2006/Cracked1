import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { MOCK_USERS, SLUG_TO_PROBLEM_TYPE, PROBLEM_TYPE_SLUGS } from '../data/mockData';
import type { ProblemType } from '../data/mockData';
import { TierBadge } from '../components/TierBadge';
import { DiffBadge } from '../components/DiffBadge';
import { Avatar } from '../components/Avatar';
import { PageWrapper } from '../components/PageWrapper';

export const LeaderboardByTypePage: React.FC = () => {
  const { type } = useParams();
  const problemType = type ? SLUG_TO_PROBLEM_TYPE[type] : undefined;
  const [searchQuery, setSearchQuery] = useState('');

  if (!problemType) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Type not found</h2>
          <Link to="/leaderboard" className="btn-primary">Global Leaderboard</Link>
        </div>
      </PageWrapper>
    );
  }

  const sortedUsers = [...MOCK_USERS]
    .filter(u => u.specializations.includes(problemType))
    .sort((a, b) => b.credibility_score - a.credibility_score)
    .slice(0, 10);

  const filteredUsers = sortedUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="section-label mb-2">{problemType.toUpperCase()}</div>
        <h1 className="section-title mb-4">{problemType} Specialists</h1>
        <p className="section-subtitle">
          Top contributors for {problemType.toLowerCase()} problems. SEO-indexed specialization rankings.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.entries(PROBLEM_TYPE_SLUGS) as [ProblemType, string][]).map(([label, slug]) => (
          <Link
            key={slug}
            to={`/leaderboard/${slug}`}
            className={`btn-ghost text-xs ${slug === type ? 'bg-emerald-500/10 text-emerald-400' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="relative w-full max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search specialists..."
          className="input-field pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Specialist</th>
              <th>Tier</th>
              <th>Credibility</th>
              <th>Cases</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr key={user.id}>
                <td className="font-mono font-bold text-slate-400">#{idx + 1}</td>
                <td>
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3 hover:text-emerald-400">
                    <Avatar initials={user.initials} size="sm" />
                    <span className="font-bold text-white">{user.name}</span>
                  </Link>
                </td>
                <td><TierBadge score={user.credibility_score} /></td>
                <td className="font-mono font-bold text-emerald-400">{user.credibility_score.toLocaleString()}</td>
                <td className="font-mono text-slate-400">{user.casesSolved}</td>
                <td>
                  {user.rankDelta === 'NEW' ? (
                    <span className="text-xs font-bold text-blue-400">NEW</span>
                  ) : (
                    <DiffBadge value={user.rankDelta as number} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};
