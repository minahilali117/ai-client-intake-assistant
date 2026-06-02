import Link from 'next/link';
import { auth } from '@/auth';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { OfflineState } from '@/components/errors/offline-state';
import { InquiryForm } from '@/components/inquiries/inquiry-form';
import { TechnicalNotesForm } from '@/components/inquiries/technical-notes-form';
import {
  AttachmentPanel,
  type AttachmentItem,
} from '@/components/files/attachment-panel';
import { PriorityBadge } from '@/components/ui/status-badge';
import { apiFetch, isApiRequestError } from '@/lib/api-server';
import {
  LEAD_STATUS_LABELS,
  PRIORITY_LABELS,
  PROJECT_TYPE_LABELS,
} from '@/lib/labels';
import type {
  ActivityLog,
  Inquiry,
  LeadStatus,
  Priority,
  ProjectType,
  Proposal,
} from '@/types/crm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const role = session!.user.role;

  let inquiry: Inquiry;
  let activity: ActivityLog[];
  let proposal: Proposal | null;
  let attachments: AttachmentItem[];
  try {
    [inquiry, activity, proposal, attachments] = await Promise.all([
      apiFetch<Inquiry>(`/inquiries/${id}`, session!.accessToken),
      apiFetch<ActivityLog[]>(
        `/activity/inquiry/${id}?limit=20`,
        session!.accessToken,
      ),
      apiFetch<Proposal>(`/proposals/by-inquiry/${id}`, session!.accessToken).catch(
        () => null,
      ),
      apiFetch<AttachmentItem[]>(
        `/files/inquiry/${id}`,
        session!.accessToken,
      ).catch(() => [] as AttachmentItem[]),
    ]);
  } catch (error) {
    if (isApiRequestError(error) && error.code === 'NETWORK_ERROR') {
      return <OfflineState />;
    }
    throw error;
  }

  const canManage = role === 'ADMIN' || role === 'SALES';
  const canEditNotes =
    role === 'DEVELOPER' || role === 'ADMIN' || role === 'SALES';

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/leads/${inquiry.leadId}`}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Back to {inquiry.lead?.companyName ?? 'lead'}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {inquiry.projectTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {inquiry.lead?.companyName} ·{' '}
            {inquiry.lead?.status &&
              LEAD_STATUS_LABELS[inquiry.lead.status as LeadStatus]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PriorityBadge
            priority={inquiry.priority}
            label={PRIORITY_LABELS[inquiry.priority as Priority]}
          />
          {proposal ? (
            <Link
              href={`/dashboard/proposals/${proposal.id}`}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              View proposal
            </Link>
          ) : canManage ? (
            <Link
              href={`/dashboard/inquiries/${id}/proposal`}
              className="rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              Generate proposal
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-white p-5 text-sm">
            <p className="whitespace-pre-wrap text-slate-700">{inquiry.description}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd>{PROJECT_TYPE_LABELS[inquiry.projectType as ProjectType]}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Budget</dt>
                <dd>{inquiry.budgetRange}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Timeline</dt>
                <dd>{inquiry.expectedTimeline}</dd>
              </div>
            </dl>
          </div>

          {canManage && (
            <div>
              <h2 className="mb-3 font-semibold text-slate-900">Edit inquiry</h2>
              <InquiryForm
                accessToken={session!.accessToken}
                leadId={inquiry.leadId}
                inquiry={inquiry}
              />
            </div>
          )}

          {!canManage && canEditNotes && (
            <TechnicalNotesForm accessToken={session!.accessToken} inquiry={inquiry} />
          )}

          <AttachmentPanel
            inquiryId={id}
            accessToken={session!.accessToken}
            attachments={attachments}
            canUpload={canManage}
          />

          {canManage && (
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Technical notes</p>
              <p className="mt-2 whitespace-pre-wrap">
                {inquiry.technicalNotes ?? 'No technical notes yet.'}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Activity</h2>
          <ActivityTimeline logs={activity} />
        </div>
      </div>
    </div>
  );
}
