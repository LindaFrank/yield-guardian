import { useState } from 'react';
import { HelpCircle, X, BookOpen, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

export function GuestAnalysisAlert() {
  const [expanded, setExpanded] = useState(false);

  const fire = (name: string) => window.dispatchEvent(new CustomEvent(name));

  return (
    <div className="absolute top-4 right-4 z-[60] w-64 sm:w-80 max-w-[calc(100%-2rem)] flex flex-col items-center gap-4">
      <div className="w-full rounded-xl border-[3px] border-primary/60 bg-card/95 backdrop-blur shadow-glow overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 gap-2 bg-primary/10 border-b border-primary/20">
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
          <div className="px-3 pb-3 pt-3 space-y-3 border-t border-border/40">
            <p className="text-xs text-primary/90 leading-snug">
              Nothing is saved when you leave. Take a quick walkthrough:
            </p>
            <Button
              size="sm"
              className="w-full justify-start gap-2 shadow-glow"
              onClick={() => {
                trackEvent('quick_start_create_open', {
                  category: 'guide',
                  label: 'Guest alert — Create Portfolio',
                  userId: null,
                });
                fire('yg:open-quick-start-create');
              }}
            >
              <BookOpen className="w-4 h-4" />
              Quick Start_Create Portfolio
            </Button>
            <Button
              size="sm"
              className="w-full justify-start gap-2 shadow-glow"
              onClick={() => {
                trackEvent('quick_start_import_open', {
                  category: 'guide',
                  label: 'Guest alert — Import your own portfolio',
                  userId: null,
                });
                fire('yg:open-quick-start-import');
              }}
            >
              <Upload className="w-4 h-4" />
              Quick Start_Import your own portfolio
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="default"
        className="rounded-full p-0 flex items-center justify-center text-white font-semibold hover:opacity-90"
        style={{
          width: '90px',
          height: '90px',
          backgroundColor: '#147D72',
          border: '5px solid #F4B942',
          boxShadow: 'none',
        }}
        onClick={() => {
          trackEvent('feedback_open', { category: 'feedback', userId: null });
          window.dispatchEvent(new CustomEvent('yg:open-demo-feedback'));
        }}
        aria-label="Give feedback"
      >
        Feedback
      </Button>
    </div>
  );
}
