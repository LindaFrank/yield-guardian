import { useEffect } from 'react';
import { StockAnalysis, Stock, ReplacementCandidate } from '@/types/portfolio';
import { formatPercentage } from '@/lib/portfolioUtils';
import { UnderperformersList } from './UnderperformersList';
import { ReplacementSuggestions } from './ReplacementSuggestions';
import { TrendingDown, MousePointerClick, AlertTriangle, X } from 'lucide-react';

interface UnderperformersPanelProps {
  underperformers: StockAnalysis[];
  selectedStock: Stock | null;
  onSelectStock: (stock: Stock | null) => void;
  targetYield: number;
  candidates: ReplacementCandidate[];
  sharesYHeld: number;
  portfolioValue: number;
  portfolioIncome: number;
  onIncomeDeltaChange: (ticker: string, delta: number) => void;
  onAddStock: (stock: Stock, shares?: number) => void;
  onSwap: (candidate: Stock, buyShares: number, removeTicker: string, sellShares?: number) => void;
}

export function UnderperformersPanel({
  underperformers,
  selectedStock,
  onSelectStock,
  targetYield,
  candidates,
  sharesYHeld,
  portfolioValue,
  portfolioIncome,
  onIncomeDeltaChange,
  onAddStock,
  onSwap,
}: UnderperformersPanelProps) {
  if (underperformers.length === 0) {
    return (
      <UnderperformersList
        underperformers={underperformers}
        selectedStock={selectedStock}
        onSelectStock={onSelectStock}
        targetYield={targetYield}
      />
    );
  }

  const isSingle = underperformers.length === 1;
  const soleStock = isSingle ? underperformers[0].stock : null;

  // Auto-select when there's only one underperformer
  useEffect(() => {
    if (isSingle && soleStock && selectedStock?.ticker !== soleStock.ticker) {
      onSelectStock(soleStock);
    }
  }, [isSingle, soleStock, selectedStock, onSelectStock]);

  return (
    <section
      id="underperformers-section"
      className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-yield-negative scroll-mt-[180px] animate-fade-in"
    >
      <div className="flex items-center gap-2 mb-4 text-yield-negative">
        <TrendingDown className="w-5 h-5" />
        <h2 className="text-base font-bold uppercase tracking-wider">
          Underperformers &amp; Suggested Replacements
        </h2>
        <span className="ml-auto text-sm font-mono">{underperformers.length}</span>
      </div>

      {isSingle && soleStock ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border-[2px] border-yield-negative/60">
            <AlertTriangle className="w-5 h-5 text-yield-negative" />
            <span className="font-mono font-medium">{soleStock.ticker}</span>
            <span className="text-sm font-mono text-yield-negative">
              {formatPercentage(underperformers[0].currentYield)}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              Below your {formatPercentage(targetYield)} target
            </span>
          </div>

          <ReplacementSuggestions
            removedStock={soleStock}
            candidates={candidates}
            sharesYHeld={sharesYHeld}
            targetYield={targetYield}
            portfolioValue={portfolioValue}
            portfolioIncome={portfolioIncome}
            onIncomeDeltaChange={onIncomeDeltaChange}
            onAddStock={onAddStock}
            onSwap={onSwap}
          />
        </div>
      ) : (
        <>
          <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">
            Click a ticker on the left to see curated replacement suggestions on the right.
          </p>

          <div className="grid lg:grid-cols-2 gap-4">
            <UnderperformersList
              underperformers={underperformers}
              selectedStock={selectedStock}
              onSelectStock={onSelectStock}
              targetYield={targetYield}
            />

            {selectedStock ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onSelectStock(null)}
                  aria-label="Close replacement suggestions"
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-md border-[2px] border-muted-foreground/50 bg-secondary/80 backdrop-blur text-muted-foreground hover:text-foreground hover:border-muted-foreground/80 hover:bg-secondary transition-colors flex items-center justify-center shadow-card"
                >
                  <X className="w-4 h-4" />
                </button>
                <ReplacementSuggestions
                  removedStock={selectedStock}
                  candidates={candidates}
                  sharesYHeld={sharesYHeld}
                  targetYield={targetYield}
                  portfolioValue={portfolioValue}
                  portfolioIncome={portfolioIncome}
                  onIncomeDeltaChange={onIncomeDeltaChange}
                  onAddStock={onAddStock}
                  onSwap={onSwap}
                />
              </div>
            ) : (
              <div className="p-8 rounded-xl border-[4px] border-dashed border-muted-foreground/40 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[200px]">
                <MousePointerClick className="w-8 h-8 mb-3 opacity-60" />
                <p className="text-sm font-medium">
                  Select an underperforming stock to see replacement suggestions
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
