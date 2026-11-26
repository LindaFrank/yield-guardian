import { describe, expect, it } from 'vitest';
import { computeSixMonthSummary } from './priceHistory';

describe('computeSixMonthSummary', () => {
  it('computes 6-month change, percent, high, and low', () => {
    const res = computeSixMonthSummary([
      { date: '2026-05-26', close: 18.82 },
      { date: '2026-08-19', close: 20.10 },
      { date: '2026-09-10', close: 17.85 },
      { date: '2026-11-25', close: 18.95 },
    ]);
    expect(res).not.toBeNull();
    expect(res!.change).toBeCloseTo(0.13, 2);
    expect(res!.changePercent).toBeCloseTo(0.69, 2);
    expect(res!.high).toBe(20.10);
    expect(res!.low).toBe(17.85);
    expect(res!.isPositive).toBe(true);
  });

  it('marks negative 6-month moves as not positive', () => {
    const res = computeSixMonthSummary([
      { date: '2026-05-26', close: 20.0 },
      { date: '2026-11-25', close: 18.0 },
    ]);
    expect(res!.isPositive).toBe(false);
    expect(res!.change).toBeCloseTo(-2.0, 2);
    expect(res!.changePercent).toBeCloseTo(-10.0, 2);
  });

  it('returns null when fewer than two points exist', () => {
    expect(computeSixMonthSummary([])).toBeNull();
    expect(computeSixMonthSummary([{ date: '2026-11-25', close: 18.95 }])).toBeNull();
  });
});