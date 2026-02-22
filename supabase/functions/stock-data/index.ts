import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('FMP_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'FMP_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, tickers } = await req.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(JSON.stringify({ error: 'tickers array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanTickers = tickers
      .map((t: string) => t.toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
      .slice(0, 20);

    const sb = getServiceClient();

    if (action === 'quote') {
      // Check cache first
      const { data: cached } = await sb
        .from('stock_cache')
        .select('ticker, quote_data, cached_at')
        .in('ticker', cleanTickers);

      const now = Date.now();
      const fresh: Record<string, any> = {};
      const stale: string[] = [];

      for (const ticker of cleanTickers) {
        const hit = cached?.find((c: any) => c.ticker === ticker);
        if (hit && hit.quote_data && (now - new Date(hit.cached_at).getTime()) < CACHE_TTL_MS) {
          fresh[ticker] = hit.quote_data;
        } else {
          stale.push(ticker);
        }
      }

      // Fetch stale/missing from FMP
      if (stale.length > 0) {
        await Promise.all(
          stale.map(async (ticker: string) => {
            const url = `${FMP_BASE}/quote?symbol=${ticker}&apikey=${apiKey}`;
            console.log(`Fetching quote: ${url.replace(apiKey, '***')}`);
            const res = await fetch(url);
            if (!res.ok) {
              console.error(`FMP quote failed for ${ticker}: ${res.status}`);
              return;
            }
            const data = await res.json();
            const quote = Array.isArray(data) ? data[0] : data;
            if (quote) {
              fresh[ticker] = quote;
              // Upsert cache
              await sb.from('stock_cache').upsert(
                { ticker, quote_data: quote, cached_at: new Date().toISOString() },
                { onConflict: 'ticker' }
              );
            }
          })
        );
      }

      const allQuotes = cleanTickers.map((t) => fresh[t]).filter(Boolean);
      return new Response(JSON.stringify(allQuotes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dividends') {
      // Check cache first
      const { data: cached } = await sb
        .from('stock_cache')
        .select('ticker, dividends_data, cached_at')
        .in('ticker', cleanTickers);

      const now = Date.now();
      const results: Record<string, any[]> = {};
      const stale: string[] = [];

      for (const ticker of cleanTickers) {
        const hit = cached?.find((c: any) => c.ticker === ticker);
        if (hit && hit.dividends_data && (now - new Date(hit.cached_at).getTime()) < CACHE_TTL_MS) {
          results[ticker] = hit.dividends_data as any[];
        } else {
          stale.push(ticker);
        }
      }

      if (stale.length > 0) {
        await Promise.all(
          stale.map(async (ticker: string) => {
            const res = await fetch(
              `${FMP_BASE}/dividends?symbol=${ticker}&apikey=${apiKey}`
            );
            if (res.ok) {
              const data = await res.json();
              const historical = Array.isArray(data) ? data.slice(0, 20) : [];
              results[ticker] = historical;
              // Upsert cache
              await sb.from('stock_cache').upsert(
                { ticker, dividends_data: historical, cached_at: new Date().toISOString() },
                { onConflict: 'ticker' }
              );
            } else {
              results[ticker] = [];
            }
          })
        );
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search') {
      const query = cleanTickers[0];
      const res = await fetch(
        `${FMP_BASE}/search-symbol?query=${encodeURIComponent(query)}&apikey=${apiKey}`
      );
      if (!res.ok) {
        throw new Error(`FMP search API failed [${res.status}]: ${await res.text()}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: quote, dividends, search' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
