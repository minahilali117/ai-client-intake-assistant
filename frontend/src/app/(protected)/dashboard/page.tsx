import Link from 'next/link';
import { auth } from '@/auth';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { BarChart } from '@/components/dashboard/bar-chart';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { apiFetch } from '@/lib/api-server';
import { LEAD_STATUS_LABELS, PROJECT_TYPE_LABELS } from '@/lib/labels';
import type { DashboardSummary, LeadStatus, ProjectType } from '@/types/crm';

export default async function DashboardPage() {
  const session = await auth();
  const summary = await apiFetch<DashboardSummary>(
    '/dashboard/summary',
    session!.accessToken,
  );

  const statusChart = summary.leadsByStatus.map((row) => ({
    label: LEAD_STATUS_LABELS[row.status as LeadStatus],
    count: row.count,
  }));

  const typeChart = summary.leadsByProjectType.map((row) => ({
    label: PROJECT_TYPE_LABELS[row.projectType as ProjectType],
    count: row.count,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-600">
            Pipeline overview, analytics, and recent team activity.
          </p>
        </div>
        <Link
          href="/dashboard/leads"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white"
        >
          Manage leads
        </Link>
      </div>

      <SummaryCards cards={summary.cards} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Leads by status" items={statusChart} />
        <BarChart title="Inquiries by project type" items={typeChart} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Recent activity</h2>
        <div className="mt-4">
          <ActivityTimeline logs={summary.recentActivity} />
        </div>
      </div>
    </div>
  );
}
