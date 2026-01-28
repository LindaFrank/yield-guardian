import { Stock, StockAnalysis, StabilityStatus, ReplacementCandidate } from '@/types/portfolio';

export function calculateDividendYield(stock: Stock): number {
  return (stock.annualDividend / stock.currentPrice) * 100;
}

export function checkDividendStability(
  stock: Stock,
  yearsRequired: number,
  targetMinYield: number
): { status: StabilityStatus; yearsStable: number } {
  const payments = stock.dividendHistory;
  
  if (payments.length === 0) {
    return { status: 'unstable', yearsStable: 0 };
  }
  
  // Group payments by year
  const paymentsByYear: Record<number, number[]> = {};
  payments.forEach((payment) => {
    const year = new Date(payment.date).getFullYear();
    if (!paymentsByYear[year]) {
      paymentsByYear[year] = [];
    }
    paymentsByYear[year].push(payment.amount);
  });
  
  const years = Object.keys(paymentsByYear).map(Number).sort((a, b) => b - a);
  
  if (years.length < yearsRequired) {
    return { status: 'warning', yearsStable: years.length };
  }
  
  let stableYears = 0;
  let hasDecline = false;
  let previousAnnual = 0;
  
  for (let i = 0; i < Math.min(yearsRequired, years.length); i++) {
    const year = years[i];
    const yearPayments = paymentsByYear[year];
    const annualTotal = yearPayments.reduce((sum, p) => sum + p, 0);
    
    // Check if there were consistent quarterly payments
    if (yearPayments.length < 4) {
      hasDecline = true;
    }
    
    // Check for declining dividends
    if (previousAnnual > 0 && annualTotal < previousAnnual * 0.9) {
      hasDecline = true;
    }
    
    previousAnnual = annualTotal;
    stableYears++;
  }
  
  // Calculate current yield stability
  const currentYield = calculateDividendYield(stock);
  
  if (hasDecline) {
    return { status: 'warning', yearsStable: stableYears };
  }
  
  if (currentYield < targetMinYield) {
    return { status: 'unstable', yearsStable: stableYears };
  }
  
  if (stableYears >= yearsRequired) {
    return { status: 'stable', yearsStable: stableYears };
  }
  
  return { status: 'warning', yearsStable: stableYears };
}

export function analyzeStock(stock: Stock, targetMinYield: number): StockAnalysis {
  const currentYield = calculateDividendYield(stock);
  const stabilityCheck = checkDividendStability(stock, 2, targetMinYield);
  
  const isUnderperforming = currentYield < targetMinYield || stabilityCheck.status === 'unstable';
  
  return {
    stock,
    currentYield,
    isStable: stabilityCheck.status,
    isUnderperforming,
    stabilityYears: stabilityCheck.yearsStable,
  };
}

export function scanPortfolioForUnderperformers(
  stocks: Stock[],
  targetMinYield: number
): StockAnalysis[] {
  return stocks
    .map((stock) => analyzeStock(stock, targetMinYield))
    .filter((analysis) => analysis.isUnderperforming);
}

export function suggestReplacements(
  removedStock: Stock,
  marketData: Stock[],
  targetMinYield: number,
  existingTickers: string[]
): ReplacementCandidate[] {
  return marketData
    .filter((stock) => !existingTickers.includes(stock.ticker))
    .map((stock) => {
      const currentYield = calculateDividendYield(stock);
      const stability = checkDividendStability(stock, 2, targetMinYield);
      
      let matchReason = '';
      if (stock.sector === removedStock.sector) {
        matchReason = `Same sector (${stock.sector})`;
      } else if (currentYield > targetMinYield + 1) {
        matchReason = 'High yield performer';
      } else if (stability.status === 'stable') {
        matchReason = 'Consistent dividend history';
      } else {
        matchReason = 'Meets yield target';
      }
      
      return {
        stock,
        yield: currentYield,
        stabilityScore: stability.status === 'stable' ? 3 : stability.status === 'warning' ? 2 : 1,
        matchReason,
      };
    })
    .filter((candidate) => candidate.yield >= targetMinYield && candidate.stabilityScore >= 2)
    .sort((a, b) => {
      // Prioritize same sector, then yield, then stability
      if (a.stock.sector === removedStock.sector && b.stock.sector !== removedStock.sector) return -1;
      if (b.stock.sector === removedStock.sector && a.stock.sector !== removedStock.sector) return 1;
      return b.yield - a.yield;
    })
    .slice(0, 5);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
