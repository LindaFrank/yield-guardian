import { useState, useMemo, useEffect, useRef } from 'react';
import { Stock } from '@/types/portfolio';
import { marketStocks as mockMarketStocks } from '@/data/mockData';
import { 
  analyzeStock, 
  scanPortfolioForUnderperformers, 
  suggestReplacements 
} from '@/lib/portfolioUtils';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { YieldTargetSlider } from '@/components/YieldTargetSlider';
import { StockCard } from '@/components/StockCard';
import { UnderperformersList } from '@/components/UnderperformersList';
import { ReplacementSuggestions } from '@/components/ReplacementSuggestions';
import { AddStockModal } from '@/components/AddStockModal';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useStockQuotes } from '@/hooks/useStockData';
import { useUserTickers, useAddTicker, useRemoveTicker } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_TICKERS = ['JNJ', 'KO', 'ABBV', 'T', 'VZ', 'XOM'];

const Index = () => {
  const { user } = useAuth();
  const { data: savedTickers, isLoading: tickersLoading } = useUserTickers();
  const addTicker = useAddTicker();
  const removeTicker = useRemoveTicker();

  // Use saved tickers if logged in and loaded, otherwise defaults
  const tickers = useMemo(() => {
    if (!user) return DEFAULT_TICKERS;
    if (tickersLoading) return [];
    return savedTickers && savedTickers.length > 0 ? savedTickers : DEFAULT_TICKERS;
  }, [user, tickersLoading, savedTickers]);

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [targetYield, setTargetYield] = useState(5.0);
  const [selectedUnderperformer, setSelectedUnderperformer] = useState<Stock | null>(null);
  const { toast } = useToast();

  // Fetch live data for portfolio tickers
  const { data: liveStocks, isLoading, error } = useStockQuotes(tickers);

  // Update stocks when live data arrives
  useEffect(() => {
    if (liveStocks && liveStocks.length > 0) {
      const merged = liveStocks.map((live) => {
        const mock = mockMarketStocks.find((m) => m.ticker === live.ticker);
        return {
          ...live,
          sector: live.sector || mock?.sector || 'Unknown',
        };
      });
      setStocks(merged);
    }
  }, [liveStocks]);

  // Track whether we've already notified the user that the feed went live
  const feedNotifiedRef = useRef(false);

  useEffect(() => {
    if (
      !feedNotifiedRef.current &&
      liveStocks &&
      liveStocks.length > 0 &&
      liveStocks.some((s) => s.currentPrice > 0)
    ) {
      feedNotifiedRef.current = true;
      toast({
        title: '📡 Live feed active!',
        description: 'Real-time quotes from FMP are now flowing. Data refreshes every 5 min.',
      });
    }
  }, [liveStocks]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Live data unavailable',
        description: 'Using cached data. Will retry automatically.',
        variant: 'destructive',
      });
    }
  }, [error]);

  const stockAnalyses = useMemo(
    () => stocks.map((stock) => analyzeStock(stock, targetYield)),
    [stocks, targetYield]
  );

  const underperformers = useMemo(
    () => scanPortfolioForUnderperformers(stocks, targetYield),
    [stocks, targetYield]
  );

  const replacements = useMemo(() => {
    if (!selectedUnderperformer) return [];
    return suggestReplacements(
      selectedUnderperformer,
      mockMarketStocks,
      targetYield,
      stocks.map((s) => s.ticker)
    );
  }, [selectedUnderperformer, stocks, targetYield]);

  const handleRemoveStock = (ticker: string) => {
    setStocks((prev) => prev.filter((s) => s.ticker !== ticker));
    if (selectedUnderperformer?.ticker === ticker) {
      setSelectedUnderperformer(null);
    }
    if (user) {
      removeTicker.mutate(ticker);
    }
  };

  const handleAddStock = (stock: Stock) => {
    if (!stocks.find((s) => s.ticker === stock.ticker)) {
      setStocks((prev) => [...prev, stock]);
      if (user) {
        addTicker.mutate(stock.ticker);
      }
    }
  };

  const handleSelectUnderperformer = (stock: Stock) => {
    setSelectedUnderperformer(
      selectedUnderperformer?.ticker === stock.ticker ? null : stock
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Live Data Status */}
        {(isLoading || tickersLoading) && (
          <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Fetching live market data…
          </div>
        )}
        {!isLoading && !tickersLoading && liveStocks && liveStocks.some((s) => s.currentPrice > 0) && (
          <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Live data · Refreshes every 5 min
          </div>
        )}
        {!isLoading && !tickersLoading && (!liveStocks || !liveStocks.some((s) => s.currentPrice > 0)) && (
          <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground opacity-50" />
            Waiting for live feed…
          </div>
        )}

        {/* Stats Overview */}
        <HelpTooltip text="Overview of your portfolio's total value, annual dividends, average yield, and how many stocks are below your target." side="bottom">
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <PortfolioStats
              stocks={stocks}
              targetYield={targetYield}
              underperformerCount={underperformers.length}
            />
          </section>
        </HelpTooltip>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Portfolio Section */}
          <div className="lg:col-span-2 space-y-6">
            <HelpTooltip text="Set your minimum acceptable dividend yield. Stocks below this threshold are flagged as underperformers." side="bottom">
              <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <YieldTargetSlider value={targetYield} onChange={setTargetYield} />
              </section>
            </HelpTooltip>

            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Portfolio</h2>
                <AddStockModal
                  existingTickers={stocks.map((s) => s.ticker)}
                  onAddStock={handleAddStock}
                />
              </div>
              
              {stocks.length === 0 && !isLoading && !tickersLoading ? (
                <div className="p-12 rounded-xl gradient-card shadow-card border border-muted-foreground/40 text-center">
                  <p className="text-muted-foreground">
                    No stocks in portfolio. Add some to get started!
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {stockAnalyses.map((analysis, index) => (
                    <div
                      key={analysis.stock.ticker}
                      className="animate-fade-in"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <StockCard
                        analysis={analysis}
                        onRemove={handleRemoveStock}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <UnderperformersList
                underperformers={underperformers}
                selectedStock={selectedUnderperformer}
                onSelectStock={handleSelectUnderperformer}
                targetYield={targetYield}
              />
            </section>

            <section className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <ReplacementSuggestions
                removedStock={selectedUnderperformer}
                candidates={replacements}
                onAddStock={handleAddStock}
              />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
