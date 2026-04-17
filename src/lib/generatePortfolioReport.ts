import { Stock, StockAnalysis, ReplacementCandidate } from '@/types/portfolio';
import { formatCurrency, formatPercentage, checkDividendStability } from '@/lib/portfolioUtils';

interface ReportData {
  stocks: Stock[];
  sharesMap: Record<string, number | null>;
  targetYield: number;
  underperformers: StockAnalysis[];
  getReplacements: (stock: Stock) => ReplacementCandidate[];
}

// Apply the same strict vetting used for suggested replacements:
// require 2+ years of stable dividends AND a payment within the last 120 days.
// Holdings that fail this (e.g. WBA after the merger halt) are hidden from the report.
function passesReportVetting(stock: Stock, targetYield: number): boolean {
  const { status } = checkDividendStability(stock, 2, targetYield);
  return status === 'stable';
}

export async function generatePortfolioReport(data: ReportData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Filter holdings to only those passing strict vetting (matches replacement-suggestion criteria)
  const vettedStocks = data.stocks.filter(s => passesReportVetting(s, data.targetYield));
  const excludedStocks = data.stocks.filter(s => !passesReportVetting(s, data.targetYield));
  const vettedUnderperformers = data.underperformers.filter(a => passesReportVetting(a.stock, data.targetYield));

  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Portfolio Report', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Summary box (based on vetted holdings only)
  const totalValue = vettedStocks.reduce((sum, s) => {
    const shares = data.sharesMap[s.ticker] ?? 1;
    return sum + s.currentPrice * shares;
  }, 0);
  const totalDividends = vettedStocks.reduce((sum, s) => {
    const shares = data.sharesMap[s.ticker] ?? 1;
    return sum + s.annualDividend * shares;
  }, 0);
  const avgYield = totalValue > 0 ? (totalDividends / totalValue) * 100 : 0;

  const summaryHeight = excludedStocks.length > 0 ? 34 : 24;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y, pageWidth - 28, summaryHeight, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const summaryItems = [
    `Total Stocks: ${vettedStocks.length}`,
    `Portfolio Value: ${formatCurrency(totalValue)}`,
    `Annual Dividends: ${formatCurrency(totalDividends)}`,
    `Avg Yield: ${formatPercentage(avgYield)}`,
    `Target Yield: ${formatPercentage(data.targetYield)}`,
    `Underperformers: ${vettedUnderperformers.length}`,
  ];
  const colWidth = (pageWidth - 28) / 3;
  summaryItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    doc.text(item, 20 + col * colWidth, y + 9 + row * 10);
  });

  if (excludedStocks.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(140, 90, 60);
    const excludedTickers = excludedStocks.map(s => s.ticker).join(', ');
    doc.text(
      `Excluded (failed vetting: <2 yrs stable or no payment in 120 days): ${excludedTickers}`,
      20,
      y + summaryHeight - 4
    );
  }
  y += summaryHeight + 8;

  // Underperformers section (lead the report with this)
  if (vettedUnderperformers.length > 0) {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setTextColor(184, 80, 66);
    doc.text('Underperforming Stocks & Replacement Suggestions', 14, y);
    y += 6;

    for (const analysis of vettedUnderperformers) {
      if (y > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        y = 20;
      }

      // Underperformer header with price & dividend info
      const underShares = data.sharesMap[analysis.stock.ticker] ?? 1;
      const underperformerDiv = analysis.stock.annualDividend * underShares;
      doc.setFillColor(184, 80, 66);
      doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${analysis.stock.ticker} — ${analysis.stock.name}  |  Price: ${formatCurrency(analysis.stock.currentPrice)}  |  Yield: ${formatPercentage(analysis.currentYield)}  |  Status: ${analysis.isStable}`,
        18,
        y + 5.5
      );
      doc.setFontSize(8);
      doc.text(
        `Annual Dividend Received: ${formatCurrency(underperformerDiv)} (${underShares} share${underShares !== 1 ? 's' : ''})`,
        18,
        y + 11.5
      );
      y += 18;

      // Replacement candidates sorted by price closest to underperformer
      const replacements = data.getReplacements(analysis.stock);
      const underPrice = analysis.stock.currentPrice;
      const underDivPerShare = analysis.stock.annualDividend;
      const underTotalAnnualDiv = underDivPerShare * underShares;
      const underTotalValue = underPrice * underShares;
      const sortedReplacements = [...replacements].sort((a, b) => Math.abs(a.stock.currentPrice - underPrice) - Math.abs(b.stock.currentPrice - underPrice));
      if (sortedReplacements.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'Price/Share', '% Yield', 'Yield/Share\n(Dollars)', 'Cost of Replacement\nStock (YieldxN=Ann.Div)', 'Num Repl.\nShares', 'Value Underperf.\nRetained', 'Num Underperf.\nShares Retained', 'Projected Annual\nDividend Yield ($)']],
          body: sortedReplacements.map((r) => {
            const replDivPerShare = r.stock.annualDividend;
            const numReplShares = replDivPerShare > 0 ? Math.ceil(underTotalAnnualDiv / replDivPerShare) : 0;
            const costOfReplacement = numReplShares * r.stock.currentPrice;
            const valueRetained = Math.max(0, underTotalValue - costOfReplacement);
            const sharesRetained = underPrice > 0 ? valueRetained / underPrice : 0;
            const projectedAnnualDiv = (numReplShares * replDivPerShare) + (sharesRetained * underDivPerShare);
            return [
              r.stock.ticker,
              r.stock.name,
              formatCurrency(r.stock.currentPrice),
              formatPercentage(r.yield),
              formatCurrency(replDivPerShare),
              formatCurrency(costOfReplacement),
              numReplShares.toString(),
              formatCurrency(valueRetained),
              sharesRetained.toFixed(1),
              formatCurrency(projectedAnnualDiv),
            ];
          }),
          styles: { fontSize: 6.5, cellPadding: 2 },
          headStyles: { fillColor: [74, 111, 165], textColor: 255, fontStyle: 'bold', fontSize: 6 },
          alternateRowStyles: { fillColor: [245, 248, 255] },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('No replacement candidates found.', 18, y + 4);
        y += 12;
      }
    }
  }

  // Portfolio Holdings table
  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.setTextColor(40, 40, 40);
  doc.text('Portfolio Holdings', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Ticker', 'Name', 'Sector', 'Price', 'Div/Share', 'Shares', 'Total Annual Div', 'Yield']],
    body: vettedStocks.map(s => {
      const shares = data.sharesMap[s.ticker] ?? 1;
      const yld = s.currentPrice > 0 ? (s.annualDividend / s.currentPrice) * 100 : 0;
      return [
        s.ticker,
        s.name,
        s.sector,
        formatCurrency(s.currentPrice),
        formatCurrency(s.annualDividend),
        shares.toString(),
        formatCurrency(s.annualDividend * shares),
        formatPercentage(yld),
      ];
    }),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [74, 111, 165], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text('Dividend Tracker — Portfolio Report', 14, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save('portfolio-report.pdf');
}
