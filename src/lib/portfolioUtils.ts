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
  
  // Exclude the in-progress current calendar year — evaluate only completed years
  const currentYear = new Date().getFullYear();
  const completedYears = Object.keys(paymentsByYear)
    .map(Number)
    .filter((y) => y < currentYear)
    .sort((a, b) => b - a);

  if (completedYears.length < yearsRequired) {
    return { status: 'warning', yearsStable: completedYears.length };
  }

  let stableYears = 0;
  let hasDecline = false;
  let previousAnnual = 0;

  // Iterate oldest → newest of the required completed years to compare year-over-year
  const evalYears = completedYears.slice(0, yearsRequired).reverse();
  for (const year of evalYears) {
    const yearPayments = paymentsByYear[year];
    const annualTotal = yearPayments.reduce((sum, p) => sum + p, 0);

    // Require consistent quarterly payments in each completed year
    if (yearPayments.length < 4) {
      hasDecline = true;
    }

    // Check for declining dividends year-over-year (>10% drop)
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
  const vettedCandidates = marketData
    .filter((stock) => !existingTickers.includes(stock.ticker))
    .map((stock) => {
      const currentYield = calculateDividendYield(stock);
      const stability = checkDividendStability(stock, 2, targetMinYield);
      return { stock, currentYield, stability };
    })
    .filter(({ currentYield, stability }) =>
      currentYield >= targetMinYield && stability.status === 'stable'
    )
    .map(({ stock, currentYield }) => {
      const matchReason = stock.sector === removedStock.sector
        ? `Same sector (${stock.sector}) — 2+ yrs stable`
        : 'Vetted: 2+ yrs stable at target yield';
      return {
        stock,
        yield: currentYield,
        stabilityScore: 3,
        matchReason,
      };
    })
    .sort((a, b) => {
      if (a.stock.sector === removedStock.sector && b.stock.sector !== removedStock.sector) return -1;
      if (b.stock.sector === removedStock.sector && a.stock.sector !== removedStock.sector) return 1;
      return b.yield - a.yield;
    });

  return vettedCandidates.slice(0, 5);
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
