import { ReplacementCandidate, Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import { ArrowRight, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReplacementSuggestionsProps {
  removedStock: Stock | null;
  candidates: ReplacementCandidate[];
  onAddStock: (stock: Stock) => void;
}

export function ReplacementSuggestions({ 
  removedStock, 
  candidates, 
  onAddStock 
}: ReplacementSuggestionsProps) {
  if (!removedStock || candidates.length === 0) {
    return (
      <div className="p-8 rounded-xl gradient-card shadow-card border border-border/50 text-center">
        <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          Select an underperforming stock to see replacement suggestions
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-medium">Replacement Suggestions</span>
      </div>
      
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
        <span className="font-mono text-sm text-muted-foreground">{removedStock.ticker}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Showing alternatives</span>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.stock.ticker}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30 hover:border-border/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{candidate.stock.ticker}</span>
                <span className={cn(
                  'font-mono text-sm',
                  candidate.yield >= 5 ? 'text-yield-positive' : 'text-yield-warning'
                )}>
                  {formatPercentage(candidate.yield)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {candidate.stock.name}
              </p>
              <p className="text-xs text-primary/80 mt-1">{candidate.matchReason}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddStock(candidate.stock)}
              className="ml-2 hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
