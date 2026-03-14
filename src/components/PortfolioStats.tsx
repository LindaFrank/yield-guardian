import { Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage, calculateDividendYield } from '@/lib/portfolioUtils';
import { Wallet, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/HelpTooltip';

interface PortfolioStatsProps {
  stocks: Stock[];
  sharesMap?: Record<string, number | null>;
  targetYield: number;
  underperformerCount: number;
  helpEnabled?: boolean;
}

const STAT_HELP: Record<string, { text: string; side: 'top' | 'bottom' | 'left' | 'right' }> = {
  'Portfolio Value': {
    text: 'These are the total market value of all investments in the portfolio at a given time.',
    side: 'bottom',
  },
  'Annual Dividends': {
    text: 'This is the total amount of dividend income the portfolio investment pays over one year.',
    side: 'bottom',
  },
  'Weighted Avg Yield': {
    text: 'Weighted Average (total dividends ÷ portfolio value × 100). This reflects the true portfolio yield based on position sizes.',
    side: 'bottom',
  },
  'Underperformers': {
    text: 'Shows the current number of underperforming stocks.',
    side: 'bottom',
  },
};

export function PortfolioStats({ stocks, sharesMap = {}, targetYield, underperformerCount }: PortfolioStatsProps) {
  const totalValue = stocks.reduce((sum, s) => {
    const shares = sharesMap[s.ticker] ?? 1;
    return sum + s.currentPrice * shares;
  }, 0);
  const totalDividends = stocks.reduce((sum, s) => {
    const shares = sharesMap[s.ticker] ?? 1;
    return sum + s.annualDividend * shares;
  }, 0);
  const avgYield = totalValue > 0
    ? (totalDividends / totalValue) * 100
    : 0;

  const stats = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(totalValue),
      icon: Wallet,
      color: 'text-foreground',
    },
    {
      label: 'Annual Dividends',
      value: formatCurrency(totalDividends),
      icon: TrendingUp,
      color: 'text-yield-positive',
    },
    {
      label: 'Weighted Avg Yield',
      subtitle: 'total dividends ÷ portfolio value × 100',
      value: formatPercentage(avgYield),
      icon: Target,
      color: avgYield >= targetYield ? 'text-yield-positive' : 'text-yield-warning',
    },
    {
      label: 'Underperformers',
      value: underperformerCount.toString(),
      icon: AlertCircle,
      color: underperformerCount > 0 ? 'text-yield-negative' : 'text-yield-positive',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const help = STAT_HELP[stat.label];
        const card = (
          <div
            className="p-4 rounded-xl gradient-card shadow-card border border-muted-foreground/40 transition-all hover:border-muted-foreground/60"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('p-2 rounded-lg bg-secondary/50', stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className={cn('font-mono font-semibold text-xl', stat.color)}>
              {stat.value}
            </p>
            {'subtitle' in stat && stat.subtitle && (
              <p className="text-[10px] text-primary mt-1">{stat.subtitle}</p>
            )}
          </div>
        );

        return help ? (
          <HelpTooltip key={stat.label} text={help.text} side={help.side}>
            {card}
          </HelpTooltip>
        ) : (
          <div key={stat.label}>{card}</div>
        );
      })}
    </div>
  );
}
