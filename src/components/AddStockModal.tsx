import { useState } from 'react';
import { Stock } from '@/types/portfolio';
import { formatCurrency, formatPercentage, calculateDividendYield } from '@/lib/portfolioUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddStockModalProps {
  marketStocks: Stock[];
  existingTickers: string[];
  onAddStock: (stock: Stock) => void;
}

export function AddStockModal({ marketStocks, existingTickers, onAddStock }: AddStockModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const availableStocks = marketStocks.filter(
    (s) => !existingTickers.includes(s.ticker) &&
    (s.ticker.toLowerCase().includes(search.toLowerCase()) ||
     s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddStock = (stock: Stock) => {
    onAddStock(stock);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Stock to Portfolio</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
          {availableStocks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No stocks available
            </p>
          ) : (
            availableStocks.map((stock) => {
              const yieldValue = calculateDividendYield(stock);
              return (
                <button
                  key={stock.ticker}
                  onClick={() => handleAddStock(stock)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{stock.ticker}</span>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                        {stock.sector}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-mono font-medium',
                      yieldValue >= 5 ? 'text-yield-positive' : 'text-yield-warning'
                    )}>
                      {formatPercentage(yieldValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(stock.currentPrice)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
