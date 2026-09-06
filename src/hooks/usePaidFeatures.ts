import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from './useIsAdmin';

/**
 * Returns whether the current user is entitled to paid-only details.
 * true for authenticated admins or users with an active/trialing subscription.
 * false for guests and authenticated users without a subscription.
 */
export function usePaidFeatures() {
  const { user, session } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: hasActiveSubscription = false, isLoading: subLoading } = useQuery({
    queryKey: ['active-subscription', user?.id, session?.access_token],
    queryFn: async () => {
      if (!user) return false;
      await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id);

      if (error || !data || data.length === 0) return false;

      const now = new Date().toISOString();
      return data.some((sub) => {
        if (sub.status === 'active' || sub.status === 'trialing') {
          return !sub.current_period_end || sub.current_period_end > now;
        }
        if (sub.status === 'canceled') {
          return !!sub.current_period_end && sub.current_period_end > now && !sub.cancel_at_period_end;
        }
        return false;
      });
    },
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    isPaid: !!user && (isAdmin || hasActiveSubscription),
    isLoading: adminLoading || subLoading,
  };
}
