import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const group = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `YG-${group(4)}-${group(4)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Missing auth token" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userData, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const callerId = userData.user.id;

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const action = (body as { action?: string }).action ?? "list_users";

    if (action === "list_users") {
      const users: Array<{ id: string; email: string | undefined; created_at: string; last_sign_in_at: string | null }> = [];
      let page = 1;
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
        if (error) throw error;
        for (const u of data.users) users.push({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at });
        if (data.users.length < 100) break;
        page++;
      }
      const { data: roles } = await admin.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: { user_id: string; role: string }) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      return json({ users: users.map((u) => ({ ...u, roles: roleMap.get(u.id) ?? [] })) });
    }

    if (action === "create_user") {
      const { email, password, display_name } = body as { email?: string; password?: string; display_name?: string };
      if (!email || !password) return json({ error: "email and password required" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: display_name ? { display_name } : undefined,
      });
      if (error) return json({ error: error.message }, 400);
      if (display_name && data.user) {
        await admin.from("profiles").update({ display_name }).eq("user_id", data.user.id);
      }
      return json({ user: { id: data.user?.id, email: data.user?.email } });
    }

    if (action === "send_reset") {
      const { email } = body as { email?: string };
      if (!email) return json({ error: "email required" }, 400);
      const redirectTo = (body as { redirect_to?: string }).redirect_to;
      const { error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "set_role") {
      const { user_id, role, grant } = body as { user_id?: string; role?: "admin" | "user"; grant?: boolean };
      if (!user_id || !role) return json({ error: "user_id and role required" }, 400);
      if (grant === false) {
        await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      } else {
        await admin.from("user_roles").insert({ user_id, role }).select();
      }
      return json({ success: true });
    }

    // ----- Invite code management -----
    if (action === "list_invite_codes") {
      const { data, error } = await admin
        .from("beta_invite_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ codes: data ?? [] });
    }

    if (action === "generate_invite_code") {
      const { max_uses, expires_at } = body as { max_uses?: number; expires_at?: string | null };
      let attempt = 0;
      while (attempt < 5) {
        const code = randomCode();
        const { data, error } = await admin
          .from("beta_invite_codes")
          .insert({
            code,
            max_uses: Math.max(1, Math.min(1000, Number(max_uses) || 1)),
            expires_at: expires_at ?? null,
            created_by: callerId,
          })
          .select()
          .maybeSingle();
        if (!error) return json({ code: data });
        attempt++;
      }
      return json({ error: "Could not generate a unique code" }, 500);
    }

    if (action === "revoke_invite_code") {
      const { id } = body as { id?: string };
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await admin.from("beta_invite_codes").update({ revoked: true }).eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "delete_invite_code") {
      const { id } = body as { id?: string };
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await admin.from("beta_invite_codes").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "set_require_invite_code") {
      const { value } = body as { value?: boolean };
      const { error } = await admin
        .from("app_settings")
        .upsert({ id: 1, require_invite_code: !!value, updated_at: new Date().toISOString() });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "set_payments_enabled") {
      const { value } = body as { value?: boolean };
      const { error } = await admin
        .from("app_settings")
        .upsert({ id: 1, payments_enabled: !!value, updated_at: new Date().toISOString() });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
