import Link from 'next/link';
import { auth } from '@/auth';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { LeadStatusBadge } from '@/components/ui/status-badge';
import { apiFetch } from '@/lib/api-server';
import { LEAD_STATUS_LABELS, PROJECT_TYPE_LABELS, PRIORITY_LABELS } from '@/lib/labels';
import type { ActivityLog, Inquiry, Lead, LeadStatus, Priority, ProjectType } from '@/types/crm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const role = session!.user.role;

  const [lead, activity] = await Promise.all([
    apiFetch<Lead>(`/leads/${id}`, session!.accessToken),
    apiFetch<ActivityLog[]>(
      `/activity/lead/${id}?limit=20`,
      session!.accessToken,
    ),
  ]);

  const canManage = role === 'ADMIN' || role === 'SALES';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/leads" className="text-sm text-brand-600 hover:underline">
            ← Back to leads
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {lead.companyName}
          </h1>
          <p className="text-slate-600">{lead.contactPerson} · {lead.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <LeadStatusBadge
            status={lead.status}
            label={LEAD_STATUS_LABELS[lead.status as LeadStatus]}
          />
          {canManage && (
            <Link
              href={`/dashboard/leads/${id}/edit`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd>{lead.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd>{lead.source}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd>{new Date(lead.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Updated</dt>
                <dd>{new Date(lead.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Project inquiries</h2>
              {canManage && (
                <Link
                  href={`/dashboard/leads/${id}/inquiries/new`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Add inquiry
                </Link>
              )}
            </div>
            <ul className="divide-y divide-slate-100">
              {(lead.inquiries ?? []).map((inquiry: Inquiry) => (
                <li key={inquiry.id} className="py-3">
                  <Link
                    href={`/dashboard/inquiries/${inquiry.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {inquiry.projectTitle}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {PROJECT_TYPE_LABELS[inquiry.projectType as ProjectType]} ·{' '}
                    {PRIORITY_LABELS[inquiry.priority as Priority]}
                  </p>
                </li>
              ))}
            </ul>
            {(lead.inquiries ?? []).length === 0 && (
              <p className="text-sm text-slate-500">No inquiries yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Activity</h2>
          <ActivityTimeline logs={activity} />
        </div>
      </div>
    </div>
  );
}
