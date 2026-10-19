import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';
import { Button } from './Button';

const navLinks = [
  { to: '/cases', label: 'Cases' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/how-it-works', label: 'How It Works' },
];

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 z-50 h-16 w-full border-b border-white/10 backdrop-blur-md bg-[#0a0e1a]/90">
      <div className="page-container h-full flex items-center justify-between px-4 lg:px-20">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-11 w-auto transition-transform duration-300 group-hover:scale-105" />
        </Link>

        {/* Desktop: nav links + auth actions */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium text-slate-300 transition-colors ${isActive ? 'text-white' : ''} hover:text-white`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link to={`/profile/${user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar initials={user.name.split(' ').map(n => n[0]).join('')} size="sm" />
                  <span className="hidden sm:inline text-sm font-medium text-white">{user.name}</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" as="a" href="/login">
                  <LogIn className="w-4 h-4" /> Log in
                </Button>
                <Button variant="primary" size="sm" as="a" href="/register">
                  Sign up free
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="lg:hidden text-slate-300 hover:text-white transition-colors p-2 rounded-md hover:bg-white/5"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0a0e1a] h-full border-l border-white/10 flex flex-col p-6 ml-auto animate-slide-in-right shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-white text-sm">Menu</span>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-md hover:bg-white/5" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">Navigation</div>
              {navLinks.map((link, index) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                  }
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="h-px w-full bg-white/10 my-4" />

            <div className="flex flex-col gap-2 pt-4">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">Account</div>
              {isAuthenticated && user ? (
                <>
                  <Link to={`/profile/${user.username}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 transition-all">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.name}</span>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-center text-slate-400 hover:text-white">
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" as="a" href="/login" className="w-full justify-center">
                    <LogIn className="w-4 h-4" /> Log in
                  </Button>
                  <Button variant="primary" size="sm" as="a" href="/register" className="w-full justify-center">
                    Sign up free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
