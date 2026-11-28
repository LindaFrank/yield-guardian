import { useId } from 'react';
import { TrendingUp, TrendingDown, LineChart, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  PricePoint,
  computeSixMonthSummary,
  formatMonthAxis,
  formatShortDate,
} from '@/lib/priceHistory';
import { formatCurrency } from '@/lib/portfolioUtils';
import { cn } from '@/lib/utils';

export interface ChartStockInfo {
  ticker: string;
  name: string;
  currentPrice: number;
  yieldPct?: number;
}

interface StockSparklineButtonProps {
  ticker: string;
  points?: PricePoint[];
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

export function StockSparklineButton({
  ticker,
  points,
  isLoading,
  onClick,
  className,
}: StockSparklineButtonProps) {
  const gradId = useId();
  const summary = computeSixMonthSummary(points);

  if (isLoading && !summary) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'w-[84px] h-9 sm:w-[96px] sm:h-10 shrink-0 rounded-md bg-secondary/40 animate-pulse',
          className,
        )}
      />
    );
  }

  if (!summary || !points || points.length < 2) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`View 6-month price chart for ${ticker}`}
        title="View 6-month price chart"
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-md border border-border/60 bg-secondary/30 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors',
          className,
        )}
      >
        <LineChart className="w-4 h-4" />
      </button>
    );
  }

  const width = 96;
  const height = 34;
  const padY = 4;
  const range = summary.high - summary.low;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const norm = range > 0 ? (p.close - summary.low) / range : 0.5;
    const y = height - padY - norm * (height - padY * 2);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const strokeColor = summary.isPositive ? 'hsl(var(--yield-positive))' : 'hsl(var(--yield-negative))';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`View 6-month price chart for ${ticker}`}
      title="6-month price trend — click for details"
      className={cn(
        'group relative w-[84px] h-9 sm:w-[96px] sm:h-10 shrink-0 rounded-md border border-border/50 bg-background/40 px-1 py-0.5 hover:border-primary/60 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: ChartStockInfo | null;
  points?: PricePoint[];
  isLoading?: boolean;
}

export function StockHistoryDialog({
  open,
  onOpenChange,
  stock,
  points,
  isLoading,
}: StockHistoryDialogProps) {
  const areaGradId = useId();
  const summary = computeSixMonthSummary(points);
  const isPositive = summary?.isPositive ?? true;
  const strokeColor = isPositive ? 'hsl(var(--yield-positive))' : 'hsl(var(--yield-negative))';
  const displayPrice = summary?.endPrice ?? stock?.currentPrice ?? 0;

  const yDomain: [number, number] = summary
    ? (() => {
        const pad = Math.max((summary.high - summary.low) * 0.12, summary.endPrice * 0.01);
        return [
          Math.max(0, Math.floor((summary.low - pad) * 100) / 100),
          Math.ceil((summary.high + pad) * 100) / 100,
        ];
      })()
    : [0, 100];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel="Close"
        className="max-w-lg border-[4px] border-muted-foreground/50 pt-12"
      >
        {stock && (
          <div className="space-y-4">
            <DialogHeader className="text-left space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="font-mono text-xl">{stock.ticker}</DialogTitle>
                {stock.yieldPct !== undefined && (
                  <Badge variant="outline" className="border-primary/50 text-primary font-mono text-xs">
                    {stock.yieldPct.toFixed(2)}% yield
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {stock.name} · 6-Month Price History
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-mono font-bold tracking-tight">
                {formatCurrency(displayPrice)}
              </span>
              {summary && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold',
                      isPositive
                        ? 'bg-yield-positive/15 text-yield-positive'
                        : 'bg-yield-negative/15 text-yield-negative',
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {isPositive ? '+' : ''}
                    {summary.changePercent.toFixed(2)}%
                  </span>
                  <span
                    className={cn(
                      'text-sm font-mono font-medium',
                      isPositive ? 'text-yield-positive' : 'text-yield-negative',
                    )}
                  >
                    {summary.change >= 0 ? '+' : ''}
                    {formatCurrency(summary.change)} past 6 months
                  </span>
                </div>
              )}
            </div>

            <div className="h-[220px] w-full rounded-lg bg-secondary/20 border border-border/50 p-2">
              {isLoading && !summary ? (
                <div className="h-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading 6-month prices…
                </div>
              ) : !summary || !points ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  6-month price history is unavailable for {stock.ticker} right now.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatMonthAxis}
                      minTickGap={48}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={yDomain}
                      width={52}
                      tickFormatter={(v: number) => `$${v >= 100 ? v.toFixed(0) : v.toFixed(2)}`}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      y={summary.startPrice}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const pt = payload[0].payload as PricePoint;
                        return (
                          <div className="rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs shadow-elevated">
                            <span className="font-mono font-semibold text-foreground">
                              {formatCurrency(pt.close)}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {formatShortDate(pt.date)}
                            </span>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={strokeColor}
                      strokeWidth={2}
                      fill={`url(#${areaGradId})`}
                      dot={false}
                      activeDot={{ r: 4, fill: strokeColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {summary && (
              <>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-md bg-secondary/30 p-2">
                    <p className="text-[11px] text-muted-foreground">6M Start</p>
                    <p className="text-sm font-mono font-medium">{formatCurrency(summary.startPrice)}</p>
                  </div>
                  <div className="rounded-md bg-secondary/30 p-2">
                    <p className="text-[11px] text-muted-foreground">6M Low</p>
                    <p className="text-sm font-mono font-medium">{formatCurrency(summary.low)}</p>
                  </div>
                  <div className="rounded-md bg-secondary/30 p-2">
                    <p className="text-[11px] text-muted-foreground">6M High</p>
                    <p className="text-sm font-mono font-medium">{formatCurrency(summary.high)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed rounded-md bg-secondary/20 border border-border/40 px-3 py-2">
                  6M Start is the closing price at the beginning of the six-month period, at the left end of the graph. The most recent closing price is at the right end; comparing those two prices determines whether the graph is green or red.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}