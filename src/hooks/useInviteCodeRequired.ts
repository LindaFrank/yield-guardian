import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useInviteCodeRequired() {
  const { data, isLoading } = useQuery({
    queryKey: ['app-settings', 'require_invite_code'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('require_invite_code')
        .eq('id', 1)
        .maybeSingle();
      return !!data?.require_invite_code;
    },
    staleTime: 60 * 1000,
  });
  return { required: !!data, isLoading };
}
