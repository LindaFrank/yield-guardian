import { useMemo } from 'react';
import { DollarSign, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/portfolioUtils';
import { Stock } from '@/types/portfolio';

interface IncomeYTDProps {
  stocks: Stock[];
  sharesMap: Record<string, number | null>;
}

/**
 * Actual dividend income paid out so far this calendar year:
 * sum of each stock's dividendHistory payments dated in the current year,
 * multiplied by shares owned.
 */
export function IncomeYTD({ stocks, sharesMap }: IncomeYTDProps) {
  const earned = useMemo(() => {
    const year = new Date().getFullYear();
    const now = Date.now();
    let total = 0;
    for (const s of stocks) {
      const shares = sharesMap[s.ticker] ?? 0;
      if (!shares) continue;
      for (const p of s.dividendHistory) {
        const d = new Date(p.date);
        if (d.getFullYear() === year && d.getTime() <= now) {
          total += p.amount * shares;
        }
      }
    }
    return total;
  }, [stocks, sharesMap]);

  return (
    <div className="p-4 rounded-xl gradient-card shadow-card border-[4px] border-yield-positive/40 animate-fade-in flex items-center gap-4 flex-wrap">
      <div className="p-2.5 rounded-full bg-yield-positive/10 border-2 border-yield-positive/40 text-yield-positive shrink-0">
        <DollarSign className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-base font-bold text-foreground">Dividends Paid This Year</h3>
        <p className="text-[13px] text-muted-foreground">Actual dividend payments received year-to-date based on shares owned.</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Paid YTD</p>
        <p className="font-mono font-bold text-2xl text-yield-positive">{formatCurrency(earned)}</p>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-[3px] border-muted-foreground/40 text-foreground shrink-0">
        <CalendarDays className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">YTD</span>
      </div>
    </div>
  );
}
