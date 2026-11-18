import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BodySchema = z.object({
  priceId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  quantity: z.number().int().min(1).max(1).default(1),
  customerEmail: z.string().email().optional(),
  userId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  returnUrl: z.string().min(1),
  environment: z.enum(["sandbox", "live"]),
});

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

// Free-month rules — keep in step with src/lib/freeTrial.ts and the start_free_trial database function.
const FREE_TRIAL_DAYS = 30;
const MIN_DEFERRAL_MS = 2 * 24 * 60 * 60 * 1000; // Stripe needs a trial end at least 2 days out

/**
 * Decides the free month a subscription checkout carries:
 * - never subscribed and no free month yet (card-up-front period) → 30-day trial on the card
 * - still inside a card-free month → first charge waits until that month ends
 * - otherwise → charged now
 */
async function freeMonthForCheckout(userId: string): Promise<{ trial_period_days?: number; trial_end?: number }> {
  const [trialRes, subRes] = await Promise.all([
    supabase.from("free_trials").select("ends_at").eq("user_id", userId).maybeSingle(),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if (trialRes.error || subRes.error) return {};
  if ((subRes.count ?? 0) > 0) return {};
  if (!trialRes.data) return { trial_period_days: FREE_TRIAL_DAYS };
  const endsAt = new Date(trialRes.data.ends_at).getTime();
  if (endsAt - Date.now() > MIN_DEFERRAL_MS) return { trial_end: Math.floor(endsAt / 1000) };
  return {};
}

async function createCheckoutSession(options: {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const customerId = (options.customerEmail || options.userId)
    ? await resolveOrCreateCustomer(stripe, {
        email: options.customerEmail,
        userId: options.userId,
      })
    : undefined;

  const trial = isRecurring && options.userId ? await freeMonthForCheckout(options.userId) : {};

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: options.quantity || 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: options.returnUrl,
    managed_payments: { enabled: true },
    ...(customerId && { customer: customerId }),
    ...(options.userId && {
      metadata: { userId: options.userId },
      ...(isRecurring && { subscription_data: { metadata: { userId: options.userId }, ...trial } }),
    }),
  } as Stripe.Checkout.SessionCreateParams);

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientSecret = await createCheckoutSession(parsed.data);
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
