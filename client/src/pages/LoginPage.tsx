import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubLoginButton } from '../components/GitHubOAuth';
import { GoogleLoginButton } from '../components/GoogleOAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="login-clean-stage">
      <section className="login-clean-shell">
        <div className="login-clean-copy">
          <Link to="/" className="login-brand-link">
            <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-8 w-auto" />
            <span>Cracked?</span>
          </Link>
          
          <h1>Welcome back</h1>
          <p>Log in to continue practicing</p>
        </div>

        <div className="login-clean-panel">
          <div className="oauth-buttons">
            <GoogleLoginButton onSuccess={handleGoogleSuccess} />
            <GitHubLoginButton onSuccess={handleGoogleSuccess} />
          </div>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span>or</span>
            <div className="auth-divider-line" />
          </div>

          <form onSubmit={handleSubmit} className="login-clean-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="form-header">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
              </div>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-clean-submit">
              Log in
            </button>
          </form>

          <div className="login-clean-footnote">
            <span>Don't have an account?</span>
            <Link to="/register">Sign up</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
