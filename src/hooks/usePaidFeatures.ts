import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from './useIsAdmin';
import {
  ensureGuestTrialStart,
  getGuestTrialStart,
  hasActiveSubscription as subscriptionRowsActive,
  trialEndFrom,
  trialGivesAccess,
  trialStatus,
  type TrialStatus,
} from '@/lib/freeTrial';

export interface FreeTrialRecord {
  started_at: string;
  ends_at: string;
}

/** Starts (or reads back) the signed-in person's free month. */
export async function startAccountFreeTrial(): Promise<FreeTrialRecord | null> {
  const guestStart = getGuestTrialStart();
  const { data, error } = await supabase.rpc('start_free_trial', {
    _started_at: guestStart ? guestStart.toISOString() : undefined,
  });
  if (error || !data) return null;
  return data as unknown as FreeTrialRecord;
}

/**
 * Who sees the full analysis (stock names, share counts, broker tools):
 * admins, subscribers, and anyone inside their free month — signed in, or a
 * guest whose free month started in this browser.
 */
export function usePaidFeatures() {
  const { user, session, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const signedIn = !!user && !!session?.access_token;

  const { data: isSubscribed = false, isLoading: subLoading } = useQuery({
    queryKey: ['active-subscription', user?.id, session?.access_token],
    queryFn: async () => {
      if (!user) return false;
      await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id);
      if (error) return false;
      return subscriptionRowsActive(data);
    },
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: accountTrial = null, isLoading: trialLoading } = useQuery({
    queryKey: ['free-trial', user?.id],
    queryFn: async () => {
      await supabase.auth.getSession();
      return startAccountFreeTrial();
    },
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // A guest's free month lives in this browser and starts on their first visit.
  const [guestStart, setGuestStart] = useState<Date | null>(() => getGuestTrialStart());
  useEffect(() => {
    if (!authLoading && !user && !guestStart) setGuestStart(ensureGuestTrialStart());
  }, [authLoading, user, guestStart]);
  const guestTrial: TrialStatus = trialStatus(guestStart ? trialEndFrom(guestStart) : null);

  const trial: TrialStatus = user ? trialStatus(accountTrial?.ends_at ?? null) : guestTrial;
  const isPaid = user ? isAdmin || isSubscribed || trialGivesAccess(trial) : trialGivesAccess(guestTrial);

  return {
    isPaid,
    isAdmin,
    isSubscribed,
    trial,
    isLoading: adminLoading || subLoading || trialLoading,
  };
}
