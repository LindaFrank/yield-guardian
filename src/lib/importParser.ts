/**
 * Client-side parser for CSV/TXT/PDF portfolio files.
 * Extracts ticker symbols and optional share counts while
 * filtering out PII (names, SSNs, account numbers, etc.).
 */

import * as pdfjsLib from 'pdfjs-dist';
// Bundle the worker locally — CDN workers can be blocked by CSP in the preview/live app.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;


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

type ParseSource = 'text' | 'pdf';

interface ParseTextOptions {
  source?: ParseSource;
}

interface ParsedToken {
  raw: string;
  normalized: string;
  index: number;
}

interface PositionedTextItem {
  str: string;
  x: number;
  width: number;
}

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
  'CALL', 'CASH', 'PUT', 'BUY', 'SELL', 'FEE', 'TAX', 'BOND', 'NOTE',
]);

const BLOCKED_TICKER_WORDS = new Set([
  'AND', 'ARE', 'AS', 'AT', 'FOR', 'FROM', 'GAIN', 'HAS', 'HAVE', 'HOW',
  'ID', 'IN', 'IS', 'ITS', 'LOSS', 'NOT', 'OF', 'ONE', 'OUR', 'OUT',
  'ST', 'THE', 'TO', 'WAS', 'WHO', 'WHY', 'WITH', 'YOUR',
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
  'VIG','VTEB','VYM','VXUS','VGT','VNQ','VCIT','VCSH',
]);

const HOLDING_METRIC_RE = /^(?:<\s*)?\(?-?\$?\d[\d,]*(?:\.\d+)?%?\)?$/;
const Y_TOLERANCE = 3;
const COLUMN_GAP_THRESHOLD = 12;

function normalizeTickerToken(word: string): string {
  return word.toUpperCase().replace(/[^A-Z.]/g, '');
}

function isLikelyTicker(word: string): boolean {
  if (word.length < 1 || word.length > 5) return false;
  if (NOISE_WORDS.has(word)) return false;
  if (BLOCKED_TICKER_WORDS.has(word)) return false;
  if (/^\d+$/.test(word)) return false;
  // Known tickers pass immediately
  if (KNOWN_TICKERS.has(word)) return true;
  // Unknown 1-2 character codes are too ambiguous in statement PDFs
  if (word.length <= 2) return false;
  // Heuristic: 3-5 uppercase letters for unknown symbols
  return /^[A-Z]{3,5}$/.test(word);
}

function hasPII(line: string): boolean {
  return PII_PATTERNS.some((re) => re.test(line));
}

function parseNumber(s: string): number | undefined {
  const cleaned = s.replace(/[,$%()<>\s]/g, '').replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

function tokenizeLine(line: string): ParsedToken[] {
  return line
    .split(/[\s,;|\t]+/)
    .map((raw, index) => ({
      raw,
      normalized: normalizeTickerToken(raw),
      index,
    }))
    .filter((token) => token.raw.trim().length > 0);
}

function looksLikeHoldingMetric(raw: string): boolean {
  return HOLDING_METRIC_RE.test(raw.trim());
}

function countHoldingMetrics(tokens: ParsedToken[], startIndex = 0): number {
  return tokens.slice(startIndex).filter((token) => looksLikeHoldingMetric(token.raw)).length;
}

function countDecimalMetrics(tokens: ParsedToken[], startIndex = 0): number {
  return tokens
    .slice(startIndex)
    .filter((token) => /\d+\.\d+/.test(token.raw) || token.raw.includes('%'))
    .length;
}

function getFirstMetricOffset(tokens: ParsedToken[], startIndex = 0): number | null {
  const index = tokens.slice(startIndex).findIndex((token) => looksLikeHoldingMetric(token.raw));
  return index === -1 ? null : index;
}

function findTickerCandidate(tokens: ParsedToken[]): ParsedToken | undefined {
  return tokens.slice(0, 4).find((token) => isLikelyTicker(token.normalized));
}

function findShareCount(tokens: ParsedToken[], startIndex = 0): number | undefined {
  for (const token of tokens.slice(startIndex)) {
    if (!looksLikeHoldingMetric(token.raw)) continue;
    if (token.raw.includes('%') || token.raw.includes('$') || token.raw.includes('<')) continue;

    const n = parseNumber(token.raw);
    if (n !== undefined && n > 0 && n < 1_000_000_000) {
      return n;
    }
  }
}

function isStandaloneTickerRow(
  tokens: ParsedToken[],
  candidate: ParsedToken,
  source: ParseSource,
  line: string
): boolean {
  if (candidate.index !== 0) return false;

  const alphaTokens = tokens.filter((token) => /[A-Za-z]/.test(token.raw));
  const metricCount = countHoldingMetrics(tokens, candidate.index + 1);

  if (alphaTokens.length !== 1) {
    return false;
  }

  if (tokens.length === 1) {
    return source === 'text' || KNOWN_TICKERS.has(candidate.normalized);
  }

  if (metricCount === 1) {
    return source === 'text' || KNOWN_TICKERS.has(candidate.normalized) || /[,;\t]/.test(line);
  }

  return false;
}

function isLikelyHoldingRow(tokens: ParsedToken[], candidate: ParsedToken): boolean {
  if (candidate.index > 1) return false;

  const startIndex = candidate.index + 1;
  const firstMetricOffset = getFirstMetricOffset(tokens, startIndex);
  if (firstMetricOffset === null || firstMetricOffset > 8) return false;

  const metricCount = countHoldingMetrics(tokens, startIndex);
  const decimalMetricCount = countDecimalMetrics(tokens, startIndex);
  const hasPercent = tokens.slice(startIndex).some((token) => token.raw.includes('%'));

  // Real holding rows have many columns (shares, price, value, cost, gain, yield, etc.)
  // Summary rows like "Top Account Holdings" only have 2-3 values (market value + %)
  if (decimalMetricCount < 3) return false;

  return KNOWN_TICKERS.has(candidate.normalized)
    ? metricCount >= 4 || (metricCount >= 3 && hasPercent)
    : metricCount >= 5 || (metricCount >= 4 && hasPercent);
}

function parseLine(line: string, source: ParseSource): ParsedRow | undefined {
  const trimmed = line.trim();
  if (!trimmed || hasPII(trimmed)) return undefined;

  const normalizedLine = trimmed.replace(/\s+/g, ' ');
  const tokens = tokenizeLine(normalizedLine);
  if (!tokens.length) return undefined;

  const candidate = findTickerCandidate(tokens);
  if (!candidate) return undefined;

  if (!isStandaloneTickerRow(tokens, candidate, source, normalizedLine) && !isLikelyHoldingRow(tokens, candidate)) {
    return undefined;
  }

  return {
    ticker: candidate.normalized,
    shares: findShareCount(tokens, candidate.index + 1),
    raw: normalizedLine,
  };
}

/**
 * Handles labeled/pipe-delimited exports such as:
 *   AAPL | Apple | SHARES: 60 | PRICE: $309.90 | VALUE: $18,594.00
 * These often wrap across lines, so we scan the whole document.
 */
const LABELED_ROW_RE =
  /\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\s*\|[^|]*\|\s*(?:SHARES|SHS|QTY|QUANTITY|UNITS)\s*[:=]?\s*([\d,]+(?:\.\d+)?)/gi;

function parseLabeledRows(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const normalized = text.replace(/\r?\n/g, ' ');
  LABELED_ROW_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LABELED_ROW_RE.exec(normalized)) !== null) {
    const ticker = normalizeTickerToken(match[1]);
    if (!ticker || NOISE_WORDS.has(ticker) || BLOCKED_TICKER_WORDS.has(ticker)) continue;
    if (!KNOWN_TICKERS.has(ticker) && !/^[A-Z]{1,5}(?:\.[A-Z]{1,2})?$/.test(ticker)) continue;

    const shares = parseNumber(match[2]);
    rows.push({
      ticker,
      shares: shares !== undefined && shares > 0 ? shares : undefined,
      raw: match[0].replace(/\s+/g, ' ').trim(),
    });
  }

  return rows;
}

export function parseTextLines(text: string, options: ParseTextOptions = {}): ParsedRow[] {
  const labeled = parseLabeledRows(text);
  if (labeled.length) return labeled;


  const rows: ParsedRow[] = [];
  const source = options.source ?? 'text';
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const parsedRow = parseLine(line, source);
    if (parsedRow) {
      rows.push(parsedRow);
    }
  }

  return rows;
}

async function extractPageTextWithStructure(page: any): Promise<string> {
  const content = await page.getTextContent();
  const lineMap = new Map<number, PositionedTextItem[]>();

  for (const item of content.items as any[]) {
    if (!('str' in item) || !item.str?.trim() || !item.transform) continue;

    const y = Math.round(item.transform[5] / Y_TOLERANCE) * Y_TOLERANCE;
    const x = item.transform[4];

    if (!lineMap.has(y)) {
      lineMap.set(y, []);
    }

    lineMap.get(y)?.push({
      str: item.str.trim(),
      x,
      width: item.width ?? item.str.trim().length * 5,
    });
  }

  return Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => {
      const sortedItems = items.sort((a, b) => a.x - b.x);
      let line = '';
      let previous: PositionedTextItem | null = null;

      for (const item of sortedItems) {
        if (!line) {
          line = item.str;
          previous = item;
          continue;
        }

        const gap = item.x - ((previous?.x ?? 0) + (previous?.width ?? 0));
        line += gap > COLUMN_GAP_THRESHOLD ? '  ' : ' ';
        line += item.str;
        previous = item;
      }

      return line.trim();
    })
    .filter(Boolean)
    .join('\n');
}

export async function parsePDF(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    fullText += `${await extractPageTextWithStructure(page)}\n`;
  }

  return parseTextLines(fullText, { source: 'pdf' });
}

export function parseFile(file: File): Promise<ParsedRow[]> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return parsePDF(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(parseTextLines(text, { source: 'text' }));
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
