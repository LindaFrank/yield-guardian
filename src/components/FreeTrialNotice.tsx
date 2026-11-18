import { forwardRef } from 'react';
import { Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePaidFeatures } from '@/hooks/usePaidFeatures';
import { formatTrialEnd, trialEndingMessage } from '@/lib/freeTrial';
import { trackEvent } from '@/lib/analytics';

/** Free-month status line: quiet while it runs, prominent in the last few days and after it ends. */
export const FreeTrialNotice = forwardRef<HTMLDivElement, { isGuest: boolean }>(({ isGuest }, ref) => {
  const { trial, isAdmin, isSubscribed, isLoading } = usePaidFeatures();
  if (isLoading || isAdmin || isSubscribed || trial.state === 'none' || !trial.endsAt) return null;

  const open = () => {
    trackEvent('free_trial_notice_click', { category: 'conversion', label: trial.state });
    window.dispatchEvent(new CustomEvent('yg:open-subscription'));
  };

  const urgent = trial.state === 'ending-soon' || trial.state === 'ended';
  let text: string;
  let action: string;
  if (trial.state === 'active') {
    text = isGuest
      ? `Free month — full access until ${formatTrialEnd(trial.endsAt)}. Save your portfolio to keep it.`
      : `Free month — full access until ${formatTrialEnd(trial.endsAt)}.`;
    action = isGuest ? 'Save my portfolio' : 'Subscribe';
  } else if (trial.state === 'ending-soon') {
    text = isGuest
      ? `${trialEndingMessage(trial)} — save your portfolio and subscribe to keep full access.`
      : `${trialEndingMessage(trial)} — subscribe to keep full access to your portfolio's analysis.`;
    action = isGuest ? 'Save my portfolio' : 'Subscribe';
  } else {
    text = 'Your free month has ended. Subscribe to see stock names, share counts and the broker tools again.';
    action = 'Subscribe';
  }

  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        'mb-4 mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg px-3 py-2 text-sm',
        urgent
          ? 'border-[3px] border-[hsl(var(--yield-warning))] bg-yield-warning text-foreground'
          : 'border-[3px] border-primary/40 bg-primary/5 text-foreground/90',
      )}
    >
      <span className="flex items-center gap-2 flex-1">
        {urgent ? <Clock className="w-4 h-4 text-yield-warning shrink-0" /> : <Gift className="w-4 h-4 text-primary shrink-0" />}
        {text}
      </span>
      <Button size="sm" variant={urgent ? 'default' : 'outline'} className="h-7 text-xs self-start sm:self-auto" onClick={open}>
        {action}
      </Button>
    </div>
  );
});
FreeTrialNotice.displayName = 'FreeTrialNotice';
