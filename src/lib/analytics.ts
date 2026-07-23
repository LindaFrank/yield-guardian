import { supabase } from '@/integrations/supabase/client';

/** Log a portfolio snapshot. Fire-and-forget. */
export async function logPortfolioSnapshot(params: {
  userId: string;
  portfolioValue: number;
  annualIncome: number;
  weightedYield: number; // percent
  numPositions: number;
  numUnderperformers: number;
  reason: string;
}) {
  try {
    await supabase.from('portfolio_snapshots').insert({
      user_id: params.userId,
      portfolio_value: params.portfolioValue,
      annual_income: params.annualIncome,
      weighted_yield: params.weightedYield,
      num_positions: params.numPositions,
      num_underperformers: params.numUnderperformers,
      reason: params.reason,
    });
  } catch {
    // swallow
  }
}

/** Log a replacement event. Fire-and-forget. */
export async function logReplacementEvent(params: {
  userId: string;
  fromTicker: string;
  toTicker: string;
  sharesSold: number;
  sharesBought: number;
  incomeDelta: number;
  yieldDelta: number;
  mode?: string;
}) {
  try {
    await supabase.from('replacement_events').insert({
      user_id: params.userId,
      from_ticker: params.fromTicker,
      to_ticker: params.toTicker,
      shares_sold: params.sharesSold,
      shares_bought: params.sharesBought,
      income_delta: params.incomeDelta,
      yield_delta: params.yieldDelta,
      mode: params.mode ?? null,
    });
  } catch {
    // swallow
  }
}

/** Prevent duplicate daily snapshots per session. */
const dailyLogged = new Set<string>();
export function markDailySnapshotLogged(userId: string) {
  const key = `${userId}:${new Date().toISOString().slice(0, 10)}`;
  if (dailyLogged.has(key)) return false;
  dailyLogged.add(key);
  return true;
}
