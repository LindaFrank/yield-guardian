import { useState } from 'react';
import { HelpCircle, X, BookOpen, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

interface GuestAnalysisAlertProps {
  onReset?: () => void;
}

export function GuestAnalysisAlert({ onReset }: GuestAnalysisAlertProps) {
  const [expanded, setExpanded] = useState(false);

  const fire = (name: string) => window.dispatchEvent(new CustomEvent(name));

  return (
    <div className="absolute top-4 right-4 z-[60] w-64 sm:w-80 max-w-[calc(100%-2rem)] flex flex-col items-center gap-4">
      <div className="w-full rounded-xl border-[3px] border-primary/60 bg-card/95 backdrop-blur shadow-glow overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 gap-2 bg-primary/10 border-b border-primary/20">
            <span className="text-sm font-semibold text-foreground">Guest Analysis Mode</span>
            <Button
            variant="ghost"
            className="h-auto w-auto min-w-[76px] shrink-0 flex-col items-center gap-0.5 px-2 py-1 border-0"
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
              <>
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-amber-500 font-medium leading-none">Click here.</span>
              </>
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
            <div className="pt-2 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                Want to start fresh? Clear your temporary demo portfolio.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-2 border-[3px] border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                onClick={() => {
                  trackEvent('guest_reset_click', { category: 'guest', label: 'reset button', userId: null });
                  onReset?.();
                  setExpanded(false);
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="default"
        className="w-[88px] h-[88px] min-w-[88px] min-h-[88px] max-w-[88px] max-h-[88px] aspect-square rounded-full p-0 flex items-center justify-center bg-[#147a8a] hover:bg-[#1a8fa3] text-white border-[5px] border-amber-600 text-[14px] font-semibold"
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
