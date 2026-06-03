import { LEAD_STATUS_LABELS } from '@/lib/labels';
import type { LeadStatus } from '@/types/crm';

const FIELD_LABELS: Record<string, string> = {
  projectSummary: 'Project summary',
  suggestedFeatures: 'Suggested features',
  technicalApproach: 'Technical approach',
  estimatedComplexity: 'Estimated complexity',
  suggestedTimeline: 'Suggested timeline',
  questionsToAsk: 'Questions to ask',
  projectTitle: 'Project title',
  companyName: 'Company',
  status: 'Status',
  contactPerson: 'Contact person',
  email: 'Email',
  phone: 'Phone',
  source: 'Source',
  technicalNotes: 'Technical notes',
  fileName: 'File name',
  mimeType: 'File type',
  fileSize: 'File size',
  generatedByAI: 'AI generated',
  inquiryId: 'Inquiry ID',
};

interface MetadataRow {
  field: string;
  before?: string;
  after?: string;
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    if (value > 1024 && value < 1_000_000_000) {
      return `${Math.round(value / 1024)} KB`;
    }
    return String(value);
  }
  if (typeof value === 'string') {
    if (value in LEAD_STATUS_LABELS) {
      return LEAD_STATUS_LABELS[value as LeadStatus];
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => formatValue(entry)).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${humanizeKey(k)}: ${formatValue(v)}`)
      .join('\n');
  }
  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function labelForField(key: string): string {
  return FIELD_LABELS[key] ?? humanizeKey(key);
}

function buildDiffRows(metadata: Record<string, unknown>): MetadataRow[] {
  if (isPlainObject(metadata.changes)) {
    return Object.entries(metadata.changes).map(([key, change]) => {
      const entry = change as { oldValue?: unknown; newValue?: unknown };
      return {
        field: labelForField(key),
        before: formatValue(entry.oldValue),
        after: formatValue(entry.newValue),
      };
    });
  }

  if (metadata.field && 'oldValue' in metadata && 'newValue' in metadata) {
    const field = String(metadata.field);
    return [
      {
        field: labelForField(field),
        before: formatValue(metadata.oldValue),
        after: formatValue(metadata.newValue),
      },
    ];
  }

  const oldObj = isPlainObject(metadata.oldValue) ? metadata.oldValue : null;
  const newObj = isPlainObject(metadata.newValue) ? metadata.newValue : null;

  if (oldObj || newObj) {
    const keys = new Set([
      ...Object.keys(oldObj ?? {}),
      ...Object.keys(newObj ?? {}),
    ]);

    return [...keys]
      .map((key) => ({
        field: labelForField(key),
        before: formatValue(oldObj?.[key]),
        after: formatValue(newObj?.[key]),
      }))
      .filter((row) => row.before !== row.after);
  }

  if (metadata.oldValue !== undefined && metadata.newValue !== undefined) {
    return [
      {
        field: 'Value',
        before: formatValue(metadata.oldValue),
        after: formatValue(metadata.newValue),
      },
    ];
  }

  if (metadata.newValue !== undefined) {
    if (isPlainObject(metadata.newValue)) {
      return Object.entries(metadata.newValue).map(([key, value]) => ({
        field: labelForField(key),
        after: formatValue(value),
      }));
    }
    return [{ field: 'Value', after: formatValue(metadata.newValue) }];
  }

  return [];
}

function buildExtraRows(metadata: Record<string, unknown>): MetadataRow[] {
  const skip = new Set(['oldValue', 'newValue', 'changes', 'field', 'entity', 'entityId']);

  return Object.entries(metadata)
    .filter(([key]) => !skip.has(key))
    .map(([key, value]) => ({
      field: labelForField(key),
      after: formatValue(value),
    }));
}

export function ActivityMetadataDisplay({
  metadata,
}: {
  metadata: Record<string, unknown>;
}) {
  const diffRows = buildDiffRows(metadata);
  const extraRows = buildExtraRows(metadata);
  const rows = [...diffRows, ...extraRows];

  if (rows.length === 0) {
    return null;
  }

  const showBefore = rows.some((row) => row.before !== undefined);

  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
      <table className="w-full min-w-[280px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-3 py-2 font-medium">Field</th>
            {showBefore && (
              <th className="px-3 py-2 font-medium">Before</th>
            )}
            <th className="px-3 py-2 font-medium">
              {showBefore ? 'After' : 'Value'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => (
            <tr key={row.field}>
              <td className="px-3 py-2 align-top font-medium text-slate-700">
                {row.field}
              </td>
              {showBefore && (
                <td className="px-3 py-2 align-top whitespace-pre-wrap text-slate-600">
                  {row.before ?? '—'}
                </td>
              )}
              <td className="px-3 py-2 align-top whitespace-pre-wrap text-slate-900">
                {row.after ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
