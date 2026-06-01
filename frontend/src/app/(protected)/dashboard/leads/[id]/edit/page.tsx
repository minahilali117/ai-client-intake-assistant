import { auth } from '@/auth';
import { LeadForm } from '@/components/leads/lead-form';
import { apiFetch } from '@/lib/api-server';
import type { Lead } from '@/types/crm';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: PageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (role !== 'ADMIN' && role !== 'SALES') {
    redirect('/dashboard/leads');
  }

  const { id } = await params;
  const lead = await apiFetch<Lead>(`/leads/${id}`, session!.accessToken);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Edit lead</h1>
      <LeadForm accessToken={session!.accessToken} lead={lead} />
    </div>
  );
}
