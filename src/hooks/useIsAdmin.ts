import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user, session } = useAuth();
  const token = session?.access_token;
  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['is-admin', user?.id, token],
    queryFn: async () => {
      if (!user) return false;
      // Ensure the client actually has the session attached before querying —
      // otherwise the request goes out as anon and RLS returns 0 rows.
      await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user && !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { isAdmin, isLoading };
}
