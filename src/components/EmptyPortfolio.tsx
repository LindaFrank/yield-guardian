import { TrendingUp, DollarSign, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface EmptyPortfolioProps {
  onSelectStocks: () => void;
  onSetYield: () => void;
}

export function EmptyPortfolio({ onSelectStocks, onSetYield }: EmptyPortfolioProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <h2 className="text-xl font-semibold mb-1">Welcome to Yield Guardian</h2>
        <p className="text-sm text-muted-foreground">
          Get started by choosing what to set up first
        </p>
      </div>

      <div className="grid gap-4">
        <button onClick={onSelectStocks} className="text-left group">
          <Card className="p-5 border-border/50 hover:border-primary/40 transition-all duration-200 bg-card hover:bg-accent/30">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                  Select Stocks
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Search and add stocks to your portfolio to start tracking dividends and performance.
                </p>
              </div>
            </div>
          </Card>
        </button>

        <button onClick={onSetYield} className="text-left group">
          <Card className="p-5 border-border/50 hover:border-primary/40 transition-all duration-200 bg-card hover:bg-accent/30">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                  Set Desired Yield
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Choose your minimum yield target to identify underperforming holdings.
                </p>
              </div>
            </div>
          </Card>
        </button>

        <button onClick={onSelectStocks} className="text-left group">
          <Card className="p-5 border-border/50 hover:border-primary/40 transition-all duration-200 bg-card hover:bg-accent/30">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                  Enter Purchase Price
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Add your cost basis and shares owned to calculate yield on your investment.
                </p>
              </div>
            </div>
          </Card>
        </button>
      </div>
    </div>
  );
}
