import { describe, expect, it } from 'vitest';
import { BodySchema } from '../../supabase/functions/stock-data/request';

describe('stock-data request validation', () => {
  it('accepts the existing keep-alive request with an empty ticker array', () => {
    expect(BodySchema.safeParse({ action: 'ping', tickers: [] }).success).toBe(true);
    expect(BodySchema.safeParse({ action: 'ping' }).success).toBe(true);
  });

  for (const action of ['quote', 'dividends', 'search']) {
    it(`${action} requires tickers and accepts a valid request`, () => {
      expect(BodySchema.safeParse({ action, tickers: [] }).success).toBe(false);
      expect(BodySchema.safeParse({ action }).success).toBe(false);
      expect(BodySchema.safeParse({ action, tickers: ['KO'] }).success).toBe(true);
    });
  }

  it('retains the 100-ticker limit', () => {
    expect(BodySchema.safeParse({ action: 'quote', tickers: Array(100).fill('KO') }).success).toBe(true);
    expect(BodySchema.safeParse({ action: 'quote', tickers: Array(101).fill('KO') }).success).toBe(false);
  });

  it('rejects malformed requests', () => {
    for (const body of [null, { action: 'unknown' }, { action: 'quote', tickers: [''] }, { action: 'ping', tickers: 'KO' }]) {
      expect(BodySchema.safeParse(body).success).toBe(false);
    }
  });
});