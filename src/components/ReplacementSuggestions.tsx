import { useState, useMemo, useEffect } from 'react';
import { ReplacementCandidate, Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import {
  optimizeReplacement,
  toOptimizerCandidates,
  OptimizerMode,
  OptimizerResult,
} from '@/lib/optimizer';
import { ArrowRight, Plus, Sparkles, ShieldCheck, AlertTriangle, Check, X, TrendingUp, Wand2, ArrowRightCircle, StickyNote, Printer, Mail } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@/components/ui/popover';
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
  /** Swap action: buy `buyShares` of `candidate` and sell `sellShares` of `removeTicker`. */
  onSwap?: (candidate: Stock, buyShares: number, removeTicker: string, sellShares?: number) => void;
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
  onSwap,
  sharesYHeld = 0,
  targetYield = 5,
  portfolioValue,
  portfolioIncome,
  onIncomeDeltaChange,
}: ReplacementSuggestionsProps) {
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [sharesInput, setSharesInput] = useState('');
  const [compareTicker, setCompareTicker] = useState<string | null>(null);

  // Per-card optimiser controls
  const [mode, setMode] = useState<OptimizerMode>('aggressive');
  const [diversify, setDiversify] = useState(false);
  const sliderMax = Math.max(1, Math.floor(sharesYHeld));
  const [sharesYSold, setSharesYSold] = useState<number>(sliderMax);

  // Reset comparison ticker when underperformer changes
  useEffect(() => {
    setCompareTicker(null);
  }, [removedStock?.ticker]);

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
      portfolioValue,
      portfolioIncome,
    });
  }, [removedStock, sharesYHeld, sharesYSold, optimizerCandidates, targetYield, mode, diversify, portfolioValue, portfolioIncome]);

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
          <div className="inline-flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50 w-[35.46rem] max-w-full">
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
            {result && result.status === 'ok' && (() => {
              // Compute override values when user picks a single comparison stock
              const optimizerPicks = result.rows.filter((r) => r.shares > 0);
              const selectedRow = compareTicker
                ? result.rows.find((r) => r.stock.ticker === compareTicker)
                : null;
              const compareStock = selectedRow?.stock ?? optimizerPicks[0]?.stock ?? result.rows[0]?.stock ?? null;

              // When user explicitly chose a stock, recompute as buying max shares of just that one
              const isOverride = !!compareTicker && !!compareStock;
              const overrideShares = isOverride
                ? Math.floor(result.investmentY / compareStock!.currentPrice)
                : 0;
              const overrideCost = isOverride ? overrideShares * compareStock!.currentPrice : 0;
              const overrideIncome = isOverride ? overrideShares * compareStock!.annualDividend : 0;

              const effectiveTotalCost = isOverride ? overrideCost : result.totalCost;
              const effectiveLeftover = isOverride ? result.investmentY - overrideCost : result.leftoverCash;
              const effectiveNewIncome = isOverride ? overrideIncome : result.newIncome;
              const effectiveIncomeDelta = effectiveNewIncome - result.lostIncome;
              const effectiveNewYield = result.investmentY > 0 ? effectiveNewIncome / result.investmentY : 0;
              const effectiveNewPortfolioYield =
                result.newPortfolioYield !== undefined && portfolioValue && portfolioIncome !== undefined
                  ? (portfolioIncome + effectiveIncomeDelta) / portfolioValue
                  : result.newPortfolioYield;

              const allocationPicks = isOverride
                ? [{ stock: compareStock!, shares: overrideShares }]
                : optimizerPicks.map((r) => ({ stock: r.stock, shares: r.shares }));

              return (
              <div className="pt-2 border-t border-border/50 space-y-1 text-[15px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sell {result.sharesYSold} shares {removedStock.ticker}</span>
                  <span className="font-mono">{formatCurrency(result.investmentY)}</span>
                </div>

                {/* Side-by-side: rest-of-year dividends, Keep vs Switch */}
                {(() => {
                  const now = new Date();
                  const yearEnd = new Date(now.getFullYear(), 11, 31);
                  const startOfYear = new Date(now.getFullYear(), 0, 1);
                  const fracRemaining = Math.max(
                    0,
                    Math.min(1, (yearEnd.getTime() - now.getTime()) / (yearEnd.getTime() - startOfYear.getTime())),
                  );
                  const keepIncome = result.sharesYSold * removedStock.annualDividend * fracRemaining;
                  const switchIncome = effectiveNewIncome * fracRemaining;

                  const switchLabel = isOverride
                    ? `${overrideShares} ${compareStock!.ticker}`
                    : optimizerPicks.length === 1
                      ? `${optimizerPicks[0].shares} ${optimizerPicks[0].stock.ticker}`
                      : optimizerPicks.map((r) => `${r.shares} ${r.stock.ticker}`).join(' + ');

                  const delta = switchIncome - keepIncome;
                  const allTickers = result.rows.map((r) => r.stock.ticker);
                  const activeTicker = compareTicker ?? '__optimizer__';

                  return (
                    <div className="my-2 space-y-2">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground text-center">
                        Rest-of-year dividend comparison
                      </div>
                      {allTickers.length > 1 && (
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Compare against
                          </label>
                          <select
                            value={activeTicker}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCompareTicker(v === '__optimizer__' ? null : v);
                            }}
                            className="text-xs font-mono bg-secondary/40 border-2 border-muted-foreground/40 rounded px-1.5 py-1 text-foreground hover:border-primary/50 focus:outline-none focus:border-primary"
                          >
                            <option value="__optimizer__">Smart pick</option>
                            {allTickers.map((t) => {
                              const isHeld = candidates.find((c) => c.stock.ticker === t)?.alreadyHeld;
                              return (
                                <option key={t} value={t}>
                                  {t}{isHeld ? '  (ALREADY HELD)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-md border-[3px] border-yield-negative/70 bg-yield-negative/10 shadow-card">
                          <div className="text-[13px] uppercase tracking-wide text-yield-negative font-bold leading-tight">
                            IF YOU KEEP<br/>{removedStock.ticker}
                          </div>
                          <div className="font-mono font-bold text-lg mt-1 text-yield-negative">
                            {formatCurrency(keepIncome)}
                          </div>
                          <div className="text-[11px] text-foreground/80 font-medium">rest-of-year div</div>
                        </div>
                        <div className={cn(
                          'p-3 rounded-md border-[3px] shadow-card',
                          delta >= 0 ? 'border-yield-positive/70 bg-yield-positive/10' : 'border-yield-negative/70 bg-yield-negative/10',
                        )}>
                          <div className={cn(
                            'text-[13px] uppercase tracking-wide font-bold leading-tight',
                            delta >= 0 ? 'text-yield-positive' : 'text-yield-negative',
                          )}>
                            IF YOU SWITCH TO<br/>{switchLabel}
                          </div>
                          <div className={cn(
                            'font-mono font-bold text-lg mt-1',
                            delta >= 0 ? 'text-yield-positive' : 'text-yield-negative',
                          )}>
                            {formatCurrency(switchIncome)}
                          </div>
                          <div className="text-[11px] text-foreground/80 font-medium">
                            rest-of-year div (<span className={cn('font-bold text-[13px]', delta >= 0 ? 'text-yield-positive' : 'text-yield-negative')}>{delta >= 0 ? '+' : ''}{formatCurrency(delta)}</span>)
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })()}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reallocate</span>
                  <span className="font-mono">{formatCurrency(effectiveTotalCost)}{effectiveLeftover > 0.01 && ` (+${formatCurrency(effectiveLeftover)} cash)`}</span>
                </div>
                {allocationPicks.length > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Allocation breakdown</span>
                    <span className="font-mono text-right">
                      {allocationPicks.map((r) => `Buy ${r.shares} ${r.stock.ticker}`).join(' + ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {mode === 'conservative' && effectiveNewPortfolioYield !== undefined
                      ? 'New portfolio yield'
                      : 'New yield on reallocated dollars'}
                  </span>
                  <span className={cn(
                    'font-mono',
                    ((mode === 'conservative' && effectiveNewPortfolioYield !== undefined
                      ? effectiveNewPortfolioYield
                      : effectiveNewYield) * 100) >= targetYield
                      ? 'text-yield-positive'
                      : 'text-yield-warning',
                  )}>
                    {formatPercentage(
                      (mode === 'conservative' && effectiveNewPortfolioYield !== undefined
                        ? effectiveNewPortfolioYield
                        : effectiveNewYield) * 100,
                    )}
                  </span>
                </div>
                {mode === 'conservative' && result.message && (
                  <p className="text-[12px] text-amber-500 leading-snug pt-1">{result.message}</p>
                )}
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
                    effectiveIncomeDelta >= 0 ? 'text-yield-positive' : 'text-yield-negative',
                  )}>
                    {effectiveIncomeDelta >= 0 ? '+' : ''}{formatCurrency(effectiveIncomeDelta)}/yr
                  </span>
                </div>
                <p className="text-[12px] italic text-muted-foreground leading-snug pt-1">
                  Projection based on current declared dividend rates. Actual income may differ — issuers can cut, suspend, or change distributions at any time, and monthly cash flow depends on each holding's payment calendar.
                </p>
              </div>
              );
            })()}
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
          const alreadyHeld = meta?.alreadyHeld ?? false;

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
                  {alreadyHeld && (
                    <Badge
                      variant="outline"
                      className="text-[14px] px-1.5 py-0 border-amber-500/50 text-amber-500 gap-0.5"
                      title="You already own this ticker. Diversification across different holdings is preferred, but you can add more if you'd like."
                    >
                      Already held–diversification preferred
                    </Badge>
                  )}
                  {displayRows && (() => {
                    let buyN = row.shares;
                    if (buyN === 0 && mode === 'conservative' && result?.status === 'ok' && row.stock.currentPrice > 0) {
                      buyN = Math.floor(result.investmentY / row.stock.currentPrice);
                    }
                    if (buyN <= 0) return null;
                    return (
                      <>
                        {removedStock && (() => {
                          const sellShares = Math.max(
                            1,
                            Math.floor(result?.sharesYSold ?? sharesYHeld),
                          );
                          const subject = `Brokerage swap: sell ${removedStock.ticker}, buy ${row.stock.ticker}`;
                          const bodyText =
                            `Execute in your brokerage:\n\n` +
                            `1. Liquidate ${sellShares} shares of ${removedStock.ticker} (${removedStock.name}).\n` +
                            `2. Purchase ${buyN.toLocaleString()} shares of ${row.stock.ticker} (${row.stock.name}).\n\n` +
                            `Once trades settle, return to Yield Guardian and click "Next" to update your portfolio.`;
                          const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
                          const handleEmail = async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            try {
                              await navigator.clipboard.writeText(`Subject: ${subject}\n\n${bodyText}`);
                              toast.success('Instructions copied to clipboard', {
                                description: 'Paste into any email — or use the Gmail/Outlook links below.',
                                action: {
                                  label: 'Open Gmail',
                                  onClick: () => window.open(gmailUrl, '_blank', 'noopener,noreferrer'),
                                },
                                duration: 8000,
                              });
                            } catch {
                              toast.error('Could not copy. Try Print instead.');
                            }
                          };
                          const handlePrint = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            const w = window.open('', '_blank', 'width=600,height=700');
                            if (!w) {
                              toast.error('Pop-up blocked. Please allow pop-ups to print.');
                              return;
                            }
                            w.document.write(`<!doctype html><html><head><title>${subject}</title>
                              <style>body{font-family:Arial,sans-serif;padding:24px;color:#111;max-width:560px;margin:auto}
                              h1{font-size:18px;border-bottom:2px solid #eab308;padding-bottom:8px}
                              ol{line-height:1.7;font-size:14px} .mono{font-family:monospace;font-weight:600}
                              .note{font-size:12px;color:#555;font-style:italic;margin-top:16px;border-top:1px solid #ddd;padding-top:8px}
                              </style></head><body>
                              <h1>Execute in your brokerage</h1>
                              <p>Log in to your brokerage account and place these two trades:</p>
                              <ol>
                                <li>Liquidate <span class="mono">${sellShares}</span> shares of underperforming <span class="mono">${removedStock.ticker}</span> (${removedStock.name}).</li>
                                <li>Purchase <span class="mono">${buyN.toLocaleString()}</span> shares of <span class="mono">${row.stock.ticker}</span> (${row.stock.name}).</li>
                              </ol>
                              <p class="note">Once trades settle, return to Yield Guardian and click "Next" to update your portfolio.</p>
                              </body></html>`);
                            w.document.close();
                            w.focus();
                            setTimeout(() => w.print(), 250);
                          };
                          return (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className={cn(
                                    'flex items-center gap-1 px-2 py-1 rounded-md shadow-elevated',
                                    'bg-yellow-200 text-yellow-950 border-2 border-yellow-500/70',
                                    'hover:scale-110 transition-all',
                                    'text-[11px] font-semibold uppercase tracking-wide',
                                  )}
                                  aria-label={`Instructions to broker for swap to ${row.stock.ticker}`}
                                  title="Click for brokerage directions"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <StickyNote className="w-3 h-3" />
                                  Instructions to Broker
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="end"
                                side="bottom"
                                className="w-80 p-0 border-2 border-yellow-500/70 bg-yellow-50 text-yellow-950 shadow-elevated"
                              >
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-yellow-500/40">
                                    <div className="flex items-center gap-2">
                                      <StickyNote className="w-4 h-4" />
                                      <span className="text-sm font-bold uppercase tracking-wide">
                                        Execute in your brokerage
                                      </span>
                                    </div>
                                    <PopoverClose
                                      className="rounded-sm p-0.5 text-yellow-950/70 hover:bg-yellow-300/60 hover:text-yellow-950 transition-colors"
                                      aria-label="Close"
                                    >
                                      <X className="w-4 h-4" />
                                    </PopoverClose>
                                  </div>
                                  <p className="text-xs">
                                    Log in to your brokerage account and place these two trades:
                                  </p>
                                  <ol className="space-y-2 text-sm">
                                    <li className="flex gap-2">
                                      <span className="font-bold">1.</span>
                                      <span>
                                        Liquidate{' '}
                                        <span className="font-mono font-semibold">{sellShares}</span>{' '}
                                        shares of underperforming{' '}
                                        <span className="font-mono font-semibold">{removedStock.ticker}</span>{' '}
                                        ({removedStock.name}).
                                      </span>
                                    </li>
                                    <li className="flex gap-2">
                                      <span className="font-bold">2.</span>
                                      <span>
                                        Purchase{' '}
                                        <span className="font-mono font-semibold">{buyN.toLocaleString()}</span>{' '}
                                        shares of{' '}
                                        <span className="font-mono font-semibold">{row.stock.ticker}</span>{' '}
                                        ({row.stock.name}).
                                      </span>
                                    </li>
                                  </ol>
                                  <p className="text-[11px] italic opacity-80 pt-1 border-t border-yellow-500/40">
                                    Once your brokerage trades settle, click "Next" to update your portfolio here.
                                  </p>
                                  <div className="flex gap-2 pt-2 border-t border-yellow-500/40">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 h-8 text-xs gap-1 bg-white"
                                      onClick={handlePrint}
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      Print
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 h-8 text-xs gap-1 bg-white"
                                      onClick={handleEmail}
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      Email
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })()}
                        {removedStock && onSwap && (
                          <Button
                            size="sm"
                            onClick={() => {
                              onSwap(row.stock, buyN, removedStock.ticker, result?.sharesYSold ?? sharesYHeld);
                            }}
                            className="h-7 px-2.5 text-xs gap-1"
                          >
                            Complete Transaction
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </>
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

                  // In conservative mode the solver picks its own sharesYSold; honor that over the slider.
                  const effectiveSold = mode === 'conservative' && result?.status === 'ok'
                    ? result.sharesYSold
                    : sharesYSold;
                  const oldAnnual = removedStock ? sharesYHeld * removedStock.annualDividend : 0;
                  const remainingOldAnnual = removedStock
                    ? Math.max(0, sharesYHeld - effectiveSold) * removedStock.annualDividend
                    : 0;

                  const incomeSoFar = oldAnnual * fracElapsed;
                  const keptOldRest = remainingOldAnnual * fracRemain;
                  const newRest = projIncome * fracRemain;
                  const afterSwitchRest = keptOldRest + newRest;
                  const totalThisYear = incomeSoFar + afterSwitchRest;
                  const nextFullYear = remainingOldAnnual + projIncome;
                  const lastYearAnnual = oldAnnual; // baseline = full holding's annual div
                  const sharesKept = removedStock ? Math.max(0, sharesYHeld - effectiveSold) : 0;
                  const meetsLastYear = nextFullYear >= lastYearAnnual;

                  return (
                    <div className="text-[15px] text-muted-foreground mt-1 space-y-0.5">
                      <p>Buying {projShares.toLocaleString()} shares at {formatCurrency(row.stock.currentPrice)} each</p>
                      <p>Total invested: <span className="font-mono">{formatCurrency(projCost)}</span></p>
                      <div className="pt-1 mt-1 border-t border-border/40 space-y-0.5">
                        <p className="flex justify-between gap-3">
                          <span>Income this year (so far): {removedStock?.ticker}</span>
                          <span className="font-mono">{formatCurrency(incomeSoFar)}</span>
                        </p>
                        {sharesKept > 0 && (
                          <p className="flex justify-between gap-3">
                            <span>Kept {sharesKept} {removedStock?.ticker} (rest of year)</span>
                            <span className="font-mono">{formatCurrency(keptOldRest)}</span>
                          </p>
                        )}
                        <p className="flex justify-between gap-3">
                          <span>New {projShares.toLocaleString()} {row.stock.ticker} (rest of year)</span>
                          <span className="font-mono">{formatCurrency(newRest)}</span>
                        </p>
                        <p className="flex justify-between gap-3 font-medium text-foreground">
                          <span>Total this year</span>
                          <span className="font-mono">{formatCurrency(totalThisYear)}</span>
                        </p>
                        <p className="flex justify-between gap-3 font-medium">
                          <span>Next full year income</span>
                          <span className={`font-mono ${meetsLastYear ? 'text-yield-positive' : 'text-yield-negative'}`}>{formatCurrency(nextFullYear)}</span>
                        </p>
                        <p className="flex justify-between gap-3 text-[13px]">
                          <span className="text-muted-foreground">vs last year ({formatCurrency(lastYearAnnual)})</span>
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
