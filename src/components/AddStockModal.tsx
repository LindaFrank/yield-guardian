import { useState } from 'react';
import { Stock } from '@/types/portfolio';
import { useStockSearch, SearchResult } from '@/hooks/useStockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';

interface AddStockModalProps {
  existingTickers: string[];
  onAddStock: (stock: Stock) => void;
  marketStocks?: Stock[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddStockModal({ existingTickers, onAddStock, open: controlledOpen, onOpenChange }: AddStockModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [search, setSearch] = useState('');

  const { data: results, isLoading } = useStockSearch(search);

  // Filter out stocks already in the portfolio
  const filtered = (results ?? []).filter(
    (r) => !existingTickers.includes(r.symbol.toUpperCase())
  );

  const handleAdd = (result: SearchResult) => {
    // Create a minimal Stock object — live data will be fetched once added to portfolio
    const stock: Stock = {
      ticker: result.symbol.toUpperCase(),
      name: result.name,
      sector: '',
      currentPrice: 0,
      annualDividend: 0,
      dividendHistory: [],
      currentYield: 0,
    };
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
            placeholder="Search any ticker or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
          {search.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Type a ticker or company name to search
            </p>
          )}

          {search.length > 0 && isLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching…
            </div>
          )}

          {search.length > 0 && !isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No results found
            </p>
          )}

          {filtered.map((result) => (
            <button
              key={result.symbol}
              onClick={() => handleAdd(result)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 hover:bg-secondary/50 transition-colors text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{result.symbol}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                    {result.stockExchange}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{result.name}</p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
