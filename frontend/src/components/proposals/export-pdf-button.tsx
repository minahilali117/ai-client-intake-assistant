'use client';

import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api';

export function ExportPdfButton({
  proposalId,
  accessToken,
}: {
  proposalId: string;
  accessToken: string;
}) {
  const handleExport = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/proposals/${proposalId}/export`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) {
        toast.error('Failed to export PDF');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'proposal.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
    >
      Export PDF
    </button>
  );
}
