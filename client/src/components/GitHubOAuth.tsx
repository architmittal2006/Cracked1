import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface GitHubLoginButtonProps {
  onSuccess?: () => void;
}

export const GitHubLoginButton: React.FC<GitHubLoginButtonProps> = ({ onSuccess }) => {
  const handleGitHubLogin = async () => {
    try {
      // Get GitHub auth URL from backend
      const response = await fetch('http://localhost:8080/api/auth/github');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to GitHub OAuth authorization page
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate GitHub login:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGitHubLogin}
      className="btn-secondary w-full justify-center flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      Continue with GitHub
    </button>
  );
};

// This component handles the OAuth callback
export const GitHubOAuthCallback: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        setError('No authorization code found');
        setLoading(false);
        return;
      }

      try {
        // Send code to backend for secure token exchange
        const response = await fetch('http://localhost:8080/api/auth/github/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for session
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Authentication failed');
        }

        // Login with user data from backend
        login(data.user);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [login]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Authenticating with GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/login" className="btn-primary inline-flex">Return to Login</a>
        </div>
      </div>
    );
  }

  return null;
};
