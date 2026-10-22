import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className='relative mt-16 border-t border-white/10 bg-[#0a0c13] pt-12 pb-8'>
      <div className='page-container'>
        <div className='mb-12 grid gap-10 md:grid-cols-3'>
          <div>
            <div className='mb-4 flex items-center gap-3'>
              <img src='/logo-with--cracked-----one-should-get-an-idea-that.png' alt='Cracked?' className='h-9 w-auto' />
              <span className='text-base font-bold text-white'>Cracked?</span>
            </div>
            <p className='max-w-xs text-sm leading-relaxed text-slate-400'>
              Open-source case arena where peer review and rubric scoring build genuine consulting credibility.
            </p>
          </div>

          <div>
            <h4 className='mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Platform</h4>
            <ul className='space-y-3'>
              <li><Link to='/cases' className='text-sm text-slate-400 transition-colors hover:text-white'>Case Library</Link></li>
              <li><Link to='/arena' className='text-sm text-slate-400 transition-colors hover:text-white'>Open Arena</Link></li>
              <li><Link to='/leaderboard' className='text-sm text-slate-400 transition-colors hover:text-white'>Leaderboard</Link></li>
              <li><Link to='/how-it-works' className='text-sm text-slate-400 transition-colors hover:text-white'>How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'>Community</h4>
            <ul className='space-y-3'>
              <li><a href='https://github.com' target='_blank' rel='noreferrer' className='text-sm text-slate-400 transition-colors hover:text-white'>GitHub Repository</a></li>
              <li><Link to='/questions' className='text-sm text-slate-400 transition-colors hover:text-white'>Community Questions</Link></li>
              <li><Link to='/register' className='text-sm text-slate-400 transition-colors hover:text-white'>Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className='flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 md:flex-row'>
          <p className='text-xs text-slate-500'>© 2025 Cracked? — Peer-reviewed case solving.</p>
          <div className='inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300'>
            Proof of work beats promise
          </div>
        </div>
      </div>
    </footer>
  );
};
