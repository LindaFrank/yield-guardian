/**
 * Replacement-stock optimizer.
 *
 * Generalised to a candidate set of variable size N >= 1.
 *
 * Notation (per underperformer Y):
 *   sharesY        — shares of Y the user is willing to sell (slider value)
 *   P_Y, A_Y       — price per share & annual dividend per share of Y
 *   s_Y            — sale proceeds = sharesY * P_Y
 *   investmentY    — capital deployed into replacements (== s_Y)
 *   P[i], A[i]     — price & annual-div arrays for the N candidates,
 *                    sorted DESCENDING by yield (A[i] / P[i]) so index 0
 *                    is always the highest-yield candidate.
 *   n[i]           — integer share count to BUY of candidate i (>= 0)
 *   Y*             — user's target minimum yield (decimal, e.g. 0.05)
 *
 * Modes:
 *   'aggressive'   — maximise IncomeDelta_Y = Σ A[i]·n[i] − A_Y·sharesY
 *                    s.t. Σ P[i]·n[i] ≤ s_Y , n[i] integer ≥ 0
 *   'conservative' — minimise sharesY (smallest sale of Y) s.t. resulting
 *                    yield on the position meets Y*:
 *                    Σ (A[i] − A_Y) · n[i] ≥ (Y* − A_Y) · investmentY
 *                    Equivalent: NewYield_Y >= Y*.
 *
 * Diversification flag: when true, every candidate must receive n[i] >= 1.
 *
 * Edge cases:
 *   N = 0  → returns "no trade".
 *   N = 1  → closed-form (greedy fill).
 *   N > 6  → candidate set is truncated to top 5 by yield before solving
 *            (branch-and-bound stays cheap).
 */

import { Stock } from '@/types/portfolio';

export type OptimizerMode = 'aggressive' | 'conservative';

export interface OptimizerCandidate {
  stock: Stock;
  /** annual dividend per share */
  A: number;
  /** price per share */
  P: number;
  /** dividend yield (A / P) — convenience */
  yield: number;
}

export interface OptimizerInput {
  underperformer: Stock;
  /** total shares of Y the user holds (cap for conservative slider) */
  sharesYHeld: number;
  /** shares of Y the user is willing to sell (aggressive: this drives s_Y) */
  sharesYSold: number;
  candidates: OptimizerCandidate[];
  /** target min yield as a decimal (0.05 == 5%) */
  targetYield: number;
  mode: OptimizerMode;
  /** force every candidate to get at least 1 share */
  diversify: boolean;
  /** total portfolio market value — required for conservative whole-portfolio solve */
  portfolioValue?: number;
  /** total portfolio annual dividend income — required for conservative whole-portfolio solve */
  portfolioIncome?: number;
}

export interface OptimizerRow {
  stock: Stock;
  shares: number;        // n[i]
  cost: number;          // P[i] * n[i]
  income: number;        // A[i] * n[i]
}

export interface OptimizerResult {
  status: 'ok' | 'no-trade' | 'infeasible';
  message?: string;
  mode: OptimizerMode;
  /** rows in the same descending-yield order as the sorted candidate array */
  rows: OptimizerRow[];
  /** shares of Y actually sold (== input.sharesYSold for aggressive mode;
   *  solved minimum for conservative mode) */
  sharesYSold: number;
  /** sale proceeds redeployed */
  investmentY: number;
  /** Σ P[i]·n[i] */
  totalCost: number;
  /** leftover cash = investmentY − totalCost (≥ 0) */
  leftoverCash: number;
  /** Σ A[i]·n[i] */
  newIncome: number;
  /** A_Y · sharesYSold */
  lostIncome: number;
  /** newIncome − lostIncome */
  incomeDelta: number;
  /** new yield on the position dollars (newIncome / investmentY) */
  newYield: number;
  /** projected whole-portfolio yield AFTER the trade (decimal). Set when portfolioValue/Income provided. */
  newPortfolioYield?: number;
}

const noTrade = (
  underperformer: Stock,
  mode: OptimizerMode,
  message = 'No replacement candidates available.',
): OptimizerResult => ({
  status: 'no-trade',
  message,
  mode,
  rows: [],
  sharesYSold: 0,
  investmentY: 0,
  totalCost: 0,
  leftoverCash: 0,
  newIncome: 0,
  lostIncome: 0,
  incomeDelta: 0,
  newYield: 0,
});

/** Sort descending by A/P yield, then truncate to maxN. */
function prepareCandidates(
  candidates: OptimizerCandidate[],
  maxN = 5,
): OptimizerCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.yield - a.yield);
  return sorted.length > 6 ? sorted.slice(0, maxN) : sorted;
}

/** Build OptimizerRow[] from a chosen n[] aligned to the sorted candidates. */
function buildRows(
  cands: OptimizerCandidate[],
  n: number[],
): OptimizerRow[] {
  return cands.map((c, i) => ({
    stock: c.stock,
    shares: n[i],
    cost: c.P * n[i],
    income: c.A * n[i],
  }));
}

/* ---------- AGGRESSIVE: maximise IncomeDelta with budget Σ P·n ≤ s_Y ---------- */

interface AggressiveSolve {
  n: number[];
  income: number;
  cost: number;
}

/**
 * Bounded integer knapsack-style branch & bound.
 * State: index i, remaining budget. We try n[i] from minShares..maxShares.
 * minShares = diversify ? 1 : 0. Upper bound uses LP relaxation
 * (remaining * yield_of_index_i) which is admissible because candidates are
 * sorted by yield desc.
 */
function solveAggressive(
  cands: OptimizerCandidate[],
  budget: number,
  diversify: boolean,
): AggressiveSolve {
  const N = cands.length;
  const minShares = diversify ? 1 : 0;

  // If diversify on, ensure baseline 1 share each fits the budget.
  if (diversify) {
    const baseCost = cands.reduce((s, c) => s + c.P, 0);
    if (baseCost > budget) {
      return { n: new Array(N).fill(0), income: 0, cost: 0 };
    }
  }

  let bestIncome = -Infinity;
  let bestN: number[] = new Array(N).fill(0);
  let bestCost = 0;
  const cur: number[] = new Array(N).fill(0);

  const recurse = (i: number, remaining: number, accIncome: number, accCost: number) => {
    if (i === N) {
      if (accIncome > bestIncome) {
        bestIncome = accIncome;
        bestN = [...cur];
        bestCost = accCost;
      }
      return;
    }
    // LP upper bound from this index onward: remaining * best yield available
    const bestYieldRemaining = cands[i].A / cands[i].P;
    const upper = accIncome + remaining * bestYieldRemaining;
    if (upper <= bestIncome) return;

    const c = cands[i];
    const maxShares = Math.floor(remaining / c.P);
    // Iterate from highest n down — finds good incumbents fast for pruning.
    for (let k = maxShares; k >= minShares; k--) {
      const cost = c.P * k;
      if (cost > remaining) continue;
      cur[i] = k;
      recurse(i + 1, remaining - cost, accIncome + c.A * k, accCost + cost);
    }
    cur[i] = 0;
  };

  recurse(0, budget, 0, 0);

  if (bestIncome === -Infinity) {
    return { n: new Array(N).fill(0), income: 0, cost: 0 };
  }
  return { n: bestN, income: bestIncome, cost: bestCost };
}

/* ---------- CONSERVATIVE: minimise sharesYSold s.t. NewYield_Y >= Y* ---------- */

/**
 * Constraint form (LP):
 *   Σ (A[i] − A_Y) · n[i]  ≥  (Y* − A_Y) · investmentY
 *   investmentY = sharesYSold · P_Y
 *   Σ P[i] · n[i]          ≤  investmentY
 *
 * We linearly scan sharesYSold from 1..sharesYHeld and, for each, run the
 * aggressive solver to pick the income-maximising n[]; accept the first
 * sharesYSold whose resulting NewYield_Y meets Y*. (Income-maximising at a
 * given budget always yields the highest NewYield achievable — so it's the
 * correct feasibility test.)
 */
function solveConservative(
  input: OptimizerInput,
  cands: OptimizerCandidate[],
): OptimizerResult {
  const { underperformer, sharesYHeld, targetYield, diversify, portfolioValue, portfolioIncome } = input;
  const P_Y = underperformer.currentPrice;
  const A_Y = underperformer.annualDividend;

  if (sharesYHeld <= 0 || P_Y <= 0) {
    return {
      ...noTrade(underperformer, 'conservative', 'You need to own shares of this stock to run the conservative optimiser.'),
      status: 'infeasible',
    };
  }

  // Whole-portfolio target mode: find smallest sale that brings the portfolio
  // yield up to targetYield. Constraint:
  //   (portfolioIncome + incomeDelta) / portfolioValue >= targetYield
  // i.e. incomeDelta >= targetYield * portfolioValue - portfolioIncome.
  // Note: a swap doesn't change portfolio market value (sale proceeds = buy cost + leftover cash, all stay invested at par).
  const usePortfolioTarget =
    typeof portfolioValue === 'number' && portfolioValue > 0 && typeof portfolioIncome === 'number';

  const requiredDelta = usePortfolioTarget
    ? targetYield * (portfolioValue as number) - (portfolioIncome as number)
    : 0;

  // Already at/above target — no trade needed.
  if (usePortfolioTarget && requiredDelta <= 0) {
    return {
      ...noTrade(underperformer, 'conservative', 'Your portfolio yield already meets your income goal — no trade needed from this stock.'),
      status: 'no-trade',
    };
  }

  let bestFromThisStock: OptimizerResult | null = null;

  for (let sold = 1; sold <= Math.floor(sharesYHeld); sold++) {
    const investmentY = sold * P_Y;
    const sol = solveAggressive(cands, investmentY, diversify);
    const lostIncome = A_Y * sold;
    const incomeDelta = sol.income - lostIncome;
    const newYield = investmentY > 0 ? sol.income / investmentY : 0;

    const result: OptimizerResult = {
      status: 'ok',
      mode: 'conservative',
      rows: buildRows(cands, sol.n),
      sharesYSold: sold,
      investmentY,
      totalCost: sol.cost,
      leftoverCash: investmentY - sol.cost,
      newIncome: sol.income,
      lostIncome,
      incomeDelta,
      newYield,
      newPortfolioYield: usePortfolioTarget
        ? ((portfolioIncome as number) + incomeDelta) / (portfolioValue as number)
        : undefined,
    };

    if (usePortfolioTarget) {
      if (incomeDelta >= requiredDelta) return result;
      bestFromThisStock = result; // selling everything is the best this single stock can do
    } else {
      // Legacy: position-yield target
      if (newYield >= targetYield) return result;
    }
  }

  // Couldn't reach the goal from this stock alone. Surface the best partial result so the user
  // can see how far it gets and address the next underperformer.
  if (usePortfolioTarget && bestFromThisStock) {
    const reached = (bestFromThisStock.newPortfolioYield ?? 0) * 100;
    return {
      ...bestFromThisStock,
      status: 'ok',
      message: `Selling all ${Math.floor(sharesYHeld)} shares of ${underperformer.ticker} lifts your portfolio yield to ${reached.toFixed(2)}%. Address the next underperformer to keep moving toward your goal.`,
    };
  }

  return {
    ...noTrade(underperformer, 'conservative'),
    status: 'infeasible',
    message: 'Target unreachable — try Aggressive or lower your yield target.',
  };
}

/* ---------- public entry point ---------- */

export function optimizeReplacement(input: OptimizerInput): OptimizerResult {
  const { underperformer, mode } = input;

  if (input.candidates.length === 0) {
    return noTrade(underperformer, mode);
  }

  const cands = prepareCandidates(input.candidates, 5);
  if (cands.length === 0) {
    return noTrade(underperformer, mode);
  }

  if (mode === 'conservative') {
    return solveConservative(input, cands);
  }

  // Aggressive
  const sharesYSold = Math.max(0, Math.floor(input.sharesYSold));
  if (sharesYSold === 0) {
    return noTrade(underperformer, 'aggressive', 'Set the shares-to-sell slider above 0 to optimise.');
  }
  const P_Y = underperformer.currentPrice;
  const A_Y = underperformer.annualDividend;
  const investmentY = sharesYSold * P_Y;

  // N=1 closed-form: greedy fill of the single candidate.
  if (cands.length === 1) {
    const c = cands[0];
    const k = Math.floor(investmentY / c.P);
    const n = [Math.max(input.diversify ? 1 : 0, k)];
    if (input.diversify && c.P > investmentY) {
      return {
        ...noTrade(underperformer, 'aggressive', 'Diversification requires at least 1 share of each candidate, but your budget is too small.'),
        status: 'infeasible',
      };
    }
    const cost = c.P * n[0];
    const income = c.A * n[0];
    const lostIncome = A_Y * sharesYSold;
    return {
      status: 'ok',
      mode: 'aggressive',
      rows: buildRows(cands, n),
      sharesYSold,
      investmentY,
      totalCost: cost,
      leftoverCash: investmentY - cost,
      newIncome: income,
      lostIncome,
      incomeDelta: income - lostIncome,
      newYield: investmentY > 0 ? income / investmentY : 0,
    };
  }

  // N >= 2 (and capped at 5): branch & bound.
  const sol = solveAggressive(cands, investmentY, input.diversify);

  // Diversification infeasibility check
  if (input.diversify) {
    const baseCost = cands.reduce((s, c) => s + c.P, 0);
    if (baseCost > investmentY) {
      return {
        ...noTrade(underperformer, 'aggressive', 'Diversification requires at least 1 share of each candidate, but your budget is too small.'),
        status: 'infeasible',
      };
    }
  }

  const lostIncome = A_Y * sharesYSold;
  return {
    status: 'ok',
    mode: 'aggressive',
    rows: buildRows(cands, sol.n),
    sharesYSold,
    investmentY,
    totalCost: sol.cost,
    leftoverCash: investmentY - sol.cost,
    newIncome: sol.income,
    lostIncome,
    incomeDelta: sol.income - lostIncome,
    newYield: investmentY > 0 ? sol.income / investmentY : 0,
  };
}

/** Helper: turn a Stock[] candidate pool into OptimizerCandidate[]. */
export function toOptimizerCandidates(stocks: Stock[]): OptimizerCandidate[] {
  return stocks
    .filter((s) => s.currentPrice > 0)
    .map((s) => ({
      stock: s,
      A: s.annualDividend,
      P: s.currentPrice,
      yield: s.annualDividend / s.currentPrice,
    }));
}
