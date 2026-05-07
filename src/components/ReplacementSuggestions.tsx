import { useState, useMemo, useEffect } from 'react';
import { ReplacementCandidate, Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import {
  optimizeReplacement,
  toOptimizerCandidates,
  OptimizerMode,
  OptimizerResult,
} from '@/lib/optimizer';
import { ArrowRight, Plus, Sparkles, ShieldCheck, AlertTriangle, Check, X, TrendingUp, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReplacementSuggestionsProps {
  removedStock: Stock | null;
  candidates: ReplacementCandidate[];
  onAddStock: (stock: Stock, shares?: number) => void;
  /** total shares of the underperformer the user holds (for slider cap) */
  sharesYHeld?: number;
  /** target min yield (percent, e.g. 5 means 5%) */
  targetYield?: number;
  /** total portfolio market value — drives Conservative whole-portfolio yield target */
  portfolioValue?: number;
  /** total portfolio annual dividend income — drives Conservative whole-portfolio yield target */
  portfolioIncome?: number;
  /** notify parent of latest IncomeDelta_Y for portfolio-wide aggregation */
  onIncomeDeltaChange?: (ticker: string, incomeDelta: number) => void;
}

export function ReplacementSuggestions({
  removedStock,
  candidates,
  onAddStock,
  sharesYHeld = 0,
  targetYield = 5,
  portfolioValue,
  portfolioIncome,
  onIncomeDeltaChange,
}: ReplacementSuggestionsProps) {
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [sharesInput, setSharesInput] = useState('');

  // Per-card optimiser controls
  const [mode, setMode] = useState<OptimizerMode>('aggressive');
  const [diversify, setDiversify] = useState(false);
  const sliderMax = Math.max(1, Math.floor(sharesYHeld));
  const [sharesYSold, setSharesYSold] = useState<number>(sliderMax);

  // Reset slider when underperformer changes
  useEffect(() => {
    setSharesYSold(Math.max(1, Math.floor(sharesYHeld)));
  }, [removedStock?.ticker, sharesYHeld]);

  const optimizerCandidates = useMemo(
    () => toOptimizerCandidates(candidates.map((c) => c.stock)),
    [candidates],
  );

  const result: OptimizerResult | null = useMemo(() => {
    if (!removedStock) return null;
    if (optimizerCandidates.length === 0) return null;
    return optimizeReplacement({
      underperformer: removedStock,
      sharesYHeld,
      sharesYSold,
      candidates: optimizerCandidates,
      targetYield: targetYield / 100,
      mode,
      diversify,
    });
  }, [removedStock, sharesYHeld, sharesYSold, optimizerCandidates, targetYield, mode, diversify]);

  // Push IncomeDelta upward whenever it changes
  useEffect(() => {
    if (!removedStock || !onIncomeDeltaChange) return;
    onIncomeDeltaChange(removedStock.ticker, result?.status === 'ok' ? result.incomeDelta : 0);
  }, [result, removedStock, onIncomeDeltaChange]);

  const handlePlusClick = (ticker: string, prefillShares?: number) => {
    setEditingTicker(ticker);
    setSharesInput(prefillShares && prefillShares > 0 ? String(prefillShares) : '');
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
      <div className="p-8 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-medium">
            {isDefaultMode ? 'Matching Stocks' : 'Replacement Suggestions'}
          </span>
        </div>
        <p className="text-muted-foreground">
          {isDefaultMode
            ? 'No matching stocks currently exceed your target yield'
            : 'No replacement stocks meet your current yield target'}
        </p>
      </div>
    );
  }

  // Decide which candidates to display:
  // - With optimizer result: use sorted rows; suppress n=0 unless diversify is on.
  // - Without (default mode / no underperformer): show candidates as-is (already sorted by yield desc).
  const displayRows = result?.rows ?? null;

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-muted-foreground/50">

      {removedStock && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <span className="font-mono text-sm text-muted-foreground">{removedStock.ticker}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Showing alternatives</span>
          </div>

          {/* Optimiser controls */}
          <div className="mb-4 p-3 rounded-lg border-4 border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Replacement Strategy</span>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-md bg-secondary/40">
              <button
                onClick={() => setMode('aggressive')}
                className={cn(
                  'flex-1 text-xs font-medium py-1.5 px-2 rounded transition-colors border-4 border-muted-foreground/60',
                  mode === 'aggressive' ? 'bg-primary text-primary-foreground' : 'text-white hover:text-foreground',
                )}
              >
                Aggressive
              </button>
              <button
                onClick={() => setMode('conservative')}
                className={cn(
                  'flex-1 text-xs font-medium py-1.5 px-2 rounded transition-colors border-4 border-muted-foreground/60',
                  mode === 'conservative' ? 'bg-primary text-primary-foreground' : 'text-white hover:text-foreground',
                )}
              >
                Conservative
              </button>
            </div>
            <p className="text-[15px] text-foreground leading-snug">
                {mode === 'aggressive'
                  ? 'You want maximum income now.'
                  : 'You want the smallest trade that hits your yield target.'}
            </p>

            {/* Shares-to-sell slider (Aggressive only) */}
            {mode === 'aggressive' && sharesYHeld > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Shares of {removedStock.ticker} to sell</Label>
                  <span className="text-xs font-mono text-primary">{sharesYSold} / {sliderMax}</span>
                </div>
                <Slider
                  value={[sharesYSold]}
                  onValueChange={([v]) => setSharesYSold(v)}
                  min={0}
                  max={sliderMax}
                  step={1}
                />
              </div>
            )}
            {mode === 'aggressive' && sharesYHeld <= 0 && (
              <p className="text-[11px] text-amber-500">
                Add a share count to {removedStock.ticker} to use the slider — defaulting to 1 share.
              </p>
            )}

            {/* Diversification toggle */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label htmlFor="diversify-switch" className="text-sm font-semibold">Force diversification</Label>
                <p className="text-[12px] text-muted-foreground">Spread across multiple stocks to reduce risk.</p>
              </div>
              <Switch
                id="diversify-switch"
                checked={diversify}
                onCheckedChange={setDiversify}
                className="border-[4px] data-[state=unchecked]:border-muted-foreground/60 [&>span]:bg-white"
              />
            </div>

            {/* Result summary */}
            {result && result.status === 'ok' && (
              <div className="pt-2 border-t border-border/50 space-y-1 text-[15px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sell {result.sharesYSold} shares {removedStock.ticker}</span>
                  <span className="font-mono">{formatCurrency(result.investmentY)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reallocate</span>
                  <span className="font-mono">{formatCurrency(result.totalCost)}{result.leftoverCash > 0.01 && ` (+${formatCurrency(result.leftoverCash)} cash)`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New yield on position</span>
                  <span className={cn(
                    'font-mono',
                    result.newYield * 100 >= targetYield ? 'text-yield-positive' : 'text-yield-warning',
                  )}>
                    {formatPercentage(result.newYield * 100)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                        <TrendingUp className="w-3 h-3 text-yield-positive" />
                        Estimated Annual Income Increase
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      collisionPadding={12}
                      className="max-w-[240px] text-xs leading-snug break-words"
                    >
                      Projected, not guaranteed. Based on current declared dividend rates, which issuers may cut, suspend, or change at any time.
                    </TooltipContent>
                  </Tooltip>
                  <span className={cn(
                    'font-mono',
                    result.incomeDelta >= 0 ? 'text-yield-positive' : 'text-yield-negative',
                  )}>
                    {result.incomeDelta >= 0 ? '+' : ''}{formatCurrency(result.incomeDelta)}/yr
                  </span>
                </div>
                <p className="text-[12px] italic text-muted-foreground leading-snug pt-1">
                  Projection based on current declared dividend rates. Actual income may differ — issuers can cut, suspend, or change distributions at any time, and monthly cash flow depends on each holding's payment calendar.
                </p>
              </div>
            )}
            {result && result.status === 'infeasible' && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-[11px] text-yield-negative">{result.message}</p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-3">
        {(() => {
          const baseRows = displayRows
            ? [...displayRows]
            : candidates.map((c) => ({ stock: c.stock, shares: 0, cost: 0, income: 0 }));

          // Conservative mode: show all candidates (up to 5), ordered ascending by yield
          // so the stocks closest to the user's target appear first.
          if (mode === 'conservative' && removedStock) {
            baseRows.sort((a, b) => {
              const yA = (a.stock.annualDividend / a.stock.currentPrice) * 100;
              const yB = (b.stock.annualDividend / b.stock.currentPrice) * 100;
              return yA - yB;
            });
          }

          return baseRows;
        })().map((row, idx) => {
          // Find matching ReplacementCandidate metadata for display badges
          const meta = candidates.find((c) => c.stock.ticker === row.stock.ticker);
          const yieldVal = meta?.yield ?? (row.stock.annualDividend / row.stock.currentPrice) * 100;
          const stabilityScore = meta?.stabilityScore ?? 2;
          const matchReason = meta?.matchReason;

          // Hide rows where solver picked 0 unless diversification is on,
          // EXCEPT in conservative mode where we always show all candidates.
          if (displayRows && row.shares === 0 && !diversify && mode !== 'conservative') return null;

          return (
            <div
              key={row.stock.ticker}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border-[4px] border-muted-foreground/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-medium">{row.stock.ticker}</span>
                  <span className={cn(
                    'font-mono text-sm',
                    yieldVal >= 5 ? 'text-yield-positive' : yieldVal >= 3.5 ? 'text-yield-warning' : 'text-yield-negative'
                  )}>
                    {formatPercentage(yieldVal)}
                  </span>
                  {stabilityScore >= 3 ? (
                    <Badge variant="outline" className="text-[14px] px-1.5 py-0 border-emerald-500/50 text-emerald-500 gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      Stable
                    </Badge>
                  ) : stabilityScore <= 1 ? (
                    <Badge variant="outline" className="text-[14px] px-1.5 py-0 border-amber-500/50 text-amber-500 gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      Caution
                    </Badge>
                  ) : null}
                  {displayRows && (() => {
                    let buyN = row.shares;
                    if (buyN === 0 && mode === 'conservative' && result?.status === 'ok' && row.stock.currentPrice > 0) {
                      buyN = Math.floor(result.investmentY / row.stock.currentPrice);
                    }
                    if (buyN <= 0) return null;
                    return (
                      <Badge variant="outline" className="text-[14px] px-1.5 py-0 border-primary/50 text-primary">
                        Buy {buyN}
                      </Badge>
                    );
                  })()}
                </div>
                <p className="text-[15px] text-muted-foreground truncate mt-0.5">
                  {row.stock.name}
                </p>
                {matchReason && <p className="text-[15px] text-primary/80 mt-1">{matchReason}</p>}
                {displayRows && (() => {
                  // In conservative mode, project the same trade into THIS card's ticker
                  // so every replacement shows the same income breakdown as the solver pick.
                  let projShares = row.shares;
                  let projCost = row.cost;
                  let projIncome = row.income;
                  if (row.shares === 0 && mode === 'conservative' && result?.status === 'ok') {
                    projShares = Math.floor(result.investmentY / row.stock.currentPrice);
                    if (projShares <= 0) return null;
                    projCost = projShares * row.stock.currentPrice;
                    projIncome = projShares * row.stock.annualDividend;
                  }
                  if (projShares <= 0) return null;

                  // Year-to-date proration based on today's date
                  const now = new Date();
                  const startOfYear = new Date(now.getFullYear(), 0, 1);
                  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
                  const yearMs = endOfYear.getTime() - startOfYear.getTime();
                  const fracElapsed = (now.getTime() - startOfYear.getTime()) / yearMs;
                  const fracRemain = 1 - fracElapsed;

                  const oldAnnual = removedStock ? sharesYHeld * removedStock.annualDividend : 0;
                  const remainingOldAnnual = removedStock
                    ? Math.max(0, sharesYHeld - sharesYSold) * removedStock.annualDividend
                    : 0;

                  const incomeSoFar = oldAnnual * fracElapsed;
                  const afterSwitchRest = (remainingOldAnnual + projIncome) * fracRemain;
                  const totalThisYear = incomeSoFar + afterSwitchRest;
                  const nextFullYear = remainingOldAnnual + projIncome;

                  return (
                    <div className="text-[15px] text-muted-foreground mt-1 space-y-0.5">
                      <p>Buying {projShares.toLocaleString()} shares at {formatCurrency(row.stock.currentPrice)} each</p>
                      <p>Total invested: <span className="font-mono">{formatCurrency(projCost)}</span></p>
                      <div className="pt-1 mt-1 border-t border-border/40 space-y-0.5">
                        <p className="flex justify-between gap-3">
                          <span>Income this year (so far): {removedStock?.ticker}</span>
                          <span className="font-mono">{formatCurrency(incomeSoFar)}</span>
                        </p>
                        <p className="flex justify-between gap-3">
                          <span>After switch (rest of year)</span>
                          <span className="font-mono">{formatCurrency(afterSwitchRest)}</span>
                        </p>
                        <p className="flex justify-between gap-3 font-medium text-foreground">
                          <span>Total this year</span>
                          <span className="font-mono">{formatCurrency(totalThisYear)}</span>
                        </p>
                        <p className="flex justify-between gap-3 font-medium">
                          <span>Next full year income</span>
                          <span className="font-mono text-yield-positive">{formatCurrency(nextFullYear)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {editingTicker === row.stock.ticker ? (
                <div className="flex items-center gap-1.5 ml-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Shares"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirm(row.stock);
                      if (e.key === 'Escape') handleCancel();
                    }}
                    className="w-20 h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleConfirm(row.stock)}
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
                  onClick={() => handlePlusClick(row.stock.ticker, row.shares)}
                  className="ml-2 hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
