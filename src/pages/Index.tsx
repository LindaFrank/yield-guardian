import { useState, useMemo, useEffect, useRef } from 'react';
import { Target } from 'lucide-react';
import { Stock } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
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
import { EmptyPortfolio } from '@/components/EmptyPortfolio';
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
    return savedTickers && savedTickers.length > 0 ? savedTickers : [];
  }, [user, tickersLoading, savedTickers]);

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [targetYield, setTargetYield] = useState(5.0);
  const [selectedUnderperformer, setSelectedUnderperformer] = useState<Stock | null>(null);
  const [wizardDone, setWizardDone] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);

  // Auto-skip wizard if user already has stocks in their portfolio
  useEffect(() => {
    if (!tickersLoading && tickers.length > 0) {
      setWizardDone(true);
    }
  }, [tickersLoading, tickers]);
  const yieldSliderRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  // Fetch live data for portfolio tickers
  const { data: liveStocks, isLoading, error } = useStockQuotes(tickers);

  // Keep local portfolio state in sync when user/account tickers change
  useEffect(() => {
    // Critical for new accounts: never keep stale stocks from a previous session/user
    if (tickers.length === 0) {
      setStocks([]);
      setSelectedUnderperformer(null);
      return;
    }

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
  }, [tickers, liveStocks]);

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

  const handleAddStock = (stock: Stock, shares?: number) => {
    if (!stocks.find((s) => s.ticker === stock.ticker)) {
      setStocks((prev) => [...prev, stock]);
      if (user) {
        addTicker.mutate({ ticker: stock.ticker, shares });
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
        <HelpTooltip text="This is used to display instructions or messages." side="bottom">
          <div className="mb-4">
            {(isLoading || tickersLoading) && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Fetching live market data…
              </div>
            )}
            {!isLoading && !tickersLoading && liveStocks && liveStocks.some((s) => s.currentPrice > 0) && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Live data · Refreshes every 5 min
              </div>
            )}
            {!isLoading && !tickersLoading && (!liveStocks || !liveStocks.some((s) => s.currentPrice > 0)) && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground opacity-50" />
                Waiting for live feed…
              </div>
            )}
          </div>
        </HelpTooltip>

        {/* Stats Overview — individual panel tooltips handled inside PortfolioStats */}
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <PortfolioStats
            stocks={stocks}
            targetYield={targetYield}
            underperformerCount={underperformers.length}
          />
        </section>

        <div className={`grid ${wizardDone ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
          {/* Main Portfolio Section */}
          <div className="lg:col-span-2 space-y-6">
            <HelpTooltip text="This is the lowest acceptable yield set for investments in the portfolio. This value is adjustable with the slider." side="bottom">
              <section ref={yieldSliderRef} className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <YieldTargetSlider value={targetYield} onChange={setTargetYield} />
              </section>
            </HelpTooltip>

            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <HelpTooltip text="This is the collection of stocks (investments) represented below." side="bottom">
                  <h2 className="text-lg font-semibold">Your Portfolio</h2>
                </HelpTooltip>
                <div className="flex items-center gap-2">
                  {wizardDone && (
                    <Button variant="outline" size="sm" onClick={() => setWizardDone(false)} className="gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Find Stocks
                    </Button>
                  )}
                  <AddStockModal
                    existingTickers={stocks.map((s) => s.ticker)}
                    onAddStock={handleAddStock}
                    open={addStockOpen}
                    onOpenChange={setAddStockOpen}
                  />
                </div>
              </div>
              
              {!wizardDone && !isLoading && !tickersLoading ? (
                <EmptyPortfolio
                  onSelectStocks={() => setAddStockOpen(true)}
                  onSetYield={() => yieldSliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  onAddStock={handleAddStock}
                  onYieldChange={setTargetYield}
                  currentYield={targetYield}
                  onDone={() => setWizardDone(true)}
                />
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

          {/* Sidebar — hidden during wizard */}
          {wizardDone && (
            <aside className="space-y-6">
              <HelpTooltip text="These are the investments that deliver lower returns than a benchmark, market average, or expected performance. Stocks in this category are listed here." side="left">
                <section className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                  <UnderperformersList
                    underperformers={underperformers}
                    selectedStock={selectedUnderperformer}
                    onSelectStock={handleSelectUnderperformer}
                    targetYield={targetYield}
                  />
                </section>
              </HelpTooltip>

              <HelpTooltip text="Displays recommended replacement stocks for the currently selected underperforming stock." side="left">
                <section className="animate-fade-in" style={{ animationDelay: '500ms' }}>
                  <ReplacementSuggestions
                    removedStock={selectedUnderperformer}
                    candidates={replacements}
                    onAddStock={handleAddStock}
                  />
                </section>
              </HelpTooltip>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
