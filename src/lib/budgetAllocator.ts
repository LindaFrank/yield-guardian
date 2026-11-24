export type BudgetMode = 'even' | 'aggressive' | 'conservative';

export type AllocationStatus = 'bought' | 'cannot_afford' | 'not_bought';

export interface BudgetStockInput {
  ticker: string;
  currentPrice: number;
  computedYield: number;
}

export interface StockAllocation {
  ticker: string;
  shares: number;
  portionBudget: number;
  cost: number;
  status: AllocationStatus;
}

export interface BudgetAllocationResult {
  allocations: Record<string, StockAllocation>;
  totalAllocated: number;
  remaining: number;
  weightedYield: number;
  effectivePortions: number;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Allocates a dollar budget into whole shares across picked stocks.
 * - Sorts stocks by highest yield first; if `portions < stocks.length`,
 *   only the top `portions` highest-yielding stocks receive funding and
 *   the rest are marked `not_bought`.
 * - `even`: equal dollar portions; leftover cash sweeps into extra whole
 *   shares of the highest-yielding affordable active stock.
 * - `aggressive`: weights portions toward higher-yielding stocks (yield^2);
 *   leftover cash sweeps into the highest-yielding affordable active stock.
 * - `conservative`: weights portions toward stocks closest to `targetYield`;
 *   leftover cash sweeps into the affordable active stock closest to `targetYield`.
 * - Any active stock whose portion cannot afford 1 whole share (and isn't
 *   picked up by the sweep) is flagged `cannot_afford`.
 */
export function allocateBudget(
  stocks: BudgetStockInput[],
  budget: number,
  mode: BudgetMode,
  portions: number,
  targetYield: number
): BudgetAllocationResult {
  const allocations: Record<string, StockAllocation> = {};

  if (!Number.isFinite(budget) || budget <= 0 || stocks.length === 0) {
    for (const s of stocks) {
      allocations[s.ticker] = {
        ticker: s.ticker,
        shares: 0,
        portionBudget: 0,
        cost: 0,
        status: 'not_bought',
      };
    }
    return {
      allocations,
      totalAllocated: 0,
      remaining: Number.isFinite(budget) && budget > 0 ? roundCents(budget) : 0,
      weightedYield: 0,
      effectivePortions: 0,
    };
  }

  // Highest yield first (tie-break by lower share price for determinism)
  const ranked = [...stocks].sort((a, b) => {
    if (b.computedYield !== a.computedYield) return b.computedYield - a.computedYield;
    return a.currentPrice - b.currentPrice;
  });

  const clampedPortions = Math.max(1, Math.min(Math.floor(portions || stocks.length), ranked.length));
  const active = ranked.slice(0, clampedPortions);
  const notBought = ranked.slice(clampedPortions);

  for (const s of notBought) {
    allocations[s.ticker] = {
      ticker: s.ticker,
      shares: 0,
      portionBudget: 0,
      cost: 0,
      status: 'not_bought',
    };
  }

  // Compute weights for active stocks
  const weights = active.map((s) => {
    if (mode === 'aggressive') {
      const y = Math.max(s.computedYield, 0.01);
      return y * y;
    }
    if (mode === 'conservative') {
      const dist = Math.abs(s.computedYield - targetYield);
      return 1 / Math.pow(dist + 0.5, 2);
    }
    return 1;
  });

  const weightSum = weights.reduce((acc, w) => acc + w, 0) || active.length;

  let spent = 0;
  active.forEach((s, idx) => {
    const portionBudget = (budget * (weights[idx] ?? 1)) / weightSum;
    const validPrice = Number.isFinite(s.currentPrice) && s.currentPrice > 0;
    const shares = validPrice ? Math.floor(portionBudget / s.currentPrice) : 0;
    const cost = validPrice ? shares * s.currentPrice : 0;
    spent += cost;
    allocations[s.ticker] = {
      ticker: s.ticker,
      shares,
      portionBudget: roundCents(portionBudget),
      cost: roundCents(cost),
      status: shares > 0 ? 'bought' : 'cannot_afford',
    };
  });

  // Sweep leftover cash into whole shares of active stocks until nothing fits
  const sweepOrder =
    mode === 'conservative'
      ? [...active].sort((a, b) => {
          const da = Math.abs(a.computedYield - targetYield);
          const db = Math.abs(b.computedYield - targetYield);
          if (da !== db) return da - db;
          return a.currentPrice - b.currentPrice;
        })
      : active; // already sorted highest yield first

  let remaining = budget - spent;
  const validSweep = sweepOrder.filter((s) => Number.isFinite(s.currentPrice) && s.currentPrice > 0);

  if (validSweep.length > 0) {
    // Cap iterations defensively to prevent pathological loops on tiny prices
    let guard = 0;
    while (guard < 10000) {
      guard += 1;
      const pick = validSweep.find((s) => s.currentPrice <= remaining + 1e-9);
      if (!pick) break;
      const entry = allocations[pick.ticker];
      if (!entry) break;
      entry.shares += 1;
      entry.cost = roundCents(entry.shares * pick.currentPrice);
      entry.status = 'bought';
      spent += pick.currentPrice;
      remaining = budget - spent;
    }
  }

  const totalAllocated = roundCents(spent);
  const finalRemaining = roundCents(Math.max(0, budget - totalAllocated));

  let weightedDividend = 0;
  for (const s of active) {
    const entry = allocations[s.ticker];
    if (entry && entry.shares > 0) {
      weightedDividend += entry.cost * (s.computedYield / 100);
    }
  }
  const weightedYield = totalAllocated > 0 ? (weightedDividend / totalAllocated) * 100 : 0;

  return {
    allocations,
    totalAllocated,
    remaining: finalRemaining,
    weightedYield: Math.round(weightedYield * 100) / 100,
    effectivePortions: clampedPortions,
  };
}