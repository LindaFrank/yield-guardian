import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentsEnabled() {
  const { data, isLoading } = useQuery({
    queryKey: ['app-settings', 'payments_enabled'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_payments_enabled');
      return !!data;
    },
    staleTime: 60 * 1000,
  });
  return { enabled: !!data, isLoading };
}
