import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
      toast({
        title: 'Check your inbox',
        description: `We sent a magic link to ${email}`,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Dividend Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to manage your portfolio
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="gradient-card rounded-xl border border-border/50 shadow-card p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-medium">Magic link sent!</h2>
              <p className="text-sm text-muted-foreground">
                Check <span className="text-foreground font-medium">{email}</span> for a sign-in link.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSent(false)}
                className="mt-2"
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send magic link
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                No password needed — we'll email you a sign-in link.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
