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
    const body = await req.json().catch(() => ({}));
    const { code, consume } = body as { code?: unknown; consume?: unknown };
    if (!code || typeof code !== "string") return json({ valid: false, error: "Missing code" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Default is a non-destructive check. The code is only spent when
    // the caller explicitly asks for it (after a successful sign-up).
    const fn = consume === true ? "consume_invite_code" : "check_invite_code";
    const { data, error } = await admin.rpc(fn, { _code: code.trim() });
    if (error) return json({ valid: false, error: error.message }, 500);
    return json({ valid: !!data });
  } catch (e) {
    return json({ valid: false, error: (e as Error).message }, 500);
  }
});
