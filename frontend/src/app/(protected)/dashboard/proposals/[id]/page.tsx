import Link from 'next/link';
import { auth } from '@/auth';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { OfflineState } from '@/components/errors/offline-state';
import { ProposalForm } from '@/components/proposals/proposal-form';
import { ExportPdfButton } from '@/components/proposals/export-pdf-button';
import { apiFetch, isApiRequestError } from '@/lib/api-server';
import type { ActivityLog, Proposal } from '@/types/crm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const role = session!.user.role;
  const canEdit = role === 'ADMIN' || role === 'SALES';

  let proposal: Proposal;
  let activity: ActivityLog[];
  try {
    [proposal, activity] = await Promise.all([
      apiFetch<Proposal>(`/proposals/${id}`, session!.accessToken),
      apiFetch<ActivityLog[]>(
        `/activity/proposal/${id}?limit=20`,
        session!.accessToken,
      ).catch(() => [] as ActivityLog[]),
    ]);
  } catch (error) {
    if (isApiRequestError(error) && error.code === 'NETWORK_ERROR') {
      return <OfflineState />;
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/inquiries/${proposal.inquiryId}`}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Back to inquiry
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Proposal brief
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {proposal.lead?.companyName} · {proposal.inquiry?.projectTitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportPdfButton
            proposalId={proposal.id}
            accessToken={session!.accessToken}
          />
          {proposal.generatedByAI && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
              AI generated
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {canEdit ? (
            <ProposalForm accessToken={session!.accessToken} proposal={proposal} />
          ) : (
            <ProposalReadOnly proposal={proposal} />
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

function ProposalReadOnly({ proposal }: { proposal: Proposal }) {
  const sections = [
    { title: 'Project summary', content: proposal.projectSummary },
    { title: 'Suggested features', content: proposal.suggestedFeatures },
    { title: 'Technical approach', content: proposal.technicalApproach },
    { title: 'Estimated complexity', content: proposal.estimatedComplexity },
    { title: 'Suggested timeline', content: proposal.suggestedTimeline },
    { title: 'Questions to ask', content: proposal.questionsToAsk },
  ];

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-medium text-slate-900">{section.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
}
