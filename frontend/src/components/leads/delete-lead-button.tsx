'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export function DeleteLeadButton({
  leadId,
  accessToken,
}: {
  leadId: string;
  accessToken: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Delete this lead? This action cannot be undone.',
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await apiClient.delete(`/leads/${leadId}`, accessToken);
      toast.success('Lead deleted', {
        duration: 10_000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await apiClient.patch(`/leads/${leadId}/restore`, accessToken, {});
              toast.success('Lead restored');
              router.refresh();
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : 'Undo restore failed',
              );
            }
          },
        },
      });
      router.push('/dashboard/leads');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleDelete}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
