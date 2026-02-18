import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// FMP v3 is available on the free tier
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

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
      // v3 batch quote: /api/v3/quote/AAPL,MSFT,GOOG
      const symbols = cleanTickers.join(',');
      const res = await fetch(`${FMP_BASE}/quote/${symbols}?apikey=${apiKey}`);
      if (!res.ok) {
        console.error(`FMP v3 batch quote failed: ${res.status} ${await res.text()}`);
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
      // v3 dividend history is per-ticker: /api/v3/historical-price-full/stock_dividend/AAPL
      const results: Record<string, any[]> = {};
      await Promise.all(
        cleanTickers.map(async (ticker: string) => {
          const res = await fetch(
            `${FMP_BASE}/historical-price-full/stock_dividend/${ticker}?apikey=${apiKey}`
          );
          if (res.ok) {
            const data = await res.json();
            // v3 returns { symbol, historical: [...] }
            const historical = Array.isArray(data?.historical) ? data.historical : [];
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
      const res = await fetch(
        `${FMP_BASE}/search?query=${encodeURIComponent(query)}&limit=10&apikey=${apiKey}`
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
