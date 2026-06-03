'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { apiLogout } from '@/lib/api';
import { subscribeAuthSync } from '@/lib/auth-sync';

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const statusRef = useRef(status);
  const sessionRef = useRef(session);

  statusRef.current = status;
  sessionRef.current = session;

  useEffect(() => {
    return subscribeAuthSync(async (event) => {
      if (event.type !== 'logout') {
        return;
      }

      if (statusRef.current !== 'authenticated') {
        return;
      }

      const token = sessionRef.current?.accessToken;
      if (token) {
        try {
          await apiLogout(token);
        } catch {
          // Continue local sign-out even if API logout fails.
        }
      }

      await signOut({ callbackUrl: '/login' });
    });
  }, []);

  return children;
}
