export interface DividendPayment {
  date: string;
  amount: number;
}

export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number;
  annualDividend: number;
  dividendHistory: DividendPayment[];
  currentYield: number;
}

export interface Portfolio {
  stocks: Stock[];
  targetMinYield: number;
}

export type StabilityStatus = 'stable' | 'warning' | 'unstable';

export interface StockAnalysis {
  stock: Stock;
  currentYield: number;
  isStable: StabilityStatus;
  isUnderperforming: boolean;
  stabilityYears: number;
}

export interface ReplacementCandidate {
  stock: Stock;
  yield: number;
  stabilityScore: number;
  matchReason: string;
}
