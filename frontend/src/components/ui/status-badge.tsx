import { cn } from '@/lib/utils';
import type { LeadStatus, Priority } from '@/types/crm';

const statusStyles: Record<LeadStatus, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-blue-100 text-blue-800',
  QUALIFIED: 'bg-emerald-100 text-emerald-800',
  PROPOSAL_SENT: 'bg-violet-100 text-violet-800',
  WON: 'bg-green-100 text-green-900',
  LOST: 'bg-red-100 text-red-800',
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export function LeadStatusBadge({
  status,
  label,
}: {
  status: LeadStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  label,
}: {
  priority: Priority;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        priorityStyles[priority],
      )}
    >
      {label}
    </span>
  );
}
