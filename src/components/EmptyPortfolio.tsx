import { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Target, ChevronRight, Plus, Check, X, Hash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Stock } from '@/types/portfolio';
import { marketStocks } from '@/data/mockData';
import { calculateDividendYield } from '@/lib/portfolioUtils';

interface AddedStockInfo {
  stock: Stock;
  shares: number;
}

interface EmptyPortfolioProps {
  onSelectStocks: () => void;
  onSetYield: () => void;
  onAddStock?: (stock: Stock, shares: number) => void;
  onYieldChange?: (value: number) => void;
  currentYield?: number;
}

export function EmptyPortfolio({ onSelectStocks, onSetYield, onAddStock, onYieldChange, currentYield = 5.0 }: EmptyPortfolioProps) {
  const [step, setStep] = useState(0);
  const [localYield, setLocalYield] = useState(currentYield);
  const [addedStocks, setAddedStocks] = useState<Map<string, AddedStockInfo>>(new Map());

  // Shares input state for the inline prompt
  const [pendingStock, setPendingStock] = useState<(Stock & { computedYield: number }) | null>(null);
  const [sharesInput, setSharesInput] = useState('');

  const matchingStocks = useMemo(() => {
    return marketStocks
      .map((stock) => ({
        ...stock,
        computedYield: calculateDividendYield(stock),
      }))
      .filter((s) => s.computedYield >= localYield)
      .sort((a, b) => b.computedYield - a.computedYield);
  }, [localYield]);

  const handleYieldConfirm = () => {
    onYieldChange?.(localYield);
    setStep(2);
  };

  const handleSelectStock = (stock: Stock & { computedYield: number }) => {
    if (addedStocks.has(stock.ticker)) return;
    setPendingStock(stock);
    setSharesInput('');
  };

  const handleConfirmShares = () => {
    if (!pendingStock) return;
    const shares = parseFloat(sharesInput);
    if (!shares || shares <= 0) return;

    setAddedStocks((prev) => {
      const next = new Map(prev);
      next.set(pendingStock.ticker, { stock: pendingStock, shares });
      return next;
    });
    onAddStock?.(pendingStock, shares);
    setPendingStock(null);
    setSharesInput('');
  };

  const handleCancelShares = () => {
    setPendingStock(null);
    setSharesInput('');
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
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={handleYieldConfirm} className="gap-2">
              Find Matching Stocks <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Matching stocks */}
      {step === 2 && (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Stocks Matching {localYield.toFixed(1)}%+ Yield</h2>
            <p className="text-sm text-muted-foreground">
              {matchingStocks.length} stock{matchingStocks.length !== 1 ? 's' : ''} found — select a stock then enter how many shares
            </p>
          </div>

          {/* Shares input prompt */}
          {pendingStock && (
            <Card className="p-5 border-primary/40 bg-primary/5 max-w-md mx-auto animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">How many shares of {pendingStock.ticker}?</p>
                  <p className="text-xs text-muted-foreground">{pendingStock.name} · {pendingStock.computedYield.toFixed(2)}% yield</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 10"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmShares()}
                  autoFocus
                  className="flex-1"
                />
                <Button size="sm" onClick={handleConfirmShares} disabled={!sharesInput || parseFloat(sharesInput) <= 0}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelShares}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {sharesInput && parseFloat(sharesInput) > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {parseFloat(sharesInput)} shares × ${pendingStock.currentPrice.toFixed(2)} = <span className="text-primary font-medium">${(parseFloat(sharesInput) * pendingStock.currentPrice).toFixed(2)}</span>
                </p>
              )}
            </Card>
          )}

          {matchingStocks.length === 0 ? (
            <Card className="p-6 text-center border-border/50">
              <p className="text-muted-foreground">
                No stocks in our catalog match a {localYield.toFixed(1)}% yield. Try lowering your target.
              </p>
              <Button variant="outline" onClick={() => setStep(1)} className="mt-4">
                Adjust Yield
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {matchingStocks.map((stock) => {
                const isAdded = addedStocks.has(stock.ticker);
                const isPending = pendingStock?.ticker === stock.ticker;
                const addedInfo = addedStocks.get(stock.ticker);
                return (
                  <Card
                    key={stock.ticker}
                    className={`p-4 border-border/50 transition-all duration-200 ${
                      isPending
                        ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                        : isAdded
                        ? 'bg-primary/5 border-primary/30'
                        : 'hover:border-primary/30 hover:bg-accent/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{stock.ticker}</span>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                            {stock.sector}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{stock.name}</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          {stock.computedYield.toFixed(2)}% yield
                        </p>
                        {isAdded && addedInfo && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {addedInfo.shares} shares added
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isAdded ? 'secondary' : isPending ? 'outline' : 'default'}
                        onClick={() => handleSelectStock(stock)}
                        disabled={isAdded}
                        className="shrink-0"
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setStep(1)}>
              Adjust Yield
            </Button>
            <Button variant="outline" onClick={onSelectStocks} className="gap-2">
              Search Other Stocks
            </Button>
            {addedStocks.size > 0 && (
              <Button className="gap-2">
                <Check className="w-4 h-4" />
                {addedStocks.size} Stock{addedStocks.size !== 1 ? 's' : ''} Added
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
