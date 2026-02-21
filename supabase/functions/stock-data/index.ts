import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';

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

    if (action === 'quote') {
      // Stable API: fetch each ticker individually, then combine
      const allQuotes: any[] = [];
      await Promise.all(
        cleanTickers.map(async (ticker: string) => {
          const url = `${FMP_BASE}/quote?symbol=${ticker}&apikey=${apiKey}`;
          console.log(`Fetching quote: ${url.replace(apiKey, '***')}`);
          const res = await fetch(url);
          if (!res.ok) {
            const body = await res.text();
            console.error(`FMP quote failed for ${ticker}: ${res.status} ${body}`);
            return;
          }
          const data = await res.json();
          if (Array.isArray(data)) {
            allQuotes.push(...data);
          } else if (data && typeof data === 'object') {
            allQuotes.push(data);
          }
        })
      );
      return new Response(JSON.stringify(allQuotes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dividends') {
      // Stable API: /stable/dividends?symbol=AAPL
      const results: Record<string, any[]> = {};
      await Promise.all(
        cleanTickers.map(async (ticker: string) => {
          const res = await fetch(
            `${FMP_BASE}/dividends?symbol=${ticker}&apikey=${apiKey}`
          );
          if (res.ok) {
            const data = await res.json();
            const historical = Array.isArray(data) ? data : [];
            results[ticker] = historical.slice(0, 20);
          } else {
            results[ticker] = [];
          }
        })
      );
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search') {
      const query = cleanTickers[0];
      // Stable API: /stable/search-symbol?query=AAPL
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
