import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserTickers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stocks', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_stocks')
        .select('ticker')
        .eq('user_id', user.id)
        .order('added_at', { ascending: true });
      if (error) throw error;
      return data.map((r) => r.ticker);
    },
    enabled: !!user,
  });
}

export function useAddTicker() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (ticker: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_stocks')
        .insert({ user_id: user.id, ticker });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-stocks'] }),
  });
}

export function useAddTickerWithCostBasis() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticker,
      purchasePrice,
      sharesOwned,
    }: {
      ticker: string;
      purchasePrice?: number;
      sharesOwned?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_stocks')
        .insert({
          user_id: user.id,
          ticker,
          purchase_price: purchasePrice ?? null,
          shares_owned: sharesOwned ?? null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-stocks'] }),
  });
}

export function useRemoveTicker() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (ticker: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_stocks')
        .delete()
        .eq('user_id', user.id)
        .eq('ticker', ticker);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-stocks'] }),
  });
}
