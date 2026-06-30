import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { MOCK_ARENA_CASES } from '../data/mockData';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';
import { ProblemTypeBadge } from '../components/ProblemTypeBadge';
import { DeliverablesList } from '../components/DeliverablesList';

export const ArenaDetailPage: React.FC = () => {
  const { id } = useParams();
  const arenaCase = MOCK_ARENA_CASES.find(c => c.id === id);

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

  // Mock solutions for arena
  const mockSolutions = [
    { id: 'sol001', author: 'consultant_pro', upvotes: 23, downvotes: 3, net: 20, excerpt: 'Focus on channel optimization by reallocating 30% of ad spend from low-performing channels to high-intent search...' },
    { id: 'sol002', author: 'strategy_guru', upvotes: 18, downvotes: 5, net: 13, excerpt: 'Implement a tiered pricing model to improve LTV while reducing CAC through referral programs...' },
    { id: 'sol003', author: 'growth_hacker', upvotes: 15, downvotes: 2, net: 13, excerpt: 'Leverage content marketing and SEO to drive organic traffic, reducing paid acquisition costs by 40%...' },
  ].sort((a, b) => b.net - a.net);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/arena" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Arena
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <Trophy className="w-8 h-8 text-[#1D9E75]" />
            <h1 className="text-3xl font-bold text-white">{arenaCase.title}</h1>
            <TrackBadge track="open_arena" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <ProblemTypeBadge type={arenaCase.type} />
            <span className="text-sm text-slate-500">{arenaCase.sector}</span>
            <span className="text-sm text-slate-500">{arenaCase.difficulty}</span>
          </div>
          <p className="text-slate-300 mb-6">{arenaCase.description}</p>
          <DeliverablesList deliverables={arenaCase.deliverables} />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Top Solutions</h2>
            <span className="text-sm text-slate-500">Ranked by net upvotes</span>
          </div>
          <div className="grid gap-4">
            {mockSolutions.map((solution, index) => (
              <div key={solution.id} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <div className="text-2xl font-bold text-[#1D9E75]">#{index + 1}</div>
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>{solution.net}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">@{solution.author}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="w-3 h-3" />
                          {solution.upvotes}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <TrendingDown className="w-3 h-3" />
                          {solution.downvotes}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{solution.excerpt}</p>
                  </div>
                  <Link
                    to={`/arena/${arenaCase.id}/solutions/${solution.id}`}
                    className="btn-secondary text-sm"
                  >
                    Read Full
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to={`/arena/${arenaCase.id}/submit`} className="btn-primary">
            Submit Your Solution <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-500 mt-2">No gate required · submit immediately after login</p>
        </div>
      </div>
    </PageWrapper>
  );
};
