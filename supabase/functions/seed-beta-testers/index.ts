import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-time seeding function for beta testers. Guarded by ADMIN_SECRET_KEY.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    // One-shot seed function; will be deleted right after use.

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const testers = [
      { email: "david.foreman@morganstanley.com", password: "morganstanley", display_name: "David Foreman" },
      { email: "fk@rcdcpa.com", password: "rcdcpa", display_name: "Frank" },
    ];

    const results: Array<{ email: string; status: string; error?: string }> = [];
    for (const t of testers) {
      const { data, error } = await admin.auth.admin.createUser({
        email: t.email,
        password: t.password,
        email_confirm: true,
        user_metadata: { display_name: t.display_name },
      });
      if (error) {
        // If already exists, try to update password
        if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")) {
          const { data: list } = await admin.auth.admin.listUsers();
          const existing = list.users.find((u) => u.email?.toLowerCase() === t.email.toLowerCase());
          if (existing) {
            await admin.auth.admin.updateUserById(existing.id, { password: t.password, email_confirm: true });
            results.push({ email: t.email, status: "updated_password" });
            continue;
          }
        }
        results.push({ email: t.email, status: "error", error: error.message });
        continue;
      }
      if (data.user?.id) {
        await admin.from("profiles").update({ display_name: t.display_name }).eq("user_id", data.user.id);
      }
      results.push({ email: t.email, status: "created" });
    }
    return json({ results });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
