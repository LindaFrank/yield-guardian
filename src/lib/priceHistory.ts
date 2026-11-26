export interface PricePoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface SixMonthSummary {
  startPrice: number;
  endPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  isPositive: boolean;
}

export function computeSixMonthSummary(points: PricePoint[] | undefined): SixMonthSummary | null {
  if (!points || points.length < 2) return null;
  const startPrice = points[0]?.close ?? 0;
  const endPrice = points[points.length - 1]?.close ?? 0;
  if (!(startPrice > 0) || !(endPrice > 0)) return null;
  let high = -Infinity;
  let low = Infinity;
  for (const p of points) {
    if (p.close > high) high = p.close;
    if (p.close < low) low = p.close;
  }
  const change = endPrice - startPrice;
  const changePercent = (change / startPrice) * 100;
  return {
    startPrice,
    endPrice,
    change,
    changePercent,
    high,
    low,
    isPositive: change >= 0,
  };
}

export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function formatMonthAxis(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}