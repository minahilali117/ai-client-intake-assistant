import Link from 'next/link';
import { auth } from '@/auth';
import { InquiryForm } from '@/components/inquiries/inquiry-form';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewInquiryPage({ params }: PageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (role !== 'ADMIN' && role !== 'SALES') {
    redirect('/dashboard/leads');
  }

  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/leads/${id}`} className="text-sm text-brand-600 hover:underline">
        ← Back to lead
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">New inquiry</h1>
      <InquiryForm accessToken={session!.accessToken} leadId={id} />
    </div>
  );
}
