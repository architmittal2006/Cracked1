import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0e1a] pt-12 pb-8 relative mt-16 border-t border-white/10">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-10 w-auto" />
              <span className="font-bold text-white text-base">Cracked?</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Open-source case arena where peer review and rubric scoring build genuine consulting credibility.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/cases" className="text-slate-400 hover:text-brand transition-colors text-sm">Case Library</Link></li>
              <li><Link to="/arena" className="text-slate-400 hover:text-brand transition-colors text-sm">Open Arena</Link></li>
              <li><Link to="/leaderboard" className="text-slate-400 hover:text-brand transition-colors text-sm">Leaderboard</Link></li>
              <li><Link to="/how-it-works" className="text-slate-400 hover:text-brand transition-colors text-sm">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Community</h4>
            <ul className="space-y-3">
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand transition-colors text-sm">GitHub Repository</a></li>
              <li><Link to="/questions" className="text-slate-400 hover:text-brand transition-colors text-sm">Community Questions</Link></li>
              <li><Link to="/register" className="text-slate-400 hover:text-brand transition-colors text-sm">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs">© 2025 Cracked? — Peer-reviewed case solving.</p>
          <p className="text-slate-400 text-[11px] font-mono tracking-wider">Proof of work beats promise</p>
        </div>
      </div>
    </footer>
  );
};
