// Lets a signed-in member cancel their own subscription (no further charges; access runs to the
// end of the paid period or free month) or undo a pending cancellation.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const BodySchema = z.object({ action: z.enum(["cancel", "resume"]) });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LIVE_STATUSES = ["active", "trialing", "past_due"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please sign in first." }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Please sign in first." }, 401);
  const userId = userData.user.id;

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { action } = parsed.data;

  const { data: subs, error: subErr } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, environment, status, cancel_at_period_end, current_period_end")
    .eq("user_id", userId)
    .in("status", LIVE_STATUSES)
    .order("updated_at", { ascending: false });
  if (subErr) return json({ error: "Could not look up your subscription." }, 500);
  const sub = subs?.[0];
  if (!sub) return json({ error: "There is no active subscription to change." }, 404);

  try {
    const stripe = createStripeClient(sub.environment as StripeEnv);
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: action === "cancel",
    });
    const item = updated.items?.data?.[0] as { current_period_end?: number } | undefined;
    const periodEnd = item?.current_period_end ?? (updated as unknown as { current_period_end?: number }).current_period_end;
    const endsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : sub.current_period_end;

    await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: updated.cancel_at_period_end ?? action === "cancel",
        status: updated.status,
        current_period_end: endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    return json({ ok: true, cancelAtPeriodEnd: updated.cancel_at_period_end, accessUntil: endsAt });
  } catch (error) {
    console.error("manage-subscription error:", error);
    return json({ error: "The payment service could not be reached. Please try again, or email linda@guardianyield.com." }, 502);
  }
});
