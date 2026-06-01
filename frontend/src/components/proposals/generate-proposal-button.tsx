'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Proposal } from '@/types/crm';

export function GenerateProposalButton({
  accessToken,
  inquiryId,
}: {
  accessToken: string;
  inquiryId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const proposal = await apiClient.post<Proposal>(
        '/proposals/generate',
        accessToken,
        { inquiryId },
      );
      router.push(`/dashboard/proposals/${proposal.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? 'Generating...' : 'Generate proposal brief'}
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Uses OpenAI when configured; otherwise the local mock generator.
      </p>
    </div>
  );
}
