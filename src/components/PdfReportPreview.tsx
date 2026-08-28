import { forwardRef, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PdfReportPreviewProps {
  bytes: Uint8Array;
}

export const PdfReportPreview = forwardRef<HTMLDivElement, PdfReportPreviewProps>(
  ({ bytes }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;

      const renderPdf = async () => {
        const container = containerRef.current;
        if (!container) return;

        container.replaceChildren();
        setError(null);

        try {
          const pdfjs = await import('pdfjs-dist');
          const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
          pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
          const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            if (cancelled) return;
            const page = await pdf.getPage(pageNumber);
            const baseViewport = page.getViewport({ scale: 1 });
            const availableWidth = Math.max(320, Math.min(container.clientWidth - 24, 900));
            const viewport = page.getViewport({ scale: availableWidth / baseViewport.width });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not prepare the report preview.');

            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(viewport.width * pixelRatio);
            canvas.height = Math.floor(viewport.height * pixelRatio);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;
            canvas.className = 'mx-auto block max-w-full bg-background shadow-sm';
            container.appendChild(canvas);

            await page.render({
              canvasContext: context,
              viewport,
              transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
            }).promise;
          }
        } catch (renderError) {
          console.error('Report preview failed:', renderError);
          if (!cancelled) setError('The visual preview could not be drawn. You can still save the report below.');
        }
      };

      void renderPdf();
      return () => {
        cancelled = true;
      };
    }, [bytes]);

    return (
      <div ref={ref} className="relative min-h-0 flex-1 overflow-auto rounded border-2 border-border bg-muted p-3">
        {error ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{error}</p>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" aria-hidden="true">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="relative z-10 space-y-3" />
      </div>
    );
  },
);

PdfReportPreview.displayName = 'PdfReportPreview';