import { describe, expect, it } from 'vitest';
import { canCancel, describeSubscription, hasAgreedToVersion } from './subscriptionStatus';

const now = new Date('2026-11-18T12:00:00Z');
const future = '2026-12-18T12:00:00Z';

describe('Cancel subscription button', () => {
  it('shows for a subscription that will renew', () => {
    const v = describeSubscription([{ status: 'active', current_period_end: future, cancel_at_period_end: false }], now);
    expect(v.kind).toBe('active');
    expect(canCancel(v)).toBe(true);
  });

  it('shows during a free month that will turn into a paid subscription', () => {
    const v = describeSubscription([{ status: 'trialing', current_period_end: future, cancel_at_period_end: false }], now);
    expect(canCancel(v)).toBe(true);
  });

  it('is replaced by "access until" once canceled, keeping access to the end of the paid period', () => {
    const v = describeSubscription([{ status: 'active', current_period_end: future, cancel_at_period_end: true }], now);
    expect(v).toEqual({ kind: 'canceling', trialing: false, accessUntil: new Date(future) });
    expect(canCancel(v)).toBe(false);
  });

  it('does not show when there is no subscription or it has already ended', () => {
    expect(canCancel(describeSubscription([], now))).toBe(false);
    expect(canCancel(describeSubscription([{ status: 'canceled', current_period_end: future, cancel_at_period_end: true }], now))).toBe(false);
    expect(canCancel(describeSubscription([{ status: 'active', current_period_end: '2026-11-01T00:00:00Z', cancel_at_period_end: false }], now))).toBe(false);
  });
});

describe('Agreeing to the current Terms', () => {
  it('asks again when only an earlier version was agreed to', () => {
    expect(hasAgreedToVersion(['2026-06-01'], '2026-11-18')).toBe(false);
    expect(hasAgreedToVersion([], '2026-11-18')).toBe(false);
  });
  it('does not ask again once the current version is agreed to', () => {
    expect(hasAgreedToVersion(['2026-06-01', '2026-11-18'], '2026-11-18')).toBe(true);
  });
});
