import { useState, useMemo } from 'react';
import { Stock } from '@/types/portfolio';
import { defaultPortfolio, marketStocks } from '@/data/mockData';
import { 
  analyzeStock, 
  scanPortfolioForUnderperformers, 
  suggestReplacements 
} from '@/lib/portfolioUtils';
import { Header } from '@/components/Header';
import { PortfolioStats } from '@/components/PortfolioStats';
import { YieldTargetSlider } from '@/components/YieldTargetSlider';
import { StockCard } from '@/components/StockCard';
import { UnderperformersList } from '@/components/UnderperformersList';
import { ReplacementSuggestions } from '@/components/ReplacementSuggestions';
import { AddStockModal } from '@/components/AddStockModal';

const Index = () => {
  const [stocks, setStocks] = useState<Stock[]>(defaultPortfolio.stocks);
  const [targetYield, setTargetYield] = useState(defaultPortfolio.targetMinYield);
  const [selectedUnderperformer, setSelectedUnderperformer] = useState<Stock | null>(null);

  // Analyze all stocks
  const stockAnalyses = useMemo(
    () => stocks.map((stock) => analyzeStock(stock, targetYield)),
    [stocks, targetYield]
  );

  // Find underperformers
  const underperformers = useMemo(
    () => scanPortfolioForUnderperformers(stocks, targetYield),
    [stocks, targetYield]
  );

  // Get replacement suggestions for selected stock
  const replacements = useMemo(() => {
    if (!selectedUnderperformer) return [];
    return suggestReplacements(
      selectedUnderperformer,
      marketStocks,
      targetYield,
      stocks.map((s) => s.ticker)
    );
  }, [selectedUnderperformer, stocks, targetYield]);

  const handleRemoveStock = (ticker: string) => {
    setStocks((prev) => prev.filter((s) => s.ticker !== ticker));
    if (selectedUnderperformer?.ticker === ticker) {
      setSelectedUnderperformer(null);
    }
  };

  const handleAddStock = (stock: Stock) => {
    if (!stocks.find((s) => s.ticker === stock.ticker)) {
      setStocks((prev) => [...prev, stock]);
    }
  };

  const handleSelectUnderperformer = (stock: Stock) => {
    setSelectedUnderperformer(
      selectedUnderperformer?.ticker === stock.ticker ? null : stock
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <PortfolioStats
            stocks={stocks}
            targetYield={targetYield}
            underperformerCount={underperformers.length}
          />
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Portfolio Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Yield Control */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <YieldTargetSlider value={targetYield} onChange={setTargetYield} />
            </section>

            {/* Portfolio Grid */}
            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Portfolio</h2>
                <AddStockModal
                  marketStocks={marketStocks}
                  existingTickers={stocks.map((s) => s.ticker)}
                  onAddStock={handleAddStock}
                />
              </div>
              
              {stocks.length === 0 ? (
                <div className="p-12 rounded-xl gradient-card shadow-card border border-border/50 text-center">
                  <p className="text-muted-foreground">
                    No stocks in portfolio. Add some to get started!
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {stockAnalyses.map((analysis, index) => (
                    <div
                      key={analysis.stock.ticker}
                      className="animate-fade-in"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <StockCard
                        analysis={analysis}
                        onRemove={handleRemoveStock}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Analysis & Suggestions */}
          <aside className="space-y-6">
            <section className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <UnderperformersList
                underperformers={underperformers}
                selectedStock={selectedUnderperformer}
                onSelectStock={handleSelectUnderperformer}
                targetYield={targetYield}
              />
            </section>

            <section className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <ReplacementSuggestions
                removedStock={selectedUnderperformer}
                candidates={replacements}
                onAddStock={handleAddStock}
              />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
