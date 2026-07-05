import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const email = "mindi@guardianyield.com";
  const password = "1L0v3Cassie!";

  // Find existing
  let existing = null;
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    existing = data.users.find((u) => u.email?.toLowerCase() === email);
    if (existing || data.users.length < 100) break;
    page++;
  }

  let userId: string;
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    userId = existing.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { display_name: "Mindi" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    userId = data.user!.id;
  }

  await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
  await admin.from("profiles").update({ display_name: "Mindi" }).eq("user_id", userId);

  return new Response(JSON.stringify({ ok: true, user_id: userId }), {
    headers: { "Content-Type": "application/json" },
  });
});
