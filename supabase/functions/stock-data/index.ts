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

    // Sanitize tickers
    const cleanTickers = tickers
      .map((t: string) => t.toUpperCase().replace(/[^A-Z0-9.-]/g, ''))
      .slice(0, 20);

    if (action === 'quote') {
      // Batch all tickers in a single request using comma-separated symbols
      const symbols = cleanTickers.join(',');
      const res = await fetch(`${FMP_BASE}/quote?symbol=${symbols}&apikey=${apiKey}`);
      if (!res.ok) {
        console.error(`FMP batch quote failed: ${res.status}`);
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const data = await res.json();
      const quotes = Array.isArray(data) ? data : [data];
      return new Response(JSON.stringify(quotes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dividends') {
      // Batch all tickers in a single request
      const symbols = cleanTickers.join(',');
      const res = await fetch(`${FMP_BASE}/dividends?symbol=${symbols}&apikey=${apiKey}`);
      const results: Record<string, any[]> = {};
      if (res.ok) {
        const data = await res.json();
        const allDivs = Array.isArray(data) ? data : [];
        // Group dividends by symbol
        for (const div of allDivs) {
          const sym = div.symbol || div.ticker;
          if (sym) {
            if (!results[sym]) results[sym] = [];
            if (results[sym].length < 20) results[sym].push(div);
          }
        }
      }
      // Ensure every requested ticker has an entry
      for (const t of cleanTickers) {
        if (!results[t]) results[t] = [];
      }
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search') {
      const query = cleanTickers[0]; // use first element as search query
      const res = await fetch(
        `${FMP_BASE}/search-symbol?query=${encodeURIComponent(query)}&limit=10&apikey=${apiKey}`
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
