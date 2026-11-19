import { describe, expect, it } from 'vitest';
import { disclosuresTitle, sections } from './termsContent';
import { FREE_TRIAL_DAYS, NO_CARD_CUTOFF, TRIAL_REMINDER_DAYS } from '@/lib/freeTrial';

const freeMonth = sections.find((s) => s.title.includes('Free Month'));
const text = freeMonth?.paragraphs.join(' ') ?? '';

describe('Terms free month section', () => {
  it('sits as section 13, right after 12. User Responsibility, with the disclosures renumbered to 14', () => {
    const titles = sections.map((s) => s.title);
    expect(titles.indexOf('13. Free Month and Subscriptions')).toBe(titles.indexOf('12. User Responsibility') + 1);
    expect(disclosuresTitle).toBe('14. Short In-App Disclosures');
  });

  it('states the same free month length the app uses (30 days)', () => {
    expect(FREE_TRIAL_DAYS).toBe(30);
    expect(text).toContain(`${FREE_TRIAL_DAYS} days`);
  });

  it('states the same no-card cutoff the app uses (February 1, 2027)', () => {
    const cutoff = NO_CARD_CUTOFF.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
    expect(cutoff).toBe('February 1, 2027');
    expect(text).toContain(`started before ${cutoff}`);
  });

  it('states the same reminder window the app uses (last 3 days)', () => {
    expect(text).toContain(`last ${TRIAL_REMINDER_DAYS} days`);
  });

  it('states the $29.95 monthly price', () => {
    expect(text).toContain('$29.95 per month');
  });
});
