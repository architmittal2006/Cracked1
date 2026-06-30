import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Eye,
  GitPullRequest,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubLoginButton } from '../components/GitHubOAuth';
import { GoogleLoginButton } from '../components/GoogleOAuth';

type LoginRole = 'contributor' | 'organization';
type AuthMode = 'password' | 'otp';

const roleContent = {
  contributor: {
    eyebrow: 'Contributor access',
    title: 'Solve cases. Review peers. Build proof of work.',
    description: 'For consultants, students, and operators who want to compete and earn credibility.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@domain.com',
    cta: 'Enter the Arena',
    bullets: [
      { icon: GitPullRequest, text: 'Submit typed case solutions across 7 problem types' },
      { icon: BadgeCheck, text: 'Complete 2 peer reviews to unlock each submission gate' },
      { icon: ShieldCheck, text: 'Grow a live credibility score from Analyst to Partner' },
    ],
  },
  organization: {
    eyebrow: 'Organization access',
    title: 'Post real cases and find reviewed talent.',
    description: 'For companies that want to publish challenges and identify top contributors.',
    emailLabel: 'Work email',
    emailPlaceholder: 'team@company.com',
    cta: 'Enter Organization Portal',
    bullets: [
      { icon: BriefcaseBusiness, text: 'Create cases with confidentiality tiers' },
      { icon: Eye, text: 'Browse contributor portfolios and submissions' },
      { icon: Building2, text: 'Issue Merge Bonuses to top solutions' },
    ],
  },
} as const;

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<LoginRole>('contributor');
  const [authMode, setAuthMode] = useState<AuthMode>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const active = roleContent[role];

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in production this would call the API
    const mockUser = {
      id: 'user_' + Date.now(),
      username: email.split('@')[0],
      name: email.split('@')[0],
      email: email,
    };
    login(mockUser);
    navigate(from, { replace: true });
  };

  const handleGoogleSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="login-stage">
      <div className="login-bg" aria-hidden="true" />
      <section className="page-container login-shell">
        <div className="login-copy">
          <p className="login-eyebrow">{active.eyebrow}</p>
          <h1>{active.title}</h1>
          <p>{active.description}</p>

          <div className="login-proof-grid">
            {active.bullets.map(({ icon: Icon, text }) => (
              <div className="login-proof" key={text}>
                <Icon className="w-5 h-5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-panel">
          <div className="role-switch" aria-label="Choose login type">
            <button type="button" className={role === 'contributor' ? 'active' : ''} onClick={() => setRole('contributor')}>
              <UserRoundCheck className="w-5 h-5" /> Contributor
            </button>
            <button type="button" className={role === 'organization' ? 'active' : ''} onClick={() => setRole('organization')}>
              <Building2 className="w-5 h-5" /> Organization
            </button>
          </div>

          <div className="role-switch mb-4" aria-label="Auth method">
            <button type="button" className={authMode === 'otp' ? 'active' : ''} onClick={() => setAuthMode('otp')}>
              Email OTP
            </button>
            <button type="button" className={authMode === 'password' ? 'active' : ''} onClick={() => setAuthMode('password')}>
              Password
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>{active.emailLabel}</span>
              <div className="login-input-wrap">
                <Mail className="w-5 h-5" />
                <input 
                  type="email" 
                  placeholder={active.emailPlaceholder} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            {authMode === 'password' ? (
              <label>
                <span>Password</span>
                <div className="login-input-wrap">
                  <LockKeyhole className="w-5 h-5" />
                  <input 
                    type="password" 
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </label>
            ) : (
              <p className="text-xs text-slate-500 -mt-2">We&apos;ll send a one-time code to your email. No password needed.</p>
            )}

            <button type="submit" className="login-submit">
              {authMode === 'otp' ? 'Send Login Code' : active.cta}
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-4 space-y-2">
              <GoogleLoginButton onSuccess={handleGoogleSuccess} />
              <GitHubLoginButton onSuccess={handleGoogleSuccess} />
            </div>
          </form>

          <div className="login-footnote">
            <span>{role === 'contributor' ? 'New here?' : 'Want to post cases?'}</span>
            <Link to={role === 'contributor' ? '/register' : '/how-it-works'}>
              {role === 'contributor' ? 'Create account' : 'See organization flow'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
