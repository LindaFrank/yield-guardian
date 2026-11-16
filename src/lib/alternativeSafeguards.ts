import type { Stock } from '@/types/portfolio';

/** An Alternative whose latest closing price is older than this is never suggested. */
export const MAX_PRICE_AGE_DAYS = 7;
/** Yields above this (percent) are treated as bad data, never as an opportunity. */
export const MAX_PLAUSIBLE_YIELD_PCT = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

function yieldPct(stock: Stock): number {
  return stock.currentPrice > 0 ? (stock.annualDividend / stock.currentPrice) * 100 : 0;
}

/** True when the stock's yield is too high to be real (e.g. a bad or stale price). */
export function isImplausibleYield(stock: Stock): boolean {
  return yieldPct(stock) > MAX_PLAUSIBLE_YIELD_PCT;
}

/**
 * True when the stock's most recent price is more than a week old — the usual
 * sign of a redeemed or delisted security (e.g. NLY-PI, retired Oct 1 2026).
 * Stocks without a known price date (sample data) are not treated as stale.
 */
export function isPriceStale(stock: Stock, now: Date = new Date()): boolean {
  if (!stock.priceDate) return false;
  const priced = Date.parse(`${stock.priceDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(priced)) return false;
  return now.getTime() - priced > MAX_PRICE_AGE_DAYS * DAY_MS;
}

/** Whether a stock may be offered as an Alternative. */
export function isEligibleAlternative(stock: Stock, now: Date = new Date()): boolean {
  return stock.currentPrice > 0 && !isPriceStale(stock, now) && !isImplausibleYield(stock);
}
