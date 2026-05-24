import { useEffect } from 'react';
import { StockAnalysis, Stock, ReplacementCandidate } from '@/types/portfolio';
import { formatPercentage } from '@/lib/portfolioUtils';
import { UnderperformersList } from './UnderperformersList';
import { ReplacementSuggestions } from './ReplacementSuggestions';
import { TrendingDown, MousePointerClick, AlertTriangle } from 'lucide-react';

interface UnderperformersPanelProps {
  underperformers: StockAnalysis[];
  selectedStock: Stock | null;
  onSelectStock: (stock: Stock) => void;
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
        ) : (
          <div className="p-8 rounded-xl border-[4px] border-dashed border-muted-foreground/40 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[200px]">
            <MousePointerClick className="w-8 h-8 mb-3 opacity-60" />
            <p className="text-sm font-medium">
              Select an underperforming stock to see replacement suggestions
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
