import { forwardRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { canCancel, describeSubscription } from '@/lib/subscriptionStatus';

const fmt = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'the end of the current period';

export const SubscriptionCard = forwardRef<HTMLDivElement>(function SubscriptionCard(_props, ref) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['subscription-rows', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end, updated_at')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const view = describeSubscription(rows);

  const change = async (action: 'cancel' | 'resume') => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('manage-subscription', { body: { action } });
    setBusy(false);
    setConfirmOpen(false);
    if (error || !data?.ok) {
      toast({
        title: action === 'cancel' ? 'Could not cancel' : 'Could not keep your subscription',
        description: 'The payment service could not be reached. Please try again, or email linda@guardianyield.com.',
        variant: 'destructive',
      });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['subscription-rows'] });
    queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
    const until = data.accessUntil ? fmt(new Date(data.accessUntil)) : fmt(null);
    toast(
      action === 'cancel'
        ? { title: 'Subscription canceled', description: `You won't be charged again. Full access continues until ${until}.` }
        : { title: 'Subscription kept', description: `Your subscription will continue on ${until}.` },
    );
  };

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> Subscription
        </CardTitle>
        <CardDescription>Your Yield Guardian plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : view.kind === 'none' ? (
          <p className="text-muted-foreground">You don't have a paid subscription, so there's nothing to cancel.</p>
        ) : view.kind === 'active' ? (
          <>
            <p>
              {view.trialing
                ? `Free month — your first charge of $29.95 is on ${fmt(view.renewsOn)}.`
                : `Subscribed — $29.95/month, next charge on ${fmt(view.renewsOn)}.`}
            </p>
            {canCancel(view) && (
              <Button type="button" variant="destructive" className="w-full" onClick={() => setConfirmOpen(true)} disabled={busy}>
                Cancel subscription
              </Button>
            )}
          </>
        ) : (
          <>
            <p>
              Canceled — you won't be charged again. Full access continues until {fmt(view.accessUntil)}.
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={() => change('resume')} disabled={busy}>
              {busy ? 'Working…' : 'Keep my subscription'}
            </Button>
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {view.kind === 'active' && view.trialing
                ? `You won't be charged. Full access continues until your free month ends on ${fmt(view.renewsOn)}.`
                : `You won't be charged again. Full access continues until ${fmt(view.kind === 'active' ? view.renewsOn : null)}.`}{' '}
              Your saved portfolio is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); change('cancel'); }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? 'Canceling…' : 'Yes, cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
