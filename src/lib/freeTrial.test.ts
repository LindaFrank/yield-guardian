import { describe, it, expect } from 'vitest';
import {
  isNoCardPeriod,
  trialStatus,
  trialEndFrom,
  trialGivesAccess,
  ensureGuestTrialStart,
  getGuestTrialStart,
} from './freeTrial';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('no-card free months end February 1, 2027 (Pacific)', () => {
  it('needs no card for a month started January 31 at 11:59pm Pacific', () => {
    expect(isNoCardPeriod(new Date('2027-01-31T23:59:00-08:00'))).toBe(true);
  });
  it('needs a card for a month started February 1 at midnight Pacific', () => {
    expect(isNoCardPeriod(new Date('2027-02-01T00:00:00-08:00'))).toBe(false);
  });
});

describe('the free month lasts 30 days', () => {
  it('ends 30 days after it starts', () => {
    expect(trialEndFrom(new Date('2026-11-18T12:00:00Z')).toISOString()).toBe('2026-12-18T12:00:00.000Z');
  });
  it('still gives full access on day 29', () => {
    const s = trialStatus('2026-12-18T12:00:00Z', new Date('2026-12-17T13:00:00Z'));
    expect(trialGivesAccess(s)).toBe(true);
  });
  it('stops giving access once the 30 days are up', () => {
    const s = trialStatus('2026-12-18T12:00:00Z', new Date('2026-12-18T12:00:01Z'));
    expect(s.state).toBe('ended');
    expect(trialGivesAccess(s)).toBe(false);
  });
});

describe('the ending-soon notice shows in the last 3 days', () => {
  it('shows with 3 days left', () => {
    expect(trialStatus('2026-12-18T12:00:00Z', new Date('2026-12-15T12:00:00Z')).state).toBe('ending-soon');
  });
  it('does not show with 4 days left', () => {
    expect(trialStatus('2026-12-18T12:00:00Z', new Date('2026-12-14T12:00:00Z')).state).toBe('active');
  });
});

describe("a guest's free month", () => {
  it('starts on the first visit before February 1 and is kept after that', () => {
    const store = memoryStorage();
    const first = ensureGuestTrialStart(new Date('2026-11-18T12:00:00Z'), store);
    const later = ensureGuestTrialStart(new Date('2026-11-25T12:00:00Z'), store);
    expect(first?.toISOString()).toBe('2026-11-18T12:00:00.000Z');
    expect(later?.toISOString()).toBe('2026-11-18T12:00:00.000Z');
  });
  it('does not start without a card on or after February 1', () => {
    const store = memoryStorage();
    expect(ensureGuestTrialStart(new Date('2027-02-02T12:00:00Z'), store)).toBeNull();
    expect(getGuestTrialStart(store)).toBeNull();
  });
  it('keeps its full month when it began before February 1', () => {
    const store = memoryStorage();
    const start = ensureGuestTrialStart(new Date('2027-01-30T12:00:00Z'), store)!;
    const s = trialStatus(trialEndFrom(start), new Date('2027-02-20T12:00:00Z'));
    expect(trialGivesAccess(s)).toBe(true);
  });
});
