import { useState } from 'react';
import { TrendingUp, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HelpIconToggle } from '@/components/HelpIconToggle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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

  const handleSignOut = () => {
    setShowLogoutDialog(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutDialog(false);
    await signOut();
  };

  return (
    <>
      <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">Yield Guardian</h1>
                <div className="flex items-center gap-1 my-0.5">
                  <span className="text-muted-foreground/70 text-[10px] leading-none">◂</span>
                  <div className="h-[2px] w-10 bg-muted-foreground/40" />
                  <span className="text-muted-foreground/50 text-[10px] leading-none font-mono">//</span>
                  <div className="h-[2px] w-10 bg-muted-foreground/40" />
                  <span className="text-muted-foreground/70 text-[10px] leading-none">▸</span>
                </div>
                <p className="text-xs text-muted-foreground">Portfolio Yield Analysis</p>
              </div>
            </div>
            <div className="flex items-center">
              <HelpIconToggle />
              {user && (
                <div className="flex items-center gap-3 ml-[100px]">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
                    title="Edit profile"
                  >
                    <User className="w-3.5 h-3.5" />
                    {profile?.display_name || user.email}
                  </button>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-3">
            <span className="text-muted-foreground/60 text-[10px] leading-none">◂</span>
            <div className="h-[2px] w-[44%] bg-muted-foreground/40" />
            <span className="text-muted-foreground/50 text-[10px] leading-none font-mono">//</span>
            <div className="h-[2px] w-[44%] bg-muted-foreground/40" />
            <span className="text-muted-foreground/60 text-[10px] leading-none">▸</span>
          </div>
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hold on!</AlertDialogTitle>
            <AlertDialogDescription>
              We want you to leave satisfied! {' '}
              <a href="/contact" className="text-primary hover:underline">Share what's missing</a> and we'll work on it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSignOut}>Yes, sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
