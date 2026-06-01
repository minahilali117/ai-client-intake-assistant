'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Inquiry } from '@/types/crm';

export function TechnicalNotesForm({
  accessToken,
  inquiry,
}: {
  accessToken: string;
  inquiry: Inquiry;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const technicalNotes = String(form.get('technicalNotes'));

    try {
      await apiClient.patch(
        `/inquiries/${inquiry.id}/technical-notes`,
        accessToken,
        { technicalNotes },
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4">
      <h3 className="font-medium text-slate-900">Technical notes</h3>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <textarea
        name="technicalNotes"
        defaultValue={inquiry.technicalNotes ?? ''}
        rows={5}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save technical notes'}
      </button>
    </form>
  );
}
