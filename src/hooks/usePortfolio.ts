import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStockEntry {
  ticker: string;
  shares_owned: number | null;
}

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

export function useUserStocksWithShares() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stocks-shares', user?.id],
    queryFn: async (): Promise<UserStockEntry[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_stocks')
        .select('ticker, shares_owned')
        .eq('user_id', user.id)
        .order('added_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddTicker() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticker, shares }: { ticker: string; shares?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_stocks')
        .insert({ user_id: user.id, ticker, shares_owned: shares ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-stocks'] });
      qc.invalidateQueries({ queryKey: ['user-stocks-shares'] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-stocks'] });
      qc.invalidateQueries({ queryKey: ['user-stocks-shares'] });
    },
  });
}

export function useUpdateShares() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticker, shares }: { ticker: string; shares: number | null }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_stocks')
        .update({ shares_owned: shares })
        .eq('user_id', user.id)
        .eq('ticker', ticker);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-stocks-shares'] });
    },
  });
}
