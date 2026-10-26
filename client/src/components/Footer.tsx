import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--bg-surface)] pt-12 pb-8 relative mt-16 border-t border-[var(--border-subtle)]" aria-label="Site footer">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-10 w-auto" />
              <span className="font-bold text-white text-base">Cracked?</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-4">
              Proof of work beats promise.
            </p>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">
                <span className="text-[var(--text-secondary)]">Contact:</span>{' '}
                <a href="mailto:hello@cracked.com" className="text-slate-300 hover:text-[#C75B39] transition-colors">hello@cracked.com</a>
              </p>
              <p className="text-slate-400 text-sm">
                <span className="text-[var(--text-secondary)]">Twitter:</span>{' '}
                <a href="https://twitter.com/cracked_platform" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[#C75B39] transition-colors">@cracked_platform</a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4 text-sm">Practice</h4>
            <ul className="space-y-3">
              <li><Link to="/cases" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">Case Library</Link></li>
              <li><Link to="/casebooks" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">Casebooks</Link></li>
              <li><Link to="/arena" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">Open Arena</Link></li>
              <li><Link to="/how-it-works" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4 text-sm">Questions</h4>
            <ul className="space-y-3">
              <li><Link to="/questions" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">Community Questions</Link></li>
              <li><Link to="/register" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-slate-400 hover:text-[#C75B39] transition-colors text-sm">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs">© 2025 Cracked? — Structured case practice.</p>
          <p className="text-slate-400 text-xs">Proof of work beats promise</p>
        </div>
      </div>
    </footer>
  );
};
