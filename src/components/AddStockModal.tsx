import { useState, useMemo } from 'react';
import { Stock } from '@/types/portfolio';
import { useStockSearch, SearchResult } from '@/hooks/useStockData';
import { calculateDividendYield, formatPercentage } from '@/lib/portfolioUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Plus, Search, Loader2, ChevronRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddStockModalProps {
  existingTickers: string[];
  onAddStock: (stock: Stock, shares?: number) => void;
  marketStocks?: Stock[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  suggestedStocks?: Stock[];
  targetYield?: number;
}

export function AddStockModal({ existingTickers, onAddStock, open: controlledOpen, onOpenChange, suggestedStocks, targetYield = 5 }: AddStockModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState<'search' | 'shares'>('search');
  const [selected, setSelected] = useState<Map<string, SearchResult>>(new Map());
  const [sharesMap, setSharesMap] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: results, isLoading } = useStockSearch(search);

  const filtered = (results ?? []).filter(
    (r) => !existingTickers.includes(r.symbol.toUpperCase())
  );

  // Build yield-based suggestions from live candidate stocks
  const yieldSuggestions = useMemo(() => {
    if (!suggestedStocks) return [];
    return suggestedStocks
      .filter((s) => !existingTickers.includes(s.ticker))
      .map((s) => ({
        stock: s,
        yield: s.currentYield > 0 ? s.currentYield : calculateDividendYield(s),
      }))
      .filter((s) => s.yield >= targetYield * 0.7)
      .sort((a, b) => b.yield - a.yield)
      .slice(0, 8);
  }, [suggestedStocks, existingTickers, targetYield]);

  const toggleSelect = (result: SearchResult) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(result.symbol)) {
        next.delete(result.symbol);
      } else {
        next.set(result.symbol, result);
      }
      return next;
    });
  };

  const handleSelectSuggestion = (stock: Stock) => {
    const result: SearchResult = {
      symbol: stock.ticker,
      name: stock.name,
      currency: 'USD',
      stockExchange: 'NYSE',
    };
    toggleSelect(result);
  };

  const handleProceedToShares = () => {
    const initial: Record<string, string> = {};
    selected.forEach((_, symbol) => { initial[symbol] = sharesMap[symbol] || ''; });
    setSharesMap(initial);
    setPhase('shares');
  };

  const handleConfirmAll = () => {
    setSubmitted(true);
    const entries = Array.from(selected.values());
    const allValid = entries.every((r) => {
      const val = parseFloat(sharesMap[r.symbol] || '');
      return val > 0;
    });
    if (!allValid) return;

    entries.forEach((result) => {
      const shares = parseFloat(sharesMap[result.symbol]);
      const stock: Stock = {
        ticker: result.symbol.toUpperCase(),
        name: result.name,
        sector: '',
        currentPrice: 0,
        annualDividend: 0,
        dividendHistory: [],
        currentYield: 0,
      };
      onAddStock(stock, shares);
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setOpen(false);
    setSearch('');
    setPhase('search');
    setSelected(new Map());
    setSharesMap({});
    setSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {phase === 'search' ? 'Add Stocks to Portfolio' : 'Enter Shares'}
          </DialogTitle>
        </DialogHeader>

        {phase === 'search' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search any ticker or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 mt-2">
              {/* Show yield-based suggestions when not searching */}
              {search.length === 0 && yieldSuggestions.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-1 pb-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Suggestions meeting your {formatPercentage(targetYield)} yield target</span>
                  </div>
                  {yieldSuggestions.map(({ stock, yield: stockYield }) => {
                    const isChecked = selected.has(stock.ticker);
                    return (
                      <div
                        key={stock.ticker}
                        onClick={() => handleSelectSuggestion(stock)}
                        role="button"
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left cursor-pointer',
                          isChecked
                            ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                            : 'bg-secondary/30 border-border/30 hover:border-primary/30 hover:bg-secondary/50'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleSelectSuggestion(stock)}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{stock.ticker}</span>
                            <span className={cn(
                              'font-mono text-sm',
                              stockYield >= targetYield ? 'text-yield-positive' : 'text-yield-warning'
                            )}>
                              {formatPercentage(stockYield)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{stock.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {search.length === 0 && yieldSuggestions.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Type a ticker or company name to search
                </p>
              )}

              {search.length > 0 && isLoading && (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching…
                </div>
              )}

              {search.length > 0 && !isLoading && filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No results found
                </p>
              )}

              {filtered.map((result) => {
                const isChecked = selected.has(result.symbol);
                return (
                  <div
                    key={result.symbol}
                    onClick={() => toggleSelect(result)}
                    role="button"
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left cursor-pointer ${
                      isChecked
                        ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                        : 'bg-secondary/30 border-border/30 hover:border-primary/30 hover:bg-secondary/50'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(result)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{result.symbol}</span>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                          {result.stockExchange}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{result.name}</p>
                    </div>
                    {isChecked && (
                      <Button
                        size="sm"
                        className="shrink-0 gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); handleProceedToShares(); }}
                      >
                        Enter Number of Shares
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

          </>
        )}

        {phase === 'shares' && (
          <>
            <p className="text-sm text-muted-foreground">
              How many shares of each stock do you own?
            </p>

            <div className="max-h-72 overflow-y-auto space-y-3 mt-2">
              {Array.from(selected.values()).map((result, idx) => {
                const val = sharesMap[result.symbol] || '';
                const numVal = parseFloat(val);
                const isInvalid = submitted && (!numVal || numVal <= 0);
                return (
                  <Card key={result.symbol} className={`p-3 border-border/50 ${isInvalid ? 'border-destructive/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono font-semibold">{result.symbol}</span>
                        <p className="text-xs text-muted-foreground line-clamp-1">{result.name}</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Shares"
                        value={val}
                        onChange={(e) => setSharesMap((prev) => ({ ...prev, [result.symbol]: e.target.value }))}
                        className="w-28"
                        autoFocus={idx === 0}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>

            {submitted && Array.from(selected.values()).some((r) => !(parseFloat(sharesMap[r.symbol] || '') > 0)) && (
              <p className="text-sm text-destructive text-center">Please enter a valid number of shares for all stocks.</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setSubmitted(false); setPhase('search'); }}>
                Back
              </Button>
              <Button className="flex-1 gap-2" onClick={handleConfirmAll}>
                <Check className="w-4 h-4" />
                Add {selected.size} Stock{selected.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
