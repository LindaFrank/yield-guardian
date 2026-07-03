import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { email, password } = await req.json();
  let page = 1, u = null;
  while (!u) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u || data.users.length < 100) break;
    page++;
  }
  if (!u) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: corsHeaders });
  const { error } = await admin.auth.admin.updateUserById(u.id, { password });
  return new Response(JSON.stringify({ success: !error, error: error?.message, email: u.email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
