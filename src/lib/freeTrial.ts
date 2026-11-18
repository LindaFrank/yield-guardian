/**
 * Free-month rules. The same numbers are repeated in the database's
 * start_free_trial function and the create-checkout function — change all three together.
 */

/** Length of the free month, in days. */
export const FREE_TRIAL_DAYS = 30;

/** Card-free months can be started only before this moment (Feb 1, 2027, Pacific time). */
export const NO_CARD_CUTOFF = new Date('2027-02-01T00:00:00-08:00');

/** The "your free month ends soon" notice appears this many days before the end. */
export const TRIAL_REMINDER_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const GUEST_TRIAL_KEY = 'yg-free-month-started';

export type TrialState = 'none' | 'active' | 'ending-soon' | 'ended';

export interface TrialStatus {
  state: TrialState;
  endsAt: Date | null;
  /** Whole days left, rounded up (0 once ended). */
  daysLeft: number;
}

/** True while new free months need no card. */
export function isNoCardPeriod(now: Date = new Date()): boolean {
  return now.getTime() < NO_CARD_CUTOFF.getTime();
}

export function trialEndFrom(start: Date): Date {
  return new Date(start.getTime() + FREE_TRIAL_DAYS * DAY_MS);
}

export function trialStatus(endsAt: Date | string | null | undefined, now: Date = new Date()): TrialStatus {
  if (!endsAt) return { state: 'none', endsAt: null, daysLeft: 0 };
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  if (Number.isNaN(end.getTime())) return { state: 'none', endsAt: null, daysLeft: 0 };
  const msLeft = end.getTime() - now.getTime();
  if (msLeft <= 0) return { state: 'ended', endsAt: end, daysLeft: 0 };
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  return {
    state: msLeft <= TRIAL_REMINDER_DAYS * DAY_MS ? 'ending-soon' : 'active',
    endsAt: end,
    daysLeft,
  };
}

/** Full access is open while the free month is running. */
export function trialGivesAccess(status: TrialStatus): boolean {
  return status.state === 'active' || status.state === 'ending-soon';
}

/** When this browser's guest free month began, if it has. */
export function getGuestTrialStart(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): Date | null {
  try {
    const raw = storage?.getItem(GUEST_TRIAL_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Starts this browser's guest free month the first time it's needed.
 * Returns the start date, or null when no card-free month can start any more.
 */
export function ensureGuestTrialStart(
  now: Date = new Date(),
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = safeStorage(),
): Date | null {
  const existing = getGuestTrialStart(storage);
  if (existing) return existing;
  if (!isNoCardPeriod(now)) return null;
  try {
    storage?.setItem(GUEST_TRIAL_KEY, now.toISOString());
  } catch {
    // storage blocked — the month still applies for this visit
  }
  return now;
}

export function formatTrialEnd(end: Date): string {
  return end.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Wording for the notice shown near the end of the free month. */
export function trialEndingMessage(status: TrialStatus, now: Date = new Date()): string {
  if (!status.endsAt) return '';
  if (status.state === 'ended') return 'Your free month has ended.';
  const sameDay = status.endsAt.toDateString() === now.toDateString();
  const tomorrow = new Date(now.getTime() + DAY_MS).toDateString() === status.endsAt.toDateString();
  const when = sameDay ? 'today' : tomorrow ? 'tomorrow' : formatTrialEnd(status.endsAt);
  return `Your free month ends ${when}`;
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Rows from the subscriptions table that still grant access. */
export function hasActiveSubscription(
  rows: Array<{ status: string; current_period_end: string | null; cancel_at_period_end: boolean | null }> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!rows || rows.length === 0) return false;
  const nowIso = now.toISOString();
  return rows.some((sub) => {
    if (sub.status === 'active' || sub.status === 'trialing') {
      return !sub.current_period_end || sub.current_period_end > nowIso;
    }
    if (sub.status === 'canceled') {
      return !!sub.current_period_end && sub.current_period_end > nowIso && !sub.cancel_at_period_end;
    }
    return false;
  });
}
