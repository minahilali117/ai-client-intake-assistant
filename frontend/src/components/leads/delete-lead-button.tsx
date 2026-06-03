'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    setLoading(true);

    try {
      await apiClient.delete(`/leads/${leadId}`, accessToken);

      toast.success('Lead deleted', {
        duration: 10_000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await apiClient.patch(
                `/leads/${leadId}/restore`,
                accessToken,
                {},
              );

              toast.success('Lead restored');
              router.refresh();
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Undo restore failed',
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={loading}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this lead?</AlertDialogTitle>

          <AlertDialogDescription>
            This action cannot be undone. The lead will be permanently removed
            from active records.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}