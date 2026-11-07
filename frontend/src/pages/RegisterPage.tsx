import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubLoginButton } from '../components/GitHubOAuth';
import { GoogleLoginButton } from '../components/GoogleOAuth';
import { BrandLogo } from '../components/BrandLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { username, name, email, password, confirmPassword } = formData;

    if (!username || !name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp({ username, name, email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <Link to="/" className="mb-4 inline-block">
            <BrandLogo className="h-7 w-auto" />
          </Link>
          <p className="login-eyebrow">Create account</p>
          <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">Start practicing today.</h1>
          <p>Save your progress, submit solutions, and build your credibility.</p>
        </div>

        <div className="login-panel">
          <div className="mb-4 space-y-2">
            <GoogleLoginButton onSuccess={handleOAuthSuccess} />
            <GitHubLoginButton onSuccess={handleOAuthSuccess} />
          </div>

          <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-white/10" />
            or sign up with email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Username</span>
              <div className="login-input-wrap">
                <User className="w-5 h-5" />
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
            </label>

            <label>
              <span>Full name</span>
              <div className="login-input-wrap">
                <User className="w-5 h-5" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            </label>

            <label>
              <span>Email</span>
              <div className="login-input-wrap">
                <Mail className="w-5 h-5" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="login-input-wrap relative">
                <LockKeyhole className="w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <label>
              <span>Confirm password</span>
              <div className="login-input-wrap">
                <LockKeyhole className="w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-400">{error}</p>
            )}

            <button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="login-footnote">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
