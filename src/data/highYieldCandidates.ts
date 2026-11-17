/**
 * Well-known high-yield dividend stocks that "Stocks that meet Yield Target"
 * and the Alternatives checks look at, on top of the built-in market list.
 *
 * Being listed here does not mean a stock is shown. Each one appears only
 * while its real prices and dividends pass Yield Guardian's tests
 * (2-year stability, paid in the last 120 days, meets the yield target,
 * price under a week old, yield under 50%). One that cuts its dividend or
 * stops trading drops out by itself; no list edit is needed.
 */
export interface CandidateInfo {
  ticker: string;
  name: string;
  sector: string;
}

export const HIGH_YIELD_CANDIDATES: CandidateInfo[] = [
  // Mortgage & commercial REITs
  { ticker: 'NLY', name: 'Annaly Capital Management', sector: 'Real Estate' },
  { ticker: 'AGNC', name: 'AGNC Investment', sector: 'Real Estate' },
  { ticker: 'STWD', name: 'Starwood Property Trust', sector: 'Real Estate' },
  { ticker: 'RITM', name: 'Rithm Capital', sector: 'Real Estate' },
  // Equity REITs
  { ticker: 'OHI', name: 'Omega Healthcare Investors', sector: 'Real Estate' },
  { ticker: 'VICI', name: 'VICI Properties', sector: 'Real Estate' },
  { ticker: 'WPC', name: 'W. P. Carey', sector: 'Real Estate' },
  { ticker: 'EPR', name: 'EPR Properties', sector: 'Real Estate' },
  { ticker: 'NNN', name: 'NNN REIT', sector: 'Real Estate' },
  // Business development companies
  { ticker: 'BXSL', name: 'Blackstone Secured Lending', sector: 'Financials' },
  { ticker: 'OBDC', name: 'Blue Owl Capital Corp', sector: 'Financials' },
  { ticker: 'HTGC', name: 'Hercules Capital', sector: 'Financials' },
  { ticker: 'FSK', name: 'FS KKR Capital', sector: 'Financials' },
  { ticker: 'GBDC', name: 'Golub Capital BDC', sector: 'Financials' },
  // Asset managers
  { ticker: 'TROW', name: 'T. Rowe Price', sector: 'Financials' },
  { ticker: 'BEN', name: 'Franklin Resources', sector: 'Financials' },
  // Pipelines & midstream
  { ticker: 'KMI', name: 'Kinder Morgan', sector: 'Energy' },
  { ticker: 'OKE', name: 'ONEOK', sector: 'Energy' },
  { ticker: 'WMB', name: 'Williams Companies', sector: 'Energy' },
  { ticker: 'PAA', name: 'Plains All American', sector: 'Energy' },
  { ticker: 'WES', name: 'Western Midstream', sector: 'Energy' },
  { ticker: 'SUN', name: 'Sunoco LP', sector: 'Energy' },
  { ticker: 'CQP', name: 'Cheniere Energy Partners', sector: 'Energy' },
  // Health care, consumer, industrial
  { ticker: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Healthcare' },
  { ticker: 'KHC', name: 'Kraft Heinz', sector: 'Consumer Staples' },
  { ticker: 'CAG', name: 'Conagra Brands', sector: 'Consumer Staples' },
  { ticker: 'UPS', name: 'United Parcel Service', sector: 'Industrials' },
  { ticker: 'F', name: 'Ford Motor', sector: 'Consumer Discretionary' },
  { ticker: 'LYB', name: 'LyondellBasell', sector: 'Materials' },
  { ticker: 'DOW', name: 'Dow Inc.', sector: 'Materials' },
];

export const HIGH_YIELD_CANDIDATE_TICKERS = HIGH_YIELD_CANDIDATES.map((c) => c.ticker);
