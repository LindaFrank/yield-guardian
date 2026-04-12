import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddTicker } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ParsedRow {
  ticker: string;
  shares: number | null;
  error?: string;
}

interface CSVImportModalProps {
  existingTickers: string[];
  onImportComplete?: () => void;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const startIdx = /ticker|symbol|stock/i.test(firstLine) ? 1 : 0;

  const rows: ParsedRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Support comma, semicolon, or tab delimiters
    const parts = line.split(/[,;\t]+/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const ticker = parts[0]?.toUpperCase();

    if (!ticker || !/^[A-Z]{1,5}$/.test(ticker)) {
      rows.push({ ticker: parts[0] || '(empty)', shares: null, error: 'Invalid ticker format' });
      continue;
    }

    let shares: number | null = null;
    if (parts[1]) {
      const parsed = parseFloat(parts[1]);
      if (isNaN(parsed) || parsed < 0) {
        rows.push({ ticker, shares: null, error: 'Invalid share count' });
        continue;
      }
      shares = parsed;
    }

    rows.push({ ticker, shares });
  }
  return rows;
}

export function CSVImportModal({ existingTickers, onImportComplete }: CSVImportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addTicker = useAddTicker();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const validRows = parsed?.filter((r) => !r.error) ?? [];
  const newRows = validRows.filter((r) => !existingTickers.includes(r.ticker));
  const duplicateRows = validRows.filter((r) => existingTickers.includes(r.ticker));
  const errorRows = parsed?.filter((r) => r.error) ?? [];

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setParsed(parseCSV(text));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!user || newRows.length === 0) return;
    setImporting(true);

    let added = 0;
    for (const row of newRows) {
      try {
        await addTicker.mutateAsync({ ticker: row.ticker, shares: row.shares ?? undefined });
        added++;
      } catch {
        // skip individual failures
      }
    }

    setImporting(false);
    toast({
      title: `Imported ${added} stock${added !== 1 ? 's' : ''}`,
      description: duplicateRows.length > 0
        ? `${duplicateRows.length} already in portfolio were skipped.`
        : undefined,
    });

    setParsed(null);
    setFileName('');
    setOpen(false);
    onImportComplete?.();
  };

  const reset = () => {
    setParsed(null);
    setFileName('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Stocks from CSV</DialogTitle>
        </DialogHeader>

        {!parsed ? (
          <div
            className={cn(
              'border-[2px] border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5'
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Drop a CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Expected format: <code>Ticker, Shares</code> (one per line)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{fileName}</p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md bg-emerald-500/10 p-2">
                <div className="text-lg font-bold text-emerald-600">{newRows.length}</div>
                <div className="text-muted-foreground text-xs">New</div>
              </div>
              <div className="rounded-md bg-yellow-500/10 p-2">
                <div className="text-lg font-bold text-yellow-600">{duplicateRows.length}</div>
                <div className="text-muted-foreground text-xs">Duplicates</div>
              </div>
              <div className="rounded-md bg-red-500/10 p-2">
                <div className="text-lg font-bold text-red-600">{errorRows.length}</div>
                <div className="text-muted-foreground text-xs">Errors</div>
              </div>
            </div>

            {/* Row list */}
            <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
              {parsed.map((row, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm',
                    row.error && 'bg-destructive/5',
                    !row.error && existingTickers.includes(row.ticker) && 'bg-yellow-500/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {row.error ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : existingTickers.includes(row.ticker) ? (
                      <span className="text-xs text-yellow-600">dup</span>
                    ) : (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="font-mono font-medium">{row.ticker}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {row.error ? (
                      <span className="text-destructive text-xs">{row.error}</span>
                    ) : row.shares != null ? (
                      `${row.shares} shares`
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={newRows.length === 0 || importing}
              onClick={handleImport}
            >
              {importing ? 'Importing…' : `Import ${newRows.length} Stock${newRows.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
