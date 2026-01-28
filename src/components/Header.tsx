import { TrendingUp } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Dividend Tracker</h1>
            <p className="text-xs text-muted-foreground">Portfolio Yield Analysis</p>
          </div>
        </div>
      </div>
    </header>
  );
}
