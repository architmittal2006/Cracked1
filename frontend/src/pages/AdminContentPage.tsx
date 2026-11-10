import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';
import { Button } from '../components/Button';
import { getAdminContent } from '../services/api';
import type { AdminContentItem } from '../services/api';

const STATUS_STYLES: Record<AdminContentItem['contentStatus'], string> = {
  Draft: 'border-amber-400/40 text-amber-300',
  Published: 'border-emerald-400/40 text-emerald-300',
  Unpublished: 'border-slate-400/40 text-slate-300',
};

const CONTENT_TYPES = [
  'Market Sizing', 'Profitability', 'Market Entry', 'Operational',
  'Pricing', 'M&A', 'Growth & Retention', 'Guesstimate',
];

export const AdminContentPage: React.FC = () => {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setError(null);
    try {
      setItems(await getAdminContent({
        q: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, statusFilter]);

  return (
    <PageWrapper className="max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Content studio</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Create, review and publish cases and guesstimates. Only published content is visible to students.
          </p>
        </div>
        <Button as="a" href="/admin/content/new">New content</Button>
      </header>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles…"
          aria-label="Search content"
          className="h-10 min-w-52 flex-1 rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filter by type"
          className="h-10 rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
        >
          <option value="">All types</option>
          {CONTENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className="h-10 rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Unpublished">Unpublished</option>
        </select>
      </div>

      {error && <p className="mb-5 border-y border-red-500/30 py-3 text-sm text-red-300" role="alert">{error}</p>}
      {isLoading ? (
        <p aria-live="polite" className="py-8 text-sm text-[var(--text-secondary)]">Loading content…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Status</th>
                <th className="p-3">Versions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[var(--border-subtle)]">
                  <td className="p-3">
                    <Link to={`/admin/content/${item.id}`} className="text-[var(--text-primary)] underline-offset-4 hover:text-orange-300 hover:underline">
                      {item.title}
                    </Link>
                    {item.hasDraft && item.contentStatus === 'Published' && (
                      <span className="ml-2 rounded border border-amber-400/40 px-1.5 py-0.5 text-xs text-amber-300">draft edits</span>
                    )}
                  </td>
                  <td className="p-3 text-[var(--text-secondary)]">{item.type}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{item.sector}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{item.difficulty}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${STATUS_STYLES[item.contentStatus]}`}>
                      {item.contentStatus}
                    </span>
                    {item.caseStatus !== 'Open' && (
                      <span className="ml-2 text-xs text-red-300" title="cases.status is not Open — hidden from students even when published">
                        case {item.caseStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[var(--text-secondary)]">{item.latestVersion ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="p-4 text-[var(--text-secondary)]" colSpan={6}>No content found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
};

export default AdminContentPage;
