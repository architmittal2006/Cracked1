import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubLoginButton } from '../components/GitHubOAuth';
import { GoogleLoginButton } from '../components/GoogleOAuth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock registration - in production this would call the API
    const mockUser = {
      id: 'user_' + Date.now(),
      username: formData.username,
      name: formData.name,
      email: formData.email,
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
            <img src="/logo-with--cracked-----one-should-get-an-idea-that.png" alt="Cracked?" className="h-10 w-auto" />
            <span>Cracked?</span>
          </Link>
          
          <h1>Create your account</h1>
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <div className="login-benefits">
            <div className="login-benefit">
              <User className="w-5 h-5" />
              <span>Public profile at /profile/your-username</span>
            </div>
            <div className="login-benefit">
              <Mail className="w-5 h-5" />
              <span>Email OTP or Google OAuth sign-in</span>
            </div>
          </div>
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
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
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
              Create account
            </button>
          </form>

          <div className="login-clean-footnote">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
