import { describe, expect, it } from 'vitest';
import { describeTradeFunding, type OptimizerResult } from './optimizer';
import type { Stock } from '@/types/portfolio';

/** Minimal optimizer result — only the fields describeTradeFunding reads. */
function result(
  investmentY: number,
  picks: Array<{ ticker: string; shares: number; price: number; dividend: number }>,
): OptimizerResult {
  return {
    status: 'ok',
    mode: 'aggressive',
    investmentY,
    rows: picks.map((p) => ({
      stock: { ticker: p.ticker, name: p.ticker, currentPrice: p.price, annualDividend: p.dividend } as Stock,
      shares: p.shares,
      cost: p.shares * p.price,
      income: p.shares * p.dividend,
    })),
  } as unknown as OptimizerResult;
}

describe('describeTradeFunding', () => {
  it('labels the second, smaller purchase as bought with leftover cash', () => {
    // Linda's real case: sell ABBV, Smart pick buys the bulk in NLY, 2 STWD from the change.
    const r = result(29503, [
      { ticker: 'NLY', shares: 1684, price: 17.49, dividend: 0.9148 },
      { ticker: 'STWD', shares: 2, price: 11.28, dividend: 1.92 },
    ]);

    const funding = describeTradeFunding(r);

    expect(funding.isSplit).toBe(true);
    expect(funding.mainTicker).toBe('NLY');
    expect(funding.mainShares).toBe(1684);
    expect(funding.leftoverTickers).toEqual(['STWD']);
    expect(funding.cashAfterMain).toBeCloseTo(29503 - 1684 * 17.49, 2);
  });

  it('says nothing is leftover when the trade buys only one stock', () => {
    const funding = describeTradeFunding(result(29503, [{ ticker: 'NLY', shares: 1684, price: 17.49, dividend: 0.9148 }]));

    expect(funding.isSplit).toBe(false);
    expect(funding.leftoverTickers).toEqual([]);
    expect(funding.mainTicker).toBe('NLY');
  });

  it('treats the biggest purchase as the main one even when it is listed last', () => {
    const r = result(10000, [
      { ticker: 'STWD', shares: 2, price: 11.28, dividend: 1.92 },
      { ticker: 'NLY', shares: 500, price: 17.49, dividend: 0.9148 },
    ]);

    const funding = describeTradeFunding(r);

    expect(funding.mainTicker).toBe('NLY');
    expect(funding.leftoverTickers).toEqual(['STWD']);
  });

  it('ignores candidates the solver bought none of', () => {
    const r = result(29503, [
      { ticker: 'NLY', shares: 1687, price: 17.49, dividend: 0.9148 },
      { ticker: 'STWD', shares: 0, price: 11.28, dividend: 1.92 },
    ]);

    const funding = describeTradeFunding(r);

    expect(funding.isSplit).toBe(false);
    expect(funding.leftoverTickers).toEqual([]);
  });

  it('never leaves a leftover purchase that costs more than the change available', () => {
    const r = result(29503, [
      { ticker: 'NLY', shares: 1684, price: 17.49, dividend: 0.9148 },
      { ticker: 'STWD', shares: 2, price: 11.28, dividend: 1.92 },
      { ticker: 'MAIN', shares: 1, price: 3.1, dividend: 0.2 },
    ]);

    const funding = describeTradeFunding(r);
    const leftoverCost = r.rows
      .filter((row) => funding.leftoverTickers.includes(row.stock.ticker))
      .reduce((sum, row) => sum + row.cost, 0);

    expect(leftoverCost).toBeLessThanOrEqual(funding.cashAfterMain + 1e-9);
  });

  it('reports no main purchase when the solver buys nothing', () => {
    const funding = describeTradeFunding(result(0, []));

    expect(funding.mainTicker).toBeNull();
    expect(funding.isSplit).toBe(false);
    expect(funding.cashAfterMain).toBe(0);
  });
});
