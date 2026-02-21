import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Stock, DividendPayment } from '@/types/portfolio';

interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number; // stable API field
  change: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  exchange: string;
}

interface FMPDividend {
  date: string;
  dividend: number;
  adjDividend: number;
}

async function callStockFunction(action: string, tickers: string[]) {
  const { data, error } = await supabase.functions.invoke('stock-data', {
    body: { action, tickers },
  });
  if (error) throw new Error(error.message);
  return data;
}

function mapQuoteAndDividends(
  quote: FMPQuote,
  dividends: FMPDividend[]
): Stock {
  const dividendHistory: DividendPayment[] = dividends.map((d) => ({
    date: d.date,
    amount: d.adjDividend ?? d.dividend,
  }));

  // Calculate annual dividend from recent 4 quarters
  const recentDivs = dividends.slice(0, 4);
  const annualDividend = recentDivs.reduce(
    (sum, d) => sum + (d.adjDividend ?? d.dividend),
    0
  );
  const currentYield = quote.price > 0 ? (annualDividend / quote.price) * 100 : 0;

  // Guess sector from exchange/name (FMP quote doesn't include sector in batch)
  return {
    ticker: quote.symbol,
    name: quote.name,
    sector: '', // will be enriched if needed
    currentPrice: quote.price,
    annualDividend,
    dividendHistory,
    currentYield: Math.round(currentYield * 100) / 100,
  };
}

export function useStockQuotes(tickers: string[]) {
  return useQuery({
    queryKey: ['stock-quotes', tickers.sort().join(',')],
    queryFn: async (): Promise<Stock[]> => {
      if (tickers.length === 0) return [];

      // Fetch quotes and dividends in parallel
      const [quotes, dividendsMap] = await Promise.all([
        callStockFunction('quote', tickers) as Promise<FMPQuote[]>,
        callStockFunction('dividends', tickers) as Promise<Record<string, FMPDividend[]>>,
      ]);

      return quotes.map((q) =>
        mapQuoteAndDividends(q, dividendsMap[q.symbol] || [])
      );
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchInterval: 5 * 60 * 1000,
    enabled: tickers.length > 0,
  });
}

export interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
}

export function useStockSearch(query: string) {
  return useQuery({
    queryKey: ['stock-search', query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 1) return [];
      const data = await callStockFunction('search', [query]);
      return data as SearchResult[];
    },
    enabled: query.length >= 1,
    staleTime: 30 * 1000,
  });
}
