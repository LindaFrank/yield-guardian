import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const key = Deno.env.get('FMP_ENTERPRISE_API_KEY');
  if (!url || !serviceKey || !key) return new Response('{}', { status: 500, headers });
  const sb = createClient(url, serviceKey);
  const { data, error } = await sb.auth.getUser((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  if (error || data.user?.email?.toLowerCase() !== 'lindafrank@aol.com') return new Response('{}', { status: 403, headers });
  const paths = ['eod-bulk?date=2026-10-29', 'eod-bulk?date=2026-10-28', 'profile-bulk?part=0', 'historical-price-eod/full?symbol=KO'];
  const results = [];
  for (const path of paths) {
    const res = await fetch(`https://financialmodelingprep.com/stable/${path}&apikey=${encodeURIComponent(key)}`);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = null; }
    results.push({ path, status: res.status, count: Array.isArray(body) ? body.length : 0,
      samples: Array.isArray(body) ? body.filter((r) => ['KO','PEP','T'].includes(r.symbol)).slice(0, 6) : [],
      fields: Array.isArray(body) && body[0] ? Object.keys(body[0]) : [], type: res.headers.get('content-type'), bytes: text.length,
      preview: text.slice(0, 400).replaceAll(key, '[redacted]') });
  }
  return new Response(JSON.stringify(results), { headers });
});