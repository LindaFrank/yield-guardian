import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useInviteCodeRequired() {
  const { data, isLoading } = useQuery({
    queryKey: ['app-settings', 'require_invite_code'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_require_invite_code');
      return !!data;
    },
    staleTime: 60 * 1000,
  });
  return { required: !!data, isLoading };
}
