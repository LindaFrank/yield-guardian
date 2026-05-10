import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Target, FileDown, TrendingDown, Sparkles, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { Stock } from '@/types/portfolio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { marketStocks as mockMarketStocks } from '@/data/mockData';
import { 
  analyzeStock, 
  scanPortfolioForUnderperformers, 
  suggestReplacements,
  checkDividendStability,
  calculateDividendYield
} from '@/lib/portfolioUtils';
import { generatePortfolioReport } from '@/lib/generatePortfolioReport';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { YieldTargetSlider } from '@/components/YieldTargetSlider';
import { StockCard } from '@/components/StockCard';
import { StockCardDirectionsNote } from '@/components/StockCardDirectionsNote';
import { UnderperformersList } from '@/components/UnderperformersList';
import { ReplacementSuggestions } from '@/components/ReplacementSuggestions';
import { IncomeImpact } from '@/components/IncomeImpact';
import { IncomeYTD } from '@/components/IncomeYTD';
import { AddStockModal } from '@/components/AddStockModal';
import { ImportStocksModal } from '@/components/ImportStocksModal';
import { EmptyPortfolio } from '@/components/EmptyPortfolio';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useStockQuotes } from '@/hooks/useStockData';
import { useUserTickers, useUserStocksWithShares, useAddTicker, useRemoveTicker, useUpdateShares } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';


const DEFAULT_TICKERS = ['JNJ', 'KO', 'ABBV', 'T', 'VZ', 'XOM'];
const ALL_MARKET_TICKERS = mockMarketStocks.map((s) => s.ticker);

const Index = () => {
  const { user } = useAuth();
  const { data: savedTickers, isLoading: tickersLoading } = useUserTickers();
  const addTicker = useAddTicker();
  const removeTicker = useRemoveTicker();
  const updateShares = useUpdateShares();
  const { data: stocksWithShares } = useUserStocksWithShares();

  // Use saved tickers if logged in and loaded, otherwise defaults
  const tickers = useMemo(() => {
    if (!user) return DEFAULT_TICKERS;
    if (tickersLoading) return [];
    return savedTickers && savedTickers.length > 0 ? savedTickers : [];
  }, [user, tickersLoading, savedTickers]);

  // Candidate tickers = market stocks NOT already in the portfolio
  const candidateTickers = useMemo(
    () => ALL_MARKET_TICKERS.filter((t) => !tickers.includes(t)),
    [tickers]
  );

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [targetYield, setTargetYield] = useState(5.0);
  const [selectedUnderperformer, setSelectedUnderperformer] = useState<Stock | null>(null);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [findStocksStep, setFindStocksStep] = useState(0);
  const [showFindStocksFlow, setShowFindStocksFlow] = useState(false);
  const [actionBarExpanded, setActionBarExpanded] = useState(false);
  // Σ IncomeDelta_Y across underperformers (keyed by ticker, last-known per stock)
  const [incomeDeltaByTicker, setIncomeDeltaByTicker] = useState<Record<string, number>>({});

  // Wizard is done if user has saved tickers OR has already dismissed it this session
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const wizardDone = wizardDismissed || (!tickersLoading && tickers.length > 0);
  const showStockFinder = !wizardDone || showFindStocksFlow;
  const yieldSliderRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  // Fetch live data for portfolio tickers
  const { data: liveStocks, isLoading, error } = useStockQuotes(tickers);

  // Fetch live quotes for candidate replacement stocks
  const { data: liveCandidates } = useStockQuotes(candidateTickers);

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

  // Σ_total_gain = sum of latest IncomeDelta_Y across underperformers user has previewed
  const totalIncomeGain = useMemo(() => {
    const underTickers = new Set(underperformers.map((u) => u.stock.ticker));
    return Object.entries(incomeDeltaByTicker).reduce(
      (sum, [t, v]) => (underTickers.has(t) ? sum + v : sum),
      0,
    );
  }, [incomeDeltaByTicker, underperformers]);

  // Current portfolio dividend income & projected new yield after applying gains
  const portfolioStats = useMemo(() => {
    const sharesMap = Object.fromEntries(
      (stocksWithShares ?? []).map((s) => [s.ticker, s.shares_owned ?? 0]),
    );
    let value = 0;
    let income = 0;
    stocks.forEach((s) => {
      const sh = sharesMap[s.ticker] ?? 0;
      value += sh * s.currentPrice;
      income += sh * s.annualDividend;
    });
    const newIncome = income + totalIncomeGain;
    const newYield = value > 0 ? (newIncome / value) * 100 : 0;
    return { value, income, newIncome, newYield };
  }, [stocks, stocksWithShares, totalIncomeGain]);

  // Build a live market stocks pool for replacement suggestions
  const liveMarketStocks = useMemo(() => {
    if (!liveCandidates || liveCandidates.length === 0) return [];
    return liveCandidates.map((live) => {
      const mock = mockMarketStocks.find((m) => m.ticker === live.ticker);
      return {
        ...live,
        sector: live.sector || mock?.sector || 'Unknown',
      };
    });
  }, [liveCandidates]);

  // Build default candidate list from either live or mock data
  const candidatePool = useMemo(() => {
    const portfolioTickers = stocks.map((s) => s.ticker);
    const pool = liveMarketStocks.length > 0 ? liveMarketStocks : mockMarketStocks;
    return pool.filter((s) => !portfolioTickers.includes(s.ticker));
  }, [liveMarketStocks, stocks]);

  const replacements = useMemo(() => {
    if (selectedUnderperformer) {
      const pool = liveMarketStocks.length > 0 ? liveMarketStocks : mockMarketStocks;
      return suggestReplacements(
        selectedUnderperformer,
        pool,
        targetYield,
        stocks.map((s) => s.ticker)
      );
    }
    // Default suggestions: top-yield, stability-prioritized candidates
    const scored = candidatePool
      .map((s) => {
        const stability = checkDividendStability(s, 2, targetYield);
        const stabilityScore = stability.status === 'stable' ? 3 : stability.status === 'warning' ? 2 : 1;
        const yieldVal = calculateDividendYield(s);
        let matchReason = '';
        if (stabilityScore === 3 && yieldVal >= targetYield) {
          matchReason = 'Strong yield & stable history';
        } else if (yieldVal >= targetYield) {
          matchReason = 'Meets yield target';
        } else {
          matchReason = 'Popular dividend stock';
        }
        return {
          stock: s,
          yield: yieldVal,
          stabilityScore,
          matchReason,
        };
      })
      // Order strictly by yield descending — highest-yield candidate first.
      .sort((a, b) => b.yield - a.yield);

    // In default mode (no underperformer), only show stocks above target yield
    return scored.filter((c) => c.yield >= targetYield).slice(0, 5);
  }, [selectedUnderperformer, stocks, targetYield, liveMarketStocks, candidatePool]);

  const handleRemoveStock = (ticker: string) => {
    setStocks((prev) => prev.filter((s) => s.ticker !== ticker));
    if (selectedUnderperformer?.ticker === ticker) {
      setSelectedUnderperformer(null);
    }
    // Any previously-previewed income deltas referenced the prior portfolio
    // composition; invalidate them so "New portfolio yield" stays accurate.
    setIncomeDeltaByTicker({});
    if (user) {
      removeTicker.mutate(ticker);
    }
  };

  const handleAddStock = (stock: Stock, shares?: number) => {
    if (!stocks.find((s) => s.ticker === stock.ticker)) {
      setStocks((prev) => [...prev, stock]);
      // Invalidate stale projected gains — they were computed against the
      // previous portfolio value/income.
      setIncomeDeltaByTicker({});
      if (user) {
        addTicker.mutate({ ticker: stock.ticker, shares });
      }
    }
  };

  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);

  const handleSelectUnderperformer = (stock: Stock) => {
    setSelectedUnderperformer(stock);
    setReplacementDialogOpen(true);
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

        {/* New user: show onboarding wizard prominently first */}
        {showStockFinder && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <EmptyPortfolio
              onSelectStocks={() => setAddStockOpen(true)}
              onSetYield={() => yieldSliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              onAddStock={handleAddStock}
              onYieldChange={setTargetYield}
              currentYield={targetYield}
              onDone={() => {
                setWizardDismissed(true);
                setShowFindStocksFlow(false);
                setFindStocksStep(0);
              }}
              onCancel={() => {
                setShowFindStocksFlow(false);
                setFindStocksStep(0);
              }}
              initialStep={showFindStocksFlow ? findStocksStep : 0}
              existingTickers={stocks.map((s) => s.ticker)}
            />
          </section>
        )}

        {/* Stats Overview */}
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <PortfolioStats
            stocks={stocks}
            sharesMap={Object.fromEntries(
              (stocksWithShares ?? []).map(s => [s.ticker, s.shares_owned])
            )}
            targetYield={targetYield}
            underperformerCount={underperformers.length}
          />
        </section>

        {/* Sticky Action Bar */}
        {wizardDone && (
          <div className="sticky top-[100px] z-40 mb-6 flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-background px-3 py-2 shadow-glow animate-fade-in">
            {!actionBarExpanded && (
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/90 whitespace-nowrap">
                What Do You Want To Do?
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-auto shrink-0"
              onClick={() => setActionBarExpanded((v) => !v)}
              aria-label={actionBarExpanded ? 'Collapse actions' : 'Expand actions'}
            >
              {actionBarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            {actionBarExpanded && (
              <div className="flex items-center gap-2 flex-wrap overflow-hidden [&_button]:text-xs [&_button]:h-7 [&_button]:px-2.5">
                <Button
                  variant="outline"
                  className="gap-1.5 border-[3px] border-muted-foreground/50"
                  onClick={() => yieldSliderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                  <Target className="w-3.5 h-3.5" />
                  Income Goal
                </Button>
                <Button
                  className="gap-1.5 border-[3px] border-primary bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow ring-1 ring-primary/40"
                  onClick={() => {
                    setSelectedUnderperformer(null);
                    setReplacementDialogOpen(true);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Stocks that meet Yield Target
                </Button>
                <ImportStocksModal
                  existingTickers={stocks.map((s) => s.ticker)}
                  existingShares={stocksWithShares?.map(s => ({ ticker: s.ticker, shares: s.shares_owned })) ?? []}
                  onAddStock={handleAddStock}
                  onUpdateShares={(ticker, shares) => {
                    if (user) {
                      updateShares.mutate({ ticker, shares });
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  className="gap-1.5 border-[3px] border-muted-foreground/50"
                  onClick={() => setAddStockOpen(true)}
                >
                  <Search className="w-3.5 h-3.5" />
                  Search Stocks Generally
                </Button>
                {stocks.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-1.5 border-[3px] border-muted-foreground/50"
                      onClick={() => {
                        const el = document.getElementById('underperformers-section');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      Review Underperformers ({underperformers.length})
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 border-[3px] border-muted-foreground/50"
                      onClick={async () => {
                        try {
                          await generatePortfolioReport({
                            stocks,
                            sharesMap: Object.fromEntries(
                              (stocksWithShares ?? []).map(s => [s.ticker, s.shares_owned])
                            ),
                            targetYield,
                            underperformers,
                            getReplacements: (stock) =>
                              suggestReplacements(stock, liveMarketStocks, targetYield, stocks.map(s => s.ticker)),
                          });
                        } catch (err) {
                          console.error('Report generation failed:', err);
                          toast({ title: 'Report Error', description: String(err), variant: 'destructive' });
                        }
                      }}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Report
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row 1: Yield slider + Underperformers */}
        <div className={`grid ${showStockFinder ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
          <div className="lg:col-span-2 space-y-4">
            <IncomeYTD
              stocks={stocks}
              sharesMap={Object.fromEntries(
                (stocksWithShares ?? []).map((s) => [s.ticker, s.shares_owned ?? 0]),
              )}
            />
            <HelpTooltip text="This is the lowest acceptable yield set for investments in the portfolio. This value is adjustable with the slider." side="bottom">
              <section ref={yieldSliderRef} className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <YieldTargetSlider value={targetYield} onChange={setTargetYield} />
              </section>
            </HelpTooltip>
          </div>
          {!showStockFinder && (
            <div className="space-y-4">
              {underperformers.length > 0 && (
                <IncomeImpact
                  underperformers={underperformers}
                  sharesMap={Object.fromEntries(
                    (stocksWithShares ?? []).map((s) => [s.ticker, s.shares_owned ?? 0]),
                  )}
                  marketPool={liveMarketStocks.length > 0 ? liveMarketStocks : mockMarketStocks}
                  portfolioTickers={stocks.map((s) => s.ticker)}
                  targetYield={targetYield}
                  portfolioValue={portfolioStats.value}
                  portfolioIncome={portfolioStats.income}
                />
              )}
              <HelpTooltip text="These are the investments that deliver lower returns than a benchmark, market average, or expected performance. Stocks in this category are listed here." side="left">
                <section id="underperformers-section" className="animate-fade-in scroll-mt-[180px]" style={{ animationDelay: '400ms' }}>
                  <UnderperformersList
                    underperformers={underperformers}
                    selectedStock={selectedUnderperformer}
                    onSelectStock={handleSelectUnderperformer}
                    targetYield={targetYield}
                  />
                </section>
              </HelpTooltip>
            </div>
          )}
        </div>

        {/* Row 2: Portfolio cards + Suggested stocks */}
        <div className={`grid ${showStockFinder ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8 mt-8`}>
          <div className="lg:col-span-2">
            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <HelpTooltip text="This is the collection of stocks (investments) represented below." side="bottom">
                  <h2 className="text-lg font-semibold">Your Portfolio</h2>
                </HelpTooltip>
              </div>
              
              {!showStockFinder && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {stockAnalyses.map((analysis, index) => (
                    <div
                      key={analysis.stock.ticker}
                      className="animate-fade-in relative"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <StockCard
                        analysis={analysis}
                        sharesOwned={stocksWithShares?.find(s => s.ticker === analysis.stock.ticker)?.shares_owned}
                        onRemove={handleRemoveStock}
                        onSelect={analysis.isUnderperforming ? handleSelectUnderperformer : undefined}
                        onUpdateShares={(ticker, shares) => {
                          if (user) {
                            updateShares.mutate(
                              { ticker, shares },
                              {
                                onSuccess: () => {
                                  toast({ title: 'Shares updated', description: `${ticker} set to ${shares ?? 0} shares.` });
                                },
                                onError: (err) => {
                                  console.error('Share update failed:', err);
                                  toast({ title: 'Update failed', description: String(err), variant: 'destructive' });
                                },
                              }
                            );
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Replacement Suggestions Dialog */}
          <Dialog open={replacementDialogOpen} onOpenChange={setReplacementDialogOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {selectedUnderperformer
                    ? `Replacements for ${selectedUnderperformer.ticker}`
                    : 'Matching Stocks'}
                </DialogTitle>
              </DialogHeader>
              <ReplacementSuggestions
                removedStock={selectedUnderperformer}
                candidates={replacements}
                sharesYHeld={
                  selectedUnderperformer
                    ? stocksWithShares?.find((s) => s.ticker === selectedUnderperformer.ticker)?.shares_owned ?? 0
                    : 0
                }
                targetYield={targetYield}
                portfolioValue={portfolioStats.value}
                portfolioIncome={portfolioStats.income}
                onIncomeDeltaChange={(ticker, delta) =>
                  setIncomeDeltaByTicker((prev) =>
                    prev[ticker] === delta ? prev : { ...prev, [ticker]: delta }
                  )
                }
                onAddStock={(stock, shares) => {
                  handleAddStock(stock, shares);
                  setReplacementDialogOpen(false);
                }}
                onSwap={(candidate, buyShares, removeTicker) => {
                  handleAddStock(candidate, buyShares);
                  handleRemoveStock(removeTicker);
                  setReplacementDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>

          <AddStockModal
            existingTickers={stocks.map((s) => s.ticker)}
            onAddStock={handleAddStock}
            open={addStockOpen}
            onOpenChange={setAddStockOpen}
            suggestedStocks={liveMarketStocks}
            targetYield={targetYield}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
