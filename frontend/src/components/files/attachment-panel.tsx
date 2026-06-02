'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { getApiUrl } from '@/lib/api';

export interface AttachmentItem {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: { name: string };
}

export function AttachmentPanel({
  inquiryId,
  accessToken,
  attachments,
  canUpload,
}: {
  inquiryId: string;
  accessToken: string;
  attachments: AttachmentItem[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append('inquiryId', inquiryId);
    form.append('file', file);

    try {
      const response = await fetch(`${getApiUrl()}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? 'Upload failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Attachments</h2>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload file'}
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {attachments.map((file) => (
          <li key={file.id} className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-800">{file.fileName}</p>
              <p className="text-xs text-slate-500">
                {(file.fileSize / 1024).toFixed(1)} KB · {file.uploadedBy?.name}
              </p>
            </div>
            <button
              type="button"
              className="text-brand-600 hover:underline"
              onClick={async () => {
                const response = await fetch(
                  `${getApiUrl()}/files/${file.id}/download`,
                  { headers: { Authorization: `Bearer ${accessToken}` } },
                );
                if (!response.ok) return;
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = file.fileName;
                anchor.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download
            </button>
          </li>
        ))}
      </ul>
      {attachments.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">No attachments yet.</p>
      )}
    </div>
  );
}
