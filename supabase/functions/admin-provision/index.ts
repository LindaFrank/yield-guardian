import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const u = list.users.find((x) => x.email?.toLowerCase() === 'mindi.briese@gmail.com')
  if (!u) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  const { error } = await admin.auth.admin.updateUserById(u.id, { password: '1l0v3Cassie!' })
  return new Response(JSON.stringify({ ok: !error, error: error?.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
