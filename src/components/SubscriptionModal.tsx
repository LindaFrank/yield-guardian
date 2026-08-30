import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StripeEmbeddedCheckout } from './StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from './PaymentTestModeBanner';
import { useInviteCodeRequired } from '@/hooks/useInviteCodeRequired';
import { Check, Loader2, Shield, TrendingUp, Zap, BarChart3, Bell } from 'lucide-react';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestTickers: string[];
  guestShares: Record<string, number | null>;
}

type Step = 'pricing' | 'auth' | 'checkout';
type AuthMode = 'signup' | 'signin';

const PENDING_PORTFOLIO_KEY = 'pendingGuestPortfolio';

export function savePendingGuestPortfolio(tickers: string[], shares: Record<string, number | null>) {
  try {
    localStorage.setItem(PENDING_PORTFOLIO_KEY, JSON.stringify({ tickers, shares, savedAt: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

export function loadPendingGuestPortfolio(): { tickers: string[]; shares: Record<string, number | null> } | null {
  try {
    const raw = localStorage.getItem(PENDING_PORTFOLIO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.savedAt && Date.now() - parsed.savedAt > 1000 * 60 * 60 * 24) {
      localStorage.removeItem(PENDING_PORTFOLIO_KEY);
      return null;
    }
    return { tickers: parsed.tickers || [], shares: parsed.shares || {} };
  } catch {
    return null;
  }
}

export function clearPendingGuestPortfolio() {
  try {
    localStorage.removeItem(PENDING_PORTFOLIO_KEY);
  } catch {
    // ignore
  }
}

export function SubscriptionModal({ open, onOpenChange, guestTickers, guestShares }: SubscriptionModalProps) {
  const [step, setStep] = useState<Step>('pricing');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const { toast } = useToast();
  const { required: inviteRequired } = useInviteCodeRequired();

  const reset = () => {
    setStep('pricing');
    setAuthMode('signup');
    setName('');
    setEmail('');
    setPassword('');
    setInviteCode('');
    setLoading(false);
    setUserId(undefined);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (authMode === 'signup') {
        if (password.length < 8) {
          toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (data.user && name.trim()) {
          await supabase.from('profiles').update({ display_name: name.trim() }).eq('user_id', data.user.id);
        }
        if (data.user) {
          setUserId(data.user.id);
          savePendingGuestPortfolio(guestTickers, guestShares);
          setStep('checkout');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUserId(data.user.id);
          savePendingGuestPortfolio(guestTickers, guestShares);
          setStep('checkout');
        }
      }
    } catch (err: any) {
      toast({ title: authMode === 'signup' ? 'Sign up failed' : 'Sign in failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const features = [
    { icon: BarChart3, label: 'Continuous yield monitoring' },
    { icon: Zap, label: 'Smart replacement suggestions' },
    { icon: TrendingUp, label: 'Track income improvements' },
    { icon: Bell, label: 'New opportunities as markets change' },
    { icon: Shield, label: 'Cancel anytime' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <PaymentTestModeBanner />
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 'pricing' && 'Keep your portfolio working for you'}
            {step === 'auth' && (authMode === 'signup' ? 'Create your account' : 'Sign in to save')}
            {step === 'checkout' && 'Start your subscription'}
          </DialogTitle>
          <DialogDescription>
            {step === 'pricing' && 'Unlock continuous monitoring and improvement for your dividend portfolio.'}
            {step === 'auth' && 'Your analysis is waiting. One more step to save it.'}
            {step === 'checkout' && 'Secure checkout powered by Stripe.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pricing' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card/50 p-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Yield Guardian Monitoring</h3>
                  <p className="text-sm text-muted-foreground">Everything in your analysis, continuously.</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">$29.95</div>
                  <div className="text-sm text-muted-foreground">/ month</div>
                </div>
              </div>
              <ul className="space-y-3">
                {features.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Check className="h-4 w-4 text-yield-positive mr-1" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="w-full shadow-glow" size="lg" onClick={() => setStep('auth')}>
              Start monitoring — $29.95/month
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Test mode: use card 4242 4242 4242 4242, any future expiry, any 3-digit CVC.
            </p>
          </div>
        )}

        {step === 'auth' && (
          <div className="space-y-4">
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as AuthMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Create account</TabsTrigger>
                <TabsTrigger value="signin">I have an account</TabsTrigger>
              </TabsList>
            </Tabs>
            <form onSubmit={handleAuth} className="space-y-3">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="sub-name">Your name</Label>
                  <Input id="sub-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Jane Doe" required={authMode === 'signup'} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="sub-email">Email</Label>
                <Input id="sub-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-password">Password</Label>
                <Input id="sub-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (authMode === 'signup' ? 'Create account & continue' : 'Sign in & continue')}
              </Button>
            </form>
            <Button variant="ghost" className="w-full" onClick={() => setStep('pricing')}>
              Back
            </Button>
          </div>
        )}

        {step === 'checkout' && (
          <div className="space-y-4">
            <StripeEmbeddedCheckout
              priceId="yield_guardian_monthly"
              quantity={1}
              customerEmail={email}
              userId={userId}
              returnUrl={`${window.location.origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
