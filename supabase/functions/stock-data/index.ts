import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (personal plan: live quotes)
const COMMERCIAL_CACHE_TTL_MS = 20 * 60 * 60 * 1000; // 20 hours (Enterprise plan: once-a-day at market close)
const DIVIDENDS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (dividend history rarely changes)

// Two FMP plans run side by side in this project:
//   personal   -> FMP_API_KEY            Linda's Personal Starter plan. Her own
//                private feed, served only from the Lovable preview.
//   commercial -> FMP_ENTERPRISE_API_KEY Enterprise Access - Annual. Every other
//                copy of the app, including the published website and guest use.
// Each saved price is tagged with the plan that fetched it, so a quote pulled
// under the personal plan is never handed to anyone else's session.
type DataSource = 'personal' | 'commercial';

// Only this account may be served from the personal plan.
const PERSONAL_OWNER_EMAIL = (Deno.env.get('FMP_PERSONAL_USER_EMAIL') || 'lindafrank@aol.com').toLowerCase();

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// True for the Lovable preview (and this sandbox), false for the published site.
function isPreviewOrigin(req: Request): boolean {
  const origin = (req.headers.get('origin') || req.headers.get('referer') || '').toLowerCase();
  return origin.includes('preview') || origin.includes('localhost') || origin.includes('127.0.0.1');
}

// Never let a key leak into the logs if a provider ever echoes the request back.
function redactKey(text: string): string {
  return (text || '').replace(/apikey=[^&"' ]+/gi, 'apikey=[redacted]');
}

async function callerEmail(sb: ReturnType<typeof getServiceClient>, req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user?.email) return null;
    return data.user.email.toLowerCase();
  } catch {
    return null;
  }
}

async function resolveSource(req: Request, sb: ReturnType<typeof getServiceClient>): Promise<DataSource> {
  const email = await callerEmail(sb, req);
  if (email === PERSONAL_OWNER_EMAIL && isPreviewOrigin(req)) return 'personal';
  // Transitional: until the Enterprise key is stored, the preview keeps working on
  // the personal feed. The published website never takes this path.
  if (isPreviewOrigin(req) && !Deno.env.get('FMP_ENTERPRISE_API_KEY')) return 'personal';
  return 'commercial';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const sb = getServiceClient();
    const source = await resolveSource(req, sb);
    const apiKey = source === 'personal' ? Deno.env.get('FMP_API_KEY') : Deno.env.get('FMP_ENTERPRISE_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `No FMP key configured for the ${source} data source` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[stock-data] action=${action} source=${source} tickers=${tickers.length}`);

    const cleanTickers = tickers
      .map((t: string) => t.toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
      .slice(0, 100);

    // For search, preserve the raw query (so things like "AT&T" still match by name)
    const rawQuery = typeof tickers[0] === 'string' ? tickers[0].trim() : '';

    // Temporary diagnostic: ask the Enterprise key which price endpoints it will
    // answer. Linda's plan is once-a-day at market close, so we expect an
    // end-of-day endpoint to work where /quote did not. Remove once settled.
    if (action === 'probe') {
      const key = Deno.env.get('FMP_ENTERPRISE_API_KEY');
      if (!key) {
        return new Response(JSON.stringify({ error: 'No Enterprise key stored' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const candidates = [
        'historical-price-eod/light',
        'historical-price-eod/full',
        'profile',
        'quote-short',
        'batch-quote',
        'quote',
      ];
      const out: Record<string, any> = {};
      for (const path of candidates) {
        try {
          const res = await fetch(`${FMP_BASE}/${path}?symbol=KO&apikey=${key}`);
          const text = await res.text();
          out[path] = { status: res.status, body: redactKey(text).slice(0, 200) };
        } catch (e) {
          out[path] = { status: 0, body: String(e) };
        }
      }
      return new Response(JSON.stringify(out), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'quote') {
      // Check cache first — only rows fetched under the same plan.
      const { data: cached } = await sb
        .from('stock_cache')
        .select('ticker, quote_data, cached_at')
        .eq('source', source)
        .in('ticker', cleanTickers);

      const now = Date.now();
      const fresh: Record<string, any> = {};
      const stale: string[] = [];

      const quoteTtl = source === 'personal' ? CACHE_TTL_MS : COMMERCIAL_CACHE_TTL_MS;
      for (const ticker of cleanTickers) {
        const hit = cached?.find((c: any) => c.ticker === ticker);
        if (hit && hit.quote_data && (now - new Date(hit.cached_at).getTime()) < quoteTtl) {
          fresh[ticker] = hit.quote_data;
        } else {
          stale.push(ticker);
        }
      }

      // Neither plan supports combined quotes: fetch one ticker per request.
      // Personal uses the live /quote endpoint; Enterprise (once-a-day at market
      // close) uses /historical-price-eod/full for the close price and /profile
      // for the company name and market details.
      if (stale.length > 0) {
        const nowIso = new Date().toISOString();
        await Promise.all(
          stale.map(async (ticker: string) => {
            try {
              let quote: any = null;
              if (source === 'personal') {
                const res = await fetch(`${FMP_BASE}/quote?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`);
                const text = await res.text();
                let data: any = null;
                try { data = JSON.parse(text); } catch { /* non-JSON body */ }
                const q = Array.isArray(data) ? data[0] : data;
                if (!res.ok || !q?.symbol) {
                  console.error(
                    `FMP quote unusable for ${ticker} (${source}): status=${res.status} body=${redactKey(text).slice(0, 300)}`
                  );
                  return;
                }
                quote = q;
              } else {
                const [eodRes, profileRes] = await Promise.all([
                  fetch(`${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`),
                  fetch(`${FMP_BASE}/profile?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`),
                ]);
                const eodText = await eodRes.text();
                let eodData: any = null;
                try { eodData = JSON.parse(eodText); } catch { /* non-JSON body */ }
                const eod = Array.isArray(eodData) ? eodData[0] : eodData;
                if (!eodRes.ok || !eod?.symbol) {
                  console.error(
                    `FMP eod quote unusable for ${ticker} (${source}): status=${eodRes.status} body=${redactKey(eodText).slice(0, 300)}`
                  );
                  return;
                }
                let profile: any = null;
                if (profileRes.ok) {
                  const pd = await profileRes.json();
                  profile = Array.isArray(pd) ? pd[0] : pd;
                }
                // Shape the end-of-day record like a live quote so the rest of
                // the app doesn't care which plan answered.
                quote = {
                  symbol: eod.symbol,
                  name: profile?.companyName || eod.symbol,
                  price: eod.close,
                  change: eod.change,
                  changePercentage: eod.changePercent,
                  dayHigh: eod.high,
                  dayLow: eod.low,
                  open: eod.open,
                  volume: eod.volume,
                  marketCap: profile?.marketCap,
                  exchange: profile?.exchange,
                  eodDate: eod.date,
                };
              }
              fresh[ticker] = quote;
              await sb.from('stock_cache').upsert(
                { ticker, source, quote_data: quote, cached_at: nowIso },
                { onConflict: 'ticker,source' }
              );
            } catch (e) {
              console.error(`FMP quote error for ${ticker}:`, e);
            }
          })
        );
      }

      const allQuotes = cleanTickers.map((t) => fresh[t]).filter(Boolean);
      return new Response(JSON.stringify(allQuotes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-fmp-source': source },
      });
    }

    if (action === 'dividends') {
      // Check cache first — only rows fetched under the same plan.
      const { data: cached } = await sb
        .from('stock_cache')
        .select('ticker, dividends_data, cached_at, dividends_cached_at')
        .eq('source', source)
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
            const text = await res.text();
            let data: any = null;
            try { data = JSON.parse(text); } catch { /* non-JSON body */ }
            const historical = Array.isArray(data) ? data.slice(0, 20) : [];
            if (!res.ok || historical.length === 0) {
              console.error(
                `FMP dividends unusable for ${ticker} (${source}): status=${res.status} body=${redactKey(text).slice(0, 300)}`
              );
              results[ticker] = [];
              return;
            }
            results[ticker] = historical;
            // Upsert cache — refresh only the dividend timestamp so quote freshness is untouched
            await sb.from('stock_cache').upsert(
              { ticker, source, dividends_data: historical, dividends_cached_at: new Date().toISOString() },
              { onConflict: 'ticker,source' }
            );
          })
        );
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-fmp-source': source },
      });
    }

    if (action === 'search') {
      const rawQ = rawQuery || cleanTickers[0] || '';
      const sanitizedQ = rawQ.replace(/[^A-Za-z0-9.\-]/g, '').trim();

      async function runSearch(q: string) {
        if (!q) return [] as any[];
        console.log(`[search] querying FMP with q="${q}"`);
        // Enterprise key can't call /quote; /profile serves the same exact-match lookup.
        const exactPath = source === 'personal' ? 'quote' : 'profile';
        const [searchRes, nameRes, quoteRes] = await Promise.all([
          fetch(`${FMP_BASE}/search-symbol?query=${encodeURIComponent(q)}&apikey=${apiKey}`),
          fetch(`${FMP_BASE}/search-name?query=${encodeURIComponent(q)}&apikey=${apiKey}`),
          fetch(`${FMP_BASE}/${exactPath}?symbol=${encodeURIComponent(q)}&apikey=${apiKey}`),
        ]);
        console.log(`[search] status sym=${searchRes.status} name=${nameRes.status} exact=${quoteRes.status}`);
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-fmp-source': source },
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

