import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const handleGoogleLogin = async () => {
    try {
      // Get Google auth URL from backend
      const response = await fetch('http://localhost:8080/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth authorization page
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="btn-secondary w-full justify-center flex items-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
};

// This component handles the OAuth callback
export const GoogleOAuthCallback: React.FC = () => {
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
        const response = await fetch('http://localhost:8080/api/auth/google/callback', {
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
          <p className="text-slate-400">Authenticating with Google...</p>
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

