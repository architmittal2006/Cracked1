import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { changeAccountPassword, getAccountProfile, updateAccountProfile } from '../services/api';
import type { AccountProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const fieldClass = 'input-field mt-2 w-full';

export const AccountSettingsPage: React.FC = () => {
  const { checkAuth } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getAccountProfile()
      .then((account) => {
        if (!active) return;
        setProfile(account);
        setUsername(account.username);
        setName(account.name);
        setBio(account.bio ?? '');
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load your account');
      });
    return () => { active = false; };
  }, []);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSaving(true);
    try {
      const updated = await updateAccountProfile({ username, name, bio: bio.trim() || null });
      setProfile(updated);
      setNotice('Profile saved.');
      await checkAuth();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await changeAccountPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Password changed. Other active sessions have been signed out.');
      await checkAuth();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Could not change your password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWrapper className="max-w-3xl">
      <header className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Account settings</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Review and update the personal information stored for your account.
        </p>
      </header>

      {error && <p className="mb-5 border-y border-red-500/30 py-3 text-sm text-red-300" role="alert">{error}</p>}
      {notice && <p className="mb-5 border-y border-emerald-500/30 py-3 text-sm text-emerald-300" role="status">{notice}</p>}

      {!profile && !error ? (
        <p aria-live="polite" className="text-sm text-[var(--text-secondary)]">Loading account…</p>
      ) : profile && (
        <div className="space-y-8">
          <form onSubmit={saveProfile} className="space-y-5 rounded-xl border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Personal information</h2>
            <p className="text-sm text-[var(--text-secondary)]">Email: {profile.email} (used for sign-in; not editable here)</p>
            <label className="block text-sm text-[var(--text-primary)]">
              Username
              <input className={fieldClass} value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={100} required />
            </label>
            <label className="block text-sm text-[var(--text-primary)]">
              Name
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required />
            </label>
            <label className="block text-sm text-[var(--text-primary)]">
              Bio <span className="text-[var(--text-secondary)]">(optional)</span>
              <textarea className={`${fieldClass} min-h-24`} value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} />
            </label>
            <Button type="submit" loading={isSaving}>Save profile</Button>
          </form>

          <form onSubmit={savePassword} className="space-y-5 rounded-xl border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Change password</h2>
            <label className="block text-sm text-[var(--text-primary)]">
              Current password
              <input className={fieldClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            </label>
            <label className="block text-sm text-[var(--text-primary)]">
              New password
              <input className={fieldClass} type="password" autoComplete="new-password" minLength={8} maxLength={256} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            </label>
            <label className="block text-sm text-[var(--text-primary)]">
              Confirm new password
              <input className={fieldClass} type="password" autoComplete="new-password" minLength={8} maxLength={256} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>
            <Button type="submit" loading={isSaving}>Change password</Button>
          </form>
        </div>
      )}
    </PageWrapper>
  );
};

export default AccountSettingsPage;
