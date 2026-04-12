import { useState } from 'react';
import { ReplacementCandidate, Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import { ArrowRight, Plus, Sparkles, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ReplacementSuggestionsProps {
  removedStock: Stock | null;
  candidates: ReplacementCandidate[];
  onAddStock: (stock: Stock, shares?: number) => void;
}

export function ReplacementSuggestions({ 
  removedStock, 
  candidates, 
  onAddStock 
}: ReplacementSuggestionsProps) {
  const [enteringShares, setEnteringShares] = useState<string | null>(null);
  const [sharesValue, setSharesValue] = useState('');

  const handleConfirm = (stock: Stock) => {
    const shares = parseFloat(sharesValue);
    if (shares > 0) {
      onAddStock(stock, shares);
      setEnteringShares(null);
      setSharesValue('');
    }
  };

  if (!removedStock || candidates.length === 0) {
    return (
      <div className="p-8 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 text-center transition-all hover:scale-[1.02] active:scale-[0.97]">
        <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          Select an underperforming stock to see replacement suggestions
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 transition-all hover:scale-[1.02] active:scale-[0.97]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-medium">Replacement Suggestions</span>
      </div>
      
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border-[4px] border-muted-foreground/50">
        <span className="font-mono text-sm text-muted-foreground">{removedStock.ticker}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Showing alternatives</span>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => {
          const isEntering = enteringShares === candidate.stock.ticker;
          return (
            <div
              key={candidate.stock.ticker}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border-[4px] border-muted-foreground/50 hover:border-muted-foreground/70 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{candidate.stock.ticker}</span>
                  <span className={cn(
                    'font-mono text-sm',
                    candidate.yield >= 5 ? 'text-yield-positive' : candidate.yield >= 3.5 ? 'text-yield-warning' : 'text-yield-negative'
                  )}>
                    {formatPercentage(candidate.yield)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {candidate.stock.name}
                </p>
                <p className="text-xs text-primary/80 mt-1">{candidate.matchReason}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {isEntering ? (
                  <>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Shares"
                      value={sharesValue}
                      onChange={(e) => setSharesValue(e.target.value)}
                      className="w-20 h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(candidate.stock); }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(candidate.stock)}
                      disabled={!(parseFloat(sharesValue) > 0)}
                      className="gap-1 h-8"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEnteringShares(candidate.stock.ticker); setSharesValue(''); }}
                    className="hover:bg-primary/10 hover:text-primary gap-1 text-xs"
                  >
                    Enter Number of Shares
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
