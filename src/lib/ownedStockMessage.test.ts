import { describe, expect, it } from 'vitest';
import { ownedStocksMessage } from './ownedStockMessage';

describe('ownedStocksMessage', () => {
  it('names a single already-owned stock', () => {
    expect(ownedStocksMessage(['ARCC'])).toBe('ARCC is already in your portfolio.');
  });

  it('uppercases the ticker it names', () => {
    expect(ownedStocksMessage(['arcc'])).toBe('ARCC is already in your portfolio.');
  });

  it('uses "and" for two stocks', () => {
    expect(ownedStocksMessage(['ARCC', 'NLY'])).toBe(
      'ARCC and NLY are already in your portfolio.'
    );
  });

  it('collapses long lists instead of dumping every ticker', () => {
    expect(ownedStocksMessage(['A', 'B', 'C', 'D', 'E'])).toBe(
      'A, B, C and 2 more are already in your portfolio.'
    );
  });

  it('returns nothing when nothing matched', () => {
    expect(ownedStocksMessage([])).toBe('');
  });
});
