import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, Target, ChevronRight, Check, Hash, Loader2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Stock } from '@/types/portfolio';
import { marketStocks } from '@/data/mockData';
import { HIGH_YIELD_CANDIDATES, HIGH_YIELD_CANDIDATE_TICKERS } from '@/data/highYieldCandidates';
import { isEligibleAlternative } from '@/lib/alternativeSafeguards';
import { ImportStocksModal } from '@/components/ImportStocksModal';
import { useStockQuotes } from '@/hooks/useStockData';
import { feedLabels } from '@/lib/feedLabels';
import { useNavigate } from 'react-router-dom';
import { checkDividendStability } from '@/lib/portfolioUtils';
import { allocateBudget, BudgetMode } from '@/lib/budgetAllocator';
import { BudgetPlannerCard, BudgetSetupCard, isValidBudgetInput } from '@/components/BudgetPlannerCard';
import { cn } from '@/lib/utils';


function useScrollToOnValue<T extends HTMLElement>(value: unknown) {
  const ref = useRef<T>(null);
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [value]);
  return ref;
}


interface EmptyPortfolioProps {
  onSelectStocks: () => void;
  onSetYield: () => void;
  onAddStock?: (stock: Stock, shares?: number) => void;
  onYieldChange?: (value: number) => void;
  currentYield?: number;
  onDone?: () => void;
  initialStep?: number;
  onCancel?: () => void;
  existingTickers?: string[];
}

interface EnrichedStock extends Stock {
  computedYield: number;
}

export function EmptyPortfolio({ onSelectStocks, onSetYield, onAddStock, onYieldChange, currentYield = 5.0, onDone, initialStep = 0, onCancel, existingTickers = [] }: EmptyPortfolioProps) {
  const [step, setStep] = useState(initialStep);
  const navigate = useNavigate();

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    const handleGuestBack = (e: Event) => {
      e.preventDefault(); // tell the header the wizard handled it
      setStep((s) => {
        if (s > 0) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return s - 1;
        }
        navigate('/auth');
        return s;
      });
    };
    window.addEventListener('yg:guest-back', handleGuestBack);
    return () => window.removeEventListener('yg:guest-back', handleGuestBack);
  }, [navigate]);
  const [localYield, setLocalYield] = useState(currentYield);
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [sharesMap, setSharesMap] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('even');
  const [portions, setPortions] = useState<number | null>(null);
  const step2Ref = useScrollToOnValue<HTMLDivElement>(step === 3 ? 'step3' : '');

  const catalogTickers = useMemo(
    () => Array.from(new Set([...marketStocks.map((s) => s.ticker), ...HIGH_YIELD_CANDIDATE_TICKERS])),
    []
  );
  const { data: liveStocks, isLoading: livePricesLoading, feed } = useStockQuotes(catalogTickers);

  const matchingStocks = useMemo(() => {
    const stocksToUse = marketStocks.map((mock) => {
      const live = liveStocks?.find((l) => l.ticker === mock.ticker);
      if (live && live.currentPrice > 0) {
        return { ...live, sector: live.sector || mock.sector, computedYield: live.currentYield } as EnrichedStock;
      }
      return { ...mock, computedYield: mock.currentYield } as EnrichedStock;
    });
    // Well-known high-yield stocks join only with real prices and dividends.
    HIGH_YIELD_CANDIDATES.forEach((c) => {
      if (stocksToUse.some((s) => s.ticker === c.ticker)) return;
      const live = liveStocks?.find((l) => l.ticker === c.ticker);
      if (live && live.currentPrice > 0) {
        stocksToUse.push({ ...live, sector: live.sector || c.sector, computedYield: live.currentYield } as EnrichedStock);
      }
    });
    return stocksToUse
      .filter((s) => s.computedYield >= localYield)
      .filter((s) => isEligibleAlternative(s))
      .filter((s) => checkDividendStability(s, 2, localYield).status === 'stable')
      .sort((a, b) => b.computedYield - a.computedYield);
  }, [localYield, liveStocks]);

  const selectedStocks = useMemo(
    () => matchingStocks.filter((s) => selectedTickers.has(s.ticker)),
    [matchingStocks, selectedTickers]
  );

  const parsedBudget = budgetInput.trim() === '' ? 0 : parseFloat(budgetInput);
  const hasBudget = Number.isFinite(parsedBudget) && parsedBudget > 0;
  const effectivePortions = selectedStocks.length > 0
    ? Math.max(1, Math.min(portions ?? selectedStocks.length, selectedStocks.length))
    : 0;

  const budgetResult = useMemo(
    () => (hasBudget ? allocateBudget(selectedStocks, parsedBudget, budgetMode, effectivePortions, localYield) : null),
    [hasBudget, selectedStocks, parsedBudget, budgetMode, effectivePortions, localYield]
  );

  const { liveTotalAllocated, liveWeightedYield, stocksWithSharesCount } = useMemo(() => {
    let total = 0;
    let weightedDiv = 0;
    let count = 0;
    for (const s of selectedStocks) {
      const n = parseFloat(sharesMap[s.ticker] || '');
      if (Number.isFinite(n) && n > 0) {
        const cost = n * s.currentPrice;
        total += cost;
        weightedDiv += cost * (s.computedYield / 100);
        count += 1;
      }
    }
    return {
      liveTotalAllocated: Math.round(total * 100) / 100,
      liveWeightedYield: total > 0 ? (weightedDiv / total) * 100 : 0,
      stocksWithSharesCount: count,
    };
  }, [selectedStocks, sharesMap]);

  const applyBudgetToShares = (
    nextBudgetStr: string,
    nextMode: BudgetMode,
    nextPortions: number | null,
    stocks: EnrichedStock[]
  ) => {
    const amount = nextBudgetStr.trim() === '' ? 0 : parseFloat(nextBudgetStr);
    if (!Number.isFinite(amount) || amount <= 0 || stocks.length === 0) return;
    const count = Math.max(1, Math.min(nextPortions ?? stocks.length, stocks.length));
    const res = allocateBudget(stocks, amount, nextMode, count, localYield);
    const nextShares: Record<string, string> = {};
    stocks.forEach((s) => {
      const sh = res.allocations[s.ticker]?.shares ?? 0;
      nextShares[s.ticker] = sh > 0 ? String(sh) : '';
    });
    setSharesMap(nextShares);
  };

  const handleBudgetChange = (val: string) => {
    setBudgetInput(val);
    setSubmitted(false);
    applyBudgetToShares(val, budgetMode, portions, selectedStocks);
  };

  const handleBudgetModeChange = (nextMode: BudgetMode) => {
    setBudgetMode(nextMode);
    setSubmitted(false);
    applyBudgetToShares(budgetInput, nextMode, portions, selectedStocks);
  };

  const handlePortionsChange = (nextPortions: number) => {
    setPortions(nextPortions);
    setSubmitted(false);
    applyBudgetToShares(budgetInput, budgetMode, nextPortions, selectedStocks);
  };

  const handleYieldConfirm = () => {
    onYieldChange?.(localYield);
    if (!isValidBudgetInput(budgetInput)) setBudgetInput('');
    setSubmitted(false);
    setStep(3);
  };

  const toggleTicker = (ticker: string) => {
    setSelectedTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      if (step === 4 && hasBudget) {
        const remainingStocks = matchingStocks.filter((s) => next.has(s.ticker));
        const clamped = portions !== null ? Math.min(portions, Math.max(1, remainingStocks.length)) : null;
        setPortions(clamped);
        applyBudgetToShares(budgetInput, budgetMode, clamped, remainingStocks);
      }
      return next;
    });
  };

  const handleProceedToShares = () => {
    const nextStocks = matchingStocks.filter((s) => selectedTickers.has(s.ticker));
    const clampedPortions = portions !== null ? Math.min(portions, Math.max(1, nextStocks.length)) : null;
    setPortions(clampedPortions);
    if (hasBudget) {
      applyBudgetToShares(budgetInput, budgetMode, clampedPortions, nextStocks);
    } else {
      const initial: Record<string, string> = {};
      selectedTickers.forEach((t) => { initial[t] = sharesMap[t] || ''; });
      setSharesMap(initial);
    }
    setStep(4);
    // Scroll to top so user sees the first stock in the shares list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmAll = () => {
    setSubmitted(true);
    if (hasBudget) {
      const stocksToAdd = selectedStocks.filter((s) => parseFloat(sharesMap[s.ticker] || '') > 0);
      if (stocksToAdd.length === 0) {
        toast.error('No shares to add yet', {
          description: 'Increase your investment amount, adjust portions, or enter shares manually.',
        });
        return;
      }
      stocksToAdd.forEach((stock) => {
        const shares = parseFloat(sharesMap[stock.ticker]);
        onAddStock?.(stock, shares);
      });
      onDone?.();
      return;
    }

    // Find the first stock missing valid shares
    const firstInvalid = selectedStocks.find((s) => {
      const val = parseFloat(sharesMap[s.ticker] || '');
      return !(val > 0);
    });
    if (firstInvalid) {
      // Scroll to the invalid card and show a toast
      const el = document.getElementById(`shares-card-${firstInvalid.ticker}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error(`Please enter shares for ${firstInvalid.ticker}`, {
        description: 'Every selected stock needs a valid number of shares.',
      });
      return;
    }

    selectedStocks.forEach((stock) => {
      const shares = parseFloat(sharesMap[stock.ticker]);
      onAddStock?.(stock, shares);
    });
    onDone?.();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 0: Portfolio value = $0 */}
      {step === 0 && (
        <div className="text-center py-8 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Portfolio Value</h2>
            <p className="text-5xl font-mono font-bold text-primary">$0.00</p>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Let's build your dividend portfolio. We'll start by setting your desired yield target, then find stocks that match.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setStep(1)} size="lg" className="gap-2" autoFocus>
              <Target className="w-5 h-5" />
              Desired Dividend Yield
            </Button>
            <Button size="lg" onClick={() => setStep(1)} className="gap-2">
              Find Matching Stocks <ChevronRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onSelectStocks} className="gap-2">
              <Search className="w-5 h-5" />
              General Stock Search
            </Button>
            {onAddStock && (
              <ImportStocksModal
                existingTickers={existingTickers}
                onAddStock={onAddStock}
              />
            )}
          </div>
        </div>
      )}

      {/* Step 1: Set desired yield */}
      {step === 1 && (
        <div className="max-w-lg mx-auto space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Set Your Desired Yield</h2>
            <p className="text-sm text-muted-foreground">
              What minimum annual dividend yield are you looking for?
            </p>
          </div>
          <Card className="p-6 border-border/50">
            <div className="text-center mb-6">
              <span className="text-4xl font-mono font-bold text-primary">
                {localYield.toFixed(1)}%
              </span>
              <p className="text-xs text-muted-foreground mt-1">minimum annual yield</p>
            </div>
            <Slider
              value={[localYield]}
              onValueChange={([v]) => setLocalYield(v)}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>1% Conservative</span>
              <span>10% Aggressive</span>
            </div>
          </Card>
          <div className="text-center space-y-1 pt-2">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> How Much Do You Have to Invest?
            </h2>
            <p className="text-sm text-muted-foreground">
              Optional — tell us your budget and we'll pre-fill whole shares for the stocks you pick next. Leave it blank to enter shares yourself.
            </p>
          </div>
          <BudgetSetupCard
            budgetInput={budgetInput}
            onBudgetChange={handleBudgetChange}
            mode={budgetMode}
            onModeChange={handleBudgetModeChange}
            targetYield={localYield}
          />
          <div className="flex flex-wrap gap-3 justify-center">
            {onAddStock && (
              <ImportStocksModal existingTickers={existingTickers} onAddStock={onAddStock} />
            )}
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={handleYieldConfirm} className="gap-2">
              Find Matching Stocks <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Budget question — right after the yield slider */}
      {step === 2 && (
        <div className="max-w-lg mx-auto space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
              <DollarSign className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">How Much Do You Have to Invest?</h2>
            <p className="text-sm text-muted-foreground">
              Tell us your budget and we'll pre-fill whole shares for the stocks you pick next.
            </p>
          </div>
          <BudgetSetupCard
            budgetInput={budgetInput}
            onBudgetChange={handleBudgetChange}
            mode={budgetMode}
            onModeChange={handleBudgetModeChange}
            targetYield={localYield}
          />
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button
              variant="outline"
              onClick={() => { setBudgetInput(''); setSubmitted(false); setStep(3); }}
            >
              Skip — I'll enter shares myself
            </Button>
            <Button
              className="gap-2"
              disabled={!isValidBudgetInput(budgetInput)}
              onClick={() => setStep(3)}
            >
              Find Matching Stocks <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Checkbox multi-select */}
      {step === 3 && (
        <div ref={step2Ref} className="scroll-mt-64 space-y-6 py-4 px-4 sm:px-6 rounded-xl border-[4px] border-gray-400 bg-background">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Stocks Matching {localYield.toFixed(1)}%+ Yield</h2>
            <p className="text-sm text-muted-foreground">
              {livePricesLoading
                ? feedLabels(feed).fetching
                : `${matchingStocks.length} stock${matchingStocks.length !== 1 ? 's' : ''} found — check the ones you want to add`}
            </p>
            {livePricesLoading && <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-2" />}
          </div>

          {matchingStocks.length === 0 ? (
            <Card className="p-6 text-center border-border/50">
              <p className="text-muted-foreground">
                No stocks in our catalog match a {localYield.toFixed(1)}% yield. Try lowering your target.
              </p>
              <Button variant="outline" onClick={() => setStep(1)} className="mt-4">Adjust Yield</Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {matchingStocks.map((stock) => {
                const isChecked = selectedTickers.has(stock.ticker);
                return (
                  <Card
                    key={stock.ticker}
                    className={`p-4 border-border/50 cursor-pointer transition-all duration-200 ${
                      isChecked ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'hover:border-primary/30 hover:bg-accent/30'
                    }`}
                    onClick={() => toggleTicker(stock.ticker)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleTicker(stock.ticker)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{stock.ticker}</span>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                            {stock.sector}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{stock.name}</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          {stock.computedYield.toFixed(2)}% yield · ${stock.currentPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {onAddStock && (
              <ImportStocksModal existingTickers={existingTickers} onAddStock={onAddStock} />
            )}
            <Button variant="outline" onClick={() => setStep(1)}>Adjust Yield</Button>
            <Button variant="outline" onClick={onSelectStocks} className="gap-2">Search Other Stocks</Button>
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            {selectedTickers.size > 0 && (
              <Button className="gap-2" onClick={handleProceedToShares}>
                Enter Shares for {selectedTickers.size} Stock{selectedTickers.size !== 1 ? 's' : ''} <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Bulk shares entry */}
      {step === 4 && (
        <div className="space-y-6 py-4 max-w-lg mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
              <Hash className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Enter Shares</h2>
            <p className="text-sm text-muted-foreground">
              How many shares of each stock do you want to add?
            </p>
          </div>

          {hasBudget && (
            <BudgetPlannerCard
              budget={parsedBudget}
              mode={budgetMode}
              portions={effectivePortions}
              maxPortions={selectedStocks.length}
              onPortionsChange={handlePortionsChange}
              totalAllocated={liveTotalAllocated}
              weightedYield={liveWeightedYield}
            />
          )}

          <div className="space-y-3">
            {selectedStocks.map((stock) => {
              const val = sharesMap[stock.ticker] || '';
              const numVal = parseFloat(val);
              const alloc = budgetResult?.allocations[stock.ticker];
              const isNotBought = hasBudget && alloc?.status === 'not_bought' && !(numVal > 0);
              const isCannotAfford = hasBudget && alloc?.status === 'cannot_afford' && !(numVal > 0);
              const isInvalid = !hasBudget && submitted && (!numVal || numVal <= 0);
              return (
                <Card
                  key={stock.ticker}
                  id={`shares-card-${stock.ticker}`}
                  className={cn(
                    'p-4 border-[0.5px] border-muted-foreground/70',
                    isInvalid && 'border-yield-negative',
                    isCannotAfford && 'border-yield-warning',
                    isNotBought && 'opacity-70'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedTickers.has(stock.ticker)}
                      onCheckedChange={() => toggleTicker(stock.ticker)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{stock.ticker}</span>
                        <span className="text-xs text-muted-foreground">${stock.currentPrice.toFixed(2)}</span>
                        <span className="text-xs text-primary font-medium">{stock.computedYield.toFixed(2)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{stock.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={isNotBought ? '0' : 'Shares'}
                        value={val}
                        onChange={(e) => setSharesMap((prev) => ({ ...prev, [stock.ticker]: e.target.value }))}
                        className="w-24 bg-card border-primary/50 focus-visible:border-primary"
                      />
                    </div>
                  </div>
                  {numVal > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {numVal} × ${stock.currentPrice.toFixed(2)} = <span className="text-primary font-medium">${(numVal * stock.currentPrice).toFixed(2)}</span>
                    </p>
                  )}
                  {isNotBought && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Not bought — outside your top {effectivePortions} highest-yielding stock{effectivePortions !== 1 ? 's' : ''}.
                    </p>
                  )}
                  {isCannotAfford && alloc && (
                    <p className="text-xs text-yield-warning mt-2">
                      Portion (${alloc.portionBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) can't afford 1 share (${stock.currentPrice.toFixed(2)}) — try fewer portions or enter shares manually.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          {!hasBudget && submitted && selectedStocks.some((s) => !(parseFloat(sharesMap[s.ticker] || '') > 0)) && (
            <p className="text-sm text-destructive text-center">Please enter a valid number of shares for all stocks.</p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {onAddStock && (
              <ImportStocksModal existingTickers={existingTickers} onAddStock={onAddStock} />
            )}
            <Button variant="outline" onClick={() => { setSubmitted(false); setStep(3); }}>
              Back to Selection
            </Button>
            <Button className="gap-2" onClick={handleConfirmAll}>
              <Check className="w-4 h-4" />
              {hasBudget
                ? `Add ${stocksWithSharesCount} Stock${stocksWithSharesCount !== 1 ? 's' : ''} to Portfolio`
                : `Add ${selectedStocks.length} Stock${selectedStocks.length !== 1 ? 's' : ''} to Portfolio`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
