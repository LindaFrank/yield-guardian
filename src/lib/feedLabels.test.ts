import { describe, expect, it } from 'vitest';
import { feedLabels } from './feedLabels';

const CLAIMS_LIVE = /live data|real-?time|every 5 ?min|5 min/i;

describe('commercial (public site) price-feed wording', () => {
  const labels = feedLabels('commercial');

  it('never claims live or 5-minute prices on the public feed', () => {
    for (const text of [
      labels.ready,
      labels.fetching,
      labels.waiting,
      labels.tooltip,
      labels.toastTitle,
      labels.toastDescription,
    ]) {
      expect(text).not.toMatch(CLAIMS_LIVE);
    }
  });

  it('says closing prices, updated once a day', () => {
    expect(labels.ready).toMatch(/closing prices/i);
    expect(labels.ready).toMatch(/once a day/i);
    expect(labels.tooltip).toMatch(/last completed trading day/i);
  });
});

describe('personal (Linda, inside the preview) price-feed wording', () => {
  const labels = feedLabels('personal');

  it('keeps the 5-minute live wording Linda uses', () => {
    expect(labels.ready).toBe('Live data · Refreshes every 5 min');
    expect(labels.toastDescription).toMatch(/every 5 min/);
  });
});

describe('unknown feed', () => {
  it('falls back to the public-site wording, never the live wording', () => {
    expect(feedLabels(null)).toBe(feedLabels('commercial'));
    expect(feedLabels(null).ready).not.toMatch(CLAIMS_LIVE);
  });
});
