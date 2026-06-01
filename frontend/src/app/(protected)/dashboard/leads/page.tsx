import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { LeadsFilters } from '@/components/leads/leads-filters';
import { Pagination } from '@/components/leads/pagination';
import { LeadStatusBadge } from '@/components/ui/status-badge';
import { apiFetch, buildQuery, type PaginatedResponse } from '@/lib/api-server';
import { LEAD_STATUS_LABELS } from '@/lib/labels';
import type { Lead, LeadStatus } from '@/types/crm';

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);

  const query = buildQuery({
    page,
    limit,
    search: params.search,
    status: params.status,
    source: params.source,
    sortBy: params.sortBy ?? 'createdAt',
    sortOrder: params.sortOrder ?? 'desc',
  });

  const result = await apiFetch<PaginatedResponse<Lead>>(
    `/leads${query}`,
    session!.accessToken,
  );

  const canCreate =
    session!.user.role === 'ADMIN' || session!.user.role === 'SALES';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
        <p className="mt-1 text-sm text-slate-600">
          {result.meta.total} total · Page {result.meta.page} of{' '}
          {result.meta.totalPages}
        </p>
      </div>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-slate-200" />}>
        <LeadsFilters canCreate={canCreate} />
      </Suspense>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Company</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Source</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Inquiries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.data.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {lead.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {lead.contactPerson}
                  <br />
                  <span className="text-xs">{lead.email}</span>
                </td>
                <td className="px-4 py-3">
                  <LeadStatusBadge
                    status={lead.status}
                    label={LEAD_STATUS_LABELS[lead.status as LeadStatus]}
                  />
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.source}</td>
                <td className="px-4 py-3 text-slate-600">
                  {lead._count?.inquiries ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.data.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No leads found.</p>
        )}
        <div className="px-4 pb-4">
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            basePath="/dashboard/leads"
            searchParams={params}
          />
        </div>
      </div>
    </div>
  );
}
