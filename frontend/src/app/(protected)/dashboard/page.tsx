import { auth } from '@/auth';
import { apiGetProfile } from '@/lib/api';

export default async function DashboardPage() {
  const session = await auth();
  const profile = session?.accessToken
    ? await apiGetProfile(session.accessToken)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Phase 1 foundation — authentication and RBAC are active. Lead and
          inquiry modules arrive in Phase 2.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="mt-1 text-lg font-medium text-slate-900">
            {profile?.name ?? session?.user?.name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Role</p>
          <p className="mt-1 text-lg font-medium text-slate-900">
            {profile?.role ?? session?.user?.role}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">API status</p>
          <p className="mt-1 text-lg font-medium text-emerald-700">Connected</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <h2 className="font-medium text-slate-900">RBAC preview</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>ADMIN — full access including user management</li>
          <li>SALES — leads, inquiries, proposals (Phase 2+)</li>
          <li>DEVELOPER — qualified leads and technical notes (Phase 2+)</li>
        </ul>
      </div>
    </div>
  );
}
