import type { ReplacementCandidate, Stock } from '@/types/portfolio';
import { calculateDividendYield, checkDividendStability } from './portfolioUtils';
import { isEligibleAlternative } from './alternativeSafeguards';

/** Years of completed dividend history the stability test looks back over. */
export const STABILITY_LOOKBACK_YEARS = 2;

/**
 * "Stocks that meet Yield Target": the highest-yield candidates that pass
 * every Yield Guardian test right now — Stable over the 2-year look-back,
 * yield at or above the target, and eligible (fresh price, plausible yield).
 * Re-run on every price refresh, so a stock that stops passing drops off.
 */
export function yieldTargetMatches(
  pool: Stock[],
  targetYield: number,
  limit = 5
): ReplacementCandidate[] {
  return pool
    .map((s) => {
      const stability = checkDividendStability(s, STABILITY_LOOKBACK_YEARS, targetYield);
      const stabilityScore = stability.status === 'stable' ? 3 : stability.status === 'warning' ? 2 : 1;
      const yieldVal = calculateDividendYield(s);
      const matchReason = stabilityScore === 3 ? 'Strong yield & stable history' : 'Meets yield target';
      return { stock: s, yield: yieldVal, stabilityScore, matchReason };
    })
    .filter((c) => c.yield >= targetYield && c.stabilityScore === 3 && isEligibleAlternative(c.stock))
    // Highest-yield candidate first.
    .sort((a, b) => b.yield - a.yield)
    .slice(0, limit);
}
