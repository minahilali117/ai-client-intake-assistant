import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OfflineState } from '@/components/errors/offline-state';
import { UsersManager } from '@/components/users/users-manager';
import { apiFetch, isApiRequestError } from '@/lib/api-server';
import type { AppUser } from '@/types/crm';

export default async function UsersPage() {
  const session = await auth();

  if (session?.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  let users: AppUser[];
  try {
    users = await apiFetch<AppUser[]>('/users', session.accessToken);
  } catch (error) {
    if (isApiRequestError(error) && error.code === 'NETWORK_ERROR') {
      return <OfflineState />;
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-600">Manage user roles and access.</p>
      </div>

      <UsersManager
        accessToken={session.accessToken}
        users={users}
        currentUserId={session.user.id}
      />
    </div>
  );
}
