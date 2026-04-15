import { useState } from 'react';
import { ReplacementCandidate, Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import { ArrowRight, Plus, Sparkles, ShieldCheck, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [sharesInput, setSharesInput] = useState('');

  const handlePlusClick = (ticker: string) => {
    setEditingTicker(ticker);
    setSharesInput('');
  };

  const handleConfirm = (stock: Stock) => {
    const shares = parseFloat(sharesInput);
    if (!(shares > 0)) {
      toast.error(`Please enter a valid number of shares for ${stock.ticker}`);
      return;
    }
    onAddStock(stock, shares);
    setEditingTicker(null);
    setSharesInput('');
  };

  const handleCancel = () => {
    setEditingTicker(null);
    setSharesInput('');
  };

  const isDefaultMode = !removedStock;

  if (candidates.length === 0) {
    return (
      <div className="p-8 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 text-center transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.97]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {isDefaultMode ? 'Matching Stocks' : 'Replacement Suggestions'}
        </div>
        <p className="text-muted-foreground">
          {isDefaultMode
            ? 'No matching stocks currently exceed your target yield'
            : 'No replacement stocks meet your current yield target'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 transition-all duration-200 hover:scale-[1.01] hover:-translate-y-1 active:scale-[0.98]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-medium">
          {isDefaultMode ? 'Matching Stocks' : 'Replacement Suggestions'}
      </div>
      
      {removedStock && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <span className="font-mono text-sm text-muted-foreground">{removedStock.ticker}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Showing alternatives</span>
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.stock.ticker}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border-[4px] border-muted-foreground/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-medium">{candidate.stock.ticker}</span>
                <span className={cn(
                  'font-mono text-sm',
                  candidate.yield >= 5 ? 'text-yield-positive' : candidate.yield >= 3.5 ? 'text-yield-warning' : 'text-yield-negative'
                )}>
                  {formatPercentage(candidate.yield)}
                </span>
                {candidate.stabilityScore >= 3 ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/50 text-emerald-500 gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Stable
                  </Badge>
                ) : candidate.stabilityScore <= 1 ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-500 gap-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    Caution
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {candidate.stock.name}
              </p>
              <p className="text-xs text-primary/80 mt-1">{candidate.matchReason}</p>
            </div>

            {editingTicker === candidate.stock.ticker ? (
              <div className="flex items-center gap-1.5 ml-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Shares"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm(candidate.stock);
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="w-20 h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleConfirm(candidate.stock)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePlusClick(candidate.stock.ticker)}
                className="ml-2 hover:bg-primary/10 hover:text-primary"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
