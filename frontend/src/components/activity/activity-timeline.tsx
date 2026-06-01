import type { ActivityLog } from '@/types/crm';

const actionLabels: Record<string, string> = {
  LEAD_CREATED: 'Lead created',
  LEAD_UPDATED: 'Lead updated',
  LEAD_STATUS_CHANGED: 'Status changed',
  INQUIRY_CREATED: 'Inquiry created',
  TECHNICAL_NOTE_ADDED: 'Technical note added',
  PROPOSAL_GENERATED: 'Proposal generated',
  PROPOSAL_EDITED: 'Proposal edited',
};

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {logs.map((log) => (
        <li key={log.id} className="border-l-2 border-slate-200 pl-4">
          <p className="text-sm font-medium text-slate-900">
            {actionLabels[log.action] ?? log.action}
          </p>
          <p className="text-xs text-slate-500">
            {log.user.name} · {new Date(log.createdAt).toLocaleString()}
          </p>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-600">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
}
