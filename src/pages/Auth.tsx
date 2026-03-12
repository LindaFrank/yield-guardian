import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ArrowRight, Loader2, BarChart3, Shield, Zap } from 'lucide-react';
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
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Splash → form transition
  useEffect(() => {
    if (!adminKey) {
      const timer = setTimeout(() => setShowForm(true), 2800);
      return () => clearTimeout(timer);
    }
  }, [adminKey]);

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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: APP_PASSWORD,
      });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: APP_PASSWORD,
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            const { error: resetError } = await supabase.functions.invoke('reset-password', {
              body: { email, password: APP_PASSWORD },
            });

            if (resetError) {
              toast({ title: 'Error', description: 'Unable to sign in. Please try again.', variant: 'destructive' });
              setLoading(false);
              return;
            }

            const { error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: APP_PASSWORD,
            });

            if (retryError) {
              toast({ title: 'Error', description: 'Unable to sign in. Please try again.', variant: 'destructive' });
              setLoading(false);
              return;
            }
          } else {
            toast({ title: 'Error', description: signUpError.message, variant: 'destructive' });
            setLoading(false);
            return;
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ display_name: name.trim() })
          .eq('user_id', user.id);
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Gradient glow orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)' }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Splash content */}
        <div className={`flex flex-col items-center transition-all duration-1000 ease-out ${showForm ? 'mb-6 scale-90' : 'mb-0'}`}>
          {/* Logo mark */}
          <div className={`relative mb-6 transition-all duration-1000 ${showForm ? 'scale-75' : 'scale-100'}`}>
            <div className="absolute inset-0 rounded-2xl shadow-glow animate-pulse-slow" />
            <div className="relative p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2 animate-fade-in">
            <span className="text-foreground">Yield</span>{' '}
            <span className="text-primary">Guardian</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base tracking-widest uppercase font-medium animate-fade-in"
            style={{ animationDelay: '200ms' }}>
            Portfolio Yield Intelligence
          </p>

          {/* Feature pills */}
          <div className={`flex flex-wrap justify-center gap-3 mt-6 transition-all duration-700 ${showForm ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            {[
              { icon: BarChart3, label: 'Live Yield Analysis' },
              { icon: Shield, label: 'Underperformer Detection' },
              { icon: Zap, label: 'Smart Replacements' },
            ].map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm text-muted-foreground animate-fade-in"
                style={{ animationDelay: `${600 + i * 150}ms` }}
              >
                <Icon className="w-3.5 h-3.5 text-primary" />
                {label}
              </div>
            ))}
          </div>

          {/* Animated ticker line */}
          <div className={`mt-8 flex items-center gap-4 font-mono text-xs text-muted-foreground transition-all duration-700 ${showForm ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            <span className="animate-fade-in" style={{ animationDelay: '1000ms' }}>
              <span className="text-yield-positive">▲ JNJ 3.12%</span>
            </span>
            <span className="text-border">|</span>
            <span className="animate-fade-in" style={{ animationDelay: '1100ms' }}>
              <span className="text-yield-positive">▲ KO 2.94%</span>
            </span>
            <span className="text-border">|</span>
            <span className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
              <span className="text-yield-warning">▼ T 6.78%</span>
            </span>
            <span className="text-border">|</span>
            <span className="animate-fade-in" style={{ animationDelay: '1300ms' }}>
              <span className="text-yield-positive">▲ XOM 3.45%</span>
            </span>
          </div>
        </div>

        {/* Login form — slides in */}
        <div className={`w-full max-w-sm transition-all duration-700 ease-out ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
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
    </div>
  );
}
