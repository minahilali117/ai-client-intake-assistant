'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  PRIORITY_LABELS,
  PROJECT_TYPE_LABELS,
} from '@/lib/labels';
import type { Inquiry, Priority, ProjectType } from '@/types/crm';

const PROJECT_TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];
const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[];

interface InquiryFormProps {
  accessToken: string;
  leadId: string;
  inquiry?: Inquiry;
}

export function InquiryForm({ accessToken, leadId, inquiry }: InquiryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      leadId,
      projectTitle: String(form.get('projectTitle')),
      description: String(form.get('description')),
      projectType: String(form.get('projectType')) as ProjectType,
      budgetRange: String(form.get('budgetRange')),
      expectedTimeline: String(form.get('expectedTimeline')),
      priority: String(form.get('priority')) as Priority,
      technicalNotes: String(form.get('technicalNotes') || '') || undefined,
    };

    try {
      if (inquiry) {
        await apiClient.patch(`/inquiries/${inquiry.id}`, accessToken, payload);
        router.push(`/dashboard/inquiries/${inquiry.id}`);
      } else {
        const created = await apiClient.post<Inquiry>(
          '/inquiries',
          accessToken,
          payload,
        );
        router.push(`/dashboard/inquiries/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <Field label="Project title" name="projectTitle" defaultValue={inquiry?.projectTitle} required />
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          defaultValue={inquiry?.description}
          required
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Project type</label>
          <select
            name="projectType"
            defaultValue={inquiry?.projectType ?? 'WEB_APP'}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Priority</label>
          <select
            name="priority"
            defaultValue={inquiry?.priority ?? 'MEDIUM'}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <Field label="Budget range" name="budgetRange" defaultValue={inquiry?.budgetRange} required />
        <Field label="Expected timeline" name="expectedTimeline" defaultValue={inquiry?.expectedTimeline} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Technical notes</label>
        <textarea
          name="technicalNotes"
          defaultValue={inquiry?.technicalNotes ?? ''}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? 'Saving...' : inquiry ? 'Update inquiry' : 'Create inquiry'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
