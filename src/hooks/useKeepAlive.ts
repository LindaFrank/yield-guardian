import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes — keeps the edge function warm

/**
 * Pings the stock-data edge function on mount and at a regular interval
 * so the first user-triggered request doesn't pay the cold-start cost.
 * Does NOT consume any FMP quota — the 'ping' action is a no-op on the server.
 */
export function useKeepAlive() {
  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      try {
        await supabase.functions.invoke('stock-data', {
          body: { action: 'ping', tickers: [] },
        });
      } catch {
        // Silent — keep-alive failures are not user-facing.
      }
    };

    // Fire immediately, then on an interval. Skip while tab is hidden.
    if (!document.hidden) ping();
    const id = window.setInterval(() => {
      if (!cancelled && !document.hidden) ping();
    }, INTERVAL_MS);

    const onVisible = () => {
      if (!document.hidden) ping();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
