'use client';

import { useEffect, useState } from 'react';
import { OfflineState } from '@/components/errors/offline-state';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration is best-effort.
      });
    }

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (offline) {
    return <OfflineState />;
  }

  return children;
}
