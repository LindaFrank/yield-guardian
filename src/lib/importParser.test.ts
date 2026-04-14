import { describe, expect, it } from 'vitest';

import { parseTextLines } from '@/lib/importParser';

describe('parseTextLines', () => {
  it('filters brokerage statement noise in pdf imports', () => {
    const text = `
Positions - Summary
Beginning Value
as of 01/01 + Transfer of
Securities(In/Out) + Dividends
Reinvested + Cash Activity + Change in
Market Value = Ending Value
as of 01/31 Cost Basis
Unrealized
Gain/(Loss)
OF
MINDI
ONE
ID
AS
YOUR
VTEB VANGUARD TAX-EXEMPT BOND ETF 4.0000 49.1200 196.48 190.20 6.28 3.42% 4.11 <1%
FNDX SCHWAB FUNDAMENTAL US LARGE COMPANY ETF 6.0000 27.24000 163.44 131.29 32.15 1.18% 1.93 <1%
FNDA SCHWAB FUNDAMENTAL US SMALL COMPANY ETF 4.0000 30.04000 120.16 94.12 26.04 1.73% 2.08 <1%
EBND SPDR BLOOMBG EMG MRKT LOCAL BOND ETF 8.0000 21.66000 173.28 156.70 16.58 6.32% 10.96 <1%
GAIN
ST
SCHH SCHWAB US REIT ETF 4.0000 26.62000 106.48 103.36 3.12 6.67% 7.11 <1%
SCHE SCHWAB EMERGING MARKETS ETF 4.0000 25.44000 101.76 77.93 23.83 5.32% 5.42 <1%
FNDF SCHWAB INTERNATIONAL DIVIDEND EQUITY ETF 4.0000 25.44000 101.76 77.93 23.83 5.32% 5.42 <1%
`;

    const rows = parseTextLines(text, { source: 'pdf' });

    expect(rows.map((row) => row.ticker)).toEqual([
      'VTEB',
      'FNDX',
      'FNDA',
      'EBND',
      'SCHH',
      'SCHE',
      'FNDF',
    ]);
  });

  it('keeps plain text imports working for simple ticker lists', () => {
    const rows = parseTextLines('AAPL\nMSFT, 12\nVTEB 4');

    expect(rows).toEqual([
      { ticker: 'AAPL', shares: undefined, raw: 'AAPL' },
      { ticker: 'MSFT', shares: 12, raw: 'MSFT, 12' },
      { ticker: 'VTEB', shares: 4, raw: 'VTEB 4' },
    ]);
  });

  it('still allows known standalone symbols in pdf imports but rejects stray words', () => {
    const rows = parseTextLines('MINDI\nYOUR\nAAPL\nMSFT 5', { source: 'pdf' });

    expect(rows).toEqual([
      { ticker: 'AAPL', shares: undefined, raw: 'AAPL' },
      { ticker: 'MSFT', shares: 5, raw: 'MSFT 5' },
    ]);
  });
});