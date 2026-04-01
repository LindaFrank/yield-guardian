import { forwardRef } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PortfolioReportPreviewProps {
  fileName: string;
  open: boolean;
  previewUrl: string | null;
  onDownload: () => void;
  onOpenChange: (open: boolean) => void;
}

function canRenderPdfInline() {
  if (typeof window === 'undefined') return false;

  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

export const PortfolioReportPreview = forwardRef<HTMLDivElement, PortfolioReportPreviewProps>(function PortfolioReportPreview(
  {
    fileName,
    open,
    previewUrl,
    onDownload,
    onOpenChange,
  },
  ref
) {
  const hasPreview = Boolean(previewUrl);
  const showInlinePreview = hasPreview && canRenderPdfInline();

  return (
    <div ref={ref} className="contents">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] w-[min(95vw,72rem)] max-w-none flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Portfolio report ready</DialogTitle>
            <DialogDescription>
              {showInlinePreview
                ? `Preview ${fileName} below, then use Download PDF if you want to save a copy.`
                : `Inline PDF preview is blocked inside the editor preview, so use Download PDF to open ${fileName}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 px-6 pb-6 pt-4">
            {showInlinePreview ? (
              <iframe
                src={previewUrl}
                title={fileName}
                loading="lazy"
                className="h-full min-h-[65vh] w-full rounded-md border bg-background"
              />
            ) : hasPreview ? (
              <div className="flex h-full min-h-[65vh] flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-6 text-center">
                <p className="text-base font-medium text-foreground">Preview unavailable in editor</p>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Chrome blocks embedded PDF viewers inside this preview frame. Download the PDF below to view the full report normally.
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-[65vh] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
                Generating report preview…
              </div>
            )}
          </div>

          <DialogFooter className="items-center gap-3 border-t px-6 py-4 sm:flex-row sm:justify-between sm:space-x-0">
            <p className="max-w-full truncate text-sm text-muted-foreground">{fileName}</p>
            <Button type="button" onClick={onDownload} disabled={!previewUrl} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

PortfolioReportPreview.displayName = 'PortfolioReportPreview';