import { describe, it, expect } from 'vitest';
import { allocateBudget, BudgetStockInput } from './budgetAllocator';

const FIVE_STOCKS: BudgetStockInput[] = [
  { ticker: 'NLY', currentPrice: 20, computedYield: 12.0 },
  { ticker: 'ARCC', currentPrice: 22, computedYield: 9.0 },
  { ticker: 'MO', currentPrice: 50, computedYield: 7.5 },
  { ticker: 'VZ', currentPrice: 40, computedYield: 6.5 },
  { ticker: 'O', currentPrice: 55, computedYield: 5.5 },
];

describe('allocateBudget', () => {
  it('splits $4,500 evenly across 5 stocks into $900 portions, whole shares, and sweeps leftover into highest-yielding affordable stock', () => {
    const result = allocateBudget(FIVE_STOCKS, 4500, 'even', 5, 5.0);

    expect(result.effectivePortions).toBe(5);
    // Each portion budget is $900
    for (const s of FIVE_STOCKS) {
      expect(result.allocations[s.ticker]?.portionBudget).toBe(900);
      expect(result.allocations[s.ticker]?.status).toBe('bought');
      expect(Number.isInteger(result.allocations[s.ticker]?.shares)).toBe(true);
    }
    // Total allocated never exceeds budget and remaining is less than cheapest stock ($20)
    expect(result.totalAllocated).toBeLessThanOrEqual(4500);
    expect(result.remaining).toBeLessThan(20);
    expect(result.totalAllocated + result.remaining).toBeCloseTo(4500, 2);
    // NLY (highest yield, $20) gets the swept leftover shares on top of its base 45 shares
    expect(result.allocations['NLY']!.shares).toBeGreaterThan(45);
  });

  it('gives money to the 3 highest-yielding stocks when 3 portions are chosen for 5 stocks, marking the other 2 as not_bought', () => {
    const result = allocateBudget(FIVE_STOCKS, 4500, 'even', 3, 5.0);

    expect(result.effectivePortions).toBe(3);
    expect(result.allocations['NLY']?.portionBudget).toBe(1500);
    expect(result.allocations['ARCC']?.portionBudget).toBe(1500);
    expect(result.allocations['MO']?.portionBudget).toBe(1500);
    expect(result.allocations['NLY']?.status).toBe('bought');
    expect(result.allocations['ARCC']?.status).toBe('bought');
    expect(result.allocations['MO']?.status).toBe('bought');

    expect(result.allocations['VZ']?.status).toBe('not_bought');
    expect(result.allocations['VZ']?.shares).toBe(0);
    expect(result.allocations['O']?.status).toBe('not_bought');
    expect(result.allocations['O']?.shares).toBe(0);
  });

  it('weights toward higher-yielding stocks in Aggressive mode and delivers higher portfolio yield than Even Split', () => {
    const even = allocateBudget(FIVE_STOCKS, 4500, 'even', 5, 5.0);
    const aggressive = allocateBudget(FIVE_STOCKS, 4500, 'aggressive', 5, 5.0);

    expect(aggressive.allocations['NLY']!.portionBudget).toBeGreaterThan(
      aggressive.allocations['O']!.portionBudget
    );
    expect(aggressive.weightedYield).toBeGreaterThan(even.weightedYield);
    expect(aggressive.totalAllocated).toBeLessThanOrEqual(4500);
  });

  it('aims the portfolio near the selected yield target in Conservative mode', () => {
    const even = allocateBudget(FIVE_STOCKS, 4500, 'even', 5, 5.5);
    const conservative = allocateBudget(FIVE_STOCKS, 4500, 'conservative', 5, 5.5);

    expect(conservative.allocations['O']!.portionBudget).toBeGreaterThan(
      conservative.allocations['NLY']!.portionBudget
    );
    expect(Math.abs(conservative.weightedYield - 5.5)).toBeLessThan(
      Math.abs(even.weightedYield - 5.5)
    );
    expect(conservative.totalAllocated).toBeLessThanOrEqual(4500);
  });

  it('flags a stock as cannot_afford when its portion cannot buy 1 whole share', () => {
    const stocks: BudgetStockInput[] = [
      { ticker: 'CHEAP', currentPrice: 25, computedYield: 8.0 },
      { ticker: 'PRICY', currentPrice: 600, computedYield: 6.0 },
    ];
    // $400 split 2 ways = $200 each; CHEAP gets 8 shares ($200) + sweeps remaining $200 = 16 shares,
    // leaving $0 so PRICY ($600) can never afford 1 share.
    const result = allocateBudget(stocks, 400, 'even', 2, 5.0);

    expect(result.allocations['CHEAP']?.status).toBe('bought');
    expect(result.allocations['PRICY']?.status).toBe('cannot_afford');
    expect(result.allocations['PRICY']?.shares).toBe(0);
  });

  it('handles zero or negative budget safely without NaN', () => {
    const zero = allocateBudget(FIVE_STOCKS, 0, 'even', 5, 5.0);
    const negative = allocateBudget(FIVE_STOCKS, -100, 'even', 5, 5.0);

    expect(zero.totalAllocated).toBe(0);
    expect(zero.remaining).toBe(0);
    expect(negative.totalAllocated).toBe(0);
    expect(negative.remaining).toBe(0);
  });
});