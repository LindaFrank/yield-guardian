import { Stock, Portfolio } from '@/types/portfolio';

// Generate historical dividends for a stock
const generateDividendHistory = (
  baseAmount: number,
  years: number,
  trend: 'stable' | 'growing' | 'declining' | 'volatile'
): { date: string; amount: number }[] => {
  const history: { date: string; amount: number }[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let y = 0; y < years; y++) {
    const year = currentYear - y;
    for (let q = 4; q >= 1; q--) {
      let amount = baseAmount;
      
      switch (trend) {
        case 'growing':
          amount = baseAmount * (1 + y * 0.03);
          break;
        case 'declining':
          amount = baseAmount * (1 - y * 0.05);
          break;
        case 'volatile':
          amount = baseAmount * (0.8 + Math.random() * 0.4);
          break;
        default:
          amount = baseAmount * (0.98 + Math.random() * 0.04);
      }
      
      const month = q * 3;
      history.push({
        date: `${year}-${month.toString().padStart(2, '0')}-15`,
        amount: Math.round(amount * 100) / 100,
      });
    }
  }
  
  return history;
};

export const mockStocks: Stock[] = [
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    currentPrice: 156.42,
    annualDividend: 4.96,
    dividendHistory: generateDividendHistory(1.24, 5, 'growing'),
    currentYield: 3.17,
  },
  {
    ticker: 'KO',
    name: 'Coca-Cola Company',
    sector: 'Consumer Staples',
    currentPrice: 62.18,
    annualDividend: 1.94,
    dividendHistory: generateDividendHistory(0.485, 5, 'stable'),
    currentYield: 3.12,
  },
  {
    ticker: 'ABBV',
    name: 'AbbVie Inc.',
    sector: 'Healthcare',
    currentPrice: 174.23,
    annualDividend: 6.20,
    dividendHistory: generateDividendHistory(1.55, 5, 'growing'),
    currentYield: 5.67,
  },
  {
    ticker: 'T',
    name: 'AT&T Inc.',
    sector: 'Telecom',
    currentPrice: 17.82,
    annualDividend: 1.11,
    dividendHistory: generateDividendHistory(0.28, 5, 'declining'),
    currentYield: 6.23,
  },
  {
    ticker: 'VZ',
    name: 'Verizon Communications',
    sector: 'Telecom',
    currentPrice: 42.15,
    annualDividend: 2.71,
    dividendHistory: generateDividendHistory(0.68, 5, 'stable'),
    currentYield: 6.43,
  },
  {
    ticker: 'XOM',
    name: 'Exxon Mobil',
    sector: 'Energy',
    currentPrice: 118.45,
    annualDividend: 3.96,
    dividendHistory: generateDividendHistory(0.99, 5, 'volatile'),
    currentYield: 3.34,
  },
  {
    ticker: 'PFE',
    name: 'Pfizer Inc.',
    sector: 'Healthcare',
    currentPrice: 28.73,
    annualDividend: 1.68,
    dividendHistory: generateDividendHistory(0.42, 5, 'declining'),
    currentYield: 5.85,
  },
  {
    ticker: 'O',
    name: 'Realty Income Corp',
    sector: 'Real Estate',
    currentPrice: 56.82,
    annualDividend: 3.08,
    dividendHistory: generateDividendHistory(0.257, 5, 'growing'),
    currentYield: 5.42,
  },
];

export const marketStocks: Stock[] = [
  ...mockStocks,
  {
    ticker: 'PG',
    name: 'Procter & Gamble',
    sector: 'Consumer Staples',
    currentPrice: 168.42,
    annualDividend: 4.03,
    dividendHistory: generateDividendHistory(1.0075, 5, 'growing'),
    currentYield: 2.39,
  },
  {
    ticker: 'MO',
    name: 'Altria Group',
    sector: 'Consumer Staples',
    currentPrice: 45.23,
    annualDividend: 4.08,
    dividendHistory: generateDividendHistory(1.02, 5, 'stable'),
    currentYield: 9.02,
  },
  {
    ticker: 'PM',
    name: 'Philip Morris International',
    sector: 'Consumer Staples',
    currentPrice: 118.75,
    annualDividend: 5.40,
    dividendHistory: generateDividendHistory(1.35, 5, 'growing'),
    currentYield: 4.55,
  },
  {
    ticker: 'IBM',
    name: 'IBM Corporation',
    sector: 'Technology',
    currentPrice: 193.42,
    annualDividend: 6.68,
    dividendHistory: generateDividendHistory(1.67, 5, 'stable'),
    currentYield: 3.45,
  },
  {
    ticker: 'CVX',
    name: 'Chevron Corporation',
    sector: 'Energy',
    currentPrice: 156.78,
    annualDividend: 6.52,
    dividendHistory: generateDividendHistory(1.63, 5, 'growing'),
    currentYield: 4.16,
  },
  {
    ticker: 'EPD',
    name: 'Enterprise Products',
    sector: 'Energy',
    currentPrice: 28.45,
    annualDividend: 2.10,
    dividendHistory: generateDividendHistory(0.525, 5, 'growing'),
    currentYield: 7.38,
  },
  {
    ticker: 'MAIN',
    name: 'Main Street Capital',
    sector: 'Financial',
    currentPrice: 52.18,
    annualDividend: 3.00,
    dividendHistory: generateDividendHistory(0.75, 5, 'stable'),
    currentYield: 5.75,
  },
];

export const defaultPortfolio: Portfolio = {
  stocks: mockStocks.slice(0, 6),
  targetMinYield: 5.0,
};
