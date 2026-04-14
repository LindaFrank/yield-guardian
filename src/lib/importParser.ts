/**
 * Client-side parser for CSV/TXT/PDF portfolio files.
 * Extracts ticker symbols and optional share counts while
 * filtering out PII (names, SSNs, account numbers, etc.).
 */

import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedRow {
  ticker: string;
  shares?: number;
  raw: string;
}

export interface ImportValidation {
  newStocks: ParsedRow[];
  duplicates: ParsedRow[];
  errors: { raw: string; reason: string }[];
}

// Common US stock ticker pattern (1-5 uppercase letters)
const TICKER_RE = /\b([A-Z]{1,5})\b/;

// PII patterns to skip entire lines
const PII_PATTERNS = [
  /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/,           // SSN
  /\b\d{9,12}\b/,                               // Account numbers
  /\bSSN\b/i,
  /\bsocial\s*security/i,
  /\baccount\s*(number|#|no)/i,
  /\bdate\s*of\s*birth/i,
  /\bDOB\b/i,
  /\baddress\b/i,
  /\bphone\b/i,
  /\bemail\b/i,
];

// Common header / noise words to skip
const NOISE_WORDS = new Set([
  'TICKER', 'SYMBOL', 'STOCK', 'NAME', 'SHARES', 'QTY', 'QUANTITY',
  'PRICE', 'VALUE', 'COST', 'BASIS', 'TOTAL', 'PORTFOLIO', 'REPORT',
  'DATE', 'PAGE', 'ACCOUNT', 'STATEMENT', 'BROKERAGE', 'HOLDINGS',
  'DESCRIPTION', 'TYPE', 'ACTION', 'DIVIDEND', 'YIELD', 'SECTOR',
  'MARKET', 'EXCHANGE', 'CURRENCY',
]);

// Known valid tickers for quick validation (top dividend stocks)
const KNOWN_TICKERS = new Set([
  'AAPL','ABBV','ABT','ACN','ADBE','ADI','ADP','AEP','AFL','AIG','ALL','AMAT','AMD',
  'AMGN','AMT','AMZN','AVGO','AXP','BA','BAC','BDX','BK','BKNG','BLK','BMY','BRK.B',
  'C','CAT','CB','CCI','CL','CMCSA','CME','CMS','COF','COP','COST','CRM','CSCO',
  'CVS','CVX','D','DD','DE','DHR','DIS','DUK','EMR','ENB','EOG','EPD','ES','ETN',
  'EXC','F','FDX','GD','GE','GILD','GIS','GLW','GM','GOOG','GOOGL','GPC','GS',
  'HD','HON','HPQ','HSBC','IBM','ICE','INTC','IP','ITW','JNJ','JPM','KHC','KMB',
  'KMI','KO','LIN','LLY','LMT','LOW','LYB','MA','MCD','MCHP','MCK','MCO','MDLZ',
  'MDT','MET','META','MMM','MO','MPC','MRK','MS','MSFT','NEE','NEM','NFLX','NKE',
  'NSC','NVDA','O','OKE','ORCL','OXY','PEP','PFE','PG','PLD','PM','PNC','PPL',
  'PSA','PSX','QCOM','RDS.A','REGN','RF','RTX','SBUX','SCHW','SHW','SLB','SNY',
  'SO','SPG','SPGI','SRE','SYY','T','TGT','TJX','TMO','TROW','TRV','TSLA',
  'TXN','UNH','UNP','UPS','USB','V','VLO','VZ','WBA','WEC','WFC','WM','WMT',
  'XEL','XOM','ZTS',
  // Schwab ETFs
  'SCHH','SCHE','SCHF','SCHX','SCHA','SCHP','SCHD','SCHB','SCHG','SCHV','SCHR',
  'FNDF','FNDA','FNDX','FNDE','FNDC',
  'SCYB','EBND',
  // SPDR / iShares / Vanguard ETFs
  'SPY','IVV','VOO','VTI','VEA','VWO','BND','AGG','GLD','TLT','XLF','XLE','XLK',
  'XLV','XLI','XLU','XLP','XLY','XLRE','XLB','XLC',
  'IEFA','IEMG','IJR','IJH','IWM','IWF','IWD','DVY','HDV','IDV',
  'VIG','VYM','VXUS','VGT','VNQ','VCIT','VCSH',
]);

function isLikelyTicker(word: string): boolean {
  if (word.length < 1 || word.length > 5) return false;
  if (NOISE_WORDS.has(word)) return false;
  if (/^\d+$/.test(word)) return false;
  // Known tickers pass immediately
  if (KNOWN_TICKERS.has(word)) return true;
  // Heuristic: 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(word);
}

function hasPII(line: string): boolean {
  return PII_PATTERNS.some((re) => re.test(line));
}

function parseNumber(s: string): number | undefined {
  const cleaned = s.replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

export function parseTextLines(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || hasPII(trimmed)) continue;

    // Try to find a ticker in the line
    const words = trimmed.split(/[\s,;|\t]+/);
    let foundTicker: string | null = null;
    let foundShares: number | undefined;

    for (const word of words) {
      const upper = word.toUpperCase().replace(/[^A-Z.]/g, '');
      if (!foundTicker && isLikelyTicker(upper)) {
        foundTicker = upper;
      } else if (foundTicker && !foundShares) {
        const n = parseNumber(word);
        if (n !== undefined && n > 0 && n < 1_000_000_000) {
          foundShares = n;
        }
      }
    }

    if (foundTicker) {
      rows.push({ ticker: foundTicker, shares: foundShares, raw: trimmed });
    }
  }

  return rows;
}

export async function parsePDF(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items into lines by y-position
    let lastY: number | null = null;
    let line = '';
    for (const item of content.items as any[]) {
      const y = item.transform ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        // Different y-position → new line
        fullText += line + '\n';
        line = '';
      }
      line += (line ? ' ' : '') + item.str;
      lastY = y;
    }
    if (line) fullText += line + '\n';
  }

  return parseTextLines(fullText);
}

export function parseFile(file: File): Promise<ParsedRow[]> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return parsePDF(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(parseTextLines(text));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function validateImport(
  parsed: ParsedRow[],
  existingTickers: string[]
): ImportValidation {
  const seen = new Set<string>();
  const existingSet = new Set(existingTickers.map((t) => t.toUpperCase()));
  const newStocks: ParsedRow[] = [];
  const duplicates: ParsedRow[] = [];
  const errors: { raw: string; reason: string }[] = [];

  for (const row of parsed) {
    const ticker = row.ticker.toUpperCase();

    if (existingSet.has(ticker) || seen.has(ticker)) {
      duplicates.push(row);
    } else {
      newStocks.push(row);
      seen.add(ticker);
    }
  }

  return { newStocks, duplicates, errors };
}
