import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { code } = await req.json().catch(() => ({}));
    if (!code || typeof code !== "string") return json({ valid: false, error: "Missing code" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin.rpc("consume_invite_code", { _code: code.trim() });
    if (error) return json({ valid: false, error: error.message }, 500);
    return json({ valid: !!data });
  } catch (e) {
    return json({ valid: false, error: (e as Error).message }, 500);
  }
});
