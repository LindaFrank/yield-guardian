import { describe, expect, it } from 'vitest';
import Papa from 'papaparse';
import { completedSessionDate, decodeEod, latestCompletedEod } from '../../supabase/functions/stock-data/eod';

describe('Enterprise closing-price batching', () => {
  it('reads KO, PEP and T closing prices from one provider CSV', () => {
    const rows = decodeEod('"symbol","date","close","volume"\n"KO","2026-10-29",92.82,15872118\n"PEP","2026-10-29",150,100\n"T","2026-10-29",25,200', '2026-10-29',
      (text) => Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true }).data);
    expect(Object.keys(rows)).toEqual(['KO', 'PEP', 'T']);
    expect(rows.KO.close).toBe(92.82);
    expect(rows.KO.volume).toBe(15872118);
  });
  it('never treats unfinished current-day prices as market-close prices', () => {
    expect(completedSessionDate(new Date('2026-10-30T15:54:00Z'))).toBe('2026-10-29');
    expect(completedSessionDate(new Date('2026-10-30T21:01:00Z'))).toBe('2026-10-30');
    expect(completedSessionDate(new Date('2026-11-02T21:01:00Z'))).toBe('2026-10-30');
  });
  it('uses Friday closing prices through the weekend', () => {
    expect(completedSessionDate(new Date('2026-11-01T23:00:00Z'))).toBe('2026-10-30');
  });
  it('rejects a wrong session or invalid price rather than returning incomplete quotes', () => {
    const rows = decodeEod('[{"symbol":"KO","date":"2026-10-30","close":94},{"symbol":"T","date":"2026-10-29","close":null}]', '2026-10-29', () => []);
    expect(rows).toEqual({});
  });
  it('falls back to the latest completed record even during a holiday', () => {
    expect(latestCompletedEod([
      { symbol: 'KO', date: '2026-10-30', close: 94.445 },
      { symbol: 'KO', date: '2026-10-29', close: 92.82 },
    ], '2026-10-29')?.close).toBe(92.82);
  });
});