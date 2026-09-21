/**
 * Portfolio size limits.
 *
 * A personal dividend portfolio is expected to hold a few dozen positions.
 * Very large imports strain the live-quote budget, the edge function payload,
 * and dashboard rendering, so we cap the number of holdings per portfolio.
 */
export const MAX_PORTFOLIO_POSITIONS = 100;

/** Above this many holdings we warn (but still allow) the user. */
export const LARGE_PORTFOLIO_WARNING_THRESHOLD = 30;

/** How many more positions can still be added. */
export function remainingCapacity(currentCount: number): number {
  return Math.max(0, MAX_PORTFOLIO_POSITIONS - currentCount);
}

export function isAtPortfolioLimit(currentCount: number): boolean {
  return currentCount >= MAX_PORTFOLIO_POSITIONS;
}

export const portfolioLimitMessage = `A portfolio can hold up to ${MAX_PORTFOLIO_POSITIONS} stocks. Remove a stock before adding another.`;
