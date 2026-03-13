import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Target, Plus, Trash2, Search, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStockSearch, SearchResult } from '@/hooks/useStockData';
import { useAuth } from '@/contexts/AuthContext';
import { useAddTickerWithCostBasis } from '@/hooks/usePortfolio';

interface StockEntry {
  ticker: string;
  name: string;
  purchasePrice: string;
  sharesOwned: string;
}

const STORAGE_KEY = 'yield-guardian-getting-started-dismissed';

export function GettingStartedModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 = welcome, 1 = add stocks, 2 = done
  const { user } = useAuth();
  const addTickerMutation = useAddTickerWithCostBasis();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <WelcomeStep key="welcome" onNext={() => setStep(1)} onSkip={handleDismiss} />
              )}
              {step === 1 && (
                <AddStocksStep
                  key="add-stocks"
                  onBack={() => setStep(0)}
                  onFinish={(entries) => {
                    if (user && entries.length > 0) {
                      entries.forEach((e) => {
                        addTickerMutation.mutate({
                          ticker: e.ticker,
                          purchasePrice: e.purchasePrice ? parseFloat(e.purchasePrice) : undefined,
                          sharesOwned: e.sharesOwned ? parseFloat(e.sharesOwned) : undefined,
                        });
                      });
                    }
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && (
                <DoneStep key="done" onClose={handleDismiss} />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Step 0: Welcome ─── */
function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome to Yield Guardian</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Let's set up your portfolio. You'll enter the stocks you own, what you paid, and how many shares — we'll calculate your cost-basis yield automatically.
        </p>
      </div>

      <div className="px-6 pb-2 space-y-3">
        {[
          { icon: Target, title: 'Enter your holdings', desc: 'Add tickers, purchase prices, and share counts.' },
          { icon: TrendingUp, title: 'See yield on cost', desc: 'We calculate your real yield based on what you paid, not market price.' },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            className="flex items-start gap-3 rounded-lg p-3 bg-muted/40"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 shrink-0">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-border flex justify-between">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip
        </Button>
        <Button size="sm" onClick={onNext} className="gap-1">
          Set up portfolio <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Step 1: Add Stocks ─── */
function AddStocksStep({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: (entries: StockEntry[]) => void;
}) {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(true);

  const { data: results, isLoading } = useStockSearch(searchQuery);

  const existingTickers = entries.map((e) => e.ticker);
  const filtered = (results ?? []).filter(
    (r) => !existingTickers.includes(r.symbol.toUpperCase())
  );

  const addEntry = (result: SearchResult) => {
    setEntries((prev) => [
      ...prev,
      {
        ticker: result.symbol.toUpperCase(),
        name: result.name,
        purchasePrice: '',
        sharesOwned: '',
      },
    ]);
    setSearchQuery('');
    setShowSearch(false);
  };

  const removeEntry = (ticker: string) => {
    setEntries((prev) => prev.filter((e) => e.ticker !== ticker));
  };

  const updateEntry = (ticker: string, field: 'purchasePrice' | 'sharesOwned', value: string) => {
    // Allow only valid numeric input
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setEntries((prev) =>
      prev.map((e) => (e.ticker === ticker ? { ...e, [field]: value } : e))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-6 pt-6 pb-3">
        <h2 className="text-lg font-bold text-foreground">Add Your Stocks</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Search for stocks, then enter your purchase price and number of shares.
        </p>
      </div>

      {/* Search bar */}
      <div className="px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ticker or company…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Search results dropdown */}
        {showSearch && searchQuery.length > 0 && (
          <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
            {isLoading && (
              <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching…
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-3 text-xs">No results</p>
            )}
            {filtered.slice(0, 5).map((r) => (
              <button
                key={r.symbol}
                onClick={() => addEntry(r)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left text-sm"
              >
                <div>
                  <span className="font-mono font-medium text-foreground">{r.symbol}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{r.name}</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries list */}
      <div className="px-6 pb-3 space-y-2 max-h-[35vh] overflow-y-auto">
        {entries.length === 0 && (
          <p className="text-center text-muted-foreground py-6 text-xs">
            Search above to add your first stock
          </p>
        )}
        {entries.map((entry) => {
          const costBasis =
            entry.purchasePrice && entry.sharesOwned
              ? (parseFloat(entry.purchasePrice) * parseFloat(entry.sharesOwned))
              : null;

          return (
            <motion.div
              key={entry.ticker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono font-semibold text-sm text-foreground">{entry.ticker}</span>
                  <span className="text-xs text-muted-foreground ml-2">{entry.name}</span>
                </div>
                <button
                  onClick={() => removeEntry(entry.ticker)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 block">
                    Purchase Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      value={entry.purchasePrice}
                      onChange={(e) => updateEntry(entry.ticker, 'purchasePrice', e.target.value)}
                      placeholder="0.00"
                      className="h-8 text-sm pl-5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 block">
                    Shares
                  </label>
                  <Input
                    value={entry.sharesOwned}
                    onChange={(e) => updateEntry(entry.ticker, 'sharesOwned', e.target.value)}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              {costBasis !== null && costBasis > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Cost basis: <span className="font-mono font-medium text-foreground">${costBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add more button */}
      {entries.length > 0 && !showSearch && (
        <div className="px-6 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={() => setShowSearch(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add another stock
          </Button>
        </div>
      )}

      <div className="px-6 py-4 border-t border-border flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <Button
          size="sm"
          onClick={() => onFinish(entries)}
          className="gap-1"
        >
          {entries.length > 0 ? 'Save & Continue' : 'Skip'}
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Step 2: Done ─── */
function DoneStep({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="px-6 py-10 text-center"
    >
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Check className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-1">You're all set!</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your portfolio is ready. Adjust the yield target slider to spot underperformers and find replacements.
      </p>
      <Button onClick={onClose} size="sm">
        Go to Dashboard
      </Button>
    </motion.div>
  );
}
