'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/lib/labels';
import type { Lead, LeadStatus } from '@/types/crm';

interface LeadFormProps {
  accessToken: string;
  lead?: Lead;
}

export function LeadForm({ accessToken, lead }: LeadFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      companyName: String(form.get('companyName')),
      contactPerson: String(form.get('contactPerson')),
      email: String(form.get('email')),
      phone: String(form.get('phone') || '') || undefined,
      source: String(form.get('source')),
      status: String(form.get('status')) as LeadStatus,
    };

    try {
      if (lead) {
        await apiClient.patch(`/leads/${lead.id}`, accessToken, payload);
        toast.success('Lead updated');
        router.push(`/dashboard/leads/${lead.id}`);
      } else {
        const created = await apiClient.post<Lead>(
          '/leads',
          accessToken,
          payload,
        );
        toast.success('Lead created');
        router.push(`/dashboard/leads/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" name="companyName" defaultValue={lead?.companyName} required />
        <Field label="Contact person" name="contactPerson" defaultValue={lead?.contactPerson} required />
        <Field label="Email" name="email" type="email" defaultValue={lead?.email} required />
        <Field label="Phone" name="phone" defaultValue={lead?.phone ?? ''} />
        <Field label="Source" name="source" defaultValue={lead?.source} required />
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            defaultValue={lead?.status ?? 'NEW'}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'Saving...' : lead ? 'Update lead' : 'Create lead'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
