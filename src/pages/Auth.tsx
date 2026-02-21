import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ArrowRight, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const APP_PASSWORD = 'dividend-tracker-auto-2024';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const adminKey = searchParams.get('key');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(!!adminKey);
  const { toast } = useToast();

  useEffect(() => {
    if (!adminKey) return;
    
    const autoLogin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-login', {
          body: { key: adminKey },
        });

        if (error || !data?.access_token) {
          console.error('Admin login failed:', error);
          setAutoLogging(false);
          return;
        }

        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      } catch (err) {
        console.error('Auto-login error:', err);
        setAutoLogging(false);
      }
    };

    autoLogin();
  }, [adminKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    try {
      // Try signing in first (returning user)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: APP_PASSWORD,
      });

      if (signInError) {
        // New user — sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: APP_PASSWORD,
        });

        if (signUpError) {
          // Existing user with different password — reset and retry
          if (signUpError.message.includes('already registered')) {
            const { error: resetError } = await supabase.functions.invoke('reset-password', {
              body: { email, password: APP_PASSWORD },
            });

            if (resetError) {
              toast({
                title: 'Error',
                description: 'Unable to sign in. Please try again.',
                variant: 'destructive',
              });
              setLoading(false);
              return;
            }

            // Retry sign-in after password reset
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: APP_PASSWORD,
            });

            if (retryError) {
              toast({
                title: 'Error',
                description: 'Unable to sign in. Please try again.',
                variant: 'destructive',
              });
              setLoading(false);
              return;
            }
          } else {
            toast({
              title: 'Error',
              description: signUpError.message,
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
        }
      }

      // Update display_name in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ display_name: name.trim() })
          .eq('user_id', user.id);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };
  if (autoLogging) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Dividend Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your name and email to get started
            </p>
          </div>
        </div>

        <div className="gradient-card rounded-xl border border-border/50 shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Your name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
            </div>
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
                maxLength={255}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Get started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No password needed — just enter your info to continue.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
