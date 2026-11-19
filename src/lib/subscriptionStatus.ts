/**
 * What the Profile page's Subscription card shows, and whether the Cancel button appears.
 * A canceled subscription keeps full access until the end of the period already paid for
 * (or the free month), and is never charged again.
 */
export interface SubscriptionRow {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

export type SubscriptionView =
  | { kind: 'none' }
  | { kind: 'active'; trialing: boolean; renewsOn: Date | null }
  | { kind: 'canceling'; trialing: boolean; accessUntil: Date | null };

const LIVE = ['active', 'trialing', 'past_due'];

export function describeSubscription(rows: SubscriptionRow[] | null | undefined, now: Date = new Date()): SubscriptionView {
  const live = (rows ?? []).filter(
    (r) => LIVE.includes(r.status) && (!r.current_period_end || new Date(r.current_period_end) > now),
  );
  const sub = live[0];
  if (!sub) return { kind: 'none' };
  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const trialing = sub.status === 'trialing';
  return sub.cancel_at_period_end
    ? { kind: 'canceling', trialing, accessUntil: end }
    : { kind: 'active', trialing, renewsOn: end };
}

/** The Cancel subscription button shows only for a subscription that will still renew. */
export function canCancel(view: SubscriptionView): boolean {
  return view.kind === 'active';
}

/** True once the member has agreed to this exact version of the Terms. */
export function hasAgreedToVersion(
  acceptedVersions: string[] | null | undefined,
  currentVersion: string,
): boolean {
  return !!acceptedVersions?.includes(currentVersion);
}
