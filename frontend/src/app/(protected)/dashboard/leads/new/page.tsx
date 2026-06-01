import { auth } from '@/auth';
import { LeadForm } from '@/components/leads/lead-form';
import { redirect } from 'next/navigation';

export default async function NewLeadPage() {
  const session = await auth();
  const role = session?.user.role;

  if (role !== 'ADMIN' && role !== 'SALES') {
    redirect('/dashboard/leads');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">New lead</h1>
      <LeadForm accessToken={session!.accessToken} />
    </div>
  );
}
