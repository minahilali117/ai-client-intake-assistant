'use client';

import { signOut } from 'next-auth/react';
import { apiLogout } from '@/lib/api';
import { broadcastAuthSync } from '@/lib/auth-sync';

interface LogoutButtonProps {
  accessToken: string;
}

export function LogoutButton({ accessToken }: LogoutButtonProps) {
  const handleLogout = async () => {
    broadcastAuthSync({ type: 'logout' });

    try {
      await apiLogout(accessToken);
    } catch {
      // Continue local sign-out even if API logout fails
    }

    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}
