import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { MOCK_USERS, CREDIBILITY_TIER_THRESHOLDS, getCredibilityTier } from '../data/mockData';
import type { CredibilityTier, TrackType } from '../data/mockData';
import { Avatar } from '../components/Avatar';
import { CURRENT_USER } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { PodiumTop3 } from '../components/PodiumTop3';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { TrackBadge } from '../components/TrackBadge';

const TRACKS: { id: TrackType | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'All Tracks', color: '#7F77DD' },
  { id: 'open_arena', label: 'Arena', color: '#1D9E75' },
  { id: 'community_question', label: 'Questions', color: '#D4537E' },
  { id: 'curated_case', label: 'Curated', color: '#7F77DD' },
];

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<CredibilityTier | 'All'>('All');
  const [trackFilter, setTrackFilter] = useState<TrackType | 'all'>('all');

  const sortedUsers = [...MOCK_USERS].sort((a, b) => b.credibility_score - a.credibility_score);

  const filteredUsers = sortedUsers.filter(u => {
    const nameMatch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const tierMatch = tierFilter === 'All' || getCredibilityTier(u.credibility_score) === tierFilter;
    return nameMatch && tierMatch;
  });

  const top3 = sortedUsers.slice(0, 3);
  const currentUserRank = sortedUsers.findIndex(u => u.id === CURRENT_USER.id) + 1;
  const showPinnedRow = currentUserRank > 20;

  const tierDistribution = CREDIBILITY_TIER_THRESHOLDS.map(({ tier }) => ({
    tier,
    count: MOCK_USERS.filter(u => getCredibilityTier(u.credibility_score) === tier).length,
    pct: (MOCK_USERS.filter(u => getCredibilityTier(u.credibility_score) === tier).length / MOCK_USERS.length) * 100,
  }));

  return (
    <PageWrapper>
      <div className="page-header text-center">
        <div className="section-label mb-2">RANKINGS</div>
        <h1 className="section-title mb-4">Global Leaderboard</h1>
        <p className="section-subtitle mx-auto">
          Credibility = 70% Solve + 30% Review. Inactivity &gt; 90 days = Dormant.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {['All Time', 'This Month'].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search contributors..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-xs text-slate-500 uppercase font-bold self-center mr-1">Track</span>
        {TRACKS.map(track => (
          <button
            key={track.id}
            type="button"
            onClick={() => setTrackFilter(track.id)}
            className={`btn-ghost text-xs ${trackFilter === track.id ? 'bg-emerald-500/10 text-emerald-400' : ''}`}
          >
            {track.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-xs text-slate-500 uppercase font-bold self-center mr-1">Tier</span>
        {(['All', ...CREDIBILITY_TIER_THRESHOLDS.map(t => t.tier)] as const).map(tier => (
          <button
            key={tier}
            type="button"
            onClick={() => setTierFilter(tier)}
            className={`btn-ghost text-xs ${tierFilter === tier ? 'bg-emerald-500/10 text-emerald-400' : ''}`}
          >
            {tier}
          </button>
        ))}
      </div>

      {trackFilter !== 'all' && (
        <div className="glass-card p-4 mb-8 border-l-4" style={{ borderColor: TRACKS.find(t => t.id === trackFilter)?.color }}>
          <div className="flex items-center gap-2">
            <TrackBadge track={trackFilter as TrackType} />
            <span className="text-sm text-slate-400">
              Showing rankings for {TRACKS.find(t => t.id === trackFilter)?.label} track only
            </span>
          </div>
        </div>
      )}

      {searchQuery === '' && tierFilter === 'All' && (
        <PodiumTop3 topUsers={top3.map(user => ({
          rank: sortedUsers.findIndex(u => u.id === user.id) + 1,
          username: user.username,
          name: user.name,
          initials: user.initials,
          credibility_score: user.credibility_score,
          casesSolved: user.casesSolved,
          merge_bonus_count: user.merge_bonus_count,
        }))} />
      )}

      <div className="glass-card p-6 mb-8">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Tier Distribution</h3>
        <div className="space-y-3">
          {tierDistribution.map(({ tier, pct }) => (
            <div key={tier} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-28">{tier}</span>
              <div className="flex-1 progress-bar h-2">
                <div className="progress-bar-fill h-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono text-slate-500 w-10">{pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <LeaderboardTable 
        entries={filteredUsers.slice(0, 20).map((user) => ({
          rank: sortedUsers.findIndex(u => u.id === user.id) + 1,
          user: {
            username: user.username,
            name: user.name,
            initials: user.initials,
            credibility_score: user.credibility_score,
            casesSolved: user.casesSolved,
            merge_bonus_count: user.merge_bonus_count,
          },
          score: user.credibility_score,
          casesSolved: user.casesSolved,
          mergeBonuses: user.merge_bonus_count,
          rankDelta: user.rankDelta,
        }))}
        currentUserRank={currentUserRank}
      />

      {showPinnedRow && searchQuery === '' && (
        <div className="glass-card p-4 mt-4 border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">#{currentUserRank}</span>
            <Avatar initials={CURRENT_USER.initials} size="sm" />
            <span className="font-bold text-white">{CURRENT_USER.name} (You)</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">{CURRENT_USER.credibility_score.toLocaleString()}</span>
        </div>
      )}
    </PageWrapper>
  );
};
