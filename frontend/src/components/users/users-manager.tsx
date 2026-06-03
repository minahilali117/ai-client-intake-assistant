'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { AppUser } from '@/types/crm';

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

const ROLES = ['ADMIN', 'SALES', 'DEVELOPER'] as const;

export function UsersManager({
  accessToken,
  users,
  currentUserId,
}: {
  accessToken: string;
  users: AppUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreate = async (formData: FormData) => {
    try {
      await apiClient.post('/users', accessToken, {
        name: String(formData.get('name')),
        email: String(formData.get('email')),
        password: String(formData.get('password')),
        role: String(formData.get('role')),
      });

      toast.success('User created');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed');
    }
  };

  const handleRoleUpdate = async (id: string, role: string) => {
    setLoadingId(id);

    try {
      await apiClient.patch(`/users/${id}`, accessToken, { role });

      toast.success('User role updated');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-5"
        onSubmit={async (event) => {
          event.preventDefault();

          const form = event.currentTarget;

          await handleCreate(new FormData(form));

          form.reset();
        }}
      >
        <input
          name="name"
          placeholder="Name"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          minLength={8}
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <select
          name="role"
          defaultValue="SALES"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Add user
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Name
              </th>

              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Email
              </th>

              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Role
              </th>

              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.name}</td>

                <td className="px-4 py-3 text-slate-600">
                  {user.email}
                </td>

                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    disabled={loadingId === user.id}
                    onChange={(event) =>
                      handleRoleUpdate(user.id, event.target.value)
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={
                          loadingId === user.id ||
                          user.id === currentUserId
                        }
                        className="rounded-lg border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete user account?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          This will permanently delete{' '}
                          <strong>{user.name}</strong>&apos;s account and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={async () => {
                            setLoadingId(user.id);

                            try {
                              await apiClient.delete(
                                `/users/${user.id}`,
                                accessToken,
                              );

                              toast.success('User deleted');

                              router.refresh();
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : 'Delete failed',
                              );
                            } finally {
                              setLoadingId(null);
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}