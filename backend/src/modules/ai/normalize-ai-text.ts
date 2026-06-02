const PREFERRED_OBJECT_KEYS = [
  'summary',
  'text',
  'content',
  'description',
  'overview',
  'value',
  'body',
];

/** Coerce AI JSON values (strings, arrays, nested objects) into plain text for Prisma string columns. */
export function normalizeAiText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') {
      return undefined;
    }
    return trimmed;
  }

  if (value == null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const lines = value.flatMap((entry) => {
      const text = normalizeAiText(entry);
      return text ? [text] : [];
    });
    return lines.length > 0 ? lines.join('\n') : undefined;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    for (const key of PREFERRED_OBJECT_KEYS) {
      if (key in record) {
        const text = normalizeAiText(record[key]);
        if (text) {
          return text;
        }
      }
    }

    const values = Object.values(record);
    if (values.length === 1) {
      return normalizeAiText(values[0]);
    }

    const parts = values.flatMap((entry) => {
      const text = normalizeAiText(entry);
      return text ? [text] : [];
    });

    return parts.length > 0 ? parts.join('\n\n') : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}
