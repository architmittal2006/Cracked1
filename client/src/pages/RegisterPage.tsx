import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GitHubLoginButton } from '../components/GitHubOAuth';
import { GoogleLoginButton } from '../components/GoogleOAuth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', name: '', email: '' });

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
    <div className="login-stage">
      <div className="login-bg" aria-hidden="true" />

      <div className="page-container login-shell">
        <div className="login-copy">
          <p className="login-eyebrow">Join Cracked?</p>
          <h1>Create Your Account</h1>
          <p>
            Start solving real business cases, earn credibility through peer review,
            and build a shareable consulting portfolio.
          </p>

          <div className="login-proof-grid">
            <div className="login-proof">
              <User className="w-5 h-5" />
              <span>Public profile at /profile/your-username</span>
            </div>
            <div className="login-proof">
              <Mail className="w-5 h-5" />
              <span>Email OTP or Google OAuth sign-in</span>
            </div>
          </div>
        </div>

        <div className="login-panel">
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
                />
              </div>
            </label>

            <label>
              <span>Full Name</span>
              <div className="login-input-wrap">
                <User className="w-5 h-5" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </label>

            <label>
              <span>Email</span>
              <div className="login-input-wrap">
                <Mail className="w-5 h-5" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </label>

            <button type="submit" className="login-submit">
              Create Account <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-4 space-y-2">
              <GoogleLoginButton onSuccess={handleGoogleSuccess} />
              <GitHubLoginButton onSuccess={handleGoogleSuccess} />
            </div>
          </form>

          <div className="login-footnote">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
