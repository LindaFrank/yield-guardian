import { forwardRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TermsAgreementCheckbox } from '@/components/TermsAgreementCheckbox';
import { acceptanceSupersedes, termsVersion } from '@/content/termsContent';
import { hasAgreedToVersion } from '@/lib/subscriptionStatus';

/**
 * Signed-in members must agree to the current Terms version to keep using the app.
 * Someone who ticked the boxes for this version at sign-up is recorded silently.
 */
export const TermsUpdateGate = forwardRef<HTMLDivElement>(function TermsUpdateGate(_props, ref) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: agreed, isLoading, isError } = useQuery({
    queryKey: ['terms-acceptance', user?.id, termsVersion],
    queryFn: async () => {
      const { data, error } = await supabase.from('terms_acceptances').select('terms_version').eq('user_id', user!.id);
      if (error) throw error;
      return hasAgreedToVersion(data.map((r) => r.terms_version), termsVersion);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const agreedAtSignup = user?.user_metadata?.terms_version === termsVersion;

  // Agreed on the sign-up form for this same version → just record it.
  useEffect(() => {
    if (!user || isLoading || agreed !== false || !agreedAtSignup) return;
    supabase.rpc('accept_terms', { p_version: termsVersion }).then(({ error }) => {
      if (!error) queryClient.invalidateQueries({ queryKey: ['terms-acceptance'] });
    });
  }, [user, isLoading, agreed, agreedAtSignup, queryClient]);

  // Fail open on a lookup error so a brief outage never locks people out.
  const open = !!user && !isLoading && !isError && agreed === false && !agreedAtSignup;
  if (!open) return null;

  const accept = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('accept_terms', { p_version: termsVersion });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['terms-acceptance'] });
  };

  const leave = async () => {
    await signOut();
  };

  return (
    <Dialog open>
      <DialogContent
        ref={ref}
        hideClose
        className="max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Our Terms have been updated</DialogTitle>
          <DialogDescription className="leading-relaxed">{acceptanceSupersedes}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          What's new: a free month and subscription section, a Cancel subscription button on your Profile page, and how
          we may contact you at your account email.
        </p>
        <TermsAgreementCheckbox
          termsChecked={terms}
          privacyChecked={privacy}
          onTermsChange={setTerms}
          onPrivacyChange={setPrivacy}
          termsId="terms-update-agreement"
          privacyId="privacy-update-agreement"
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={leave} disabled={saving}>Log out</Button>
          <Button onClick={accept} disabled={!terms || !privacy || saving}>
            {saving ? 'Saving…' : 'Agree and continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
