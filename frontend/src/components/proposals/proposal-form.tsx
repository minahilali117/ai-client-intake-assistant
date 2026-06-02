'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Proposal } from '@/types/crm';

const fields = [
  { name: 'projectSummary', label: 'Project summary', rows: 4 },
  { name: 'suggestedFeatures', label: 'Suggested features', rows: 6 },
  { name: 'technicalApproach', label: 'Technical approach', rows: 5 },
  { name: 'estimatedComplexity', label: 'Estimated complexity', rows: 2 },
  { name: 'suggestedTimeline', label: 'Suggested timeline', rows: 4 },
  { name: 'questionsToAsk', label: 'Questions to ask the client', rows: 5 },
] as const;

export function ProposalForm({
  accessToken,
  proposal,
}: {
  accessToken: string;
  proposal: Proposal;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    for (const field of fields) {
      payload[field.name] = String(form.get(field.name));
    }

    try {
      await apiClient.patch(`/proposals/${proposal.id}`, accessToken, payload);
      toast.success('Proposal saved');
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
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
          </label>
          <textarea
            name={field.name}
            defaultValue={proposal[field.name]}
            required
            rows={field.rows}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save proposal'}
      </button>
    </form>
  );
}
