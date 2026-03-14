import { useState } from 'react';
import { Stock, StockAnalysis } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StockCardProps {
  analysis: StockAnalysis;
  sharesOwned?: number | null;
  onRemove?: (ticker: string) => void;
  onSelect?: (stock: Stock) => void;
  onUpdateShares?: (ticker: string, shares: number | null) => void;
  isSelected?: boolean;
}

export function StockCard({ analysis, sharesOwned, onRemove, onSelect, onUpdateShares, isSelected }: StockCardProps) {
  const { stock, currentYield, isStable, isUnderperforming, stabilityYears } = analysis;
  const [editing, setEditing] = useState(false);
  const [sharesInput, setSharesInput] = useState(sharesOwned?.toString() ?? '');

  const getYieldColor = () => {
    if (currentYield >= 5) return 'text-yield-positive';
    if (currentYield >= 3) return 'text-yield-warning';
    return 'text-yield-negative';
  };

  const getStabilityBadge = () => {
    switch (isStable) {
      case 'stable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yield-positive border border-yield-positive text-yield-positive">
            <CheckCircle2 className="w-3 h-3" />
            Stable ({stabilityYears}y)
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yield-warning border border-yield-warning text-yield-warning">
            <AlertTriangle className="w-3 h-3" />
            Caution
          </span>
        );
      case 'unstable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yield-negative border border-yield-negative text-yield-negative">
            <XCircle className="w-3 h-3" />
            Unstable
          </span>
        );
    }
  };

  const handleSaveShares = () => {
    const val = parseFloat(sharesInput);
    onUpdateShares?.(stock.ticker, val > 0 ? val : null);
    setEditing(false);
  };

  return (
    <div
      onClick={() => onSelect?.(stock)}
      className={cn(
        'group relative p-5 rounded-xl gradient-card shadow-card border border-muted-foreground/40',
        'transition-all duration-300 ease-out',
        'hover:shadow-elevated hover:border-primary/20 hover:-translate-y-0.5',
        isSelected && 'ring-2 ring-primary border-primary/40',
        isUnderperforming && 'border-yield-negative',
        onSelect && 'cursor-pointer'
      )}
    >
      {/* Underperforming indicator */}
      {isUnderperforming && (
        <div className="absolute -top-px -right-px">
          <div className="w-3 h-3 rounded-bl-lg rounded-tr-xl bg-yield-negative" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-lg text-foreground">
              {stock.ticker}
            </span>
            {getStabilityBadge()}
          </div>
          <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">{stock.sector}</p>
        </div>

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(stock.ticker);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            aria-label="Remove stock"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Price</p>
          <p className="font-mono font-medium">{formatCurrency(stock.currentPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Annual Div</p>
          <p className="font-mono font-medium">{formatCurrency(stock.annualDividend)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Shares</p>
          {editing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                type="number"
                min="0"
                step="1"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                className="h-7 w-16 text-xs px-1.5"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveShares(); if (e.key === 'Escape') setEditing(false); }}
              />
              <button onClick={handleSaveShares} className="p-0.5 rounded hover:bg-primary/10 text-primary">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSharesInput(sharesOwned?.toString() ?? '');
                setEditing(true);
              }}
              className="flex items-center gap-1 font-mono font-medium hover:text-primary transition-colors"
            >
              {sharesOwned != null ? sharesOwned : '—'}
              {onUpdateShares && <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60" />}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Yield</span>
          <div className={cn('flex items-center gap-1 font-mono font-semibold text-lg', getYieldColor())}>
            {currentYield >= 5 ? (
              <TrendingUp className="w-4 h-4" />
            ) : currentYield < 3 ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            {formatPercentage(currentYield)}
          </div>
        </div>
      </div>
    </div>
  );
}
