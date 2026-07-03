import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  return { isAdmin, isLoading };
}
