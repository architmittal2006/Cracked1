import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/Button';
import { TERMS_VERSION } from '../constants/legal';

export const ConsentPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, acceptTerms } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" /></div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.termsAccepted !== false) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) { setError('Please accept the Terms of Service to continue'); return; }
    setSubmitting(true);
    setError('');
    try {
      await acceptTerms(TERMS_VERSION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record acceptance');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8"><BrandLogo className="h-7 w-auto" /></div>
        <h1 className="font-serif text-3xl font-semibold text-white">Before you begin</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Please review and accept our <Link to="/terms" target="_blank" className="text-orange-300 hover:underline">Terms of Service</Link> to use Cracked.
          Our <Link to="/privacy" target="_blank" className="text-orange-300 hover:underline">Privacy Policy</Link> explains how we handle your data.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex items-start gap-3 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 accent-orange-500"
            />
            <span>I agree to the <Link to="/terms" target="_blank" className="text-orange-300 hover:underline">Terms of Service</Link></span>
          </label>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting} className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ConsentPage;
