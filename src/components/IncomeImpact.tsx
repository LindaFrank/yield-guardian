import { useMemo } from 'react';
import { Stock, StockAnalysis } from '@/types/portfolio';
import { suggestReplacements, formatCurrency, formatPercentage } from '@/lib/portfolioUtils';
import { optimizeReplacement, toOptimizerCandidates, OptimizerMode, OptimizerResult } from '@/lib/optimizer';
import { Sparkles, ShieldCheck, Rocket, Database, FileText, PieChart, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomeImpactProps {
  underperformers: StockAnalysis[];
  sharesMap: Record<string, number>;
  marketPool: Stock[];
  portfolioTickers: string[];
  targetYield: number; // percent (e.g. 5)
  portfolioValue: number;
  portfolioIncome: number;
}

interface ModeSummary {
  status: OptimizerResult['status'];
  topTicker: string | null;
  totalShares: number;
  newPortfolioYield: number; // percent
  incomeIncrease: number;
  /** Reason to show when status !== 'ok' (e.g. portfolio already meets target). */
  emptyMessage?: string;
}

function summarizeMode(
  mode: OptimizerMode,
  underperformers: StockAnalysis[],
  sharesMap: Record<string, number>,
  marketPool: Stock[],
  portfolioTickers: string[],
  targetYieldPct: number,
  portfolioValue: number,
  portfolioIncome: number,
): ModeSummary {
  const tickerShares: Record<string, number> = {};
  let totalDelta = 0;
  let anyOk = false;
  let firstNonOkMessage: string | undefined;
  let allAlreadyMeetTarget = underperformers.length > 0;

  underperformers.forEach((u) => {
    const sharesHeld = sharesMap[u.stock.ticker] ?? 0;
    if (sharesHeld <= 0) {
      allAlreadyMeetTarget = false;
      return;
    }
    const candidates = suggestReplacements(u.stock, marketPool, targetYieldPct, portfolioTickers);
    if (candidates.length === 0) {
      allAlreadyMeetTarget = false;
      return;
    }
    const result = optimizeReplacement({
      underperformer: u.stock,
      sharesYHeld: sharesHeld,
      sharesYSold: sharesHeld, // aggressive default: sell all
      candidates: toOptimizerCandidates(candidates.map((c) => c.stock)),
      targetYield: targetYieldPct / 100,
      mode,
      diversify: false,
      portfolioValue,
      portfolioIncome,
    });
    if (result.status !== 'ok') {
      if (!firstNonOkMessage && result.message) firstNonOkMessage = result.message;
      // For conservative mode, "no-trade" means this stock's portfolio already meets target.
      // Any other non-ok status (infeasible, missing candidates) breaks the "all met" assumption.
      if (!(mode === 'conservative' && result.status === 'no-trade')) {
        allAlreadyMeetTarget = false;
      }
      return;
    }
    allAlreadyMeetTarget = false;
    anyOk = true;
    totalDelta += result.incomeDelta;
    result.rows.forEach((r) => {
      if (r.shares > 0) {
        tickerShares[r.stock.ticker] = (tickerShares[r.stock.ticker] ?? 0) + r.shares;
      }
    });
  });

  const topEntry = Object.entries(tickerShares).sort((a, b) => b[1] - a[1])[0];
  const totalShares = Object.values(tickerShares).reduce((s, n) => s + n, 0);
  const newYield = portfolioValue > 0 ? ((portfolioIncome + totalDelta) / portfolioValue) * 100 : 0;

  const emptyMessage = !anyOk
    ? mode === 'conservative' && allAlreadyMeetTarget
      ? 'No trade needed — your portfolio yield already meets your target.'
      : firstNonOkMessage
    : undefined;

  return {
    status: anyOk ? 'ok' : 'no-trade',
    topTicker: topEntry ? topEntry[0] : null,
    totalShares,
    newPortfolioYield: newYield,
    incomeIncrease: totalDelta,
    emptyMessage,
  };
}

export function IncomeImpact({
  underperformers,
  sharesMap,
  marketPool,
  portfolioTickers,
  targetYield,
  portfolioValue,
  portfolioIncome,
}: IncomeImpactProps) {
  const conservative = useMemo(
    () => summarizeMode('conservative', underperformers, sharesMap, marketPool, portfolioTickers, targetYield, portfolioValue, portfolioIncome),
    [underperformers, sharesMap, marketPool, portfolioTickers, targetYield, portfolioValue, portfolioIncome],
  );
  const aggressive = useMemo(
    () => summarizeMode('aggressive', underperformers, sharesMap, marketPool, portfolioTickers, targetYield, portfolioValue, portfolioIncome),
    [underperformers, sharesMap, marketPool, portfolioTickers, targetYield, portfolioValue, portfolioIncome],
  );

  if (underperformers.length === 0) return null;
  if (conservative.status !== 'ok' && aggressive.status !== 'ok') return null;

  return (
    <div className="p-5 rounded-xl gradient-card shadow-card border-[4px] border-yield-positive/40 animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-yield-positive" />
        <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Income Impact</h3>
      </div>

      {/* Approach headers */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <ApproachHeader
          icon={<ShieldCheck className="w-6 h-6" />}
          title="Conservative Approach"
          description="Sell the fewest shares needed to bring my annual yield to my target goal."
          accent="conservative"
        />
        <ApproachHeader
          icon={<Rocket className="w-6 h-6" />}
          title="Aggressive Approach"
          description="Capture the largest income gain possible by selling an underperformer."
          accent="aggressive"
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Potential Income Increase
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <ModeCard summary={conservative} accent="conservative" />
        <ModeCard summary={aggressive} accent="aggressive" />
      </div>

      <div className="flex items-center gap-2 mt-4 text-[13px] text-muted-foreground">
        <Info className="w-4 h-4 shrink-0" />
        <span>Based on the latest recommendations you've reviewed.</span>
      </div>
    </div>
  );
}

type Accent = 'conservative' | 'aggressive';

const ACCENT_STYLES: Record<Accent, { text: string; border: string; bg: string }> = {
  conservative: {
    text: 'text-approach-conservative',
    border: 'border-approach-conservative/40',
    bg: 'bg-approach-conservative/5',
  },
  aggressive: {
    text: 'text-approach-aggressive',
    border: 'border-approach-aggressive/40',
    bg: 'bg-approach-aggressive/5',
  },
};

function ApproachHeader({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: Accent;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <div className={cn('p-4 rounded-lg border-[3px]', s.border, s.bg)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={s.text}>{icon}</span>
        <span className={cn('font-bold uppercase tracking-wider text-sm', s.text)}>{title}</span>
      </div>
      <p className="text-[13px] text-muted-foreground leading-snug">{description}</p>
    </div>
  );
}

function ModeCard({ summary, accent }: { summary: ModeSummary; accent: Accent }) {
  const s = ACCENT_STYLES[accent];

  if (summary.status !== 'ok' || !summary.topTicker) {
    return (
      <div className={cn('p-4 rounded-lg border-[3px] text-center text-sm text-muted-foreground', s.border)}>
        No replacement available.
      </div>
    );
  }

  const rows = [
    { icon: Database, label: 'Replacement Stock', value: summary.topTicker },
    { icon: FileText, label: 'Shares to be purchased', value: summary.totalShares.toLocaleString() },
    { icon: PieChart, label: 'New Portfolio Yield', value: `${summary.newPortfolioYield.toFixed(2)}%` },
    {
      icon: DollarSign,
      label: 'Estimated Income Increase',
      value: `${summary.incomeIncrease >= 0 ? '+' : ''}${formatCurrency(summary.incomeIncrease)}/yr`,
    },
  ];

  return (
    <div className={cn('p-4 rounded-lg border-[3px] divide-y divide-border/40', s.border)}>
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className={cn('w-4 h-4 shrink-0', s.text)} />
            <span className="text-[14px] text-muted-foreground truncate">{label}</span>
          </div>
          <span className={cn('font-mono font-bold text-sm whitespace-nowrap', s.text)}>{value}</span>
        </div>
      ))}
    </div>
  );
}

