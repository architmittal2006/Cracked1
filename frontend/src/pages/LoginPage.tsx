import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  GitPullRequest,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubLoginButton } from '../components/GitHubOAuth';
import { GoogleLoginButton } from '../components/GoogleOAuth';

const benefits = [
  { icon: GitPullRequest, text: 'Solve structured consulting cases and guesstimates' },
  { icon: BadgeCheck, text: 'Save drafts, submit attempts, and compare approaches' },
  { icon: ShieldCheck, text: 'Build a profile of real problem-solving work' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="login-stage">
      <div className="login-bg" aria-hidden="true" />
      <section className="page-container login-shell">
        <div className="login-copy">
          <p className="login-eyebrow">Student access</p>
          <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">
            Practice consulting cases. Build proof of work.
          </h1>
          <p>For students who want to work through real business problems and show how they think.</p>

          <div className="login-proof-grid">
            {benefits.map(({ icon: Icon, text }) => (
              <div className="login-proof" key={text}>
                <Icon className="w-5 h-5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-panel">
          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email</span>
              <div className="login-input-wrap">
                <Mail className="w-5 h-5" />
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </label>

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
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-400">{error}</p>
            )}

            <button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-4 space-y-2">
              <GoogleLoginButton onSuccess={handleOAuthSuccess} />
              <GitHubLoginButton onSuccess={handleOAuthSuccess} />
            </div>
          </form>

          <div className="login-footnote">
            <span>New here?</span>
            <Link to="/register">Create account</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
