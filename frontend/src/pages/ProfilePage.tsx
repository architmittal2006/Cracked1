import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CURRENT_USER, MOCK_SUBMISSIONS, MOCK_REVIEWS, getUserByUsername } from '../data/mockData';
import { TierBadge } from '../components/TierBadge';
import { ReviewerBadge } from '../components/ReviewerBadge';
import { ScoreRing } from '../components/ScoreRing';
import { StatusPill } from '../components/StatusPill';
import { Avatar } from '../components/Avatar';
import { TierProgressBar } from '../components/TierProgressBar';
import { Diamond, Trophy, Star, Share2 } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';

export const ProfilePage: React.FC = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const user = username ? getUserByUsername(username) : CURRENT_USER;
  const isOwnProfile = !username || user?.id === CURRENT_USER.id;

  if (!user) {
    return (
      <PageWrapper>
        <div className='py-20 text-center'>
          <h2 className='mb-4 text-2xl font-bold text-white'>Profile Not Found</h2>
          <Button variant='primary' size='md' onClick={() => navigate('/leaderboard')}>View Leaderboard</Button>
        </div>
      </PageWrapper>
    );
  }

  const mergedSubmissions = MOCK_SUBMISSIONS.filter((s) => s.status === 'Merged' && s.userId === user.id);
  const userSubmissions = MOCK_SUBMISSIONS.filter((s) => s.userId === user.id);
  const ringScore = Math.min(10, (user.credibility_score / 10000) * 10);

  return (
    <PageWrapper>
      <div className='mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center'>
        <div className='flex items-center gap-6'>
          <div className='relative'>
            <Avatar initials={user.initials} size='xl' />
            {user.status === 'Active' && (
              <div className='absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-[#0a0e1a] bg-emerald-400' />
            )}
          </div>

          <div>
            <h1 className='mb-1 text-4xl font-bold tracking-[-0.05em] text-white'>{user.name}</h1>
            <p className='mb-3 text-sm text-slate-500'>@{user.username}</p>
            <div className='mb-3 flex flex-wrap items-center gap-3'>
              <TierBadge score={user.credibility_score} />
              <ReviewerBadge tier={user.reviewerTier} />
              <span className='text-sm text-slate-400'>
                Member since {new Date(user.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              {user.status === 'Dormant' && (
                <span className='text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500'>Dormant</span>
              )}
            </div>
            <p className='max-w-md text-sm leading-relaxed text-slate-300'>{user.bio}</p>
          </div>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <div className='flex items-center gap-5 rounded-2xl border border-white/8 bg-[#0d0d12] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <ScoreRing score={ringScore} maxScore={10} size={96} />
            <div>
              <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Credibility</div>
              <div className='mb-2 text-2xl font-black font-mono text-white'>{user.credibility_score.toLocaleString()}</div>
              <TierProgressBar score={user.credibility_score} compact />
            </div>
          </div>
          <Button variant='secondary' size='md' onClick={() => navigate(`/certificate/${user.username}`)} className='self-center gap-2'>
            <Share2 className='h-4 w-4' /> Certificate
          </Button>
        </div>
      </div>

      <div className='mb-12 grid gap-4 md:grid-cols-4'>
        {[
          { label: 'Solve Score', value: user.solve_score.toLocaleString(), color: 'text-cyan-300' },
          { label: 'Review Score', value: user.review_score.toLocaleString(), color: 'text-violet-300' },
          { label: 'Cases Solved', value: user.casesSolved.toString(), color: 'text-white' },
          { label: 'Merge Bonuses', value: user.merge_bonus_count.toString(), color: 'text-amber-300' },
        ].map((stat) => (
          <div key={stat.label} className='rounded-2xl border border-white/8 bg-[#0d0d12] p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)]'>
            <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>{stat.label}</div>
            <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className='mb-12 rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
        <h3 className='mb-6 text-xl font-bold text-white'>Track contributions</h3>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='rounded-xl border border-[#1D9E75]/30 bg-[#1D9E75]/5 p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-[#1D9E75]' />
              <span className='text-sm font-bold text-white'>Open Arena</span>
              <span className='text-[10px] text-slate-500'>0.5×</span>
            </div>
            <div className='mb-1 text-2xl font-black font-mono text-[#1D9E75]'>3</div>
            <div className='text-xs text-slate-400'>submissions</div>
          </div>

          <div className='rounded-xl border border-[#D4537E]/30 bg-[#D4537E]/5 p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-[#D4537E]' />
              <span className='text-sm font-bold text-white'>Community Questions</span>
              <span className='text-[10px] text-slate-500'>0.8×</span>
            </div>
            <div className='mb-1 text-2xl font-black font-mono text-[#D4537E]'>2</div>
            <div className='text-xs text-slate-400'>answers accepted</div>
          </div>

          <div className='rounded-xl border border-[#7F77DD]/30 bg-[#7F77DD]/5 p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-[#7F77DD]' />
              <span className='text-sm font-bold text-white'>Curated Cases</span>
              <span className='text-[10px] text-slate-500'>1.0×</span>
            </div>
            <div className='mb-1 text-2xl font-black font-mono text-[#7F77DD]'>{user.casesSolved}</div>
            <div className='text-xs text-slate-400'>cases solved</div>
          </div>
        </div>
      </div>

      {mergedSubmissions.length > 0 && (
        <div className='mb-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6'>
          <div className='mb-6 flex items-center gap-3'>
            <Trophy className='h-6 w-6 text-amber-300' />
            <h2 className='text-2xl font-bold text-white'>Merge bonuses</h2>
          </div>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {mergedSubmissions.map((sub) => (
              <div key={sub.id} className='flex items-start gap-3 rounded-xl border border-amber-500/30 bg-[#0d0d12] p-4'>
                <Diamond className='mt-1 h-5 w-5 fill-amber-300 text-amber-300' />
                <div>
                  <h4 className='mb-1 text-sm font-bold text-white'>{sub.caseName}</h4>
                  <p className='font-mono text-[11px] text-amber-300'>{new Date(sub.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='grid gap-8 lg:grid-cols-2'>
        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <h3 className='mb-6 text-xl font-bold text-white'>Submission history</h3>
          <div className='relative space-y-8 pl-6'>
            <div className='absolute left-[11px] top-2 bottom-2 w-px bg-slate-800' />
            {(isOwnProfile ? userSubmissions : userSubmissions.slice(0, 3)).map((sub) => (
              <div key={sub.id} className='relative'>
                <div className='absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 border-[#0f1629] bg-slate-700' />
                <div className='mb-2 flex items-start justify-between gap-2'>
                  <h4 className='text-sm font-bold text-white'>{sub.caseName}</h4>
                  <StatusPill status={sub.status} />
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-400'>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  {sub.finalScore && <span className='font-mono font-bold text-emerald-300'>{sub.finalScore} pts</span>}
                </div>
              </div>
            ))}
            {userSubmissions.length === 0 && <p className='text-sm text-slate-400'>No submissions yet.</p>}
          </div>
        </div>

        <div className='rounded-2xl border border-white/8 bg-[#0d0d12] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
          <h3 className='mb-6 text-xl font-bold text-white'>Review performance</h3>
          <div className='mb-8 grid gap-4 sm:grid-cols-2'>
            <div className='rounded-xl border border-white/8 bg-white/[0.02] p-4'>
              <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Reviews Completed</div>
              <div className='text-2xl font-black text-white'>{user.reviewsCompleted}</div>
            </div>
            <div className='rounded-xl border border-white/8 bg-white/[0.02] p-4'>
              <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Avg Author Rating</div>
              <div className='flex items-center gap-2'>
                <span className='text-2xl font-black text-amber-300'>{user.avgAuthorRating.toFixed(1)}</span>
                <Star className='h-4 w-4 fill-amber-300 text-amber-300' />
              </div>
            </div>
            <div className='rounded-xl border border-white/8 bg-white/[0.02] p-4'>
              <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Reviews Voided</div>
              <div className='text-2xl font-black text-slate-300'>
                {MOCK_REVIEWS.filter((r) => r.reviewerId === user.id && r.isVoided).length}
              </div>
            </div>
            <div className='rounded-xl border border-white/8 bg-white/[0.02] p-4'>
              <div className='mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>Reviewer Weight</div>
              <div className='text-2xl font-black text-emerald-300'>
                {user.reviewerTier === 'Arbiter' ? '4.0x' : user.reviewerTier === 'Verified' ? '1.5x' : '1.0x'}
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <Button variant='primary' size='md' onClick={() => navigate('/dashboard')} className='w-full justify-center'>
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProfilePage;
