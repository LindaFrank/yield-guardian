import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileUp, CheckCircle2, AlertTriangle, Copy, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseFile, validateImport, ParsedRow, ImportValidation } from '@/lib/importParser';
import { Stock } from '@/types/portfolio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImportStocksModalProps {
  existingTickers: string[];
  onAddStock: (stock: Stock, shares?: number) => void;
}

export function ImportStocksModal({ existingTickers, onAddStock }: ImportStocksModalProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'upload' | 'preview'>('upload');
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    try {
      const parsed = await parseFile(file);
      const result = validateImport(parsed, existingTickers);
      setValidation(result);
      setPhase('preview');
    } catch (err) {
      console.error('Parse error:', err);
      setValidation({ newStocks: [], duplicates: [], errors: [{ raw: file.name, reason: 'Failed to parse file' }] });
      setPhase('preview');
    } finally {
      setIsLoading(false);
    }
  }, [existingTickers]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = () => {
    if (!validation) return;
    for (const row of validation.newStocks) {
      const stock: Stock = {
        ticker: row.ticker.toUpperCase(),
        name: row.ticker,
        sector: '',
        currentPrice: 0,
        annualDividend: 0,
        dividendHistory: [],
        currentYield: 0,
      };
      onAddStock(stock, row.shares);
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setOpen(false);
    setPhase('upload');
    setValidation(null);
    setFileName('');
    setIsLoading(false);
  };

  const totalNew = validation?.newStocks.length ?? 0;
  const totalDupes = validation?.duplicates.length ?? 0;
  const totalErrors = validation?.errors.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-[4px] border-muted-foreground/50">
          <Upload className="w-4 h-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg border-[3px] border-muted-foreground/60">
        <DialogHeader>
          <DialogTitle>
            {phase === 'upload' ? 'Import Stocks from File' : `Import Preview — ${fileName}`}
          </DialogTitle>
        </DialogHeader>

        {phase === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 p-10 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-secondary/20'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Parsing file…</p>
              </>
            ) : (
              <>
                <FileUp className="w-10 h-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">
                  Drop a CSV, TXT, or PDF file here<br />
                  <span className="text-xs">or click to browse</span>
                </p>
                <p className="text-xs text-muted-foreground/60">
                  PII (names, SSNs, etc.) is automatically filtered out
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {phase === 'preview' && validation && (
          <>
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="new" className="flex-1 gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  New
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{totalNew}</Badge>
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="flex-1 gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  Duplicates
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{totalDupes}</Badge>
                </TabsTrigger>
                <TabsTrigger value="errors" className="flex-1 gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Errors
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{totalErrors}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new">
                <div className="border-[4px] border-yield-positive/40 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {totalNew === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No new stocks found</p>
                  ) : (
                    <div className="space-y-2">
                      {validation.newStocks.map((row, i) => (
                        <StockRow key={`${row.ticker}-${i}`} row={row} variant="new" />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="duplicates">
                <div className="border-[4px] border-yield-warning/40 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {totalDupes === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No duplicates</p>
                  ) : (
                    <div className="space-y-2">
                      {validation.duplicates.map((row, i) => (
                        <StockRow key={`${row.ticker}-${i}`} row={row} variant="duplicate" />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="errors">
                <div className="border-[4px] border-yield-negative rounded-lg p-3 max-h-60 overflow-y-auto">
                  {totalErrors === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No errors</p>
                  ) : (
                    <div className="space-y-2">
                      {validation.errors.map((err, i) => (
                        <div key={i} className="border-[2px] border-yield-negative rounded-md p-2 bg-yield-negative">
                          <p className="text-sm font-mono">{err.raw}</p>
                          <p className="text-xs text-destructive mt-0.5">{err.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-[4px] border-muted-foreground/50" onClick={() => { setPhase('upload'); setValidation(null); }}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleImport}
                disabled={totalNew === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Import {totalNew} Stock{totalNew !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StockRow({ row, variant }: { row: ParsedRow; variant: 'new' | 'duplicate' }) {
  return (
    <div className={cn(
      'flex items-center justify-between p-2 rounded-md border',
      variant === 'new'
        ? 'border-yield-positive/30 bg-yield-positive/5'
        : 'border-yield-warning/30 bg-yield-warning/5'
    )}>
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">{row.ticker}</span>
        {row.shares && (
          <span className="text-xs text-muted-foreground">{row.shares} shares</span>
        )}
      </div>
      {variant === 'new' ? (
        <CheckCircle2 className="w-4 h-4 text-yield-positive" />
      ) : (
        <Copy className="w-4 h-4 text-yield-warning" />
      )}
    </div>
  );
}
