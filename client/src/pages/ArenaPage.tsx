import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, TrendingUp } from 'lucide-react';
import { MOCK_ARENA_CASES } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';

export const ArenaPage: React.FC = () => {
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-[#1D9E75]" />
            <h1 className="text-3xl font-bold text-white">Open Arena</h1>
            <TrackBadge track="open_arena" />
          </div>
          <p className="text-slate-400 max-w-2xl">
            No gate · submit immediately · community upvote ranking. Track 1 has 0.5× credibility weight.
          </p>
        </div>

        <div className="grid gap-4">
          {MOCK_ARENA_CASES.map((arenaCase) => (
            <Link
              key={arenaCase.id}
              to={`/arena/${arenaCase.id}`}
              className="glass-card p-6 hover:border-[#1D9E75]/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ProblemTypeBadge type={arenaCase.type} />
                    <span className="text-xs text-slate-500">{arenaCase.sector}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#1D9E75] transition-colors">
                    {arenaCase.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{arenaCase.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{arenaCase.submissionCount} submissions</span>
                    <span>•</span>
                    <span>{arenaCase.pts} pts</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-[#1D9E75]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-bold">{arenaCase.upvotes}</span>
                  </div>
                  <span className="text-xs text-slate-500">upvotes</span>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-[#1D9E75] transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};
