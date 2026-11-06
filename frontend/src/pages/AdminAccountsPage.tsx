import React, { useEffect, useState } from 'react';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { getAdminAccounts, getAdminAuditLogs, setAdminAccountStatus } from '../services/api';
import type { AdminAccount, AdminAuditLog } from '../services/api';

export const AdminAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const [nextAccounts, nextLogs] = await Promise.all([getAdminAccounts(), getAdminAuditLogs()]);
      setAccounts(nextAccounts);
      setAuditLogs(nextLogs);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const updateStatus = async (account: AdminAccount) => {
    const status = account.isActive ? 'suspended' : 'active';
    const action = status === 'suspended' ? 'Suspend' : 'Reactivate';
    if (!window.confirm(`${action} ${account.username}?`)) return;
    setUpdatingId(account.id);
    setError(null);
    try {
      const updated = await setAdminAccountStatus(account.id, status);
      setAccounts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setAuditLogs(await getAdminAuditLogs());
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update this account');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PageWrapper className="max-w-5xl">
      <header className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Admin account operations</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Suspend or reactivate student accounts. Changes invalidate existing sessions and are recorded in the audit log.
        </p>
      </header>

      {error && <p className="mb-5 border-y border-red-500/30 py-3 text-sm text-red-300" role="alert">{error}</p>}
      {isLoading ? (
        <p aria-live="polite" className="py-8 text-sm text-[var(--text-secondary)]">Loading admin data…</p>
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="accounts-heading">
            <h2 id="accounts-heading" className="mb-4 text-xl font-semibold text-[var(--text-primary)]">Accounts</h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
                  <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-t border-[var(--border-subtle)]">
                      <td className="p-3 text-[var(--text-primary)]">{account.name} <span className="text-[var(--text-secondary)]">@{account.username}</span><span className="ml-2 text-xs text-[var(--text-secondary)]">{account.accessRole}</span></td>
                      <td className="p-3 text-[var(--text-secondary)]">{account.email}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{account.isActive ? 'Active' : 'Suspended'}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant={account.isActive ? 'secondary' : 'primary'}
                          loading={updatingId === account.id}
                          disabled={account.accessRole === 'Admin'}
                          onClick={() => void updateStatus(account)}
                        >
                          {account.accessRole === 'Admin' ? 'Protected' : account.isActive ? 'Suspend' : 'Reactivate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && <tr><td className="p-4 text-[var(--text-secondary)]" colSpan={4}>No accounts found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="mb-4 text-xl font-semibold text-[var(--text-primary)]">Recent audit events</h2>
            <ol className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
              {auditLogs.map((entry) => (
                <li key={entry.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                  <span className="text-[var(--text-primary)]">{entry.action} · {entry.targetType} {entry.targetId}</span>
                  <time className="text-[var(--text-secondary)]" dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
                </li>
              ))}
              {auditLogs.length === 0 && <li className="p-4 text-sm text-[var(--text-secondary)]">No audit events yet.</li>}
            </ol>
          </section>
        </div>
      )}
    </PageWrapper>
  );
};

export default AdminAccountsPage;
