import { useState } from 'react';
import { HelpCircle, X, BookOpen, Upload, Save, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import { usePaymentsEnabled } from '@/hooks/usePaymentsEnabled';

export function GuestAnalysisAlert() {
  const [expanded, setExpanded] = useState(false);
  const { enabled: paymentsEnabled } = usePaymentsEnabled();

  const fire = (name: string) => window.dispatchEvent(new CustomEvent(name));

  return (
    <div className="absolute top-4 right-4 z-[60] w-64 sm:w-80 max-w-[calc(100%-2rem)] flex flex-col items-end gap-2">
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
            {paymentsEnabled && (
              <Button
                size="default"
                className="w-full justify-center gap-2 shadow-glow py-3 text-sm"
                onClick={() => fire('yg:open-subscription')}
              >
                <Save className="w-4 h-4" />
                Save my portfolio
              </Button>
            )}
          </div>
        )}
      </div>

      <Button
        variant="default"
        className="h-16 w-16 rounded-full shadow-glow bg-feedback text-feedback-foreground hover:bg-feedback/90 border-2 border-feedback flex flex-col items-center justify-center gap-0.5 p-0"
        onClick={() => {
          trackEvent('feedback_open', { category: 'feedback', userId: null });
          window.dispatchEvent(new CustomEvent('yg:open-demo-feedback'));
        }}
        aria-label="Give feedback"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] leading-none font-medium">Feedback</span>
      </Button>
    </div>
  );
}
