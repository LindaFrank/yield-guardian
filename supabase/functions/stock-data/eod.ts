export type EodRow = {
  symbol: string;
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
};

// Wait until 17:00 New York time: never request today's unfinished session.
// Holidays are handled by provider availability and the historical fallback.
export function completedSessionDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const date = new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);
  if (Number(get('hour')) < 17) date.setUTCDate(date.getUTCDate() - 1);
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function validEod(row: Record<string, unknown>, date: string): EodRow | null {
  const close = Number(row.close);
  if (typeof row.symbol !== 'string' || row.date !== date || !Number.isFinite(close) || close <= 0) return null;
  const result: EodRow = { symbol: row.symbol, date, close };
  for (const field of ['open', 'high', 'low', 'volume'] as const) {
    if (row[field] !== undefined && row[field] !== '') {
      const n = Number(row[field]);
      if (Number.isFinite(n)) result[field] = n;
    }
  }
  return result;
}

export function decodeEod(
  text: string,
  date: string,
  csv: (text: string) => Record<string, unknown>[],
): Record<string, EodRow> {
  let rows: Record<string, unknown>[];
  if (text.trimStart().startsWith('[')) rows = JSON.parse(text);
  else rows = csv(text);
  const result: Record<string, EodRow> = {};
  for (const row of rows) {
    const valid = validEod(row, date);
    if (valid) result[valid.symbol] = valid;
  }
  return result;
}

export function latestCompletedEod(rows: Record<string, unknown>[], date: string): EodRow | null {
  const sorted = rows.filter((row) => typeof row.date === 'string' && row.date <= date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  for (const row of sorted) {
    const valid = validEod(row, String(row.date));
    if (valid) return valid;
  }
  return null;
}