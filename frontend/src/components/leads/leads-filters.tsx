'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/lib/labels';
import type { LeadStatus } from '@/types/crm';

export function LeadsFilters({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        for (const [key, value] of form.entries()) {
          if (typeof value === 'string' && value) {
            params.set(key, value);
          }
        }
        params.set('page', '1');
        router.push(`/dashboard/leads?${params.toString()}`);
      }}
    >
      <div className="min-w-[200px] flex-1">
        <label className="block text-xs font-medium text-slate-600">Search</label>
        <input
          name="search"
          defaultValue={searchParams.get('search') ?? ''}
          placeholder="Company, contact, email..."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Status</label>
        <select
          name="status"
          defaultValue={searchParams.get('status') ?? ''}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s as LeadStatus]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Source</label>
        <input
          name="source"
          defaultValue={searchParams.get('source') ?? ''}
          placeholder="e.g. Website"
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600">Sort</label>
        <select
          name="sortBy"
          defaultValue={searchParams.get('sortBy') ?? 'createdAt'}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="createdAt">Created</option>
          <option value="companyName">Company</option>
          <option value="status">Status</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Apply
      </button>
      {canCreate && (
        <Link
          href="/dashboard/leads/new"
          className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          New lead
        </Link>
      )}
    </form>
  );
}
