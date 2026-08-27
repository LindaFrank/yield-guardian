import { forwardRef, useState } from 'react';
import { FileText, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Row = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  shares: number;
  yieldPct: number;
  income: number;
  focus?: boolean;
};

export const SAMPLE_PORTFOLIO: Row[] = [
  { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communication Services', price: 50.08, shares: 135, yieldPct: 5.64, income: 381.31 },
  { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare', price: 27.96, shares: 235, yieldPct: 6.15, income: 404.09 },
  { symbol: 'BTI', name: 'British American Tobacco', sector: 'Consumer Staples', price: 56.41, shares: 116, yieldPct: 5.89, income: 385.42 },
  { symbol: 'MO', name: 'Altria Group', sector: 'Consumer Staples', price: 68.34, shares: 96, yieldPct: 6.19, income: 406.10 },
  { symbol: 'SNY', name: 'Sanofi', sector: 'Healthcare', price: 45.78, shares: 143, yieldPct: 5.29, income: 346.31 },
  { symbol: 'ENB', name: 'Enbridge', sector: 'Energy', price: 49.82, shares: 132, yieldPct: 5.59, income: 367.61 },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials', price: 102.72, shares: 64, yieldPct: 6.39, income: 420.08 },
  { symbol: 'EPD', name: 'Enterprise Products Partners', sector: 'Energy', price: 38.36, shares: 171, yieldPct: 5.84, income: 383.08 },
  { symbol: 'ET', name: 'Energy Transfer', sector: 'Energy', price: 21.08, shares: 311, yieldPct: 6.45, income: 422.85 },
  { symbol: 'KHC', name: 'Kraft Heinz', sector: 'Consumer Staples', price: 24.88, shares: 264, yieldPct: 6.44, income: 423.00 },
  { symbol: 'MPLX', name: 'MPLX', sector: 'Energy', price: 58.46, shares: 112, yieldPct: 7.37, income: 482.55 },
  { symbol: 'GIS', name: 'General Mills', sector: 'Consumer Staples', price: 40.52, shares: 162, yieldPct: 5.96, income: 391.23 },
  { symbol: 'BCE', name: 'BCE', sector: 'Communication Services', price: 23.78, shares: 276, yieldPct: 5.30, income: 347.85 },
  { symbol: 'WPC', name: 'W. P. Carey', sector: 'Real Estate', price: 71.58, shares: 92, yieldPct: 5.25, income: 345.73 },
  { symbol: 'SUN', name: 'Sunoco', sector: 'Energy', price: 76.11, shares: 86, yieldPct: 5.27, income: 344.95 },
  { symbol: 'ARCC', name: 'Ares Capital', sector: 'Financials', price: 19.90, shares: 330, yieldPct: 9.65, income: 633.72 },
  { symbol: 'WEN', name: "The Wendy's Company", sector: 'Consumer Discretionary', price: 8.82, shares: 743, yieldPct: 6.35, income: 416.13 },
  { symbol: 'OHI', name: 'Omega Healthcare Investors', sector: 'Real Estate', price: 46.59, shares: 141, yieldPct: 5.84, income: 383.64 },
  { symbol: 'AMCR', name: 'Amcor', sector: 'Materials', price: 48.54, shares: 135, yieldPct: 5.44, income: 356.48 },
  { symbol: 'CCI', name: 'Crown Castle', sector: 'Real Estate', price: 75.19, shares: 87, yieldPct: 5.64, income: 368.94 },
  { symbol: 'VICI', name: 'VICI Properties', sector: 'Real Estate', price: 26.00, shares: 253, yieldPct: 6.92, income: 455.20 },
  { symbol: 'CPB', name: "The Campbell's Company", sector: 'Consumer Staples', price: 23.47, shares: 279, yieldPct: 6.65, income: 435.45 },
  { symbol: 'NLY', name: 'Annaly Capital Management', sector: 'Real Estate', price: 23.00, shares: 286, yieldPct: 12.20, income: 802.52 },
  { symbol: 'ABBV', name: 'AbbVie', sector: 'Healthcare', price: 265.76, shares: 278, yieldPct: 2.57, income: 1898.75, focus: true },
];

const DESIRED_YIELD = 5.0;

const usd = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const SamplePortfolioViewer = forwardRef<HTMLDivElement>((_props, ref) => {
  const [open, setOpen] = useState(false);
  const totalValue = SAMPLE_PORTFOLIO.reduce((sum, r) => sum + r.shares * r.price, 0);
  const totalIncome = SAMPLE_PORTFOLIO.reduce((sum, r) => sum + r.income, 0);

  return (
    <div ref={ref} className="w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 border-2 border-border/60 bg-card/60 hover:bg-card text-xs"
        onClick={() => setOpen(true)}
      >
        <FileText className="w-3.5 h-3.5 text-primary" />
        View Susan's sample portfolio file
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl border-2 border-border/60 p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-3 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="w-4 h-4 text-primary" />
              Susan's Sample Portfolio — 24 Holdings
            </DialogTitle>
            <DialogDescription className="text-xs flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              View only. Fictional data shown for format reference — nothing here can be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[62vh] overflow-auto px-5 py-3">
            <table className="w-full text-xs font-mono select-none">
              <thead className="sticky top-0 bg-background">
                <tr className="text-muted-foreground text-left">
                  <th className="py-1.5 pr-3 font-medium">Ticker</th>
                  <th className="py-1.5 pr-3 font-medium">Company</th>
                  <th className="py-1.5 pr-3 font-medium">Sector</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Price</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Shares</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Value</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Yield</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Est. Annual Income</th>
                  <th className="py-1.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_PORTFOLIO.map((r) => (
                  <tr key={r.symbol} className="border-t border-border/40">
                    <td className="py-1.5 pr-3 text-foreground font-semibold">{r.symbol}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground font-sans whitespace-nowrap">{r.name}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground font-sans whitespace-nowrap">{r.sector}</td>
                    <td className="py-1.5 pr-3 text-right">{usd(r.price)}</td>
                    <td className="py-1.5 pr-3 text-right">{r.shares}</td>
                    <td className="py-1.5 pr-3 text-right">{usd(r.shares * r.price)}</td>
                    <td className={`py-1.5 pr-3 text-right ${r.yieldPct >= DESIRED_YIELD ? 'text-yield-positive' : 'text-yield-warning'}`}>
                      {r.yieldPct.toFixed(2)}%
                    </td>
                    <td className="py-1.5 pr-3 text-right">{usd(r.income)}</td>
                    <td className="py-1.5 text-right font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.focus
                            ? 'bg-yield-warning/15 text-yield-warning'
                            : 'bg-yield-positive/15 text-yield-positive'
                        }`}
                      >
                        {r.focus ? 'Focus' : 'Meets Goal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/60">
                  <td colSpan={5} className="py-2 pr-3 font-sans font-medium">
                    Totals — desired yield {DESIRED_YIELD.toFixed(2)}%
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold text-primary">{usd(totalValue)}</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 pr-3 text-right font-semibold text-primary">{usd(totalIncome)}</td>
                  <td className="py-2" />
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
