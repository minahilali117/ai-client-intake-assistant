import type { DashboardSummary } from '@/types/crm';

const cardConfig = [
  { key: 'totalLeads' as const, label: 'Total leads' },
  { key: 'qualifiedLeads' as const, label: 'Qualified leads' },
  { key: 'proposalsSent' as const, label: 'Proposals sent' },
  { key: 'wonCount' as const, label: 'Won' },
  { key: 'lostCount' as const, label: 'Lost' },
];

export function SummaryCards({ cards }: { cards: DashboardSummary['cards'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cardConfig.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {cards[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
