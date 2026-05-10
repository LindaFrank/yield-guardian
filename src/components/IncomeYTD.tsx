import { useMemo } from 'react';
import { DollarSign, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/portfolioUtils';

interface IncomeYTDProps {
  annualIncome: number;
}

/**
 * Pro-rated estimate of dividend income received so far this calendar year:
 *   annualIncome * (days elapsed / days in year)
 */
export function IncomeYTD({ annualIncome }: IncomeYTDProps) {
  const earned = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    const fraction = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
    return annualIncome * fraction;
  }, [annualIncome]);

  return (
    <div className="p-4 rounded-xl gradient-card shadow-card border-[4px] border-yield-positive/40 animate-fade-in flex items-center gap-4 flex-wrap">
      <div className="p-2.5 rounded-full bg-yield-positive/10 border-2 border-yield-positive/40 text-yield-positive shrink-0">
        <DollarSign className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-base font-bold text-foreground">Income Earned This Year (So Far)</h3>
        <p className="text-[13px] text-muted-foreground">Total income received from dividends and distributions.</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Income Earned</p>
        <p className="font-mono font-bold text-2xl text-yield-positive">{formatCurrency(earned)}</p>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-[3px] border-muted-foreground/40 text-foreground shrink-0">
        <CalendarDays className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">YTD</span>
      </div>
    </div>
  );
}
