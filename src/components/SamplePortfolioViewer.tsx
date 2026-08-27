import { forwardRef, useState } from 'react';
import { FileText, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Row = { symbol: string; name: string; shares: number; price: number };

export const SAMPLE_PORTFOLIO: Row[] = [
  { symbol: 'AAPL', name: 'Apple', shares: 60, price: 309.9 },
  { symbol: 'MSFT', name: 'Microsoft', shares: 35, price: 491.71 },
  { symbol: 'NVDA', name: 'NVIDIA', shares: 85, price: 213.05 },
  { symbol: 'JPM', name: 'JPMorgan Chase', shares: 45, price: 356.69 },
  { symbol: 'BAC', name: 'Bank of America', shares: 275, price: 62.43 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', shares: 70, price: 273.14 },
  { symbol: 'LLY', name: 'Eli Lilly', shares: 25, price: 1233.66 },
  { symbol: 'XOM', name: 'Exxon Mobil', shares: 125, price: 160.64 },
  { symbol: 'CVX', name: 'Chevron', shares: 90, price: 199.89 },
  { symbol: 'AMZN', name: 'Amazon', shares: 75, price: 261.06 },
  { symbol: 'HD', name: 'Home Depot', shares: 40, price: 337.88 },
  { symbol: 'PG', name: 'Procter & Gamble', shares: 150, price: 145.4 },
  { symbol: 'KO', name: 'Coca-Cola', shares: 300, price: 91.64 },
  { symbol: 'WMT', name: 'Walmart', shares: 180, price: 105.38 },
  { symbol: 'CAT', name: 'Caterpillar', shares: 30, price: 811.29 },
  { symbol: 'GE', name: 'GE Aerospace', shares: 55, price: 349.54 },
  { symbol: 'LIN', name: 'Linde', shares: 35, price: 487.2 },
  { symbol: 'SHW', name: 'Sherwin-Williams', shares: 45, price: 350.45 },
  { symbol: 'NEE', name: 'NextEra Energy', shares: 265, price: 84.22 },
  { symbol: 'DUK', name: 'Duke Energy', shares: 175, price: 121.59 },
  { symbol: 'PLD', name: 'Prologis', shares: 140, price: 143.33 },
  { symbol: 'AMT', name: 'American Tower', shares: 110, price: 178.57 },
  { symbol: 'GOOGL', name: 'Alphabet', shares: 65, price: 346.96 },
  { symbol: 'VZ', name: 'Verizon', shares: 290, price: 50.25 },
];

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export const SamplePortfolioViewer = forwardRef<HTMLDivElement>((_props, ref) => {
  const [open, setOpen] = useState(false);
  const total = SAMPLE_PORTFOLIO.reduce((sum, r) => sum + r.shares * r.price, 0);

  return (
    <div ref={ref} className="w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 border-2 border-border/60 bg-card/60 hover:bg-card text-xs"
        onClick={() => setOpen(true)}
      >
        <FileText className="w-3.5 h-3.5 text-primary" />
        View the sample portfolio file
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-2 border-border/60 p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-3 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="w-4 h-4 text-primary" />
              Sample Portfolio — 24 Stocks
            </DialogTitle>
            <DialogDescription className="text-xs flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              View only. Fictional data shown for format reference — nothing here can be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
            <table className="w-full text-xs font-mono select-none" aria-readonly="true">
              <thead className="sticky top-0 bg-background">
                <tr className="text-muted-foreground text-left">
                  <th className="py-1.5 pr-3 font-medium">Ticker</th>
                  <th className="py-1.5 pr-3 font-medium">Company</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Shares</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Price</th>
                  <th className="py-1.5 font-medium text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_PORTFOLIO.map((r) => (
                  <tr key={r.symbol} className="border-t border-border/40">
                    <td className="py-1.5 pr-3 text-foreground font-semibold">{r.symbol}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground font-sans">{r.name}</td>
                    <td className="py-1.5 pr-3 text-right">{r.shares}</td>
                    <td className="py-1.5 pr-3 text-right">{usd(r.price)}</td>
                    <td className="py-1.5 text-right text-foreground">{usd(r.shares * r.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/60">
                  <td colSpan={4} className="py-2 pr-3 font-sans font-medium">Total portfolio value</td>
                  <td className="py-2 text-right font-semibold text-primary">{usd(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

SamplePortfolioViewer.displayName = 'SamplePortfolioViewer';
