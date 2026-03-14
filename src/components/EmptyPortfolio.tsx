import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, ChevronRight, Check, Hash, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Stock } from '@/types/portfolio';
import { marketStocks } from '@/data/mockData';
import { useStockQuotes } from '@/hooks/useStockData';

interface EmptyPortfolioProps {
  onSelectStocks: () => void;
  onSetYield: () => void;
  onAddStock?: (stock: Stock, shares: number) => void;
  onYieldChange?: (value: number) => void;
  currentYield?: number;
  onDone?: () => void;
}

interface EnrichedStock extends Stock {
  computedYield: number;
}

export function EmptyPortfolio({ onSelectStocks, onSetYield, onAddStock, onYieldChange, currentYield = 5.0, onDone }: EmptyPortfolioProps) {
  const [step, setStep] = useState(0);
  const [localYield, setLocalYield] = useState(currentYield);
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [sharesMap, setSharesMap] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const catalogTickers = useMemo(() => marketStocks.map((s) => s.ticker), []);
  const { data: liveStocks, isLoading: livePricesLoading } = useStockQuotes(catalogTickers);

  const matchingStocks = useMemo(() => {
    const stocksToUse = marketStocks.map((mock) => {
      const live = liveStocks?.find((l) => l.ticker === mock.ticker);
      if (live && live.currentPrice > 0) {
        return { ...live, sector: live.sector || mock.sector, computedYield: live.currentYield } as EnrichedStock;
      }
      return { ...mock, computedYield: mock.currentYield } as EnrichedStock;
    });
    return stocksToUse
      .filter((s) => s.computedYield >= localYield)
      .sort((a, b) => b.computedYield - a.computedYield);
  }, [localYield, liveStocks]);

  const selectedStocks = useMemo(
    () => matchingStocks.filter((s) => selectedTickers.has(s.ticker)),
    [matchingStocks, selectedTickers]
  );

  const handleYieldConfirm = () => {
    onYieldChange?.(localYield);
    setStep(2);
  };

  const toggleTicker = (ticker: string) => {
    setSelectedTickers((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const handleProceedToShares = () => {
    // Initialize shares inputs for selected stocks
    const initial: Record<string, string> = {};
    selectedTickers.forEach((t) => { initial[t] = sharesMap[t] || ''; });
    setSharesMap(initial);
    setStep(3);
  };

  const handleConfirmAll = () => {
    setSubmitted(true);
    // Validate all have valid shares
    const allValid = selectedStocks.every((s) => {
      const val = parseFloat(sharesMap[s.ticker] || '');
      return val > 0;
    });
    if (!allValid) return;

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
          <Button size="lg" onClick={() => setStep(1)} className="gap-2">
            Get Started <ChevronRight className="w-4 h-4" />
          </Button>
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
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={handleYieldConfirm} className="gap-2">
              Find Matching Stocks <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Checkbox multi-select */}
      {step === 2 && (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Stocks Matching {localYield.toFixed(1)}%+ Yield</h2>
            <p className="text-sm text-muted-foreground">
              {livePricesLoading
                ? 'Loading live prices…'
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

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(1)}>Adjust Yield</Button>
            <Button variant="outline" onClick={onSelectStocks} className="gap-2">Search Other Stocks</Button>
            {selectedTickers.size > 0 && (
              <Button className="gap-2" onClick={handleProceedToShares}>
                Enter Shares for {selectedTickers.size} Stock{selectedTickers.size !== 1 ? 's' : ''} <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Bulk shares entry */}
      {step === 3 && (
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

          <div className="space-y-3">
            {selectedStocks.map((stock) => {
              const val = sharesMap[stock.ticker] || '';
              const numVal = parseFloat(val);
              const isInvalid = submitted && (!numVal || numVal <= 0);
              return (
                <Card key={stock.ticker} className={`p-4 border-border/50 ${isInvalid ? 'border-destructive/50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{stock.ticker}</span>
                        <span className="text-xs text-muted-foreground">${stock.currentPrice.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{stock.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Shares"
                        value={val}
                        onChange={(e) => setSharesMap((prev) => ({ ...prev, [stock.ticker]: e.target.value }))}
                        className="w-24"
                      />
                    </div>
                  </div>
                  {numVal > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {numVal} × ${stock.currentPrice.toFixed(2)} = <span className="text-primary font-medium">${(numVal * stock.currentPrice).toFixed(2)}</span>
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          {submitted && selectedStocks.some((s) => !(parseFloat(sharesMap[s.ticker] || '') > 0)) && (
            <p className="text-sm text-destructive text-center">Please enter a valid number of shares for all stocks.</p>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setSubmitted(false); setStep(2); }}>
              Back to Selection
            </Button>
            <Button className="gap-2" onClick={handleConfirmAll}>
              <Check className="w-4 h-4" />
              Add {selectedStocks.length} Stock{selectedStocks.length !== 1 ? 's' : ''} to Portfolio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
