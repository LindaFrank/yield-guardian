import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import Papa from 'npm:papaparse@5.7.0';
import { z } from 'npm:zod@3.25.76';
import { completedSessionDate, decodeEod, latestCompletedEod, type EodRow } from './eod.ts';

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
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Price service is not configured');
  return createClient(
    url,
    key
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
  return 'commercial';
}

async function bulkEod(sb: ReturnType<typeof getServiceClient>, apiKey: string, date: string): Promise<Record<string, EodRow>> {
  const { data: snapshot, error } = await sb.from('fmp_eod_snapshot').select('market_date, prices').eq('id', 'commercial').maybeSingle();
  if (error) throw new Error('Cannot read shared closing-price snapshot');
  if (snapshot?.market_date === date) return snapshot.prices as Record<string, EodRow>;
  const { data: claimed, error: claimError } = await sb.rpc('claim_fmp_eod_download');
  if (claimError) throw new Error('Cannot claim closing-price download');
  if (!claimed) {
    console.log(`[eod-bulk] retry deferred date=${date}`);
    return {};
  }
  try {
    const response = await fetch(`${FMP_BASE}/eod-bulk?date=${date}&apikey=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) {
      console.warn(`[eod-bulk] unavailable status=${response.status} date=${date}; using per-ticker fallback`);
      return {};
    }
    const prices = decodeEod(await response.text(), date, (text) =>
      Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true }).data);
    if (!Object.keys(prices).length) return {};
    const { error: saveError } = await sb.from('fmp_eod_snapshot').update({ market_date: date, prices, updated_at: new Date().toISOString() }).eq('id', 'commercial');
    if (saveError) throw new Error('Cannot save shared closing prices');
    console.log(`[eod-bulk] saved date=${date} symbols=${Object.keys(prices).length}`);
    return prices;
  } catch (error) {
    console.warn(`[eod-bulk] download failed: ${redactKey(String(error))}`);
    return {};
  }
}

const BodySchema = z.object({
  action: z.enum(['ping', 'quote', 'dividends', 'search']),
  tickers: z.array(z.string().min(1).max(100)).min(1).max(100).optional(),
}).refine((body) => body.action === 'ping' || Boolean(body.tickers?.length), { message: 'tickers array required' });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid price request' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    const { action, tickers } = parsed.data;

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

    if (action === 'quote') {
      // Check cache first — only rows fetched under the same plan.
      const { data: cached } = await sb
        .from('stock_cache')
        .select('ticker, quote_data, cached_at')
        .eq('source', source)
        .in('ticker', cleanTickers);

      const now = Date.now();
      const completedDate = completedSessionDate(new Date(now));
      const fresh: Record<string, any> = {};
      const stale: string[] = [];

      const quoteTtl = source === 'personal' ? CACHE_TTL_MS : COMMERCIAL_CACHE_TTL_MS;
      for (const ticker of cleanTickers) {
        const hit = cached?.find((c: any) => c.ticker === ticker);
        if (hit && hit.quote_data && (now - new Date(hit.cached_at).getTime()) < quoteTtl &&
          (source === 'personal' || hit.quote_data.eodDate === completedDate)) {
          fresh[ticker] = hit.quote_data;
        } else {
          stale.push(ticker);
        }
      }

      // Only Enterprise uses the date-wide bulk EOD download. Personal remains per ticker.
      const bulk = source === 'commercial' && stale.length ? await bulkEod(sb, apiKey, completedDate) : {};
      let bulkHits = 0;
      let fallbackHits = 0;
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
                let eod = bulk[ticker];
                if (eod) bulkHits++;
                else {
                  fallbackHits++;
                  const res = await fetch(`${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(ticker)}&to=${completedDate}&apikey=${apiKey}`);
                  const rows = res.ok ? await res.json() : [];
                  const completed = latestCompletedEod(Array.isArray(rows) ? rows : [], completedDate);
                  if (!completed) return;
                  eod = completed;
                }
                // Reuse saved company details; never use the profile's live price.
                let profile: any = cached?.find((c: any) => c.ticker === ticker)?.quote_data;
                if (!profile?.name || profile.name === ticker) {
                  const profileRes = await fetch(`${FMP_BASE}/profile?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`);
                  if (profileRes.ok) {
                    const pd = await profileRes.json();
                    profile = Array.isArray(pd) ? pd[0] : pd;
                  }
                }
                // Shape the end-of-day record like a live quote so the rest of
                // the app doesn't care which plan answered.
                quote = {
                  symbol: eod.symbol,
                  name: profile?.companyName || profile?.name || eod.symbol,
                  price: eod.close,
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
      if (source === 'commercial') console.log(`[eod-bulk] requested=${stale.length} bulk=${bulkHits} fallback=${fallbackHits}`);
      return new Response(JSON.stringify(allQuotes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-fmp-source': source,
          'x-eod-bulk-count': String(bulkHits), 'x-eod-fallback-count': String(fallbackHits) },
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
            // /quote returns name; /profile returns companyName + exchangeShortName
            const entry = {
              symbol: quote.symbol,
              name: quote.name || quote.companyName,
              currency: 'USD',
              stockExchange: quote.exchange || quote.exchangeShortName,
              exchange: quote.exchange || quote.exchangeShortName,
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

