import { useState } from 'react';
import { TrendingUp, LogOut, User, ShieldCheck, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { usePaymentsEnabled } from '@/hooks/usePaymentsEnabled';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

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
import { GuestAnalysisAlert } from '@/components/GuestAnalysisAlert';

interface HeaderProps {
  onGuestReset?: () => void;
}

export function Header({ onGuestReset }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
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
        <div className="container mx-auto px-6 py-5 relative">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div aria-hidden="true" />

            <div className="flex flex-col items-center">
              <div className="p-2 rounded-lg bg-primary/10 mb-1">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-semibold text-[31px]"><span className="text-foreground">Yield</span> <span className="text-primary">Guardian</span></h1>
              <div className="flex items-center gap-1 my-2 w-full">
                <span className="text-muted-foreground text-[16px] leading-none">◂</span>
                <div className="h-[5px] flex-1 bg-muted-foreground" />
                <span className="text-muted-foreground text-[14px] leading-none font-mono">//</span>
                <div className="h-[5px] flex-1 bg-muted-foreground" />
                <span className="text-muted-foreground text-[16px] leading-none">▸</span>
              </div>
              <p className="text-[14px] text-muted-foreground">Portfolio Yield Analysis</p>
            </div>

            <div className="flex items-center justify-end">
              {user && (
                <div className="flex items-center gap-3 ml-[100px]">
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')} title="Admin console" className="gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  )}
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
                    title="Edit profile"
                  >
                    <User className="w-3.5 h-3.5" />
                    {profile?.display_name || user.email}
                  </button>
                  <Button variant="outline" size="sm" onClick={handleSignOut} title="Sign out" className="border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary gap-1.5">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log out</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-6 -mx-[1px] w-[calc(100%+2px)]">
            <span className="text-muted-foreground text-[16px] leading-none">◂</span>
            <div className="h-[6px] flex-1 bg-muted-foreground" />
            <span className="text-muted-foreground text-[14px] leading-none font-mono">//</span>
            <div className="h-[6px] flex-1 bg-muted-foreground" />
            <span className="text-muted-foreground text-[16px] leading-none">▸</span>
          </div>

          {!user && (
            <GuestAnalysisAlert onReset={onGuestReset} />
          )}

          {!user && (
            <Button
              size="default"
              className="absolute top-4 left-4 z-[55] gap-2 bg-[#147a8a] hover:bg-[#1a8fa3] text-white border-[5px] border-amber-600 shadow-glow px-[43px] text-[18px] font-semibold h-[67px] min-h-[67px] rounded-lg"
              onClick={() => {
                trackEvent('save_portfolio_header_click', { category: 'conversion', userId: null });
                window.dispatchEvent(new CustomEvent('yg:open-subscription'));
              }}
            >
              <Save className="w-4 h-4" />
              Save my portfolio
            </Button>
          )}
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
