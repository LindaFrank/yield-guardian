import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (quotes)
const DIVIDENDS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (dividend history rarely changes)
const QUOTE_BATCH_SIZE = 50; // tickers per batched FMP quote request

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

    // Lightweight keep-alive ping — no FMP call, no DB call.
    if (action === 'ping') {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(JSON.stringify({ error: 'tickers array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanTickers = tickers
      .map((t: string) => t.toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
      .slice(0, 100);

    // For search, preserve the raw query (so things like "AT&T" still match by name)
    const rawQuery = typeof tickers[0] === 'string' ? tickers[0].trim() : '';

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

      // Fetch stale/missing from FMP in batched requests (one FMP call per chunk)
      if (stale.length > 0) {
        for (let i = 0; i < stale.length; i += QUOTE_BATCH_SIZE) {
          const chunk = stale.slice(i, i + QUOTE_BATCH_SIZE);
          const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(chunk.join(','))}&apikey=${apiKey}`;
          console.log(`Fetching batched quotes (${chunk.length} tickers): ${url.replace(apiKey, '***')}`);
          try {
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              console.log(`[batch] raw response type=${Array.isArray(data) ? 'array' : typeof data} preview=${JSON.stringify(data).slice(0, 500)}`);
              const quotes: any[] = Array.isArray(data) ? data : data ? [data] : [];
              const bySymbol = new Map<string, any>();
              for (const q of quotes) {
                if (q?.symbol) bySymbol.set(q.symbol.toUpperCase(), q);
              }
              const nowIso = new Date().toISOString();
              await Promise.all(
                chunk.map(async (ticker: string) => {
                  const quote = bySymbol.get(ticker);
                  if (quote) {
                    fresh[ticker] = quote;
                    await sb.from('stock_cache').upsert(
                      { ticker, quote_data: quote, cached_at: nowIso },
                      { onConflict: 'ticker' }
                    );
                  }
                })
              );
            } else {
              console.error(`FMP batched quote failed (${chunk.length} tickers): ${res.status}`);
            }
          } catch (e) {
            console.error('FMP batched quote error:', e);
          }
        }
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
        .select('ticker, dividends_data, cached_at, dividends_cached_at')
        .in('ticker', cleanTickers);

      const now = Date.now();
      const results: Record<string, any[]> = {};
      const stale: string[] = [];

      for (const ticker of cleanTickers) {
        const hit = cached?.find((c: any) => c.ticker === ticker);
        if (hit && hit.dividends_data && (now - new Date(hit.dividends_cached_at ?? 0).getTime()) < DIVIDENDS_CACHE_TTL_MS) {
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
              // Upsert cache — refresh only the dividend timestamp so quote freshness is untouched
              await sb.from('stock_cache').upsert(
                { ticker, dividends_data: historical, dividends_cached_at: new Date().toISOString() },
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
      const rawQ = rawQuery || cleanTickers[0] || '';
      const sanitizedQ = rawQ.replace(/[^A-Za-z0-9.\-]/g, '').trim();

      async function runSearch(q: string) {
        if (!q) return [] as any[];
        console.log(`[search] querying FMP with q="${q}"`);
        const [searchRes, nameRes, quoteRes] = await Promise.all([
          fetch(`${FMP_BASE}/search-symbol?query=${encodeURIComponent(q)}&apikey=${apiKey}`),
          fetch(`${FMP_BASE}/search-name?query=${encodeURIComponent(q)}&apikey=${apiKey}`),
          fetch(`${FMP_BASE}/quote?symbol=${encodeURIComponent(q)}&apikey=${apiKey}`),
        ]);
        console.log(`[search] status sym=${searchRes.status} name=${nameRes.status} quote=${quoteRes.status}`);
        let acc: any[] = [];
        if (searchRes.ok) {
          const d = await searchRes.json();
          if (Array.isArray(d)) acc = d;
        }
        if (nameRes.ok) {
          const d = await nameRes.json();
          if (Array.isArray(d)) {
            for (const item of d) {
              if (item?.symbol && !acc.some((r: any) => r.symbol === item.symbol)) acc.push(item);
            }
          }
        }
        if (quoteRes.ok) {
          const qd = await quoteRes.json();
          const quote = Array.isArray(qd) ? qd[0] : qd;
          if (quote && quote.symbol) {
            const idx = acc.findIndex((r: any) => r.symbol === quote.symbol);
            const entry = {
              symbol: quote.symbol,
              name: quote.name,
              currency: 'USD',
              stockExchange: quote.exchange,
              exchange: quote.exchange,
            };
            if (idx >= 0) acc.splice(idx, 1);
            acc.unshift(entry);
          }
        }
        return acc;
      }

      let results = await runSearch(rawQ);
      // Fallback: if the raw query had special chars and produced nothing,
      // retry with a sanitized version (e.g. "AT&T" -> "AT T").
      if (results.length === 0 && sanitizedQ && sanitizedQ !== rawQ) {
        results = await runSearch(sanitizedQ);
      }

      return new Response(JSON.stringify(results), {
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
