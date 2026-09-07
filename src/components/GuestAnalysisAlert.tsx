import { useState } from 'react';
import { HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

interface GuestAnalysisAlertProps {
  pages: { url: string }[];
  pdfUrl: string;
}

export function GuestAnalysisAlert({ pages, pdfUrl }: GuestAnalysisAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);

  if (pages.length === 0) return null;

  const nextPage = () => setPage((p) => Math.min(pages.length - 1, p + 1));
  const prevPage = () => setPage((p) => Math.max(0, p - 1));

  return (
    <div className="absolute top-4 right-4 z-[60] w-64 sm:w-80 max-w-[calc(100%-2rem)]">
      <div className="rounded-lg border-[3px] border-primary/60 bg-card/95 backdrop-blur shadow-glow overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          <span className="text-sm font-semibold text-foreground">Guest Analysis Mode</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => {
              setExpanded((v) => {
                const next = !v;
                trackEvent('guest_analysis_alert_toggle', {
                  category: 'ui',
                  label: next ? 'expand' : 'collapse',
                  userId: null,
                });
                return next;
              });
            }}
            aria-label={expanded ? 'Collapse guest info' : 'Expand guest info'}
          >
            {expanded ? (
              <X className="w-4 h-4 text-muted-foreground" />
            ) : (
              <HelpCircle className="w-4 h-4 text-primary" />
            )}
          </Button>
        </div>

        {expanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-border/40">
            <div className="relative pt-3">
              <img
                src={pages[page].url}
                alt={`Guest guide page ${page + 1} of ${pages.length}`}
                className="w-full rounded-md border border-border/60 bg-white object-contain"
                style={{ maxHeight: '45vh' }}
              />
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1 pointer-events-none">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full shadow pointer-events-auto disabled:opacity-30"
                  onClick={prevPage}
                  disabled={page === 0}
                  aria-label="Previous guide page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full shadow pointer-events-auto disabled:opacity-30"
                  onClick={nextPage}
                  disabled={page === pages.length - 1}
                  aria-label="Next guide page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {page + 1} / {pages.length}
              </span>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Download PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
