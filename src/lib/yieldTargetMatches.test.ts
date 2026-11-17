import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { yieldTargetMatches, STABILITY_LOOKBACK_YEARS } from './yieldTargetMatches';
import { HIGH_YIELD_CANDIDATE_TICKERS } from '@/data/highYieldCandidates';
import type { Stock } from '@/types/portfolio';

// NLY's real record as of Nov 17 2026 (price $17.51 at the Nov 16 close).
const NLY_DIVIDENDS: [string, number][] = [
  ['2026-09-30', 0.75], ['2026-06-30', 0.75], ['2026-03-31', 0.7],
  ['2025-12-31', 0.7], ['2025-09-30', 0.7], ['2025-06-30', 0.7], ['2025-03-31', 0.7],
  ['2024-12-31', 0.65], ['2024-09-30', 0.65], ['2024-06-28', 0.65], ['2024-03-27', 0.65],
];

function nly(dividends = NLY_DIVIDENDS, priceDate = '2026-11-16'): Stock {
  const annual = dividends.slice(0, 4).reduce((s, [, a]) => s + a, 0);
  return {
    ticker: 'NLY', name: 'Annaly', sector: 'Real Estate', currentPrice: 17.51,
    annualDividend: annual, currentYield: (annual / 17.51) * 100, priceDate,
    dividendHistory: dividends.map(([date, amount]) => ({ date, amount })),
  };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-17T15:00:00Z')); });
afterEach(() => { vi.useRealTimers(); });

describe('NLY in "Stocks that meet Yield Target"', () => {
  it('is one of the stocks the app checks', () => {
    expect(HIGH_YIELD_CANDIDATE_TICKERS).toContain('NLY');
  });
  it('shows at a 5% target while it passes every test', () => {
    expect(yieldTargetMatches([nly()], 5).map((c) => c.stock.ticker)).toEqual(['NLY']);
  });
  it('drops off if 2025 dividends fall more than 10% below 2024', () => {
    const cut = NLY_DIVIDENDS.map(([d, a]): [string, number] => [d, d.startsWith('2025') ? 0.5 : a]);
    expect(yieldTargetMatches([nly(cut)], 5)).toEqual([]);
  });
  it('drops off if its price is more than a week old', () => {
    expect(yieldTargetMatches([nly(NLY_DIVIDENDS, '2026-11-05')], 5)).toEqual([]);
  });
});

it('stability looks back 2 years', () => {
  expect(STABILITY_LOOKBACK_YEARS).toBe(2);
});
