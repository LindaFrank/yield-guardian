import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.7-flash';
const MAX_IMAGES = 6;

const SYSTEM_PROMPT = `You read scanned brokerage statements and extract stock holdings.
Return ONLY a JSON object of the form:
{"holdings":[{"ticker":"AAPL","shares":60}]}
Rules:
- ticker: the exchange symbol in uppercase (1-5 letters, dots allowed). If the statement shows only a company name, infer the common US ticker; if you are unsure, omit the row.
- shares: the quantity/share count as a number. Omit the field if it is not legible.
- Skip cash, money market sweeps, options, bonds, totals and subtotals.
- NEVER include personal information (names, addresses, account numbers).
- If no holdings are legible, return {"holdings":[]}.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI is not configured for this project.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content: unknown[] = [
      { type: 'text', text: 'Extract every stock holding (ticker + share count) from these statement pages.' },
      ...images.slice(0, MAX_IMAGES).map((url: string) => ({ type: 'image_url', image_url: { url } })),
    ];

    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Gateway error', res.status, text);
      let message = 'Could not read this scanned statement. Please try again.';
      if (res.status === 429) message = 'Too many scans right now — please wait a moment and try again.';
      else if (res.status === 402) message = 'AI credits are exhausted for this workspace. Please add credits and try again.';
      else if (res.status === 403) message = 'AI access is blocked for this workspace.';
      return new Response(JSON.stringify({ error: message }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: { holdings?: { ticker?: string; shares?: number | string }[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const holdings = (parsed.holdings ?? [])
      .map((h) => {
        const ticker = String(h?.ticker ?? '').toUpperCase().replace(/[^A-Z.]/g, '');
        const sharesNum = typeof h?.shares === 'string' ? parseFloat(h.shares.replace(/[,\s]/g, '')) : h?.shares;
        const shares = typeof sharesNum === 'number' && isFinite(sharesNum) && sharesNum > 0 ? sharesNum : undefined;
        return { ticker, shares };
      })
      .filter((h) => h.ticker.length >= 1 && h.ticker.length <= 6);

    return new Response(JSON.stringify({ holdings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('parse-statement-ocr error', err);
    return new Response(JSON.stringify({ error: 'Failed to read this scanned file.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
