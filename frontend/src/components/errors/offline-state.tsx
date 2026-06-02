'use client';

import { useRouter } from 'next/navigation';

export function OfflineState() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">
        Oh no, you&rsquo;re offline
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        We couldn&rsquo;t reach the app or backend service. Check your internet
        connection, make sure the backend is running, then try again.
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
