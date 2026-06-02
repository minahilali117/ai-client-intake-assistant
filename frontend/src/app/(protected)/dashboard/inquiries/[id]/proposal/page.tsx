import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OfflineState } from '@/components/errors/offline-state';
import { GenerateProposalButton } from '@/components/proposals/generate-proposal-button';
import { apiFetch, isApiRequestError } from '@/lib/api-server';
import type { Inquiry, Proposal } from '@/types/crm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryProposalPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const role = session!.user.role;

  if (role !== 'ADMIN' && role !== 'SALES') {
    redirect(`/dashboard/inquiries/${id}`);
  }

  let inquiry: Inquiry;
  try {
    inquiry = await apiFetch<Inquiry>(`/inquiries/${id}`, session!.accessToken);
  } catch (error) {
    if (isApiRequestError(error) && error.code === 'NETWORK_ERROR') {
      return <OfflineState />;
    }
    throw error;
  }

  let existingProposal: Proposal | null = null;
  try {
    existingProposal = await apiFetch<Proposal>(
      `/proposals/by-inquiry/${id}`,
      session!.accessToken,
    );
  } catch {
    existingProposal = null;
  }

  if (existingProposal) {
    redirect(`/dashboard/proposals/${existingProposal.id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/inquiries/${id}`}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Back to inquiry
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Generate proposal
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {inquiry.projectTitle} — {inquiry.lead?.companyName}
        </p>
      </div>
      <div className="rounded-xl border bg-white p-6">
        <GenerateProposalButton
          accessToken={session!.accessToken}
          inquiryId={id}
        />
      </div>
    </div>
  );
}
