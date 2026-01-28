import { StockAnalysis, Stock } from '@/types/portfolio';
import { formatPercentage } from '@/lib/portfolioUtils';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnderperformersListProps {
  underperformers: StockAnalysis[];
  selectedStock: Stock | null;
  onSelectStock: (stock: Stock) => void;
  targetYield: number;
}

export function UnderperformersList({ 
  underperformers, 
  selectedStock, 
  onSelectStock,
  targetYield 
}: UnderperformersListProps) {
  if (underperformers.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-yield-positive border border-yield-positive text-center">
        <p className="text-yield-positive font-medium">
          ✓ All stocks meet your {formatPercentage(targetYield)} yield target
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border border-yield-negative">
      <div className="flex items-center gap-2 mb-4 text-yield-negative">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">Underperforming Stocks</span>
        <span className="ml-auto text-sm font-mono">{underperformers.length}</span>
      </div>

      <div className="space-y-2">
        {underperformers.map((analysis) => (
          <button
            key={analysis.stock.ticker}
            onClick={() => onSelectStock(analysis.stock)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
              'bg-secondary/30 border border-border/30 hover:border-border/50',
              selectedStock?.ticker === analysis.stock.ticker && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium">{analysis.stock.ticker}</span>
              <span className={cn(
                'text-sm font-mono',
                analysis.currentYield < targetYield ? 'text-yield-negative' : 'text-yield-warning'
              )}>
                {formatPercentage(analysis.currentYield)}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
      
      <p className="mt-3 text-xs text-muted-foreground">
        Click a stock to see replacement suggestions
      </p>
    </div>
  );
}
