import { useState } from 'react';
import { Stock } from '@/types/portfolio';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { StickyNote, ArrowRight, Check } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import { cn } from '@/lib/utils';

interface StockCardDirectionsNoteProps {
  underperformer: Stock;
  sharesHeld: number;
  topCandidate: Stock | null;
  targetYield: number;
  onSwap?: (candidate: Stock, buyShares: number, removeTicker: string) => void;
}

export function StockCardDirectionsNote({
  underperformer,
  sharesHeld,
  topCandidate,
  targetYield,
  onSwap,
}: StockCardDirectionsNoteProps) {
  const [open, setOpen] = useState(false);

  if (!topCandidate || sharesHeld <= 0) return null;

  const proceeds = sharesHeld * underperformer.currentPrice;
  const buyShares = Math.floor(proceeds / topCandidate.currentPrice);
  if (buyShares <= 0) return null;

  const newAnnualIncome = buyShares * topCandidate.annualDividend;
  const oldAnnualIncome = sharesHeld * underperformer.annualDividend;
  const incomeDelta = newAnnualIncome - oldAnnualIncome;
  const candYield = (topCandidate.annualDividend / topCandidate.currentPrice) * 100;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-2 -right-2 z-10"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md shadow-elevated',
              'bg-yellow-200 text-yellow-950 border-2 border-yellow-500/70',
              'rotate-3 hover:rotate-0 hover:scale-110 transition-all',
              'text-[11px] font-semibold uppercase tracking-wide'
            )}
            aria-label={`How to fix ${underperformer.ticker}`}
            title="Click for directions to hit your yield"
          >
            <StickyNote className="w-3 h-3" />
            How to fix
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          className="w-80 p-0 border-2 border-yellow-500/70 bg-yellow-50 text-yellow-950 shadow-elevated"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-yellow-500/40">
              <StickyNote className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Steps to hit {targetYield.toFixed(1)}%
              </span>
            </div>

            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>
                  Sell <span className="font-mono font-semibold">{sharesHeld}</span> shares of{' '}
                  <span className="font-mono font-semibold">{underperformer.ticker}</span> at{' '}
                  <span className="font-mono">{formatCurrency(underperformer.currentPrice)}</span> →{' '}
                  <span className="font-mono">{formatCurrency(proceeds)}</span> proceeds
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>
                  Buy <span className="font-mono font-semibold">{buyShares.toLocaleString()}</span>{' '}
                  shares of{' '}
                  <span className="font-mono font-semibold">{topCandidate.ticker}</span> at{' '}
                  <span className="font-mono">{formatCurrency(topCandidate.currentPrice)}</span>{' '}
                  ({formatPercentage(candYield)} yield)
                </span>
              </li>
            </ol>

            <div className="pt-2 border-t border-yellow-500/40 flex justify-between text-sm">
              <span>Annual income change</span>
              <span
                className={cn(
                  'font-mono font-semibold',
                  incomeDelta >= 0 ? 'text-emerald-700' : 'text-red-700'
                )}
              >
                {incomeDelta >= 0 ? '+' : ''}
                {formatCurrency(incomeDelta)}/yr
              </span>
            </div>

            {onSwap && (
              <Button
                size="sm"
                className="w-full gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700"
                onClick={() => {
                  onSwap(topCandidate, buyShares, underperformer.ticker);
                  setOpen(false);
                }}
              >
                <Check className="w-4 h-4" />
                Do this swap
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
