import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Client Intake & Proposal Assistant
        </h1>
        <p className="mt-4 text-slate-600">
          Manage leads, project inquiries, and AI-assisted proposal briefs for
          your internal sales workflow.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
