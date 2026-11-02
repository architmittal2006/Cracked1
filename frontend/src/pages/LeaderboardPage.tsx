import React, { useState } from 'react';
import { Search, Trophy, Users, Sparkles } from 'lucide-react';
import { MOCK_USERS, CREDIBILITY_TIER_THRESHOLDS, getCredibilityTier } from '../data/mockData';
import type { CredibilityTier, TrackType } from '../data/mockData';
import { Avatar } from '../components/Avatar';
import { TrackBadge } from '../components/TrackBadge';
import { CURRENT_USER } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { PodiumTop3 } from '../components/PodiumTop3';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { Button } from '../components/Button';

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

  const filteredUsers = sortedUsers.filter((u) => {
    const nameMatch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const tierMatch = tierFilter === 'All' || getCredibilityTier(u.credibility_score) === tierFilter;
    return nameMatch && tierMatch;
  });

  const top3 = sortedUsers.slice(0, 3);
  const currentUserRank = sortedUsers.findIndex((u) => u.id === CURRENT_USER.id) + 1;
  const showPinnedRow = currentUserRank > 20;

  const tierDistribution = CREDIBILITY_TIER_THRESHOLDS.map(({ tier }) => ({
    tier,
    count: MOCK_USERS.filter((u) => getCredibilityTier(u.credibility_score) === tier).length,
    pct: (MOCK_USERS.filter((u) => getCredibilityTier(u.credibility_score) === tier).length / MOCK_USERS.length) * 100,
  }));

  const summaryCards = [
    { label: 'Contributors', value: MOCK_USERS.length.toLocaleString(), icon: Users, tone: 'text-cyan-300' },
    { label: 'Top tier', value: 'Partner', icon: Trophy, tone: 'text-[#FF4C25]' },
    { label: 'Current', value: `#${currentUserRank}`, icon: Sparkles, tone: 'text-emerald-300' },
  ];

  return (
    <PageWrapper>
      <div className='page-header text-center'>
        <div className='section-label mb-2'>Rankings</div>
        <h1 className='section-title mb-4'>Global Leaderboard</h1>
        <p className='section-subtitle mx-auto'>
          Credibility = 70% Solve + 30% Review. Inactivity &gt; 90 days = Dormant.
        </p>
      </div>

      <div className='mb-8 grid gap-4 md:grid-cols-3'>
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className='rounded-2xl border border-white/8 bg-[#0d0d12] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>{label}</div>
                <div className={`mt-2 text-2xl font-black ${tone}`}>{value}</div>
              </div>
              <div className='flex h-11 w-11 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] text-slate-300'>
                <Icon className='h-5 w-5' />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
        <div className='inline-flex rounded-xl border border-white/8 bg-[#0d0d12] p-1'>
          {['All Time', 'This Month'].map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm transition-all ${
                activeTab === tab
                  ? 'bg-[#FF4C25] text-black font-semibold shadow-[0_12px_24px_rgba(255,76,37,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className='relative w-full md:max-w-xs'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500' />
          <input
            type='text'
            placeholder='Search contributors...'
            className='w-full rounded-xl border border-white/10 bg-[#0d0d12] pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-[#FF4C25]/60 focus:outline-none focus:ring-2 focus:ring-[#FF4C25]/20'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className='mb-8 flex flex-wrap gap-2'>
        <span className='mr-1 self-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Track</span>
        {TRACKS.map((track) => (
          <Button
            key={track.id}
            variant='ghost'
            size='sm'
            onClick={() => setTrackFilter(track.id)}
            className={trackFilter === track.id ? 'border border-white/10 bg-white/[0.04] text-white' : ''}
            style={trackFilter === track.id ? { borderColor: track.color, color: track.color } : {}}
          >
            {track.label}
          </Button>
        ))}
      </div>

      <div className='mb-8 flex flex-wrap gap-2'>
        <span className='mr-1 self-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Tier</span>
        {(['All', ...CREDIBILITY_TIER_THRESHOLDS.map((t) => t.tier)] as const).map((tier) => (
          <Button
            key={tier}
            variant='ghost'
            size='sm'
            onClick={() => setTierFilter(tier)}
            className={tierFilter === tier ? 'border border-[#FF4C25]/30 bg-[#FF4C25]/10 text-[#FF8F72]' : ''}
          >
            {tier}
          </Button>
        ))}
      </div>

      {trackFilter !== 'all' && (
        <div className='mb-8 rounded-2xl border border-white/8 bg-[#0d0d12] p-4' style={{ borderLeftColor: TRACKS.find((t) => t.id === trackFilter)?.color, borderLeftWidth: 4 }}>
          <div className='flex items-center gap-2'>
            <TrackBadge track={trackFilter as TrackType} />
            <span className='text-sm text-slate-400'>
              Showing rankings for {TRACKS.find((t) => t.id === trackFilter)?.label} only
            </span>
          </div>
        </div>
      )}

      {searchQuery === '' && tierFilter === 'All' && (
        <div className='mb-8'>
          <PodiumTop3
            topUsers={top3.map((user) => ({
              rank: sortedUsers.findIndex((u) => u.id === user.id) + 1,
              username: user.username,
              name: user.name,
              initials: user.initials,
              credibility_score: user.credibility_score,
              casesSolved: user.casesSolved,
              merge_bonus_count: user.merge_bonus_count,
            }))}
          />
        </div>
      )}

      <div className='mb-8 rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
        <h3 className='mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Tier distribution</h3>
        <div className='space-y-3'>
          {tierDistribution.map(({ tier, pct }) => (
            <div key={tier} className='flex items-center gap-3'>
              <span className='w-24 text-xs text-slate-400'>{tier}</span>
              <div className='h-2 flex-1 overflow-hidden rounded-full bg-white/5'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-[#FF4C25] to-[#FF8F72] transition-all duration-500'
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className='w-10 text-right font-mono text-xs text-slate-500'>{pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
        <LeaderboardTable
          entries={filteredUsers.slice(0, 20).map((user) => ({
            rank: sortedUsers.findIndex((u) => u.id === user.id) + 1,
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
      </div>

      {showPinnedRow && searchQuery === '' && (
        <div className='mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <span className='font-mono text-slate-400'>#{currentUserRank}</span>
              <Avatar initials={CURRENT_USER.initials} size='sm' />
              <span className='font-bold text-white'>{CURRENT_USER.name} (You)</span>
            </div>
            <span className='font-mono font-bold text-emerald-300'>{CURRENT_USER.credibility_score.toLocaleString()}</span>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default LeaderboardPage;
