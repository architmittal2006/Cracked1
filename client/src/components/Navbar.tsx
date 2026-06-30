import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TierBadge } from './TierBadge';
import { Avatar } from './Avatar';
import { TrackSwitcher } from './TrackSwitcher';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/cases', label: 'Cases' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/how-it-works', label: 'How It Works' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0e1a]/80 backdrop-blur-nav border-b border-subtle h-16">
      <div className="page-container h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-20 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <TrackSwitcher />
          <div className="flex gap-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {isAuthenticated && user ? (
            <>
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar initials={user.name.split(' ').map(n => n[0]).join('')} size="sm" />
                <TierBadge score={0} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-ghost text-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-secondary text-sm">
                Sign Up
              </Link>
              <Link to="/login" className="nav-login-button">
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-sm bg-slate-900 h-full border-l border-slate-800 flex flex-col p-6 ml-auto animate-slide-in-right">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-white">Menu</span>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `text-lg font-medium ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="h-px w-full bg-slate-800 my-2" />
              {isAuthenticated && user ? (
                <>
                  <Link to={`/profile/${user.username}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-slate-300">
                    <Avatar initials={user.name.split(' ').map(n => n[0]).join('')} size="sm" />
                    <span>Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn-ghost justify-center text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary justify-center text-sm">
                    Sign Up
                  </Link>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="nav-login-button justify-center">
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
