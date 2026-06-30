import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0e1a] pt-16 pb-8 relative mt-20">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-50" />

      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-20 w-auto" />
              <span className="font-bold text-white text-lg">Platform</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              Open-source case competitions where peer review builds real consulting credibility.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/cases" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Case Library</Link></li>
              <li><Link to="/leaderboard" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Leaderboard</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/how-it-works" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Community</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">GitHub Repository</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Discord Server</a></li>
              <li><Link to="/register" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Create Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">© 2025 Cracked? — Built in the open.</p>
          <p className="text-slate-600 text-[10px] uppercase font-mono tracking-widest">CaseForge roadmap · MVP phases 0–5</p>
        </div>
      </div>
    </footer>
  );
};
