import { describe, expect, it } from 'vitest';
import { isEligibleAlternative, isImplausibleYield, isPriceStale } from './alternativeSafeguards';
import { suggestReplacements } from './portfolioUtils';
import { toOptimizerCandidates } from './optimizer';
import type { Stock } from '@/types/portfolio';

const NOW = new Date('2026-11-16T15:30:00Z');

function stock(ticker: string, price: number, annual: number, priceDate?: string): Stock {
  const dividendHistory = ['2026-09-01', '2026-06-01', '2026-03-02', '2025-12-01', '2025-09-02', '2025-06-02', '2025-03-03', '2024-12-02', '2024-09-02', '2024-06-03', '2024-03-01']
    .map((date) => ({ date, amount: annual / 4 }));
  return { ticker, name: ticker, sector: 'Financials', currentPrice: price, annualDividend: annual, dividendHistory, currentYield: (annual / price) * 100, priceDate };
}

describe('closing price older than a week', () => {
  it('excludes a stock last priced 8 days ago', () => {
    expect(isPriceStale(stock('OLD', 25, 2), NOW)).toBe(false);
    expect(isPriceStale(stock('OLD', 25, 2, '2026-11-08'), NOW)).toBe(true);
  });
  it('keeps a stock priced at Friday\'s close on Monday', () => {
    expect(isPriceStale(stock('FRI', 25, 2, '2026-11-13'), NOW)).toBe(false);
  });
});

describe('yields above 50% are bad data', () => {
  it('flags 51% but not 50%', () => {
    expect(isImplausibleYield(stock('HI', 100, 51))).toBe(true);
    expect(isImplausibleYield(stock('OK', 100, 50))).toBe(false);
  });
});

describe('NLY-PI case (redeemed, $0.106 price from Oct 26)', () => {
  // suggestReplacements / toOptimizerCandidates read the real clock, so the
  // "still tradable" comparators have to be priced within the last week of
  // *now*, not of a fixed date — otherwise this test rots as time passes.
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  const nlyPi = stock('NLY-PI', 0.10602, 2.28827, '2026-10-26');
  const good = stock('NLY-PF', 25.41, 2.27, daysAgo(1));
  const abbv = stock('ABBV', 295.03, 7.01, daysAgo(1));

  it('is never offered as an Alternative', () => {
    expect(isEligibleAlternative(nlyPi, NOW)).toBe(false);
    expect(isEligibleAlternative(good, NOW)).toBe(true);
    const picks = suggestReplacements(abbv, [nlyPi, good], 5, ['ABBV']).map((c) => c.stock.ticker);
    expect(picks).not.toContain('NLY-PI');
    expect(picks).toContain('NLY-PF');
    expect(toOptimizerCandidates([nlyPi, good]).map((c) => c.stock.ticker)).toEqual(['NLY-PF']);
  });

  it('is excluded on a fresh price too, because its yield is implausible', () => {
    expect(isEligibleAlternative(stock('NLY-PI', 0.10602, 2.28827, '2026-11-13'), NOW)).toBe(false);
  });
});
