import { TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HelpIconToggle } from '@/components/HelpIconToggle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function Header() {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Dividend Tracker</h1>
              <p className="text-xs text-muted-foreground">Portfolio Yield Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HelpIconToggle />
            {user && (
              <>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {profile?.display_name || user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
